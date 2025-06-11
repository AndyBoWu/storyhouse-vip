/**
 * @fileoverview IP Service configuration for backend
 * Configures Story Protocol integration for StoryHouse.vip backend
 */

import { StoryClient } from '@story-protocol/core-sdk'
import { http } from 'viem'
import { sepolia } from 'viem/chains'

// Define license tier interfaces
interface LicenseTier {
  name: string
  commercialUse: boolean
  derivativesAllowed: boolean
  commercialRevShare: number
  mintingFee: bigint
  currency: string
}

// Mock IP Service for now since Story Protocol SDK integration is pending
class IPService {
  private client: StoryClient | null = null
  
  constructor() {
    // Initialize Story Protocol client if configured
    if (process.env.STORY_PROTOCOL_API_KEY) {
      try {
        // For now, use a mock implementation
        console.log('Story Protocol client initialization pending SDK update')
      } catch (error) {
        console.error('Failed to initialize Story Protocol client:', error)
      }
    }
  }

  isAvailable(): boolean {
    // Check if Story Protocol is configured and available
    return !!process.env.STORY_PROTOCOL_API_KEY
  }

  getDefaultLicenseTiers(): Record<string, LicenseTier> {
    return {
      free: {
        name: 'Free License',
        commercialUse: false,
        derivativesAllowed: true,
        commercialRevShare: 0,
        mintingFee: BigInt(0),
        currency: 'TIP'
      },
      standard: {
        name: 'Standard License',
        commercialUse: true,
        derivativesAllowed: true,
        commercialRevShare: 5,
        mintingFee: BigInt(50 * 1e18), // 50 TIP
        currency: 'TIP'
      },
      premium: {
        name: 'Premium License',
        commercialUse: true,
        derivativesAllowed: true,
        commercialRevShare: 10,
        mintingFee: BigInt(100 * 1e18), // 100 TIP
        currency: 'TIP'
      },
      exclusive: {
        name: 'Exclusive License',
        commercialUse: true,
        derivativesAllowed: true,
        commercialRevShare: 25,
        mintingFee: BigInt(1000 * 1e18), // 1000 TIP
        currency: 'TIP'
      }
    }
  }

  // Mock implementation for IP Asset registration
  async registerStoryAsIPAsset(
    story: any,
    nftContract: string,
    tokenId: string,
    authorAddress: string
  ): Promise<{
    success: boolean
    ipAsset?: {
      id: string
      tokenContract: string
      tokenId: string
      chainId: string
      metadata?: any
    }
    transactionHash?: string
    error?: string
  }> {
    // Mock successful registration for development
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Story Protocol not configured'
      }
    }

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      success: true,
      ipAsset: {
        id: `0x${Math.random().toString(16).substring(2, 42)}`,
        tokenContract: nftContract,
        tokenId: tokenId,
        chainId: '1315', // Aeneid testnet
        metadata: {
          name: story.title,
          description: story.content.substring(0, 200),
          image: story.bookCoverUrl || '',
          attributes: [
            { trait_type: 'Genre', value: story.genre },
            { trait_type: 'Author', value: authorAddress },
            { trait_type: 'Chapter', value: story.chapterNumber || '1' }
          ]
        }
      },
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    }
  }

  // Mock implementation for license creation
  async createLicenseTermsForTier(
    tier: LicenseTier,
    royaltyPolicy: string,
    authorAddress: string
  ): Promise<{
    success: boolean
    licenseTerms?: {
      id: string
      name: string
      commercialUse: boolean
      derivativesAllowed: boolean
      commercialRevShare: number
    }
    transactionHash?: string
    error?: string
  }> {
    // Mock successful license creation
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Story Protocol not configured'
      }
    }

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      success: true,
      licenseTerms: {
        id: `0x${Math.random().toString(16).substring(2, 42)}`,
        name: tier.name,
        commercialUse: tier.commercialUse,
        derivativesAllowed: tier.derivativesAllowed,
        commercialRevShare: tier.commercialRevShare
      },
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    }
  }

  // Mock implementation for attaching license to IP Asset
  async attachLicenseToIPAsset(
    ipAssetId: string,
    licenseTermsId: string,
    authorAddress: string
  ): Promise<{
    success: boolean
    transactionHash?: string
    error?: string
  }> {
    // Mock successful attachment
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Story Protocol not configured'
      }
    }

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 600))

    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    }
  }
}

// Create and export IP service instance
export const ipService = new IPService()

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

// Helper function to format TIP token amounts for display
export function formatTipTokens(amount: bigint): string {
  const tipAmount = Number(amount) / 1e18
  return tipAmount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}