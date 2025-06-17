/**
 * @fileoverview Client-side Story Protocol SDK service
 * Handles blockchain transactions directly from the browser with user's wallet
 */

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { Address, Hash, createWalletClient, custom, createPublicClient, http } from 'viem'
import { storyTestnet } from '../config/chains'

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
      commercializerCheckerData: '0x' as Hash,
      commercialRevShare: 0,
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
        territoryRights: [],
        distributionChannels: [],
        contentRestrictions: [],
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address,
        mintingFee: 0n,
        currency: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address // TIP token // TIP token
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
        territoryRights: [],
        distributionChannels: [],
        contentRestrictions: [],
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address,
        mintingFee: 500000000000000000n, // 0.5 TIP
        currency: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address // TIP token // TIP token
      },
      premium: {
        ...basePilTerms,
        transferable: true,
        commercialUse: true,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: true,
        derivativesReciprocal: false,
        territoryRights: [],
        distributionChannels: [],
        contentRestrictions: [],
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address, // TODO: Set actual royalty policy
        commercialRevShare: 10, // 10% royalty
        mintingFee: 100000000000000000000n, // 100 TIP
        currency: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address // TIP token
      },
      exclusive: {
        ...basePilTerms,
        transferable: true,
        commercialUse: true,
        commercialAttribution: false,
        derivativesAllowed: true,
        derivativesAttribution: false,
        derivativesApproval: false,
        derivativesReciprocal: false,
        territoryRights: [],
        distributionChannels: [],
        contentRestrictions: [],
        royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address,
        commercialRevShare: 25, // 25% royalty
        mintingFee: 1000000000000000000000n, // 1000 TIP
        currency: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as Address // TIP token
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
        txOptions: {}
      })

      console.log('✅ Unified registration completed:', result)

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