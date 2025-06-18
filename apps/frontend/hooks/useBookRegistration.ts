import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'

// HybridRevenueControllerV2 deployed address (2025-06-18 - Full Version)
export const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812'

// ABI for HybridRevenueControllerV2
export const HYBRID_V2_ABI = [
  {
    name: 'registerBook',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'isDerivative', type: 'bool' },
      { name: 'parentBookId', type: 'bytes32' },
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
      { name: 'isDerivative', type: 'bool' },
      { name: 'parentBookId', type: 'bytes32' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'ipfsMetadataHash', type: 'string' }
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
  }
] as const

interface RegisterBookParams {
  bookId: string
  totalChapters: number
  isDerivative?: boolean
  parentBookId?: string
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
    writeContract: writeRegisterBook, 
    data: registerHash,
    isError: isRegisterError,
    error: registerError,
    isPending: isRegisterWritePending
  } = useWriteContract()
  const { isLoading: isRegisterPending } = useWaitForTransactionReceipt({
    hash: registerHash,
  })
  
  const { 
    writeContract: writeSetAttribution, 
    data: attributionHash,
    isError: isAttributionError,
    error: attributionError,
    isPending: isAttributionWritePending
  } = useWriteContract()
  const { isLoading: isAttributionPending } = useWaitForTransactionReceipt({
    hash: attributionHash,
  })
  
  /**
   * Check if a book is already registered
   */
  const checkBookRegistration = useCallback(async (bookId: string): Promise<boolean> => {
    if (!publicClient) return false
    
    try {
      const { bytes32Id } = parseBookId(bookId)
      
      const bookData = await publicClient.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: HYBRID_V2_ABI,
        functionName: 'books',
        args: [bytes32Id],
      })
      
      // Check if curator address is not zero address (indicates book exists)
      const curator = bookData[0] as string
      const isActive = bookData[4] as boolean
      
      return curator !== '0x0000000000000000000000000000000000000000' && isActive
    } catch (error) {
      console.error('Error checking book registration:', error)
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
    isDerivative = false,
    parentBookId = '0x0000000000000000000000000000000000000000000000000000000000000000',
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
      const parentBytes32 = parentBookId === '0x0000000000000000000000000000000000000000000000000000000000000000' 
        ? parentBookId as `0x${string}`
        : parseBookId(parentBookId).bytes32Id
      
      console.log('📚 Registering book:', {
        bookId,
        bytes32Id,
        totalChapters,
        isDerivative
      })
      
      // Check if already registered
      const isRegistered = await checkBookRegistration(bookId)
      if (isRegistered) {
        console.log('✅ Book already registered')
        return { success: true, alreadyRegistered: true }
      }
      
      // Register the book
      writeRegisterBook({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: HYBRID_V2_ABI,
        functionName: 'registerBook',
        args: [
          bytes32Id,
          isDerivative,
          parentBytes32,
          BigInt(totalChapters),
          ipfsMetadataHash
        ],
      })
      
      // Wait for transaction
      let attempts = 0
      while (!registerHash && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }
      
      if (!registerHash) {
        throw new Error('Transaction timeout')
      }
      
      console.log('✅ Book registration transaction:', registerHash)
      return { success: true, transactionHash: registerHash }
      
    } catch (error) {
      console.error('Failed to register book:', error)
      setError(error instanceof Error ? error.message : 'Registration failed')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsLoading(false)
    }
  }, [address, writeRegisterBook, registerHash, checkBookRegistration])
  
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
        ]
      })
      
      // Initiate the transaction
      try {
        writeSetAttribution({
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
        })
        
        console.log('✅ writeSetAttribution called - check your wallet for transaction prompt')
      } catch (writeError) {
        console.error('❌ Error calling writeSetAttribution:', writeError)
        throw writeError
      }
      
      // Return early - the transaction will be handled by wagmi hooks
      // The component should watch for attributionHash to know when it's complete
      return { success: true, pending: true }
      
    } catch (error) {
      console.error('Failed to set chapter attribution:', error)
      setError(error instanceof Error ? error.message : 'Attribution failed')
      setIsLoading(false)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [address, writeSetAttribution])
  
  // Check if the service is supported (contract deployed)
  const isSupported = HYBRID_REVENUE_CONTROLLER_V2_ADDRESS && 
                     HYBRID_REVENUE_CONTROLLER_V2_ADDRESS !== '0x...' &&
                     !!publicClient

  return {
    registerBook,
    setChapterAttribution,
    checkBookRegistration,
    isLoading: isLoading || isRegisterPending || isAttributionPending,
    error,
    isSupported,
    // Expose transaction states for better UI feedback
    attributionState: {
      isWritePending: isAttributionWritePending,
      hash: attributionHash,
      isError: isAttributionError,
      error: attributionError,
      isConfirming: isAttributionPending
    }
  }
}