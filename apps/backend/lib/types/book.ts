/**
 * Book system types for backend
 */

export type AuthorAddress = string
export type BookId = string
export type ChapterId = string

export interface BookMetadata {
  id: BookId
  title: string
  author: AuthorAddress
  authorName?: string
  genre: string
  createdAt: string
  updatedAt: string
  chapters: ChapterMetadata[]
  parentBookId?: BookId
  branchPoint?: number
  description?: string
  coverImageUrl?: string
  tags?: string[]
  isPublic: boolean
  totalChapters: number
  wordCount: number
}

export interface ChapterMetadata {
  id: ChapterId
  bookId: BookId
  chapterNumber: number
  title: string
  content: string
  author: AuthorAddress
  authorName?: string
  createdAt: string
  wordCount: number
  isPublished: boolean
  summary?: string
  tags?: string[]
}

export interface BookStoragePath {
  bookMetadata: string
  chapterPrefix: string
  coverImage?: string
}

export interface ChapterStoragePath {
  metadata: string
  content: string
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
  message: string
  transactionHash?: string
  ipAssetId?: string
  bookMetadata?: BookMetadata
}

export const BOOK_SYSTEM_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CHAPTER_TITLE_LENGTH: 100,
  MIN_BRANCH_CHAPTER: 1,
  MAX_CHAPTERS_PER_BOOK: 100,
  STORAGE_PATHS: {
    BOOKS_PREFIX: 'books/',
    CHAPTERS_PREFIX: 'chapters/',
    COVERS_PREFIX: 'covers/'
  }
}