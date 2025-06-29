import { Address, Hash } from 'viem'

// StoryHouse Contract Addresses - 2-Contract Minimal Architecture
// HybridRevenueControllerV2 includes all chapter access functionality
export const STORYHOUSE_CONTRACTS = {
  TIP_TOKEN: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address,
  HYBRID_REVENUE_CONTROLLER_V2: '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6' as Address, // V2 - Includes chapter unlocking
} as const

// Essential ABI fragments for frontend operations
export const TIP_TOKEN_ABI = [
  // ERC-20 Standard Functions
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
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
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  // Events
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const

// HybridRevenueControllerV2 ABI - includes chapter access functionality
export const HYBRID_REVENUE_CONTROLLER_ABI = [
  {
    name: 'registerBook',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'ipfsMetadataHash', type: 'string' }
    ],
    outputs: []
  },
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
    name: 'setChapterAttribution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' },
      { name: 'originalAuthor', type: 'address' }
    ],
    outputs: []
  },
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
    name: 'getBookInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bookId', type: 'bytes32' }],
    outputs: [
      { name: 'curator', type: 'address' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalRevenue', type: 'uint256' }
    ]
  },
  {
    name: 'updateTotalChapters',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'newTotalChapters', type: 'uint256' }
    ],
    outputs: []
  }
] as const

// Utility functions for TIP token formatting
export const formatTipAmount = (amount: bigint): string => {
  return (Number(amount) / 1e18).toFixed(2)
}

export const parseTipAmount = (amount: string): bigint => {
  return BigInt(Math.round(parseFloat(amount) * 1e18))
}

// Contract gas limits for transactions
export const GAS_LIMITS = {
  TIP_TRANSFER: 100000n,
  CHAPTER_UNLOCK: 150000n,
  BATCH_UNLOCK: 300000n,
  REMIX_LICENSE: 200000n,
  QUALITY_SCORE: 120000n,
} as const

// Export types for TypeScript
export type StoryHouseContracts = typeof STORYHOUSE_CONTRACTS
export type ContractAddress = StoryHouseContracts[keyof StoryHouseContracts]