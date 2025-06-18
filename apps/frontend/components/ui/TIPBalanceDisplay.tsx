'use client'

import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { Coins } from 'lucide-react'

// TIP Token address from the deployment
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'

const TIP_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const

export function TIPBalanceDisplay() {
  const { address } = useAccount()
  
  // Get native ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  })
  
  // Get TIP token balance
  const { data: tipBalance } = useReadContract({
    address: TIP_TOKEN_ADDRESS as `0x${string}`,
    abi: TIP_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  if (!address) {
    return null
  }

  const tipBalanceFormatted = tipBalance ? formatUnits(tipBalance, 18) : '0'
  const ethBalanceFormatted = ethBalance ? formatUnits(ethBalance.value, 18) : '0'

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Coins className="w-4 h-4" />
        Wallet Balances
      </h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">TIP Tokens:</span>
          <span className="font-mono font-medium">
            {parseFloat(tipBalanceFormatted).toFixed(4)} TIP
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">ETH (for gas):</span>
          <span className="font-mono font-medium text-gray-500">
            {parseFloat(ethBalanceFormatted).toFixed(4)} ETH
          </span>
        </div>
      </div>
      
      {parseFloat(tipBalanceFormatted) === 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          ⚠️ You need TIP tokens to unlock chapters. Ask the admin to mint some for you.
        </div>
      )}
    </div>
  )
}