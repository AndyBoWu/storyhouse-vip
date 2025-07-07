import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'
import { bookIndexService } from '@/lib/services/bookIndexService'

// Use the cleaned R2 client initialization with header sanitization
let r2Client: S3Client | null = null

function initializeR2Client(): S3Client | null {
  console.log('🔧 Initializing R2 client for books with header cleaning...')
  
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
    return null
  }

  // NUCLEAR CLEANING: Remove ANY potential invisible characters, quotes, whitespace
  const rawAccessKeyId = process.env.R2_ACCESS_KEY_ID || ''
  const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ''
  const rawEndpoint = process.env.R2_ENDPOINT || ''
  
  // Ultra-aggressive cleaning: remove ALL non-alphanumeric characters for credentials
  const cleanAccessKeyId = rawAccessKeyId.replace(/[^a-zA-Z0-9]/g, '')
  const cleanSecretAccessKey = rawSecretAccessKey.replace(/[^a-zA-Z0-9]/g, '')
  // For endpoint, only allow alphanumeric, dots, and hyphens
  const cleanEndpoint = rawEndpoint.replace(/[^a-zA-Z0-9.-]/g, '')

  console.log('🔧 R2 Configuration for books:')
  console.log('   Access Key ID length:', cleanAccessKeyId.length)
  console.log('   Secret Access Key length:', cleanSecretAccessKey.length)
  console.log('   Endpoint:', cleanEndpoint)

  // Additional validation to ensure credentials are clean
  if (!cleanAccessKeyId || !cleanSecretAccessKey || !cleanEndpoint) {
    console.error('R2 credentials are empty after cleaning')
    return null
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${cleanEndpoint}`,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    // R2-specific configuration
    forcePathStyle: false,
    // Disable AWS-specific features
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
    // Try to fix Vercel serverless environment issues
    maxAttempts: 1,
    requestHandler: {
      // Force specific HTTP agent configuration for Vercel
      connectionTimeout: 5000,
      socketTimeout: 5000,
      metadata: { handlerProtocol: 'http/1.1' },
      requestTimeout: 10000,
    },
    // Force specific signing behavior for R2
    customUserAgent: 'storyhouse-r2-client/1.0'
  })
  
  console.log('✅ R2 client initialized successfully for books with header cleaning')
  return client
}

function getR2Client(): S3Client | null {
  if (!r2Client) {
    r2Client = initializeR2Client()
  }
  return r2Client
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')

// Helper function to get actual chapter count for a book
async function getChapterCount(authorAddress: string, slug: string): Promise<number> {
  try {
    console.log(`🔢 Getting chapter count for ${authorAddress}/${slug}...`)
    
    // Create a fresh client for this operation to avoid header contamination
    const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/[^a-zA-Z0-9.-]/g, '')

    // Validate credentials before creating client
    if (!cleanAccessKeyId || !cleanSecretAccessKey || !cleanEndpoint) {
      console.warn(`⚠️ R2 credentials missing for chapter count`)
      return 0
    }

    const freshClient = new S3Client({
      region: 'auto',
      endpoint: `https://${cleanEndpoint}`,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
      // Minimal configuration to avoid header issues
      forcePathStyle: false,
      useAccelerateEndpoint: false,
      useDualstackEndpoint: false,
      maxAttempts: 1,
      requestHandler: {
        connectionTimeout: 3000,
        socketTimeout: 3000,
      }
    })

    const chaptersPrefix = `books/${authorAddress}/${slug}/chapters/`
    
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: chaptersPrefix,
      Delimiter: '/'
    })

    const listResponse = await freshClient.send(listCommand)
    
    // Count chapter directories (ch1/, ch2/, etc.)
    const chapters: number[] = []
    if (listResponse.CommonPrefixes) {
      for (const prefix of listResponse.CommonPrefixes) {
        if (prefix.Prefix) {
          const chapterMatch = prefix.Prefix.match(/\/ch(\d+)\/$/)
          if (chapterMatch) {
            const chapterNumber = parseInt(chapterMatch[1], 10)
            chapters.push(chapterNumber)
          }
        }
      }
    }

    console.log(`📊 Found ${chapters.length} chapters for ${authorAddress}/${slug}`)
    return chapters.length
  } catch (error) {
    console.warn(`⚠️ Failed to get chapter count for ${authorAddress}/${slug}:`, error)
    return 0
  }
}

export interface RegisteredBook {
  id: string
  title: string
  description: string
  author: string
  authorName: string
  authorAddress?: string
  genres: string[]
  genre?: string
  moods?: string[]
  emojis?: string[]
  coverUrl?: string
  createdAt: string
  lastUpdated?: string
  registeredAt?: string
  ipAssetId?: string
  tokenId?: string
  transactionHash?: string
  chapters: number
  slug: string
  isRemixable?: boolean
  totalReads?: number
  averageRating?: number
  contentRating?: string
  tags?: string[]
  preview?: string
}

/**
 * GET /api/books - Fetch all registered books from R2 using index
 */
export async function GET(request: NextRequest) {
  // Check if index mode is disabled (for testing/comparison)
  const useIndex = request.nextUrl.searchParams.get('useIndex') !== 'false'
  
  if (useIndex) {
    return getFromIndex(request)
  } else {
    return getFromR2Direct(request)
  }
}

/**
 * Optimized GET using book index
 */
async function getFromIndex(request: NextRequest) {
  try {
    console.log('📚 Fetching books from index...')
    const startTime = Date.now()
    
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('author')
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Index fetch timeout')), 10000)
    )
    
    // Try to get the index with timeout
    let index = await Promise.race([
      bookIndexService.getBookIndex(),
      timeoutPromise
    ]) as any
    
    // If no index exists or it's stale, rebuild it with timeout
    if (!index || bookIndexService.isIndexStale(index)) {
      console.log('🔄 Index is stale or missing, rebuilding...')
      try {
        await Promise.race([
          bookIndexService.updateBookIndex(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Index update timeout')), 15000))
        ])
        index = await Promise.race([
          bookIndexService.getBookIndex(),
          timeoutPromise
        ]) as any
      } catch (updateError) {
        console.error('Failed to update index:', updateError)
        return getFromR2Direct(request)
      }
    }
    
    if (!index) {
      console.error('❌ Failed to create or retrieve book index')
      return getFromR2Direct(request) // Fallback to direct R2
    }
    
    // Filter books if author is specified
    let books = index.books
    if (authorAddress) {
      books = books.filter(book => 
        book.authorAddress.toLowerCase() === authorAddress.toLowerCase()
      )
    }
    
    // Map to RegisteredBook format for compatibility
    const registeredBooks: RegisteredBook[] = books.map(book => ({
      id: book.id,
      title: book.title,
      description: book.description || '',
      author: book.authorAddress,
      authorAddress: book.authorAddress,
      authorName: book.authorAddress.slice(-4) || 'Unknown',
      genres: book.tags || [],
      genre: book.tags?.[0] || 'General',
      moods: [],
      emojis: [],
      coverUrl: `/api/books/${encodeURIComponent(book.id)}/cover`,
      createdAt: book.createdAt,
      lastUpdated: book.updatedAt || book.createdAt,
      registeredAt: book.createdAt,
      ipAssetId: undefined,
      tokenId: undefined,
      transactionHash: undefined,
      chapters: book.chapterCount,
      slug: book.slug,
      isRemixable: true, // Default to true for now
      totalReads: 0,
      averageRating: 0,
      contentRating: 'G',
      tags: book.tags || [],
      preview: book.description?.slice(0, 150) + '...' || '',
    }))
    
    const duration = Date.now() - startTime
    console.log(`✅ Loaded ${registeredBooks.length} books from index in ${duration}ms`)
    
    const response = NextResponse.json({
      success: true,
      books: registeredBooks,
      stories: registeredBooks, // Add stories field for backward compatibility
      count: registeredBooks.length,
      loadTime: duration,
      source: 'index',
      indexVersion: index.version,
      indexLastUpdated: index.lastUpdated
    })
    
    // Disable caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    return response
    
  } catch (error) {
    console.error('❌ Error fetching from index, falling back to direct R2:', error)
    return getFromR2Direct(request)
  }
}

/**
 * Original GET implementation - direct from R2
 */
async function getFromR2Direct(request: NextRequest) {
  try {
    console.log('📚 Fetching registered books from R2...')
    
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('author')
    
    const client = getR2Client()
    
    if (!client) {
      console.error('❌ R2 client not configured')
      return NextResponse.json({
        success: true,
        books: [],
        stories: [],
        count: 0,
        message: 'Storage not configured'
      })
    }

    // List all objects in the books/ prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      Delimiter: '/',
    })

    console.log('🔍 Listing book directories...')

    let listResponse
    try {
      listResponse = await client.send(listCommand)
      console.log('✅ R2 connection successful for books')
      console.log('📊 Books response:', {
        KeyCount: listResponse.KeyCount,
        CommonPrefixesCount: listResponse.CommonPrefixes?.length || 0,
        IsTruncated: listResponse.IsTruncated
      })
    } catch (r2Error) {
      console.error('❌ R2 connection failed for books:', r2Error)
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to R2 storage for books',
        details: r2Error instanceof Error ? r2Error.message : 'Unknown R2 error',
        books: [],
        stories: [] // Add stories field for backward compatibility
      }, { status: 500 })
    }

    if (!listResponse.CommonPrefixes || listResponse.CommonPrefixes.length === 0) {
      console.log('📂 No book directories found in R2')
      
      // Debug: List all objects to see what's there
      const allObjectsCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'books/',
        MaxKeys: 100
      })

      try {
        const allObjectsResponse = await client.send(allObjectsCommand)
        console.log('📋 All objects in books/ prefix:')
        console.log('📊 Found', allObjectsResponse.Contents?.length || 0, 'objects')
        allObjectsResponse.Contents?.forEach(obj => {
          console.log(`   - ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`)
        })
        
        if (allObjectsResponse.Contents && allObjectsResponse.Contents.length > 0) {
          console.log('📝 Books found in storage but not in expected directory structure')
          console.log('📂 Expected structure: books/{authorAddress}/{slug}/metadata.json')
          console.log('🔍 Let me check what we actually have...')
        }
      } catch (debugError) {
        console.warn('Failed to list all book objects for debugging:', debugError)
      }

      return NextResponse.json({
        success: true,
        books: [],
        stories: [], // Add stories field for backward compatibility
        message: 'No books found in R2 storage',
        debug: {
          bucket: BUCKET_NAME,
          prefix: 'books/',
          authorFilter: authorAddress
        }
      })
    }

    console.log(`📁 Found ${listResponse.CommonPrefixes.length} author directories`)
    const books: RegisteredBook[] = []

    // Process each author directory
    for (const authorPrefix of listResponse.CommonPrefixes) {
      if (!authorPrefix.Prefix) continue

      const authorFromPrefix = authorPrefix.Prefix.replace('books/', '').replace('/', '')
      console.log(`👤 Processing author directory: ${authorFromPrefix}`)

      // If filtering by author, skip if not matching
      if (authorAddress && authorFromPrefix.toLowerCase() !== authorAddress.toLowerCase()) {
        console.log(`   ⏭️ Skipping - doesn't match filter ${authorAddress}`)
        continue
      }

      // List books for this author
      const authorBooksCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `books/${authorFromPrefix}/`,
        Delimiter: '/',
      })

      try {
        const authorBooksResponse = await client.send(authorBooksCommand)
        
        if (!authorBooksResponse.CommonPrefixes) {
          console.log(`   📂 No books found for author ${authorFromPrefix}`)
          continue
        }

        console.log(`   📚 Found ${authorBooksResponse.CommonPrefixes.length} books for ${authorFromPrefix}`)

        // Process each book for this author
        for (const bookPrefix of authorBooksResponse.CommonPrefixes) {
          if (!bookPrefix.Prefix) continue

          const bookSlug = bookPrefix.Prefix.replace(`books/${authorFromPrefix}/`, '').replace('/', '')
          console.log(`      📖 Processing book: ${bookSlug}`)

          try {
            // Fetch book metadata
            const metadataKey = `books/${authorFromPrefix}/${bookSlug}/metadata.json`
            console.log(`      📄 Fetching metadata: ${metadataKey}`)

            const getObjectCommand = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: metadataKey,
            })

            const metadataResponse = await client.send(getObjectCommand)
            
            if (!metadataResponse.Body) {
              console.log(`      ❌ No metadata body for ${bookSlug}`)
              continue
            }

            const metadataText = await metadataResponse.Body.transformToString()
            const bookData = JSON.parse(metadataText)
            
            console.log(`      ✅ Book metadata loaded:`, {
              title: bookData.title,
              author: bookData.authorAddress,
              hasBlockchain: !!bookData.ipAssetId
            })

            // Get actual chapter count
            console.log(`      🔢 Getting chapter count for ${bookSlug}...`)
            const chapterCount = await getChapterCount(authorFromPrefix, bookSlug)
            console.log(`      📊 Chapter count: ${chapterCount}`)

            // Handle cover URL - always use API endpoint for consistency
            const bookId = `${authorFromPrefix}/${bookSlug}`
            
            // Return relative URL - frontend will prepend the correct base URL
            // This ensures the cover is served through our API which handles:
            // 1. R2 bucket access with proper credentials
            // 2. Fallback to placeholder if cover doesn't exist
            // 3. Proper caching headers
            const coverUrl = `/api/books/${encodeURIComponent(bookId)}/cover`

            const book: RegisteredBook = {
              id: bookId,
              title: bookData.title || 'Untitled Book',
              description: bookData.description || '',
              author: bookData.authorAddress || authorFromPrefix,
              authorAddress: bookData.authorAddress || authorFromPrefix,
              authorName: bookData.authorName || bookData.authorAddress?.slice(-4) || 'Unknown',
              genres: bookData.genres || [],
              genre: bookData.genres?.[0] || 'General',
              moods: bookData.moods,
              emojis: bookData.emojis,
              coverUrl: coverUrl, // Use metadata coverUrl or API endpoint fallback
              createdAt: bookData.createdAt || bookData.registeredAt || new Date().toISOString(),
              lastUpdated: bookData.updatedAt || bookData.createdAt || new Date().toISOString(),
              registeredAt: bookData.registeredAt,
              ipAssetId: bookData.ipAssetId,
              tokenId: bookData.tokenId,
              transactionHash: bookData.transactionHash,
              chapters: chapterCount, // Real chapter count from R2
              slug: bookSlug,
              isRemixable: bookData.isRemixable !== false, // Default to true if not specified
              totalReads: bookData.totalReads || 0,
              averageRating: bookData.averageRating || 0,
              contentRating: bookData.contentRating || 'G',
              tags: bookData.tags || [],
              preview: bookData.description?.slice(0, 150) + '...' || '',
            }

            books.push(book)
            console.log(`      ✅ Book processed: ${book.title}`)

          } catch (bookError) {
            console.warn(`      ❌ Failed to process book ${bookSlug}:`, bookError)
            continue
          }
        }
      } catch (authorError) {
        console.warn(`❌ Failed to process author ${authorFromPrefix}:`, authorError)
        continue
      }
    }

    // Sort by creation date (newest first)
    books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`✅ Successfully processed ${books.length} books`)

    const response = NextResponse.json({
      success: true,
      books,
      stories: books, // Add stories field for backward compatibility
      count: books.length,
      debug: {
        bucket: BUCKET_NAME,
        totalAuthorDirectories: listResponse.CommonPrefixes.length,
        processedBooks: books.length,
        authorFilter: authorAddress
      }
    })

    // Add cache control headers
    const cacheDisabled = request.nextUrl.searchParams.get('cache') === 'false'
    if (cacheDisabled) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    } else {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
    }

    return response

  } catch (error) {
    console.error('❌ Error fetching books from R2:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch books from R2',
        details: error instanceof Error ? error.message : 'Unknown error',
        books: []
      },
      { status: 500 }
    )
  }
}