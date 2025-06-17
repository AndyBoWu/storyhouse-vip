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
    
    // StoryHouse contracts (5-contract architecture)
    tipToken: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
    rewardsManager: '0xf5ae031ba92295c2ae86a99e88f09989339707e5',
    unifiedRewardsController: '0x741105d6ee9b25567205f57c0e4f1d293f0d00c5',
    chapterAccessController: '0x1bd65ad10b1ca3ed67ae75fcdd3aba256a9918e3',
    hybridRevenueController: '0xd1f7e8c6fd77dadbe946ae3e4141189b39ef7b08',
    spgNftContract: '0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d',
  },
  [storyMainnet.id]: {
    // Mainnet addresses (to be updated when available)
    ipAssetRegistry: '0x0000000000000000000000000000000000000000',
    licensingModule: '0x0000000000000000000000000000000000000000',
    pilTemplate: '0x0000000000000000000000000000000000000000',
    royaltyModule: '0x0000000000000000000000000000000000000000',
    
    tipToken: '0x0000000000000000000000000000000000000000',
    rewardsManager: '0x0000000000000000000000000000000000000000',
    unifiedRewardsController: '0x0000000000000000000000000000000000000000',
    chapterAccessController: '0x0000000000000000000000000000000000000000',
    hybridRevenueController: '0x0000000000000000000000000000000000000000',
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

// BlockchainConfig type expected by IPService
export interface BlockchainConfig {
  chainId: number
  chainName: string
  rpcUrl: string
  explorerUrl: string
  account?: `0x${string}`
  contracts: any
  gasLimits: typeof GAS_LIMITS
  retryConfig: typeof TX_RETRY_CONFIG
}

// Get comprehensive blockchain configuration
export function getBlockchainConfig(chainId?: number): BlockchainConfig {
  const activeChainId = chainId || DEFAULT_CHAIN.id
  const chain = getChainConfig(activeChainId)
  const contracts = getContractAddresses(activeChainId)
  
  return {
    chainId: chain.id,
    chainName: chain.name,
    rpcUrl: chain.rpcUrls.default.http[0],
    explorerUrl: chain.blockExplorers.default.url,
    account: process.env.STORY_PRIVATE_KEY ? `0x${process.env.STORY_PRIVATE_KEY}` as `0x${string}` : undefined,
    contracts,
    gasLimits: GAS_LIMITS,
    retryConfig: TX_RETRY_CONFIG,
    chain,
    explorer: chain.blockExplorers.default.url,
  }
}

// Get Story Protocol specific configuration
export function getStoryProtocolConfig(chainId?: number) {
  const config = getBlockchainConfig(chainId)
  
  return {
    chainId: config.chain.id,
    rpcUrl: config.rpcUrl,
    contracts: {
      ipAssetRegistry: config.contracts.ipAssetRegistry,
      licensingModule: config.contracts.licensingModule,
      pilTemplate: config.contracts.pilTemplate,
      royaltyModule: config.contracts.royaltyModule,
      spgNftContract: config.contracts.spgNftContract,
    },
    gasLimits: config.gasLimits,
  }
}

// Validate blockchain configuration
export function validateBlockchainConfig(chainId?: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    const config = getBlockchainConfig(chainId)
    
    // Check if chain is defined
    if (!config.chain || !config.chain.id) {
      errors.push('Invalid chain configuration')
    }
    
    // Check if RPC URL is available
    if (!config.rpcUrl) {
      errors.push('RPC URL not configured')
    }
    
    // Check if core contracts are configured
    const requiredContracts = ['ipAssetRegistry', 'licensingModule', 'spgNftContract']
    for (const contract of requiredContracts) {
      if (!config.contracts[contract as keyof typeof config.contracts] || 
          config.contracts[contract as keyof typeof config.contracts] === '0x0000000000000000000000000000000000000000') {
        errors.push(`Contract ${contract} not properly configured`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    errors.push(`Error validating blockchain configuration: ${error}`)
    return {
      isValid: false,
      errors
    }
  }
}

// Log blockchain operations for debugging
export function logBlockchainOperation(
  operation: string,
  details: Record<string, any>,
  chainId?: number
) {
  const config = getBlockchainConfig(chainId)
  const timestamp = new Date().toISOString()
  
  console.log(`[${timestamp}] BLOCKCHAIN_OP: ${operation}`, {
    chain: config.chain.name,
    chainId: config.chain.id,
    explorer: config.explorer,
    ...details
  })
}