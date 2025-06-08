/**
 * Book Registration & Branching System Types
 * 
 * This file defines the complete type system for StoryHouse.vip's revolutionary
 * collaborative book ecosystem where books are parent IP assets and chapters
 * are derivatives, enabling seamless branching and revenue sharing.
 */

// ===== CORE BOOK TYPES =====

export interface BookMetadata {
  // Basic Information
  bookId: string;              // "{authorAddress}-{slug}" format
  title: string;               // "The Detective's Portal: Sci-Fi Adventure"
  description: string;         // Book description
  authorAddress: string;       // "0x5678..."
  authorName: string;          // "Boris" or last 4 chars of address
  slug: string;               // "detective-sf" (URL-safe)
  coverUrl?: string;          // R2 URL to book cover image
  
  // IP Registration
  ipAssetId?: string;         // Story Protocol IP asset ID
  licenseTermsId?: string;    // PIL terms for licensing
  
  // Branching Information
  parentBook?: string;        // "0x1234-detective" (for derivative books)
  branchPoint?: string;       // "ch3" (where branching occurred)
  derivativeBooks: string[];  // ["0x9abc-detective-dark"] (child books)
  
  // Chapter Resolution Map - CORE FEATURE
  chapterMap: {
    [chapterNumber: string]: string; // "ch1": "0x1234-detective/chapters/ch1"
  };
  
  // Revenue Attribution
  originalAuthors: {
    [authorAddress: string]: {
      chapters: string[];       // ["ch1", "ch2", "ch3"]
      revenueShare: number;     // Percentage (0-100)
    };
  };
  
  // Discovery & Analytics
  totalChapters: number;
  genres: string[];
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  isRemixable: boolean;
  createdAt: string;          // ISO string
  updatedAt: string;          // ISO string
  
  // Engagement Metrics
  totalReads: number;
  averageRating: number;      // 0-5 stars
  totalRevenue: number;       // $TIP earned
}

export interface ChapterMetadata {
  // Basic Information
  chapterId: string;          // Unique chapter identifier
  chapterNumber: number;      // Chapter position in book
  title: string;             // Chapter title
  summary: string;           // Brief chapter summary for TOC
  content: string;           // Full chapter content
  
  // Authorship
  authorAddress: string;      // Who wrote this chapter
  authorName: string;         // Display name
  bookId: string;            // Parent book ID
  
  // IP Registration
  ipAssetId?: string;        // Story Protocol chapter IP asset ID
  parentIpAssetId?: string;  // Book IP asset ID (parent)
  
  // Economics
  unlockPrice: number;       // $TIP cost to read
  readReward: number;        // $TIP earned for completion
  licensePrice: number;      // $TIP cost for remix rights
  
  // Content Metrics
  wordCount: number;
  readingTime: number;       // Estimated minutes
  qualityScore?: number;     // AI-generated (0-100)
  originalityScore?: number; // AI-generated (0-100)
  
  // Generation Details
  generationMethod: 'ai' | 'human' | 'hybrid';
  aiPrompt?: string;         // Original prompt if AI-generated
  aiModel?: string;          // "gpt-4" etc.
  
  // Engagement
  totalReads: number;
  averageRating: number;     // 0-5 stars
  totalRevenue: number;      // $TIP earned
  
  // Classification
  genre: string;
  mood: string;
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  tags: string[];
  
  createdAt: string;         // ISO string
  updatedAt: string;         // ISO string
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface BookRegistrationRequest {
  title: string;
  description: string;
  authorAddress: string;
  authorName?: string;
  coverFile?: File;          // Multipart upload
  genres: string[];
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  licenseTerms: {
    commercialUse: boolean;
    derivativesAllowed: boolean;
    commercialRevShare: number; // Basis points (2500 = 25%)
    mintingFee?: string;       // Wei amount
  };
}

export interface BookBranchingRequest {
  parentBookId: string;
  branchPoint: string;       // "ch3"
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
    chapterMap: { [chapterNumber: string]: string };
    originalAuthors: BookMetadata['originalAuthors'];
  };
  transactionHash?: string;
  error?: string;
}

// ===== DISCOVERY AND BROWSING TYPES =====

export interface BookDiscoveryFilters {
  author?: string;           // Filter by author address
  genre?: string;           // Filter by genre
  remixable?: boolean;      // Filter by remixable status
  parentBook?: string;      // Filter derivative books by parent
  contentRating?: string;   // Filter by content rating
  minRating?: number;       // Minimum average rating
  limit?: number;           // Results per page (default: 50)
  offset?: number;          // Pagination offset (default: 0)
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
  derivativeBooks?: string[]; // For original books
  parentBook?: string;        // For derivative books
  branchPoint?: string;       // For derivative books
  isRemixable: boolean;
  createdAt: string;
}

// ===== HYBRID READING TYPES =====

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
    
    // Source Attribution
    source: {
      bookId: string;           // Which book this chapter comes from
      authorAddress: string;    // Original chapter author
      authorName: string;
      isOriginalContent: boolean; // True if from original book
    };
    
    // Revenue Attribution
    revenueAttribution: {
      chapterAuthor: string;    // Gets majority of revenue
      bookCurator: string;      // Gets smaller share for curation
      revenueShare: {
        chapterAuthor: number;  // Percentage (e.g., 80)
        bookCurator: number;    // Percentage (e.g., 10)
        platform: number;       // Percentage (e.g., 10)
      };
    };
    
    metadata: ChapterMetadata;
  };
  error?: string;
}

// ===== DERIVATION TREE TYPES =====

export interface BookDerivationNode {
  bookId: string;
  title: string;
  authorName: string;
  branchPoint?: string;
  totalChapters: number;
  totalReads: number;
  createdAt: string;
  derivatives: BookDerivationNode[]; // Recursive structure
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

// ===== STORAGE UTILITIES =====

export interface BookStoragePath {
  bookFolder: string;        // "/books/{authorAddress}-{slug}"
  metadataPath: string;      // "{bookFolder}/metadata.json"
  coverPath: string;         // "{bookFolder}/cover.jpg"
  chaptersFolder: string;    // "{bookFolder}/chapters"
}

export interface ChapterStoragePath {
  chapterFolder: string;     // "{bookFolder}/chapters/ch{number}"
  contentPath: string;       // "{chapterFolder}/content.json"
  metadataPath: string;      // "{chapterFolder}/metadata.json"
}

// ===== VALIDATION SCHEMAS =====

export interface BookValidationRules {
  title: {
    minLength: number;       // 3
    maxLength: number;       // 100
    pattern?: RegExp;        // No special chars
  };
  description: {
    minLength: number;       // 10
    maxLength: number;       // 1000
  };
  slug: {
    pattern: RegExp;         // /^[a-z0-9-]+$/
    maxLength: number;       // 50
  };
  genres: {
    minCount: number;        // 1
    maxCount: number;        // 5
    allowedValues: string[]; // Predefined list
  };
}

// ===== ERROR TYPES =====

export interface BookSystemError {
  code: 'BOOK_NOT_FOUND' | 'INVALID_BRANCH_POINT' | 'UNAUTHORIZED_AUTHOR' | 
        'DUPLICATE_BOOK_ID' | 'INVALID_CHAPTER_MAP' | 'IP_REGISTRATION_FAILED' |
        'STORAGE_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: any;
}

// ===== UTILITY TYPES =====

export type BookId = string;              // "{authorAddress}-{slug}"
export type ChapterId = string;           // Unique chapter identifier
export type AuthorAddress = `0x${string}`; // Ethereum address
export type ChapterNumber = number;       // 1-indexed
export type RevenueShare = number;        // Percentage 0-100

// Helper type for chapter map entries
export type ChapterMapEntry = {
  chapterNumber: string;                 // "ch1", "ch2", etc.
  sourcePath: string;                   // Full path to chapter content
};

// ===== CONSTANTS =====

export const BOOK_SYSTEM_CONSTANTS = {
  // Storage
  BOOKS_ROOT_PATH: '/books',
  CHAPTERS_FOLDER_NAME: 'chapters',
  METADATA_FILENAME: 'metadata.json',
  COVER_FILENAME: 'cover.jpg',
  
  // Validation
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_SLUG_LENGTH: 50,
  
  // Revenue Sharing (default percentages)
  DEFAULT_CHAPTER_AUTHOR_SHARE: 80,
  DEFAULT_BOOK_CURATOR_SHARE: 10,
  DEFAULT_PLATFORM_SHARE: 10,
  
  // File Upload
  MAX_COVER_SIZE_MB: 5,
  ALLOWED_COVER_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Patterns
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  BOOK_ID_PATTERN: /^0x[a-fA-F0-9]{40}-[a-z0-9-]+$/,
} as const;

// ===== EXPORT ALL TYPES =====

export type {
  // Core types
  BookMetadata,
  ChapterMetadata,
  
  // Request/Response types
  BookRegistrationRequest,
  BookRegistrationResponse,
  BookBranchingRequest,
  BookBranchingResponse,
  
  // Discovery types
  BookDiscoveryFilters,
  BookDiscoveryResponse,
  BookSummary,
  
  // Reading types
  ChapterResolutionRequest,
  ChapterResolutionResponse,
  
  // Tree types
  BookDerivationNode,
  BookDerivationTreeResponse,
  
  // Storage types
  BookStoragePath,
  ChapterStoragePath,
  
  // Validation types
  BookValidationRules,
  BookSystemError,
  
  // Utility types
  BookId,
  ChapterId,
  AuthorAddress,
  ChapterNumber,
  RevenueShare,
  ChapterMapEntry,
};