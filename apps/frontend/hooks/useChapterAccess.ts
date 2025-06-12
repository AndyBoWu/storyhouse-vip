import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

interface ChapterAccessInfo {
  bookId: string
  chapterNumber: number
  unlockPrice: number
  isFree: boolean
  canAccess: boolean
  alreadyUnlocked: boolean
}

interface UnlockChapterParams {
  bookId: string
  chapterNumber: number
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useChapterAccess() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Check if user can access a chapter and get pricing info
   */
  const checkChapterAccess = useCallback(async (
    bookId: string, 
    chapterNumber: number
  ): Promise<ChapterAccessInfo | null> => {
    try {
      const params = new URLSearchParams()
      if (address) {
        params.append('userAddress', address)
      }

      const response = await fetch(
        `/api/books/${bookId}/chapter/${chapterNumber}/unlock?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check chapter access')
      }

      return data.data as ChapterAccessInfo
    } catch (err) {
      console.error('Error checking chapter access:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [address])

  /**
   * Unlock a chapter (handles both free and paid chapters)
   */
  const unlockChapter = useCallback(async ({
    bookId,
    chapterNumber,
    onSuccess,
    onError
  }: UnlockChapterParams) => {
    if (!address) {
      const errorMsg = 'Wallet not connected'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First check if chapter is free (chapters 1-3)
      const accessInfo = await checkChapterAccess(bookId, chapterNumber)
      if (!accessInfo) {
        throw new Error('Could not check chapter access')
      }

      // For free chapters, unlock immediately
      if (accessInfo.isFree) {
        const response = await fetch(
          `/api/books/${bookId}/chapter/${chapterNumber}/unlock`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAddress: address,
              readingSessionId: `session-${Date.now()}`
            })
          }
        )

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to unlock free chapter')
        }

        onSuccess?.(data.data)
        return data.data
      }

      // For paid chapters (4+), need blockchain transaction
      console.log('🔗 Paid chapter requires blockchain transaction:', {
        bookId,
        chapterNumber,
        unlockPrice: accessInfo.unlockPrice
      })

      // TODO: Implement Web3 transaction for paid chapters
      // This would involve:
      // 1. Call ChapterAccessController.unlockChapter() with proper TIP payment
      // 2. Wait for transaction confirmation
      // 3. Call API with transaction hash

      // For now, show error that blockchain integration is needed
      throw new Error('Blockchain integration for paid chapters not yet implemented. This will require TIP token payment via smart contract.')

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during chapter unlock'
      console.error('Chapter unlock error:', err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [address, checkChapterAccess])

  /**
   * Check if chapters 1-3 are free for any book
   */
  const getFreeChapterInfo = useCallback(() => {
    return {
      freeChapterCount: 3,
      freeChapterNumbers: [1, 2, 3],
      paidChapterStartsAt: 4,
      paidChapterPrice: 0.5 // TIP tokens
    }
  }, [])

  /**
   * Get pricing information for any chapter
   */
  const getChapterPricing = useCallback((chapterNumber: number) => {
    const isFree = chapterNumber <= 3
    return {
      chapterNumber,
      isFree,
      unlockPrice: isFree ? 0 : 0.5,
      currency: 'TIP',
      readReward: isFree ? 0.05 : 0 // Only free chapters have reading rewards
    }
  }, [])

  return {
    checkChapterAccess,
    unlockChapter,
    getFreeChapterInfo,
    getChapterPricing,
    isLoading,
    error,
    setError
  }
}