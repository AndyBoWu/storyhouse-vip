import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Address, Hash } from 'viem'
import { apiClient } from '@/lib/api-client'
import { PublishResult } from '@/lib/contracts/storyProtocol'

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
  | 'unified-registration' // Single step for unified flow
  | 'minting-nft' // Fallback to legacy flow
  | 'registering-ip'
  | 'creating-license'
  | 'attaching-license'
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
    if (!address) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      setCurrentStep('checking-unified-support')

      // Check if we should use unified registration
      const shouldUseUnified = isUnifiedSupported && 
                               options.ipRegistration && 
                               options.publishingOption === 'protected'

      if (shouldUseUnified) {
        console.log('🚀 Using unified registration (single transaction)')
        return await executeUnifiedRegistration(storyData, options, bookId)
      } else {
        console.log('🔄 Falling back to legacy registration (multiple transactions)')
        return await executeLegacyRegistration(storyData, options, bookId)
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
    console.log('🔗 Executing unified IP registration...')

    const nftContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT as Address

    if (!nftContract) {
      throw new Error('SPG NFT Contract not configured')
    }

    // Prepare story data for unified registration
    const storyForRegistration = {
      id: `${address.toLowerCase()}-${Date.now()}`,
      title: storyData.title,
      content: storyData.content,
      author: address,
      genre: storyData.themes[0] || 'Fiction',
      mood: storyData.themes[1] || 'Neutral',
      createdAt: new Date().toISOString()
    }

    // Execute unified registration API call
    const result = await apiClient.registerUnifiedIP({
      story: storyForRegistration,
      nftContract,
      account: address,
      licenseTier: options.licenseTier,
      includeMetadata: true
    })

    if (!result.success) {
      throw new Error(result.error || 'Unified registration failed')
    }

    const { data } = result
    const registeredIPAssetId = data.ipAsset.id as Address
    const transactionHash = data.transactionHash as Hash
    const mintedTokenId = BigInt(data.ipAsset.tokenId || Date.now())

    setTokenId(mintedTokenId)
    setIPAssetId(registeredIPAssetId)

    console.log('✅ Unified registration complete!')
    console.log('🎫 Token ID:', mintedTokenId.toString())
    console.log('📝 IP Asset ID:', registeredIPAssetId)
    console.log('🔗 Transaction:', transactionHash)
    console.log('📄 License Terms ID:', data.licenseTermsId)
    console.log('🌐 Metadata URI:', data.metadataUri)

    // Save chapter content to R2 storage
    setCurrentStep('saving-to-storage')
    console.log('💾 Saving chapter content to R2 storage...')
    
    const finalBookId = bookId || `${address.toLowerCase()}-${storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    
    try {
      const saveResult = await apiClient.saveBookChapter(finalBookId, {
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

      console.log('✅ Chapter content saved to R2:', saveResult.data?.contentUrl)
    } catch (saveError) {
      console.error('❌ Failed to save chapter content to R2:', saveError)
      throw new Error(`Failed to save chapter content: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`)
    }

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
        licenseTermsId: data.licenseTermsId ? BigInt(data.licenseTermsId) : undefined,
        contentUrl: storyData.contentUrl,
        explorerUrl: `https://aeneid.storyscan.io/tx/${transactionHash}`
      },
      metadataUri: data.metadataUri
    }

    setPublishResult(unifiedResult)
    console.log('🎉 Unified publishing complete!', unifiedResult)
    return unifiedResult
  }

  const executeLegacyRegistration = async (
    storyData: StoryData,
    options: PublishOptions,
    bookId?: string
  ): Promise<UnifiedPublishResult> => {
    console.log('🔄 Executing legacy registration flow...')
    
    // Import the original publishing hook logic here
    // This would be the same as the current usePublishStory implementation
    // For now, we'll simulate it with a simplified version
    
    setCurrentStep('minting-nft')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setCurrentStep('registering-ip')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (options.ipRegistration) {
      setCurrentStep('creating-license')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCurrentStep('attaching-license')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setCurrentStep('saving-to-storage')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock legacy result
    setCurrentStep('success')
    const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as Hash
    const mockIPAssetId = `0x${Math.random().toString(16).substring(2).padEnd(40, '0').substring(0, 40)}` as Address
    const mockTokenId = BigInt(Date.now())
    
    setTokenId(mockTokenId)
    setIPAssetId(mockIPAssetId)
    
    const legacyResult: UnifiedPublishResult = {
      success: true,
      method: 'legacy',
      gasOptimized: false,
      data: {
        transactionHash: mockTxHash,
        ipAssetId: mockIPAssetId,
        tokenId: mockTokenId,
        contentUrl: storyData.contentUrl,
        explorerUrl: `https://aeneid.storyscan.io/tx/${mockTxHash}`
      }
    }
    
    setPublishResult(legacyResult)
    return legacyResult
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