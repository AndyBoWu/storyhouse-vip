/**
 * @fileoverview Data Service for enhanced story types
 * Provides backward-compatible data access with IP functionality
 */
import type { Address } from 'viem';
import type { Story, Chapter, User } from '../types/index';
import type { EnhancedStory, EnhancedChapter, EnhancedUser, StoryCollection, IPOperationRecord, StoryAnalytics, EnhancedReadingSession } from '../types/enhanced';
import type { IPOperation } from '../types/ip';
export declare class DataService {
    private ipEnabled;
    constructor(ipEnabled?: boolean);
    /**
     * Story Management
     */
    getStory(id: string): Promise<EnhancedStory | Story | null>;
    getStories(filters?: {
        author?: Address;
        genre?: string;
        hasIP?: boolean;
        collection?: string;
        limit?: number;
        offset?: number;
    }): Promise<(EnhancedStory | Story)[]>;
    createStory(storyData: Story, ipOptions?: {
        registerAsIP: boolean;
        licenseType: 'standard' | 'premium' | 'exclusive';
        addToCollection?: string;
    }): Promise<EnhancedStory>;
    /**
     * Chapter Management
     */
    getChapter(id: string): Promise<EnhancedChapter | Chapter | null>;
    getChaptersForStory(storyId: string): Promise<(EnhancedChapter | Chapter)[]>;
    /**
     * User Management
     */
    getUser(address: Address): Promise<EnhancedUser | User | null>;
    /**
     * Collection Management
     */
    getCollections(filters?: {
        creator?: Address;
        isPublic?: boolean;
        genre?: string;
        limit?: number;
        offset?: number;
    }): Promise<StoryCollection[]>;
    createCollection(collectionData: Omit<StoryCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoryCollection>;
    /**
     * Analytics
     */
    getStoryAnalytics(storyId: string): Promise<StoryAnalytics | null>;
    /**
     * IP Operations
     */
    getIPOperations(filters?: {
        storyId?: string;
        userAddress?: Address;
        operationType?: string;
        status?: 'pending' | 'success' | 'failed';
    }): Promise<IPOperationRecord[]>;
    createIPOperation(operation: Omit<IPOperation, 'id' | 'createdAt' | 'updatedAt'>): Promise<IPOperationRecord>;
    /**
     * Reading Sessions
     */
    createReadingSession(userAddress: Address, storyId: string, chapterId: string, chapterNumber: number): Promise<EnhancedReadingSession>;
    /**
     * Utility Methods
     */
    setIPEnabled(enabled: boolean): void;
    isIPEnabled(): boolean;
    /**
     * Private Helper Methods
     */
    private fetchBaseStory;
    private fetchBaseStories;
    private fetchStoryIPData;
    private mergeStoryWithIPData;
    private fetchBaseChapter;
    private fetchBaseChapters;
    private fetchChapterIPData;
    private mergeChapterWithIPData;
    private fetchBaseUser;
    private fetchUserIPData;
    private mergeUserWithIPData;
    private fetchCollections;
    private fetchStoryAnalytics;
    private fetchIPOperations;
    private saveBaseStory;
    private saveEnhancedStoryData;
    private saveCollection;
    private saveIPOperation;
    private saveReadingSession;
    private generateId;
    private getOperationDisplayName;
    private getOperationDescription;
    private getDefaultLicenseTiers;
}
export declare function createDataService(ipEnabled?: boolean): DataService;
//# sourceMappingURL=dataService.d.ts.map