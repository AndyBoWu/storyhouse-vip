/**
 * @fileoverview RoyaltyService - Business Logic for TIP Token Integration and Royalty Management
 * 
 * This service handles:
 * - TIP token balance checking and validation
 * - Royalty calculation utilities for different license tiers
 * - Revenue sharing calculation methods
 * - Royalty history tracking and storage
 * - Notification trigger system
 * 
 * Integrates with AdvancedStoryProtocolService for blockchain operations
 * and provides business logic layer for the royalty claiming system.
 */

import { Address, Hash, formatEther, parseEther } from 'viem'
import { STORYHOUSE_CONTRACTS, TIP_TOKEN_ABI } from '../contracts/storyhouse'
import { tipTokenService } from '../utils/tipTokenUtils'
import type { 
  ChapterRoyaltyResult, 
  ClaimableRoyaltyResult, 
  RoyaltyShareResult,
  LicenseTier 
} from '../types/ip'

// Business logic interfaces for royalty operations
export interface RoyaltyClaimRequest {
  chapterId: string
  authorAddress: Address
  licenseTermsId?: string
  expectedAmount?: bigint
}

export interface RoyaltyClaimResult {
  success: boolean
  claimedAmount: bigint // TIP tokens (18 decimals)
  platformFee: bigint // TIP tokens (18 decimals)
  netAmount: bigint // TIP tokens after fees
  transactionHash?: Hash
  error?: string
  timestamp: Date
}

export interface TIPTokenBalance {
  address: Address
  balance: bigint // TIP tokens (18 decimals)  
  balanceFormatted: string // Human readable
  lastUpdated: Date
}

export interface RoyaltyNotification {
  id: string
  chapterId: string
  authorAddress: Address
  type: 'new_royalty' | 'claim_success' | 'claim_failed' | 'large_payment'
  amount: bigint
  message: string
  timestamp: Date
  read: boolean
}

export interface RoyaltyHistoryEntry {
  id: string
  chapterId: string
  authorAddress: Address
  licenseTermsId?: string
  amount: bigint
  platformFee: bigint
  netAmount: bigint
  transactionHash?: Hash
  status: 'pending' | 'completed' | 'failed'
  timestamp: Date
  error?: string
}

export interface LicenseTierConfig {
  tier: LicenseTier
  royaltyRate: number // percentage (0-100)
  platformFeeRate: number // percentage (0-100)
  description: string
}

/**
 * RoyaltyService - Business logic for royalty management and TIP token integration
 */
export class RoyaltyService {
  private readonly platformFeeRate = 5 // 5% platform fee
  private readonly tipTokenAddress = STORYHOUSE_CONTRACTS.TIP_TOKEN
  
  // License tier configurations
  private readonly licenseTiers: Record<LicenseTier, LicenseTierConfig> = {
    free: {
      tier: 'free',
      royaltyRate: 0, // 0% royalty for free license
      platformFeeRate: 0, // No platform fee for free content
      description: 'Attribution-only license with no monetary exchange'
    },
    premium: {
      tier: 'premium',
      royaltyRate: 10, // 10% royalty for premium license
      platformFeeRate: this.platformFeeRate,
      description: 'Commercial license with revenue sharing'
    },
    exclusive: {
      tier: 'exclusive',
      royaltyRate: 25, // 25% royalty for exclusive license
      platformFeeRate: this.platformFeeRate,
      description: 'Exclusive commercial rights with premium revenue sharing'
    }
  }

  // In-memory storage for demo purposes
  // In production, this would be replaced with database storage
  private royaltyHistory: Map<string, RoyaltyHistoryEntry[]> = new Map()
  private notifications: Map<string, RoyaltyNotification[]> = new Map()

  constructor() {
    console.log('🔧 RoyaltyService initialized with TIP token integration')
    console.log('   TIP Token Address:', this.tipTokenAddress)
    console.log('   Platform Fee Rate:', this.platformFeeRate + '%')
  }

  /**
   * Validate TIP token balance for a user using TIPTokenService
   * Checks if user has sufficient balance for operations
   */
  async validateTIPTokenBalance(
    userAddress: Address, 
    requiredAmount?: bigint
  ): Promise<TIPTokenBalance> {
    try {
      // Use TIPTokenService for balance checking
      const balance = await tipTokenService.getBalance(userAddress)
      
      // Validate required amount if provided
      if (requiredAmount) {
        const validation = await tipTokenService.validateBalance(userAddress, requiredAmount)
        if (!validation.valid) {
          throw new Error(`Insufficient TIP token balance. Required: ${formatEther(requiredAmount)}, Available: ${balance.balanceFormatted}, Deficit: ${formatEther(validation.deficit || BigInt(0))}`)
        }
      }

      return balance
    } catch (error) {
      console.error('❌ TIP token balance validation failed:', error)
      throw new Error(`Failed to validate TIP token balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate royalty amounts based on license tier and revenue
   */
  calculateRoyaltyAmounts(
    licenseTermsId: string,
    totalRevenue: bigint,
    licenseTier: LicenseTier
  ): RoyaltyShareResult {
    try {
      const tierConfig = this.licenseTiers[licenseTier]
      if (!tierConfig) {
        throw new Error(`Unknown license tier: ${licenseTier}`)
      }

      // Calculate amounts
      const royaltyRate = BigInt(tierConfig.royaltyRate)
      const platformFeeRate = BigInt(tierConfig.platformFeeRate)
      
      const royaltyAmount = (totalRevenue * royaltyRate) / BigInt(100)
      const platformFee = (totalRevenue * platformFeeRate) / BigInt(100)
      const remainingAmount = totalRevenue - royaltyAmount - platformFee

      // Convert to TIP tokens (1:1 ratio with ETH)
      const tipRoyaltyAmount = royaltyAmount // 1 ETH = 1 TIP token
      const tipPlatformFee = platformFee
      const tipRemainingAmount = remainingAmount

      return {
        licenseTermsId,
        totalRevenue,
        licenseTier,
        royaltyAmount: tipRoyaltyAmount,
        platformFee: tipPlatformFee,
        remainingAmount: tipRemainingAmount,
        royaltyRate: tierConfig.royaltyRate,
        platformFeeRate: tierConfig.platformFeeRate,
        currency: this.tipTokenAddress,
        calculated: true,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('❌ Royalty calculation failed:', error)
      throw new Error(`Royalty calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process royalty claim and handle TIP token distribution
   */
  async processRoyaltyClaim(
    claimRequest: RoyaltyClaimRequest
  ): Promise<RoyaltyClaimResult> {
    try {
      const { chapterId, authorAddress, licenseTermsId, expectedAmount } = claimRequest

      // Get platform addresses for TIP token operations
      const platformAddresses = tipTokenService.getPlatformAddresses()
      
      // Validate platform has sufficient TIP tokens for payout
      const platformBalance = await this.validateTIPTokenBalance(
        platformAddresses.royaltyPool, // Use royalty pool for payouts
        expectedAmount
      )

      // Calculate royalty breakdown
      const claimedAmount = expectedAmount || parseEther('10') // Default 10 TIP tokens
      const platformFee = (claimedAmount * BigInt(this.platformFeeRate)) / BigInt(100)
      const netAmount = claimedAmount - platformFee

      console.log('💰 Processing TIP token distribution:', {
        claimedAmount: formatEther(claimedAmount),
        platformFee: formatEther(platformFee),
        netAmount: formatEther(netAmount)
      })

      // Execute TIP token transfers
      const transferPromises = []

      // Transfer net amount to author
      if (netAmount > 0) {
        transferPromises.push(
          tipTokenService.transferTokens(
            platformAddresses.royaltyPool,
            authorAddress,
            netAmount,
            { waitForConfirmation: true, retryOnFailure: true }
          )
        )
      }

      // Transfer platform fee to fee collector
      if (platformFee > 0) {
        transferPromises.push(
          tipTokenService.transferTokens(
            platformAddresses.royaltyPool,
            platformAddresses.feeCollector,
            platformFee,
            { waitForConfirmation: true, retryOnFailure: true }
          )
        )
      }

      // Execute transfers concurrently
      const transferResults = await Promise.all(transferPromises)
      const authorTransfer = transferResults[0]
      const feeTransfer = transferResults[1]

      // Check if transfers were successful
      let transferSuccess = true
      let transferError: string | undefined

      if (authorTransfer && authorTransfer.status === 'failed') {
        transferSuccess = false
        transferError = `Author transfer failed: ${authorTransfer.error}`
      }

      if (feeTransfer && feeTransfer.status === 'failed') {
        transferSuccess = false
        transferError = transferError 
          ? `${transferError}, Fee transfer failed: ${feeTransfer.error}`
          : `Fee transfer failed: ${feeTransfer.error}`
      }

      const result: RoyaltyClaimResult = {
        success: transferSuccess,
        claimedAmount,
        platformFee,
        netAmount,
        transactionHash: authorTransfer?.transactionHash,
        error: transferError,
        timestamp: new Date()
      }

      // Add to royalty history
      await this.addRoyaltyHistoryEntry({
        id: `claim_${Date.now()}`,
        chapterId,
        authorAddress,
        licenseTermsId,
        amount: claimedAmount,
        platformFee,
        netAmount,
        transactionHash: authorTransfer?.transactionHash,
        status: transferSuccess ? 'completed' : 'failed',
        timestamp: new Date(),
        error: transferError
      })

      // Trigger notification
      const notificationType = transferSuccess ? 'claim_success' : 'claim_failed'
      const notificationMessage = transferSuccess
        ? `Successfully claimed ${formatEther(netAmount)} TIP tokens from chapter ${chapterId}`
        : `Royalty claim failed for chapter ${chapterId}: ${transferError}`

      await this.triggerNotification({
        id: `notif_${Date.now()}`,
        chapterId,
        authorAddress,
        type: notificationType,
        amount: transferSuccess ? netAmount : BigInt(0),
        message: notificationMessage,
        timestamp: new Date(),
        read: false
      })

      console.log(`${transferSuccess ? '✅' : '❌'} Royalty claim processed:`, {
        chapterId,
        authorAddress,
        claimedAmount: formatEther(claimedAmount),
        netAmount: formatEther(netAmount),
        success: transferSuccess,
        error: transferError
      })

      return result
    } catch (error) {
      console.error('❌ Royalty claim processing failed:', error)
      
      const errorResult: RoyaltyClaimResult = {
        success: false,
        claimedAmount: BigInt(0),
        platformFee: BigInt(0),
        netAmount: BigInt(0),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }

      // Trigger error notification
      await this.triggerNotification({
        id: `notif_${Date.now()}`,
        chapterId: claimRequest.chapterId,
        authorAddress: claimRequest.authorAddress,
        type: 'claim_failed',
        amount: BigInt(0),
        message: `Royalty claim failed for chapter ${claimRequest.chapterId}: ${errorResult.error}`,
        timestamp: new Date(),
        read: false
      })

      return errorResult
    }
  }

  /**
   * Get royalty calculation preview without executing
   */
  previewRoyaltyCalculation(
    totalRevenue: bigint,
    licenseTier: LicenseTier
  ): RoyaltyShareResult {
    return this.calculateRoyaltyAmounts(
      'preview_' + Date.now(),
      totalRevenue,
      licenseTier
    )
  }

  /**
   * Get license tier configuration
   */
  getLicenseTierConfig(tier: LicenseTier): LicenseTierConfig {
    const config = this.licenseTiers[tier]
    if (!config) {
      throw new Error(`Unknown license tier: ${tier}`)
    }
    return config
  }

  /**
   * Get all available license tiers
   */
  getAllLicenseTiers(): LicenseTierConfig[] {
    return Object.values(this.licenseTiers)
  }

  /**
   * Add entry to royalty history
   */
  private async addRoyaltyHistoryEntry(entry: RoyaltyHistoryEntry): Promise<void> {
    const authorHistory = this.royaltyHistory.get(entry.authorAddress) || []
    authorHistory.push(entry)
    this.royaltyHistory.set(entry.authorAddress, authorHistory)
  }

  /**
   * Get royalty history for an author
   */
  async getRoyaltyHistory(
    authorAddress: Address,
    limit: number = 50
  ): Promise<RoyaltyHistoryEntry[]> {
    const history = this.royaltyHistory.get(authorAddress) || []
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Trigger royalty notification
   */
  async triggerNotification(notification: RoyaltyNotification): Promise<void> {
    try {
      const userNotifications = this.notifications.get(notification.authorAddress) || []
      userNotifications.push(notification)
      this.notifications.set(notification.authorAddress, userNotifications)

      console.log('🔔 Notification triggered:', {
        type: notification.type,
        authorAddress: notification.authorAddress,
        message: notification.message
      })

      // In production, this would integrate with external notification services
      // (email, push notifications, webhooks, etc.)
    } catch (error) {
      console.error('❌ Failed to trigger notification:', error)
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    authorAddress: Address,
    unreadOnly: boolean = false
  ): Promise<RoyaltyNotification[]> {
    const notifications = this.notifications.get(authorAddress) || []
    
    if (unreadOnly) {
      return notifications.filter(n => !n.read)
    }
    
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    authorAddress: Address,
    notificationId: string
  ): Promise<boolean> {
    const notifications = this.notifications.get(authorAddress) || []
    const notification = notifications.find(n => n.id === notificationId)
    
    if (notification) {
      notification.read = true
      return true
    }
    
    return false
  }

  /**
   * Get royalty statistics for an author
   */
  async getRoyaltyStatistics(authorAddress: Address): Promise<{
    totalClaimed: bigint
    totalFeesPaid: bigint
    claimCount: number
    averageClaimAmount: bigint
    lastClaimDate?: Date
  }> {
    const history = await this.getRoyaltyHistory(authorAddress)
    const completedClaims = history.filter(h => h.status === 'completed')

    const totalClaimed = completedClaims.reduce((sum, h) => sum + h.amount, BigInt(0))
    const totalFeesPaid = completedClaims.reduce((sum, h) => sum + h.platformFee, BigInt(0))
    const claimCount = completedClaims.length
    const averageClaimAmount = claimCount > 0 ? totalClaimed / BigInt(claimCount) : BigInt(0)
    const lastClaimDate = completedClaims.length > 0 ? completedClaims[0].timestamp : undefined

    return {
      totalClaimed,
      totalFeesPaid,
      claimCount,
      averageClaimAmount,
      lastClaimDate
    }
  }

  /**
   * Clear TIP token balance cache (delegates to TIPTokenService)
   */
  clearBalanceCache(address?: Address): void {
    tipTokenService.clearCache(address)
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    tipTokenAddress: Address
    platformFeeRate: number
    licenseTierCount: number
    totalNotifications: number
    totalHistoryEntries: number
    tipTokenServiceHealth: any
  } {
    const totalNotifications = Array.from(this.notifications.values())
      .reduce((sum, notifs) => sum + notifs.length, 0)
    
    const totalHistoryEntries = Array.from(this.royaltyHistory.values())
      .reduce((sum, entries) => sum + entries.length, 0)

    return {
      tipTokenAddress: this.tipTokenAddress,
      platformFeeRate: this.platformFeeRate,
      licenseTierCount: Object.keys(this.licenseTiers).length,
      totalNotifications,
      totalHistoryEntries,
      tipTokenServiceHealth: tipTokenService.getServiceHealth()
    }
  }
}

// Export singleton instance
export const royaltyService = new RoyaltyService()
export default royaltyService