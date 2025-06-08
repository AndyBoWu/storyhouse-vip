/**
 * Book Registration & Branching System - R2 Storage Layer (Backend)
 * 
 * Backend version of the book storage service that uses the backend R2 configuration
 */

import { 
  BookMetadata, 
  ChapterMetadata, 
  BookStoragePath, 
  ChapterStoragePath,
  BOOK_SYSTEM_CONSTANTS,
  AuthorAddress,
  BookId,
  ChapterId
} from '@storyhouse/shared'

// Import from backend R2 service
import { R2Service } from '../r2'

export class BookStorageService {
  
  // ===== PATH GENERATION =====
  
  /**
   * Generate storage paths for a book
   */
  static generateBookPaths(authorAddress: AuthorAddress, slug: string): BookStoragePath {
    const bookId = `${authorAddress.toLowerCase()}-${slug}`
    const bookFolder = `${BOOK_SYSTEM_CONSTANTS.BOOKS_ROOT_PATH}/${bookId}`
    
    return {
      bookFolder,
      metadataPath: `${bookFolder}/${BOOK_SYSTEM_CONSTANTS.METADATA_FILENAME}`,
      coverPath: `${bookFolder}/${BOOK_SYSTEM_CONSTANTS.COVER_FILENAME}`,
      chaptersFolder: `${bookFolder}/${BOOK_SYSTEM_CONSTANTS.CHAPTERS_FOLDER_NAME}`
    }
  }
  
  /**
   * Generate storage paths for a chapter within a book
   */
  static generateChapterPaths(bookPaths: BookStoragePath, chapterNumber: number): ChapterStoragePath {
    const chapterFolder = `${bookPaths.chaptersFolder}/ch${chapterNumber}`
    
    return {
      chapterFolder,
      contentPath: `${chapterFolder}/content.json`,
      metadataPath: `${chapterFolder}/${BOOK_SYSTEM_CONSTANTS.METADATA_FILENAME}`
    }
  }
  
  /**
   * Parse book ID to extract author address and slug
   */
  static parseBookId(bookId: BookId): { authorAddress: AuthorAddress; slug: string } {
    const match = bookId.match(BOOK_SYSTEM_CONSTANTS.BOOK_ID_PATTERN)
    if (!match) {
      throw new Error(`Invalid book ID format: ${bookId}`)
    }
    
    const [authorAddress, slug] = bookId.split('-', 2)
    return { 
      authorAddress: authorAddress as AuthorAddress, 
      slug: slug 
    }
  }
  
  // ===== BOOK OPERATIONS =====
  
  /**
   * Store book metadata
   */
  static async storeBookMetadata(
    authorAddress: AuthorAddress,
    slug: string,
    metadata: BookMetadata
  ): Promise<string> {
    const paths = this.generateBookPaths(authorAddress, slug)
    
    try {
      const metadataJson = JSON.stringify(metadata, null, 2)
      
      const url = await R2Service.uploadContent(
        paths.metadataPath,
        metadataJson,
        {
          contentType: 'application/json',
          metadata: {
            bookId: metadata.bookId,
            authorAddress: metadata.authorAddress,
            title: metadata.title,
            totalChapters: metadata.totalChapters.toString(),
            isRemixable: metadata.isRemixable.toString(),
            parentBook: metadata.parentBook || '',
            createdAt: metadata.createdAt
          }
        }
      )
      
      return url
    } catch (error) {
      console.error('Error storing book metadata:', error)
      throw new Error(`Failed to store book metadata for ${metadata.bookId}`)
    }
  }
  
  /**
   * Retrieve book metadata
   */
  static async getBookMetadata(bookId: BookId): Promise<BookMetadata> {
    const { authorAddress, slug } = this.parseBookId(bookId)
    const paths = this.generateBookPaths(authorAddress, slug)
    
    try {
      const metadataJson = await R2Service.getContent(paths.metadataPath)
      return JSON.parse(metadataJson) as BookMetadata
    } catch (error) {
      console.error('Error retrieving book metadata:', error)
      throw new Error(`Book not found: ${bookId}`)
    }
  }
  
  /**
   * Store book cover image
   */
  static async storeBookCover(
    authorAddress: AuthorAddress,
    slug: string,
    coverData: Buffer,
    contentType: string
  ): Promise<string> {
    const paths = this.generateBookPaths(authorAddress, slug)
    
    // Validate content type
    if (!BOOK_SYSTEM_CONSTANTS.ALLOWED_COVER_TYPES.includes(contentType)) {
      throw new Error(`Invalid cover type: ${contentType}`)
    }
    
    // Validate size (assuming coverData.length is in bytes)
    const sizeMB = coverData.length / (1024 * 1024)
    if (sizeMB > BOOK_SYSTEM_CONSTANTS.MAX_COVER_SIZE_MB) {
      throw new Error(`Cover too large: ${sizeMB.toFixed(2)}MB (max ${BOOK_SYSTEM_CONSTANTS.MAX_COVER_SIZE_MB}MB)`)
    }
    
    try {
      const url = await R2Service.uploadContent(
        paths.coverPath,
        coverData,
        {
          contentType,
          metadata: {
            bookId: `${authorAddress.toLowerCase()}-${slug}`,
            authorAddress,
            uploadedAt: new Date().toISOString(),
            sizeBytes: coverData.length.toString()
          }
        }
      )
      
      return url
    } catch (error) {
      console.error('Error storing book cover:', error)
      throw new Error('Failed to store book cover')
    }
  }
  
  /**
   * Delete book cover
   */
  static async deleteBookCover(authorAddress: AuthorAddress, slug: string): Promise<void> {
    const paths = this.generateBookPaths(authorAddress, slug)
    
    try {
      await R2Service.deleteContent(paths.coverPath)
    } catch (error) {
      // Don't throw if cover doesn't exist
      console.warn('Cover not found or already deleted:', paths.coverPath)
    }
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Generate slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, BOOK_SYSTEM_CONSTANTS.MAX_SLUG_LENGTH)
  }
  
  /**
   * Validate book ID format
   */
  static isValidBookId(bookId: string): boolean {
    return BOOK_SYSTEM_CONSTANTS.BOOK_ID_PATTERN.test(bookId)
  }
  
  /**
   * Validate slug format
   */
  static isValidSlug(slug: string): boolean {
    return BOOK_SYSTEM_CONSTANTS.SLUG_PATTERN.test(slug) && 
           slug.length <= BOOK_SYSTEM_CONSTANTS.MAX_SLUG_LENGTH
  }
  
  /**
   * Create initial book metadata structure
   */
  static createInitialBookMetadata(
    authorAddress: AuthorAddress,
    slug: string,
    title: string,
    description: string,
    genres: string[],
    contentRating: BookMetadata['contentRating'],
    ipAssetId?: string,
    parentBook?: string,
    branchPoint?: string
  ): BookMetadata {
    const bookId = `${authorAddress.toLowerCase()}-${slug}` as BookId
    const now = new Date().toISOString()
    
    return {
      bookId,
      title,
      description,
      authorAddress,
      authorName: `${authorAddress.slice(-4)}`, // Default to last 4 chars
      slug,
      ipAssetId,
      parentBook,
      branchPoint,
      derivativeBooks: [],
      chapterMap: {},
      originalAuthors: {
        [authorAddress]: {
          chapters: [],
          revenueShare: 100
        }
      },
      totalChapters: 0,
      genres,
      contentRating,
      isRemixable: true,
      createdAt: now,
      updatedAt: now,
      totalReads: 0,
      averageRating: 0,
      totalRevenue: 0
    }
  }
}