/**
 * @fileoverview Main entry point for @storyhouse/shared package
 * Exports types, services, and utilities for StoryHouse.vip
 */
import type { StoryAnalytics } from './types/enhanced';
export type { EnhancedStory, EnhancedChapter, EnhancedUser, EnhancedRemixLicense, StoryCollection, IPOperationRecord, EnhancedApiResponse, EnhancedStoryCreationParams, EnhancedGeneratedStory, EnhancedReadingSession, StoryAnalytics, StoryWithOptionalIP, ChapterWithOptionalIP, UserWithOptionalIP } from './types/enhanced';
export { isEnhancedStory, isEnhancedChapter, isEnhancedUser, enhanceStory, enhanceChapter, enhanceUser } from './types/enhanced';
export type { IPAsset, IPMetadata, LicenseTerms, LicenseToken, Derivative, RoyaltyDistribution, StoryWithIP, ChapterWithIP, LicenseTier, IPOperation, StoryProtocolConfig, RegisterIPAssetResponse, CreateLicenseResponse, PurchaseLicenseResponse, CreateDerivativeResponse, ClaimRoyaltyResponse, IPAssetEvent, LicenseTermsConfig, EnhancedChapterIPData, EnhancedIPRegistrationResult, ChapterGenealogy } from './types/ip';
export { IPService, createIPService, defaultStoryProtocolConfig } from './services/ipService';
export { AdvancedStoryProtocolService, LICENSE_TIERS, ROYALTY_POLICIES, TIPTokenEconomicsCalculator, advancedStoryProtocolService } from './services/advancedStoryProtocolService';
export { DataService, createDataService } from './services/dataService';
export type { Address, Hash } from 'viem';
export * from './types';
export * from './constants';
export declare const formatTokenAmount: (amount: string | number, decimals?: number) => string;
export declare const parseTokenAmount: (amount: string, decimals?: number) => string;
export declare const calculateReadingTime: (wordCount: number, wordsPerMinute?: number) => number;
export declare const generateStoryId: () => string;
export declare const truncateAddress: (address: string, startLength?: number, endLength?: number) => string;
export declare const isValidEthereumAddress: (address: string) => boolean;
export declare const formatTimestamp: (timestamp: Date | string | number) => string;
export declare const calculateCollectionRevenue: (totalRevenue: number, revenueShare: {
    creator: number;
    collection: number;
    platform: number;
}) => {
    creatorShare: number;
    collectionShare: number;
    platformShare: number;
};
export declare const getOperationDisplayName: (operationType: string) => string;
export declare const getTierByPrice: (price: number) => "standard" | "premium" | "exclusive" | "custom";
export declare const calculateEngagementScore: (analytics: StoryAnalytics) => number;
//# sourceMappingURL=index.d.ts.map