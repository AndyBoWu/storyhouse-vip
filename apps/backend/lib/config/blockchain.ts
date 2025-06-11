/**
 * Blockchain configuration for Story Protocol integration
 */

import { defineChain } from 'viem'

// Story Protocol Testnet configuration
export const storyTestnet = defineChain({
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
})

// Story Protocol Mainnet configuration (when available)
export const storyMainnet = defineChain({
  id: 1516, // Placeholder - update when mainnet launches
  name: 'Story Protocol Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Story Token',
    symbol: 'STORY',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.storyrpc.io'], // Placeholder
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Protocol Explorer',
      url: 'https://storyscan.xyz', // Placeholder
    },
  },
  testnet: false,
})

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  [storyTestnet.id]: {
    // Story Protocol core contracts
    ipAssetRegistry: '0x28E59E91C0467e89fd0f0438D47Ca839cDfEc095',
    licensingModule: '0x8652b2C6Dbb9b6F31eF5A5De1eB994BC624abF97',
    pilTemplate: '0x7dD80b7c81E44ef5F62d8e1b8C68b1a5A5E5C5F8',
    royaltyModule: '0x6Ef8A46584b69Be6b7bB6Aa3cb3F2c46AE97A2B1',
    
    // StoryHouse contracts
    tipToken: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
    storyRewards: '0xf5ae031ba92295c2ae86a99e88f09989339707e5',
    spgNftContract: '0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d',
  },
  [storyMainnet.id]: {
    // Mainnet addresses (to be updated when available)
    ipAssetRegistry: '0x0000000000000000000000000000000000000000',
    licensingModule: '0x0000000000000000000000000000000000000000',
    pilTemplate: '0x0000000000000000000000000000000000000000',
    royaltyModule: '0x0000000000000000000000000000000000000000',
    
    tipToken: '0x0000000000000000000000000000000000000000',
    storyRewards: '0x0000000000000000000000000000000000000000',
    spgNftContract: '0x0000000000000000000000000000000000000000',
  }
} as const

// Default chain configuration
export const DEFAULT_CHAIN = storyTestnet

// Network configuration helper
export function getChainConfig(chainId: number) {
  switch (chainId) {
    case 1315:
      return storyTestnet
    case 1516:
      return storyMainnet
    default:
      return storyTestnet
  }
}

// Get contract addresses for a specific chain
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[1315]
}

// Gas configuration
export const GAS_LIMITS = {
  ipRegistration: 500000n,
  licenseAttachment: 300000n,
  royaltyClaim: 200000n,
  collectionCreate: 400000n,
} as const

// Transaction retry configuration
export const TX_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // ms
  gasIncreasePercentage: 10, // 10% increase per retry
} as const