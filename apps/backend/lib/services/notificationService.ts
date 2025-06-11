/**
 * @fileoverview NotificationService - Real-time Royalty Notifications System
 * 
 * Handles real-time notifications for royalty events including:
 * - New royalty availability alerts
 * - Claim success/failure notifications
 * - Large payment notifications
 * - Monthly royalty summaries
 * - Threshold-based alerts
 */

import { Address, formatEther } from 'viem'
import type { 
  RoyaltyNotification,
  NotificationPreferences,
  RoyaltyNotificationType
} from '../types/royalty'

// Notification configuration
const NOTIFICATION_CONFIG = {
  // Delivery channels
  channels: {
    inApp: true,
    email: true, // Would integrate with email service in production
    push: true, // Would integrate with push notification service
    webhook: true // For external integrations
  },
  
  // Notification thresholds
  thresholds: {
    largePayment: BigInt('1000000000000000000'), // 1 TIP token
    monthlyMinimum: BigInt('100000000000000000'), // 0.1 TIP token
    urgentAmount: BigInt('10000000000000000000'), // 10 TIP tokens
    systemAlert: BigInt('100000000000000000000') // 100 TIP tokens
  },
  
  // Rate limiting
  rateLimits: {
    maxNotificationsPerHour: 10,
    maxNotificationsPerDay: 50,
    cooldownPeriodMinutes: 5
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    exponentialBackoff: true
  }
} as const

// Notification template configurations
const NOTIFICATION_TEMPLATES = {
  new_royalty: {
    title: '💰 New Royalty Available',
    messageTemplate: 'You have {amount} TIP tokens available to claim from chapter "{chapterTitle}"',
    urgency: 'medium' as const,
    actionUrl: '/creator/royalties',
    icon: '💰'
  },
  claim_success: {
    title: '✅ Royalty Claimed Successfully',
    messageTemplate: 'Successfully claimed {amount} TIP tokens from chapter "{chapterTitle}"',
    urgency: 'low' as const,
    actionUrl: '/creator/royalties/history',
    icon: '✅'
  },
  claim_failed: {
    title: '❌ Royalty Claim Failed',
    messageTemplate: 'Failed to claim royalties from chapter "{chapterTitle}": {error}',
    urgency: 'high' as const,
    actionUrl: '/creator/royalties',
    icon: '❌'
  },
  large_payment: {
    title: '🎉 Large Royalty Payment',
    messageTemplate: 'Congratulations! You received a large payment of {amount} TIP tokens from chapter "{chapterTitle}"',
    urgency: 'high' as const,
    actionUrl: '/creator/royalties',
    icon: '🎉'
  },
  monthly_summary: {
    title: '📊 Monthly Royalty Summary',
    messageTemplate: 'Your monthly royalty summary: {totalAmount} TIP tokens from {chapterCount} chapters',
    urgency: 'low' as const,
    actionUrl: '/creator/analytics',
    icon: '📊'
  },
  threshold_reached: {
    title: '🎯 Royalty Threshold Reached',
    messageTemplate: 'Your royalties have reached {amount} TIP tokens - optimal time to claim!',
    urgency: 'medium' as const,
    actionUrl: '/creator/royalties',
    icon: '🎯'
  },
  system_alert: {
    title: '⚠️ System Alert',
    messageTemplate: 'Important system notification: {message}',
    urgency: 'urgent' as const,
    actionUrl: '/creator/support',
    icon: '⚠️'
  }
} as const

/**
 * Real-time notification service for royalty events
 */
export class NotificationService {
  private notificationQueues: Map<Address, RoyaltyNotification[]> = new Map()
  private userPreferences: Map<Address, NotificationPreferences> = new Map()
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map()
  private deliveryHistory: Map<string, { attempts: number; lastAttempt: Date; success: boolean }> = new Map()

  constructor() {
    console.log('🔔 NotificationService initialized with real-time capabilities')
    console.log('   Supported channels:', Object.keys(NOTIFICATION_CONFIG.channels).join(', '))
    
    // Start background processors
    this.startNotificationProcessor()
    this.startCleanupProcessor()
  }

  /**
   * Send notification to user with comprehensive delivery handling
   */
  async sendNotification(
    authorAddress: Address,
    type: RoyaltyNotificationType,
    data: {
      chapterId?: string
      chapterTitle?: string
      amount?: bigint
      error?: string
      message?: string
      metadata?: Record<string, any>
    }
  ): Promise<{
    success: boolean
    notificationId: string
    deliveryChannels: string[]
    error?: string
  }> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`
      
      console.log(`🔔 [${notificationId}] Sending ${type} notification to ${authorAddress}`)
      
      // Check rate limits
      if (this.isRateLimited(authorAddress, type)) {
        console.warn(`⚠️ [${notificationId}] Rate limited for ${authorAddress}`)
        return {
          success: false,
          notificationId,
          deliveryChannels: [],
          error: 'Rate limited - too many notifications sent recently'
        }
      }
      
      // Get user preferences
      const preferences = await this.getUserPreferences(authorAddress)
      
      // Check if user wants this notification type
      if (!preferences.notificationTypes.includes(type)) {
        console.log(`📱 [${notificationId}] User has disabled ${type} notifications`)
        return {
          success: true,
          notificationId,
          deliveryChannels: [],
          error: 'Notification type disabled by user'
        }
      }
      
      // Create notification object
      const notification = this.createNotification(
        notificationId,
        authorAddress,
        type,
        data
      )
      
      // Add to queue
      this.addToQueue(authorAddress, notification)
      
      // Determine delivery channels
      const deliveryChannels = this.getDeliveryChannels(preferences, notification)
      
      // Deliver via all enabled channels
      const deliveryResults = await Promise.allSettled(
        deliveryChannels.map(channel => this.deliverNotification(notification, channel))
      )
      
      // Track delivery success
      const successfulDeliveries = deliveryResults.filter(r => r.status === 'fulfilled').length
      const success = successfulDeliveries > 0
      
      // Update rate limit counter
      this.updateRateLimit(authorAddress, type)
      
      // Track delivery history
      this.deliveryHistory.set(notificationId, {
        attempts: deliveryChannels.length,
        lastAttempt: new Date(),
        success
      })
      
      console.log(`${success ? '✅' : '❌'} [${notificationId}] Notification delivery ${success ? 'successful' : 'failed'}:`, {
        channels: deliveryChannels,
        successfulDeliveries,
        totalChannels: deliveryChannels.length
      })
      
      return {
        success,
        notificationId,
        deliveryChannels,
        error: success ? undefined : 'Failed to deliver via any channel'
      }
      
    } catch (error) {
      console.error('💥 Failed to send notification:', error)
      return {
        success: false,
        notificationId: 'error',
        deliveryChannels: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send batch notifications efficiently
   */
  async sendBatchNotifications(
    notifications: Array<{
      authorAddress: Address
      type: RoyaltyNotificationType
      data: any
    }>
  ): Promise<{
    successful: number
    failed: number
    results: Array<{ success: boolean; notificationId: string; error?: string }>
  }> {
    console.log(`📬 Sending batch of ${notifications.length} notifications`)
    
    const results = await Promise.allSettled(
      notifications.map(notif => 
        this.sendNotification(notif.authorAddress, notif.type, notif.data)
      )
    )
    
    let successful = 0
    let failed = 0
    const processedResults = results.map(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        successful++
        return result.value
      } else {
        failed++
        return {
          success: false,
          notificationId: 'batch_error',
          error: result.status === 'rejected' ? result.reason : result.value.error
        }
      }
    })
    
    console.log(`📊 Batch notification results: ${successful} successful, ${failed} failed`)
    
    return {
      successful,
      failed,
      results: processedResults
    }
  }

  /**
   * Get notifications for a user with filtering
   */
  async getNotifications(
    authorAddress: Address,
    options: {
      unreadOnly?: boolean
      limit?: number
      types?: RoyaltyNotificationType[]
      since?: Date
    } = {}
  ): Promise<RoyaltyNotification[]> {
    const { unreadOnly = false, limit = 50, types, since } = options
    
    let notifications = this.notificationQueues.get(authorAddress) || []
    
    // Apply filters
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }
    
    if (types && types.length > 0) {
      notifications = notifications.filter(n => types.includes(n.type))
    }
    
    if (since) {
      notifications = notifications.filter(n => n.timestamp >= since)
    }
    
    // Sort by timestamp (newest first) and limit
    return notifications
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(
    authorAddress: Address,
    notificationIds: string[]
  ): Promise<{ marked: number; notFound: number }> {
    const notifications = this.notificationQueues.get(authorAddress) || []
    let marked = 0
    let notFound = 0
    
    for (const id of notificationIds) {
      const notification = notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
        marked++
      } else {
        notFound++
      }
    }
    
    console.log(`📖 Marked ${marked} notifications as read for ${authorAddress}`)
    
    return { marked, notFound }
  }

  /**
   * Get/set user notification preferences
   */
  async getUserPreferences(authorAddress: Address): Promise<NotificationPreferences> {
    let preferences = this.userPreferences.get(authorAddress)
    
    if (!preferences) {
      // Create default preferences
      preferences = {
        authorAddress,
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        notificationTypes: ['new_royalty', 'claim_success', 'claim_failed', 'large_payment', 'monthly_summary'],
        minimumAmountThreshold: NOTIFICATION_CONFIG.thresholds.monthlyMinimum,
        frequency: 'immediate',
        lastUpdated: new Date()
      }
      
      this.userPreferences.set(authorAddress, preferences)
    }
    
    return preferences
  }

  async updateUserPreferences(
    authorAddress: Address,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const currentPreferences = await this.getUserPreferences(authorAddress)
    
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
      authorAddress, // Ensure address can't be changed
      lastUpdated: new Date()
    }
    
    this.userPreferences.set(authorAddress, updatedPreferences)
    
    console.log(`⚙️ Updated notification preferences for ${authorAddress}:`, updates)
    
    return updatedPreferences
  }

  /**
   * Trigger specific notification types
   */
  async triggerRoyaltyAvailable(
    authorAddress: Address,
    chapterId: string,
    amount: bigint,
    chapterTitle?: string
  ): Promise<void> {
    // Check if amount meets threshold
    const preferences = await this.getUserPreferences(authorAddress)
    if (amount < preferences.minimumAmountThreshold) {
      console.log(`💭 Royalty amount ${formatEther(amount)} below threshold, not sending notification`)
      return
    }
    
    const notificationType: RoyaltyNotificationType = amount >= NOTIFICATION_CONFIG.thresholds.largePayment
      ? 'large_payment'
      : 'new_royalty'
    
    await this.sendNotification(authorAddress, notificationType, {
      chapterId,
      chapterTitle: chapterTitle || `Chapter ${chapterId}`,
      amount
    })
  }

  async triggerClaimResult(
    authorAddress: Address,
    chapterId: string,
    success: boolean,
    amount?: bigint,
    error?: string,
    chapterTitle?: string
  ): Promise<void> {
    const type: RoyaltyNotificationType = success ? 'claim_success' : 'claim_failed'
    
    await this.sendNotification(authorAddress, type, {
      chapterId,
      chapterTitle: chapterTitle || `Chapter ${chapterId}`,
      amount,
      error
    })
  }

  async triggerMonthlySummary(
    authorAddress: Address,
    totalAmount: bigint,
    chapterCount: number
  ): Promise<void> {
    await this.sendNotification(authorAddress, 'monthly_summary', {
      amount: totalAmount,
      metadata: { chapterCount }
    })
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(authorAddress?: Address): {
    totalNotifications: number
    unreadCount: number
    deliverySuccessRate: number
    recentActivity: Array<{ date: string; count: number }>
    byType: Record<RoyaltyNotificationType, number>
  } {
    let allNotifications: RoyaltyNotification[] = []
    
    if (authorAddress) {
      allNotifications = this.notificationQueues.get(authorAddress) || []
    } else {
      // Aggregate all notifications
      for (const notifications of this.notificationQueues.values()) {
        allNotifications.push(...notifications)
      }
    }
    
    const totalNotifications = allNotifications.length
    const unreadCount = allNotifications.filter(n => !n.read).length
    
    // Calculate delivery success rate
    const deliveryAttempts = Array.from(this.deliveryHistory.values())
    const successfulDeliveries = deliveryAttempts.filter(d => d.success).length
    const deliverySuccessRate = deliveryAttempts.length > 0 
      ? (successfulDeliveries / deliveryAttempts.length) * 100 
      : 100
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentNotifications = allNotifications.filter(n => n.timestamp >= sevenDaysAgo)
    
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const count = recentNotifications.filter(n => 
        n.timestamp >= dayStart && n.timestamp < dayEnd
      ).length
      
      recentActivity.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }
    
    // By type breakdown
    const byType: any = {}
    const types: RoyaltyNotificationType[] = ['new_royalty', 'claim_success', 'claim_failed', 'large_payment', 'monthly_summary', 'threshold_reached', 'system_alert']
    
    for (const type of types) {
      byType[type] = allNotifications.filter(n => n.type === type).length
    }
    
    return {
      totalNotifications,
      unreadCount,
      deliverySuccessRate: Math.round(deliverySuccessRate * 100) / 100,
      recentActivity,
      byType
    }
  }

  // Private helper methods

  private createNotification(
    id: string,
    authorAddress: Address,
    type: RoyaltyNotificationType,
    data: any
  ): RoyaltyNotification {
    const template = NOTIFICATION_TEMPLATES[type]
    
    // Replace placeholders in message template
    let message = template.messageTemplate
    if (data.amount) {
      message = message.replace('{amount}', formatEther(data.amount))
    }
    if (data.chapterTitle) {
      message = message.replace('{chapterTitle}', data.chapterTitle)
    }
    if (data.error) {
      message = message.replace('{error}', data.error)
    }
    if (data.message) {
      message = message.replace('{message}', data.message)
    }
    if (data.metadata?.chapterCount) {
      message = message.replace('{chapterCount}', data.metadata.chapterCount.toString())
    }
    if (data.metadata?.totalAmount) {
      message = message.replace('{totalAmount}', formatEther(data.metadata.totalAmount))
    }
    
    const priority = template.urgency === 'urgent' ? 'urgent' : 
                    template.urgency === 'high' ? 'high' :
                    template.urgency === 'medium' ? 'medium' : 'low'
    
    return {
      id,
      chapterId: data.chapterId || '',
      authorAddress,
      type,
      title: template.title,
      message,
      amount: data.amount,
      amountFormatted: data.amount ? formatEther(data.amount) : undefined,
      metadata: data.metadata,
      timestamp: new Date(),
      read: false,
      actionUrl: template.actionUrl,
      priority
    }
  }

  private addToQueue(authorAddress: Address, notification: RoyaltyNotification): void {
    const queue = this.notificationQueues.get(authorAddress) || []
    queue.unshift(notification) // Add to front (newest first)
    
    // Limit queue size (keep last 100 notifications)
    if (queue.length > 100) {
      queue.splice(100)
    }
    
    this.notificationQueues.set(authorAddress, queue)
  }

  private getDeliveryChannels(
    preferences: NotificationPreferences,
    notification: RoyaltyNotification
  ): string[] {
    const channels: string[] = []
    
    // Always add in-app notifications
    if (preferences.inAppNotifications) {
      channels.push('in-app')
    }
    
    // Add email for important notifications
    if (preferences.emailNotifications && 
        ['large_payment', 'monthly_summary', 'system_alert'].includes(notification.type)) {
      channels.push('email')
    }
    
    // Add push for immediate notifications
    if (preferences.pushNotifications && preferences.frequency === 'immediate') {
      channels.push('push')
    }
    
    return channels
  }

  private async deliverNotification(
    notification: RoyaltyNotification,
    channel: string
  ): Promise<boolean> {
    try {
      console.log(`📤 Delivering ${notification.type} via ${channel} to ${notification.authorAddress}`)
      
      switch (channel) {
        case 'in-app':
          // In-app notifications are stored in queue (already done)
          return true
          
        case 'email':
          // In production, integrate with email service (SendGrid, AWS SES, etc.)
          console.log(`📧 Email notification sent: ${notification.title}`)
          return await this.simulateEmailDelivery(notification)
          
        case 'push':
          // In production, integrate with push notification service
          console.log(`📱 Push notification sent: ${notification.title}`)
          return await this.simulatePushDelivery(notification)
          
        case 'webhook':
          // In production, call configured webhook endpoints
          console.log(`🔗 Webhook notification sent: ${notification.title}`)
          return await this.simulateWebhookDelivery(notification)
          
        default:
          console.warn(`⚠️ Unknown delivery channel: ${channel}`)
          return false
      }
    } catch (error) {
      console.error(`❌ Failed to deliver via ${channel}:`, error)
      return false
    }
  }

  private async simulateEmailDelivery(notification: RoyaltyNotification): Promise<boolean> {
    // Simulate email delivery delay and 95% success rate
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    return Math.random() > 0.05
  }

  private async simulatePushDelivery(notification: RoyaltyNotification): Promise<boolean> {
    // Simulate push delivery delay and 90% success rate
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    return Math.random() > 0.10
  }

  private async simulateWebhookDelivery(notification: RoyaltyNotification): Promise<boolean> {
    // Simulate webhook delivery delay and 85% success rate
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
    return Math.random() > 0.15
  }

  private isRateLimited(authorAddress: Address, type: RoyaltyNotificationType): boolean {
    const key = `${authorAddress}_${type}`
    const now = Date.now()
    const counter = this.rateLimitCounters.get(key)
    
    if (!counter || now > counter.resetTime) {
      return false
    }
    
    return counter.count >= NOTIFICATION_CONFIG.rateLimits.maxNotificationsPerHour
  }

  private updateRateLimit(authorAddress: Address, type: RoyaltyNotificationType): void {
    const key = `${authorAddress}_${type}`
    const now = Date.now()
    const resetTime = now + (60 * 60 * 1000) // 1 hour from now
    
    const counter = this.rateLimitCounters.get(key)
    
    if (!counter || now > counter.resetTime) {
      this.rateLimitCounters.set(key, { count: 1, resetTime })
    } else {
      counter.count++
    }
  }

  private startNotificationProcessor(): void {
    // Background processor for batching and optimizing delivery
    setInterval(() => {
      this.processNotificationQueue()
    }, 30000) // Every 30 seconds
  }

  private startCleanupProcessor(): void {
    // Clean up old data periodically
    setInterval(() => {
      this.cleanupOldData()
    }, 60 * 60 * 1000) // Every hour
  }

  private processNotificationQueue(): void {
    // In production, this would batch and optimize notification delivery
    console.log('🔄 Processing notification queue (background)')
  }

  private cleanupOldData(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    
    // Clean up old rate limit counters
    for (const [key, counter] of this.rateLimitCounters.entries()) {
      if (counter.resetTime < Date.now()) {
        this.rateLimitCounters.delete(key)
      }
    }
    
    // Clean up old delivery history
    for (const [key, history] of this.deliveryHistory.entries()) {
      if (history.lastAttempt.getTime() < thirtyDaysAgo) {
        this.deliveryHistory.delete(key)
      }
    }
    
    console.log('🧹 Cleaned up old notification data')
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService