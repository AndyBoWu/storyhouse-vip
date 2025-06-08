import { Address, Hash } from 'viem'

// StoryHouse Contract Addresses on Story Protocol Aeneid Testnet
// Deployed on 2025-06-04, all contracts operational and configured
export const STORYHOUSE_CONTRACTS = {
  TIP_TOKEN: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address,
  ACCESS_CONTROL_MANAGER: '0x41e2db0d016e83ddc3c464ffd260d22a6c898341' as Address,
  REWARDS_MANAGER: '0xf5ae031ba92295c2ae86a99e88f09989339707e5' as Address,
  CREATOR_REWARDS_CONTROLLER: '0x8e2d21d1b9c744f772f15a7007de3d5757eea333' as Address,
  READ_REWARDS_CONTROLLER: '0x04553ba8316d407b1c58b99172956d2d5fe100e5' as Address,
  REMIX_LICENSING_CONTROLLER: '0x16144746a33d9a172039efc64bc2e12445fbbef2' as Address,
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
  }
] as const

export const CREATOR_REWARDS_CONTROLLER_ABI = [
  {
    name: 'claimStoryCreationReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'storyId', type: 'bytes32' }],
    outputs: []
  },
  {
    name: 'claimChapterCreationReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'recordEngagement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'creator', type: 'address' },
      { name: 'storyId', type: 'bytes32' },
      { name: 'engagementType', type: 'string' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'hasClaimedCreationReward',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'creator', type: 'address' },
      { name: 'storyId', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'totalStoriesCreated',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // Events
  {
    name: 'StoryCreationReward',
    type: 'event',
    inputs: [
      { name: 'creator', type: 'address', indexed: true },
      { name: 'storyId', type: 'bytes32', indexed: true },
      { name: 'rewardAmount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
] as const

export const READ_REWARDS_CONTROLLER_ABI = [
  {
    name: 'startReading',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'claimChapterReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'hasClaimedChapter',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'reader', type: 'address' },
      { name: 'storyId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'readingStreak',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'reader', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'userChaptersRead',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'reader', type: 'address' },
      { name: 'storyId', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // Events
  {
    name: 'ChapterRewardClaimed',
    type: 'event',
    inputs: [
      { name: 'reader', type: 'address', indexed: true },
      { name: 'storyId', type: 'bytes32', indexed: true },
      { name: 'chapterNumber', type: 'uint256', indexed: false },
      { name: 'rewardAmount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
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
  // Events
  {
    name: 'RewardDistributed',
    type: 'event',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'rewardType', type: 'string', indexed: false },
      { name: 'contextId', type: 'bytes32', indexed: true },
      { name: 'controller', type: 'address', indexed: true }
    ]
  }
] as const

// Type definitions for frontend operations
export interface StoryMetadata {
  id: string
  title: string
  description: string
  author: Address
  ipfsHash: string
  chapterCount: number
  totalReads: number
  createdAt: number
}

export interface ChapterMetadata {
  storyId: string
  chapterNumber: number
  title: string
  content: string
  ipfsHash: string
  wordCount: number
  readingTime: number
  createdAt: number
}

export interface UserRewards {
  totalEarned: bigint
  creationRewards: bigint
  readingRewards: bigint
  streakBonus: bigint
  storiesCreated: number
  chaptersRead: number
  currentStreak: number
}

export interface RewardClaim {
  type: 'creation' | 'reading' | 'engagement'
  storyId: string
  chapterNumber?: number
  amount: bigint
  transactionHash?: Hash
}

// Helper functions for frontend operations
export function generateStoryId(title: string, author: Address): string {
  // Simple hash function for demo - in production use proper hashing
  const combined = `${title}-${author}-${Date.now()}`
  return `0x${Buffer.from(combined).toString('hex').slice(0, 64).padEnd(64, '0')}`
}

export function formatTIPAmount(amount: bigint): string {
  // Format TIP amount with 18 decimals
  const divisor = BigInt(10 ** 18)
  const whole = amount / divisor
  const decimal = amount % divisor
  return `${whole}.${decimal.toString().slice(0, 4).padEnd(4, '0')}`
}

export function parseTIPAmount(amount: string): bigint {
  // Parse TIP amount string to BigInt with 18 decimals
  const [whole, decimal = '0'] = amount.split('.')
  const paddedDecimal = decimal.slice(0, 18).padEnd(18, '0')
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(paddedDecimal)
}

export function getExplorerUrl(txHash: Hash): string {
  return `https://aeneid.storyscan.xyz/tx/${txHash}`
}

export function getAddressUrl(address: Address): string {
  return `https://aeneid.storyscan.xyz/address/${address}`
}

// Reward calculation helpers
export const REWARD_AMOUNTS = {
  STORY_CREATION: BigInt(50 * 10 ** 18), // 50 TIP
  CHAPTER_CREATION: BigInt(20 * 10 ** 18), // 20 TIP
  CHAPTER_READ: BigInt(10 * 10 ** 18), // 10 TIP
  DAILY_STREAK_BONUS: 0.1, // 10% per streak day
  MAX_DAILY_CHAPTERS: 20,
} as const

export function calculateReadingReward(
  baseReward: bigint,
  streakDays: number
): bigint {
  const bonusMultiplier = Math.min(streakDays * REWARD_AMOUNTS.DAILY_STREAK_BONUS, 1.0) // Max 100% bonus
  return baseReward + BigInt(Math.floor(Number(baseReward) * bonusMultiplier))
}

// Contract interaction helpers
export function createStoryCreationCall(storyId: string) {
  return {
    address: STORYHOUSE_CONTRACTS.CREATOR_REWARDS_CONTROLLER,
    abi: CREATOR_REWARDS_CONTROLLER_ABI,
    functionName: 'claimStoryCreationReward',
    args: [storyId as `0x${string}`]
  }
}

export function createChapterRewardCall(storyId: string, chapterNumber: number) {
  return {
    address: STORYHOUSE_CONTRACTS.READ_REWARDS_CONTROLLER,
    abi: READ_REWARDS_CONTROLLER_ABI,
    functionName: 'claimChapterReward',
    args: [storyId as `0x${string}`, BigInt(chapterNumber)]
  }
}

export function createStartReadingCall(storyId: string, chapterNumber: number) {
  return {
    address: STORYHOUSE_CONTRACTS.READ_REWARDS_CONTROLLER,
    abi: READ_REWARDS_CONTROLLER_ABI,
    functionName: 'startReading',
    args: [storyId as `0x${string}`, BigInt(chapterNumber)]
  }
}

// Gas estimation constants
export const GAS_LIMITS = {
  CLAIM_STORY_REWARD: BigInt(200000),
  CLAIM_CHAPTER_REWARD: BigInt(150000),
  START_READING: BigInt(100000),
  TIP_TRANSFER: BigInt(65000),
} as const

// Network configuration
export const STORY_TESTNET_CONFIG = {
  chainId: 1315,
  name: 'Story Protocol Aeneid Testnet',
  explorerUrl: 'https://aeneid.storyscan.xyz',
  rpcUrl: 'https://aeneid.storyrpc.io',
  faucetUrl: 'https://aeneid.faucet.story.foundation/'
} as const 
