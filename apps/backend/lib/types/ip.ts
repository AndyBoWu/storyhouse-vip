/**
 * IP (Intellectual Property) related types for Story Protocol integration
 */

import type { Address, Hash } from 'viem'

// License tier definitions
export type LicenseTier = 'standard' | 'premium' | 'exclusive' | 'custom' | {
  name: string
  displayName: string
  price: bigint
  royaltyPercentage: number
  terms: {
    commercialUse: boolean
    derivativesAllowed: boolean
    attribution: boolean
    shareAlike: boolean
    exclusivity: boolean
  }
}

// IP Asset interface
export interface IPAsset {
  id: string
  address: Address
  tokenId: string
  chainId: number
  
  // Metadata
  name: string
  description?: string
  mediaType: string
  contentHash?: string
  
  // Registration info
  registrant: Address
  registrationTxHash: Hash
  registrationBlock: number
  registrationTimestamp: Date
  
  // License information
  licenseTermsIds: string[]
  availableLicenses: LicenseTier[]
  
  // Revenue tracking
  totalRoyalties: number
  claimableRoyalties: number
  
  // Status
  status: 'pending' | 'registered' | 'failed'
  isActive: boolean
  
  // Parent/child relationships
  parentIpAssetId?: string
  derivativeIpAssetIds: string[]
  
  // Associated content
  storyId?: string
  chapterId?: string
}

// IP Operation for tracking blockchain operations
export interface IPOperation {
  id: string
  type: 'register' | 'license' | 'derivative' | 'royalty_claim' | 'collection_create' | 'royalty' | 'collection'
  operationType: 'register' | 'license' | 'derivative' | 'royalty_claim' | 'collection_create' | 'royalty' | 'collection' // Alias for type
  status: 'pending' | 'processing' | 'success' | 'failed'
  
  // Transaction info
  txHash?: Hash
  blockNumber?: number
  gasUsed?: bigint
  
  // Operation details
  userAddress: Address
  ipAssetId?: string
  licenseTermsId?: string
  storyId?: string
  
  // Error handling
  error?: string
  retryCount: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// License terms interface
export interface LicenseTerms {
  id: string
  licenseTemplate: string
  licenseText: string
  
  // Commercial rights
  commercialUse: boolean
  commercialAttribution: boolean
  commercialRevShare: number // basis points
  commercialRevCeiling?: number
  
  // Derivative rights
  derivativesAllowed: boolean
  derivativesAttribution: boolean
  derivativesApproval: boolean
  derivativesReciprocal: boolean
  derivativeRevCeiling?: number
  
  // Territory and time
  territories: string[]
  distributionChannels: string[]
  contentRestrictions: string[]
  
  // Economics
  mintingFee: string // in wei
  currency: Address
  transferable?: boolean
  
  // Metadata
  createdAt: Date
  isActive: boolean
}

// Collection interface for grouping IP assets
export interface IPCollection {
  id: string
  name: string
  description: string
  
  // Creator info
  creator: Address
  createdAt: Date
  
  // Story Protocol group info
  groupId?: string
  groupPoolAddress?: Address
  rewardPoolAddress?: Address
  
  // Collection settings
  isPublic: boolean
  allowContributions: boolean
  requireApproval: boolean
  
  // IP assets in collection
  ipAssets: string[]
  totalAssets: number
  
  // Revenue sharing
  revenueShare: {
    creator: number
    collection: number
    platform: number
  }
  
  // Metadata
  genre?: string
  tags: string[]
  coverImage?: string
  
  // Analytics
  totalEarnings: number
  totalViews: number
  memberCount: number
}

// Additional types needed by services
export interface LicenseToken {
  id: string
  tokenId: string
  licenseTermsId: string
  ipAssetId: string
  owner: Address
  isActive: boolean
}

export interface StoryWithIP {
  id: string
  title: string
  ipAssetId?: string
  licenseTokens: LicenseToken[]
  isRegistered: boolean
}

// Export commonly used types
export type IPAssetId = string
export type LicenseTermsId = string
export type CollectionId = string

// ============================================================================
// PHASE 2 ROYALTY OPERATION TYPES (Ticket 2.1.1)
// ============================================================================

// Enhanced Royalty Response for Phase 2 operations
export interface EnhancedClaimRoyaltyResponse {
  success: boolean
  amount?: bigint
  transactionHash?: Hash
  error?: string
  // Phase 2 enhancements
  tipTokenAmount?: number
  platformFee?: number
  chapterInfo?: {
    chapterId: string
    licenseTier: string
    totalRevenue: number
  }
  simulationMode?: boolean
  simulationReason?: string
  retryRecommendation?: string
}

// Claimable Royalties Information
export interface ClaimableRoyaltiesInfo {
  totalClaimable: number
  licenseTier?: string
  royaltyBreakdown: {
    baseRoyalties: number
    bonusRoyalties: number
    tipTokenRewards: number
  }
  lastUpdated: string
}

// Royalty Sharing Distribution
export interface RoyaltySharingDistribution {
  originalCreator: {
    address: Address
    amount: bigint
    percentage: number
  }
  platform: {
    amount: bigint
    percentage: number
  }
  derivatives: Array<{
    address: Address
    amount: bigint
    percentage: number
    derivativeId: string
  }>
  totalDistributed: bigint
}

// Chapter Royalty Usage Data
export interface ChapterRoyaltyUsage {
  chapterId: string
  totalReads: number
  totalLicenses: number
  averageReadingTime: number
  qualityScore?: number
  engagementMetrics: {
    completionRate: number
    returnReaderRate: number
    shareRate: number
  }
  revenueMetrics: {
    readRevenue: number
    licenseRevenue: number
    derivativeRevenue: number
  }
}

// Chapter Metadata for Royalty Operations
export interface ChapterRoyaltyMetadata {
  chapterId: string
  licenseTier: 'free' | 'premium' | 'exclusive'
  authorAddress: Address
  ipAssetId?: string
  royaltyPercentage: number
  createdAt: string
  qualityScore?: number
  engagement?: {
    totalReads: number
    averageTime: number
    completionRate: number
  }
}

// Royalty Error Categories for Enhanced Error Handling
export interface RoyaltyErrorInfo {
  message: string
  retryable: boolean
  category: 'wallet_error' | 'network_error' | 'gas_error' | 'royalty_error' | 'unknown_error'
  suggestedActions?: string[]
}

// TIP Token Conversion Information
export interface TipTokenConversion {
  ethAmount: number
  tipTokenAmount: number
  conversionRate: number
  platformFee: number
  netAmount: number
}