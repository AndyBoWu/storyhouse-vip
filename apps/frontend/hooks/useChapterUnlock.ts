import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

// Contract addresses - these would be loaded from environment or config
const CHAPTER_ACCESS_CONTROLLER_ADDRESS = process.env.NEXT_PUBLIC_CHAPTER_ACCESS_CONTROLLER_ADDRESS as `0x${string}`
const TIP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TIP_TOKEN_ADDRESS as `0x${string}`

// Contract ABIs (simplified for this example)
const CHAPTER_ACCESS_ABI = [
  {
    name: 'unlockChapter',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'canAccessChapter',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [
      { name: 'canAccess', type: 'bool' },
      { name: 'price', type: 'uint256' }
    ]
  }
] as const

const TIP_TOKEN_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

interface UnlockChapterParams {
  bookId: string
  chapterNumber: number
  onSuccess?: (txHash: string) => void
  onError?: (error: string) => void
}

export function useChapterUnlock() {
  const { address } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { writeContract: writeUnlock, data: unlockHash } = useWriteContract()

  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isUnlockPending } = useWaitForTransactionReceipt({
    hash: unlockHash,
  })

  /**
   * Convert book ID string to bytes32 format
   */
  const stringToBytes32 = (str: string): `0x${string}` => {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hash = new Uint8Array(32)
    hash.set(data.slice(0, 32))
    return `0x${Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('')}`
  }

  /**
   * Check if user needs to approve TIP token spending
   */
  const checkApprovalNeeded = async (amount: bigint): Promise<boolean> => {
    if (!address || !TIP_TOKEN_ADDRESS || !CHAPTER_ACCESS_CONTROLLER_ADDRESS) {
      return false
    }

    try {
      // This would use a read contract hook in a real implementation
      // For now, assume approval is needed
      return true
    } catch (err) {
      console.error('Error checking allowance:', err)
      return true
    }
  }

  /**
   * Approve TIP token spending
   */
  const approveTokenSpending = async (amount: bigint) => {
    if (!TIP_TOKEN_ADDRESS || !CHAPTER_ACCESS_CONTROLLER_ADDRESS) {
      throw new Error('Contract addresses not configured')
    }

    setIsApproving(true)
    setError(null)

    try {
      writeApprove({
        address: TIP_TOKEN_ADDRESS,
        abi: TIP_TOKEN_ABI,
        functionName: 'approve',
        args: [CHAPTER_ACCESS_CONTROLLER_ADDRESS, amount],
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Approval failed'
      setError(errorMsg)
      setIsApproving(false)
      throw new Error(errorMsg)
    }
  }

  /**
   * Unlock a paid chapter using smart contract
   */
  const unlockPaidChapter = async ({
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

    if (!CHAPTER_ACCESS_CONTROLLER_ADDRESS) {
      const errorMsg = 'Chapter access controller not configured'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsUnlocking(true)
    setError(null)

    try {
      const unlockPrice = parseEther('0.5') // 0.5 TIP tokens
      const bookIdBytes32 = stringToBytes32(bookId)

      // Check if approval is needed
      const needsApproval = await checkApprovalNeeded(unlockPrice)
      
      if (needsApproval) {
        console.log('🔐 Approving TIP token spending...')
        await approveTokenSpending(unlockPrice)
        
        // Wait for approval transaction to complete
        // In a real implementation, you'd wait for the approval transaction to be mined
        // For now, we'll proceed after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      console.log('🔓 Unlocking chapter via smart contract...')
      console.log('Book ID (bytes32):', bookIdBytes32)
      console.log('Chapter Number:', chapterNumber)
      console.log('Unlock Price:', unlockPrice.toString())

      writeUnlock({
        address: CHAPTER_ACCESS_CONTROLLER_ADDRESS,
        abi: CHAPTER_ACCESS_ABI,
        functionName: 'unlockChapter',
        args: [bookIdBytes32, BigInt(chapterNumber)],
      })

      // In a real implementation, you'd wait for the transaction to be mined
      // and then call onSuccess with the transaction hash
      setTimeout(() => {
        if (unlockHash) {
          onSuccess?.(unlockHash)
        }
      }, 3000)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Chapter unlock failed'
      console.error('Chapter unlock error:', err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsUnlocking(false)
      setIsApproving(false)
    }
  }

  /**
   * Check if a chapter can be accessed and get pricing info
   */
  const checkChapterAccess = async (
    bookId: string,
    chapterNumber: number
  ): Promise<{ canAccess: boolean; price: bigint } | null> => {
    if (!address || !CHAPTER_ACCESS_CONTROLLER_ADDRESS) {
      return null
    }

    try {
      const bookIdBytes32 = stringToBytes32(bookId)
      
      // This would use a read contract hook in a real implementation
      // For now, return mock data based on chapter number
      const isFree = chapterNumber <= 3
      const price = isFree ? 0n : parseEther('0.5')
      
      return {
        canAccess: true,
        price
      }
    } catch (err) {
      console.error('Error checking chapter access:', err)
      return null
    }
  }

  /**
   * Get transaction status and loading states
   */
  const getTransactionStatus = () => {
    return {
      isApproving: isApproving || isApprovePending,
      isUnlocking: isUnlocking || isUnlockPending,
      approveHash,
      unlockHash,
      error
    }
  }

  return {
    unlockPaidChapter,
    checkChapterAccess,
    getTransactionStatus,
    isLoading: isApproving || isUnlocking || isApprovePending || isUnlockPending,
    error,
    setError
  }
}