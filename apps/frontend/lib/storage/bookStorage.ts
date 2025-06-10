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
} from '../types/shared'

// Import from backend R2 service
import { R2Service } from '../r2'

export class BookStorageService {
  
  // ===== PATH GENERATION =====
  
  /**
   * Generate storage paths for a book
   */
  static generateBookPaths(authorAddress: AuthorAddress, slug: string): BookStoragePath {
    const bookId = `${authorAddress.toLowerCase()}-${slug}`
    // Store with structure: books/{authorAddress}/{slug}/ (remove leading slash)
    const bookFolder = `${BOOK_SYSTEM_CONSTANTS.BOOKS_ROOT_PATH.replace(/^\//, '')}/${authorAddress.toLowerCase()}/${slug}`
    
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
      
      console.log('📂 Uploading to path:', paths.metadataPath)
      console.log('📝 Metadata size:', metadataJson.length, 'characters')
      
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
      
      console.log('✅ Successfully uploaded book metadata to:', url)
      return url
    } catch (error) {
      console.error('❌ Error storing book metadata:', error)
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
   * Store chapter content to R2
   */
  static async storeChapterContent(
    authorAddress: AuthorAddress,
    slug: string,
    chapterNumber: number,
    chapterData: ChapterMetadata
  ): Promise<string> {
    try {
      const bookPaths = this.generateBookPaths(authorAddress, slug)
      const chapterPaths = this.generateChapterPaths(bookPaths, chapterNumber)
      
      console.log('💾 Storing chapter content to:', chapterPaths.contentPath)
      
      // Store chapter content as JSON
      const contentUrl = await R2Service.uploadContent(
        chapterPaths.contentPath,
        JSON.stringify(chapterData, null, 2),
        {
          contentType: 'application/json',
          metadata: {
            bookId: chapterData.bookId,
            chapterNumber: chapterNumber.toString(),
            contentType: 'chapter',
            authorAddress: authorAddress.toLowerCase(),
            authorName: chapterData.authorName,
            title: chapterData.title,
            wordCount: chapterData.wordCount.toString(),
            uploadedAt: new Date().toISOString()
          }
        }
      )
      
      console.log('✅ Chapter content stored successfully:', contentUrl)
      return contentUrl
      
    } catch (error) {
      console.error('❌ Failed to store chapter content:', error)
      throw new Error(`Failed to store chapter content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get chapter content from R2
   */
  static async getChapterContent(
    authorAddress: AuthorAddress,
    slug: string,
    chapterNumber: number
  ): Promise<ChapterMetadata> {
    try {
      const bookPaths = this.generateBookPaths(authorAddress, slug)
      const chapterPaths = this.generateChapterPaths(bookPaths, chapterNumber)
      
      const content = await R2Service.getContent(chapterPaths.contentPath)
      return JSON.parse(content) as ChapterMetadata
      
    } catch (error) {
      console.error('❌ Failed to get chapter content:', error)
      throw new Error(`Chapter not found: ${authorAddress}/${slug}/ch${chapterNumber}`)
    }
  }

  /**
   * Get all book metadata for discovery purposes
   * Note: This is a simplified implementation that would benefit from indexing in production
   */
  static async getAllBooksMetadata(): Promise<BookMetadata[]> {
    try {
      // In production, this would use an index or database
      // For now, we'll return empty array as this is mainly for discovery
      // The actual implementation would require R2 listing capabilities
      console.warn('getAllBooksMetadata: Not implemented - requires R2 bucket listing')
      return []
    } catch (error) {
      console.error('Error retrieving all books metadata:', error)
      return []
    }
  }
}

/**
 * Get book by ID
 */
export async function getBookById(bookId: string): Promise<BookMetadata | null> {
  try {
    // Parse bookId to get authorAddress and slug
    const parts = bookId.split('-');
    if (parts.length < 2) {
      console.error('Invalid book ID format:', bookId);
      return null;
    }
    
    // Ethereum address is 42 chars (0x + 40 hex chars)
    const authorAddress = parts[0] as AuthorAddress;
    const slug = parts.slice(1).join('-'); // Handle slugs with hyphens
    
    console.log('📚 Fetching book:', { bookId, authorAddress, slug });
    
    const bookMetadata = await BookStorageService.getBookMetadata(bookId as BookId);
    return bookMetadata;
  } catch (error) {
    console.error('❌ Error fetching book by ID:', error);
    return null;
  }
}