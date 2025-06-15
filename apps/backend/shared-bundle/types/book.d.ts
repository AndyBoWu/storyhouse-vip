/**
 * Book Registration & Branching System Types
 *
 * This file defines the complete type system for StoryHouse.vip's revolutionary
 * collaborative book ecosystem where books are parent IP assets and chapters
 * are derivatives, enabling seamless branching and revenue sharing.
 */
export interface BookMetadata {
    bookId: string;
    title: string;
    description: string;
    authorAddress: string;
    authorName: string;
    slug: string;
    coverUrl?: string;
    ipAssetId?: string;
    licenseTermsId?: string;
    parentBook?: string;
    branchPoint?: string;
    derivativeBooks: string[];
    chapterMap: {
        [chapterNumber: string]: string;
    };
    originalAuthors: {
        [authorAddress: string]: {
            chapters: string[];
            revenueShare: number;
        };
    };
    totalChapters: number;
    genres: string[];
    contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
    isRemixable: boolean;
    createdAt: string;
    updatedAt: string;
    totalReads: number;
    averageRating: number;
    totalRevenue: number;
}
export interface ChapterMetadata {
    chapterId: string;
    chapterNumber: number;
    title: string;
    summary: string;
    content: string;
    authorAddress: string;
    authorName: string;
    bookId: string;
    ipAssetId?: string;
    parentIpAssetId?: string;
    unlockPrice: number;
    readReward: number;
    licensePrice: number;
    wordCount: number;
    readingTime: number;
    qualityScore?: number;
    originalityScore?: number;
    generationMethod: 'ai' | 'human' | 'hybrid';
    aiPrompt?: string;
    aiModel?: string;
    totalReads: number;
    averageRating: number;
    totalRevenue: number;
    genre: string;
    mood: string;
    contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
    tags: string[];
    createdAt: string;
    updatedAt: string;
}
export interface BookRegistrationRequest {
    title: string;
    description: string;
    authorAddress: string;
    authorName?: string;
    coverFile?: File;
    genres: string[];
    contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
    licenseTerms: {
        commercialUse: boolean;
        derivativesAllowed: boolean;
        commercialRevShare: number;
        mintingFee?: string;
    };
}
export interface BookBranchingRequest {
    parentBookId: string;
    branchPoint: string;
    newTitle: string;
    newDescription: string;
    newCover?: File;
    authorAddress: string;
    authorName?: string;
    genres: string[];
    contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
}
export interface BookRegistrationResponse {
    success: boolean;
    book: {
        bookId: string;
        ipAssetId?: string;
        slug: string;
        coverUrl?: string;
        licenseTermsId?: string;
    };
    transactionHash?: string;
    blockchainStatus?: {
        connected: boolean;
        network: string;
        gasUsed?: string;
    };
    error?: string;
}
export interface BookBranchingResponse {
    success: boolean;
    book: {
        bookId: string;
        parentBookId: string;
        ipAssetId?: string;
        branchPoint: string;
        coverUrl?: string;
        chapterMap: {
            [chapterNumber: string]: string;
        };
        originalAuthors: BookMetadata['originalAuthors'];
    };
    transactionHash?: string;
    error?: string;
}
export interface BookDiscoveryFilters {
    author?: string;
    genre?: string;
    remixable?: boolean;
    parentBook?: string;
    contentRating?: string;
    minRating?: number;
    limit?: number;
    offset?: number;
}
export interface BookDiscoveryResponse {
    success: boolean;
    books: BookSummary[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
export interface BookSummary {
    bookId: string;
    title: string;
    authorName: string;
    authorAddress: string;
    coverUrl?: string;
    totalChapters: number;
    genres: string[];
    averageRating: number;
    totalReads: number;
    derivativeBooks?: string[];
    parentBook?: string;
    branchPoint?: string;
    isRemixable: boolean;
    createdAt: string;
}
export interface ChapterResolutionRequest {
    bookId: string;
    chapterNumber: number;
}
export interface ChapterResolutionResponse {
    success: boolean;
    chapter: {
        chapterNumber: number;
        title: string;
        content: string;
        summary: string;
        wordCount: number;
        readingTime: number;
        unlockPrice: number;
        readReward: number;
        source: {
            bookId: string;
            authorAddress: string;
            authorName: string;
            isOriginalContent: boolean;
        };
        revenueAttribution: {
            chapterAuthor: string;
            bookCurator: string;
            revenueShare: {
                chapterAuthor: number;
                bookCurator: number;
                platform: number;
            };
        };
        metadata: ChapterMetadata;
    };
    error?: string;
}
export interface BookDerivationNode {
    bookId: string;
    title: string;
    authorName: string;
    branchPoint?: string;
    totalChapters: number;
    totalReads: number;
    createdAt: string;
    derivatives: BookDerivationNode[];
}
export interface BookDerivationTreeResponse {
    success: boolean;
    tree: {
        root: BookDerivationNode;
        derivatives: BookDerivationNode[];
    };
    analytics: {
        totalDerivatives: number;
        totalAuthors: number;
        totalChapters: number;
        totalReads: number;
        averageRating: number;
        totalRevenue: number;
    };
}
export interface BookStoragePath {
    bookFolder: string;
    metadataPath: string;
    coverPath: string;
    chaptersFolder: string;
}
export interface ChapterStoragePath {
    chapterFolder: string;
    contentPath: string;
    metadataPath: string;
}
export interface BookValidationRules {
    title: {
        minLength: number;
        maxLength: number;
        pattern?: RegExp;
    };
    description: {
        minLength: number;
        maxLength: number;
    };
    slug: {
        pattern: RegExp;
        maxLength: number;
    };
    genres: {
        minCount: number;
        maxCount: number;
        allowedValues: string[];
    };
}
export interface BookSystemError {
    code: 'BOOK_NOT_FOUND' | 'INVALID_BRANCH_POINT' | 'UNAUTHORIZED_AUTHOR' | 'DUPLICATE_BOOK_ID' | 'INVALID_CHAPTER_MAP' | 'IP_REGISTRATION_FAILED' | 'STORAGE_ERROR' | 'VALIDATION_ERROR';
    message: string;
    details?: any;
}
export type BookId = string;
export type ChapterId = string;
export type AuthorAddress = `0x${string}`;
export type ChapterNumber = number;
export type RevenueShare = number;
export type ChapterMapEntry = {
    chapterNumber: string;
    sourcePath: string;
};
export declare const BOOK_SYSTEM_CONSTANTS: {
    readonly BOOKS_ROOT_PATH: "/books";
    readonly CHAPTERS_FOLDER_NAME: "chapters";
    readonly METADATA_FILENAME: "metadata.json";
    readonly COVER_FILENAME: "cover.jpg";
    readonly MIN_TITLE_LENGTH: 3;
    readonly MAX_TITLE_LENGTH: 100;
    readonly MIN_DESCRIPTION_LENGTH: 10;
    readonly MAX_DESCRIPTION_LENGTH: 1000;
    readonly MAX_SLUG_LENGTH: 50;
    readonly DEFAULT_CHAPTER_AUTHOR_SHARE: 80;
    readonly DEFAULT_BOOK_CURATOR_SHARE: 10;
    readonly DEFAULT_PLATFORM_SHARE: 10;
    readonly MAX_COVER_SIZE_MB: 5;
    readonly ALLOWED_COVER_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly SLUG_PATTERN: RegExp;
    readonly BOOK_ID_PATTERN: RegExp;
};
//# sourceMappingURL=book.d.ts.map