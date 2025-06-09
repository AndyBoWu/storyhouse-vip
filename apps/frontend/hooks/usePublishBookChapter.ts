import { useState } from 'react'
import { useAccount } from 'wagmi'
import { apiClient } from '@/lib/api-client'
import { usePublishStory } from './usePublishStory'

interface BookChapterData {
  bookId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  readingTime: number
  authorAddress: string
  authorName?: string
  genre?: string
  mood?: string
  contentRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  tags?: string[]
}

interface PublishBookChapterOptions {
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
  | 'validating'
  | 'minting-nft'
  | 'registering-ip'
  | 'creating-license'
  | 'attaching-license'
  | 'saving-to-storage'
  | 'success'
  | 'error'

interface PublishBookChapterResult {
  success: boolean
  data?: {
    bookId: string
    chapterNumber: number
    chapterId: string
    contentUrl: string
    ipAssetId?: string
    transactionHash?: string
    explorerUrl?: string
  }
  error?: string
}

export function usePublishBookChapter() {
  const [currentStep, setCurrentStep] = useState<PublishStep>('idle')
  const [publishResult, setPublishResult] = useState<PublishBookChapterResult | null>(null)
  const { address } = useAccount()
  const { publishStory, reset: resetStoryPublishing } = usePublishStory()

  const publishBookChapter = async (
    chapterData: BookChapterData,
    options: PublishBookChapterOptions
  ): Promise<PublishBookChapterResult> => {
    if (!address) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      setCurrentStep('validating')
      console.log('📝 Starting book chapter publishing for:', chapterData.bookId)

      // Validate chapter data
      if (!chapterData.bookId || !chapterData.title || !chapterData.content) {
        throw new Error('Missing required chapter data')
      }

      // Step 1: Use existing story publishing for blockchain registration
      console.log('🔗 Step 1: Blockchain registration...')
      
      const storyForPublishing = {
        title: chapterData.title,
        content: chapterData.content,
        wordCount: chapterData.wordCount,
        readingTime: chapterData.readingTime,
        themes: chapterData.tags || [],
        chapterNumber: chapterData.chapterNumber,
        contentUrl: `book-chapter-${chapterData.bookId}-${chapterData.chapterNumber}`
      }

      const blockchainResult = await publishStory(storyForPublishing, options)
      
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain registration failed')
      }

      console.log('✅ Blockchain registration successful:', blockchainResult.data)

      // Step 2: Save chapter to R2 storage with blockchain proof
      setCurrentStep('saving-to-storage')
      console.log('💾 Step 2: Saving chapter to R2 storage...')

      // Dynamic pricing: first 3 chapters are free
      const isFreeChapter = chapterData.chapterNumber <= 3
      const unlockPrice = isFreeChapter ? 0 : 0.5
      const readReward = isFreeChapter ? 0.05 : 0.1

      const chapterSaveData = {
        bookId: chapterData.bookId,
        chapterNumber: chapterData.chapterNumber,
        title: chapterData.title,
        content: chapterData.content,
        wordCount: chapterData.wordCount,
        readingTime: chapterData.readingTime,
        authorAddress: chapterData.authorAddress,
        authorName: chapterData.authorName,
        genre: chapterData.genre,
        mood: chapterData.mood,
        contentRating: chapterData.contentRating,
        tags: chapterData.tags,
        generationMethod: 'human' as const,
        // Blockchain registration proof
        ipAssetId: blockchainResult.data?.ipAssetId,
        transactionHash: blockchainResult.data?.transactionHash,
        // Economics with dynamic pricing
        unlockPrice,
        readReward,
        licensePrice: options.chapterPrice || 100,
        isFree: isFreeChapter
      }

      const saveResult = await apiClient.saveBookChapter(chapterData.bookId, chapterSaveData)

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save chapter to storage')
      }

      console.log('✅ Chapter saved to R2 storage:', saveResult.data)

      // Success!
      setCurrentStep('success')
      const result: PublishBookChapterResult = {
        success: true,
        data: {
          bookId: chapterData.bookId,
          chapterNumber: chapterData.chapterNumber,
          chapterId: saveResult.data.chapterId,
          contentUrl: saveResult.data.contentUrl,
          ipAssetId: blockchainResult.data?.ipAssetId,
          transactionHash: blockchainResult.data?.transactionHash,
          explorerUrl: blockchainResult.data?.explorerUrl
        }
      }

      setPublishResult(result)
      console.log('🎉 Book chapter publishing complete!', result)
      return result

    } catch (error) {
      console.error('❌ Book chapter publishing failed:', error)
      setCurrentStep('error')

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      const result: PublishBookChapterResult = {
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
    resetStoryPublishing()
  }

  const isPublishing = currentStep !== 'idle' && currentStep !== 'success' && currentStep !== 'error'

  return {
    publishBookChapter,
    reset,
    isPublishing,
    currentStep,
    publishResult
  }
}