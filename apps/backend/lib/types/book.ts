/**
 * Book system types for backend
 */

export type AuthorAddress = string
export type BookId = string
export type ChapterId = string

export interface BookMetadata {
  // Basic Information
  bookId: string              // Primary key: "{authorAddress}-{slug}" format
  id: BookId                  // Backward compatibility alias
  title: string
  description: string
  authorAddress: string       // Author's wallet address
  author: AuthorAddress       // Backward compatibility alias
  authorName?: string
  slug: string               // URL-safe identifier
  coverUrl?: string          // R2 URL to book cover image
  coverImageUrl?: string     // Backward compatibility alias
  
  // IP Registration
  ipAssetId?: string
  licenseTermsId?: string
  tokenId?: string           // Backward compatibility
  transactionHash?: string
  
  // Branching Information
  parentBook?: string        // Parent book ID for derivatives
  parentBookId?: BookId      // Backward compatibility alias
  branchPoint?: string       // Chapter where branching occurred (e.g., "ch3")
  derivativeBooks: string[]  // Child book IDs
  
  // Chapter Resolution Map - CORE FEATURE
  chapterMap: {
    [chapterNumber: string]: string // "ch1": "0x1234-detective/chapters/ch1"
  }
  chapters: number           // Backward compatibility - total count
  
  // Revenue Attribution
  originalAuthors: {
    [authorAddress: string]: {
      chapters: string[]     // Chapter numbers this author contributed
      revenueShare: number   // Percentage (0-100)
    }
  }
  
  // Discovery & Analytics
  totalChapters: number
  genre: string             // Primary genre
  genres: string[]          // All genres
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  isRemixable: boolean
  isPublic: boolean
  tags?: string[]
  wordCount: number
  
  // Engagement Metrics
  totalReads: number
  totalEarnings?: number
  averageRating: number     // 0-5 stars
  rating?: number          // Backward compatibility alias
  totalRevenue: number     // $TIP earned
  
  // Timestamps
  createdAt: string        // ISO string
  updatedAt: string        // ISO string
  
  // Legacy/compatibility fields
  status?: string
}

export interface ChapterMetadata {
  // Core identification
  chapterId: ChapterId
  bookId: BookId
  chapterNumber: number
  title: string
  bookTitle?: string        // Parent book title for context
  summary?: string
  content: string
  
  // Author info
  authorAddress: AuthorAddress
  authorName?: string
  
  // IP Registration
  ipAssetId?: string
  parentIpAssetId?: string
  transactionHash?: string
  
  // Economics
  unlockPrice: number
  readReward: number
  licensePrice: number
  totalRevenue: number
  
  // Content Metrics
  wordCount: number
  readingTime: number
  qualityScore?: number
  originalityScore?: number
  
  // Generation Details
  generationMethod: 'ai' | 'human' | 'hybrid'
  aiPrompt?: string
  aiModel?: string
  
  // Engagement
  totalReads: number
  averageRating: number
  
  // Classification
  genre?: string
  mood?: string
  contentRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  tags?: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Legacy fields for compatibility
  id?: ChapterId
  author?: AuthorAddress
  isPublished?: boolean
}

export interface BookStoragePath {
  bookFolder: string        // "/books/{authorAddress}-{slug}"
  bookMetadata: string      // Backward compatibility
  metadataPath: string      // "{bookFolder}/metadata.json"
  coverPath: string         // "{bookFolder}/cover.jpg"
  chaptersFolder: string    // "{bookFolder}/chapters"
  chapterPrefix: string     // Backward compatibility
  coverImage?: string       // Backward compatibility
}

export interface ChapterStoragePath {
  chapterFolder: string     // "{bookFolder}/chapters/ch{number}"
  contentPath: string       // "{chapterFolder}/content.json"
  metadataPath: string      // "{chapterFolder}/metadata.json"
  metadata: string          // Backward compatibility
  content: string           // Backward compatibility
}

export interface BookBranchingRequest {
  sourceBookId: BookId
  branchFromChapter: number
  newTitle: string
  newDescription?: string
  authorAddress: AuthorAddress
  authorName?: string
}

export interface BookBranchingResponse {
  success: boolean
  bookId?: BookId
  message: string
  book?: {
    bookId: string
    parentBookId: string
    ipAssetId?: string
    branchPoint: string
    coverUrl?: string
    chapterMap: { [chapterNumber: string]: string }
    originalAuthors: BookMetadata['originalAuthors']
  }
  transactionHash?: string
  error?: string
  branchMetadata?: {
    sourceBook: BookId
    branchPoint: number
    inheritedChapters: number
  }
}

export interface BookRegistrationRequest {
  title: string
  description?: string
  authorAddress: AuthorAddress
  authorName?: string
  genre: string
  tags?: string[]
  coverImageUrl?: string
  isPublic?: boolean
}

export interface BookRegistrationResponse {
  success: boolean
  bookId?: BookId
  message?: string
  error?: string
  book?: {
    bookId: string
    ipAssetId?: string
    slug: string
    coverUrl?: string
    licenseTermsId?: string
  }
  transactionHash?: string
  blockchainStatus?: {
    connected: boolean
    network: string
    gasUsed?: string
  }
  bookMetadata?: BookMetadata
}

export const BOOK_SYSTEM_CONSTANTS = {
  // Length validation
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CHAPTER_TITLE_LENGTH: 100,
  MAX_SLUG_LENGTH: 50,
  
  // Chapter constraints
  MIN_BRANCH_CHAPTER: 1,
  MAX_CHAPTERS_PER_BOOK: 100,
  
  // File upload
  MAX_COVER_SIZE_MB: 5,
  ALLOWED_COVER_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Storage paths
  BOOKS_ROOT_PATH: '/books',
  STORIES_ROOT_PATH: '/stories',
  METADATA_FILENAME: 'metadata.json',
  COVER_FILENAME: 'cover.jpg',
  CHAPTERS_FOLDER_NAME: 'chapters',
  
  // Legacy storage paths
  STORAGE_PATHS: {
    BOOKS_PREFIX: 'books/',
    CHAPTERS_PREFIX: 'chapters/',
    COVERS_PREFIX: 'covers/'
  },
  
  // Validation patterns
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  BOOK_ID_PATTERN: /^0x[a-fA-F0-9]{40}-[a-z0-9-]+$/,
  
  // Economics defaults
  FREE_CHAPTERS_COUNT: 3,
  DEFAULT_UNLOCK_PRICE: 10,
  DEFAULT_READ_REWARD: 5,
  DEFAULT_LICENSE_PRICE: 100
}