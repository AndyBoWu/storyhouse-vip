import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'

// HybridRevenueControllerV2 deployed address (Story Protocol Testnet)
export const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6'

// ABI for HybridRevenueControllerV2
export const HYBRID_V2_ABI = [
  {
    name: 'registerBook',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'ipfsMetadataHash', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'setChapterAttribution',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' },
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'books',
    type: 'function',
    inputs: [{ name: 'bookId', type: 'bytes32' }],
    outputs: [
      { name: 'curator', type: 'address' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'ipfsMetadataHash', type: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'chapterAttributions',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'unlockChapter',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'hasUnlockedChapter',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [{ name: 'unlocked', type: 'bool' }],
    stateMutability: 'view'
  }
] as const

interface RegisterBookParams {
  bookId: string
  totalChapters: number
  ipfsMetadataHash?: string
}

interface SetChapterParams {
  bookId: string
  chapterNumber: number
  originalAuthor: string
  unlockPrice: string // in TIP
  isOriginalContent?: boolean
}

export function useBookRegistration() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Contract write hooks
  const { 
    writeContractAsync: writeRegisterBook, 
    isError: isRegisterError,
    error: registerError,
    isPending: isRegisterWritePending
  } = useWriteContract()
  
  const [pendingRegisterHash, setPendingRegisterHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isRegisterPending } = useWaitForTransactionReceipt({
    hash: pendingRegisterHash,
  })
  
  const { 
    writeContractAsync: writeSetAttribution, 
    data: attributionHash,
    isError: isAttributionError,
    error: attributionError,
    isPending: isAttributionWritePending
  } = useWriteContract()
  const { 
    isLoading: isAttributionPending,
    isSuccess: isAttributionSuccess,
    error: attributionTxError
  } = useWaitForTransactionReceipt({
    hash: attributionHash,
  })
  
  /**
   * Check if a book is already registered
   */
  const checkBookRegistration = useCallback(async (bookId: string): Promise<boolean> => {
    console.log('🔍 checkBookRegistration called with:', bookId)
    
    if (!publicClient) {
      console.error('❌ No publicClient available')
      return false
    }
    
    try {
      const { bytes32Id } = parseBookId(bookId)
      console.log('📝 Parsed bookId to bytes32:', bytes32Id)
      
      console.log('📡 Calling contract at:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS)
      const chainId = await publicClient.getChainId()
      console.log('🔗 Current chain ID:', chainId)
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Contract call timed out after 10 seconds')), 10000)
      )
      
      const contractCallPromise = publicClient.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: HYBRID_V2_ABI,
        functionName: 'books',
        args: [bytes32Id],
      })
      
      const bookData = await Promise.race([contractCallPromise, timeoutPromise])
      
      console.log('📚 Contract response:', bookData)
      
      // Check if curator address is not zero address (indicates book exists)
      const curator = bookData[0] as string
      const isActive = bookData[2] as boolean
      
      const isRegistered = curator !== '0x0000000000000000000000000000000000000000' && isActive
      console.log('✅ Book registration check result:', isRegistered)
      
      return isRegistered
    } catch (error) {
      console.error('❌ Error checking book registration:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        cause: (error as any)?.cause
      })
      // If error occurs, assume book is not registered
      return false
    }
  }, [publicClient])
  
  /**
   * Register a new book
   */
  const registerBook = useCallback(async ({
    bookId,
    totalChapters,
    ipfsMetadataHash = ''
  }: RegisterBookParams) => {
    if (!address) {
      setError('Please connect your wallet')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { bytes32Id } = parseBookId(bookId)
      
      console.log('📚 Registering book:', {
        bookId,
        bytes32Id,
        totalChapters
      })
      
      // Check if already registered
      const isRegistered = await checkBookRegistration(bookId)
      if (isRegistered) {
        console.log('✅ Book already registered')
        return { success: true, alreadyRegistered: true }
      }
      
      // Register the book
      console.log('📝 Initiating book registration transaction...')
      
      let txHash: `0x${string}` | undefined
      
      try {
        // Use writeContractAsync which returns the transaction hash
        txHash = await writeRegisterBook({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: HYBRID_V2_ABI,
          functionName: 'registerBook',
          args: [
            bytes32Id,
            BigInt(totalChapters),
            ipfsMetadataHash
          ],
        })
        
        console.log('✅ Book registration transaction submitted:', txHash)
        setPendingRegisterHash(txHash)
        
        // Wait for transaction confirmation with a reasonable timeout
        const receipt = await publicClient?.waitForTransactionReceipt({
          hash: txHash,
          timeout: 120_000, // 2 minutes timeout
        })
        
        if (receipt?.status === 'success') {
          console.log('✅ Book registration confirmed!')
          return { success: true, transactionHash: txHash }
        } else {
          throw new Error('Transaction failed')
        }
        
      } catch (writeError) {
        console.error('❌ Failed to register book:', writeError)
        
        // Handle specific error cases
        if (writeError instanceof Error) {
          if (writeError.message.includes('User rejected') || 
              writeError.message.includes('user rejected') || 
              writeError.message.includes('denied')) {
            throw new Error('Transaction rejected by user')
          }
          
          if (writeError.message.includes('timeout')) {
            // Transaction is still pending, but we have the hash
            if (txHash) {
              return { 
                success: true, 
                transactionHash: txHash,
                pending: true,
                message: 'Transaction submitted but confirmation is taking longer than expected. You can check the transaction status in your wallet.'
              }
            }
            throw new Error('Transaction timeout - please check your wallet for pending transactions')
          }
        }
        
        throw writeError
      }
      
    } catch (error) {
      console.error('Failed to register book:', error)
      setError(error instanceof Error ? error.message : 'Registration failed')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsLoading(false)
    }
  }, [address, writeRegisterBook, publicClient, checkBookRegistration])
  
  /**
   * Set chapter attribution and pricing
   */
  const setChapterAttribution = useCallback(async ({
    bookId,
    chapterNumber,
    originalAuthor,
    unlockPrice,
    isOriginalContent = true
  }: SetChapterParams) => {
    if (!address) {
      setError('Please connect your wallet')
      return { success: false, error: 'Please connect your wallet' }
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { bytes32Id } = parseBookId(bookId)
      const priceWei = BigInt(Math.floor(parseFloat(unlockPrice) * 1e18))
      
      console.log('📝 Setting chapter attribution:', {
        bookId,
        bytes32Id,
        chapterNumber,
        originalAuthor,
        unlockPrice: `${unlockPrice} TIP`,
        priceWei: priceWei.toString(),
        isOriginalContent,
        contractAddress: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS
      })
      
      // Estimate gas first to avoid failures
      let estimatedGas = 800000n // Default fallback
      try {
        if (publicClient) {
          estimatedGas = await publicClient.estimateContractGas({
            address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
            abi: HYBRID_V2_ABI,
            functionName: 'setChapterAttribution',
            args: [
              bytes32Id,
              BigInt(chapterNumber),
              originalAuthor as `0x${string}`,
              bytes32Id,
              priceWei,
              isOriginalContent
            ],
            account: address as `0x${string}`,
          })
          
          // Add 20% buffer for safety
          estimatedGas = (estimatedGas * 120n) / 100n
          console.log('⛽ Estimated gas with buffer:', estimatedGas.toString())
        }
      } catch (gasError) {
        console.warn('⚠️ Gas estimation failed, using default:', gasError)
        // Check if it's a specific error
        const errorMessage = gasError instanceof Error ? gasError.message : String(gasError)
        if (errorMessage.includes('curator') || errorMessage.includes('not registered')) {
          throw new Error('Book must be registered before setting chapter pricing. Please ensure the book is registered first.')
        }
      }
      
      // Log the exact transaction parameters
      console.log('📋 Transaction parameters:', {
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS,
        functionName: 'setChapterAttribution',
        args: [
          bytes32Id,
          BigInt(chapterNumber),
          originalAuthor,
          bytes32Id,
          priceWei,
          isOriginalContent
        ],
        gas: estimatedGas.toString()
      })
      
      // Initiate the transaction
      try {
        console.log('🚀 Calling writeSetAttribution with params:', {
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS,
          functionName: 'setChapterAttribution',
          gas: estimatedGas.toString(),
          args: {
            bookId: bytes32Id,
            chapterNumber: BigInt(chapterNumber).toString(),
            originalAuthor,
            sourceBookId: bytes32Id,
            priceWei: priceWei.toString(),
            isOriginalContent
          }
        })
        
        // Add a small delay to ensure MetaMask popup appears
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const txHash = await writeSetAttribution({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: HYBRID_V2_ABI,
          functionName: 'setChapterAttribution',
          args: [
            bytes32Id,
            BigInt(chapterNumber),
            originalAuthor as `0x${string}`,
            bytes32Id, // sourceBookId (same as bookId for original content)
            priceWei,
            isOriginalContent
          ],
          gas: estimatedGas, // Use dynamically estimated gas with buffer
        })
        
        console.log('✅ Attribution transaction submitted:', txHash)
        
        // Wait for transaction confirmation
        const receipt = await publicClient?.waitForTransactionReceipt({
          hash: txHash,
          timeout: 120_000, // 2 minutes timeout
        })
        
        if (receipt?.status === 'success') {
          console.log('✅ Chapter attribution confirmed!')
          return { success: true, transactionHash: txHash }
        } else {
          throw new Error('Attribution transaction failed')
        }
        
      } catch (writeError) {
        console.error('❌ Error calling writeSetAttribution:', writeError)
        
        // Parse specific error types
        const errorMessage = writeError instanceof Error ? writeError.message : String(writeError)
        
        if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
          throw new Error('You rejected the transaction. Chapter pricing must be set for readers to unlock this chapter.')
        } else if (errorMessage.includes('insufficient funds')) {
          throw new Error('Insufficient funds for gas. Please add more funds to your wallet.')
        } else if (errorMessage.includes('gas')) {
          throw new Error('Transaction failed due to gas estimation. The contract might be in an unexpected state.')
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
          throw new Error('You cancelled the transaction. Chapter pricing must be set for readers to unlock this chapter.')
        }
        
        throw writeError
      }
      
    } catch (error) {
      console.error('Failed to set chapter attribution:', error)
      setError(error instanceof Error ? error.message : 'Attribution failed')
      setIsLoading(false)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [address, writeSetAttribution, publicClient])
  
  // Check if the service is supported (contract deployed)
  /**
   * Check if chapter attribution is set
   */
  const checkChapterAttribution = useCallback(async ({
    bookId,
    chapterNumber
  }: { bookId: string; chapterNumber: number }) => {
    if (!publicClient) return false;
    
    try {
      const { bytes32Id } = parseBookId(bookId);
      
      const result = await publicClient.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: HYBRID_V2_ABI,
        functionName: 'chapterAttributions',
        args: [bytes32Id, BigInt(chapterNumber)],
      });
      
      const [originalAuthor] = result as [`0x${string}`, `0x${string}`, bigint, boolean];
      const isSet = originalAuthor !== '0x0000000000000000000000000000000000000000';
      
      console.log(`📋 Chapter ${chapterNumber} attribution check:`, { isSet, originalAuthor });
      return isSet;
    } catch (error) {
      console.error('Failed to check chapter attribution:', error);
      return false;
    }
  }, [publicClient]);

  const isSupported = HYBRID_REVENUE_CONTROLLER_V2_ADDRESS && 
                     HYBRID_REVENUE_CONTROLLER_V2_ADDRESS !== '0x...' &&
                     !!publicClient

  return {
    registerBook,
    setChapterAttribution,
    checkBookRegistration,
    checkChapterAttribution,
    isLoading: isLoading || isRegisterPending || isAttributionPending,
    error,
    isSupported,
    // Expose transaction states for better UI feedback
    attributionState: {
      isWritePending: isAttributionWritePending,
      hash: attributionHash,
      isError: isAttributionError,
      error: attributionError,
      isConfirming: isAttributionPending,
      isSuccess: isAttributionSuccess
    },
    // Expose write contract function for direct use if needed (not needed anymore since setChapterAttribution handles it)
  }
}