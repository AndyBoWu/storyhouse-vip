/**
 * Story Protocol V3 IP Types - Ultra Author-Owned Model
 * Authors own ALL derivative forms (translations, audio, video)
 */

import type { Address, Hash } from 'viem'

/**
 * Service Provider Types
 * All work as contractors with revenue shares, not IP owners
 */
export type ServiceProviderRole = 
  | 'translator'
  | 'narrator'
  | 'video_creator'
  | 'animator'
  | 'comic_artist'

/**
 * Chapter IP - The root of all derivatives
 * Author owns this and ALL derivatives
 */
export interface ChapterIP {
  // Story Protocol identifiers
  ipId: Address
  tokenId: string
  nftContract: Address
  
  // Ownership - ALWAYS the original author
  author: Address // Owns this chapter in ALL forms
  
  // Chapter metadata
  bookId: string
  chapterNumber: number
  title: string
  originalLanguage: string
  content: string
  wordCount: number
  
  // All derivatives owned by author
  derivatives: {
    translations: TranslationDerivative[]
    audioVersions: AudioDerivative[]
    videoVersions: VideoDerivative[]
    otherFormats: OtherDerivative[]
  }
  
  // License configuration
  licenseTermsIds: string[]
  
  // Publishing info
  publishedAt: Date
  lastUpdated: Date
}

/**
 * Translation Derivative - Author owns, translator gets revenue share
 */
export interface TranslationDerivative {
  ipId: Address // Owned by author
  language: string
  
  // Service provider info
  translator: {
    address: Address
    name: string
    revenueShare: number // e.g., 75%
  }
  
  // Quality metrics
  qualityScore: number
  verificationStatus: 'pending' | 'verified' | 'flagged'
  
  // Can have its own audio versions
  audioVersions: AudioDerivative[]
}

/**
 * Audio Derivative - Author owns, narrator gets revenue share
 */
export interface AudioDerivative {
  ipId: Address // Owned by author
  language: string // Language of the audio
  
  // Service provider info
  narrator: {
    address: Address
    name: string
    voiceProfile: 'male' | 'female' | 'neutral' | 'ai'
    revenueShare: number // e.g., 70%
  }
  
  // Audio metadata
  duration: number // seconds
  format: 'mp3' | 'wav' | 'aac'
  quality: 'standard' | 'premium' | 'studio'
  
  // Production info
  productionNotes?: string
  backgroundMusic?: boolean
  soundEffects?: boolean
}

/**
 * Video/Animation Derivative - Author owns, creator gets revenue share
 */
export interface VideoDerivative {
  ipId: Address // Owned by author
  language: string
  
  // Service provider info
  creator: {
    address: Address
    studio?: string
    revenueShare: number // e.g., 60%
  }
  
  // Video metadata
  duration: number // seconds
  format: 'mp4' | 'webm' | 'mov'
  resolution: '720p' | '1080p' | '4k'
  style: 'animation' | 'motion_comic' | 'live_action' | 'ai_generated'
}

/**
 * Service Agreement - Contract between author and service provider
 */
export interface ServiceAgreement {
  id: string
  chapterIpId: Address
  serviceType: ServiceProviderRole
  
  // Parties
  author: Address
  serviceProvider: Address
  
  // Terms
  revenueShare: number // Provider's percentage
  exclusivityPeriod?: number // Optional exclusive period in days
  qualityThreshold: number // Minimum quality score
  deliveryDeadline: Date
  
  // Deliverables
  targetLanguage?: string // For translations/audio
  specifications: {
    [key: string]: any // Flexible specs per service type
  }
  
  // Payment
  upfrontPayment?: bigint // Optional advance
  minimumGuarantee?: bigint // Optional minimum earnings
  bonusThresholds?: {
    views: number
    bonus: bigint
  }[]
  
  // Status
  status: 'proposed' | 'active' | 'delivered' | 'approved' | 'cancelled'
  deliveredWork?: {
    ipId: Address
    submittedAt: Date
    qualityScore: number
  }
}

/**
 * Revenue Distribution Rules
 * Author owns all IPs but shares revenue with service providers
 */
export interface RevenueDistributionRule {
  chapterIpId: Address
  derivativeIpId: Address
  
  distributions: {
    recipient: Address
    role: 'author' | ServiceProviderRole
    percentage: number
    minimumPayout: bigint
  }[]
  
  // Special conditions
  bonusPool?: {
    threshold: bigint // Revenue threshold
    bonusPercentage: number // Extra percentage for providers
  }
}

/**
 * Service Provider Marketplace Listing
 */
export interface ServiceOpportunity {
  id: string
  chapterIpId: Address
  serviceType: ServiceProviderRole
  
  // What author needs
  requirements: {
    languages?: string[] // For translation/audio
    style?: string // For video/animation
    deadline: Date
    qualityThreshold: number
  }
  
  // Compensation
  revenueShare: number
  upfrontPayment?: bigint
  estimatedEarnings: bigint
  
  // Applications
  applications: ServiceApplication[]
  
  // Author preferences
  preferences: {
    experienceLevel: 'beginner' | 'intermediate' | 'professional'
    portfolio: boolean
    nativeLanguage?: boolean // For translations
  }
}

/**
 * Service Provider Application
 */
export interface ServiceApplication {
  applicant: Address
  serviceType: ServiceProviderRole
  
  // Qualifications
  portfolio: string[] // IPFS links to previous work
  experience: {
    yearsActive: number
    completedProjects: number
    averageRating: number
  }
  
  // Proposal
  proposedTimeline: number // days
  proposedRevenueShare: number
  coverLetter?: string
  
  // For specific services
  languages?: string[] // For translators/narrators
  voiceSample?: string // For narrators
  styleExamples?: string[] // For video creators
  
  appliedAt: Date
}

/**
 * Service Provider Profile
 * Reputation system for quality providers
 */
export interface ServiceProviderProfile {
  address: Address
  roles: ServiceProviderRole[]
  
  // Reputation
  totalProjects: number
  averageQualityScore: number
  authorRatings: {
    authorAddress: Address
    rating: number // 1-5
    comment?: string
  }[]
  
  // Specializations
  languages?: string[]
  genres?: string[]
  certifications?: string[]
  
  // Earnings
  totalEarnings: bigint
  activeProjects: number
  
  // Trust level
  trustLevel: 'new' | 'verified' | 'trusted' | 'premium'
  disputes: number
  successRate: number // Percentage of approved deliveries
}

/**
 * Bundled Rights Package
 * Authors can sell complete packages
 */
export interface RightsPackage {
  chapterIpId: Address
  
  includedRights: {
    originalText: boolean
    translations: string[] // Language codes
    audioVersions: string[] // Language codes
    videoRights: boolean
    merchandisingRights: boolean
  }
  
  // Licensing terms
  exclusivity: boolean
  territory: string[] // Countries/regions
  duration: number // Days
  price: bigint
  
  // Revenue share with service providers maintained
  maintainServiceProviderShares: boolean
}