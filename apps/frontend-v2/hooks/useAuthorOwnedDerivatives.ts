/**
 * useAuthorOwnedDerivatives Hook
 * Manages all derivative creation where author retains ownership
 */

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { StoryClient } from '@story-protocol/core-sdk'
import type { ChapterIP, ServiceProviderRole, ServiceAgreement } from '@storyhouse/shared-v2/types/ip-v3'

export function useAuthorOwnedDerivatives(storyClient: StoryClient) {
  const { address } = useAccount()
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Create any derivative with author ownership
   */
  const createAuthorOwnedDerivative = useCallback(async (
    originalChapterIpId: string,
    derivativeType: 'translation' | 'audio' | 'video',
    serviceProvider: string,
    content: any,
    metadata: any
  ) => {
    if (!address) throw new Error('Wallet not connected')
    setIsProcessing(true)

    try {
      // Step 1: Verify author owns the original chapter
      const chapterOwner = await getIpOwner(originalChapterIpId)
      if (chapterOwner !== address) {
        throw new Error('Only chapter author can create derivatives')
      }

      // Step 2: Register derivative IP with author as owner
      const derivativeIp = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        recipient: address, // AUTHOR owns the derivative!
        ipMetadata: {
          title: metadata.title,
          description: metadata.description,
          ipType: derivativeType,
          parentIpId: originalChapterIpId,
          ...metadata
        },
        licenseTermsData: [{
          commercialUse: true,
          derivativesAllowed: derivativeType === 'translation', // Only translations can have audio
          derivativesReciprocal: true,
          commercialRevShare: 0, // No automatic royalties - handled by agreement
          currency: TIP_TOKEN_ADDRESS
        }]
      })

      // Step 3: Set up revenue sharing for service provider
      await setupRevenueShare({
        ipId: derivativeIp.ipId,
        serviceProvider,
        sharePercentage: getDefaultShareForRole(derivativeType),
        author: address
      })

      // Step 4: Store service agreement on-chain or in metadata
      await storeServiceAgreement({
        chapterIpId: originalChapterIpId,
        derivativeIpId: derivativeIp.ipId,
        serviceProvider,
        serviceType: derivativeType,
        revenueShare: getDefaultShareForRole(derivativeType)
      })

      return {
        success: true,
        derivativeIpId: derivativeIp.ipId,
        txHash: derivativeIp.txHash
      }

    } finally {
      setIsProcessing(false)
    }
  }, [address, storyClient])

  /**
   * Create translation with author ownership
   */
  const createTranslation = useCallback(async (
    chapterIpId: string,
    language: string,
    translatedContent: string,
    translator: string
  ) => {
    return createAuthorOwnedDerivative(
      chapterIpId,
      'translation',
      translator,
      translatedContent,
      {
        language,
        translator,
        translationType: 'human',
        wordCount: translatedContent.split(' ').length
      }
    )
  }, [createAuthorOwnedDerivative])

  /**
   * Create audio version with author ownership
   */
  const createAudioVersion = useCallback(async (
    sourceIpId: string, // Can be original or translation
    language: string,
    audioFileUrl: string,
    narrator: string,
    metadata: {
      duration: number
      voiceProfile: 'male' | 'female' | 'neutral' | 'ai'
      quality: 'standard' | 'premium' | 'studio'
    }
  ) => {
    return createAuthorOwnedDerivative(
      sourceIpId,
      'audio',
      narrator,
      audioFileUrl,
      {
        language,
        narrator,
        format: 'mp3',
        ...metadata
      }
    )
  }, [createAuthorOwnedDerivative])

  /**
   * Get all derivatives for a chapter
   */
  const getChapterDerivatives = useCallback(async (chapterIpId: string) => {
    // Query Story Protocol for all derivatives
    // Group by type (translation, audio, video)
    // Return structured data
    
    return {
      translations: [],
      audioVersions: [],
      videoVersions: []
    }
  }, [storyClient])

  /**
   * Calculate total earnings including all derivatives
   */
  const calculateTotalEarnings = useCallback(async (chapterIpId: string) => {
    const derivatives = await getChapterDerivatives(chapterIpId)
    
    // Sum earnings from:
    // - Original chapter
    // - All translations (25% as royalty)
    // - All audio versions (various shares)
    // - All video versions
    
    return {
      originalEarnings: 0n,
      derivativeEarnings: 0n,
      totalEarnings: 0n,
      breakdown: []
    }
  }, [getChapterDerivatives])

  return {
    createTranslation,
    createAudioVersion,
    createAuthorOwnedDerivative,
    getChapterDerivatives,
    calculateTotalEarnings,
    isProcessing
  }
}

/**
 * Helper functions
 */
function getDefaultShareForRole(role: string): number {
  const shares: Record<string, number> = {
    translation: 75,
    audio: 70,
    video: 60,
    animation: 65,
    comic: 70
  }
  return shares[role] || 50
}

async function getIpOwner(ipId: string): Promise<string> {
  // Query Story Protocol for IP owner
  // This would be implemented based on Story Protocol's API
  return '0x...'
}

async function setupRevenueShare(params: any) {
  // Configure revenue sharing through Story Protocol
  // or custom implementation
}

async function storeServiceAgreement(agreement: any) {
  // Store agreement details
  // Could be on-chain or in decentralized storage
}

const TIP_TOKEN_ADDRESS = '0x...' // Your TIP token address