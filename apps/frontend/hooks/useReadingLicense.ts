import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { custom, parseEther, formatEther, type Address, createWalletClient } from 'viem'
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
  
  // Hook for TIP token transfer
  const { writeContract: writeTransfer, data: transferHash } = useWriteContract()
  const { isLoading: isTransferPending } = useWaitForTransactionReceipt({
    hash: transferHash,
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

      // Mint the license token using Story Protocol SDK
      console.log('📝 Minting license token on Story Protocol...')
      console.log('Mint parameters:', {
        ipId: chapterIpAssetId,
        licenseTermsId: licenseTermsId.toString(),
        receiver: address,
        amount: '1'
      })
      
      if (!address) {
        throw new Error('Wallet address is undefined. Please ensure your wallet is connected.')
      }
      
      // Ensure address is valid format
      const receiverAddress = address as `0x${string}`
      
      try {
        console.log('Calling mintLicenseTokens with:', {
          ipId: chapterIpAssetId,
          licenseTermsId: licenseTermsId.toString(),
          receiver: receiverAddress,
          amount: '1n',
          client: !!client,
          clientLicense: !!client.license,
          clientLicenseMint: !!client.license?.mintLicenseTokens
        })
        
        // Wait a moment to ensure wallet is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Since Story Protocol uses zero address, we need to handle TIP payment separately
        // Transfer TIP tokens to the author before minting the license
        console.log(`💰 Transferring ${formatEther(mintingFee)} TIP to author...`)
        
        // Get the author address from chapter info
        const authorAddress = chapterInfo.authorAddress
        if (!authorAddress) {
          throw new Error('Author address not found for this chapter')
        }
        
        try {
          // Transfer TIP tokens to the author
          writeTransfer({
            address: TIP_TOKEN_ADDRESS,
            abi: TIP_TOKEN_ABI,
            functionName: 'transfer',
            args: [authorAddress as `0x${string}`, mintingFee],
          })
          
          // Wait for transfer transaction to be submitted
          console.log('⏳ Waiting for TIP transfer...')
          let transferConfirmed = false
          let attempts = 0
          while (!transferConfirmed && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (transferHash) {
              console.log('✅ TIP transfer transaction submitted:', transferHash)
              transferConfirmed = true
            }
            attempts++
          }
          
          if (!transferConfirmed) {
            throw new Error('TIP transfer timeout - please try again')
          }
          
          // Wait a bit more for confirmation
          await new Promise(resolve => setTimeout(resolve, 3000))
          console.log('✅ TIP tokens transferred to author:', authorAddress)
          
        } catch (tipError) {
          console.error('Failed to transfer TIP tokens:', tipError)
          throw new Error('Failed to transfer TIP tokens to author. Please ensure you have sufficient TIP balance.')
        }
        
        // Check if we should use the newer API after all
        // The backend code might be outdated, let's try the newer SDK API with ipId
        const mintParams = {
          ipId: chapterIpAssetId as `0x${string}`,
          licenseTermsId: licenseTermsId, // Already a BigInt from earlier
          receiver: receiverAddress as `0x${string}`,
          amount: 1n,
          txOptions: {
            // Try to specify we're using TIP tokens, not IP tokens
            value: BigInt(0) // No ETH value needed
          }
        }
        
        console.log('Final mint params (using backend format):', {
          ...mintParams,
          licenseTermsId: mintParams.licenseTermsId.toString(),
          amount: mintParams.amount,
          maxMintingFee: mintParams.maxMintingFee.toString()
        })
        
        const result = await client.license.mintLicenseTokens(mintParams as any)
        
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
        
        return licenseData
      } catch (mintError) {
        console.error('Mint license tokens error details:', {
          error: mintError,
          message: mintError instanceof Error ? mintError.message : 'Unknown error',
          stack: mintError instanceof Error ? mintError.stack : undefined
        })
        throw mintError
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
    isLoading: isLoading || isApprovePending,
    error,
    setError
  }
}