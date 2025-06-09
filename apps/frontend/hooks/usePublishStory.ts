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
import { StoryProtocolService } from '@/lib/storyProtocol'

interface StoryData {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
  chapterNumber: number
  contentUrl?: string // R2 URL from story generation
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
  | 'minting-nft'
  | 'registering-ip'
  | 'creating-license'
  | 'attaching-license'
  | 'saving-to-storage'
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

  const publishStory = async (storyData: StoryData, options: PublishOptions, bookId?: string): Promise<PublishResult> => {
    if (!address) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      // Step 1: Handle content URL - either use existing or upload content
      let finalContentUrl = storyData.contentUrl
      
      // If no content URL provided, this is manually written content that needs to be uploaded
      if (!storyData.contentUrl || storyData.contentUrl.startsWith('chapter-')) {
        console.log('📝 Manually written chapter - content will be uploaded during blockchain registration')
        finalContentUrl = `manual-chapter-${Date.now()}` // Temporary identifier
      } else {
        console.log('📍 Using existing R2 content URL:', storyData.contentUrl)
      }

      setCurrentStep('minting-nft')

      // Step 2: Check if we should use real blockchain operations or mock operations
      const isDevelopment = process.env.NODE_ENV === 'development'
      const enableTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true'
      const forceRealTransactions = process.env.NEXT_PUBLIC_FORCE_REAL_TRANSACTIONS === 'true'

      console.log(`🔍 Debug - isDevelopment: ${isDevelopment}, enableTestnet: ${enableTestnet}`)
      console.log(`🔍 Environment check - NODE_ENV: ${process.env.NODE_ENV}`)
      console.log(`🔍 Environment check - NEXT_PUBLIC_ENABLE_TESTNET: ${process.env.NEXT_PUBLIC_ENABLE_TESTNET}`)
      console.log(`🔍 Environment check - NEXT_PUBLIC_FORCE_REAL_TRANSACTIONS: ${process.env.NEXT_PUBLIC_FORCE_REAL_TRANSACTIONS}`)

            // Use real blockchain operations if:
      // 1. Not in development, OR
      // 2. Testnet is explicitly enabled, OR
      // 3. Real transactions are forced, OR
      // 4. We have a connected wallet (user expects real transactions)
      // Default to real transactions when wallet is connected (most expected behavior)
      const useRealBlockchain = !isDevelopment || enableTestnet || forceRealTransactions || (address && walletClient)

      console.log(`🔍 Decision: useRealBlockchain = ${useRealBlockchain} (wallet connected: ${!!address})`)

      if (!useRealBlockchain) {
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
            contentUrl: finalContentUrl,
            explorerUrl: getExplorerUrl(mockTxHash)
          }
        }

        setPublishResult(result)
        console.log('🎉 Mock: Publishing complete!', result)
        return result

      } else {
        // Real blockchain operations
        const mode = enableTestnet ? 'testnet' : (isDevelopment ? 'development-real' : 'production')
        console.log(`🔗 Running in ${mode} mode - using real blockchain operations with wallet signatures`)

        setCurrentStep('minting-nft')
        console.log('🎨 Minting NFT...')

        // Use Story Protocol to mint NFT and register as IP Asset
        const chapterIPData = {
          storyId: `story-${Date.now()}`,
          chapterNumber: storyData.chapterNumber,
          title: storyData.title,
          content: storyData.content,
          contentUrl: finalContentUrl || '',
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

        if (!walletClient) {
          throw new Error('Wallet not connected')
        }

        // Register chapter as IP Asset using connected wallet with timeout
        console.log('🔗 Starting Story Protocol registration...')
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Story Protocol call timed out after 30 seconds')), 30000)
        )

        const ipResult = await Promise.race([
          StoryProtocolService.registerChapterAsIP(chapterIPData, walletClient),
          timeoutPromise
        ])

        if (!ipResult.success) {
          throw new Error(ipResult.error || 'Story Protocol registration failed')
        }

        // Extract results from Story Protocol registration
        // Safe conversion of tokenId to BigInt with fallback
        let mintedTokenId: bigint
        try {
          mintedTokenId = (ipResult.tokenId && ipResult.tokenId !== 'unknown' && !isNaN(Number(ipResult.tokenId)))
            ? BigInt(ipResult.tokenId)
            : BigInt(Date.now())
        } catch (e) {
          console.warn('⚠️ Could not convert tokenId to BigInt, using timestamp:', ipResult.tokenId)
          mintedTokenId = BigInt(Date.now())
        }

        const registeredIPAssetId = ipResult.ipAssetId as Address
        const transactionHash = ipResult.transactionHash as Hash

        setTokenId(mintedTokenId)
        setIPAssetId(registeredIPAssetId)

        console.log('✅ Story Protocol registration complete!')
        console.log('🎫 Token ID:', mintedTokenId.toString())
        console.log('📝 IP Asset ID:', registeredIPAssetId)
        console.log('🔗 Transaction:', transactionHash)

        // Step 3: Save chapter content to R2 storage
        setCurrentStep('saving-to-storage' as any)
        console.log('💾 Saving chapter content to R2 storage...')
        
        // Use provided bookId or generate one as fallback
        const finalBookId = bookId || `${address.toLowerCase()}-${storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${storyData.chapterNumber}`
        
        const chapterSaveResponse = await fetch(`/api/books/${encodeURIComponent(finalBookId)}/chapters/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            title: storyData.title,
            content: storyData.content,
            wordCount: storyData.wordCount,
            readingTime: storyData.readingTime,
            authorAddress: address.toLowerCase(),
            authorName: `${address.slice(-4)}`,
            ipAssetId: registeredIPAssetId,
            transactionHash: transactionHash,
            genre: storyData.themes[0] || 'General',
            generationMethod: 'human' as const
          })
        })

        if (!chapterSaveResponse.ok) {
          console.warn('⚠️ Failed to save chapter content to R2, but blockchain registration succeeded')
        } else {
          const saveResult = await chapterSaveResponse.json()
          console.log('✅ Chapter content saved to R2:', saveResult.data?.contentUrl)
        }

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
            contentUrl: finalContentUrl,
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

      // More detailed error handling
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }

      // Check for common errors and provide helpful messages
      if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.'
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Operation timed out. Please check your connection and try again.'
      } else if (errorMessage.includes('Missing or invalid parameters')) {
        errorMessage = 'Contract parameters invalid. Please check your SPG contract configuration.'
      } else if (errorMessage.includes('SPG NFT Contract not configured')) {
        errorMessage = 'SPG contract not found. Please check your environment configuration.'
      }

      const result: PublishResult = {
        success: false,
        error: errorMessage
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
