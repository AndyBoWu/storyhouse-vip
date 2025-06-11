/**
 * Temporary local copy of shared types for Vercel deployment
 * TODO: Fix monorepo deployment or publish shared package
 */

import type { Address, Hash } from 'viem'

// ===== CORE STORY TYPES =====

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  authorAddress: string;
  genre: string;
  mood: string;
  emoji: string;
  chapters: Chapter[];
  isRemix: boolean;
  originalStoryId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  readingTime: number;
  totalRewards: number;
  isPublished: boolean;
}

export interface Chapter {
  id: string;
  storyId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
  rewardsDistributed: number;
  createdAt: Date;
}

// ===== IP TYPES =====

export interface LicenseTier {
  name: 'standard' | 'premium' | 'exclusive'
  displayName: string
  price: bigint // In TIP tokens
  royaltyPercentage: number
  terms: {
    commercialUse: boolean
    derivativesAllowed: boolean
    attribution: boolean
    shareAlike: boolean
    exclusivity: boolean
  }
  storyProtocolTermsId?: string // Maps to Story Protocol license terms
}

export interface IPAsset {
  id: string
  address: Address
  tokenId: string
  metadata: IPMetadata
  licenseTermsIds: string[]
  royaltyPolicyAddress?: Address
}

export interface IPMetadata {
  mediaType: 'text/story'
  title: string
  description: string
  genre: string
  wordCount: number
  language: string
  tags: string[]
  createdAt: string
  author: string
}

// ===== ENHANCED TYPES =====

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

  // Enhanced derivative information
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

// ===== COLLECTION TYPES =====

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

// ===== STORY CREATION TYPES =====

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
  
  // License information
  licenseTier?: 'standard' | 'premium' | 'exclusive'
}

// ===== BOOK SYSTEM TYPES =====

export interface BookMetadata {
  // Basic Information
  bookId: string;              // "{authorAddress}-{slug}" format
  title: string;               // "The Detective's Portal: Sci-Fi Adventure"
  description: string;         // Book description
  authorAddress: string;       // "0x5678..."
  authorName: string;          // "Boris" or last 4 chars of address
  slug: string;               // "detective-sf" (URL-safe)
  coverUrl?: string;          // R2 URL to book cover image
  
  // IP Registration
  ipAssetId?: string;         // Story Protocol IP asset ID
  licenseTermsId?: string;    // PIL terms for licensing
  
  // Branching Information
  parentBook?: string;        // "0x1234-detective" (for derivative books)
  branchPoint?: string;       // "ch3" (where branching occurred)
  derivativeBooks: string[];  // ["0x9abc-detective-dark"] (child books)
  
  // Chapter Resolution Map - CORE FEATURE
  chapterMap: {
    [chapterNumber: string]: string; // "ch1": "0x1234-detective/chapters/ch1"
  };
  
  // Revenue Attribution
  originalAuthors: {
    [authorAddress: string]: {
      chapters: string[];       // ["ch1", "ch2", "ch3"]
      revenueShare: number;     // Percentage (0-100)
    };
  };
  
  // Discovery & Analytics
  totalChapters: number;
  genres: string[];
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  isRemixable: boolean;
  createdAt: string;          // ISO string
  updatedAt: string;          // ISO string
  
  // Engagement Metrics
  totalReads: number;
  averageRating: number;      // 0-5 stars
  totalRevenue: number;       // $TIP earned
}

export interface ChapterMetadata {
  // Basic Information
  chapterId: string;          // Unique chapter identifier
  chapterNumber: number;      // Chapter position in book
  title: string;             // Chapter title
  summary: string;           // Brief chapter summary for TOC
  content: string;           // Full chapter content
  
  // Authorship
  authorAddress: string;      // Who wrote this chapter
  authorName: string;         // Display name
  bookId: string;            // Parent book ID
  
  // IP Registration
  ipAssetId?: string;        // Story Protocol chapter IP asset ID
  parentIpAssetId?: string;  // Book IP asset ID (parent)
  
  // Economics
  unlockPrice: number;       // $TIP cost to read
  readReward: number;        // $TIP earned for completion
  licensePrice: number;      // $TIP cost for remix rights
  
  // Content Metrics
  wordCount: number;
  readingTime: number;       // Estimated minutes
  qualityScore?: number;     // AI-generated (0-100)
  originalityScore?: number; // AI-generated (0-100)
  
  // Generation Details
  generationMethod: 'ai' | 'human' | 'hybrid';
  aiPrompt?: string;         // Original prompt if AI-generated
  aiModel?: string;          // "gpt-4" etc.
  
  // Engagement
  totalReads: number;
  averageRating: number;     // 0-5 stars
  totalRevenue: number;      // $TIP earned
  
  // Classification
  genre: string;
  mood: string;
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  tags: string[];
  
  createdAt: string;         // ISO string
  updatedAt: string;         // ISO string
}

// ===== STORAGE TYPES =====

export interface BookStoragePath {
  bookFolder: string;        // "/books/{authorAddress}-{slug}"
  metadataPath: string;      // "{bookFolder}/metadata.json"
  coverPath: string;         // "{bookFolder}/cover.jpg"
  chaptersFolder: string;    // "{bookFolder}/chapters"
}

export interface ChapterStoragePath {
  chapterFolder: string;     // "{bookFolder}/chapters/ch{number}"
  contentPath: string;       // "{chapterFolder}/content.json"
  metadataPath: string;      // "{chapterFolder}/metadata.json"
}

// ===== UTILITY TYPES =====

export type BookId = string;              // "{authorAddress}-{slug}"
export type ChapterId = string;           // Unique chapter identifier
export type AuthorAddress = `0x${string}`; // Ethereum address
export type ChapterNumber = number;       // 1-indexed
export type RevenueShare = number;        // Percentage 0-100

// ===== CONSTANTS =====

export const BOOK_SYSTEM_CONSTANTS = {
  // Storage
  BOOKS_ROOT_PATH: '/books',
  CHAPTERS_FOLDER_NAME: 'chapters',
  METADATA_FILENAME: 'metadata.json',
  COVER_FILENAME: 'cover.jpg',
  
  // Validation
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_SLUG_LENGTH: 50,
  
  // Revenue Sharing (default percentages)
  DEFAULT_CHAPTER_AUTHOR_SHARE: 80,
  DEFAULT_BOOK_CURATOR_SHARE: 10,
  DEFAULT_PLATFORM_SHARE: 10,
  
  // File Upload
  MAX_COVER_SIZE_MB: 5,
  ALLOWED_COVER_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Patterns
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  BOOK_ID_PATTERN: /^0x[a-fA-F0-9]{40}-[a-z0-9-]+$/,
} as const;

// ===== STORY PROTOCOL CONFIG =====

export interface StoryProtocolConfig {
  chainId: number
  rpcUrl: string
  apiKey?: string

  // Contract addresses (if needed for direct interaction)
  contracts?: {
    ipAssetRegistry?: Address
    licensingModule?: Address
    royaltyModule?: Address
    groupModule?: Address
  }

  // Default license tiers
  defaultLicenseTiers: Record<string, LicenseTier>

  // Collection settings
  defaultCollectionSettings: {
    revenueShareCreator: number
    revenueShareCollection: number
    revenueSharePlatform: number
  }
}

// ===== SERVICE CREATION FUNCTIONS =====

// Placeholder for IP service creation (will be implemented locally)
export function createIPService(config: StoryProtocolConfig): {
  isAvailable: () => boolean
  getDefaultLicenseTiers: () => LicenseTier[]
} {
  return {
    isAvailable: () => false, // TODO: Implement actual IP service
    getDefaultLicenseTiers: () => [] // TODO: Implement default tiers
  }
}

// Default configuration
export const defaultStoryProtocolConfig: Partial<StoryProtocolConfig> = {
  chainId: 1315,
  rpcUrl: 'https://aeneid.storyrpc.io',
  defaultLicenseTiers: {},
  defaultCollectionSettings: {
    revenueShareCreator: 70,
    revenueShareCollection: 20,
    revenueSharePlatform: 10
  }
}

// ===== DERIVATIVE ANALYTICS TYPES =====

export interface DerivativeAnalytics {
  storyId: string
  totalDerivatives: number
  totalRevenue: number
  influenceScore: number
  derivatives: {
    id: string
    title: string
    author: string
    similarityScore: number
    qualityScore: number
    revenue: number
    reads: number
    createdAt: string
  }[]
  performanceMetrics: {
    avgRevenuePerDerivative: number
    avgQualityScore: number
    avgSimilarityScore: number
    topPerformingDerivative?: string
  }
  trends: {
    month: string
    derivativesCreated: number
    revenueGenerated: number
  }[]
}

export interface ContentSimilarityAnalysis {
  originalId: string
  derivativeId: string
  overallSimilarity: number
  similarityBreakdown: {
    content: number
    structure: number
    theme: number
    style: number
  }
  confidence: number
  analysisTimestamp: string
  recommendations: string[]
}

export interface InfluenceMetrics {
  authorAddress: string
  totalInfluenceScore: number
  storiesAnalyzed: number
  derivativeStats: {
    totalDerivativesCreated: number
    avgQualityOfDerivatives: number
    totalRevenueFromDerivatives: number
  }
  topInfluentialStories: {
    storyId: string
    title: string
    influenceScore: number
    derivativeCount: number
  }[]
  influenceTrend: 'rising' | 'stable' | 'falling'
  percentileRank: number
}

export interface QualityAssessment {
  storyId: string
  overallQuality: number
  qualityMetrics: {
    originality: number
    engagement: number
    technical: number
    commercial: number
  }
  comparisonToOriginal?: {
    originalId: string
    qualityDelta: number
    performanceDelta: number
  }
  recommendations: string[]
  qualityTrend: 'improving' | 'stable' | 'declining'
  aiConfidence: number
}