/**
 * Book Registration & Branching System - R2 Storage Layer
 * 
 * Handles all storage operations for the book system including:
 * - Book metadata storage with {authorAddress}-{bookSlug} structure
 * - Chapter content storage with hybrid references
 * - Book cover image storage and management
 * - Cross-book chapter resolution for hybrid reading
 */

import { R2Service, UploadOptions } from '../r2'
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
   * Update book metadata (for adding chapters, updating stats, etc.)
   */
  static async updateBookMetadata(
    bookId: BookId,
    updates: Partial<BookMetadata>
  ): Promise<string> {
    try {
      // Get existing metadata
      const existingMetadata = await this.getBookMetadata(bookId)
      
      // Merge updates
      const updatedMetadata: BookMetadata = {
        ...existingMetadata,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // Store updated metadata
      const { authorAddress, slug } = this.parseBookId(bookId)
      return await this.storeBookMetadata(authorAddress, slug, updatedMetadata)
    } catch (error) {
      console.error('Error updating book metadata:', error)
      throw new Error(`Failed to update book metadata for ${bookId}`)
    }
  }
  
  // ===== BOOK COVER OPERATIONS =====
  
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
    if (!BOOK_SYSTEM_CONSTANTS.ALLOWED_COVER_TYPES.includes(contentType as any)) {
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
  
  // ===== CHAPTER OPERATIONS =====
  
  /**
   * Store chapter content and metadata
   */
  static async storeChapter(
    bookId: BookId,
    chapterNumber: number,
    chapterMetadata: ChapterMetadata
  ): Promise<{ contentUrl: string; metadataUrl: string }> {
    const { authorAddress, slug } = this.parseBookId(bookId)
    const bookPaths = this.generateBookPaths(authorAddress, slug)
    const chapterPaths = this.generateChapterPaths(bookPaths, chapterNumber)
    
    try {
      // Store chapter content
      const contentData = {
        chapterId: chapterMetadata.chapterId,
        chapterNumber: chapterMetadata.chapterNumber,
        title: chapterMetadata.title,
        content: chapterMetadata.content,
        summary: chapterMetadata.summary,
        wordCount: chapterMetadata.wordCount,
        readingTime: chapterMetadata.readingTime,
        createdAt: chapterMetadata.createdAt
      }
      
      const contentUrl = await R2Service.uploadContent(
        chapterPaths.contentPath,
        JSON.stringify(contentData, null, 2),
        {
          contentType: 'application/json',
          metadata: {
            chapterId: chapterMetadata.chapterId,
            bookId,
            chapterNumber: chapterNumber.toString(),
            authorAddress: chapterMetadata.authorAddress,
            wordCount: chapterMetadata.wordCount.toString(),
            createdAt: chapterMetadata.createdAt
          }
        }
      )
      
      // Store chapter metadata (without content to keep it smaller)
      const metadataOnly = { ...chapterMetadata }
      delete (metadataOnly as any).content // Remove content from metadata file
      
      const metadataUrl = await R2Service.uploadContent(
        chapterPaths.metadataPath,
        JSON.stringify(metadataOnly, null, 2),
        {
          contentType: 'application/json',
          metadata: {
            chapterId: chapterMetadata.chapterId,
            bookId,
            chapterNumber: chapterNumber.toString(),
            authorAddress: chapterMetadata.authorAddress,
            type: 'chapter-metadata'
          }
        }
      )
      
      return { contentUrl, metadataUrl }
    } catch (error) {
      console.error('Error storing chapter:', error)
      throw new Error(`Failed to store chapter ${chapterNumber} for book ${bookId}`)
    }
  }
  
  /**
   * Retrieve chapter content and metadata
   */
  static async getChapter(bookId: BookId, chapterNumber: number): Promise<ChapterMetadata> {
    const { authorAddress, slug } = this.parseBookId(bookId)
    const bookPaths = this.generateBookPaths(authorAddress, slug)
    const chapterPaths = this.generateChapterPaths(bookPaths, chapterNumber)
    
    try {
      // Get content and metadata separately
      const [contentJson, metadataJson] = await Promise.all([
        R2Service.getContent(chapterPaths.contentPath),
        R2Service.getContent(chapterPaths.metadataPath)
      ])
      
      const contentData = JSON.parse(contentJson)
      const metadataData = JSON.parse(metadataJson)
      
      // Merge content back into metadata
      const fullChapter: ChapterMetadata = {
        ...metadataData,
        content: contentData.content
      }
      
      return fullChapter
    } catch (error) {
      console.error('Error retrieving chapter:', error)
      throw new Error(`Chapter ${chapterNumber} not found in book ${bookId}`)
    }
  }
  
  // ===== HYBRID READING OPERATIONS =====
  
  /**
   * Resolve chapter from potentially different book (for branched reading)
   */
  static async resolveChapter(
    requestedBookId: BookId,
    chapterNumber: number
  ): Promise<{
    chapter: ChapterMetadata;
    source: {
      bookId: BookId;
      authorAddress: AuthorAddress;
      isOriginalContent: boolean;
    };
  }> {
    try {
      // Get the book metadata to check chapter map
      const bookMetadata = await this.getBookMetadata(requestedBookId)
      
      // Check if chapter exists in chapter map
      const chapterKey = `ch${chapterNumber}`
      const chapterPath = bookMetadata.chapterMap[chapterKey]
      
      if (!chapterPath) {
        throw new Error(`Chapter ${chapterNumber} not found in book ${requestedBookId}`)
      }
      
      // Determine source book from chapter path
      // Path format: "0x1234-detective/chapters/ch1" or "0x5678-detective-sf/chapters/ch4"
      const sourceBookMatch = chapterPath.match(/^([^\/]+)\/chapters\//)
      if (!sourceBookMatch) {
        throw new Error(`Invalid chapter path format: ${chapterPath}`)
      }
      
      const sourceBookId = sourceBookMatch[1] as BookId
      const isOriginalContent = sourceBookId === requestedBookId
      
      // Get chapter from source book
      const chapter = await this.getChapter(sourceBookId, chapterNumber)
      
      const { authorAddress } = this.parseBookId(sourceBookId)
      
      return {
        chapter,
        source: {
          bookId: sourceBookId,
          authorAddress,
          isOriginalContent
        }
      }
    } catch (error) {
      console.error('Error resolving chapter:', error)
      throw new Error(`Failed to resolve chapter ${chapterNumber} from book ${requestedBookId}`)
    }
  }
  
  // ===== DISCOVERY OPERATIONS =====
  
  /**
   * List all books by author
   */
  static async listBooksByAuthor(authorAddress: AuthorAddress): Promise<BookMetadata[]> {
    // This would typically use R2's list operations or a separate index
    // For now, we'll implement a simple version that could be enhanced with proper indexing
    
    try {
      // In a full implementation, you'd maintain an index of books per author
      // For the MVP, we'll need to scan the books directory
      
      // This is a simplified implementation - in production you'd want proper indexing
      throw new Error('Book discovery by author not yet implemented - requires proper indexing')
    } catch (error) {
      console.error('Error listing books by author:', error)
      throw new Error(`Failed to list books for author ${authorAddress}`)
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
  
  /**
   * Update chapter map when adding new chapters
   */
  static updateChapterMap(
    bookMetadata: BookMetadata,
    chapterNumber: number,
    bookId: BookId
  ): BookMetadata {
    const chapterKey = `ch${chapterNumber}`
    const chapterPath = `${bookId}/chapters/${chapterKey}`
    
    return {
      ...bookMetadata,
      chapterMap: {
        ...bookMetadata.chapterMap,
        [chapterKey]: chapterPath
      },
      totalChapters: Math.max(bookMetadata.totalChapters, chapterNumber),
      updatedAt: new Date().toISOString()
    }
  }
}

// Export default instance for convenience
export const bookStorage = BookStorageService;