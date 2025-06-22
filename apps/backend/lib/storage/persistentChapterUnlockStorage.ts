import fs from 'fs/promises'
import path from 'path'

interface ChapterUnlock {
  userAddress: string
  bookId: string
  chapterNumber: number
  transactionHash?: string
  licenseTokenId?: string
  unlockedAt: number
  isFree: boolean
}

/**
 * File-based persistent storage for chapter unlocks
 * This persists unlock data to disk so it survives server restarts
 */
class PersistentChapterUnlockStorage {
  private storageFile: string
  private unlocks: Map<string, ChapterUnlock> = new Map()
  private saveDebounceTimer: NodeJS.Timeout | null = null

  constructor() {
    // Store in a data directory
    const dataDir = path.join(process.cwd(), 'data')
    this.storageFile = path.join(dataDir, 'chapter-unlocks.json')
    
    // Load existing data on initialization
    this.loadFromDisk().catch(err => {
      console.error('Failed to load chapter unlocks from disk:', err)
    })
  }

  /**
   * Generate a unique key for user + book + chapter combination
   */
  private getKey(userAddress: string, bookId: string, chapterNumber: number): string {
    return `${userAddress.toLowerCase()}-${bookId}-${chapterNumber}`
  }

  /**
   * Load unlock data from disk
   */
  private async loadFromDisk(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storageFile)
      await fs.mkdir(dataDir, { recursive: true })

      // Try to read existing data
      const data = await fs.readFile(this.storageFile, 'utf-8')
      const unlockArray: ChapterUnlock[] = JSON.parse(data)
      
      // Convert array to map
      this.unlocks.clear()
      for (const unlock of unlockArray) {
        const key = this.getKey(unlock.userAddress, unlock.bookId, unlock.chapterNumber)
        this.unlocks.set(key, unlock)
      }
      
      console.log(`📁 Loaded ${this.unlocks.size} chapter unlocks from persistent storage`)
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        console.log('📁 No existing chapter unlock data found, starting fresh')
      } else {
        console.error('Error loading chapter unlocks:', err)
      }
    }
  }

  /**
   * Save unlock data to disk (debounced to avoid excessive writes)
   */
  private async saveToDisk(): Promise<void> {
    // Clear any existing timer
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer)
    }

    // Debounce saves by 1 second
    this.saveDebounceTimer = setTimeout(async () => {
      try {
        // Ensure directory exists
        const dataDir = path.dirname(this.storageFile)
        await fs.mkdir(dataDir, { recursive: true })

        // Convert map to array for JSON storage
        const unlockArray = Array.from(this.unlocks.values())
        
        // Write to a temp file first, then rename for atomic operation
        const tempFile = `${this.storageFile}.tmp`
        await fs.writeFile(tempFile, JSON.stringify(unlockArray, null, 2))
        await fs.rename(tempFile, this.storageFile)
        
        console.log(`💾 Saved ${unlockArray.length} chapter unlocks to persistent storage`)
      } catch (err) {
        console.error('Error saving chapter unlocks:', err)
      }
    }, 1000)
  }

  /**
   * Record a chapter unlock (both free and paid)
   */
  async recordUnlock(unlock: Omit<ChapterUnlock, 'unlockedAt'>): Promise<void> {
    const key = this.getKey(unlock.userAddress, unlock.bookId, unlock.chapterNumber)
    
    const fullUnlock: ChapterUnlock = {
      ...unlock,
      unlockedAt: Date.now()
    }
    
    this.unlocks.set(key, fullUnlock)

    console.log('📚 Chapter unlock recorded (persistent):', {
      key,
      userAddress: unlock.userAddress,
      bookId: unlock.bookId,
      chapterNumber: unlock.chapterNumber,
      isFree: unlock.isFree,
      transactionHash: unlock.transactionHash,
      licenseTokenId: unlock.licenseTokenId
    })

    // Save to disk
    await this.saveToDisk()
  }

  /**
   * Check if a user has unlocked a specific chapter
   */
  hasUnlocked(userAddress: string, bookId: string, chapterNumber: number): boolean {
    const key = this.getKey(userAddress, bookId, chapterNumber)
    const hasIt = this.unlocks.has(key)
    
    if (hasIt) {
      const unlock = this.unlocks.get(key)!
      console.log('🔍 Found persistent unlock record:', {
        userAddress,
        bookId,
        chapterNumber,
        unlockedAt: new Date(unlock.unlockedAt).toISOString(),
        transactionHash: unlock.transactionHash
      })
    }
    
    return hasIt
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
      uniqueUsers: new Set(Array.from(this.unlocks.values()).map(u => u.userAddress.toLowerCase())).size,
      storageFile: this.storageFile
    }
  }

  /**
   * Manually add Bob's test unlocks for debugging
   */
  async addTestUnlocksForBob(): Promise<void> {
    const bobAddress = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70'
    const bookId = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'
    
    // Add unlocks for chapters 4-10
    for (let chapterNum = 4; chapterNum <= 10; chapterNum++) {
      await this.recordUnlock({
        userAddress: bobAddress,
        bookId,
        chapterNumber: chapterNum,
        transactionHash: `0xtest_${chapterNum}_${Date.now()}`,
        isFree: false,
        licenseTokenId: `test_license_${chapterNum}`
      })
    }
    
    console.log('✅ Added test unlocks for Bob (chapters 4-10)')
  }
}

// Export singleton instance
export const persistentChapterUnlockStorage = new PersistentChapterUnlockStorage()

// Export types
export type { ChapterUnlock }