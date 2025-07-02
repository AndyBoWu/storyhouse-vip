// Network Configuration
export const STORY_PROTOCOL_TESTNET = {
  id: 1315,
  name: 'Story Protocol Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP Token',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Protocol Explorer',
      url: 'https://aeneid.storyscan.xyz',
    },
  },
  testnet: true,
} as const;

// Token Configuration
export const TIP_TOKEN_CONFIG = {
  name: 'TIP Token',
  symbol: 'TIP',
  decimals: 18,
  initialSupply: '1000000000', // 1B tokens
  maxSupply: '10000000000',    // 10B tokens
} as const;

// Reward Configuration
export const REWARDS_CONFIG = {
  readRewardPerChapter: 10,    // 10 TIP per chapter
  creatorRoyaltyBps: 500,      // 5% (500 basis points)
  remixFeeBps: 250,            // 2.5% (250 basis points)
  maxChaptersPerStory: 50,     // Maximum chapters per story
  minWordsPerChapter: 500,     // Minimum words to qualify for rewards
} as const;

// Story Configuration
export const STORY_CONFIG = {
  maxPlotDescriptionLength: 500,
  maxTitleLength: 100,
  maxContentLength: 50000,
  defaultReadingWordsPerMinute: 200,
  genres: [
    'Fantasy',
    'Science Fiction',
    'Mystery',
    'Romance',
    'Horror',
    'Adventure',
    'Drama',
    'Comedy'
  ],
  moods: [
    'Dark & Gritty',
    'Light & Whimsical',
    'Mysterious',
    'Romantic',
    'Epic & Heroic',
    'Humorous'
  ],
  emojis: [
    '⚔️', '🏰', '🌟', '💀', '🔮', '👑', '🐉', '🗡️',
    '🏛️', '🌙', '🔥', '💎', '🦋', '🌺', '⭐', '🎭'
  ]
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://testnet.storyhouse.vip'
    : 'http://localhost:3000',
  endpoints: {
    stories: '/api/stories',
    users: '/api/users',
    rewards: '/api/rewards',
    contracts: '/api/contracts',
  }
} as const;

// Contract Configuration (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  development: {
    tipToken: '0x0000000000000000000000000000000000000000',
    storyRewards: '0x0000000000000000000000000000000000000000',
    contentNFT: '0x0000000000000000000000000000000000000000',
    remixLicensing: '0x0000000000000000000000000000000000000000',
  },
  testnet: {
    tipToken: '0x0000000000000000000000000000000000000000',
    storyRewards: '0x0000000000000000000000000000000000000000',
    contentNFT: '0x0000000000000000000000000000000000000000',
    remixLicensing: '0x0000000000000000000000000000000000000000',
  },
  production: {
    tipToken: '0x0000000000000000000000000000000000000000',
    storyRewards: '0x0000000000000000000000000000000000000000',
    contentNFT: '0x0000000000000000000000000000000000000000',
    remixLicensing: '0x0000000000000000000000000000000000000000',
  }
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
  transactionHash: /^0x[a-fA-F0-9]{64}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  invalidAddress: 'Invalid Ethereum address',
  invalidTransactionHash: 'Invalid transaction hash',
  invalidEmail: 'Invalid email address',
  invalidUsername: 'Username must be 3-20 characters, alphanumeric and underscores only',
  walletNotConnected: 'Please connect your wallet',
  networkNotSupported: 'Please switch to Story Protocol testnet',
  insufficientBalance: 'Insufficient token balance',
  rewardAlreadyClaimed: 'Reward already claimed for this chapter',
  storyNotFound: 'Story not found',
  chapterNotFound: 'Chapter not found',
  unauthorized: 'Unauthorized access',
  serverError: 'Server error, please try again',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  storyCreated: 'Story created successfully',
  rewardClaimed: 'Reward claimed successfully',
  storyPublished: 'Story published successfully',
  walletConnected: 'Wallet connected successfully',
  transactionConfirmed: 'Transaction confirmed',
} as const;
