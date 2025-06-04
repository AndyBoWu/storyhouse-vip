export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  authorAddress: string;
  genre: string;
  mood: string;
  emoji: string;
  chapters: Chapter[];
  isRemix: boolean;
  originalStoryId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  readingTime: number;
  totalRewards: number;
  isPublished: boolean;
}

export interface Chapter {
  id: string;
  storyId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
  rewardsDistributed: number;
  createdAt: Date;
}

export interface User {
  address: string;
  username?: string;
  email?: string;
  avatar?: string;
  totalRewardsEarned: number;
  storiesCreated: number;
  chaptersRead: number;
  joinedAt: Date;
}

export interface ReadReward {
  id: string;
  userAddress: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  amount: number;
  timestamp: Date;
  transactionHash?: string;
}

export interface CreatorReward {
  id: string;
  creatorAddress: string;
  storyId: string;
  amount: number;
  reason: 'creation' | 'engagement' | 'remix_royalty';
  timestamp: Date;
  transactionHash?: string;
}

export interface RemixLicense {
  id: string;
  originalStoryId: string;
  originalCreatorAddress: string;
  remixStoryId: string;
  remixerAddress: string;
  feePercentage: number;
  totalFeePaid: number;
  timestamp: Date;
  transactionHash?: string;
}

// Contract-related types
export interface ContractAddresses {
  tipToken: string;
  storyRewards: string;
  contentNFT: string;
  remixLicensing: string;
}

export interface TokenBalance {
  balance: string;
  formatted: string;
  decimals: number;
  symbol: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Story creation types
export interface StoryCreationParams {
  plotDescription: string;
  genre: string;
  mood: string;
  emoji: string;
  maxWords?: number;
}

export interface GeneratedStory {
  title: string;
  content: string;
  themes: string[];
  wordCount: number;
  readingTime: number;
}

// Blockchain event types
export interface ReadRewardEvent {
  reader: string;
  amount: string;
  storyId: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: Date;
}

export interface CreatorRewardEvent {
  creator: string;
  amount: string;
  storyId: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: Date;
}

export interface RemixFeeEvent {
  originalCreator: string;
  remixer: string;
  amount: string;
  remixId: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: Date;
}
