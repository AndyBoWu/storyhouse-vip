/**
 * @fileoverview IP Asset types for Story Protocol integration
 * Extends existing story types with IP functionality
 */

import type { Address, Hash } from 'viem'

// Story Protocol IP Asset interfaces
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

export interface LicenseTerms {
  id: string
  transferable: boolean
  royaltyPolicy: Address
  defaultMintingFee: bigint
  expiration: number
  commercialUse: boolean
  commercialAttribution: boolean
  derivativesAllowed: boolean
  derivativesAttribution: boolean
  territories: string[]
  distributionChannels: string[]
  contentRestrictions: string[]
}

export interface LicenseToken {
  id: string
  licenseTermsId: string
  licensorIpId: string
  transferable: boolean
  mintingFee: bigint
  owner: Address
}

export interface Derivative {
  childIpId: string
  parentIpId: string
  licenseTermsId: string
  licenseTokenId?: string
}

export interface RoyaltyDistribution {
  ipId: string
  amount: bigint
  currency: Address
  recipients: Address[]
  shares: number[]
}

// Extended story types with IP functionality
export interface StoryWithIP {
  // Existing story properties (from your current types)
  id: string
  title: string
  content: string
  author: string
  genre: string
  mood: string
  emoji: string
  createdAt: string

  // IP Asset properties
  ipAssetId?: string
  ipAssetAddress?: Address
  tokenId?: string
  licenseTermsId?: string

  // IP registration status
  ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed'
  ipRegistrationTxHash?: Hash

  // Licensing status
  licenseStatus: 'none' | 'attached' | 'available'
  availableLicenseTypes: LicenseTier[]

  // Derivative information
  isDerivative: boolean
  parentStoryId?: string
  parentIpAssetId?: string
  derivativeChain?: string[] // Array of parent IP asset IDs

  // Royalty information
  royaltyEarnings?: bigint
  hasClaimableRoyalties?: boolean
}

export interface ChapterWithIP {
  // Existing chapter properties
  id: string
  storyId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number

  // IP Asset properties for individual chapters
  ipAssetId?: string
  ipAssetAddress?: Address
  tokenId?: string

  // Chapter-specific IP status
  ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed'
  isPartOfStoryIP: boolean // Whether it's part of the main story IP or separate
}

// License tier configuration matching your current system
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

// Collection types for Story Protocol Groups
export interface StoryCollection {
  id: string
  name: string
  description: string

  // Story Protocol Group info
  groupId?: string
  groupPoolAddress?: Address
  rewardPoolAddress?: Address

  // Collection settings
  isPublic: boolean
  allowContributions: boolean

  // Revenue sharing
  shareDistribution: {
    creator: number      // % to individual creators
    collection: number   // % to collection pool
    platform: number     // % to platform
  }

  // Member management
  creators: Address[]
  stories: string[]
  ipAssets: string[]

  // Collection metadata
  genre?: string
  theme?: string
  tags: string[]

  // Stats
  totalEarnings?: bigint
  memberCount: number
  storyCount: number
}

// IP operation tracking
export interface IPOperation {
  id: string
  storyId: string
  operationType: 'register' | 'license' | 'derivative' | 'royalty' | 'collection'
  transactionHash?: Hash
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  createdAt: string
  updatedAt: string

  // Operation-specific data
  operationData?: {
    ipAssetId?: string
    licenseTokenId?: string
    parentIpAssetId?: string
    royaltyAmount?: bigint
    collectionId?: string
  }
}

// Configuration for Story Protocol integration
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

// License configuration for 3-tier system
export interface LicenseTermsConfig {
  tier: 'free' | 'premium' | 'exclusive'
  displayName: string
  description: string
  
  // Core license terms for Story Protocol
  transferable: boolean
  royaltyPolicy: Address
  defaultMintingFee: bigint
  expiration: number
  
  // Rights configuration
  commercialUse: boolean
  commercialAttribution: boolean
  derivativesAllowed: boolean
  derivativesAttribution: boolean
  
  // Territory and distribution
  territories: string[]
  distributionChannels: string[]
  contentRestrictions: string[]
  
  // StoryHouse-specific pricing (in TIP tokens)
  tipPrice: number
  royaltyPercentage: number
  
  // Additional terms
  exclusivity: boolean
  shareAlike: boolean
  attribution: boolean
}

// Enhanced Chapter IP Data for registration
export interface EnhancedChapterIPData {
  // Basic chapter information
  storyId: string
  chapterNumber: number
  title: string
  content: string
  contentUrl: string
  
  // Enhanced metadata for Story Protocol v1.3.2
  metadata: {
    // Content classification
    suggestedTags: string[]
    suggestedGenre: string
    contentRating: 'G' | 'PG' | 'PG-13' | 'R'
    language: string
    
    // AI quality metrics
    qualityScore: number      // 0-100
    originalityScore: number  // 0-100
    commercialViability: number // 0-100
    
    // Reading metrics
    wordCount: number
    estimatedReadingTime: number // minutes
    
    // User attribution
    authorAddress: Address
    authorName?: string
    
    // Licensing preferences
    preferredLicenseTier: 'free' | 'premium' | 'exclusive'
    allowDerivatives: boolean
    commercialRights: boolean
    
    // Economic parameters
    unlockPrice: number    // TIP tokens to unlock
    licensePrice: number   // TIP tokens for licensing
    royaltyPercentage: number // % for derivatives
    
    // Platform tracking
    createdAt: Date
    updatedAt: Date
    ipfsHash?: string
    r2Url?: string
    
    // Story Protocol specific
    mediaType: 'text/story'
    rights?: string
    source?: string
  }
  
  // License configuration
  licenseConfig?: LicenseTermsConfig
  
  // Collection membership
  collectionId?: string
  
  // Derivative information
  parentIpAssetId?: string
  isRemix: boolean
  remixSourceStoryId?: string
}

// Enhanced IP Registration Result for v1.3.2
export interface EnhancedIPRegistrationResult {
  success: boolean
  
  // Core registration data
  ipAssetId?: string
  transactionHash?: Hash
  tokenId?: string
  
  // License-related results
  licenseTermsId?: string
  licenseTokenId?: string
  
  // Enhanced tracking
  operationId?: string
  gasUsed?: bigint
  gasPrice?: bigint
  blockNumber?: number
  
  // Timing
  registrationTime?: Date
  confirmationTime?: Date
  
  // Error handling
  error?: string
  errorCode?: string
  retryable?: boolean
  
  // Additional metadata
  metadata?: {
    ipMetadataURI?: string
    nftMetadataURI?: string
    spgNftContract?: Address
    registrationMethod: 'mintAndRegisterIp' | 'registerIp'
  }
}

// Chapter genealogy for tracking IP relationships
export interface ChapterGenealogy {
  chapterId: string
  ipAssetId?: string
  
  // Parent-child relationships
  parentIpAssetIds: string[]   // Direct parents
  childIpAssetIds: string[]    // Direct children
  ancestorIds: string[]        // Full ancestry chain
  descendantIds: string[]      // Full descendant tree
  
  // Relationship metadata
  relationships: {
    ipAssetId: string
    relationship: 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant'
    licenseTermsId?: string
    licenseTokenId?: string
    createdAt: Date
    transactionHash?: Hash
  }[]
  
  // Royalty flow tracking
  royaltyFlow: {
    fromIpAssetId: string
    toIpAssetId: string
    percentage: number
    totalClaimed: number
    lastClaimDate?: Date
  }[]
  
  // Generation level (0 = original, 1 = first derivative, etc.)
  generationLevel: number
  
  // Branch information for complex trees
  branchId?: string
  branchName?: string
  
  // Updated timestamps
  lastUpdated: Date
  genealogyVersion: number
}

// API response types
export interface RegisterIPAssetResponse {
  success: boolean
  ipAsset?: IPAsset
  transactionHash?: Hash
  error?: string
}

export interface CreateLicenseResponse {
  success: boolean
  licenseTerms?: LicenseTerms
  transactionHash?: Hash
  error?: string
}

export interface PurchaseLicenseResponse {
  success: boolean
  licenseToken?: LicenseToken
  transactionHash?: Hash
  error?: string
}

export interface CreateDerivativeResponse {
  success: boolean
  derivative?: Derivative
  transactionHash?: Hash
  error?: string
}

export interface ClaimRoyaltyResponse {
  success: boolean
  amount?: bigint
  transactionHash?: Hash
  error?: string
}

// Event types for real-time updates
export interface IPAssetEvent {
  type: 'registered' | 'licensed' | 'derivative_created' | 'royalty_distributed'
  ipAssetId: string
  storyId?: string
  transactionHash: Hash
  blockNumber: number
  timestamp: string
  data: Record<string, any>
}
