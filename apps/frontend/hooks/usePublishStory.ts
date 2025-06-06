import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useWalletClient } from 'wagmi'
import { Address, Hash } from 'viem'
import { uploadStoryToIPFS } from '@/lib/ipfs/web3storage'
import {
  STORY_PROTOCOL_CONTRACTS,
  IP_ASSET_REGISTRY_ABI,
  LICENSE_REGISTRY_ABI,
  SPG_NFT_ABI,
  createStoryProtocolURI,
  getExplorerUrl,
  getIPAssetUrl,
  DEFAULT_LICENSE_TERMS,
  PublishResult,
  CreateLicenseTermsParams
} from '@/lib/contracts/storyProtocol'

interface StoryData {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
  chapterNumber: number
}

interface PublishOptions {
  publishingOption: 'simple' | 'protected'
  chapterPrice: number
  ipRegistration?: boolean
  licenseTerms?: {
    commercialUse: boolean
    derivativesAllowed: boolean
    commercialRevShare: number
  }
}

type PublishStep =
  | 'idle'
  | 'uploading-ipfs'
  | 'minting-nft'
  | 'registering-ip'
  | 'creating-license'
  | 'attaching-license'
  | 'success'
  | 'error'

export function usePublishStory() {
  const [currentStep, setCurrentStep] = useState<PublishStep>('idle')
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [ipfsHash, setIPFSHash] = useState<string>('')
  const [tokenId, setTokenId] = useState<bigint | null>(null)
  const [ipAssetId, setIPAssetId] = useState<Address | null>(null)

  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { writeContract, data: txHash, error: contractError, isPending } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

    const publishStory = async (storyData: StoryData, options: PublishOptions): Promise<PublishResult> => {
    if (!address) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      setCurrentStep('uploading-ipfs')

      // Step 1: Upload content to IPFS
      console.log('📤 Uploading to IPFS...')
      const ipfsResult = await uploadStoryToIPFS(
        storyData.title,
        storyData.content,
        {
          wordCount: storyData.wordCount,
          readingTime: storyData.readingTime,
          themes: storyData.themes,
          chapterNumber: storyData.chapterNumber,
          author: address
        }
      )

      if (!ipfsResult.success || !ipfsResult.ipfsHash) {
        throw new Error(ipfsResult.error || 'IPFS upload failed')
      }

      setIPFSHash(ipfsResult.ipfsHash)
      console.log('✅ IPFS upload successful:', ipfsResult.ipfsHash)

      // Step 2: Check if we should use real testnet or mock operations
      const isDevelopment = process.env.NODE_ENV === 'development'
      const enableTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true'

      console.log(`🔍 Debug - isDevelopment: ${isDevelopment}, enableTestnet: ${enableTestnet}`)
      console.log(`🔍 Environment check - NODE_ENV: ${process.env.NODE_ENV}`)
      console.log(`🔍 Environment check - NEXT_PUBLIC_ENABLE_TESTNET: ${process.env.NEXT_PUBLIC_ENABLE_TESTNET}`)

      if (isDevelopment && !enableTestnet) {
        console.log('🎭 Running in development mode - using mock blockchain operations')

        // Mock NFT minting
        setCurrentStep('minting-nft')
        console.log('🎨 Mock: Minting NFT...')
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate transaction time

        const mintedTokenId = BigInt(Date.now())
        setTokenId(mintedTokenId)
        console.log('✅ Mock: NFT minted with token ID:', mintedTokenId.toString())

        // Mock IP Asset registration
        setCurrentStep('registering-ip')
        console.log('📝 Mock: Registering IP Asset...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate transaction time

        // Generate a valid mock Ethereum address
        const registeredIPAssetId = `0x${Math.random().toString(16).substring(2).padEnd(40, '0').substring(0, 40)}` as Address
        setIPAssetId(registeredIPAssetId)
        console.log('✅ Mock: IP Asset registered:', registeredIPAssetId)

        // Mock license terms for protected publishing
        let licenseTermsId: bigint | undefined

        if (options.publishingOption === 'protected' && options.ipRegistration && options.licenseTerms) {
          setCurrentStep('creating-license')
          console.log('🛡️ Mock: Creating license terms...')
          await new Promise(resolve => setTimeout(resolve, 1000))

          licenseTermsId = BigInt(Date.now() + 1000)
          console.log('✅ Mock: License terms created:', licenseTermsId.toString())

          setCurrentStep('attaching-license')
          console.log('🔗 Mock: Attaching license terms...')
          await new Promise(resolve => setTimeout(resolve, 1000))

          console.log('✅ Mock: License terms attached to IP Asset')
        }

        // Mock success
        setCurrentStep('success')
        // Generate a proper 64-character hex transaction hash
        const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as Hash
        const result: PublishResult = {
          success: true,
          data: {
            transactionHash: mockTxHash,
            ipAssetId: registeredIPAssetId,
            tokenId: mintedTokenId,
            licenseTermsId,
            ipfsHash: ipfsResult.ipfsHash,
            explorerUrl: getExplorerUrl(mockTxHash)
          }
        }

        setPublishResult(result)
        console.log('🎉 Mock: Publishing complete!', result)
        return result

      } else {
        // Real blockchain operations (production or testnet)
        const mode = enableTestnet ? 'testnet' : 'production'
        console.log(`🔗 Running in ${mode} mode - using real blockchain operations`)

        setCurrentStep('minting-nft')
        console.log('🎨 Minting NFT...')

        const metadataURI = createStoryProtocolURI(ipfsResult.ipfsHash)

        // Use Story Protocol to mint NFT and register as IP Asset
        const chapterIPData = {
          storyId: `story-${Date.now()}`,
          chapterNumber: storyData.chapterNumber,
          title: storyData.title,
          content: storyData.content,
          contentUrl: `https://ipfs.io/ipfs/${ipfsResult.ipfsHash}`,
          metadata: {
            suggestedTags: storyData.themes,
            suggestedGenre: 'Mixed',
            contentRating: 'G',
            language: 'en',
            qualityScore: 85,
            originalityScore: 90,
            commercialViability: 80
          }
        }

                        // Import the Story Protocol service
        const { StoryProtocolService } = await import('@/lib/storyProtocol')

        if (!walletClient) {
          throw new Error('Wallet not connected')
        }

        // Register chapter as IP Asset using connected wallet
        const ipResult = await StoryProtocolService.registerChapterAsIP(chapterIPData, walletClient)

        if (!ipResult.success) {
          throw new Error(ipResult.error || 'Story Protocol registration failed')
        }

        // Extract results from Story Protocol registration
        const mintedTokenId = ipResult.tokenId ? BigInt(ipResult.tokenId) : BigInt(Date.now())
        const registeredIPAssetId = ipResult.ipAssetId as Address
        const transactionHash = ipResult.transactionHash as Hash

        setTokenId(mintedTokenId)
        setIPAssetId(registeredIPAssetId)

        console.log('✅ Story Protocol registration complete!')
        console.log('🎫 Token ID:', mintedTokenId.toString())
        console.log('📝 IP Asset ID:', registeredIPAssetId)
        console.log('🔗 Transaction:', transactionHash)

        // Handle license terms
        let licenseTermsId: bigint | undefined

        if (options.publishingOption === 'protected' && options.ipRegistration && options.licenseTerms) {
          setCurrentStep('creating-license')
          console.log('🛡️ Creating license terms...')

          const licenseTerms: CreateLicenseTermsParams = {
            ...DEFAULT_LICENSE_TERMS,
            commercialUse: options.licenseTerms.commercialUse,
            derivativesAllowed: options.licenseTerms.derivativesAllowed,
            defaultMintingFee: BigInt(Math.floor(options.chapterPrice * 1e18))
          }

          await writeContract({
            address: STORY_PROTOCOL_CONTRACTS.LICENSE_REGISTRY,
            abi: LICENSE_REGISTRY_ABI,
            functionName: 'registerLicenseTerms',
            args: [licenseTerms as any]
          })

          licenseTermsId = BigInt(Date.now() + 1000)
          console.log('✅ License terms created:', licenseTermsId.toString())

          setCurrentStep('attaching-license')
          console.log('🔗 Attaching license terms...')

          await writeContract({
            address: STORY_PROTOCOL_CONTRACTS.LICENSE_REGISTRY,
            abi: LICENSE_REGISTRY_ABI,
            functionName: 'attachLicenseTermsToIp',
            args: [registeredIPAssetId, licenseTermsId]
          })

          console.log('✅ License terms attached to IP Asset')
        }

        // Success!
        setCurrentStep('success')
        const result: PublishResult = {
          success: true,
          data: {
            transactionHash: transactionHash,
            ipAssetId: registeredIPAssetId,
            tokenId: mintedTokenId,
            licenseTermsId,
            ipfsHash: ipfsResult.ipfsHash,
            explorerUrl: getExplorerUrl(transactionHash)
          }
        }

        setPublishResult(result)
        console.log('🎉 Publishing complete!', result)
        return result
      }

    } catch (error) {
      console.error('❌ Publishing failed:', error)
      setCurrentStep('error')
      const result: PublishResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      setPublishResult(result)
      return result
    }
  }

  const reset = () => {
    setCurrentStep('idle')
    setPublishResult(null)
    setIPFSHash('')
    setTokenId(null)
    setIPAssetId(null)
  }

  const isPublishing = currentStep !== 'idle' && currentStep !== 'success' && currentStep !== 'error'

  return {
    publishStory,
    reset,
    isPublishing,
    currentStep,
    publishResult,
    ipfsHash,
    tokenId,
    ipAssetId,
    contractError,
    isPending: isPending || isTxLoading
  }
}
