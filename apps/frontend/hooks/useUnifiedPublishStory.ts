import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Address, Hash } from 'viem'
import { apiClient } from '@/lib/api-client'
import { PublishResult } from '@/lib/contracts/storyProtocol'
import { createClientStoryProtocolService } from '@/lib/services/storyProtocolClient'

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
  licenseTier: 'free' | 'reading' | 'premium' | 'exclusive'
}

type UnifiedPublishStep =
  | 'idle'
  | 'checking-unified-support'
  | 'unified-registration'
  | 'generating-metadata'
  | 'blockchain-transaction'
  | 'saving-to-storage'
  | 'success'
  | 'error'

interface UnifiedPublishResult extends PublishResult {
  method?: 'unified' | 'legacy'
  gasOptimized?: boolean
  metadataUri?: string
}

export function useUnifiedPublishStory() {
  const [currentStep, setCurrentStep] = useState<UnifiedPublishStep>('idle')
  const [publishResult, setPublishResult] = useState<UnifiedPublishResult | null>(null)
  const [isUnifiedSupported, setIsUnifiedSupported] = useState<boolean | null>(null)
  const [tokenId, setTokenId] = useState<bigint | null>(null)
  const [ipAssetId, setIPAssetId] = useState<Address | null>(null)

  const { address } = useAccount()

  // Check unified registration support on mount
  useEffect(() => {
    checkUnifiedSupport()
  }, [])

  const checkUnifiedSupport = async () => {
    try {
      const response = await apiClient.checkUnifiedRegistration()
      setIsUnifiedSupported(response.enabled && response.available)
      console.log('🔍 Unified registration support:', response)
    } catch (error) {
      console.warn('⚠️ Could not check unified registration support:', error)
      setIsUnifiedSupported(false)
    }
  }

  const publishStoryUnified = async (
    storyData: StoryData, 
    options: PublishOptions, 
    bookId?: string
  ): Promise<UnifiedPublishResult> => {
    console.log('🚀 publishStoryUnified called with:', {
      storyData,
      options,
      bookId,
      address
    })
    
    if (!address) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      setCurrentStep('checking-unified-support')

      // Always use unified registration for IP-protected content
      if (options.ipRegistration && options.publishingOption === 'protected') {
        console.log('🚀 Using unified registration (single transaction)')
        return await executeUnifiedRegistration(storyData, options, bookId)
      } else {
        // Simple publishing without IP registration
        throw new Error('Simple publishing without IP registration is not supported. Please enable IP registration.')
      }

    } catch (error) {
      console.error('❌ Publishing failed:', error)
      setCurrentStep('error')

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Handle common errors
      if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.'
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Operation timed out. Please check your connection and try again.'
      }

      const result: UnifiedPublishResult = {
        success: false,
        error: errorMessage
      }
      setPublishResult(result)
      return result
    }
  }

  const executeUnifiedRegistration = async (
    storyData: StoryData,
    options: PublishOptions,
    bookId?: string
  ): Promise<UnifiedPublishResult> => {
    setCurrentStep('unified-registration')
    console.log('🔗 Executing unified IP registration on client-side...')

    const nftContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT as Address

    if (!nftContract) {
      throw new Error('SPG NFT Contract not configured')
    }

    // Step 1: Generate and store metadata via backend
    setCurrentStep('generating-metadata')
    console.log('📝 Generating metadata...')
    
    const storyForMetadata = {
      id: `${address!.toLowerCase()}-${Date.now()}`,
      title: storyData.title,
      content: storyData.content,
      author: address!,
      genre: storyData.themes[0] || 'Fiction',
      mood: storyData.themes[1] || 'Neutral',
      createdAt: new Date().toISOString()
    }

    let metadataUri: string | undefined
    let metadataHash: Hash | undefined

    try {
      // Call backend to generate and store metadata only
      const metadataResult = await apiClient.generateIPMetadata({
        story: storyForMetadata,
        licenseTier: options.licenseTier
      })

      if (metadataResult.success && metadataResult.data) {
        metadataUri = metadataResult.data.metadataUri
        metadataHash = metadataResult.data.metadataHash as Hash
        console.log('✅ Metadata generated:', { uri: metadataUri, hash: metadataHash })
      }
    } catch (error) {
      console.warn('⚠️ Failed to generate metadata, proceeding without:', error)
    }

    // Step 2: Execute blockchain transaction with user's wallet
    setCurrentStep('blockchain-transaction')
    console.log('🔗 Executing blockchain transaction with user wallet...')

    // Initialize client-side Story Protocol service
    const storyProtocolClient = createClientStoryProtocolService(address!)
    
    try {
      const registrationResult = await storyProtocolClient.mintAndRegisterWithPilTerms({
        spgNftContract: nftContract,
        metadata: {
          ipMetadataURI: metadataUri,
          ipMetadataHash: metadataHash,
          nftMetadataURI: metadataUri,
          nftMetadataHash: metadataHash
        },
        licenseTier: options.licenseTier,
        recipient: address!
      })

      const registeredIPAssetId = registrationResult.ipId as Address
      const transactionHash = registrationResult.txHash as Hash
      const mintedTokenId = BigInt(registrationResult.tokenId || Date.now())

      setTokenId(mintedTokenId)
      setIPAssetId(registeredIPAssetId)

      console.log('✅ Unified registration complete!')
      console.log('🎫 Token ID:', mintedTokenId.toString())
      console.log('📝 IP Asset ID:', registeredIPAssetId)
      console.log('🔗 Transaction:', transactionHash)
      console.log('📄 License Terms ID:', registrationResult.licenseTermsId)
      console.log('🌐 Metadata URI:', metadataUri)

      // Step 3: Save chapter content to R2 storage
      setCurrentStep('saving-to-storage')
      console.log('💾 Saving chapter content to R2 storage...')
      
      // Ensure bookId is in the correct format: authorAddress/slug
      let finalBookId = bookId
      if (!finalBookId) {
        // If no bookId provided, create one with proper format
        const slug = storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        finalBookId = `${address!.toLowerCase()}/${slug}`
      } else if (!finalBookId.includes('/')) {
        // If bookId doesn't have slash, it's likely in wrong format, fix it
        // Extract author address and slug from the bookId
        const parts = finalBookId.split('-')
        if (parts[0].startsWith('0x') && parts[0].length === 42) {
          // Format: 0xaddress-slug-parts -> 0xaddress/slug-parts
          const authorAddr = parts[0]
          const slug = parts.slice(1).join('-')
          finalBookId = `${authorAddr}/${slug}`
        }
      }
      
      const saveResult = await apiClient.saveBookChapter(finalBookId, {
        bookId: finalBookId,
        chapterNumber: storyData.chapterNumber,
        title: storyData.title,
        content: storyData.content,
        wordCount: storyData.wordCount,
        readingTime: storyData.readingTime,
        authorAddress: address!.toLowerCase(),
        authorName: `${address!.slice(-4)}`,
        ipAssetId: registeredIPAssetId,
        transactionHash: transactionHash,
        genre: storyData.themes[0] || 'General',
        generationMethod: 'human' as const
      })

      console.log('✅ Chapter content saved to R2:', saveResult.data?.contentUrl)

      // Success!
      setCurrentStep('success')
      const unifiedResult: UnifiedPublishResult = {
        success: true,
        method: 'unified',
        gasOptimized: true,
        data: {
          transactionHash,
          ipAssetId: registeredIPAssetId,
          tokenId: mintedTokenId,
          licenseTermsId: registrationResult.licenseTermsId ? BigInt(registrationResult.licenseTermsId) : undefined,
          contentUrl: storyData.contentUrl,
          explorerUrl: `https://aeneid.storyscan.io/tx/${transactionHash}`
        },
        metadataUri: metadataUri
      }

      setPublishResult(unifiedResult)
      console.log('🎉 Unified publishing complete!', unifiedResult)
      return unifiedResult
    } catch (error) {
      console.error('❌ Unified registration failed:', error)
      throw error
    }
  }


  const reset = () => {
    setCurrentStep('idle')
    setPublishResult(null)
    setTokenId(null)
    setIPAssetId(null)
  }

  const isPublishing = currentStep !== 'idle' && currentStep !== 'success' && currentStep !== 'error'

  return {
    publishStory: publishStoryUnified,
    reset,
    isPublishing,
    currentStep,
    publishResult,
    tokenId,
    ipAssetId,
    isUnifiedSupported,
    checkUnifiedSupport
  }
}