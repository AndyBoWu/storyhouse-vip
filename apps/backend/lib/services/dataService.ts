/**
 * @fileoverview Data Service for enhanced story types
 * Provides backward-compatible data access with IP functionality
 */

import type { Address, Hash } from 'viem'
import type {
  Story,
  Chapter,
  User,
  RemixLicense
} from '../types/index'
import type {
  EnhancedStory,
  EnhancedChapter,
  EnhancedUser,
  EnhancedRemixLicense,
  StoryCollection,
  IPOperationRecord,
  StoryAnalytics,
  EnhancedReadingSession
} from '../types/enhanced'
import type {
  LicenseTier,
  IPOperation
} from '../types/ip'
import {
  enhanceStory,
  enhanceChapter,
  enhanceUser,
  isEnhancedStory
} from '../types/enhanced'

export class DataService {
  private ipEnabled: boolean

  constructor(ipEnabled: boolean = false) {
    this.ipEnabled = ipEnabled
  }

  /**
   * Story Management
   */

  // Get story with optional IP enhancement
  async getStory(id: string): Promise<EnhancedStory | Story | null> {
    // TODO: Implement actual database/API call
    // This is a placeholder that shows the pattern

    const baseStory = await this.fetchBaseStory(id)
    if (!baseStory) return null

    if (this.ipEnabled) {
      const ipData = await this.fetchStoryIPData(id)
      return this.mergeStoryWithIPData(baseStory, ipData)
    }

    return baseStory
  }

  // Get stories with optional IP enhancement
  async getStories(filters?: {
    author?: Address
    genre?: string
    hasIP?: boolean
    collection?: string
    limit?: number
    offset?: number
  }): Promise<(EnhancedStory | Story)[]> {
    const baseStories = await this.fetchBaseStories(filters)

    if (!this.ipEnabled) {
      return baseStories
    }

    // Enhance with IP data
    const enhancedStories = await Promise.all(
      baseStories.map(async (story) => {
        const ipData = await this.fetchStoryIPData(story.id)
        return this.mergeStoryWithIPData(story, ipData)
      })
    )

    return enhancedStories
  }

  // Create story with optional IP registration
  async createStory(
    storyData: Story,
    ipOptions?: {
      registerAsIP: boolean
      licenseType: 'standard' | 'premium' | 'exclusive'
      addToCollection?: string
    }
  ): Promise<EnhancedStory> {
    // Create base story
    const story = await this.saveBaseStory(storyData)
    const enhanced = enhanceStory(story)

    if (this.ipEnabled && ipOptions?.registerAsIP) {
      // Mark for IP registration
      enhanced.ipRegistrationStatus = 'pending'

      // Set license type
      const defaultTiers = this.getDefaultLicenseTiers()
      const selectedTier = defaultTiers[ipOptions.licenseType]
      if (selectedTier) {
        enhanced.availableLicenseTypes = [selectedTier]
        enhanced.licenseStatus = 'attached'
      }

      // Add to collection if specified
      if (ipOptions.addToCollection) {
        enhanced.collections = [ipOptions.addToCollection]
      }

      await this.saveEnhancedStoryData(enhanced)
    }

    return enhanced
  }

  /**
   * Chapter Management
   */

  async getChapter(id: string): Promise<EnhancedChapter | Chapter | null> {
    const baseChapter = await this.fetchBaseChapter(id)
    if (!baseChapter) return null

    if (this.ipEnabled) {
      const ipData = await this.fetchChapterIPData(id)
      return this.mergeChapterWithIPData(baseChapter, ipData)
    }

    return baseChapter
  }

  async getChaptersForStory(storyId: string): Promise<(EnhancedChapter | Chapter)[]> {
    const baseChapters = await this.fetchBaseChapters(storyId)

    if (!this.ipEnabled) {
      return baseChapters
    }

    const enhancedChapters = await Promise.all(
      baseChapters.map(async (chapter) => {
        const ipData = await this.fetchChapterIPData(chapter.id)
        return this.mergeChapterWithIPData(chapter, ipData)
      })
    )

    return enhancedChapters
  }

  /**
   * User Management
   */

  async getUser(address: Address): Promise<EnhancedUser | User | null> {
    const baseUser = await this.fetchBaseUser(address)
    if (!baseUser) return null

    if (this.ipEnabled) {
      const ipData = await this.fetchUserIPData(address)
      return this.mergeUserWithIPData(baseUser, ipData)
    }

    return baseUser
  }

  /**
   * Collection Management
   */

  async getCollections(filters?: {
    creator?: Address
    isPublic?: boolean
    genre?: string
    limit?: number
    offset?: number
  }): Promise<StoryCollection[]> {
    if (!this.ipEnabled) return []

    return this.fetchCollections(filters)
  }

  async createCollection(collectionData: Omit<StoryCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoryCollection> {
    const collection: StoryCollection = {
      ...collectionData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return this.saveCollection(collection)
  }

  /**
   * Analytics
   */

  async getStoryAnalytics(storyId: string): Promise<StoryAnalytics | null> {
    if (!this.ipEnabled) return null

    return this.fetchStoryAnalytics(storyId)
  }

  /**
   * IP Operations
   */

  async getIPOperations(filters?: {
    storyId?: string
    userAddress?: Address
    operationType?: string
    status?: 'pending' | 'success' | 'failed'
  }): Promise<IPOperationRecord[]> {
    if (!this.ipEnabled) return []

    return this.fetchIPOperations(filters)
  }

  async createIPOperation(operation: Omit<IPOperation, 'id' | 'createdAt' | 'updatedAt'>): Promise<IPOperationRecord> {
    const record: IPOperationRecord = {
      ...operation,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: this.getOperationDisplayName(operation.operationType),
      description: this.getOperationDescription(operation),
      canRetry: operation.status === 'failed'
    }

    return this.saveIPOperation(record)
  }

  /**
   * Reading Sessions
   */

  async createReadingSession(
    userAddress: Address,
    storyId: string,
    chapterId: string,
    chapterNumber: number
  ): Promise<EnhancedReadingSession> {
    const session: EnhancedReadingSession = {
      id: this.generateId(),
      userAddress,
      storyId,
      chapterId,
      chapterNumber,
      startTime: new Date(),
      totalReadingTime: 0,
      progress: 0,
      rewardsClaimed: false,
      rewardAmount: 0,
      baseReward: 0,
      streakBonus: 0,
      qualityBonus: 0,
      trackedViaIP: this.ipEnabled,
      minReadTimeReached: false,
      validSession: true,
      timestamps: {
        created: new Date(),
        started: new Date()
      }
    }

    // Set IP asset ID if IP tracking is enabled
    if (this.ipEnabled) {
      const story = await this.getStory(storyId)
      if (story && isEnhancedStory(story) && story.ipAssetId) {
        session.ipAssetId = story.ipAssetId
      }
    }

    return this.saveReadingSession(session)
  }

  /**
   * Utility Methods
   */

  setIPEnabled(enabled: boolean): void {
    this.ipEnabled = enabled
  }

  isIPEnabled(): boolean {
    return this.ipEnabled
  }

  /**
   * Private Helper Methods
   */

  private async fetchBaseStory(id: string): Promise<Story | null> {
    // TODO: Implement actual database/API call
    console.log('Fetching base story:', id)
    return null
  }

  private async fetchBaseStories(filters?: any): Promise<Story[]> {
    // TODO: Implement actual database/API call
    console.log('Fetching base stories with filters:', filters)
    return []
  }

  private async fetchStoryIPData(storyId: string): Promise<Partial<EnhancedStory> | null> {
    // TODO: Implement actual IP data fetching
    console.log('Fetching IP data for story:', storyId)
    return {
      ipRegistrationStatus: 'none',
      licenseStatus: 'none',
      availableLicenseTypes: [],
      royaltyEarnings: 0,
      hasClaimableRoyalties: false,
      collections: []
    }
  }

  private mergeStoryWithIPData(story: Story, ipData: Partial<EnhancedStory> | null): EnhancedStory {
    const enhanced = enhanceStory(story)
    if (ipData) {
      Object.assign(enhanced, ipData)
    }
    return enhanced
  }

  private async fetchBaseChapter(id: string): Promise<Chapter | null> {
    // TODO: Implement actual database/API call
    console.log('Fetching base chapter:', id)
    return null
  }

  private async fetchBaseChapters(storyId: string): Promise<Chapter[]> {
    // TODO: Implement actual database/API call
    console.log('Fetching base chapters for story:', storyId)
    return []
  }

  private async fetchChapterIPData(chapterId: string): Promise<Partial<EnhancedChapter> | null> {
    // TODO: Implement actual IP data fetching
    console.log('Fetching IP data for chapter:', chapterId)
    return {
      ipRegistrationStatus: 'none',
      isPartOfStoryIP: true
    }
  }

  private mergeChapterWithIPData(chapter: Chapter, ipData: Partial<EnhancedChapter> | null): EnhancedChapter {
    const enhanced = enhanceChapter(chapter)
    if (ipData) {
      Object.assign(enhanced, ipData)
    }
    return enhanced
  }

  private async fetchBaseUser(address: Address): Promise<User | null> {
    // TODO: Implement actual database/API call
    console.log('Fetching base user:', address)
    return null
  }

  private async fetchUserIPData(address: Address): Promise<Partial<EnhancedUser> | null> {
    // TODO: Implement actual IP data fetching
    console.log('Fetching IP data for user:', address)
    return {
      ipAssetsCreated: 0,
      ipAssetsOwned: 0,
      licensesOwned: 0,
      royaltiesEarned: 0,
      collectionsJoined: [],
      collectionsCreated: []
    }
  }

  private mergeUserWithIPData(user: User, ipData: Partial<EnhancedUser> | null): EnhancedUser {
    const enhanced = enhanceUser(user)
    if (ipData) {
      Object.assign(enhanced, ipData)
    }
    return enhanced
  }

  private async fetchCollections(filters?: any): Promise<StoryCollection[]> {
    // TODO: Implement actual database/API call
    console.log('Fetching collections with filters:', filters)
    return []
  }

  private async fetchStoryAnalytics(storyId: string): Promise<StoryAnalytics | null> {
    // TODO: Implement actual analytics fetching
    console.log('Fetching analytics for story:', storyId)
    return null
  }

  private async fetchIPOperations(filters?: any): Promise<IPOperationRecord[]> {
    // TODO: Implement actual IP operations fetching
    console.log('Fetching IP operations with filters:', filters)
    return []
  }

  private async saveBaseStory(story: Story): Promise<Story> {
    // TODO: Implement actual saving
    console.log('Saving base story:', story.id)
    return story
  }

  private async saveEnhancedStoryData(story: EnhancedStory): Promise<void> {
    // TODO: Implement actual enhanced data saving
    console.log('Saving enhanced story data:', story.id)
  }

  private async saveCollection(collection: StoryCollection): Promise<StoryCollection> {
    // TODO: Implement actual saving
    console.log('Saving collection:', collection.id)
    return collection
  }

  private async saveIPOperation(operation: IPOperationRecord): Promise<IPOperationRecord> {
    // TODO: Implement actual saving
    console.log('Saving IP operation:', operation.id)
    return operation
  }

  private async saveReadingSession(session: EnhancedReadingSession): Promise<EnhancedReadingSession> {
    // TODO: Implement actual saving
    console.log('Saving reading session:', session.id)
    return session
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getOperationDisplayName(operationType: string): string {
    const displayNames: Record<string, string> = {
      register: 'Register IP Asset',
      license: 'Create License',
      derivative: 'Register Derivative',
      royalty: 'Claim Royalties',
      collection: 'Join Collection'
    }
    return displayNames[operationType] || operationType
  }

  private getOperationDescription(operation: Omit<IPOperation, 'id' | 'createdAt' | 'updatedAt'>): string {
    switch (operation.operationType) {
      case 'register':
        return `Register story "${operation.storyId}" as an IP Asset`
      case 'license':
        return `Create license terms for story "${operation.storyId}"`
      case 'derivative':
        return `Register derivative story "${operation.storyId}"`
      case 'royalty':
        return `Claim royalties for story "${operation.storyId}"`
      case 'collection':
        return `Add story "${operation.storyId}" to collection`
      default:
        return `${operation.operationType} operation for story "${operation.storyId}"`
    }
  }

  private getDefaultLicenseTiers(): Record<string, LicenseTier> {
    return {
      standard: {
        name: 'standard',
        displayName: 'Standard License',
        price: BigInt('100000000000000000000'), // 100 TIP tokens
        royaltyPercentage: 5,
        terms: {
          commercialUse: true,
          derivativesAllowed: true,
          attribution: true,
          shareAlike: false,
          exclusivity: false
        }
      },
      premium: {
        name: 'premium',
        displayName: 'Premium License',
        price: BigInt('500000000000000000000'), // 500 TIP tokens
        royaltyPercentage: 10,
        terms: {
          commercialUse: true,
          derivativesAllowed: true,
          attribution: true,
          shareAlike: false,
          exclusivity: false
        }
      },
      exclusive: {
        name: 'exclusive',
        displayName: 'Exclusive License',
        price: BigInt('2000000000000000000000'), // 2000 TIP tokens
        royaltyPercentage: 20,
        terms: {
          commercialUse: true,
          derivativesAllowed: true,
          attribution: true,
          shareAlike: false,
          exclusivity: true
        }
      }
    }
  }
}

// Export singleton instance creator
export function createDataService(ipEnabled: boolean = false): DataService {
  return new DataService(ipEnabled)
}
