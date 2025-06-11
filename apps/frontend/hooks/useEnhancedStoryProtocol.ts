/**
 * Enhanced Story Protocol Hook with PIL Integration
 * Connects the license UI to actual Story Protocol PIL creation
 */

import { useState } from 'react'
import { useWalletClient } from 'wagmi'
import { Address, Hash } from 'viem'
import { 
  AdvancedStoryProtocolService, 
  LICENSE_TIERS 
} from '@storyhouse/shared'

export interface EnhancedStoryData {
  storyId: string
  chapterNumber: number
  title: string
  content: string
  contentUrl: string
  authorAddress: Address
  authorName?: string
  metadata: {
    suggestedTags: string[]
    suggestedGenre: string
    contentRating: 'G' | 'PG' | 'PG-13' | 'R'
    language: string
    qualityScore: number
    originalityScore: number
    commercialViability: number
    wordCount: number
    estimatedReadingTime: number
    unlockPrice: number
    readReward: number
    licensePrice: number
    royaltyPercentage: number
    preferredLicenseTier: 'free' | 'premium' | 'exclusive'
    commercialRights: boolean
    allowDerivatives: boolean
    mediaType: 'text/story'
    ipfsHash?: string
    r2Url?: string
  }
}

export interface EnhancedPublishResult {
  success: boolean
  data?: {
    ipAssetId: string
    tokenId: string
    transactionHash: Hash
    licenseTermsId?: string
    operationId: string
    registrationTime: Date
    confirmationTime: Date
  }
  error?: string
  retryable?: boolean
}

type PublishStep = 
  | 'idle'
  | 'initializing'
  | 'creating-license'
  | 'registering-ip'
  | 'attaching-license'
  | 'success'
  | 'error'

export function useEnhancedStoryProtocol() {
  const { data: walletClient } = useWalletClient()
  const [currentStep, setCurrentStep] = useState<PublishStep>('idle')
  const [publishResult, setPublishResult] = useState<EnhancedPublishResult | null>(null)
  const [service] = useState(() => new AdvancedStoryProtocolService())

  /**
   * Publish a chapter with enhanced PIL integration
   */
  const publishChapterWithLicense = async (
    storyData: EnhancedStoryData,
    licenseTier: 'free' | 'premium' | 'exclusive' = 'premium'
  ): Promise<EnhancedPublishResult> => {
    if (!walletClient) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      setCurrentStep('initializing')
      console.log('🚀 Starting enhanced Story Protocol publishing...')
      console.log('📄 Story:', storyData.title, 'Chapter', storyData.chapterNumber)
      console.log('🏷️ License Tier:', licenseTier)

      // Initialize the service with wallet
      await service.initialize(walletClient)

      // Step 1: Create license terms for the selected tier
      setCurrentStep('creating-license')
      console.log('🛡️ Creating PIL terms for', licenseTier, 'tier...')
      
      const licenseResult = await service.createChapterLicenseTerms(licenseTier)
      
      if (!licenseResult.success) {
        throw new Error(licenseResult.error || 'Failed to create license terms')
      }

      console.log('✅ PIL terms created:', licenseResult.licenseTermsId)

      // Step 2: Register chapter as IP with enhanced metadata
      setCurrentStep('registering-ip')
      console.log('📝 Registering enhanced chapter IP...')
      
      // Map EnhancedStoryData to EnhancedChapterIPData format
      const enhancedChapterData: import('@storyhouse/shared').EnhancedChapterIPData = {
        storyId: storyData.storyId,
        chapterNumber: storyData.chapterNumber,
        title: storyData.title,
        content: storyData.content,
        contentUrl: storyData.contentUrl,
        isRemix: false, // Default to not a remix
        metadata: {
          ...storyData.metadata,
          authorAddress: storyData.authorAddress,
          authorName: storyData.authorName,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      const ipResult = await service.registerEnhancedChapterIP(
        enhancedChapterData,
        licenseResult.licenseTermsId
      )

      if (!ipResult.success) {
        throw new Error(ipResult.error || 'Failed to register IP')
      }

      setCurrentStep('success')
      console.log('🎉 Enhanced publishing complete!')
      
      const result: EnhancedPublishResult = {
        success: true,
        data: {
          ipAssetId: ipResult.ipAssetId!,
          tokenId: ipResult.tokenId!,
          transactionHash: ipResult.transactionHash!,
          licenseTermsId: licenseResult.licenseTermsId,
          operationId: ipResult.operationId!,
          registrationTime: ipResult.registrationTime!,
          confirmationTime: ipResult.confirmationTime!
        }
      }

      setPublishResult(result)
      return result

    } catch (error) {
      console.error('❌ Enhanced publishing failed:', error)
      setCurrentStep('error')

      let errorMessage = 'Unknown error occurred'
      let retryable = false

      if (error instanceof Error) {
        errorMessage = error.message
        
        // Determine if error is retryable
        if (errorMessage.includes('User rejected') || 
            errorMessage.includes('denied') ||
            errorMessage.includes('insufficient funds') ||
            errorMessage.includes('nonce')) {
          retryable = true
        }
      }

      const result: EnhancedPublishResult = {
        success: false,
        error: errorMessage,
        retryable
      }

      setPublishResult(result)
      return result
    }
  }

  /**
   * Create license terms only (without IP registration)
   */
  const createLicenseTerms = async (
    tier: 'free' | 'premium' | 'exclusive'
  ): Promise<{ success: boolean; licenseTermsId?: string; transactionHash?: Hash; error?: string }> => {
    if (!walletClient) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      await service.initialize(walletClient)
      const result = await service.createChapterLicenseTerms(tier)
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get available license tiers with current pricing
   */
  const getLicenseTiers = () => {
    return service.getLicenseTiers()
  }

  /**
   * Get license tier configuration
   */
  const getLicenseTier = (tier: 'free' | 'premium' | 'exclusive') => {
    return service.getLicenseTier(tier)
  }

  /**
   * Calculate licensing costs
   */
  const calculateLicensingCosts = (
    tier: 'free' | 'premium' | 'exclusive',
    customPrice?: number
  ) => {
    return service.calculateLicensingCosts(tier, customPrice)
  }

  /**
   * Check if service is ready
   */
  const isReady = (): boolean => {
    return !!(walletClient?.account)
  }

  /**
   * Reset state
   */
  const reset = () => {
    setCurrentStep('idle')
    setPublishResult(null)
  }

  const isPublishing = currentStep !== 'idle' && currentStep !== 'success' && currentStep !== 'error'

  return {
    // Core methods
    publishChapterWithLicense,
    createLicenseTerms,
    
    // Configuration methods
    getLicenseTiers,
    getLicenseTier,
    calculateLicensingCosts,
    
    // State
    currentStep,
    publishResult,
    isPublishing,
    isReady: isReady(),
    walletAddress: walletClient?.account?.address,
    
    // Actions
    reset,
    
    // Service instance (for advanced usage)
    service
  }
}

export default useEnhancedStoryProtocol