/**
 * useChapterTranslation Hook
 * Handles chapter translation workflow with Story Protocol
 */

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { StoryClient } from '@story-protocol/core-sdk'
import { parseUnits } from 'viem'
import type { ChapterIP, TranslationLicenseTier } from '@storyhouse/shared/types/ip'

// Translation license tiers with proper Story Protocol configuration
export const TRANSLATION_LICENSE_TIERS: Record<string, TranslationLicenseTier> = {
  preview: {
    id: 'preview',
    name: 'preview',
    commercialUse: false,
    derivativesAllowed: false,
    mintingFee: 0n,
    royaltyPercentage: 0,
    exclusivity: false,
    expirationDays: 0,
    description: 'Read original chapter to prepare translation'
  },
  translator: {
    id: 'translator',
    name: 'translator',
    commercialUse: true,
    derivativesAllowed: true, // Can create translated chapters
    mintingFee: parseUnits('10', 18), // 10 TIP
    royaltyPercentage: 25, // 25% to original chapter
    exclusivity: false,
    expirationDays: 0,
    description: 'Create and monetize chapter translation'
  },
  exclusive_language: {
    id: 'exclusive_language',
    name: 'exclusive_language',
    commercialUse: true,
    derivativesAllowed: true,
    mintingFee: parseUnits('1000', 18), // 1000 TIP
    royaltyPercentage: 25,
    exclusivity: true,
    expirationDays: 365, // 1 year exclusive rights
    description: 'Exclusive translation rights for a language'
  }
}

interface TranslationStep {
  step: 'idle' | 'minting_license' | 'translating' | 'verifying' | 'registering' | 'complete'
  message: string
  progress: number
}

export function useChapterTranslation(storyClient: StoryClient) {
  const { address } = useAccount()
  const [currentStep, setCurrentStep] = useState<TranslationStep>({
    step: 'idle',
    message: '',
    progress: 0
  })
  const [error, setError] = useState<string | null>(null)

  /**
   * Start translation process for a chapter
   */
  const translateChapter = useCallback(async (
    originalChapter: ChapterIP,
    targetLanguage: string,
    translatedContent: string,
    licenseTier: 'translator' | 'exclusive_language' = 'translator'
  ) => {
    if (!address) {
      setError('Please connect your wallet')
      return null
    }

    try {
      setError(null)
      const tier = TRANSLATION_LICENSE_TIERS[licenseTier]

      // Step 1: Mint translation license from original chapter
      setCurrentStep({
        step: 'minting_license',
        message: `Minting ${licenseTier} license...`,
        progress: 20
      })

      const licenseResult = await storyClient.license.mintLicenseTokens({
        licenseTermsId: originalChapter.licenseTermsIds[0], // Assuming first terms allow derivatives
        licenseTemplate: tier.id,
        amount: 1,
        receiver: address,
        txOptions: {
          value: tier.mintingFee // Pay license fee in TIP
        }
      })

      // Step 2: Verify translation quality (call backend AI service)
      setCurrentStep({
        step: 'verifying',
        message: 'Verifying translation quality...',
        progress: 40
      })

      const verificationResult = await verifyTranslationQuality(
        originalChapter.content,
        translatedContent,
        originalChapter.language,
        targetLanguage
      )

      if (verificationResult.flagged) {
        throw new Error(`Translation flagged: ${verificationResult.issues.join(', ')}`)
      }

      // Step 3: Register translation as derivative IP
      setCurrentStep({
        step: 'registering',
        message: 'Registering translation as IP...',
        progress: 60
      })

      const translationIP = await storyClient.ipAsset.registerDerivativeWithLicenseTokens({
        parentIpIds: [originalChapter.ipId],
        licenseTokenIds: [licenseResult.licenseTokenId],
        ipMetadata: {
          ipMetadataURI: await uploadTranslationMetadata({
            originalChapterIpId: originalChapter.ipId,
            content: translatedContent,
            language: targetLanguage,
            translator: address,
            qualityScore: verificationResult.score
          }),
          ipMetadataHash: verificationResult.contentHash
        },
        txOptions: {}
      })

      // Step 4: Set up royalty flow (25% to original)
      setCurrentStep({
        step: 'complete',
        message: 'Translation registered successfully!',
        progress: 100
      })

      // Return the new translation IP
      return {
        ipId: translationIP.ipId,
        tokenId: translationIP.tokenId,
        parentChapterIpId: originalChapter.ipId,
        language: targetLanguage,
        licenseTokenId: licenseResult.licenseTokenId,
        verificationScore: verificationResult.score
      }

    } catch (err: any) {
      setError(err.message || 'Translation failed')
      setCurrentStep({ step: 'idle', message: '', progress: 0 })
      return null
    }
  }, [address, storyClient])

  /**
   * Check if a language translation already exists
   */
  const checkExistingTranslation = useCallback(async (
    chapterIpId: string,
    language: string
  ): Promise<boolean> => {
    try {
      // Query Story Protocol for existing derivatives
      // This would check if a translation for this language already exists
      // Implementation depends on Story Protocol's query capabilities
      return false // Placeholder
    } catch (err) {
      console.error('Error checking existing translation:', err)
      return false
    }
  }, [storyClient])

  /**
   * Get available languages for translation
   */
  const getAvailableLanguages = useCallback(async (
    chapterIpId: string
  ): Promise<string[]> => {
    // Get all supported languages minus existing translations
    const existingLanguages: string[] = [] // Would query from Story Protocol
    return SUPPORTED_LANGUAGES
      .map(l => l.code)
      .filter(code => !existingLanguages.includes(code))
  }, [])

  return {
    translateChapter,
    checkExistingTranslation,
    getAvailableLanguages,
    currentStep,
    error,
    TRANSLATION_LICENSE_TIERS
  }
}

/**
 * Backend API calls for AI services
 */
async function verifyTranslationQuality(
  originalContent: string,
  translatedContent: string,
  sourceLang: string,
  targetLang: string
): Promise<{
  score: number
  flagged: boolean
  issues: string[]
  contentHash: string
}> {
  const response = await fetch('/api/v2/ai/verify-translation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalContent,
      translatedContent,
      sourceLang,
      targetLang
    })
  })

  if (!response.ok) {
    throw new Error('Translation verification failed')
  }

  return response.json()
}

async function uploadTranslationMetadata(metadata: any): Promise<string> {
  const response = await fetch('/api/v2/metadata/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  })

  if (!response.ok) {
    throw new Error('Metadata upload failed')
  }

  const { uri } = await response.json()
  return uri
}

// Re-export for use in components
import { SUPPORTED_LANGUAGES } from '@storyhouse/shared-v2/types/ip'
export { SUPPORTED_LANGUAGES }