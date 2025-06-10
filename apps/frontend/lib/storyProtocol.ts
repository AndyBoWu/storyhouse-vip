import { StoryConfig, StoryClient } from '@story-protocol/core-sdk'
import { http, Address, WalletClient, custom, createPublicClient, PublicClient, Hex, decodeEventLog } from 'viem'
import { Account } from 'viem/accounts'
import { STORY_PROTOCOL_CONTRACTS } from '@/lib/contracts/storyProtocol'
import { apiClient } from './api-client'

// Aeneid testnet is not a default chain in Viem, so we define it manually.
const aeneid = {
  id: 13371,
  name: 'Aeneid',
  nativeCurrency: {
    decimals: 18,
    name: 'Aeneid',
    symbol: 'SPG',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
    public: {
      http: ['https://aeneid.storyrpc.io'],
    }
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://aeneid.storyscan.io' },
  },
}

// ABI for the IPAssetRegistered event
const ipAssetRegisteredEventAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "caller",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "ipId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "uri",
        "type": "string"
      }
    ],
    "name": "IPAssetRegistered",
    "type": "event"
  }
] as const;

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
  if (!walletClient.account) {
    throw new Error('WalletClient must have an account attached.')
  }

  // To use a wallet like MetaMask, we create a "custom" transport from the
  // walletClient object, which conforms to the EIP-1193 standard.
  const config: StoryConfig = {
    account: walletClient.account,
    transport: custom(walletClient),
    chainId: 'aeneid',
  }

  return StoryClient.newClient(config)
}

// Debug function to check environment variables in browser console
if (typeof window !== 'undefined') {
  (window as any).debugStoryProtocol = () => {
    console.log('🔍 StoryProtocol Debug Info:')
    console.log('  NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT:', process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT)
    console.log('  All environment variables:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')))
  }
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

      // Create proper NFT metadata JSON
      const nftMetadata = {
        name: `${chapterData.title} - Chapter ${chapterData.chapterNumber}`,
        description: `Chapter ${chapterData.chapterNumber} of "${chapterData.title}" story`,
        image: "https://storyhouse.vip/favicon.svg", // Placeholder image
        content_url: chapterData.contentUrl, // Reference to actual story content
        attributes: [
          {
            trait_type: "Chapter Number",
            value: chapterData.chapterNumber
          },
          {
            trait_type: "Story ID",
            value: chapterData.storyId
          },
          {
            trait_type: "Content Rating",
            value: chapterData.metadata.contentRating
          },
          {
            trait_type: "Language",
            value: chapterData.metadata.language
          },
          {
            trait_type: "Quality Score",
            value: chapterData.metadata.qualityScore
          }
        ],
        external_url: chapterData.contentUrl
      }

      // Create a minimal metadata URI that's guaranteed to work with Story Protocol
      let metadataUri: string

      // Try to upload to R2 for proper metadata hosting
      try {
        const formData = new FormData()
        formData.append('content', JSON.stringify(nftMetadata))
        formData.append('storyId', `nft-metadata-${chapterData.storyId}-ch${chapterData.chapterNumber}`)
        formData.append('contentType', 'application/json')
        
        const uploadResponse = await apiClient.uploadContent(formData)

        if (!uploadResponse.success) {
          throw new Error('Failed to upload NFT metadata to R2')
        }

        metadataUri = uploadResponse.url
        console.log('✅ NFT metadata uploaded to R2:', metadataUri)
      } catch (uploadError) {
        console.warn('⚠️ R2 upload failed, using minimal metadata:', uploadError)
        // Use extremely minimal metadata to avoid parameter validation issues
        const minimalMetadata = {
          name: `Chapter ${chapterData.chapterNumber}`,
          description: `Story Chapter`,
          external_url: chapterData.contentUrl
        }
        const jsonString = JSON.stringify(minimalMetadata)
        console.log('📝 Minimal metadata JSON length:', jsonString.length)
        metadataUri = `data:application/json,${encodeURIComponent(jsonString)}`
      }

      // Use shorter URIs for Story Protocol compatibility
      const ipMetadataURI = metadataUri.length > 200 ? chapterData.contentUrl : metadataUri
      const nftMetadataURI = metadataUri.length > 200 ? chapterData.contentUrl : metadataUri

      // Use zero hashes as they're optional for basic registration
      const ipMetadataHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
      const nftMetadataHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

      console.log('🔗 Registering Chapter as IP Asset with Story Protocol...')
      console.log('📄 Chapter:', chapterData.title, 'Chapter', chapterData.chapterNumber)
      console.log('🌐 Content URL:', chapterData.contentUrl)
      console.log('👤 Wallet:', walletClient.account.address)
      console.log('🔗 IP Metadata URI length:', ipMetadataURI.length)
      console.log('🔗 NFT Metadata URI length:', nftMetadataURI.length)

      // Check if SPG NFT contract is configured (use NEXT_PUBLIC_ for client-side access)
      const spgNftContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT
      console.log('🔍 Debug - Environment variables:')
      console.log('   NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT:', process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT)
      console.log('   Using SPG contract:', spgNftContract)

      if (!spgNftContract || spgNftContract === '0x_your_spg_nft_contract_address_optional') {
        throw new Error('SPG NFT Contract not configured. Please deploy an SPG NFT contract or use an existing one.')
      }

      // Prepare registration parameters
      const registrationParams = {
        spgNftContract: spgNftContract as Address,
        recipient: walletClient.account.address,
        ipMetadata: {
          ipMetadataURI,
          ipMetadataHash,
          nftMetadataURI,
          nftMetadataHash
        },
        allowDuplicates: true
      }

      console.log('🔧 Registration parameters:', {
        spgNftContract: registrationParams.spgNftContract,
        recipient: registrationParams.recipient,
        ipMetadataURI: registrationParams.ipMetadata.ipMetadataURI,
        nftMetadataURI: registrationParams.ipMetadata.nftMetadataURI,
        allowDuplicates: registrationParams.allowDuplicates
      })

      // Use mintAndRegisterIp to create both NFT and IP Asset
      console.log('🚀 Calling Story Protocol mintAndRegisterIp...')
      const registrationResult = await client.ipAsset.mintAndRegisterIp(registrationParams)

      console.log('📝 Raw registration result:', registrationResult)

      if (!registrationResult.txHash) {
        throw new Error('Transaction submission failed, no transaction hash returned.')
      }

      // The SDK returns a transaction hash. We must wait for the transaction to be mined.
      console.log('⏰ Waiting for transaction to be mined...', registrationResult.txHash)

      const publicClient = createPublicClient({
        chain: aeneid,
        transport: http('https://aeneid.storyrpc.io'),
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: registrationResult.txHash,
      })

      if (receipt.status !== 'success') {
        throw new Error(`Transaction failed with status: ${receipt.status}`)
      }

      console.log('✅ Transaction mined successfully:', receipt.transactionHash)
      console.log('📊 Total logs in transaction:', receipt.logs.length)

      // Log all contract addresses that emitted events for debugging
      const contractAddresses = Array.from(new Set(receipt.logs.map(log => log.address)))
      console.log('📋 Contracts that emitted events:', contractAddresses)

      // Manually parse the logs to find the IPAssetRegistered event
      let ipId: Hex | undefined = undefined;
      let tokenId: bigint | undefined = undefined;

      // Check ALL logs, not just from IP_ASSET_REGISTRY, since mintAndRegisterIp
      // may emit events from different contracts in the workflow
      for (const log of receipt.logs) {
        try {
          const decodedEvent = decodeEventLog({
            abi: ipAssetRegisteredEventAbi,
            data: log.data,
            topics: log.topics,
          })

          if (decodedEvent.eventName === 'IPAssetRegistered') {
            ipId = decodedEvent.args.ipId
            tokenId = decodedEvent.args.tokenId
            console.log('🎯 Found IPAssetRegistered event from contract:', log.address)
            console.log('📝 Event args:', decodedEvent.args)
            break; // Found the event, no need to continue
          }
        } catch (e) {
          // This log was not the IPAssetRegistered event, continue checking other logs
          // Only log details for contracts we expect might have this event
          if (log.address.toLowerCase() === STORY_PROTOCOL_CONTRACTS.IP_ASSET_REGISTRY.toLowerCase()) {
            console.warn('Could not decode event log from IP Asset Registry. Raw log:', {
              address: log.address,
              topics: log.topics,
              data: log.data,
            })
          }
        }
      }

      // If we still don't have an IP ID, check if Story Protocol SDK returned it directly
      if (!ipId && registrationResult.ipId) {
        console.log('🔄 Using IP ID from Story Protocol SDK response:', registrationResult.ipId)
        ipId = registrationResult.ipId as Hex
      }

      // If we still don't have a token ID, check if Story Protocol SDK returned it
      if (!tokenId && registrationResult.tokenId) {
        console.log('🔄 Using token ID from Story Protocol SDK response:', registrationResult.tokenId)
        tokenId = BigInt(registrationResult.tokenId)
      }

      if (!ipId) {
        // Don't fail completely - the transaction succeeded, so let's return a partial success
        console.warn('⚠️ Could not extract IP ID from transaction logs, but transaction succeeded')
        console.log('📋 Available data in registration result:', Object.keys(registrationResult))

        // Log raw transaction receipt for debugging
        console.log('🔍 Transaction receipt for debugging:', {
          status: receipt.status,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          contractAddresses: contractAddresses,
          logCount: receipt.logs.length
        })

                 // Return success with limited data since the transaction went through
         return {
           success: true,
           ipAssetId: registrationResult.ipId || undefined,
           tokenId: registrationResult.tokenId ? registrationResult.tokenId.toString() : undefined,
           transactionHash: registrationResult.txHash,
           error: 'Transaction successful but could not parse IP ID from logs. Check transaction on explorer.'
         }
      }

      console.log('✅ IP Asset registered:', ipId)
      if(tokenId) console.log('🎫 Token ID:', tokenId)
      console.log('🔗 Transaction:', registrationResult.txHash)

      return {
        success: true,
        ipAssetId: ipId,
        tokenId: tokenId?.toString(),
        transactionHash: registrationResult.txHash
      }

    } catch (error) {
      console.error('❌ Story Protocol registration failed:', error)

      // Enhanced error handling for common Story Protocol issues
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('📋 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
        })

        // Check for common error patterns
        if (errorMessage.includes('Missing or invalid parameters')) {
          errorMessage = 'Story Protocol contract parameters invalid. Check metadata URIs and contract configuration.'
        } else if (errorMessage.includes('revert')) {
          errorMessage = 'Transaction reverted. Check gas limits, contract state, and parameters.'
        } else if (errorMessage.includes('User rejected')) {
          errorMessage = 'Transaction was rejected in wallet. Please try again.'
        } else if (errorMessage.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fees. Please ensure you have enough testnet tokens.'
        } else if (errorMessage.includes('nonce')) {
          errorMessage = 'Transaction nonce issue. Please reset your wallet or try again.'
        }
      }

      return {
        success: false,
        error: errorMessage
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
    const spgContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT
    return !!(
      spgContract &&
      spgContract !== '0x_your_spg_nft_contract_address_optional'
    )
  }

  /**
   * Get configuration status for debugging
   */
  static getConfigStatus(walletAddress?: Address) {
    const spgContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT
    return {
      hasSpgNftContract: !!(spgContract && spgContract !== '0x_your_spg_nft_contract_address_optional'),
      spgNftContract: spgContract || 'Not configured',
      chainId: 'aeneid',
      rpcUrl: 'https://aeneid.storyrpc.io',
      connectedWallet: walletAddress || 'Not connected'
    }
  }
}
