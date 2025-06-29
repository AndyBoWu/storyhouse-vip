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

  // IP chain information
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
    readReward: number     // TIP tokens earned for reading
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

// =============================================================================
// STORY PROTOCOL SDK DERIVATIVE REGISTRATION TYPES
// =============================================================================

// Derivative registration data for SDK integration
export interface DerivativeRegistrationData {
  // Source content information
  parentIpId: string
  parentChapterId: string
  parentLicenseTermsId?: string

  // Derivative content information
  derivativeContent: EnhancedChapterIPData
  derivativeType: 'remix' | 'sequel' | 'adaptation' | 'translation' | 'other'
  
  // Relationship metadata
  similarityScore?: number
  aiAnalysisId?: string
  influenceFactors?: string[]
  
  // License inheritance
  inheritParentLicense: boolean
  customLicenseTermsId?: string
  
  // Attribution information
  attributionText: string
  creatorNotes?: string
}

// Derivative registration result from SDK
export interface DerivativeRegistrationResult {
  success: boolean
  derivativeIpId?: string
  transactionHash?: Hash
  parentChildRelationship?: {
    parentIpId: string
    childIpId: string
    licenseTermsId: string
  }
  
  // AI Analysis Integration
  aiSimilarityScore?: number
  qualityComparison?: {
    parentQuality: number
    derivativeQuality: number
    improvementAreas?: string[]
  }
  
  // Economic projections
  revenueProjection?: {
    estimatedParentRoyalty: number
    estimatedDerivativeRevenue: number
    licenseInheritance: boolean
  }
  
  error?: string
  simulationMode?: boolean
  registrationTime?: Date
}

// Derivative tree node for family tree visualization
export interface DerivativeTree {
  ipId: string
  chapterId: string
  title: string
  creatorAddress: Address
  
  // Relationship data
  parentIpId?: string
  children: DerivativeTree[]
  depth: number
  
  // AI Analysis integration
  similarityToParent?: number
  qualityScore?: number
  influenceMetrics?: {
    totalDerivatives: number
    avgSimilarityScore: number
    qualityTrend: 'improving' | 'declining' | 'stable'
  }
  
  // License and revenue data
  licenseTermsId?: string
  licenseTier?: string
  totalRevenue?: number
  royaltiesGenerated?: number
}

// License inheritance analysis result
export interface LicenseInheritanceInfo {
  parentLicenseTermsId: string
  parentLicenseTier: string
  canInherit: boolean
  inheritanceConditions: string[]
  suggestedLicenseTermsId?: string
  economicImplications: {
    parentRoyaltyPercentage: number
    derivativeRoyaltyShare: number
    platformFee: number
  }
}

// Derivative query options for complex filtering
export interface DerivativeQueryOptions {
  includeAiAnalysis?: boolean
  includeLicenseDetails?: boolean
  includeRevenueData?: boolean
  depth?: number // How many generations deep to query
  filters?: {
    licenseTierFilter?: string[]
    qualityThreshold?: number
    similarityThreshold?: number
    revenueThreshold?: number
    creatorFilter?: Address[]
    dateRange?: { from: string; to: string }
    derivativeTypeFilter?: DerivativeRegistrationData['derivativeType'][]
  }
}

// Auto-detection options for AI-powered parent finding
export interface AutoDetectionOptions {
  minimumSimilarityThreshold?: number
  maxParentCandidates?: number
  requireManualConfirmation?: boolean
}

// Potential parent candidate from AI analysis
export interface ParentCandidate {
  ipId: string
  chapterId: string
  title: string
  similarityScore: number
  licenseTermsId?: string
  analysisId: string
  influenceFactors: string[]
  compatibilityScore: number
}

// Derivative complexity analysis
export interface DerivativeComplexity {
  complexity: 'simple' | 'moderate' | 'complex'
  factors: string[]
  estimatedGasCost: number
  requiredSteps: string[]
  potentialIssues: string[]
}

// License compatibility analysis
export interface LicenseCompatibility {
  isCompatible: boolean
  compatibilityScore: number
  restrictions: string[]
  recommendations: string[]
  economicImplications: {
    costIncrease: number
    revenueImpact: number
    royaltyChanges: number
  }
}

// Derivative workflow status tracking
export interface DerivativeWorkflowStatus {
  workflowId: string
  currentStep: 'analysis' | 'registration' | 'licensing' | 'confirmation' | 'complete'
  progress: number // 0-100
  estimatedTimeRemaining: number // minutes
  
  stepResults: {
    aiAnalysis?: {
      completed: boolean
      similarityScore?: number
      parentCandidates?: ParentCandidate[]
    }
    ipRegistration?: {
      completed: boolean
      ipAssetId?: string
      transactionHash?: Hash
    }
    licenseInheritance?: {
      completed: boolean
      licenseTermsId?: string
      canInherit?: boolean
    }
    derivativeRegistration?: {
      completed: boolean
      derivativeIpId?: string
      transactionHash?: Hash
    }
  }
  
  errors: string[]
  warnings: string[]
}

// =============================================================================
// ENHANCED ROYALTY TYPES FOR DERIVATIVE INTEGRATION
// =============================================================================

// Enhanced royalty claim response with derivative context
export interface EnhancedClaimRoyaltyResponse extends ClaimRoyaltyResponse {
  // TIP token integration
  tipTokenAmount?: number
  platformFee?: number
  
  // Chapter-specific information
  chapterInfo?: {
    chapterId: string
    licenseTier: string
    totalRevenue: number
  }
  
  // Derivative context
  derivativeRoyalties?: {
    fromChildIpId: string
    amount: bigint
    percentage: number
  }[]
  
  // Simulation mode for development
  simulationMode?: boolean
  simulationReason?: string
  retryRecommendation?: string
}

// Claimable royalties info with derivative breakdown
export interface ClaimableRoyaltiesInfo {
  totalClaimable: number
  licenseTier?: string
  
  royaltyBreakdown: {
    baseRoyalties: number
    bonusRoyalties: number
    tipTokenRewards: number
    derivativeRoyalties?: number
  }
  
  derivativeSources?: {
    childIpId: string
    childTitle: string
    contributionAmount: number
    royaltyPercentage: number
  }[]
  
  lastUpdated: string
}

// Royalty sharing distribution with derivative context
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

// Chapter royalty metadata for tracking
export interface ChapterRoyaltyMetadata {
  chapterId: string
  ipAssetId: string
  licenseTier: string
  
  royaltyData: {
    totalEarned: number
    totalClaimed: number
    pendingClaim: number
    lastClaimDate?: Date
  }
  
  derivativeData: {
    childrenCount: number
    totalChildRevenue: number
    averageRoyaltyRate: number
  }
  
  performance: {
    readCount: number
    engagementScore: number
    qualityScore: number
  }
}

// Royalty error information for enhanced error handling
export interface RoyaltyErrorInfo {
  message: string
  retryable: boolean
  category: 'wallet_error' | 'network_error' | 'gas_error' | 'royalty_error' | 'unknown_error'
  suggestedActions: string[]
}

// TIP token conversion utilities
export interface TipTokenConversion {
  ethAmount: number
  tipAmount: number
  conversionRate: number
  platformFee: number
  netAmount: number
}

// Event types for real-time updates including derivatives
export interface IPAssetEvent {
  type: 'registered' | 'licensed' | 'derivative_created' | 'derivative_registered' | 'royalty_distributed' | 'license_inherited'
  ipAssetId: string
  storyId?: string
  transactionHash: Hash
  blockNumber: number
  timestamp: string
  
  // Enhanced event data for derivatives
  data: Record<string, any> & {
    derivativeData?: {
      parentIpId?: string
      childIpId?: string
      derivativeType?: DerivativeRegistrationData['derivativeType']
      similarityScore?: number
    }
    licenseData?: {
      licenseTermsId?: string
      canInherit?: boolean
      licenseTier?: string
    }
    royaltyData?: {
      amount?: bigint
      currency?: Address
      fromDerivative?: boolean
    }
  }
}
