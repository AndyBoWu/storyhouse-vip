/**
 * @fileoverview EventDetectionService - AI-Powered Event Detection for Notifications
 * 
 * Monitors and detects events that trigger automated notifications:
 * - New content uploads for derivative detection
 * - Engagement thresholds for optimization alerts
 * - Market trends for content opportunities
 * - Quality assessments for improvement suggestions
 * - Collaboration opportunities based on content similarity
 */

import { Address } from 'viem'
import { contentAnalysisService } from './contentAnalysisService'
import { notificationService } from './notificationService'
import { createDataService } from './dataService'

// Create dataService instance
const dataService = createDataService(true) // Enable IP functionality

export interface EventDetectionConfig {
  // Detection thresholds
  derivativeDetection: {
    enabled: boolean
    similarityThreshold: number
    checkIntervalHours: number
    autoNotify: boolean
  }
  
  // Quality monitoring
  qualityMonitoring: {
    enabled: boolean
    minQualityThreshold: number
    assessmentIntervalDays: number
    autoSuggestImprovements: boolean
  }
  
  // Collaboration matching
  collaborationDetection: {
    enabled: boolean
    compatibilityThreshold: number
    matchingIntervalDays: number
    maxSuggestionsPerWeek: number
  }
  
  // Market trend monitoring
  trendMonitoring: {
    enabled: boolean
    engagementThreshold: number
    trendAnalysisIntervalDays: number
    maxOpportunitiesPerWeek: number
  }
}

export interface DetectedEvent {
  id: string
  type: 'derivative' | 'quality' | 'collaboration' | 'trend' | 'engagement'
  authorAddress: Address
  storyId: string
  timestamp: Date
  confidence: number
  data: Record<string, any>
  notificationSent: boolean
  actionRequired: boolean
}

export interface EventDetectionStats {
  totalEventsDetected: number
  eventsByType: Record<string, number>
  notificationsSent: number
  recentActivity: Array<{
    date: string
    eventsDetected: number
    notificationsSent: number
  }>
  detectionAccuracy: number
}

// Default configuration
const DEFAULT_CONFIG: EventDetectionConfig = {
  derivativeDetection: {
    enabled: true,
    similarityThreshold: 0.4,
    checkIntervalHours: 6,
    autoNotify: true
  },
  qualityMonitoring: {
    enabled: true,
    minQualityThreshold: 0.6,
    assessmentIntervalDays: 7,
    autoSuggestImprovements: true
  },
  collaborationDetection: {
    enabled: true,
    compatibilityThreshold: 0.7,
    matchingIntervalDays: 3,
    maxSuggestionsPerWeek: 2
  },
  trendMonitoring: {
    enabled: true,
    engagementThreshold: 0.6,
    trendAnalysisIntervalDays: 1,
    maxOpportunitiesPerWeek: 3
  }
}

/**
 * AI-powered event detection service for automated notifications
 */
export class EventDetectionService {
  private config: EventDetectionConfig = DEFAULT_CONFIG
  private detectedEvents: Map<string, DetectedEvent> = new Map()
  private lastProcessingTimes: Map<string, Date> = new Map()
  private eventIdCounter = 0

  constructor() {
    console.log('🎯 EventDetectionService initialized with AI-powered monitoring')
    console.log('   🔍 Derivative detection enabled')
    console.log('   📊 Quality monitoring enabled')
    console.log('   🤝 Collaboration matching enabled')
    console.log('   📈 Market trend monitoring enabled')

    // Start background monitoring processes
    this.startDerivativeMonitoring()
    this.startQualityMonitoring()
    this.startCollaborationMonitoring()
    this.startTrendMonitoring()
    this.startEventCleanup()
  }

  /**
   * Monitor for new content uploads to trigger derivative detection
   */
  async monitorContentUploads(
    authorAddress: Address,
    storyId: string,
    chapterId: string
  ): Promise<DetectedEvent[]> {
    try {
      console.log(`📝 [Event] Monitoring new content upload: ${storyId}:${chapterId} by ${authorAddress}`)

      const events: DetectedEvent[] = []

      // Trigger derivative detection for existing stories
      if (this.config.derivativeDetection.enabled) {
        const event = await this.detectDerivativeEvent(authorAddress, storyId)
        if (event) events.push(event)
      }

      // Trigger quality assessment for the new content
      if (this.config.qualityMonitoring.enabled) {
        const event = await this.detectQualityEvent(authorAddress, storyId)
        if (event) events.push(event)
      }

      // Check for collaboration opportunities
      if (this.config.collaborationDetection.enabled) {
        const event = await this.detectCollaborationEvent(authorAddress, storyId)
        if (event) events.push(event)
      }

      console.log(`📝 [Event] Content upload monitoring complete: ${events.length} events detected`)
      return events
    } catch (error) {
      console.error('❌ [Event] Content upload monitoring failed:', error)
      return []
    }
  }

  /**
   * Monitor engagement thresholds for optimization alerts
   */
  async monitorEngagementThresholds(
    authorAddress: Address,
    storyId: string,
    engagementData: {
      reads: number
      completion: number
      rating: number
      timeSpent: number
    }
  ): Promise<DetectedEvent | null> {
    try {
      console.log(`📊 [Event] Monitoring engagement for story ${storyId}`)

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(engagementData)

      // Check if engagement meets threshold for optimization suggestions
      if (engagementScore < this.config.trendMonitoring.engagementThreshold) {
        const event: DetectedEvent = {
          id: this.generateEventId(),
          type: 'engagement',
          authorAddress,
          storyId,
          timestamp: new Date(),
          confidence: 0.8,
          data: {
            engagementScore,
            engagementData,
            suggestedOptimizations: await this.generateOptimizationSuggestions(storyId, engagementData)
          },
          notificationSent: false,
          actionRequired: true
        }

        this.detectedEvents.set(event.id, event)

        // Send notification if auto-notify is enabled
        if (this.config.qualityMonitoring.autoSuggestImprovements) {
          await this.sendEngagementNotification(event)
        }

        console.log(`📊 [Event] Low engagement detected for story ${storyId}: ${Math.round(engagementScore * 100)}%`)
        return event
      }

      return null
    } catch (error) {
      console.error('❌ [Event] Engagement monitoring failed:', error)
      return null
    }
  }

  /**
   * Get events for a specific author
   */
  async getEventsForAuthor(
    authorAddress: Address,
    options: {
      types?: DetectedEvent['type'][]
      limit?: number
      since?: Date
      unprocessedOnly?: boolean
    } = {}
  ): Promise<DetectedEvent[]> {
    const { types, limit = 50, since, unprocessedOnly = false } = options

    let events = Array.from(this.detectedEvents.values())
      .filter(event => event.authorAddress === authorAddress)

    if (types && types.length > 0) {
      events = events.filter(event => types.includes(event.type))
    }

    if (since) {
      events = events.filter(event => event.timestamp >= since)
    }

    if (unprocessedOnly) {
      events = events.filter(event => !event.notificationSent)
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return events.slice(0, limit)
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string): Promise<boolean> {
    const event = this.detectedEvents.get(eventId)
    if (event) {
      event.notificationSent = true
      event.actionRequired = false
      console.log(`✅ [Event] Marked event ${eventId} as processed`)
      return true
    }
    return false
  }

  /**
   * Update detection configuration
   */
  updateConfig(newConfig: Partial<EventDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ [Event] Detection configuration updated:', newConfig)
  }

  /**
   * Get detection statistics
   */
  getDetectionStats(): EventDetectionStats {
    const events = Array.from(this.detectedEvents.values())
    const totalEventsDetected = events.length
    const notificationsSent = events.filter(e => e.notificationSent).length

    // Events by type
    const eventsByType: Record<string, number> = {}
    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentEvents = events.filter(e => e.timestamp >= sevenDaysAgo)

    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayEvents = recentEvents.filter(e => 
        e.timestamp >= dayStart && e.timestamp < dayEnd
      )

      recentActivity.push({
        date: date.toISOString().split('T')[0],
        eventsDetected: dayEvents.length,
        notificationsSent: dayEvents.filter(e => e.notificationSent).length
      })
    }

    // Detection accuracy (simplified - would use feedback in production)
    const detectionAccuracy = events.length > 0 ? 
      (events.filter(e => e.confidence > 0.7).length / events.length) * 100 : 
      100

    return {
      totalEventsDetected,
      eventsByType,
      notificationsSent,
      recentActivity,
      detectionAccuracy: Math.round(detectionAccuracy * 100) / 100
    }
  }

  // =============================================================================
  // PRIVATE EVENT DETECTION METHODS
  // =============================================================================

  private async detectDerivativeEvent(
    authorAddress: Address,
    storyId: string
  ): Promise<DetectedEvent | null> {
    try {
      const result = await notificationService.detectAndNotifyDerivatives(
        authorAddress,
        storyId,
        {
          similarityThreshold: this.config.derivativeDetection.similarityThreshold,
          autoNotify: false // We handle notification separately
        }
      )

      if (result.derivativesFound > 0) {
        const event: DetectedEvent = {
          id: this.generateEventId(),
          type: 'derivative',
          authorAddress,
          storyId,
          timestamp: new Date(),
          confidence: 0.9,
          data: {
            derivativesFound: result.derivativesFound,
            detectionResults: result.detectionResults
          },
          notificationSent: false,
          actionRequired: true
        }

        this.detectedEvents.set(event.id, event)

        if (this.config.derivativeDetection.autoNotify) {
          await this.sendDerivativeNotification(event)
        }

        return event
      }

      return null
    } catch (error) {
      console.error('❌ [Event] Derivative detection failed:', error)
      return null
    }
  }

  private async detectQualityEvent(
    authorAddress: Address,
    storyId: string
  ): Promise<DetectedEvent | null> {
    try {
      const result = await notificationService.assessAndSuggestQualityImprovements(
        authorAddress,
        storyId,
        {
          minQualityThreshold: this.config.qualityMonitoring.minQualityThreshold,
          includeComparison: true
        }
      )

      if (result.improvementsFound > 0 || result.qualityScore < this.config.qualityMonitoring.minQualityThreshold) {
        const event: DetectedEvent = {
          id: this.generateEventId(),
          type: 'quality',
          authorAddress,
          storyId,
          timestamp: new Date(),
          confidence: 0.85,
          data: {
            qualityScore: result.qualityScore,
            improvementsFound: result.improvementsFound
          },
          notificationSent: result.notificationsSent > 0,
          actionRequired: result.improvementsFound > 0
        }

        this.detectedEvents.set(event.id, event)
        return event
      }

      return null
    } catch (error) {
      console.error('❌ [Event] Quality detection failed:', error)
      return null
    }
  }

  private async detectCollaborationEvent(
    authorAddress: Address,
    storyId: string
  ): Promise<DetectedEvent | null> {
    try {
      const result = await notificationService.findCollaborationOpportunities(
        authorAddress,
        storyId,
        {
          compatibilityThreshold: this.config.collaborationDetection.compatibilityThreshold,
          maxSuggestions: this.config.collaborationDetection.maxSuggestionsPerWeek
        }
      )

      if (result.opportunitiesFound > 0) {
        const event: DetectedEvent = {
          id: this.generateEventId(),
          type: 'collaboration',
          authorAddress,
          storyId,
          timestamp: new Date(),
          confidence: 0.75,
          data: {
            opportunitiesFound: result.opportunitiesFound
          },
          notificationSent: result.notificationsSent > 0,
          actionRequired: result.opportunitiesFound > 0
        }

        this.detectedEvents.set(event.id, event)
        return event
      }

      return null
    } catch (error) {
      console.error('❌ [Event] Collaboration detection failed:', error)
      return null
    }
  }

  // =============================================================================
  // BACKGROUND MONITORING PROCESSES
  // =============================================================================

  private startDerivativeMonitoring(): void {
    const intervalMs = this.config.derivativeDetection.checkIntervalHours * 60 * 60 * 1000
    
    setInterval(async () => {
      if (!this.config.derivativeDetection.enabled) return

      console.log('🔍 [Event] Running background derivative monitoring')
      
      try {
        // Get all published stories for monitoring
        const stories = await dataService.getAllStories()
        
        for (const story of stories.slice(0, 10)) { // Limit to prevent API overload
          await this.detectDerivativeEvent(story.authorAddress as Address, story.storyId)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
        }
      } catch (error) {
        console.error('❌ [Event] Background derivative monitoring failed:', error)
      }
    }, intervalMs)
  }

  private startQualityMonitoring(): void {
    const intervalMs = this.config.qualityMonitoring.assessmentIntervalDays * 24 * 60 * 60 * 1000
    
    setInterval(async () => {
      if (!this.config.qualityMonitoring.enabled) return

      console.log('📊 [Event] Running background quality monitoring')
      
      try {
        const stories = await dataService.getAllStories()
        
        for (const story of stories.slice(0, 5)) { // Limit for API costs
          await this.detectQualityEvent(story.authorAddress as Address, story.storyId)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Rate limiting
        }
      } catch (error) {
        console.error('❌ [Event] Background quality monitoring failed:', error)
      }
    }, intervalMs)
  }

  private startCollaborationMonitoring(): void {
    const intervalMs = this.config.collaborationDetection.matchingIntervalDays * 24 * 60 * 60 * 1000
    
    setInterval(async () => {
      if (!this.config.collaborationDetection.enabled) return

      console.log('🤝 [Event] Running background collaboration monitoring')
      
      try {
        const stories = await dataService.getAllStories()
        
        for (const story of stories.slice(0, 3)) {
          await this.detectCollaborationEvent(story.authorAddress as Address, story.storyId)
          await new Promise(resolve => setTimeout(resolve, 3000)) // Rate limiting
        }
      } catch (error) {
        console.error('❌ [Event] Background collaboration monitoring failed:', error)
      }
    }, intervalMs)
  }

  private startTrendMonitoring(): void {
    const intervalMs = this.config.trendMonitoring.trendAnalysisIntervalDays * 24 * 60 * 60 * 1000
    
    setInterval(async () => {
      if (!this.config.trendMonitoring.enabled) return

      console.log('📈 [Event] Running background trend monitoring')
      
      try {
        // Get active creators for trend analysis
        const stories = await dataService.getAllStories()
        const activeCreators = new Set(stories.map(s => s.authorAddress))
        
        for (const creatorAddress of Array.from(activeCreators).slice(0, 10)) {
          const result = await notificationService.identifyContentOpportunities(
            creatorAddress as Address,
            {
              engagementThreshold: this.config.trendMonitoring.engagementThreshold
            }
          )
          
          if (result.opportunitiesFound > 0) {
            const event: DetectedEvent = {
              id: this.generateEventId(),
              type: 'trend',
              authorAddress: creatorAddress as Address,
              storyId: '', // Trend events are not story-specific
              timestamp: new Date(),
              confidence: 0.7,
              data: result,
              notificationSent: result.notificationsSent > 0,
              actionRequired: result.opportunitiesFound > 0
            }
            
            this.detectedEvents.set(event.id, event)
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('❌ [Event] Background trend monitoring failed:', error)
      }
    }, intervalMs)
  }

  private startEventCleanup(): void {
    // Clean up old events every 24 hours
    setInterval(() => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      for (const [eventId, event] of this.detectedEvents.entries()) {
        if (event.timestamp < thirtyDaysAgo) {
          this.detectedEvents.delete(eventId)
        }
      }
      
      console.log('🧹 [Event] Cleaned up old events')
    }, 24 * 60 * 60 * 1000)
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private generateEventId(): string {
    return `event_${Date.now()}_${++this.eventIdCounter}`
  }

  private calculateEngagementScore(engagementData: {
    reads: number
    completion: number
    rating: number
    timeSpent: number
  }): number {
    const readScore = Math.min(engagementData.reads / 100, 1)
    const completionScore = engagementData.completion / 100
    const ratingScore = engagementData.rating / 5
    const timeScore = Math.min(engagementData.timeSpent / 3600, 1) // Normalize to 1 hour

    return (readScore + completionScore + ratingScore + timeScore) / 4
  }

  private async generateOptimizationSuggestions(
    storyId: string,
    engagementData: any
  ): Promise<string[]> {
    // Simplified optimization suggestions
    const suggestions = []
    
    if (engagementData.completion < 50) {
      suggestions.push('Consider shorter chapters or more engaging hooks')
    }
    if (engagementData.rating < 3) {
      suggestions.push('Focus on character development and plot pacing')
    }
    if (engagementData.timeSpent < 600) { // Less than 10 minutes
      suggestions.push('Add more descriptive content to increase reading time')
    }
    
    return suggestions
  }

  private async sendDerivativeNotification(event: DetectedEvent): Promise<void> {
    try {
      const derivatives = event.data.detectionResults?.potentialDerivatives || []
      const topDerivative = derivatives[0]
      
      if (topDerivative) {
        await notificationService.sendNotification(event.authorAddress, 'derivative_detected', {
          originalTitle: await this.getStoryTitle(event.storyId),
          similarityScore: Math.round(topDerivative.similarityScore * 100),
          metadata: event.data
        })
        
        event.notificationSent = true
      }
    } catch (error) {
      console.error('❌ [Event] Failed to send derivative notification:', error)
    }
  }

  private async sendEngagementNotification(event: DetectedEvent): Promise<void> {
    try {
      const suggestions = event.data.suggestedOptimizations || []
      const topSuggestion = suggestions[0] || 'Review your content strategy'
      
      await notificationService.sendNotification(event.authorAddress, 'quality_improvement', {
        storyTitle: await this.getStoryTitle(event.storyId),
        improvement: topSuggestion,
        qualityScore: Math.round(event.data.engagementScore * 100),
        metadata: event.data
      })
      
      event.notificationSent = true
    } catch (error) {
      console.error('❌ [Event] Failed to send engagement notification:', error)
    }
  }

  private async getStoryTitle(storyId: string): Promise<string> {
    try {
      const story = await dataService.getIPEnhancedStory(storyId)
      return story?.title || story?.name || `Story ${storyId}`
    } catch (error) {
      console.error(`Error getting story title for ${storyId}:`, error)
      return `Story ${storyId}`
    }
  }
}

// Export singleton instance
export const eventDetectionService = new EventDetectionService()
export default eventDetectionService