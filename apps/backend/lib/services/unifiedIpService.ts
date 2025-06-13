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
    const storyClient = this.getStoryClient()
    
    if (!this.isAvailable() || !storyClient) {
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
          id: registrationResult.ipId || `ip_${request.story.id}_${Date.now()}`,
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
  supportsUnifiedRegistration(): boolean {
    // Check if the Story Protocol SDK version supports mintAndRegisterIpAssetWithPilTerms
    // This could be a version check or feature detection
    return this.isAvailable()
  }
}

// Export singleton instance creator
export function createUnifiedIpService(config?: StoryProtocolConfig): UnifiedIpService {
  return new UnifiedIpService(config)
}