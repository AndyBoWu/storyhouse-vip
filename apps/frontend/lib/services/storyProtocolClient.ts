/**
 * @fileoverview Client-side Story Protocol SDK service
 * Handles blockchain transactions directly from the browser with user's wallet
 */

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { Address, Hash, createWalletClient, custom, createPublicClient, http } from 'viem'
import { storyTestnet } from '../config/chains'
import { STORYHOUSE_CONTRACTS } from '../contracts/storyhouse'

export interface ClientStoryProtocolConfig {
  account: Address
  chainId?: number
}

export interface UnifiedRegistrationParams {
  spgNftContract: Address
  metadata: {
    ipMetadataURI?: string
    ipMetadataHash?: Hash
    nftMetadataURI?: string
    nftMetadataHash?: Hash
  }
  licenseTier: 'free' | 'reading' | 'premium' | 'exclusive'
  recipient: Address
}

export interface DerivativeRegistrationParams extends UnifiedRegistrationParams {
  parentIpId: Address
  parentLicenseTermsId: string
}

export class ClientStoryProtocolService {
  private storyClient: StoryClient | null = null
  private account: Address
  private chainId: number

  constructor(config: ClientStoryProtocolConfig) {
    this.account = config.account
    this.chainId = config.chainId || storyTestnet.id
  }

  /**
   * Initialize Story Protocol SDK with user's wallet
   */
  async initialize(): Promise<void> {
    if (this.storyClient) return

    try {
      // Create wallet client with user's connected wallet (MetaMask)
      const walletClient = createWalletClient({
        account: this.account,
        chain: storyTestnet,
        transport: custom(window.ethereum!)
      })

      // Create public client for reading blockchain state
      const publicClient = createPublicClient({
        chain: storyTestnet,
        transport: http(storyTestnet.rpcUrls.default.http[0])
      })

      // Initialize Story Protocol SDK with user's wallet
      const config: StoryConfig = {
        account: this.account,
        transport: custom(window.ethereum!),
        chainId: this.chainId as 1315
      }

      console.log('🔗 Initializing Story Protocol SDK on client-side with config:', {
        account: this.account,
        chainId: this.chainId
      })

      this.storyClient = StoryClient.newClient(config)
      console.log('✅ Story Protocol SDK initialized successfully on client-side!')
    } catch (error) {
      console.error('❌ Failed to initialize Story Protocol SDK on client:', error)
      throw error
    }
  }

  /**
   * Prepare PIL terms data based on license tier
   */
  private preparePilTermsData(tier: 'free' | 'reading' | 'premium' | 'exclusive') {
    // These values should match the backend's preparePilTermsData
    const basePilTerms = {
      commercializerChecker: '0x0000000000000000000000000000000000000000' as Address,
      commercializerCheckerData: '0x0000000000000000000000000000000000000000' as Address, // Must be Address, not Hash
      commercialRevShare: 0,
      commercialRevCeiling: 0n,
      derivativeRevCeiling: 0n,
      expiration: 0n, // Never expires
      uri: ''
    }

    const pilTermsMap = {
      free: {
        ...basePilTerms,
        transferable: true,
        commercialUse: false,
        commercialAttribution: false,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: false,
        derivativesReciprocal: false,
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address, // Zero address - no Story Protocol royalties
        defaultMintingFee: 0n,
        currency: '0x0000000000000000000000000000000000000000' as Address // Zero address - payment handled externally with TIP tokens
      },
      reading: {
        ...basePilTerms,
        transferable: true,
        commercialUse: false,
        commercialAttribution: false,
        derivativesAllowed: false,
        derivativesAttribution: false,
        derivativesApproval: false,
        derivativesReciprocal: false,
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address, // Zero address - no Story Protocol royalties
        defaultMintingFee: 0n, // All fees handled by HybridRevenueController
        currency: '0x0000000000000000000000000000000000000000' as Address // Zero address - payment handled externally with TIP tokens
      },
      premium: {
        ...basePilTerms,
        transferable: true,
        commercialUse: false, // Commercial licensing handled by HybridRevenueController
        commercialAttribution: false, // Must be false when commercialUse is false
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: true,
        derivativesReciprocal: false,
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address, // Zero address - no Story Protocol royalties
        commercialRevShare: 0, // Must be 0 when commercialUse is false
        defaultMintingFee: 0n, // All fees handled by HybridRevenueController
        currency: '0x0000000000000000000000000000000000000000' as Address // Zero address - all payments handled by HybridRevenueController
      },
      exclusive: {
        ...basePilTerms,
        transferable: true,
        commercialUse: false, // Commercial licensing handled by HybridRevenueController
        commercialAttribution: false,
        derivativesAllowed: true,
        derivativesAttribution: false,
        derivativesApproval: false,
        derivativesReciprocal: false,
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address, // Zero address - no Story Protocol royalties
        commercialRevShare: 0, // Must be 0 when commercialUse is false
        defaultMintingFee: 0n, // All fees handled by HybridRevenueController
        currency: '0x0000000000000000000000000000000000000000' as Address // Zero address - all payments handled by HybridRevenueController
      }
    }

    return pilTermsMap[tier]
  }

  /**
   * Execute unified registration with user's wallet
   */
  async mintAndRegisterWithPilTerms(params: UnifiedRegistrationParams) {
    if (!this.storyClient) {
      await this.initialize()
    }

    if (!this.storyClient) {
      throw new Error('Story Protocol SDK not initialized')
    }

    try {
      console.log('🚀 Executing unified registration on client-side...', params)

      // Prepare PIL terms data
      const pilTermsData = this.preparePilTermsData(params.licenseTier)
      console.log('📋 PIL Terms Data:', JSON.stringify(pilTermsData, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))

      // Execute unified registration transaction with user's wallet
      const result = await this.storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: params.spgNftContract,
        licenseTermsData: [{ terms: pilTermsData }],
        ipMetadata: {
          ipMetadataURI: params.metadata.ipMetadataURI || '',
          ipMetadataHash: params.metadata.ipMetadataHash || ('0x0000000000000000000000000000000000000000000000000000000000000000' as Hash),
          nftMetadataURI: params.metadata.nftMetadataURI || '',
          nftMetadataHash: params.metadata.nftMetadataHash || ('0x0000000000000000000000000000000000000000000000000000000000000000' as Hash)
        },
        recipient: params.recipient,
        txOptions: {
          gas: 800000n // Sufficient gas for minting + IP registration + license attachment
        }
      })

      console.log('✅ Unified registration completed:', JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))

      return {
        success: true,
        ipId: result.ipId,
        tokenId: result.tokenId,
        licenseTermsId: result.licenseTermsIds?.[0],
        txHash: result.txHash
      }
    } catch (error) {
      console.error('❌ Unified registration failed:', error)
      throw error
    }
  }

  /**
   * Execute derivative registration with user's wallet
   */
  async mintAndRegisterDerivativeWithPilTerms(params: DerivativeRegistrationParams) {
    if (!this.storyClient) {
      await this.initialize()
    }

    if (!this.storyClient) {
      throw new Error('Story Protocol SDK not initialized')
    }

    try {
      console.log('🌿 Executing derivative registration on client-side...', params)

      // Prepare PIL terms data for the derivative
      const pilTermsData = this.preparePilTermsData(params.licenseTier)
      console.log('📋 PIL Terms Data for derivative:', JSON.stringify(pilTermsData, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))

      // Check if the SDK supports the PIL terms method for derivatives
      let result
      
      if ('mintAndRegisterIpAndMakeDerivativeWithPilTerms' in this.storyClient.ipAsset) {
        console.log('✅ Using mintAndRegisterIpAndMakeDerivativeWithPilTerms (with PIL terms)')
        
        // Use the newer SDK method that supports PIL terms for derivatives
        result = await this.storyClient.ipAsset.mintAndRegisterIpAndMakeDerivativeWithPilTerms({
          spgNftContract: params.spgNftContract,
          derivData: {
            parentIpIds: [params.parentIpId],
            licenseTermsIds: [params.parentLicenseTermsId]
          },
          licenseTermsData: [{ terms: pilTermsData }], // Add PIL terms for the derivative
          ipMetadata: {
            ipMetadataURI: params.metadata.ipMetadataURI || '',
            ipMetadataHash: params.metadata.ipMetadataHash || ('0x0000000000000000000000000000000000000000000000000000000000000000' as Hash),
            nftMetadataURI: params.metadata.nftMetadataURI || '',
            nftMetadataHash: params.metadata.nftMetadataHash || ('0x0000000000000000000000000000000000000000000000000000000000000000' as Hash)
          },
          recipient: params.recipient,
          txOptions: {
            gas: 1000000n // Extra gas for derivative registration with PIL terms
          }
        })
      } else {
        console.log('⚠️ Falling back to mintAndRegisterIpAndMakeDerivative (without PIL terms)')
        
        // Fallback to older method without PIL terms (inherits parent's terms)
        result = await this.storyClient.ipAsset.mintAndRegisterIpAndMakeDerivative({
          spgNftContract: params.spgNftContract,
          derivData: {
            parentIpIds: [params.parentIpId],
            licenseTermsIds: [params.parentLicenseTermsId]
          },
          ipMetadata: {
            ipMetadataURI: params.metadata.ipMetadataURI || '',
            ipMetadataHash: params.metadata.ipMetadataHash || ('0x0000000000000000000000000000000000000000000000000000000000000000' as Hash),
            nftMetadataURI: params.metadata.nftMetadataURI || '',
            nftMetadataHash: params.metadata.nftMetadataHash || ('0x0000000000000000000000000000000000000000000000000000000000000000' as Hash)
          },
          recipient: params.recipient,
          txOptions: {
            gas: 1000000n // Extra gas for derivative registration
          }
        })
      }

      console.log('✅ Derivative registration completed:', JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))

      return {
        success: true,
        ipId: result.ipId,
        tokenId: result.tokenId,
        licenseTermsId: result.licenseTermsIds?.[0] || params.parentLicenseTermsId, // New license terms or inherit parent's
        txHash: result.txHash
      }
    } catch (error) {
      console.error('❌ Derivative registration failed:', error)
      throw error
    }
  }

  /**
   * Check if unified registration is supported
   */
  isSupported(): boolean {
    return true // Client-side always supports unified registration with SDK v1.3.2+
  }
}

// Helper function to create service instance
export function createClientStoryProtocolService(account: Address): ClientStoryProtocolService {
  return new ClientStoryProtocolService({ account })
}