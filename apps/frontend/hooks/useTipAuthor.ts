'use client'

import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { TIP_TOKEN_ABI, STORYHOUSE_CONTRACTS } from '@/lib/contracts/storyhouse'
import apiClient from '@/lib/api-client'

interface TipResult {
  success: boolean
  transactionHash?: string
  error?: string
}

export function useTipAuthor() {
  const { address } = useAccount()
  const [isTipping, setIsTipping] = useState(false)
  const [tipResult, setTipResult] = useState<TipResult | null>(null)
  
  // Write contract hook for TIP transfer
  const { 
    writeContract: writeTransfer,
    data: transferHash,
    isError: isTransferError,
    error: transferError,
    reset: resetTransfer
  } = useWriteContract()
  
  // Wait for transaction receipt
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash: transferHash,
  })
  
  /**
   * Send a tip to an author
   * @param authorAddress - The recipient's wallet address
   * @param amount - The amount of TIP tokens to send (as a string)
   * @param metadata - Optional metadata about the tip (bookId, chapterNumber, etc.)
   */
  const tipAuthor = useCallback(async (
    authorAddress: string,
    amount: string,
    metadata?: {
      bookId?: string
      chapterNumber?: number
      message?: string
    }
  ): Promise<TipResult> => {
    if (!address) {
      const error = 'No wallet connected'
      setTipResult({ success: false, error })
      throw new Error(error)
    }
    
    if (!authorAddress || !amount || parseFloat(amount) <= 0) {
      const error = 'Invalid tip parameters'
      setTipResult({ success: false, error })
      throw new Error(error)
    }
    
    setIsTipping(true)
    setTipResult(null)
    resetTransfer()
    
    try {
      const amountWei = parseUnits(amount, 18)
      
      console.log('💰 Sending tip:', {
        from: address,
        to: authorAddress,
        amount: `${amount} TIP`,
        amountWei: amountWei.toString(),
        metadata
      })
      
      // Execute the transfer
      await writeTransfer({
        address: STORYHOUSE_CONTRACTS.TIP_TOKEN as `0x${string}`,
        abi: TIP_TOKEN_ABI,
        functionName: 'transfer',
        args: [authorAddress as `0x${string}`, amountWei],
      })
      
      // The transaction is now pending
      // The useWaitForTransactionReceipt hook will handle confirmation
      
      return { success: true }
      
    } catch (error) {
      console.error('Failed to send tip:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send tip'
      setTipResult({ success: false, error: errorMessage })
      setIsTipping(false)
      throw error
    }
  }, [address, writeTransfer, resetTransfer])
  
  /**
   * Record tip in backend (after successful transaction)
   */
  const recordTip = useCallback(async (
    transactionHash: string,
    authorAddress: string,
    amount: string,
    metadata?: {
      bookId?: string
      chapterNumber?: number
      message?: string
    }
  ) => {
    try {
      await apiClient.post('/authors/tip', {
        transactionHash,
        authorAddress,
        tipperAddress: address,
        amount,
        ...metadata
      })
    } catch (error) {
      console.error('Failed to record tip in backend:', error)
      // Don't throw - the tip was successful even if recording failed
    }
  }, [address])
  
  // Update state when transaction is confirmed
  useCallback(() => {
    if (isConfirmed && receipt) {
      setTipResult({ 
        success: true, 
        transactionHash: receipt.transactionHash 
      })
      setIsTipping(false)
    }
  }, [isConfirmed, receipt])
  
  // Update state on error
  useCallback(() => {
    if (isTransferError && transferError) {
      const errorMessage = transferError.message || 'Transaction failed'
      setTipResult({ success: false, error: errorMessage })
      setIsTipping(false)
    }
  }, [isTransferError, transferError])
  
  return {
    tipAuthor,
    recordTip,
    isTipping: isTipping || isConfirming,
    tipResult,
    transactionHash: transferHash,
    isConfirmed,
    error: transferError,
    resetTip: () => {
      setTipResult(null)
      resetTransfer()
    }
  }
}