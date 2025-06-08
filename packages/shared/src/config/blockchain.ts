/**
 * @fileoverview Blockchain Configuration for Story Protocol Integration
 * Handles environment variables, network settings, and gas optimization
 */

import { privateKeyToAccount } from 'viem/accounts'
import type { Address } from 'viem'
import type { StoryProtocolConfig } from '../types/ip'

export interface BlockchainConfig {
  // Network Configuration
  rpcUrl: string
  chainId: number
  chainName: string
  explorerUrl: string

  // Wallet Configuration
  privateKey?: string
  account?: any

  // Gas Configuration
  maxGasPrice: bigint
  maxGasLimit: number
  gasBufferPercentage: number

  // Contract Addresses
  contracts: {
    storyNftContract?: Address
    ipAssetRegistry?: Address
    licensingModule?: Address
    royaltyModule?: Address
    disputeModule?: Address
  }

  // Development Settings
  isDevelopment: boolean
  enableLogging: boolean
  enableGasReporting: boolean
}

/**
 * Get blockchain configuration from environment variables
 */
export function getBlockchainConfig(): BlockchainConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Note: Private keys are no longer used - all blockchain operations happen client-side
  // Users connect their wallets and sign transactions directly
  const privateKey = undefined
  const account = undefined

  return {
    // Network Configuration
    rpcUrl: process.env.STORY_PROTOCOL_RPC_URL || 'https://testnet.storyrpc.io',
    chainId: parseInt(process.env.STORY_PROTOCOL_CHAIN_ID || '1513'),
    chainName: 'Story Protocol Odyssey',
    explorerUrl: 'https://odyssey.storyscan.xyz',

    // Wallet Configuration
    privateKey,
    account,

    // Gas Configuration
    maxGasPrice: BigInt(process.env.MAX_GAS_PRICE || '50000000000'), // 50 gwei
    maxGasLimit: parseInt(process.env.MAX_GAS_LIMIT || '500000'),
    gasBufferPercentage: parseInt(process.env.GAS_BUFFER_PERCENTAGE || '20'),

    // Contract Addresses
    contracts: {
      storyNftContract: (process.env.STORY_NFT_CONTRACT_ADDRESS as Address) || undefined,
      ipAssetRegistry: (process.env.STORY_PROTOCOL_IP_ASSET_REGISTRY as Address) || undefined,
      licensingModule: (process.env.STORY_PROTOCOL_LICENSING_MODULE as Address) || undefined,
      royaltyModule: (process.env.STORY_PROTOCOL_ROYALTY_MODULE as Address) || undefined,
      disputeModule: (process.env.STORY_PROTOCOL_DISPUTE_MODULE as Address) || undefined,
    },

    // Development Settings
    isDevelopment,
    enableLogging: isDevelopment || process.env.ENABLE_BLOCKCHAIN_LOGGING === 'true',
    enableGasReporting: isDevelopment || process.env.ENABLE_GAS_REPORTING === 'true'
  }
}

/**
 * Convert blockchain config to Story Protocol config
 */
export function getStoryProtocolConfig(): StoryProtocolConfig {
  const blockchainConfig = getBlockchainConfig()

  return {
    chainId: blockchainConfig.chainId,
    rpcUrl: blockchainConfig.rpcUrl,
    contracts: blockchainConfig.contracts,
    defaultLicenseTiers: {},
    defaultCollectionSettings: {
      revenueShareCreator: 70,
      revenueShareCollection: 20,
      revenueSharePlatform: 10
    }
  }
}

/**
 * Validate blockchain configuration
 */
export function validateBlockchainConfig(): { isValid: boolean; errors: string[] } {
  const config = getBlockchainConfig()
  const errors: string[] = []

  // Check RPC URL
  if (!config.rpcUrl) {
    errors.push('STORY_PROTOCOL_RPC_URL is required')
  }

  // Check chain ID
  if (!config.chainId || config.chainId <= 0) {
    errors.push('STORY_PROTOCOL_CHAIN_ID must be a positive number')
  }

  // Note: Private keys are no longer required - blockchain operations happen client-side via wallet connections

  // Check gas configuration
  if (config.maxGasPrice <= 0) {
    errors.push('MAX_GAS_PRICE must be positive')
  }

  if (config.maxGasLimit <= 0) {
    errors.push('MAX_GAS_LIMIT must be positive')
  }

  // Warn about missing contract addresses (non-critical for testnet)
  if (!config.contracts.storyNftContract && config.isDevelopment) {
    console.warn('⚠️ STORY_NFT_CONTRACT_ADDRESS not set - using mock contract')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Gas estimation utilities
 */
export function calculateGasWithBuffer(estimatedGas: bigint, bufferPercentage = 20): bigint {
  const buffer = (estimatedGas * BigInt(bufferPercentage)) / BigInt(100)
  return estimatedGas + buffer
}

export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9
  return `${gwei.toFixed(2)} gwei`
}

/**
 * Network utilities
 */
export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1513:
      return 'Story Protocol Odyssey Testnet'
    case 1516:
      return 'Story Protocol Aeneid Testnet'
    case 1:
      return 'Story Protocol Mainnet'
    default:
      return `Unknown Network (${chainId})`
  }
}

export function getExplorerUrl(chainId: number): string {
  switch (chainId) {
    case 1513:
      return 'https://odyssey.storyscan.xyz'
    case 1516:
      return 'https://aeneid.storyscan.xyz'
    case 1:
      return 'https://storyscan.xyz'
    default:
      return ''
  }
}

/**
 * Development utilities
 */
export function logBlockchainOperation(
  operation: string,
  details: Record<string, any>,
  config: BlockchainConfig
) {
  if (!config.enableLogging) return

  console.log(`🔗 [${operation}]`, {
    network: getNetworkName(config.chainId),
    account: config.account?.address,
    ...details
  })
}

export function logGasUsage(
  operation: string,
  gasUsed: bigint,
  gasPrice: bigint,
  config: BlockchainConfig
) {
  if (!config.enableGasReporting) return

  const totalCost = gasUsed * gasPrice
  const costInEth = Number(totalCost) / 1e18

  console.log(`⛽ [${operation}] Gas Usage:`, {
    gasUsed: gasUsed.toString(),
    gasPrice: formatGasPrice(gasPrice),
    totalCost: `${costInEth.toFixed(6)} ETH`
  })
}
