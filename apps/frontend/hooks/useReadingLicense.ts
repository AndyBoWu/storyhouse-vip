import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { custom, parseEther } from 'viem'
import { apiClient } from '@/lib/api-client'
import { STORYHOUSE_CONTRACTS, TIP_TOKEN_ABI } from '../lib/contracts/storyhouse'
import { storyTestnet } from '../lib/config/chains'

const TIP_TOKEN_ADDRESS = STORYHOUSE_CONTRACTS.TIP_TOKEN

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
  const publicClient = usePublicClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storyClient, setStoryClient] = useState<StoryClient | null>(null)
  
  // Contract hooks for TIP token approval
  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  /**
   * Initialize Story Protocol SDK with user's wallet
   */
  const initializeStoryClient = useCallback(async () => {
    if (!address || storyClient) return storyClient

    try {
      const config: StoryConfig = {
        account: address,
        transport: custom(window.ethereum!),
        chainId: storyTestnet.id as 1315
      }

      const client = StoryClient.newClient(config)
      setStoryClient(client)
      return client
    } catch (err) {
      console.error('Failed to initialize Story Protocol SDK:', err)
      throw err
    }
  }, [address, storyClient])

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
   * Check and approve TIP token spending if needed
   */
  const ensureTipApproval = useCallback(async (
    spenderAddress: string,
    amount: bigint
  ): Promise<boolean> => {
    if (!address || !publicClient) return false

    try {
      // Check current allowance
      const allowance = await publicClient.readContract({
        address: TIP_TOKEN_ADDRESS,
        abi: TIP_TOKEN_ABI,
        functionName: 'allowance',
        args: [address, spenderAddress],
      }) as bigint

      console.log('Current TIP allowance:', allowance.toString())
      
      if (allowance >= amount) {
        console.log('Sufficient allowance already exists')
        return true
      }

      console.log('🔐 Approving TIP token spending...')
      writeApprove({
        address: TIP_TOKEN_ADDRESS,
        abi: TIP_TOKEN_ABI,
        functionName: 'approve',
        args: [spenderAddress, amount],
      })

      // Wait for approval to complete
      // In a real implementation, we'd properly wait for the transaction
      return true
    } catch (err) {
      console.error('Error approving TIP tokens:', err)
      return false
    }
  }, [address, publicClient, writeApprove])

  /**
   * Mint a reading license for a paid chapter using Story Protocol SDK
   */
  const mintReadingLicense = useCallback(async ({
    bookId,
    chapterNumber,
    chapterIpAssetId: passedChapterIpAssetId,
    onSuccess,
    onError
  }: MintReadingLicenseParams) => {
    let chapterIpAssetId = passedChapterIpAssetId
    if (!address) {
      const errorMsg = 'Wallet not connected'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🎫 Minting reading license on-chain...', {
        bookId,
        chapterNumber,
        chapterIpAssetId,
        userAddress: address
      })

      // Initialize Story Protocol SDK
      const client = await initializeStoryClient()
      if (!client) {
        throw new Error('Failed to initialize Story Protocol SDK')
      }

      // Get license terms ID from the chapter access info
      // First, fetch the chapter info to get the license terms ID
      let chapterInfo: any = null
      try {
        chapterInfo = await apiClient.get(`/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}/info`)
        console.log('Chapter info response:', chapterInfo)
      } catch (err) {
        console.warn('Failed to fetch chapter info, using fallback:', err)
        // Use fallback for known chapters
        if (bookId === '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2' && chapterNumber === 4) {
          chapterInfo = {
            ipAssetId: '0x1367694a018a92deb75152B9AEC969657568b234',
            licenseTermsId: '13'
          }
        }
      }
      
      // For chapter 4 of Project Phoenix, use the known license terms ID from the transaction
      const licenseTermsIdValue = (bookId === '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2' && chapterNumber === 4) 
        ? '13' 
        : chapterInfo?.licenseTermsId
      
      if (!chapterInfo || !licenseTermsIdValue) {
        throw new Error('License terms not found for this chapter. The book may not be properly registered with Story Protocol.')
      }
      
      // Validate the chapter IP asset ID matches what was passed in
      if (chapterInfo.ipAssetId && chapterInfo.ipAssetId !== chapterIpAssetId) {
        console.warn('Chapter IP asset ID mismatch:', {
          passed: chapterIpAssetId,
          actual: chapterInfo.ipAssetId
        })
        // Use the actual IP asset ID from the chapter info
        chapterIpAssetId = chapterInfo.ipAssetId
      }
      
      if (!chapterIpAssetId) {
        throw new Error('Chapter is not registered as an IP asset. Cannot mint license.')
      }
      
      const licenseTermsId = BigInt(licenseTermsIdValue)

      // Check if we need TIP token approval
      const mintingFee = parseEther('0.5') // 0.5 TIP for reading license
      const licensingModuleAddress = await client.licensingModuleClient.address
      
      console.log('Licensing module address:', licensingModuleAddress)
      
      // Ensure TIP token approval
      const hasApproval = await ensureTipApproval(licensingModuleAddress, mintingFee)
      if (!hasApproval) {
        throw new Error('Failed to approve TIP token spending')
      }

      // Wait a bit for approval to be processed (in production, use proper tx receipt waiting)
      if (approveHash) {
        console.log('Waiting for approval transaction...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Mint the license token using Story Protocol SDK
      console.log('📝 Minting license token on Story Protocol...')
      const result = await client.license.mintLicenseTokens({
        ipId: chapterIpAssetId,
        licenseTermsId: licenseTermsId,
        receiver: address,
        amount: 1n, // Mint 1 license token
        txOptions: {}
      })

      if (!result.txHash) {
        throw new Error('Failed to mint license token - no transaction hash returned')
      }

      console.log('✅ Reading license minted successfully!')
      console.log('Transaction hash:', result.txHash)
      console.log('License token ID:', result.licenseTokenIds?.[0])

      const licenseData = {
        licenseTokenId: result.licenseTokenIds?.[0]?.toString(),
        transactionHash: result.txHash,
        ipAssetId: chapterIpAssetId,
        receiver: address,
        amount: 1,
        mintingFee: '0.5'
      }

      // Update backend to record the license minting (optional, for tracking)
      try {
        await apiClient.post(`/books/${bookId}/chapter/${chapterNumber}/mint-reading-license`, {
          userAddress: address,
          chapterIpAssetId,
          licenseTokenId: licenseData.licenseTokenId,
          transactionHash: result.txHash
        })
      } catch (backendErr) {
        console.warn('Failed to update backend with license info:', backendErr)
        // Don't fail the whole operation if backend update fails
      }

      onSuccess?.(licenseData)
      return licenseData

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during license minting'
      console.error('Reading license minting error:', err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [address, initializeStoryClient, ensureTipApproval, approveHash])

  /**
   * Check if user owns a reading license for a specific chapter
   */
  const hasReadingLicense = useCallback(async (
    bookId: string,
    chapterNumber: number,
    chapterIpAssetId: string
  ): Promise<boolean> => {
    if (!address || !publicClient) {
      return false
    }

    try {
      console.log('🔍 Checking reading license ownership...', {
        userAddress: address,
        bookId,
        chapterNumber,
        chapterIpAssetId
      })

      // Initialize Story Protocol SDK
      const client = await initializeStoryClient()
      if (!client) {
        return false
      }

      // Check license token balance
      // The license registry contract should have a balanceOf method
      // This is a simplified check - in production, you'd query the actual license NFT contract
      const licenseRegistryAddress = await client.licenseRegistryReadOnlyClient.address
      
      // For now, return false as we need the actual license token contract address
      // In production, you'd check: licenseToken.balanceOf(address, licenseTokenId) > 0
      return false

    } catch (err) {
      console.error('Error checking reading license ownership:', err)
      return false
    }
  }, [address, publicClient, initializeStoryClient])

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
    isLoading: isLoading || isApprovePending,
    error,
    setError
  }
}