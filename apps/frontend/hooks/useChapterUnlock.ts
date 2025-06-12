import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { STORYHOUSE_CONTRACTS, TIP_TOKEN_ABI, READ_REWARDS_CONTROLLER_ABI } from '../lib/contracts/storyhouse'

// Use existing contract addresses from configuration
const CHAPTER_ACCESS_CONTROLLER_ADDRESS = STORYHOUSE_CONTRACTS.READ_REWARDS_CONTROLLER
const TIP_TOKEN_ADDRESS = STORYHOUSE_CONTRACTS.TIP_TOKEN

// Use READ_REWARDS_CONTROLLER_ABI from contracts/storyhouse

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
  const [pendingUnlock, setPendingUnlock] = useState<{onSuccess?: (txHash: string) => void, onError?: (error: string) => void} | null>(null)

  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { writeContract: writeUnlock, data: unlockHash } = useWriteContract()

  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isUnlockPending, isSuccess: isUnlockSuccess, isError: isUnlockError } = useWaitForTransactionReceipt({
    hash: unlockHash,
  })

  // Handle transaction completion
  useEffect(() => {
    if (isUnlockSuccess && unlockHash && pendingUnlock?.onSuccess) {
      console.log('🎉 Transaction completed successfully:', unlockHash)
      pendingUnlock.onSuccess(unlockHash)
      setPendingUnlock(null)
      setIsUnlocking(false)
      setIsApproving(false)
    }
  }, [isUnlockSuccess, unlockHash, pendingUnlock])

  // Handle transaction failure
  useEffect(() => {
    if (isUnlockError && pendingUnlock?.onError) {
      console.error('❌ Transaction failed')
      pendingUnlock.onError('Transaction failed or was rejected')
      setPendingUnlock(null)
      setIsUnlocking(false)
      setIsApproving(false)
    }
  }, [isUnlockError, pendingUnlock])

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
      const unlockPrice = parseEther('0.5') // 0.5 TIP tokens (matches UI pricing)
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

      console.log('🔓 Paying for chapter access via TIP token transfer...')
      console.log('Book ID (bytes32):', bookIdBytes32)
      console.log('Chapter Number:', chapterNumber)
      console.log('Unlock Price:', unlockPrice.toString())

      // Store callbacks for transaction completion
      setPendingUnlock({ onSuccess, onError })

      // For paid chapters, transfer TIP tokens to the platform
      // This is a simpler approach than complex smart contract logic
      const platformAddress = CHAPTER_ACCESS_CONTROLLER_ADDRESS // Use as treasury address
      
      writeUnlock({
        address: TIP_TOKEN_ADDRESS,
        abi: TIP_TOKEN_ABI,
        functionName: 'transfer',
        args: [platformAddress, unlockPrice],
      })

      // Transaction completion will be handled by useEffect when isUnlockSuccess becomes true

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
      
      // TODO: Implement actual smart contract read call
      // This would use a read contract hook in a real implementation
      // For now, return basic pricing model: first 3 chapters free, others 10 TIP
      const isFree = chapterNumber <= 3
      const price = isFree ? 0n : parseEther('10')
      
      return {
        canAccess: true, // For development - in production this would check actual access
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