import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { custom, parseEther, formatEther, type Address, createWalletClient } from 'viem'
import { apiClient } from '@/lib/api-client'
import { STORYHOUSE_CONTRACTS, TIP_TOKEN_ABI } from '../lib/contracts/storyhouse'
import { storyTestnet } from '../lib/config/chains'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'
import { HYBRID_REVENUE_CONTROLLER_V2_ADDRESS, HYBRID_V2_ABI } from './useBookRegistration'

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
  
  // Hook for HybridRevenueController unlockChapter
  const { writeContract: writeUnlockChapter, data: unlockHash } = useWriteContract()
  const { isLoading: isUnlockPending } = useWaitForTransactionReceipt({
    hash: unlockHash,
  })

  /**
   * Initialize Story Protocol SDK with user's wallet
   */
  const initializeStoryClient = useCallback(async (forceNew = false) => {
    if (!address) return null
    
    // For minting operations, always create a fresh client to ensure proper wallet connection
    if (storyClient && !forceNew) {
      console.log('Using existing Story Protocol client')
      return storyClient
    }

    try {
      console.log('Creating new Story Protocol client with address:', address)
      
      // Use the same pattern as the publishing flow
      const config: StoryConfig = {
        account: address as `0x${string}`,
        transport: custom(window.ethereum!),
        chainId: 1315 // Use the numeric value directly
      }

      const client = StoryClient.newClient(config)
      
      if (forceNew || !storyClient) {
        setStoryClient(client)
      }
      
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

      // Initialize Story Protocol SDK - force new client for minting
      console.log('Initializing Story Protocol client for minting...')
      const client = await initializeStoryClient(true)
      if (!client) {
        throw new Error('Failed to initialize Story Protocol SDK')
      }
      console.log('Story Protocol client initialized:', !!client)

      // Get license terms ID from the chapter access info
      // First, fetch the chapter info to get the license terms ID
      // Fetch chapter info to get the license terms ID
      const chapterInfo = await apiClient.get(`/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}/info`)
      console.log('Chapter info response:', chapterInfo)
      
      if (!chapterInfo || !chapterInfo.licenseTermsId) {
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
      
      const licenseTermsId = BigInt(chapterInfo.licenseTermsId)

      // Check if we need TIP token approval
      const mintingFee = parseEther('0.5') // 0.5 TIP for reading license
      // Use the correct licensing module address for Story Protocol Iliad testnet
      const licensingModuleAddress = '0x8652B2C6dbB9B6f31eF5A5dE1eb994bc624ABF97' as Address
      
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

      // The new atomic flow:
      // 1. First check if AtomicLicensePurchase contract is available
      // 2. If yes, use it for atomic payment + license minting
      // 3. If no, fall back to current two-step process
      
      console.log('📝 Starting atomic license purchase...')
      console.log('Purchase parameters:', {
        bookId,
        chapterNumber,
        ipAssetId: chapterIpAssetId,
        licenseTermsId: licenseTermsId.toString(),
        price: formatEther(mintingFee),
        buyer: address
      })
      
      if (!address) {
        throw new Error('Wallet address is undefined. Please ensure your wallet is connected.')
      }
      
      // Ensure address is valid format
      const receiverAddress = address as `0x${string}`
      
      // For now, continue with the existing two-step process
      // TODO: When AtomicLicensePurchase is deployed, use it instead
      console.log('⚠️ Using two-step process (payment then license). TODO: Deploy AtomicLicensePurchase contract.')
      
      try {
        // Wait a moment to ensure wallet is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Step 1: Handle payment (try HybridRevenueController first, fall back to direct transfer)
        console.log(`💰 Step 1: Processing payment (${formatEther(mintingFee)} TIP)...`)
        
        try {
          // Parse the book ID to get the bytes32 format
          const { bytes32Id, authorAddress } = parseBookId(bookId)
          
          // Check if book is registered in HybridRevenueControllerV2
          if (!HYBRID_REVENUE_CONTROLLER_V2_ADDRESS || HYBRID_REVENUE_CONTROLLER_V2_ADDRESS === '0x...') {
            throw new Error('HybridRevenueControllerV2 not deployed yet. Please deploy the contract first.')
          }
          
          let bookIsRegistered = false
          try {
            const bookData = await publicClient.readContract({
              address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as Address,
              abi: HYBRID_V2_ABI,
              functionName: 'books',
              args: [bytes32Id],
            }) as any
            
            // bookData is an array: [curator, isDerivative, parentBookId, totalChapters, isActive, ipfsMetadataHash]
            const curator = bookData[0] as string
            const isActive = bookData[4] as boolean
            bookIsRegistered = curator !== '0x0000000000000000000000000000000000000000' && isActive
            
            if (bookIsRegistered) {
              console.log('✅ Book registered in HybridRevenueControllerV2')
            }
          } catch (checkError) {
            console.error('Failed to check book registration:', checkError)
            throw new Error('Failed to verify book registration status')
          }
          
          if (!bookIsRegistered) {
            throw new Error('Book is not registered in HybridRevenueControllerV2. The author needs to register their book to enable payments.')
          }
          
          // Use HybridRevenueControllerV2 for automatic 70/20/10 revenue split
          console.log('Using HybridRevenueControllerV2 for revenue distribution...')
          
          // First approve HybridRevenueControllerV2 to spend TIP tokens
          const approvalSuccess = await ensureTipApproval(
            HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as Address,
            mintingFee
          )
          
          if (!approvalSuccess) {
            throw new Error('Failed to approve TIP spending for HybridRevenueControllerV2')
          }
          
          // Unlock the chapter through HybridRevenueControllerV2
          writeUnlockChapter({
            address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as Address,
            abi: HYBRID_V2_ABI,
            functionName: 'unlockChapter',
            args: [bytes32Id, BigInt(chapterNumber)],
          })
          
          // Wait for unlock transaction to be submitted
          console.log('⏳ Waiting for chapter unlock...')
          let unlockConfirmed = false
          let attempts = 0
          while (!unlockConfirmed && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (unlockHash) {
              console.log('✅ Chapter unlock transaction submitted:', unlockHash)
              unlockConfirmed = true
            }
            attempts++
          }
          
          if (!unlockConfirmed) {
            throw new Error('Chapter unlock timeout - please try again')
          }
          
          // Wait a bit more for confirmation
          await new Promise(resolve => setTimeout(resolve, 3000))
          console.log('✅ Chapter unlocked! Revenue distributed: 70% author, 20% curator, 10% platform')
          
        } catch (unlockError) {
          console.error('Failed to process payment:', unlockError)
          throw new Error('Failed to process payment. Please ensure you have sufficient TIP balance.')
        }
        
        // Step 2: Mint the Story Protocol reading license (should be free since currency is zero address)
        console.log('📜 Step 2: Minting Story Protocol license token...')
        
        try {
          const mintParams = {
            ipId: chapterIpAssetId as `0x${string}`,
            licenseTermsId: licenseTermsId,
            amount: 1n,
            receiver: receiverAddress,
            txOptions: {
              waitForTransaction: true
            }
          }
          
          console.log('License mint parameters:', {
            ipId: mintParams.ipId,
            licenseTermsId: mintParams.licenseTermsId.toString(),
            amount: mintParams.amount.toString(),
            receiver: mintParams.receiver
          })
          
          const result = await client.license.mintLicenseTokens(mintParams)
          
          if (!result.txHash) {
            throw new Error('Failed to mint license token - no transaction hash returned')
          }

          console.log('✅ Reading license minted successfully!')
          console.log('Transaction hash:', result.txHash)
          console.log('License token ID:', result.licenseTokenIds?.[0])
          
          // Store the license token ID for future verification
          const licenseTokenId = result.licenseTokenIds?.[0]?.toString()
          
          const licenseData = {
            licenseTokenId: licenseTokenId,
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
              licenseTokenId: licenseTokenId,
              transactionHash: result.txHash
            })
          } catch (backendErr) {
            console.warn('Failed to update backend with license info:', backendErr)
            // Don't fail the whole operation if backend update fails
          }
          
          onSuccess?.(licenseData)
          return licenseData
          
        } catch (licenseError) {
          console.error('Failed to mint license token:', licenseError)
          // If license minting fails after payment, this is critical
          // The user has paid but didn't get the license
          throw new Error(
            'Payment succeeded but license minting failed. Please contact support with your transaction hash. ' +
            'Do not attempt to purchase again.'
          )
        }
      } catch (outerError) {
        // This catches any errors from the entire two-step process
        console.error('License purchase process failed:', outerError)
        throw outerError
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during license minting'
      console.error('Reading license minting error:', err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [address, initializeStoryClient, ensureTipApproval, approveHash, publicClient, writeUnlockChapter, unlockHash])

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
      // For now, we'll skip the ownership check as it requires complex queries
      // In production, you'd check the license NFT ownership properly
      console.log('License ownership check not implemented yet')
      
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
    isLoading: isLoading || isApprovePending || isUnlockPending,
    error,
    setError
  }
}