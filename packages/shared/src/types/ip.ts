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
