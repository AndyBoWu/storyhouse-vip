'use client'

import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'

// Contract addresses
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6'

// TIP Token ABI (only approval functions)
const TIP_TOKEN_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const

export function useTipApproval() {
  const { address } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  
  // Check current allowance
  const { data: currentAllowance } = useReadContract({
    address: TIP_TOKEN_ADDRESS as `0x${string}`,
    abi: TIP_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`] : undefined,
  })
  
  // Write contract hooks
  const { 
    writeContract: writeApprove,
    data: approveHash,
    isError: isApproveError,
    error: approveError,
  } = useWriteContract()
  
  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })
  
  /**
   * Check if user has sufficient allowance
   */
  const checkAllowance = useCallback((requiredAmount: string): boolean => {
    if (!currentAllowance) return false
    
    const requiredWei = parseUnits(requiredAmount, 18)
    return currentAllowance >= requiredWei
  }, [currentAllowance])
  
  /**
   * Approve TIP spending
   */
  const approveTip = useCallback(async (amount: string) => {
    if (!address) {
      throw new Error('No wallet connected')
    }
    
    setIsApproving(true)
    
    try {
      const amountWei = parseUnits(amount, 18)
      
      console.log('🔓 Approving TIP spending:', {
        spender: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS,
        amount: `${amount} TIP`,
        amountWei: amountWei.toString()
      })
      
      writeApprove({
        address: TIP_TOKEN_ADDRESS as `0x${string}`,
        abi: TIP_TOKEN_ABI,
        functionName: 'approve',
        args: [HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`, amountWei],
      })
      
      // Return success - the transaction will be handled by wagmi hooks
      return { success: true, pending: true }
      
    } catch (error) {
      console.error('Failed to approve TIP:', error)
      setIsApproving(false)
      throw error
    }
  }, [address, writeApprove])
  
  return {
    checkAllowance,
    approveTip,
    currentAllowance,
    isApproving: isApproving || isApprovePending,
    approvalHash: approveHash,
    approvalError: approveError,
    isApprovalError: isApproveError
  }
}