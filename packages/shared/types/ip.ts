/**
 * Story Protocol V2 IP Types
 * Chapter-level IP hierarchy with multi-language support
 */

import type { Address, Hash } from 'viem'

/**
 * Book serves as a collection container for chapters
 * Not an IP itself in v2, just organizational metadata
 */
export interface Book {
  id: string
  title: string
  author: Address
  description: string
  originalLanguage: string
  coverImageUrl?: string
  genre: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Chapter IP - The primary content unit
 * Each chapter in its original language is a root IP
 */
export interface ChapterIP {
  // Story Protocol IP identifiers
  ipId: Address
  tokenId: string
  nftContract: Address
  
  // Chapter metadata
  bookId: string
  chapterNumber: number
  title: string
  language: string // ISO 639-1 code (en, es, zh, etc.)
  isOriginal: boolean // true for original, false for translations
  
  // Content
  content: string
  wordCount: number
  
  // IP relationships
  parentChapterIpId?: Address // For translations
  licenseTermsIds: string[]
  
  // Author/Translator info
  creator: Address
  creatorRole: 'author' | 'translator'
  
  // Timestamps
  createdAt: Date
  publishedAt: Date
}

/**
 * Translation metadata for derivative chapters
 */
export interface TranslationMetadata {
  originalChapterIpId: Address
  sourceLanguage: string
  targetLanguage: string
  translator: Address
  translationType: 'human' | 'ai-assisted' | 'professional'
  qualityScore?: number // 0-100, from AI verification
  verificationStatus: 'pending' | 'verified' | 'flagged'
  verifiedAt?: Date
  licenseTokenId: string // License token used for translation
}

/**
 * License tiers specifically for translation rights
 */
export interface TranslationLicenseTier {
  id: string
  name: 'preview' | 'translator' | 'exclusive_language'
  commercialUse: boolean
  derivativesAllowed: boolean
  mintingFee: bigint
  royaltyPercentage: number // Percentage to original chapter
  exclusivity: boolean
  expirationDays: number // 0 for no expiration
  description: string
}

/**
 * Chapter access control (for readers)
 */
export interface ChapterAccess {
  chapterIpId: Address
  reader: Address
  licenseTokenId?: string
  accessType: 'free' | 'licensed' | 'owned'
  expiresAt?: Date
}

/**
 * Translation opportunity for marketplace
 */
export interface TranslationOpportunity {
  chapterIpId: Address
  bookId: string
  chapterNumber: number
  originalLanguage: string
  missingLanguages: string[]
  demandScore: number // Based on reader requests
  estimatedRevenue: bigint // Potential TIP earnings
  exclusiveRights: { [language: string]: boolean }
}

/**
 * Royalty flow for multi-level hierarchy
 */
export interface RoyaltyFlow {
  fromIpId: Address // Translation or audio version
  toIpId: Address // Original chapter or parent translation
  percentage: number
  currency: Address // TIP token address
  accumulated: bigint
  lastClaim: Date
}

/**
 * AI fraud detection result
 */
export interface FraudDetectionResult {
  contentHash: Hash
  checkType: 'plagiarism' | 'quality' | 'ai_generated'
  score: number // 0-100
  flagged: boolean
  issues: string[]
  similarContent?: {
    ipId: Address
    similarity: number
  }[]
  checkedAt: Date
}

/**
 * Language support configuration
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
] as const

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']