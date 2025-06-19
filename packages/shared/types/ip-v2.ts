/**
 * Story Protocol V2 IP Types - Revised Architecture
 * Author owns all translation IPs with revenue sharing for translators
 */

import type { Address, Hash } from 'viem'

/**
 * Chapter IP - All language versions owned by original author
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
  language: string // ISO 639-1 code
  isOriginal: boolean
  
  // Content
  content: string
  wordCount: number
  
  // Ownership - ALWAYS the original author
  owner: Address // Original author owns ALL language versions
  originalChapterIpId?: Address // Reference to original if this is translation
  
  // Contributors with revenue shares
  contributors: {
    role: 'author' | 'translator' | 'narrator'
    address: Address
    revenueShare: number // Percentage of this IP's revenue
    creditsName: string
  }[]
  
  // License terms
  licenseTermsIds: string[]
  
  // Timestamps
  createdAt: Date
  publishedAt: Date
}

/**
 * Translation Agreement - Defines terms between author and translator
 */
export interface TranslationAgreement {
  id: string
  chapterIpId: Address
  targetLanguage: string
  
  // Parties
  author: Address
  translator: Address
  
  // Terms
  revenueShare: number // Translator's percentage (e.g., 75%)
  exclusivityPeriod?: number // Days of exclusive translation rights
  qualityThreshold: number // Minimum AI quality score required
  
  // Status
  status: 'proposed' | 'active' | 'completed' | 'revoked'
  submittedContent?: string
  qualityScore?: number
  
  // Payment
  upfrontPayment?: bigint // Optional upfront TIP payment
  minimumGuarantee?: bigint // Optional minimum earnings guarantee
  
  // Timestamps
  createdAt: Date
  acceptedAt?: Date
  completedAt?: Date
}

/**
 * Work Submission from Translator
 */
export interface TranslationSubmission {
  agreementId: string
  translatedContent: string
  translatorNotes?: string
  
  // AI Verification Results
  aiQualityScore: number
  plagiarismCheck: {
    passed: boolean
    similarityScore: number
  }
  semanticAccuracy: number
  
  // Author Review
  authorReview?: {
    approved: boolean
    feedback?: string
    requestedChanges?: string[]
    reviewedAt: Date
  }
}

/**
 * Revenue Distribution Configuration
 */
export interface RevenueDistribution {
  chapterIpId: Address
  language: string
  
  distributions: {
    recipient: Address
    role: 'author' | 'translator' | 'platform'
    percentage: number
    accumulated: bigint
    lastClaim: Date
  }[]
  
  // Special conditions
  minimumPayout: bigint // Min amount before distribution
  payoutFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
}

/**
 * Translation Marketplace Listing
 */
export interface TranslationOpportunity {
  chapterIpId: Address
  bookTitle: string
  chapterNumber: number
  chapterTitle: string
  originalLanguage: string
  
  // What author is looking for
  targetLanguages: string[]
  revenueShareOffered: number // e.g., 75%
  upfrontPayment?: bigint
  minimumQualityScore: number
  
  // Demand indicators
  readerRequests: { [language: string]: number }
  estimatedMonthlyRevenue: { [language: string]: bigint }
  
  // Applications
  applications: {
    translator: Address
    language: string
    portfolio?: string[]
    proposedTimeline: number // days
    appliedAt: Date
  }[]
  
  // Author preferences
  requiresNativeTranslator: boolean
  requiresProfessionalExperience: boolean
  preferredGenres?: string[]
}

/**
 * Author's Translation Portfolio
 */
export interface AuthorTranslationPortfolio {
  author: Address
  
  // Overview stats
  totalChapters: number
  languagesCovered: string[]
  totalTranslationRevenue: bigint
  
  // Active translations by language
  translations: {
    [language: string]: {
      chapters: ChapterIP[]
      translator: Address
      totalRevenue: bigint
      averageQuality: number
    }
  }
  
  // Translator relationships
  trustedTranslators: {
    address: Address
    languages: string[]
    chaptersTranslated: number
    averageQuality: number
    totalPaid: bigint
  }[]
}

/**
 * Smart Contract Events for Translation System
 */
export interface TranslationEvents {
  // When author posts translation opportunity
  TranslationOpportunityPosted: {
    chapterIpId: Address
    languages: string[]
    revenueShare: number
  }
  
  // When translator applies
  TranslatorApplied: {
    chapterIpId: Address
    translator: Address
    language: string
  }
  
  // When author accepts translator
  TranslatorAccepted: {
    agreementId: string
    translator: Address
  }
  
  // When translation is submitted
  TranslationSubmitted: {
    agreementId: string
    qualityScore: number
  }
  
  // When author approves translation
  TranslationApproved: {
    chapterIpId: Address
    language: string
    translator: Address
  }
  
  // Revenue distribution
  RevenueDistributed: {
    chapterIpId: Address
    amounts: { recipient: Address; amount: bigint }[]
  }
}