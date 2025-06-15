/**
 * @fileoverview Enhanced types that extend existing StoryHouse.vip types with IP functionality
 * Maintains backward compatibility while adding Story Protocol features
 */
import type { Address, Hash } from 'viem';
import type { Story, Chapter, User } from './index';
import type { LicenseTier, IPOperation } from './ip';
export interface EnhancedStory extends Story {
    ipAssetId?: string;
    ipAssetAddress?: Address;
    nftTokenId?: string;
    licenseTermsIds?: string[];
    ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed';
    ipRegistrationTxHash?: Hash;
    ipRegistrationError?: string;
    licenseStatus: 'none' | 'attached' | 'available';
    availableLicenseTypes: LicenseTier[];
    derivativeChain?: string[];
    parentIpAssetId?: string;
    royaltyEarnings: number;
    hasClaimableRoyalties: boolean;
    collections?: string[];
    ipMetadata?: {
        mediaType: 'text/story';
        language: string;
        rights?: string;
        source?: string;
    };
}
export interface EnhancedChapter extends Chapter {
    ipAssetId?: string;
    ipAssetAddress?: Address;
    nftTokenId?: string;
    ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed';
    isPartOfStoryIP: boolean;
    uniqueReaders?: number;
    totalReadingTime?: number;
    ipReadsCount?: number;
}
export interface EnhancedUser extends User {
    ipAssetsCreated: number;
    ipAssetsOwned: number;
    licensesOwned: number;
    royaltiesEarned: number;
    collectionsJoined: string[];
    collectionsCreated: string[];
    ipPreferences?: {
        defaultLicenseTier: 'standard' | 'premium' | 'exclusive';
        autoRegisterAsIP: boolean;
        enableRoyalties: boolean;
        joinCollections: boolean;
    };
}
export interface EnhancedRemixLicense {
    id: string;
    originalStoryId: string;
    originalCreatorAddress: string;
    remixStoryId: string;
    remixerAddress: string;
    feePercentage: number;
    totalFeePaid: number;
    timestamp: Date;
    transactionHash?: string;
    parentIpAssetId?: string;
    childIpAssetId?: string;
    licenseTokenId?: string;
    licenseTermsId?: string;
    storyProtocolTxHash?: Hash;
    licenseTier?: 'standard' | 'premium' | 'exclusive';
    isIPLicense: boolean;
}
export interface StoryCollection {
    id: string;
    name: string;
    description: string;
    creatorAddress: Address;
    groupId?: string;
    groupPoolAddress?: Address;
    rewardPoolAddress?: Address;
    isPublic: boolean;
    allowContributions: boolean;
    requireApproval: boolean;
    revenueShare: {
        creator: number;
        collection: number;
        platform: number;
    };
    creators: Address[];
    stories: string[];
    ipAssets: string[];
    genre?: string;
    theme?: string;
    tags: string[];
    coverImage?: string;
    totalEarnings: number;
    memberCount: number;
    storyCount: number;
    totalReads: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IPOperationRecord extends IPOperation {
    displayName: string;
    description: string;
    canRetry: boolean;
    estimatedGas?: bigint;
    storyTitle?: string;
    recipientName?: string;
    collectionName?: string;
}
export interface EnhancedApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    ipData?: {
        transactionHash?: Hash;
        ipAssetId?: string;
        gasUsed?: bigint;
        operationId?: string;
    };
}
export interface EnhancedStoryCreationParams {
    plotDescription: string;
    genre: string;
    mood: string;
    emoji: string;
    maxWords?: number;
    registerAsIP: boolean;
    licenseType: 'standard' | 'premium' | 'exclusive' | 'custom';
    commercialRights: boolean;
    derivativeRights: boolean;
    addToCollection?: string;
    createNewCollection?: {
        name: string;
        description: string;
        isPublic: boolean;
        revenueShare: {
            creator: number;
            collection: number;
            platform: number;
        };
    };
    customLicense?: {
        price: number;
        royaltyPercentage: number;
        terms: {
            commercialUse: boolean;
            derivativesAllowed: boolean;
            attribution: boolean;
            shareAlike: boolean;
            exclusivity: boolean;
            territories: string[];
            contentRestrictions: string[];
        };
    };
}
export interface EnhancedGeneratedStory {
    title: string;
    content: string;
    themes: string[];
    wordCount: number;
    readingTime: number;
    suggestedTags: string[];
    suggestedGenre: string;
    contentRating: 'G' | 'PG' | 'PG-13' | 'R';
    language: string;
    qualityScore: number;
    originalityScore: number;
    commercialViability: number;
}
export interface EnhancedReadingSession {
    id: string;
    userAddress: Address;
    storyId: string;
    chapterId: string;
    chapterNumber: number;
    startTime: Date;
    endTime?: Date;
    totalReadingTime: number;
    progress: number;
    rewardsClaimed: boolean;
    rewardAmount: number;
    baseReward: number;
    streakBonus: number;
    qualityBonus: number;
    ipAssetId?: string;
    trackedViaIP: boolean;
    minReadTimeReached: boolean;
    validSession: boolean;
    timestamps: {
        created: Date;
        started: Date;
        completed?: Date;
    };
}
export interface StoryAnalytics {
    storyId: string;
    totalReads: number;
    uniqueReaders: number;
    averageReadingTime: number;
    completionRate: number;
    totalRewards: number;
    readerRewards: number;
    creatorRewards: number;
    remixRoyalties: number;
    ipAssetViews?: number;
    licenseViews?: number;
    derivativeCount?: number;
    royaltyRevenue?: number;
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
    dailyReads: Record<string, number>;
    weeklyTrends: {
        week: string;
        reads: number;
        revenue: number;
    }[];
    lastUpdated: Date;
}
export type StoryWithOptionalIP = Story | EnhancedStory;
export type ChapterWithOptionalIP = Chapter | EnhancedChapter;
export type UserWithOptionalIP = User | EnhancedUser;
export declare function isEnhancedStory(story: StoryWithOptionalIP): story is EnhancedStory;
export declare function isEnhancedChapter(chapter: ChapterWithOptionalIP): chapter is EnhancedChapter;
export declare function isEnhancedUser(user: UserWithOptionalIP): user is EnhancedUser;
export declare function enhanceStory(story: Story): EnhancedStory;
export declare function enhanceChapter(chapter: Chapter): EnhancedChapter;
export declare function enhanceUser(user: User): EnhancedUser;
//# sourceMappingURL=enhanced.d.ts.map