/**
 * Book Registration & Branching System - R2 Storage Layer (Backend)
 * 
 * Backend version of the book storage service that uses the backend R2 configuration
 */

import { 
  BookMetadata, 
  ChapterMetadata,
  AuthorAddress,
  BookId,
  ChapterId,
  BookStoragePath,
  ChapterStoragePath,
  BOOK_SYSTEM_CONSTANTS
} from '../types/book'

// Import from backend R2 service
import { R2Service } from '../r2'

export class BookStorageService {
  
  // ===== PATH GENERATION =====
  
  /**
   * Generate storage paths for a book
   */
  static generateBookPaths(authorAddress: AuthorAddress, slug: string): BookStoragePath {
    const bookId = `${authorAddress.toLowerCase()}/${slug}`
    // Store with structure: books/{authorAddress}/{slug}/ (remove leading slash)
    const bookFolder = `${BOOK_SYSTEM_CONSTANTS.BOOKS_ROOT_PATH.replace(/^\//, '')}/${authorAddress.toLowerCase()}/${slug}`
    
    console.log(`📁 Generated book paths for ${authorAddress}/${slug}:`, {
      bookFolder,
      chaptersFolder: `${bookFolder}/${BOOK_SYSTEM_CONSTANTS.CHAPTERS_FOLDER_NAME}`
    });
    
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
   * Standard format: authorAddress/slug
   */
  static parseBookId(bookId: BookId): { authorAddress: AuthorAddress; slug: string } {
    // Handle URL-encoded slashes
    const decodedBookId = decodeURIComponent(bookId)
    
    // Split by first slash to separate address and slug
    const slashIndex = decodedBookId.indexOf('/')
    if (slashIndex === -1) {
      throw new Error(`Invalid book ID format: ${bookId}. Expected format: authorAddress/slug`)
    }
    
    const authorAddress = decodedBookId.substring(0, slashIndex)
    const slug = decodedBookId.substring(slashIndex + 1)
    
    if (!authorAddress || !slug) {
      throw new Error(`Invalid book ID format: ${bookId}. Both author address and slug are required`)
    }
    
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
    console.log('📁 Book paths:', paths)
    
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
            bookId: `${authorAddress.toLowerCase()}/${slug}`,
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
    ipAssetId?: string
  ): BookMetadata {
    const bookId = `${authorAddress.toLowerCase()}/${slug}` as BookId
    const now = new Date().toISOString()
    
    return {
      // Basic Information - Primary keys
      bookId,
      id: bookId,                    // Backward compatibility alias
      title,
      description,
      authorAddress,
      author: authorAddress,         // Backward compatibility alias  
      authorName: `${authorAddress.slice(-4)}`, // Default to last 4 chars
      slug,
      coverUrl: undefined,
      coverImageUrl: undefined,      // Backward compatibility alias
      
      // IP Registration
      ipAssetId,
      licenseTermsId: undefined,
      tokenId: undefined,            // Backward compatibility
      transactionHash: undefined,
      
      // Chapter Management
      // Note: Derivative books no longer exist - all chapters belong to original books
      
      // Chapter Resolution Map
      chapterMap: {},
      chapters: 0,                   // Backward compatibility - total count
      
      // Revenue Attribution
      originalAuthors: {
        [authorAddress]: {
          chapters: [],
          revenueShare: 100
        }
      },
      
      // Discovery & Analytics
      totalChapters: 0,
      genre: genres[0] || '',        // Primary genre
      genres,
      contentRating,
      isRemixable: true,
      isPublic: true,
      tags: [],
      wordCount: 0,
      
      // Engagement Metrics
      totalReads: 0,
      totalEarnings: 0,
      averageRating: 0,
      rating: 0,                     // Backward compatibility alias
      totalRevenue: 0,
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
      
      // Legacy/compatibility fields
      status: undefined
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
      
      console.log(`📖 Attempting to fetch chapter content:`, {
        authorAddress,
        slug,
        chapterNumber,
        contentPath: chapterPaths.contentPath
      });
      
      const content = await R2Service.getContent(chapterPaths.contentPath)
      return JSON.parse(content) as ChapterMetadata
      
    } catch (error) {
      console.error(`❌ Failed to get chapter content for ${authorAddress}/${slug}/ch${chapterNumber}:`, error)
      // Preserve original error message for better debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to retrieve chapter ${chapterNumber}: ${errorMessage}`)
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

  // ===== IP METADATA OPERATIONS =====

  /**
   * Generate and store IP metadata for Story Protocol registration
   * Returns the public URL that can be used as metadata URI
   */
  static async storeIpMetadata(
    authorAddress: AuthorAddress,
    slug: string,
    ipMetadata: {
      title: string
      description: string
      type: 'book' | 'chapter'
      chapterNumber?: number
      content?: string
      genre?: string
      mood?: string
      tags?: string[]
      parentIpId?: string
      licenseType?: string
    }
  ): Promise<{ metadataUri: string; metadataHash: string }> {
    const bookPaths = this.generateBookPaths(authorAddress, slug)
    
    // Create path for IP metadata
    const ipMetadataPath = ipMetadata.type === 'chapter' && ipMetadata.chapterNumber
      ? `${bookPaths.chaptersFolder}/ch${ipMetadata.chapterNumber}/ip-metadata.json`
      : `${bookPaths.bookFolder}/ip-metadata.json`
    
    // Prepare comprehensive metadata for Story Protocol
    const metadata = {
      name: ipMetadata.title,
      description: ipMetadata.description,
      image: '', // Could add cover URL here if available
      external_url: `https://storyhouse.vip/read/${authorAddress.toLowerCase()}-${slug}`,
      attributes: [
        { trait_type: 'Type', value: ipMetadata.type },
        { trait_type: 'Author', value: authorAddress },
        { trait_type: 'Genre', value: ipMetadata.genre || 'Fiction' },
        { trait_type: 'Mood', value: ipMetadata.mood || 'Neutral' },
        { trait_type: 'License Type', value: ipMetadata.licenseType || 'Standard' },
        ...(ipMetadata.chapterNumber ? [{ trait_type: 'Chapter', value: ipMetadata.chapterNumber.toString() }] : []),
        ...(ipMetadata.parentIpId ? [{ trait_type: 'Parent IP', value: ipMetadata.parentIpId }] : []),
        ...(ipMetadata.tags?.map(tag => ({ trait_type: 'Tag', value: tag })) || [])
      ],
      properties: {
        mediaType: 'text/story',
        contentLength: ipMetadata.content?.length || 0,
        createdAt: new Date().toISOString(),
        platform: 'StoryHouse.vip'
      }
    }
    
    const metadataJson = JSON.stringify(metadata, null, 2)
    
    // Calculate hash of metadata for verification
    const encoder = new TextEncoder()
    const data = encoder.encode(metadataJson)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const metadataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    try {
      const metadataUri = await R2Service.uploadContent(
        ipMetadataPath,
        metadataJson,
        {
          contentType: 'application/json',
          metadata: {
            type: 'ip-metadata',
            authorAddress,
            bookSlug: slug,
            ipType: ipMetadata.type,
            hash: metadataHash
          }
        }
      )
      
      console.log('✅ IP metadata stored:', { path: ipMetadataPath, uri: metadataUri, hash: metadataHash })
      
      return {
        metadataUri,
        metadataHash
      }
    } catch (error) {
      console.error('❌ Error storing IP metadata:', error)
      throw new Error('Failed to store IP metadata')
    }
  }

  /**
   * Retrieve IP metadata URI for an existing book or chapter
   */
  static async getIpMetadataUri(
    authorAddress: AuthorAddress,
    slug: string,
    type: 'book' | 'chapter',
    chapterNumber?: number
  ): Promise<string | null> {
    const bookPaths = this.generateBookPaths(authorAddress, slug)
    
    const ipMetadataPath = type === 'chapter' && chapterNumber
      ? `${bookPaths.chaptersFolder}/ch${chapterNumber}/ip-metadata.json`
      : `${bookPaths.bookFolder}/ip-metadata.json`
    
    try {
      // Get the public URL for the metadata
      const publicUrl = R2Service.getPublicUrl(ipMetadataPath)
      
      // Verify it exists by trying to fetch it
      await R2Service.getContent(ipMetadataPath)
      
      return publicUrl
    } catch (error) {
      console.log('IP metadata not found:', ipMetadataPath)
      return null
    }
  }
}

/**
 * Get book by ID
 */
export async function getBookById(bookId: string): Promise<BookMetadata | null> {
  try {
    // The bookId is already parsed by the route, just use it directly
    console.log('📚 Fetching book:', { bookId });
    
    const bookMetadata = await BookStorageService.getBookMetadata(bookId);
    return bookMetadata;
  } catch (error) {
    console.error('❌ Error fetching book by ID:', error);
    return null;
  }
}