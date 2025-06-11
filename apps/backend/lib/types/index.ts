/**
 * Main types export file for backend
 */

// Re-export all types from shared types
export * from './shared/index'
export * from './shared/book'
export * from './shared/enhanced'
export * from './shared/ip'

// Re-export backend-specific types
export * from './book'
export * from './ip'
export * from './r2-metadata'

// Re-export shared types for backward compatibility
import { 
  Story as BaseStory, 
  Chapter as BaseChapter, 
  User as BaseUser,
  ReadReward,
  CreatorReward,
  RemixLicense,
  ContractAddresses,
  TokenBalance,
  ApiResponse,
  EnhancedApiResponse,
  PaginatedResponse,
  StoryCreationParams,
  EnhancedStoryCreationParams,
  GeneratedStory,
  EnhancedGeneratedStory,
  ReadRewardEvent,
  CreatorRewardEvent,
  RemixFeeEvent
} from './shared/index'

export type {
  BaseStory as Story,
  BaseChapter as Chapter,
  BaseUser as User,
  ReadReward,
  CreatorReward,
  RemixLicense,
  ContractAddresses,
  TokenBalance,
  ApiResponse,
  EnhancedApiResponse,
  PaginatedResponse,
  StoryCreationParams,
  EnhancedStoryCreationParams,
  GeneratedStory,
  EnhancedGeneratedStory,
  ReadRewardEvent,
  CreatorRewardEvent,
  RemixFeeEvent
}