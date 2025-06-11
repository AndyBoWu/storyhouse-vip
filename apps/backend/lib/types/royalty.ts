/**
 * @fileoverview Royalty-specific type definitions for Phase 2 implementation
 * 
 * These types extend the core IP types with royalty-specific interfaces
 * for business logic, TIP token integration, and notification systems.
 */

import { Address, Hash } from 'viem'
import type { LicenseTier } from './ip'

// Core royalty operation types
export interface RoyaltyClaimRequest {
  chapterId: string
  authorAddress: Address
  licenseTermsId?: string
  expectedAmount?: bigint
  forceRefresh?: boolean
}

export interface RoyaltyClaimResponse {
  success: boolean
  claimedAmount: string // TIP tokens (formatted)
  platformFee: string // TIP tokens (formatted)
  netAmount: string // TIP tokens after fees (formatted)
  transactionHash?: Hash
  gasUsed?: string
  gasFee?: string
  error?: string
  timestamp: string // ISO string
  chapterId: string
  authorAddress: Address
}

export interface ClaimableRoyaltyCheck {
  chapterId: string
  authorAddress: Address
  claimableAmount: bigint
  claimableAmountFormatted: string
  lastClaimDate?: Date
  licenseTermsId?: string
  licenseTier: LicenseTier
  estimatedGasFee: bigint
  estimatedNetAmount: bigint
  canClaim: boolean
  blockingReasons?: string[]
}

// TIP Token balance and validation
export interface TIPTokenBalance {
  address: Address
  balance: bigint // Raw TIP tokens (18 decimals)
  balanceFormatted: string // Human readable format
  balanceUSD?: string // USD equivalent if available
  lastUpdated: Date
  isValid: boolean
  minimumRequired?: bigint
}

export interface TIPTokenTransfer {
  from: Address
  to: Address
  amount: bigint
  amountFormatted: string
  transactionHash?: Hash
  gasUsed?: string
  gasFee?: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: Date
  error?: string
}

// Economic calculation types
export interface RoyaltyEconomics {
  licenseTier: LicenseTier
  royaltyRate: number // percentage (0-100)
  platformFeeRate: number // percentage (0-100)
  readerRewardRate: number // percentage (0-100)
  baseUnlockPrice: bigint // TIP tokens
  readReward: bigint // TIP tokens per read
  projectedMonthlyRevenue: bigint // TIP tokens
  estimatedROI: number // percentage
}

export interface RevenueBreakdown {
  totalRevenue: bigint
  creatorRoyalty: bigint
  platformFee: bigint
  readerRewards: bigint
  remainingAmount: bigint
  breakdown: {
    creator: number // percentage
    platform: number // percentage
    readers: number // percentage
    remaining: number // percentage
  }
}

// Notification system types
export interface RoyaltyNotification {
  id: string
  chapterId: string
  authorAddress: Address
  type: RoyaltyNotificationType
  title: string
  message: string
  amount?: bigint
  amountFormatted?: string
  metadata?: Record<string, any>
  timestamp: Date
  read: boolean
  actionUrl?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export type RoyaltyNotificationType = 
  | 'new_royalty' 
  | 'claim_success' 
  | 'claim_failed' 
  | 'large_payment' 
  | 'monthly_summary'
  | 'threshold_reached'
  | 'system_alert'

export interface NotificationPreferences {
  authorAddress: Address
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
  notificationTypes: RoyaltyNotificationType[]
  minimumAmountThreshold: bigint
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  lastUpdated: Date
}

// History and analytics types
export interface RoyaltyHistoryEntry {
  id: string
  chapterId: string
  chapterTitle?: string
  authorAddress: Address
  licenseTermsId?: string
  licenseTier: LicenseTier
  amount: bigint
  amountFormatted: string
  platformFee: bigint
  platformFeeFormatted: string
  netAmount: bigint
  netAmountFormatted: string
  transactionHash?: Hash
  gasUsed?: string
  gasFee?: string
  gaasFeeFormatted?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  timestamp: Date
  error?: string
  metadata?: Record<string, any>
}

export interface RoyaltyAnalytics {
  authorAddress: Address
  period: 'day' | 'week' | 'month' | 'year' | 'all'
  startDate: Date
  endDate: Date
  
  // Summary statistics
  totalClaimed: bigint
  totalClaimedFormatted: string
  totalFeesPaid: bigint
  totalFeesPaidFormatted: string
  claimCount: number
  averageClaimAmount: bigint
  averageClaimAmountFormatted: string
  
  // Performance metrics
  successRate: number // percentage
  averageClaimTime: number // seconds
  largestClaim: bigint
  largestClaimFormatted: string
  lastClaimDate?: Date
  
  // License tier breakdown
  tierBreakdown: Record<LicenseTier, {
    count: number
    totalAmount: bigint
    totalAmountFormatted: string
    averageAmount: bigint
    averageAmountFormatted: string
  }>
  
  // Growth metrics
  growthRate: number // percentage change from previous period
  projectedNext: bigint // projected earnings next period
  projectedNextFormatted: string
}

// Preview and calculation types
export interface RoyaltyPreview {
  chapterId: string
  authorAddress: Address
  licenseTier: LicenseTier
  currentRevenue: bigint
  projectedRoyalty: bigint
  projectedRoyaltyFormatted: string
  platformFee: bigint
  platformFeeFormatted: string
  netRoyalty: bigint
  netRoyaltyFormatted: string
  estimatedGasFee: bigint
  estimatedGasFeeFormatted: string
  finalNetAmount: bigint
  finalNetAmountFormatted: string
  recommendedAction: 'claim_now' | 'wait_for_more' | 'consider_tier_upgrade'
  reasoning: string[]
  lastUpdated: Date
}

export interface LicenseTierComparison {
  chapterId: string
  currentTier: LicenseTier
  currentRevenue: bigint
  
  tiers: Record<LicenseTier, {
    tier: LicenseTier
    royaltyRate: number
    projectedRoyalty: bigint
    projectedRoyaltyFormatted: string
    platformFee: bigint
    netRoyalty: bigint
    netRoyaltyFormatted: string
    difference: bigint // compared to current
    differenceFormatted: string
    differencePercentage: number
    recommended: boolean
  }>
  
  recommendation: {
    suggestedTier: LicenseTier
    reasoning: string[]
    potentialIncrease: bigint
    potentialIncreaseFormatted: string
    potentialIncreasePercentage: number
  }
}

// Service configuration types
export interface RoyaltyServiceConfig {
  tipTokenAddress: Address
  platformFeeRate: number // percentage (0-100)
  minimumClaimAmount: bigint
  maximumClaimAmount: bigint
  claimCooldownPeriod: number // seconds
  gasLimitMultiplier: number // for gas estimation
  retryAttempts: number
  cacheTTL: number // seconds
  
  // License tier rates
  licenseTierRates: Record<LicenseTier, {
    royaltyRate: number
    platformFeeRate: number
    minimumUnlockPrice: bigint
    readRewardRate: number
  }>
  
  // Notification settings
  notificationSettings: {
    enabled: boolean
    providers: ('email' | 'push' | 'webhook')[]
    thresholds: {
      largePayment: bigint
      monthlyLimit: bigint
    }
  }
}

// API response types
export interface RoyaltyAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    version: string
    requestId: string
  }
}

export interface RoyaltyEndpointData {
  // GET /api/royalties/claimable/:chapterId
  claimable: ClaimableRoyaltyCheck
  
  // POST /api/royalties/claim
  claim: RoyaltyClaimResponse
  
  // GET /api/royalties/history/:authorAddress
  history: {
    entries: RoyaltyHistoryEntry[]
    pagination: {
      page: number
      limit: number
      total: number
      hasMore: boolean
    }
  }
  
  // GET /api/royalties/analytics/:authorAddress
  analytics: RoyaltyAnalytics
  
  // GET /api/royalties/preview
  preview: RoyaltyPreview
  
  // GET /api/royalties/notifications/:authorAddress
  notifications: {
    notifications: RoyaltyNotification[]
    unreadCount: number
  }
}

// Error types
export interface RoyaltyError extends Error {
  code: RoyaltyErrorCode
  chapterId?: string
  authorAddress?: Address
  amount?: bigint
  retryable: boolean
  category: 'validation' | 'blockchain' | 'business' | 'system'
}

export type RoyaltyErrorCode = 
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_CHAPTER'
  | 'INVALID_LICENSE'
  | 'CLAIM_TOO_SOON'
  | 'AMOUNT_TOO_LOW'
  | 'AMOUNT_TOO_HIGH'
  | 'BLOCKCHAIN_ERROR'
  | 'GAS_ESTIMATION_FAILED'
  | 'TRANSACTION_FAILED'
  | 'UNAUTHORIZED_CLAIM'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_REQUEST'

// Utility types
export interface RoyaltyCalculationInput {
  totalRevenue: bigint
  licenseTier: LicenseTier
  licenseTermsId?: string
  includeGasFees?: boolean
  includePlatformFees?: boolean
}

export interface RoyaltyCalculationOutput {
  input: RoyaltyCalculationInput
  royaltyAmount: bigint
  royaltyAmountFormatted: string
  platformFee: bigint
  platformFeeFormatted: string
  estimatedGasFee: bigint
  estimatedGasFeeFormatted: string
  netAmount: bigint
  netAmountFormatted: string
  breakdown: {
    royaltyPercentage: number
    platformFeePercentage: number
    gasFeePercentage: number
    netPercentage: number
  }
  calculated: boolean
  timestamp: Date
}