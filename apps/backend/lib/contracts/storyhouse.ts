import { Address, Hash } from 'viem'

// StoryHouse Contract Addresses - 5-Contract Optimized Architecture
// Deployed on 2025-06-16, all contracts operational and configured
export const STORYHOUSE_CONTRACTS = {
  TIP_TOKEN: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address,
  REWARDS_MANAGER: '0xf5ae031ba92295c2ae86a99e88f09989339707e5' as Address,
  UNIFIED_REWARDS_CONTROLLER: '0x741105d6ee9b25567205f57c0e4f1d293f0d00c5' as Address,
  CHAPTER_ACCESS_CONTROLLER: '0x1bd65ad10b1ca3ed67ae75fcdd3aba256a9918e3' as Address,
  HYBRID_REVENUE_CONTROLLER: '0xd1f7e8c6fd77dadbe946ae3e4141189b39ef7b08' as Address,
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

export const REWARDS_MANAGER_ABI = [
  {
    name: 'totalRewardsEarned',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalRewardsDistributed',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'userContextRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'contextId', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getGlobalStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalRewards', type: 'uint256' },
      { name: 'totalRecipients', type: 'uint256' },
      { name: 'totalControllers', type: 'uint256' }
    ]
  }
] as const

export const CHAPTER_ACCESS_CONTROLLER_ABI = [
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
    name: 'batchUnlockChapters',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumbers', type: 'uint256[]' }
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
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'getUserProgress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'bookId', type: 'bytes32' }
    ],
    outputs: [{ name: 'chaptersUnlocked', type: 'uint256[]' }]
  },
  {
    name: 'getChapterInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [
      { name: 'exists', type: 'bool' },
      { name: 'author', type: 'address' },
      { name: 'ipAssetId', type: 'string' },
      { name: 'wordCount', type: 'uint256' }
    ]
  },
  // Events
  {
    name: 'ChapterUnlocked',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'bookId', type: 'bytes32', indexed: true },
      { name: 'chapterNumber', type: 'uint256', indexed: true },
      { name: 'price', type: 'uint256', indexed: false }
    ]
  }
] as const

export const UNIFIED_REWARDS_CONTROLLER_ABI = [
  {
    name: 'registerStoryCreator',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'bytes32' },
      { name: 'creator', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'purchaseRemixLicense',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'originalStoryId', type: 'bytes32' },
      { name: 'remixStoryId', type: 'bytes32' },
      { name: 'licenseType', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'setQualityScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'bytes32' },
      { name: 'score', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'distributeEngagementReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'bytes32' },
      { name: 'engagementType', type: 'string' },
      { name: 'count', type: 'uint256' }
    ],
    outputs: []
  },
  // Events
  {
    name: 'RemixLicensePurchased',
    type: 'event',
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'originalStoryId', type: 'bytes32', indexed: true },
      { name: 'remixStoryId', type: 'bytes32', indexed: true },
      { name: 'licenseType', type: 'string', indexed: false },
      { name: 'price', type: 'uint256', indexed: false }
    ]
  }
] as const

export const HYBRID_REVENUE_CONTROLLER_ABI = [
  {
    name: 'registerBook',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'curator', type: 'address' },
      { name: 'isDerivative', type: 'bool' },
      { name: 'parentBookId', type: 'bytes32' }
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
      { name: 'exists', type: 'bool' },
      { name: 'curator', type: 'address' },
      { name: 'isDerivative', type: 'bool' },
      { name: 'parentBookId', type: 'bytes32' },
      { name: 'isActive', type: 'bool' }
    ]
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