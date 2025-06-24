import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

interface BookIndexEntry {
  id: string
  title: string
  author: string
  authorAddress: string
  slug: string
  chapterCount: number
  coverUrl?: string
  description?: string
  tags?: string[]
  status: string
  createdAt: string
  updatedAt: string
}

interface BookIndex {
  version: string
  lastUpdated: string
  totalBooks: number
  books: BookIndexEntry[]
}

// Copy the R2 initialization pattern from books/route.ts
let r2ClientInstance: S3Client

function initializeR2Client(): S3Client {
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
  }

  const rawAccessKeyId = process.env.R2_ACCESS_KEY_ID || ''
  const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ''
  const rawEndpoint = process.env.R2_ENDPOINT || ''
  
  const cleanAccessKeyId = rawAccessKeyId.replace(/[^a-zA-Z0-9]/g, '')
  const cleanSecretAccessKey = rawSecretAccessKey.replace(/[^a-zA-Z0-9]/g, '')
  const cleanEndpoint = rawEndpoint.replace(/[^a-zA-Z0-9.-]/g, '')

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${cleanEndpoint}`,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    forcePathStyle: false,
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
    maxAttempts: 3,
    requestHandler: {
      connectionTimeout: 5000,
      socketTimeout: 5000,
    }
  })
  
  return client
}

function getR2Client(): S3Client {
  // Check if environment variables are available
  const hasRequiredEnvVars = process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME
  
  if (!hasRequiredEnvVars) {
    // During build time, environment variables might not be available
    throw new Error('R2 environment variables not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.')
  }
  
  if (!r2ClientInstance) {
    r2ClientInstance = initializeR2Client()
  }
  return r2ClientInstance
}

export class BookIndexService {
  private client: S3Client | null = null
  private bucketName: string | null = null
  private indexKey = 'books/index.json'

  constructor() {
    // Lazy initialization - don't initialize R2 client in constructor
    // This allows the module to load during build time
  }
  
  private ensureInitialized() {
    if (!this.client || !this.bucketName) {
      this.client = getR2Client()
      this.bucketName = process.env.R2_BUCKET_NAME!
    }
  }

  /**
   * Fetches all books metadata from R2 and builds a comprehensive index
   */
  async fetchAllBooksMetadata(): Promise<BookIndexEntry[]> {
    this.ensureInitialized()
    const books: BookIndexEntry[] = []
    
    try {
      // List all author directories
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName!,
        Prefix: 'books/',
        Delimiter: '/'
      })
      
      const listResponse = await this.client!.send(listCommand)
      
      if (!listResponse.CommonPrefixes) {
        return books
      }

      // Process each author in parallel for better performance
      const authorPromises = listResponse.CommonPrefixes.map(async (authorPrefix) => {
        if (!authorPrefix.Prefix) return []
        
        const authorAddress = authorPrefix.Prefix.replace('books/', '').replace('/', '')
        
        // List all books for this author
        const authorBooksCommand = new ListObjectsV2Command({
          Bucket: this.bucketName!,
          Prefix: `books/${authorAddress}/`,
          Delimiter: '/'
        })
        
        const authorBooksResponse = await this.client!.send(authorBooksCommand)
        
        if (!authorBooksResponse.CommonPrefixes) {
          return []
        }

        // Process each book in parallel
        const bookPromises = authorBooksResponse.CommonPrefixes.map(async (bookPrefix) => {
          if (!bookPrefix.Prefix) return null
          
          const bookSlug = bookPrefix.Prefix
            .replace(`books/${authorAddress}/`, '')
            .replace('/', '')
          
          try {
            // Fetch book metadata
            const metadataCommand = new GetObjectCommand({
              Bucket: this.bucketName!,
              Key: `books/${authorAddress}/${bookSlug}/metadata.json`
            })
            
            const metadataResponse = await this.client!.send(metadataCommand)
            const metadataString = await metadataResponse.Body?.transformToString()
            
            if (!metadataString) return null
            
            const metadata = JSON.parse(metadataString)
            
            // Count chapters efficiently
            const chapterCount = await this.getChapterCount(authorAddress, bookSlug)
            
            // Always use API endpoint for cover URLs to ensure consistency
            const bookId = `${authorAddress}/${bookSlug}`
            const isDev = process.env.NODE_ENV === 'development'
            const baseUrl = isDev ? 'http://localhost:3002' : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002')
            
            // Always use API endpoint regardless of what's in metadata
            // This ensures the cover is served through our API which handles:
            // 1. R2 bucket access with proper credentials
            // 2. Fallback to placeholder if cover doesn't exist
            // 3. Proper caching headers
            const coverUrl = `${baseUrl}/api/books/${encodeURIComponent(bookId)}/cover`
            
            const bookEntry: BookIndexEntry = {
              id: bookId,
              title: metadata.title || 'Untitled',
              author: metadata.author || 'Unknown',
              authorAddress,
              slug: bookSlug,
              chapterCount,
              coverUrl,
              description: metadata.description,
              tags: metadata.tags || [],
              status: metadata.status || 'published',
              createdAt: metadata.createdAt || new Date().toISOString(),
              updatedAt: metadata.updatedAt || new Date().toISOString()
            }
            
            return bookEntry
          } catch (error) {
            console.error(`Error processing book ${authorAddress}/${bookSlug}:`, error)
            return null
          }
        })
        
        const authorBooks = await Promise.all(bookPromises)
        return authorBooks.filter((book): book is BookIndexEntry => book !== null)
      })
      
      const allAuthorBooks = await Promise.all(authorPromises)
      return allAuthorBooks.flat()
      
    } catch (error) {
      console.error('Error fetching books metadata:', error)
      throw error
    }
  }

  /**
   * Efficiently counts chapters for a book
   */
  private async getChapterCount(authorAddress: string, bookSlug: string): Promise<number> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName!,
        Prefix: `books/${authorAddress}/${bookSlug}/chapters/`,
        Delimiter: '/'
      })
      
      const response = await this.client!.send(listCommand)
      return response.CommonPrefixes?.length || 0
      
    } catch (error) {
      console.error(`Error counting chapters for ${authorAddress}/${bookSlug}:`, error)
      return 0
    }
  }

  /**
   * Updates the book index in R2
   */
  async updateBookIndex(): Promise<void> {
    this.ensureInitialized()
    try {
      console.log('Starting book index update...')
      const startTime = Date.now()
      
      // Fetch all books metadata
      const books = await this.fetchAllBooksMetadata()
      
      // Sort books by most recently updated
      books.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      
      // Create index object
      const index: BookIndex = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalBooks: books.length,
        books
      }
      
      // Save to R2
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName!,
        Key: this.indexKey,
        Body: JSON.stringify(index, null, 2),
        ContentType: 'application/json',
        CacheControl: 'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
      })
      
      await this.client!.send(putCommand)
      
      const duration = Date.now() - startTime
      console.log(`Book index updated successfully. ${books.length} books indexed in ${duration}ms`)
      
    } catch (error) {
      console.error('Error updating book index:', error)
      throw error
    }
  }

  /**
   * Retrieves the current book index from R2
   */
  async getBookIndex(): Promise<BookIndex | null> {
    this.ensureInitialized()
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName!,
        Key: this.indexKey
      })
      
      const response = await this.client!.send(getCommand)
      const indexString = await response.Body?.transformToString()
      
      if (!indexString) return null
      
      return JSON.parse(indexString) as BookIndex
      
    } catch (error) {
      if ((error as any).name === 'NoSuchKey') {
        console.log('Book index not found, needs to be created')
        return null
      }
      
      console.error('Error retrieving book index:', error)
      throw error
    }
  }

  /**
   * Validates the index is not stale (older than 1 hour)
   */
  isIndexStale(index: BookIndex): boolean {
    const indexDate = new Date(index.lastUpdated)
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - indexDate.getTime()) / (1000 * 60 * 60)
    
    return hoursSinceUpdate > 1
  }
}

// Export singleton instance
export const bookIndexService = new BookIndexService()