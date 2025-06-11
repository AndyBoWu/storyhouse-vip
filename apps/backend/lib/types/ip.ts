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