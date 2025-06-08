/**
 * @fileoverview IP Service configuration for frontend
 * Configures Story Protocol integration for StoryHouse.vip
 */

import {
  createIPService,
  defaultStoryProtocolConfig,
  type StoryProtocolConfig
} from '@storyhouse/shared'

// Environment-based configuration
const storyProtocolConfig: StoryProtocolConfig = {
  ...defaultStoryProtocolConfig,
  chainId: parseInt(process.env.NEXT_PUBLIC_STORY_PROTOCOL_CHAIN_ID || '1315'),
  rpcUrl: process.env.NEXT_PUBLIC_STORY_PROTOCOL_RPC_URL || 'https://aeneid.storyrpc.io',
  apiKey: process.env.STORY_PROTOCOL_API_KEY, // Server-side only

  // Contract addresses (will be populated after deployment)
  contracts: {
    ipAssetRegistry: process.env.NEXT_PUBLIC_IP_ASSET_REGISTRY_ADDRESS as `0x${string}`,
    licensingModule: process.env.NEXT_PUBLIC_LICENSING_MODULE_ADDRESS as `0x${string}`,
    royaltyModule: process.env.NEXT_PUBLIC_ROYALTY_MODULE_ADDRESS as `0x${string}`,
    groupModule: process.env.NEXT_PUBLIC_GROUP_MODULE_ADDRESS as `0x${string}`,
  },
}

// Create IP service instance
export const ipService = createIPService(storyProtocolConfig)

// Feature flags for gradual rollout
export const ipFeatureFlags = {
  enableIPRegistration: process.env.NEXT_PUBLIC_ENABLE_IP_FEATURES === 'true',
  enableCollections: process.env.NEXT_PUBLIC_ENABLE_COLLECTIONS === 'true',
  enableRoyaltyClaims: process.env.NEXT_PUBLIC_ENABLE_ROYALTY_CLAIMS === 'true',
}

// Utility to check if IP features are available
export function areIPFeaturesEnabled(): boolean {
  return ipFeatureFlags.enableIPRegistration && ipService.isAvailable()
}

// Default license configuration
export const defaultLicenseTiers = ipService.getDefaultLicenseTiers()

// Helper function to format TIP token amounts for display
export function formatTipTokens(amount: bigint): string {
  const tipAmount = Number(amount) / 1e18
  return tipAmount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}
