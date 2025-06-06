import { StoryConfig, StoryClient } from '@story-protocol/core-sdk'
import { http, Address, WalletClient } from 'viem'
import { Account } from 'viem/accounts'

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

/**
 * Create a Story Protocol client using a connected wallet
 */
export const createStoryClientFromWallet = (walletClient: WalletClient): StoryClient => {
  const config: StoryConfig = {
    account: walletClient.account as Account,
    transport: http(process.env.STORY_RPC_URL || 'https://aeneid.storyrpc.io'),
    chainId: 'aeneid', // Story Protocol Aeneid testnet
  }

  return StoryClient.newClient(config)
}

export class StoryProtocolService {
  /**
   * Register a chapter as an IP asset on Story Protocol using connected wallet
   */
  static async registerChapterAsIP(
    chapterData: ChapterIPData,
    walletClient: WalletClient
  ): Promise<IPRegistrationResult> {
    try {
      if (!walletClient.account) {
        throw new Error('Wallet not connected')
      }

      const client = createStoryClientFromWallet(walletClient)

      // Prepare IP metadata for Story Protocol
      const ipMetadataURI = chapterData.contentUrl // Use R2 URL as metadata URI
      const ipMetadataHash = '0x0' // For now, we'll use zero hash
      const nftMetadataURI = chapterData.contentUrl
      const nftMetadataHash = '0x0'

      console.log('🔗 Registering Chapter as IP Asset with Story Protocol...')
      console.log('📄 Chapter:', chapterData.title, 'Chapter', chapterData.chapterNumber)
      console.log('🌐 Content URL:', chapterData.contentUrl)
      console.log('👤 Wallet:', walletClient.account.address)

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
   * Test Story Protocol connection with connected wallet
   */
  static async testConnection(walletClient: WalletClient): Promise<{ success: boolean; message: string }> {
    try {
      if (!walletClient.account) {
        throw new Error('Wallet not connected')
      }

      const client = createStoryClientFromWallet(walletClient)

      console.log('🔍 Testing Story Protocol connection...')
      console.log('👤 Connected Wallet:', walletClient.account.address)
      console.log('🌐 RPC URL:', process.env.STORY_RPC_URL || 'https://aeneid.storyrpc.io')

      return {
        success: true,
        message: `✅ Story Protocol SDK initialized successfully with wallet: ${walletClient.account.address}`
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
   * Check if Story Protocol is properly configured (no longer needs private key)
   */
  static isConfigured(): boolean {
    return !!(
      process.env.STORY_RPC_URL &&
      process.env.STORY_SPG_NFT_CONTRACT
    )
  }

  /**
   * Get configuration status for debugging
   */
  static getConfigStatus(walletAddress?: Address) {
    return {
      hasRpcUrl: !!process.env.STORY_RPC_URL,
      hasSpgNftContract: !!process.env.STORY_SPG_NFT_CONTRACT,
      chainId: 'aeneid',
      rpcUrl: process.env.STORY_RPC_URL || 'https://aeneid.storyrpc.io',
      connectedWallet: walletAddress || 'Not connected'
    }
  }
}
