import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

// Use the cleaned R2 client initialization with header sanitization
let r2Client: S3Client

function initializeR2Client(): S3Client {
  console.log('🔧 Initializing R2 client for books with header cleaning...')
  
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
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
    throw new Error('R2 credentials are empty after cleaning')
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

function getR2Client(): S3Client {
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
  genres: string[]
  moods?: string[]
  emojis?: string[]
  coverUrl?: string
  createdAt: string
  registeredAt?: string
  ipAssetId?: string
  tokenId?: string
  transactionHash?: string
  chapters: number
  slug: string
}

/**
 * GET /api/books - Fetch all registered books from R2
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching registered books from R2...')
    
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('author')
    
    const client = getR2Client()

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
        books: []
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

            // Generate the correct cover URL using the API endpoint with full domain
            const bookId = `${authorFromPrefix}-${bookSlug}`
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-testnet.storyhouse.vip'
            const coverUrl = `${baseUrl}/api/books/${bookId}/cover`

            const book: RegisteredBook = {
              id: bookId,
              title: bookData.title || 'Untitled Book',
              description: bookData.description || '',
              author: bookData.authorAddress || authorFromPrefix,
              authorName: bookData.authorAddress?.slice(-4) || 'Unknown',
              genres: bookData.genres || [],
              moods: bookData.moods,
              emojis: bookData.emojis,
              coverUrl: coverUrl, // Use API endpoint instead of direct R2 URL
              createdAt: bookData.createdAt || bookData.registeredAt || new Date().toISOString(),
              registeredAt: bookData.registeredAt,
              ipAssetId: bookData.ipAssetId,
              tokenId: bookData.tokenId,
              transactionHash: bookData.transactionHash,
              chapters: chapterCount, // Real chapter count from R2
              slug: bookSlug
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