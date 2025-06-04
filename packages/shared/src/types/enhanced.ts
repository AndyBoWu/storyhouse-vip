/**
 * @fileoverview Enhanced types that extend existing StoryHouse.vip types with IP functionality
 * Maintains backward compatibility while adding Story Protocol features
 */

import type { Address, Hash } from 'viem'
import type { Story, Chapter, User } from './index'
import type { LicenseTier, IPAsset, IPOperation } from './ip'

// Enhanced Story type that extends existing Story with IP functionality
export interface EnhancedStory extends Story {
  // IP Asset properties
  ipAssetId?: string
  ipAssetAddress?: Address
  nftTokenId?: string
  licenseTermsIds?: string[]

  // IP registration status
  ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed'
  ipRegistrationTxHash?: Hash
  ipRegistrationError?: string

  // Licensing status
  licenseStatus: 'none' | 'attached' | 'available'
  availableLicenseTypes: LicenseTier[]

  // Enhanced derivative information (extends existing isRemix/originalStoryId)
  derivativeChain?: string[] // Array of parent IP asset IDs
  parentIpAssetId?: string   // Story Protocol parent IP asset

  // Royalty information
  royaltyEarnings: number    // In TIP tokens
  hasClaimableRoyalties: boolean

  // Collection membership
  collections?: string[]     // Array of collection IDs this story belongs to

  // IP-specific metadata
  ipMetadata?: {
    mediaType: 'text/story'
    language: string
    rights?: string
    source?: string
  }
}

// Enhanced Chapter type that extends existing Chapter with IP functionality
export interface EnhancedChapter extends Chapter {
  // IP Asset properties for individual chapters (if registered separately)
  ipAssetId?: string
  ipAssetAddress?: Address
  nftTokenId?: string

  // Chapter-specific IP status
  ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed'
  isPartOfStoryIP: boolean // Whether it's part of the main story IP or separate

  // Enhanced reading metrics for IP tracking
  uniqueReaders?: number
  totalReadingTime?: number // In seconds
  ipReadsCount?: number     // Reads tracked through IP system
}

// Enhanced User type with IP functionality
export interface EnhancedUser extends User {
  // IP-related statistics
  ipAssetsCreated: number
  ipAssetsOwned: number
  licensesOwned: number
  royaltiesEarned: number

  // Collection participation
  collectionsJoined: string[]
  collectionsCreated: string[]

  // IP preferences
  ipPreferences?: {
    defaultLicenseTier: 'standard' | 'premium' | 'exclusive'
    autoRegisterAsIP: boolean
    enableRoyalties: boolean
    joinCollections: boolean
  }
}

// Enhanced RemixLicense that works with both systems
export interface EnhancedRemixLicense {
  id: string

  // Original system data
  originalStoryId: string
  originalCreatorAddress: string
  remixStoryId: string
  remixerAddress: string
  feePercentage: number
  totalFeePaid: number
  timestamp: Date
  transactionHash?: string

  // IP system data
  parentIpAssetId?: string
  childIpAssetId?: string
  licenseTokenId?: string
  licenseTermsId?: string
  storyProtocolTxHash?: Hash

  // License type information
  licenseTier?: 'standard' | 'premium' | 'exclusive'
  isIPLicense: boolean // Whether this uses Story Protocol licensing
}

// Story Collection type for grouping stories
export interface StoryCollection {
  id: string
  name: string
  description: string
  creatorAddress: Address

  // Story Protocol Group info
  groupId?: string
  groupPoolAddress?: Address
  rewardPoolAddress?: Address

  // Collection settings
  isPublic: boolean
  allowContributions: boolean
  requireApproval: boolean

  // Revenue sharing (percentages)
  revenueShare: {
    creator: number      // % to individual creators
    collection: number   // % to collection pool
    platform: number     // % to platform
  }

  // Member management
  creators: Address[]
  stories: string[]      // Story IDs
  ipAssets: string[]     // IP Asset IDs

  // Collection metadata
  genre?: string
  theme?: string
  tags: string[]
  coverImage?: string

  // Stats
  totalEarnings: number
  memberCount: number
  storyCount: number
  totalReads: number

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// IP Operation tracking for user actions
export interface IPOperationRecord extends IPOperation {
  // Additional UI-friendly fields
  displayName: string
  description: string
  canRetry: boolean
  estimatedGas?: bigint

  // Related data for easy display
  storyTitle?: string
  recipientName?: string
  collectionName?: string
}

// Enhanced API response types
export interface EnhancedApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string

  // IP-specific response data
  ipData?: {
    transactionHash?: Hash
    ipAssetId?: string
    gasUsed?: bigint
    operationId?: string
  }
}

// Story creation with IP options
export interface EnhancedStoryCreationParams {
  // Existing parameters
  plotDescription: string
  genre: string
  mood: string
  emoji: string
  maxWords?: number

  // IP registration options
  registerAsIP: boolean
  licenseType: 'standard' | 'premium' | 'exclusive' | 'custom'
  commercialRights: boolean
  derivativeRights: boolean

  // Collection options
  addToCollection?: string // Collection ID
  createNewCollection?: {
    name: string
    description: string
    isPublic: boolean
    revenueShare: {
      creator: number
      collection: number
      platform: number
    }
  }

  // Custom license terms (if licenseType is 'custom')
  customLicense?: {
    price: number // In TIP tokens
    royaltyPercentage: number
    terms: {
      commercialUse: boolean
      derivativesAllowed: boolean
      attribution: boolean
      shareAlike: boolean
      exclusivity: boolean
      territories: string[]
      contentRestrictions: string[]
    }
  }
}

// Enhanced story generation response
export interface EnhancedGeneratedStory {
  title: string
  content: string
  themes: string[]
  wordCount: number
  readingTime: number

  // IP-ready metadata
  suggestedTags: string[]
  suggestedGenre: string
  contentRating: 'G' | 'PG' | 'PG-13' | 'R'
  language: string

  // AI confidence scores
  qualityScore: number    // 0-100
  originalityScore: number // 0-100
  commercialViability: number // 0-100
}

// Reading session with IP tracking
export interface EnhancedReadingSession {
  id: string
  userAddress: Address
  storyId: string
  chapterId: string
  chapterNumber: number

  // Reading tracking
  startTime: Date
  endTime?: Date
  totalReadingTime: number // seconds
  progress: number // 0-100%

  // Reward tracking
  rewardsClaimed: boolean
  rewardAmount: number
  baseReward: number
  streakBonus: number
  qualityBonus: number

  // IP tracking
  ipAssetId?: string
  trackedViaIP: boolean

  // Verification
  minReadTimeReached: boolean
  validSession: boolean

  timestamps: {
    created: Date
    started: Date
    completed?: Date
  }
}

// Analytics and metrics
export interface StoryAnalytics {
  storyId: string

  // Basic metrics
  totalReads: number
  uniqueReaders: number
  averageReadingTime: number
  completionRate: number

  // Revenue metrics
  totalRewards: number
  readerRewards: number
  creatorRewards: number
  remixRoyalties: number

  // IP metrics
  ipAssetViews?: number
  licenseViews?: number
  derivativeCount?: number
  royaltyRevenue?: number

  // Engagement metrics
  likes: number
  shares: number
  comments: number
  bookmarks: number

  // Time-based data
  dailyReads: Record<string, number> // date -> read count
  weeklyTrends: {
    week: string
    reads: number
    revenue: number
  }[]

  lastUpdated: Date
}

// Export helper types for easier usage
export type StoryWithOptionalIP = Story | EnhancedStory
export type ChapterWithOptionalIP = Chapter | EnhancedChapter
export type UserWithOptionalIP = User | EnhancedUser

// Type guards to check if enhanced features are available
export function isEnhancedStory(story: StoryWithOptionalIP): story is EnhancedStory {
  return 'ipRegistrationStatus' in story
}

export function isEnhancedChapter(chapter: ChapterWithOptionalIP): chapter is EnhancedChapter {
  return 'ipRegistrationStatus' in chapter
}

export function isEnhancedUser(user: UserWithOptionalIP): user is EnhancedUser {
  return 'ipAssetsCreated' in user
}

// Migration helpers for converting existing data
export function enhanceStory(story: Story): EnhancedStory {
  return {
    ...story,
    ipRegistrationStatus: 'none',
    licenseStatus: 'none',
    availableLicenseTypes: [],
    royaltyEarnings: 0,
    hasClaimableRoyalties: false,
    collections: []
  }
}

export function enhanceChapter(chapter: Chapter): EnhancedChapter {
  return {
    ...chapter,
    ipRegistrationStatus: 'none',
    isPartOfStoryIP: true
  }
}

export function enhanceUser(user: User): EnhancedUser {
  return {
    ...user,
    ipAssetsCreated: 0,
    ipAssetsOwned: 0,
    licensesOwned: 0,
    royaltiesEarned: 0,
    collectionsJoined: [],
    collectionsCreated: []
  }
}
