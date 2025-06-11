/**
 * @fileoverview Enhanced R2 Metadata Schema with License Terms
 * Extends existing R2 storage structure to include Story Protocol licensing information
 */

import type { Address, Hash } from 'viem'

// Base existing metadata structure (from current implementation)
export interface BaseChapterMetadata {
  // Content Classification
  suggestedTags: string[]
  suggestedGenre: string
  contentRating: 'G' | 'PG' | 'PG-13' | 'R'
  language: string
  genre: string[]
  mood: string
  
  // AI Generation Data
  generationMethod: 'ai' | 'human'
  aiModel?: string
  plotDescription?: string
  qualityScore: number
  originalityScore: number
  commercialViability: number
  
  // Authorship
  authorAddress: Address
  authorName?: string
  bookCoverUrl?: string
  
  // Remix System (existing)
  isRemix: boolean
  isRemixable: boolean
  licensePrice: number
  royaltyPercentage: number
  
  // Read-to-Earn Economics (existing)
  unlockPrice: number
  readReward: number
  
  // Status & Lifecycle
  status: 'draft' | 'published' | 'archived'
  generatedAt: string
  publishedAt?: string
  lastModified?: string
  
  // Engagement Metrics
  totalReads: number
  totalEarned: number
  totalRevenue: number
  averageRating: number
  remixCount: number
  streakBonus: number
}

// Enhanced license terms for R2 storage
export interface R2LicenseTerms {
  // License Tier Information
  tier: 'free' | 'premium' | 'exclusive'
  displayName: string
  description: string
  
  // Story Protocol Integration
  licenseTermsId?: string
  licenseTokenId?: string
  pilType: 'LAP' | 'LRP' // Programmable IP License type
  
  // License Configuration
  transferable: boolean
  commercialUse: boolean
  commercialAttribution: boolean
  derivativesAllowed: boolean
  derivativesAttribution: boolean
  exclusivity: boolean
  shareAlike: boolean
  attribution: boolean
  
  // Economic Terms
  tipPrice: number // TIP tokens for license purchase
  mintingFee: string // BigInt as string for JSON storage
  royaltyPercentage: number
  
  // Distribution & Territory
  territories: string[]
  distributionChannels: string[]
  contentRestrictions: string[]
  
  // License Lifecycle
  expiration: number // 0 = never expires
  createdAt: string
  updatedAt: string
  
  // Royalty Policy Details
  royaltyPolicy?: {
    address: Address
    policyType: 'LAP' | 'LRP'
    stakingReward: number
    distributionDelay: number
    maxStakingThreshold: string // BigInt as string
  }
}

// Enhanced blockchain registration data
export interface R2BlockchainData {
  // Basic Registration (existing)
  ipAssetId: string
  transactionHash: Hash
  walletAddress: Address
  registeredAt: string
  
  // Enhanced Registration Details
  tokenId?: string
  blockNumber?: number
  gasUsed?: string // BigInt as string
  gasPrice?: string // BigInt as string
  confirmationTime?: string
  
  // Contract Information
  spgNftContract?: Address
  registrationMethod: 'mintAndRegisterIp' | 'registerIp'
  
  // Metadata URIs
  ipMetadataURI?: string
  nftMetadataURI?: string
  ipMetadataHash?: Hash
  nftMetadataHash?: Hash
}

// Enhanced chapter genealogy for R2 storage
export interface R2ChapterGenealogy {
  // Parent-Child Relationships
  parentIpAssetIds: string[]
  childIpAssetIds: string[]
  ancestorIds: string[]
  descendantIds: string[]
  
  // Relationship Details
  relationships: Array<{
    ipAssetId: string
    relationship: 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant'
    licenseTermsId?: string
    licenseTokenId?: string
    createdAt: string
    transactionHash?: Hash
    // Phase 3.1.4: AI Similarity Data
    aiSimilarity?: {
      similarityScore: number
      confidence: number
      analysisTimestamp: string
      factors: {
        contentSimilarity: number
        structuralSimilarity: number
        themeSimilarity: number
        styleSimilarity: number
      }
    }
  }>
  
  // Royalty Flow Tracking
  royaltyFlow: Array<{
    fromIpAssetId: string
    toIpAssetId: string
    percentage: number
    totalClaimed: number
    lastClaimDate?: string
  }>
  
  // Generation Information
  generationLevel: number // 0 = original, 1 = first derivative, etc.
  branchId?: string
  branchName?: string
  
  // Phase 3.1.4: AI Content Analysis Data
  aiAnalysis?: {
    // Content Similarity Scores
    similarityScores: {
      [relatedIpAssetId: string]: {
        score: number
        confidence: number
        lastAnalyzed: string
        factors: {
          contentSimilarity: number
          structuralSimilarity: number
          themeSimilarity: number
          styleSimilarity: number
        }
      }
    }
    
    // Influence Metrics
    influenceMetrics: {
      totalDerivatives: number
      averageSimilarity: number
      qualityScore: number
      reachScore: number
      overallInfluence: number
      lastCalculated: string
    }
    
    // Quality Assessment
    qualityAssessment: {
      overallScore: number
      readabilityScore: number
      engagementScore: number
      originalityScore: number
      completionScore: number
      comparisonToOriginal?: {
        originalIpAssetId: string
        qualityRatio: number
        strengthsOverOriginal: string[]
        areasForImprovement: string[]
      }
      assessmentTimestamp: string
    }
    
    // Derivative Detection Cache
    derivativeDetectionCache: {
      potentialDerivatives: Array<{
        ipAssetId: string
        similarityScore: number
        confidence: number
        detectedAt: string
      }>
      lastScan: string
      scanThreshold: number
    }
    
    // Content Fingerprint for Quick Comparison
    contentFingerprint?: string
    
    // Analysis Version for Future Compatibility
    analysisVersion: string
  }
  
  // Update Tracking
  lastUpdated: string
  genealogyVersion: number
}

// Complete enhanced chapter data structure for R2
export interface EnhancedR2ChapterData {
  // Basic Chapter Information
  storyId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
  
  // Enhanced Metadata (extends base)
  metadata: BaseChapterMetadata
  
  // Enhanced License Terms
  licenseTerms: R2LicenseTerms
  
  // Enhanced Blockchain Data
  blockchain: R2BlockchainData
  
  // IP Relationship Data
  genealogy?: R2ChapterGenealogy
  
  // Collection Membership
  collections?: Array<{
    collectionId: string
    collectionName: string
    role: 'creator' | 'contributor' | 'member'
    joinedAt: string
    revenueShare: number
  }>
  
  // Economics Tracking
  economics: {
    // Current TIP Token Economics
    currentUnlockPrice: number
    currentReadReward: number
    currentLicensePrice: number
    currentRoyaltyPercentage: number
    
    // Historical Economics
    priceHistory: Array<{
      date: string
      unlockPrice: number
      readReward: number
      licensePrice: number
      reason: string // 'quality_adjustment' | 'market_demand' | 'manual_override'
    }>
    
    // Revenue Tracking
    totalUnlockRevenue: number
    totalLicenseRevenue: number
    totalRoyaltiesEarned: number
    totalRoyaltiesPaid: number
    
    // Performance Metrics
    conversionRate: number // % of viewers who unlock
    licensingRate: number // % of unlocks that lead to licenses
    averageEngagementTime: number // seconds
  }
  
  // Content Protection
  protection: {
    enabled: boolean
    obfuscationLevel: 'none' | 'basic' | 'enhanced'
    antiScrapeHeaders: boolean
    accessControlEnabled: boolean
    maxSimultaneousReads: number
  }
  
  // Version Control
  version: {
    schemaVersion: string // For future migrations
    dataVersion: number
    lastSchemaUpdate: string
    migrationHistory: Array<{
      fromVersion: string
      toVersion: string
      migratedAt: string
      changes: string[]
    }>
  }
}

// R2 Storage Metadata (HTTP headers)
export interface EnhancedR2StorageMetadata {
  // Basic Identification
  storyId: string
  chapterNumber: string
  contentType: 'chapter' | 'story' | 'collection'
  
  // Blockchain Proof
  ipAssetId: string
  transactionHash: string
  walletAddress: string
  
  // Author Information
  authorAddress: string
  authorName: string
  
  // License Information (simplified for HTTP headers)
  licenseTier: 'free' | 'premium' | 'exclusive'
  licenseTermsId: string
  pilType: 'LAP' | 'LRP'
  
  // Business Critical Fields
  contentRating: string
  genre: string // comma-separated for HTTP header
  unlockPrice: string
  readReward: string
  licensePrice: string
  royaltyPercentage: string
  
  // Economic Flags
  commercialUse: string // 'true' | 'false'
  derivativesAllowed: string // 'true' | 'false'
  isRemixable: string // 'true' | 'false'
  
  // Status Information
  status: string
  visibility: string
  publishedAt: string
  
  // Technical Metadata
  schemaVersion: string
  dataVersion: string
  lastUpdated: string
}

// Helper functions for R2 metadata conversion
export function convertToR2StorageMetadata(
  chapterData: EnhancedR2ChapterData
): EnhancedR2StorageMetadata {
  return {
    storyId: chapterData.storyId,
    chapterNumber: chapterData.chapterNumber.toString(),
    contentType: 'chapter',
    
    // Blockchain
    ipAssetId: chapterData.blockchain.ipAssetId,
    transactionHash: chapterData.blockchain.transactionHash,
    walletAddress: chapterData.blockchain.walletAddress,
    
    // Author
    authorAddress: chapterData.metadata.authorAddress,
    authorName: chapterData.metadata.authorName || '',
    
    // License
    licenseTier: chapterData.licenseTerms.tier,
    licenseTermsId: chapterData.licenseTerms.licenseTermsId || '',
    pilType: chapterData.licenseTerms.pilType,
    
    // Business
    contentRating: chapterData.metadata.contentRating,
    genre: chapterData.metadata.genre.join(','),
    unlockPrice: chapterData.economics.currentUnlockPrice.toString(),
    readReward: chapterData.economics.currentReadReward.toString(),
    licensePrice: chapterData.economics.currentLicensePrice.toString(),
    royaltyPercentage: chapterData.economics.currentRoyaltyPercentage.toString(),
    
    // Economic flags
    commercialUse: chapterData.licenseTerms.commercialUse.toString(),
    derivativesAllowed: chapterData.licenseTerms.derivativesAllowed.toString(),
    isRemixable: chapterData.metadata.isRemixable.toString(),
    
    // Status
    status: chapterData.metadata.status,
    visibility: 'public', // Default for now
    publishedAt: chapterData.metadata.publishedAt || new Date().toISOString(),
    
    // Technical
    schemaVersion: chapterData.version.schemaVersion,
    dataVersion: chapterData.version.dataVersion.toString(),
    lastUpdated: chapterData.version.lastSchemaUpdate
  }
}

// Default license terms for each tier
export function getDefaultLicenseTerms(tier: 'free' | 'premium' | 'exclusive'): R2LicenseTerms {
  const now = new Date().toISOString()
  
  const baseLicense = {
    displayName: '',
    description: '',
    pilType: 'LAP' as const,
    transferable: true,
    territories: ['Worldwide'],
    distributionChannels: ['Digital'],
    contentRestrictions: [],
    expiration: 0,
    createdAt: now,
    updatedAt: now,
    attribution: true,
  }
  
  switch (tier) {
    case 'free':
      return {
        ...baseLicense,
        tier: 'free',
        displayName: 'Free License',
        description: 'Open access with attribution required',
        pilType: 'LAP',
        commercialUse: false,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        exclusivity: false,
        shareAlike: true,
        tipPrice: 0,
        mintingFee: '0',
        royaltyPercentage: 0,
        contentRestrictions: ['Non-commercial use only'],
      }
    
    case 'premium':
      return {
        ...baseLicense,
        tier: 'premium',
        displayName: 'Premium License',
        description: 'Commercial use with royalty sharing',
        pilType: 'LRP',
        commercialUse: true,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        exclusivity: false,
        shareAlike: false,
        tipPrice: 100,
        mintingFee: (BigInt(100 * 10**18)).toString(),
        royaltyPercentage: 10,
        distributionChannels: ['Digital', 'Print', 'Audio', 'Video'],
        royaltyPolicy: {
          address: '0x0000000000000000000000000000000000000000' as Address,
          policyType: 'LRP',
          stakingReward: 5,
          distributionDelay: 86400,
          maxStakingThreshold: (BigInt(10000 * 10**18)).toString(),
        }
      }
    
    case 'exclusive':
      return {
        ...baseLicense,
        tier: 'exclusive',
        displayName: 'Exclusive License',
        description: 'Full commercial rights with high royalties',
        pilType: 'LRP',
        transferable: false,
        commercialUse: true,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        exclusivity: true,
        shareAlike: false,
        tipPrice: 1000,
        mintingFee: (BigInt(1000 * 10**18)).toString(),
        royaltyPercentage: 25,
        distributionChannels: ['All'],
        royaltyPolicy: {
          address: '0x0000000000000000000000000000000000000000' as Address,
          policyType: 'LRP',
          stakingReward: 10,
          distributionDelay: 604800,
          maxStakingThreshold: (BigInt(100000 * 10**18)).toString(),
        }
      }
    
    default:
      return getDefaultLicenseTerms('free')
  }
}

// Version constants
export const R2_SCHEMA_VERSION = '2.1.0' // Updated for AI analysis enhancement
export const CURRENT_DATA_VERSION = 2
export const AI_ANALYSIS_VERSION = '1.0.0' // Phase 3.1.4

// =============================================================================
// PHASE 3.1.4: AI ANALYSIS HELPER FUNCTIONS
// =============================================================================

/**
 * Initialize AI analysis data for new chapters
 */
export function initializeAIAnalysis(): R2ChapterGenealogy['aiAnalysis'] {
  return {
    similarityScores: {},
    influenceMetrics: {
      totalDerivatives: 0,
      averageSimilarity: 0,
      qualityScore: 0,
      reachScore: 0,
      overallInfluence: 0,
      lastCalculated: new Date().toISOString()
    },
    qualityAssessment: {
      overallScore: 0,
      readabilityScore: 0,
      engagementScore: 0,
      originalityScore: 0,
      completionScore: 0,
      assessmentTimestamp: new Date().toISOString()
    },
    derivativeDetectionCache: {
      potentialDerivatives: [],
      lastScan: new Date().toISOString(),
      scanThreshold: 0.3
    },
    analysisVersion: AI_ANALYSIS_VERSION
  }
}

/**
 * Update similarity score in R2 metadata
 */
export function updateSimilarityScore(
  genealogy: R2ChapterGenealogy,
  relatedIpAssetId: string,
  similarityData: {
    score: number
    confidence: number
    factors: {
      contentSimilarity: number
      structuralSimilarity: number
      themeSimilarity: number
      styleSimilarity: number
    }
  }
): R2ChapterGenealogy {
  const updatedGenealogy = { ...genealogy }
  
  // Initialize aiAnalysis if it doesn't exist
  if (!updatedGenealogy.aiAnalysis) {
    updatedGenealogy.aiAnalysis = initializeAIAnalysis()
  }
  
  // Update similarity score
  updatedGenealogy.aiAnalysis!.similarityScores[relatedIpAssetId] = {
    ...similarityData,
    lastAnalyzed: new Date().toISOString()
  }
  
  // Update genealogy metadata
  updatedGenealogy.lastUpdated = new Date().toISOString()
  updatedGenealogy.genealogyVersion = (updatedGenealogy.genealogyVersion || 0) + 1
  
  return updatedGenealogy
}

/**
 * Update influence metrics in R2 metadata
 */
export function updateInfluenceMetrics(
  genealogy: R2ChapterGenealogy,
  influenceData: {
    totalDerivatives: number
    averageSimilarity: number
    qualityScore: number
    reachScore: number
    overallInfluence: number
  }
): R2ChapterGenealogy {
  const updatedGenealogy = { ...genealogy }
  
  // Initialize aiAnalysis if it doesn't exist
  if (!updatedGenealogy.aiAnalysis) {
    updatedGenealogy.aiAnalysis = initializeAIAnalysis()
  }
  
  // Update influence metrics
  updatedGenealogy.aiAnalysis!.influenceMetrics = {
    ...influenceData,
    lastCalculated: new Date().toISOString()
  }
  
  // Update genealogy metadata
  updatedGenealogy.lastUpdated = new Date().toISOString()
  updatedGenealogy.genealogyVersion = (updatedGenealogy.genealogyVersion || 0) + 1
  
  return updatedGenealogy
}

/**
 * Update quality assessment in R2 metadata
 */
export function updateQualityAssessment(
  genealogy: R2ChapterGenealogy,
  qualityData: {
    overallScore: number
    readabilityScore: number
    engagementScore: number
    originalityScore: number
    completionScore: number
    comparisonToOriginal?: {
      originalIpAssetId: string
      qualityRatio: number
      strengthsOverOriginal: string[]
      areasForImprovement: string[]
    }
  }
): R2ChapterGenealogy {
  const updatedGenealogy = { ...genealogy }
  
  // Initialize aiAnalysis if it doesn't exist
  if (!updatedGenealogy.aiAnalysis) {
    updatedGenealogy.aiAnalysis = initializeAIAnalysis()
  }
  
  // Update quality assessment
  updatedGenealogy.aiAnalysis!.qualityAssessment = {
    ...qualityData,
    assessmentTimestamp: new Date().toISOString()
  }
  
  // Update genealogy metadata
  updatedGenealogy.lastUpdated = new Date().toISOString()
  updatedGenealogy.genealogyVersion = (updatedGenealogy.genealogyVersion || 0) + 1
  
  return updatedGenealogy
}

/**
 * Update derivative detection cache
 */
export function updateDerivativeCache(
  genealogy: R2ChapterGenealogy,
  potentialDerivatives: Array<{
    ipAssetId: string
    similarityScore: number
    confidence: number
  }>,
  scanThreshold: number = 0.3
): R2ChapterGenealogy {
  const updatedGenealogy = { ...genealogy }
  
  // Initialize aiAnalysis if it doesn't exist
  if (!updatedGenealogy.aiAnalysis) {
    updatedGenealogy.aiAnalysis = initializeAIAnalysis()
  }
  
  // Update derivative detection cache
  updatedGenealogy.aiAnalysis!.derivativeDetectionCache = {
    potentialDerivatives: potentialDerivatives.map(d => ({
      ...d,
      detectedAt: new Date().toISOString()
    })),
    lastScan: new Date().toISOString(),
    scanThreshold
  }
  
  // Update genealogy metadata
  updatedGenealogy.lastUpdated = new Date().toISOString()
  updatedGenealogy.genealogyVersion = (updatedGenealogy.genealogyVersion || 0) + 1
  
  return updatedGenealogy
}

/**
 * Set content fingerprint for quick similarity comparisons
 */
export function setContentFingerprint(
  genealogy: R2ChapterGenealogy,
  fingerprint: string
): R2ChapterGenealogy {
  const updatedGenealogy = { ...genealogy }
  
  // Initialize aiAnalysis if it doesn't exist
  if (!updatedGenealogy.aiAnalysis) {
    updatedGenealogy.aiAnalysis = initializeAIAnalysis()
  }
  
  // Set content fingerprint
  updatedGenealogy.aiAnalysis!.contentFingerprint = fingerprint
  
  // Update genealogy metadata
  updatedGenealogy.lastUpdated = new Date().toISOString()
  updatedGenealogy.genealogyVersion = (updatedGenealogy.genealogyVersion || 0) + 1
  
  return updatedGenealogy
}

/**
 * Get similarity score for a specific related IP asset
 */
export function getSimilarityScore(
  genealogy: R2ChapterGenealogy,
  relatedIpAssetId: string
): {
  score: number
  confidence: number
  lastAnalyzed: string
  factors: {
    contentSimilarity: number
    structuralSimilarity: number
    themeSimilarity: number
    styleSimilarity: number
  }
} | null {
  return genealogy.aiAnalysis?.similarityScores[relatedIpAssetId] || null
}

/**
 * Check if AI analysis data needs updating based on age
 */
export function needsAIAnalysisUpdate(
  genealogy: R2ChapterGenealogy,
  maxAgeHours: number = 24
): boolean {
  if (!genealogy.aiAnalysis) return true
  
  const lastCalculated = new Date(genealogy.aiAnalysis.influenceMetrics.lastCalculated)
  const maxAge = maxAgeHours * 60 * 60 * 1000 // Convert to milliseconds
  const now = new Date()
  
  return (now.getTime() - lastCalculated.getTime()) > maxAge
}

/**
 * Migrate existing genealogy data to include AI analysis
 */
export function migrateToAIAnalysisSchema(
  existingGenealogy: Partial<R2ChapterGenealogy>
): R2ChapterGenealogy {
  const migratedGenealogy: R2ChapterGenealogy = {
    // Preserve existing data
    parentIpAssetIds: existingGenealogy.parentIpAssetIds || [],
    childIpAssetIds: existingGenealogy.childIpAssetIds || [],
    ancestorIds: existingGenealogy.ancestorIds || [],
    descendantIds: existingGenealogy.descendantIds || [],
    relationships: existingGenealogy.relationships || [],
    royaltyFlow: existingGenealogy.royaltyFlow || [],
    generationLevel: existingGenealogy.generationLevel || 0,
    branchId: existingGenealogy.branchId,
    branchName: existingGenealogy.branchName,
    
    // Add AI analysis
    aiAnalysis: existingGenealogy.aiAnalysis || initializeAIAnalysis(),
    
    // Update metadata
    lastUpdated: new Date().toISOString(),
    genealogyVersion: (existingGenealogy.genealogyVersion || 0) + 1
  }
  
  return migratedGenealogy
}