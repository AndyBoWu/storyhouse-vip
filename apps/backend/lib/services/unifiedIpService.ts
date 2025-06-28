/**
 * @fileoverview Unified IP Service for Story Protocol integration
 * Handles IP asset registration with PIL terms in a single transaction
 */

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import type { Address, Hash } from 'viem'
import type {
  IPAsset,
  LicenseTerms,
  LicenseTier,
  StoryWithIP,
  RegisterIPAssetResponse,
  StoryProtocolConfig
} from '../types/ip'
import type { LicenseTermsConfig } from '../types/shared/ip'
import { IPService } from './ipService'
import { AdvancedStoryProtocolService } from './advancedStoryProtocolService'
import {
  logBlockchainOperation,
  getStoryProtocolConfig
} from '../config/blockchain'
import {
  parseBlockchainError,
  formatErrorForLogging
} from '../utils/blockchainErrors'

export interface UnifiedRegistrationRequest {
  story: StoryWithIP
  nftContract: Address
  account: Address
  licenseTier: 'free' | 'reading' | 'premium' | 'exclusive'
  customConfig?: Partial<LicenseTermsConfig>
  metadataUri?: string
  metadataHash?: Hash
}

export interface UnifiedRegistrationResponse extends RegisterIPAssetResponse {
  licenseTermsId?: string
}

export interface DerivativeRegistrationRequest {
  parentIpId: Address
  parentLicenseTermsId: string
  derivativeStory: StoryWithIP
  nftContract: Address
  account: Address
  metadataUri?: string
  metadataHash?: Hash
}

export interface DerivativeRegistrationResponse {
  success: boolean
  error?: string
  ipAsset?: IPAsset
  transactionHash?: string
  parentIpId?: string
  licenseTermsId?: string
}

export class UnifiedIpService extends IPService {
  constructor(config?: StoryProtocolConfig) {
    super(config)
  }

  /**
   * Prepare PIL terms data structure using the AdvancedStoryProtocolService
   */
  private preparePilTermsData(
    tier: 'free' | 'reading' | 'premium' | 'exclusive',
    customConfig?: Partial<LicenseTermsConfig>
  ) {
    return AdvancedStoryProtocolService.preparePilTermsData(tier, customConfig)
  }

  /**
   * Mint NFT, register as IP Asset, and attach PIL terms in a single transaction
   */
  async mintAndRegisterWithPilTerms(
    request: UnifiedRegistrationRequest
  ): Promise<UnifiedRegistrationResponse> {
    console.log('🚀 UnifiedIpService.mintAndRegisterWithPilTerms called')
    
    // Ensure parent class is initialized
    await this.ensureInitialized()
    console.log('✅ Parent class initialization ensured')
    
    const storyClient = this.getStoryClient()
    const isAvailable = this.isAvailable()
    
    console.log('📊 Service status:', {
      isAvailable,
      hasStoryClient: !!storyClient
    })
    
    if (!isAvailable || !storyClient) {
      console.error('❌ Service not available:', {
        isAvailable,
        hasStoryClient: !!storyClient
      })
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      const operation = async () => {
        logBlockchainOperation('UNIFIED_REGISTER_IP_WITH_PIL', {
          storyId: request.story.id,
          nftContract: request.nftContract,
          tierName: request.licenseTier,
          account: request.account
        }, this.getConfig())

        // Prepare PIL terms data
        const pilTermsData = this.preparePilTermsData(
          request.licenseTier,
          request.customConfig
        )

        // Execute unified registration
        const registrationResult = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: request.nftContract,
          licenseTermsData: [pilTermsData],
          ipMetadata: {
            ipMetadataURI: request.metadataUri || '',
            ipMetadataHash: request.metadataHash || '0x0' as Hash,
            nftMetadataURI: request.metadataUri || '',
            nftMetadataHash: request.metadataHash || '0x0' as Hash
          },
          recipient: request.account,
          txOptions: {}
        })

        // Create IP Asset object
        const ipAsset: IPAsset = {
          id: registrationResult.ipId || '',
          address: request.nftContract,
          tokenId: registrationResult.tokenId?.toString() || '0',
          metadata: {
            mediaType: 'text/story' as const,
            title: request.story.title,
            description: request.story.content.substring(0, 200) + '...',
            genre: request.story.genre,
            wordCount: request.story.content.length,
            language: 'en',
            tags: [request.story.genre, request.story.mood],
            createdAt: request.story.createdAt,
            author: request.story.author
          },
          licenseTermsIds: registrationResult.licenseTermsId ? [registrationResult.licenseTermsId.toString()] : []
        }

        return {
          success: true,
          ipAsset,
          transactionHash: registrationResult.txHash as Hash,
          licenseTermsId: registrationResult.licenseTermsId?.toString()
        }
      }

      return await this.executeWithRetry(operation, 'UNIFIED_REGISTER_IP_WITH_PIL')

    } catch (error: any) {
      const blockchainError = parseBlockchainError(error)
      console.error('❌ Unified IP registration failed:', formatErrorForLogging(blockchainError))

      return {
        success: false,
        error: blockchainError.userMessage
      }
    }
  }

  /**
   * Mint NFT, register as IP Asset, and make it a derivative in a single transaction
   * Uses Story Protocol's atomic derivative registration method
   */
  async mintAndRegisterDerivative(
    request: DerivativeRegistrationRequest
  ): Promise<DerivativeRegistrationResponse> {
    console.log('🌿 UnifiedIpService.mintAndRegisterDerivative called')
    console.log('📊 Derivative registration request:', {
      parentIpId: request.parentIpId,
      parentLicenseTermsId: request.parentLicenseTermsId,
      storyTitle: request.derivativeStory.title,
      account: request.account
    })
    
    // Ensure parent class is initialized
    await this.ensureInitialized()
    console.log('✅ Parent class initialization ensured')
    
    const storyClient = this.getStoryClient()
    const isAvailable = this.isAvailable()
    
    if (!isAvailable || !storyClient) {
      console.error('❌ Service not available for derivative registration')
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      const operation = async () => {
        logBlockchainOperation('MINT_AND_REGISTER_DERIVATIVE', {
          parentIpId: request.parentIpId,
          parentLicenseTermsId: request.parentLicenseTermsId,
          derivativeTitle: request.derivativeStory.title,
          account: request.account
        }, this.getConfig())

        // Execute atomic derivative registration
        const registrationResult = await storyClient.ipAsset.mintAndRegisterIpAndMakeDerivative({
          spgNftContract: request.nftContract,
          derivData: {
            parentIpIds: [request.parentIpId],
            licenseTermsIds: [request.parentLicenseTermsId]
          },
          ipMetadata: {
            ipMetadataURI: request.metadataUri || '',
            ipMetadataHash: request.metadataHash || '0x0' as Hash,
            nftMetadataURI: request.metadataUri || '',
            nftMetadataHash: request.metadataHash || '0x0' as Hash
          },
          recipient: request.account,
          txOptions: {}
        })

        console.log('✅ Derivative registration successful:', {
          ipId: registrationResult.ipId,
          tokenId: registrationResult.tokenId,
          txHash: registrationResult.txHash
        })

        // Create IP Asset object for response
        const ipAsset: IPAsset = {
          id: registrationResult.ipId || '',
          address: request.nftContract,
          tokenId: registrationResult.tokenId?.toString() || '0',
          metadata: {
            mediaType: 'text/story' as const,
            title: request.derivativeStory.title,
            description: request.derivativeStory.content.substring(0, 200) + '...',
            genre: request.derivativeStory.genre,
            wordCount: request.derivativeStory.content.length,
            language: 'en',
            tags: [request.derivativeStory.genre, request.derivativeStory.mood, 'derivative'],
            createdAt: request.derivativeStory.createdAt,
            author: request.derivativeStory.author,
            parentIpId: request.parentIpId
          },
          licenseTermsIds: [request.parentLicenseTermsId]
        }

        return {
          success: true,
          ipAsset,
          transactionHash: registrationResult.txHash as Hash,
          parentIpId: request.parentIpId,
          licenseTermsId: request.parentLicenseTermsId
        }
      }

      return await this.executeWithRetry(operation, 'MINT_AND_REGISTER_DERIVATIVE')

    } catch (error: any) {
      const blockchainError = parseBlockchainError(error)
      console.error('❌ Derivative registration failed:', formatErrorForLogging(blockchainError))

      return {
        success: false,
        error: blockchainError.userMessage
      }
    }
  }

  /**
   * Register multiple chapters with PIL terms in batch
   * (Future optimization for registering entire books)
   */
  async batchMintAndRegisterWithPilTerms(
    requests: UnifiedRegistrationRequest[]
  ): Promise<UnifiedRegistrationResponse[]> {
    // Note: Story Protocol may not support batch operations yet
    // This is a placeholder for future optimization
    
    const results: UnifiedRegistrationResponse[] = []
    
    for (const request of requests) {
      const result = await this.mintAndRegisterWithPilTerms(request)
      results.push(result)
      
      // Add delay to avoid rate limiting
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  /**
   * Validate metadata before registration
   */
  private validateMetadata(metadataUri?: string): boolean {
    if (!metadataUri) return true // Optional
    
    // Check if it's a valid R2 URL
    if (metadataUri.startsWith('https://') && metadataUri.includes('.r2.cloudflarestorage.com')) {
      return true
    }
    
    // Check if it's a valid IPFS URL
    if (metadataUri.startsWith('ipfs://') || metadataUri.startsWith('https://ipfs.io/')) {
      return true
    }
    
    return false
  }

  /**
   * Get gas estimate for unified registration
   */
  async estimateUnifiedRegistrationGas(
    request: UnifiedRegistrationRequest
  ): Promise<{ success: boolean; gasEstimate?: bigint; error?: string }> {
    // Ensure parent class is initialized
    await this.ensureInitialized()
    
    const storyClient = this.getStoryClient()
    
    if (!this.isAvailable() || !storyClient) {
      return {
        success: false,
        error: 'Story Protocol SDK not initialized'
      }
    }

    try {
      // Note: This is a placeholder - actual implementation would depend on Story SDK capabilities
      // For now, return a reasonable estimate based on empirical data
      const baseGas = BigInt(500000) // Base gas for minting + registration
      const pilTermsGas = BigInt(200000) // Additional gas for PIL terms
      const totalEstimate = baseGas + pilTermsGas

      return {
        success: true,
        gasEstimate: totalEstimate
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to estimate gas'
      }
    }
  }

  /**
   * Helper method to determine if unified registration is available
   */
  async supportsUnifiedRegistration(): Promise<boolean> {
    // Ensure initialization before checking
    await this.ensureInitialized()
    
    // Check if the Story Protocol SDK version supports mintAndRegisterIpAssetWithPilTerms
    // This could be a version check or feature detection
    return this.isAvailable()
  }
}

// Singleton instance to ensure proper initialization
let unifiedIpServiceInstance: UnifiedIpService | null = null
let initializationPromise: Promise<UnifiedIpService> | null = null

// Export singleton instance creator with initialization guarantee
export function createUnifiedIpService(config?: StoryProtocolConfig): UnifiedIpService {
  if (!unifiedIpServiceInstance) {
    unifiedIpServiceInstance = new UnifiedIpService(config)
  }
  return unifiedIpServiceInstance
}

// Alternative: Get initialized service (async)
export async function getInitializedUnifiedIpService(config?: StoryProtocolConfig): Promise<UnifiedIpService> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const service = createUnifiedIpService(config)
      // Wait a bit for the async initialization in the parent class
      await new Promise(resolve => setTimeout(resolve, 1000))
      return service
    })()
  }
  return initializationPromise
}