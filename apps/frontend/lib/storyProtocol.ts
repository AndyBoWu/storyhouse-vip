import { StoryConfig, StoryClient } from '@story-protocol/core-sdk'
import { http, Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Story Protocol configuration for Aeneid testnet
const account = privateKeyToAccount((process.env.STORY_PRIVATE_KEY || '0x') as `0x${string}`)

const STORY_CONFIG: StoryConfig = {
  account,
  transport: http(process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io'),
  chainId: 'aeneid', // Story Protocol Aeneid testnet
}

// Initialize Story Protocol client
let storyClient: StoryClient | null = null

const getStoryClient = (): StoryClient => {
  if (!storyClient) {
    storyClient = StoryClient.newClient(STORY_CONFIG)
  }
  return storyClient
}

export interface ChapterIPData {
  storyId: string
  chapterNumber: number
  title: string
  content: string
  contentUrl: string
  metadata: {
    suggestedTags: string[]
    suggestedGenre: string
    contentRating: string
    language: string
    qualityScore: number
    originalityScore: number
    commercialViability: number
  }
}

export interface IPRegistrationResult {
  success: boolean
  ipAssetId?: string
  transactionHash?: string
  licenseTermsId?: string
  tokenId?: string
  error?: string
}

export class StoryProtocolService {
  /**
   * Register a chapter as an IP asset on Story Protocol
   */
  static async registerChapterAsIP(
    chapterData: ChapterIPData
  ): Promise<IPRegistrationResult> {
    try {
      const client = getStoryClient()

      // Prepare IP metadata for Story Protocol
      const ipMetadataURI = chapterData.contentUrl // Use R2 URL as metadata URI
      const ipMetadataHash = '0x0' // For now, we'll use zero hash
      const nftMetadataURI = chapterData.contentUrl
      const nftMetadataHash = '0x0'

      console.log('🔗 Registering Chapter as IP Asset with Story Protocol...')
      console.log('📄 Chapter:', chapterData.title, 'Chapter', chapterData.chapterNumber)
      console.log('🌐 Content URL:', chapterData.contentUrl)

      // Use mintAndRegisterIp to create both NFT and IP Asset
      const registrationResult = await client.ipAsset.mintAndRegisterIp({
        spgNftContract: (process.env.STORY_SPG_NFT_CONTRACT || '0x') as Address,
        ipMetadata: {
          ipMetadataURI,
          ipMetadataHash,
          nftMetadataURI,
          nftMetadataHash
        },
        txOptions: {
          waitForTransaction: true
        }
      })

      if (!registrationResult.ipId) {
        throw new Error('IP registration failed - no IP ID returned')
      }

      console.log('✅ IP Asset registered:', registrationResult.ipId)
      console.log('🎫 Token ID:', registrationResult.tokenId)
      console.log('🔗 Transaction:', registrationResult.txHash)

      return {
        success: true,
        ipAssetId: registrationResult.ipId,
        tokenId: registrationResult.tokenId?.toString(),
        transactionHash: registrationResult.txHash
      }

    } catch (error) {
      console.error('❌ Story Protocol registration failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test Story Protocol connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const client = getStoryClient()

      // Basic connectivity test - try to access the client
      console.log('🔍 Testing Story Protocol connection...')
      console.log('📍 Account:', account.address)
      console.log('🌐 RPC URL:', process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io')

      return {
        success: true,
        message: `✅ Story Protocol SDK initialized successfully. Account: ${account.address}`
      }

    } catch (error) {
      console.error('❌ Story Protocol connection test failed:', error)
      return {
        success: false,
        message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check if Story Protocol is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.STORY_PRIVATE_KEY &&
      process.env.STORY_RPC_URL &&
      process.env.STORY_SPG_NFT_CONTRACT
    )
  }

  /**
   * Get configuration status for debugging
   */
  static getConfigStatus() {
    return {
      hasPrivateKey: !!process.env.STORY_PRIVATE_KEY,
      hasRpcUrl: !!process.env.STORY_RPC_URL,
      hasSpgNftContract: !!process.env.STORY_SPG_NFT_CONTRACT,
      chainId: 'aeneid',
      rpcUrl: process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io',
      account: account.address
    }
  }
}
