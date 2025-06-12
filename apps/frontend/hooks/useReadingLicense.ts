import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { apiClient } from '@/lib/api-client'

interface MintReadingLicenseParams {
  bookId: string
  chapterNumber: number
  chapterIpAssetId: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

interface ReadingLicenseInfo {
  bookId: string
  chapterNumber: number
  isFree: boolean
  mintingFee: string
  currency: string
  transferable: boolean
  licenseType: string
  description: string
}

export function useReadingLicense() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get reading license information for a chapter
   */
  const getReadingLicenseInfo = useCallback(async (
    bookId: string, 
    chapterNumber: number
  ): Promise<ReadingLicenseInfo | null> => {
    try {
      const params = new URLSearchParams()
      if (address) {
        params.append('userAddress', address)
      }

      const data = await apiClient.get(`/books/${bookId}/chapter/${chapterNumber}/mint-reading-license?${params}`)
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get reading license info')
      }

      return data.data as ReadingLicenseInfo
    } catch (err) {
      console.error('Error getting reading license info:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }, [address])

  /**
   * Mint a reading license for a paid chapter
   */
  const mintReadingLicense = useCallback(async ({
    bookId,
    chapterNumber,
    chapterIpAssetId,
    onSuccess,
    onError
  }: MintReadingLicenseParams) => {
    if (!address) {
      const errorMsg = 'Wallet not connected'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🎫 Minting reading license...', {
        bookId,
        chapterNumber,
        chapterIpAssetId,
        userAddress: address
      })

      const data = await apiClient.post(`/books/${bookId}/chapter/${chapterNumber}/mint-reading-license`, {
        userAddress: address,
        chapterIpAssetId
      })
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to mint reading license')
      }

      console.log('✅ Reading license minted successfully:', data.data)
      onSuccess?.(data.data)
      return data.data

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during license minting'
      console.error('Reading license minting error:', err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  /**
   * Check if user owns a reading license for a specific chapter
   * TODO: Implement blockchain query for license token ownership
   */
  const hasReadingLicense = useCallback(async (
    bookId: string,
    chapterNumber: number,
    chapterIpAssetId: string
  ): Promise<boolean> => {
    if (!address) {
      return false
    }

    try {
      // TODO: Query blockchain for license token ownership
      // For now, check if user has ever minted a license (stored in backend)
      
      console.log('🔍 Checking reading license ownership...', {
        userAddress: address,
        bookId,
        chapterNumber,
        chapterIpAssetId
      })

      // This will be replaced with actual blockchain query
      // using Story Protocol SDK license token ownership check
      return false

    } catch (err) {
      console.error('Error checking reading license ownership:', err)
      return false
    }
  }, [address])

  /**
   * Get reading license pricing for any chapter
   */
  const getReadingLicensePricing = useCallback((chapterNumber: number) => {
    const isFree = chapterNumber <= 3
    return {
      chapterNumber,
      isFree,
      mintingFee: isFree ? '0' : '0.5',
      currency: 'TIP',
      transferable: false,
      licenseType: 'reading',
      description: isFree 
        ? 'Free chapter - no license required'
        : 'Personal reading access - non-transferable'
    }
  }, [])

  return {
    getReadingLicenseInfo,
    mintReadingLicense,
    hasReadingLicense,
    getReadingLicensePricing,
    isLoading,
    error,
    setError
  }
}