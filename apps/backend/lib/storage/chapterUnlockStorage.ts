interface ChapterUnlock {
  userAddress: string
  bookId: string
  chapterNumber: number
  transactionHash?: string
  unlockedAt: number
  isFree: boolean
}

// In-memory storage for chapter unlocks
// TODO: Replace with database (PostgreSQL/MongoDB) in production
class ChapterUnlockStorage {
  private unlocks: Map<string, ChapterUnlock> = new Map()

  /**
   * Generate a unique key for user + book + chapter combination
   */
  private getKey(userAddress: string, bookId: string, chapterNumber: number): string {
    return `${userAddress.toLowerCase()}-${bookId}-${chapterNumber}`
  }

  /**
   * Record a chapter unlock (both free and paid)
   */
  recordUnlock(unlock: Omit<ChapterUnlock, 'unlockedAt'>): void {
    const key = this.getKey(unlock.userAddress, unlock.bookId, unlock.chapterNumber)
    
    this.unlocks.set(key, {
      ...unlock,
      unlockedAt: Date.now()
    })

    console.log('📚 Chapter unlock recorded:', {
      key,
      userAddress: unlock.userAddress,
      bookId: unlock.bookId,
      chapterNumber: unlock.chapterNumber,
      isFree: unlock.isFree,
      transactionHash: unlock.transactionHash
    })
  }

  /**
   * Check if a user has unlocked a specific chapter
   */
  hasUnlocked(userAddress: string, bookId: string, chapterNumber: number): boolean {
    const key = this.getKey(userAddress, bookId, chapterNumber)
    return this.unlocks.has(key)
  }

  /**
   * Get unlock details for a specific chapter
   */
  getUnlock(userAddress: string, bookId: string, chapterNumber: number): ChapterUnlock | null {
    const key = this.getKey(userAddress, bookId, chapterNumber)
    return this.unlocks.get(key) || null
  }

  /**
   * Get all unlocks for a specific user
   */
  getUserUnlocks(userAddress: string): ChapterUnlock[] {
    const userUnlocks: ChapterUnlock[] = []
    const lowerAddress = userAddress.toLowerCase()

    for (const unlock of this.unlocks.values()) {
      if (unlock.userAddress.toLowerCase() === lowerAddress) {
        userUnlocks.push(unlock)
      }
    }

    return userUnlocks.sort((a, b) => b.unlockedAt - a.unlockedAt)
  }

  /**
   * Get all unlocks for a specific book
   */
  getBookUnlocks(bookId: string): ChapterUnlock[] {
    const bookUnlocks: ChapterUnlock[] = []

    for (const unlock of this.unlocks.values()) {
      if (unlock.bookId === bookId) {
        bookUnlocks.push(unlock)
      }
    }

    return bookUnlocks.sort((a, b) => a.chapterNumber - b.chapterNumber)
  }

  /**
   * Remove an unlock (for testing purposes)
   */
  removeUnlock(userAddress: string, bookId: string, chapterNumber: number): boolean {
    const key = this.getKey(userAddress, bookId, chapterNumber)
    return this.unlocks.delete(key)
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const totalUnlocks = this.unlocks.size
    const freeUnlocks = Array.from(this.unlocks.values()).filter(u => u.isFree).length
    const paidUnlocks = totalUnlocks - freeUnlocks

    return {
      totalUnlocks,
      freeUnlocks,
      paidUnlocks,
      uniqueUsers: new Set(Array.from(this.unlocks.values()).map(u => u.userAddress.toLowerCase())).size
    }
  }

  /**
   * Clear all unlocks (for testing)
   */
  clear(): void {
    this.unlocks.clear()
    console.log('🗑️ Chapter unlock storage cleared')
  }
}

// Export singleton instance
export const chapterUnlockStorage = new ChapterUnlockStorage()

// Export types
export type { ChapterUnlock }