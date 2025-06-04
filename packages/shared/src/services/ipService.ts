/**
 * @fileoverview IP Service for Story Protocol integration
 * Handles IP asset registration, licensing, and royalty management
 *
 * NOTE: This is a service interface. Implementation will be completed
 * once we verify the exact Story Protocol SDK API in the next phase.
 */

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { http } from 'viem'
import type { Address, Hash } from 'viem'
import type {
  IPAsset,
  LicenseTerms,
  LicenseToken,
  LicenseTier,
  StoryWithIP,
  RegisterIPAssetResponse,
  CreateLicenseResponse,
  PurchaseLicenseResponse,
  CreateDerivativeResponse,
  ClaimRoyaltyResponse,
  StoryProtocolConfig
} from '../types/ip'

export class IPService {
  private config: StoryProtocolConfig
  private storyClient: StoryClient | null = null
  private isInitialized: boolean = false

  constructor(config: StoryProtocolConfig) {
    this.config = config
    this.initializeStoryClient()
  }

  /**
   * Initialize Story Protocol SDK client
   */
  private async initializeStoryClient() {
    try {
      const storyConfig: StoryConfig = {
        account: undefined, // Will be set per transaction
        transport: http(this.config.rpcUrl),
        chainId: 'aeneid', // Story Protocol supports 'aeneid' for testnet
      }

      this.storyClient = StoryClient.newClient(storyConfig)
      this.isInitialized = true
      console.log('✅ Story Protocol SDK client initialized for chain:', this.config.chainId)
    } catch (error) {
      console.error('❌ Failed to initialize Story Protocol SDK:', error)
      this.storyClient = null
      this.isInitialized = false
    }
  }

  /**
   * Register a story as an IP Asset on Story Protocol
   */
  async registerStoryAsIPAsset(
    story: StoryWithIP,
    nftContract: Address,
    tokenId: string,
    account: Address
  ): Promise<RegisterIPAssetResponse> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      console.log('🚀 Registering story as IP Asset:', story.id)

      // TODO: Implement actual registration once we verify the SDK API
      // For now, return mock success to enable frontend testing
      const mockIPAsset: IPAsset = {
        id: `ip_${story.id}_${Date.now()}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}` as Address,
        tokenId,
        metadata: {
          mediaType: 'text/story' as const,
          title: story.title,
          description: story.content.substring(0, 200) + '...',
          genre: story.genre,
          wordCount: story.content.length,
          language: 'en',
          tags: [story.genre, story.mood],
          createdAt: story.createdAt,
          author: story.author
        },
        licenseTermsIds: []
      }

      return {
        success: true,
        ipAsset: mockIPAsset,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as Hash
      }
    } catch (error: any) {
      console.error('❌ IP Asset registration failed:', error)
      return {
        success: false,
        error: error.message || 'Registration failed'
      }
    }
  }

  /**
   * Create license terms for a story matching your current tier system
   */
  async createLicenseTermsForTier(
    tier: LicenseTier,
    royaltyPolicyAddress: Address,
    account: Address
  ): Promise<CreateLicenseResponse> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      console.log('📜 Creating license terms for tier:', tier.name)

      // TODO: Implement actual license creation once we verify the SDK API
      const mockLicenseTerms: LicenseTerms = {
        id: `license_${tier.name}_${Date.now()}`,
        transferable: true,
        royaltyPolicy: royaltyPolicyAddress,
        defaultMintingFee: tier.price,
        expiration: 0,
        commercialUse: tier.terms.commercialUse,
        commercialAttribution: tier.terms.attribution,
        derivativesAllowed: tier.terms.derivativesAllowed,
        derivativesAttribution: tier.terms.attribution,
        territories: [],
        distributionChannels: [],
        contentRestrictions: []
      }

      return {
        success: true,
        licenseTerms: mockLicenseTerms,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as Hash
      }
    } catch (error: any) {
      console.error('❌ License terms creation failed:', error)
      return {
        success: false,
        error: error.message || 'License creation failed'
      }
    }
  }

  /**
   * Attach license terms to an IP Asset
   */
  async attachLicenseToIPAsset(
    ipAssetId: string,
    licenseTermsId: string,
    account: Address
  ): Promise<{ success: boolean; transactionHash?: Hash; error?: string }> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      console.log('🔗 Attaching license to IP Asset:', ipAssetId)

      // TODO: Implement actual license attachment
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as Hash
      }
    } catch (error: any) {
      console.error('❌ License attachment failed:', error)
      return {
        success: false,
        error: error.message || 'License attachment failed'
      }
    }
  }

  /**
   * Purchase a license for remixing (mint license token)
   */
  async purchaseRemixLicense(
    ipAssetId: string,
    licenseTermsId: string,
    recipient: Address,
    account: Address
  ): Promise<PurchaseLicenseResponse> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      console.log('💰 Purchasing remix license for IP Asset:', ipAssetId)

      // TODO: Implement actual license purchase
      const mockLicenseToken: LicenseToken = {
        id: `token_${Date.now()}`,
        licenseTermsId,
        licensorIpId: ipAssetId,
        transferable: true,
        mintingFee: BigInt(0),
        owner: recipient
      }

      return {
        success: true,
        licenseToken: mockLicenseToken,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as Hash
      }
    } catch (error: any) {
      console.error('❌ License purchase failed:', error)
      return {
        success: false,
        error: error.message || 'License purchase failed'
      }
    }
  }

  /**
   * Register a remix/derivative story
   */
  async registerDerivativeStory(
    derivativeNftContract: Address,
    derivativeTokenId: string,
    parentIpAssetIds: string[],
    licenseTokenIds: string[],
    account: Address
  ): Promise<CreateDerivativeResponse> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      console.log('🔄 Registering derivative story')

      // TODO: Implement actual derivative registration
      return {
        success: true,
        derivative: {
          childIpId: `child_${Date.now()}`,
          parentIpId: parentIpAssetIds[0] || '',
          licenseTermsId: '',
          licenseTokenId: licenseTokenIds[0] || ''
        },
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as Hash
      }
    } catch (error: any) {
      console.error('❌ Derivative registration failed:', error)
      return {
        success: false,
        error: error.message || 'Derivative registration failed'
      }
    }
  }

  /**
   * Claim royalties for an IP Asset
   */
  async claimRoyalties(
    ipAssetId: string,
    recipient: Address,
    currencyTokens: Address[],
    account: Address
  ): Promise<ClaimRoyaltyResponse> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      console.log('💎 Claiming royalties for IP Asset:', ipAssetId)

      // TODO: Implement actual royalty claiming
      return {
        success: true,
        amount: BigInt('1000000000000000000'), // 1 ETH mock amount
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as Hash
      }
    } catch (error: any) {
      console.error('❌ Royalty claiming failed:', error)
      return {
        success: false,
        error: error.message || 'Royalty claiming failed'
      }
    }
  }

  /**
   * Get IP Asset information
   */
  async getIPAsset(ipAssetId: string): Promise<IPAsset | null> {
    if (!this.isInitialized || !this.storyClient) {
      console.error('Story Protocol SDK not initialized')
      return null
    }

    try {
      // TODO: Implement actual IP asset retrieval
      console.log('Getting IP Asset info:', ipAssetId)
      return null
    } catch (error: any) {
      console.error('❌ Failed to get IP Asset:', error)
      return null
    }
  }

  /**
   * Get license terms information
   */
  async getLicenseTerms(licenseTermsId: string): Promise<LicenseTerms | null> {
    if (!this.isInitialized || !this.storyClient) {
      console.error('Story Protocol SDK not initialized')
      return null
    }

    try {
      // TODO: Implement actual license terms retrieval
      console.log('Getting license terms:', licenseTermsId)
      return null
    } catch (error: any) {
      console.error('❌ Failed to get license terms:', error)
      return null
    }
  }

  /**
   * Get default license tiers configuration matching your current system
   */
  getDefaultLicenseTiers(): Record<string, LicenseTier> {
    return {
      standard: {
        name: 'standard',
        displayName: 'Standard License',
        price: BigInt('100000000000000000000'), // 100 TIP tokens
        royaltyPercentage: 5,
        terms: {
          commercialUse: true,
          derivativesAllowed: true,
          attribution: true,
          shareAlike: false,
          exclusivity: false
        }
      },
      premium: {
        name: 'premium',
        displayName: 'Premium License',
        price: BigInt('500000000000000000000'), // 500 TIP tokens
        royaltyPercentage: 10,
        terms: {
          commercialUse: true,
          derivativesAllowed: true,
          attribution: true,
          shareAlike: false,
          exclusivity: false
        }
      },
      exclusive: {
        name: 'exclusive',
        displayName: 'Exclusive License',
        price: BigInt('2000000000000000000000'), // 2000 TIP tokens
        royaltyPercentage: 20,
        terms: {
          commercialUse: true,
          derivativesAllowed: true,
          attribution: true,
          shareAlike: false,
          exclusivity: true
        }
      }
    }
  }

  /**
   * Check if Story Protocol integration is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.storyClient !== null
  }

  /**
   * Get configuration
   */
  getConfig(): StoryProtocolConfig {
    return this.config
  }

  /**
   * Get Story Protocol SDK client (for advanced operations)
   */
  getStoryClient(): StoryClient | null {
    return this.storyClient
  }

  /**
   * Test Story Protocol connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized || !this.storyClient) {
      return {
        success: false,
        message: 'Story Protocol SDK not initialized'
      }
    }

    try {
      // Simple test to verify the SDK client is working
      console.log('🧪 Testing Story Protocol connection...')

      // TODO: Add actual connection test once we identify the right method
      return {
        success: true,
        message: 'Story Protocol SDK initialized and ready'
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      }
    }
  }
}

// Export singleton instance creator
export function createIPService(config: StoryProtocolConfig): IPService {
  return new IPService(config)
}

// Default configuration for Story Protocol testnet
export const defaultStoryProtocolConfig: StoryProtocolConfig = {
  chainId: 1513, // Story Protocol Odyssey testnet
  rpcUrl: 'https://testnet.storyrpc.io',
  defaultLicenseTiers: {},
  defaultCollectionSettings: {
    revenueShareCreator: 70,
    revenueShareCollection: 20,
    revenueSharePlatform: 10
  }
}
