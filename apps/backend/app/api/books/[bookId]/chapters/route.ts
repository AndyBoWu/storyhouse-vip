import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'
import { BookStorageService } from '@/lib/storage/bookStorage'

// Initialize R2 client
let r2Client: S3Client

function initializeR2Client(): S3Client {
  console.log('🔧 Initializing R2 client for chapters...')
  
  if (!r2Client) {
    // Validate environment variables
    const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
    }

    // Clean up environment variables
    const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')
    const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')
    const cleanEndpoint = (process.env.R2_ENDPOINT || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')

    // Ensure endpoint has protocol
    const endpointUrl = cleanEndpoint.startsWith('http') 
      ? cleanEndpoint 
      : `https://${cleanEndpoint}`

    r2Client = new S3Client({
      region: 'auto',
      endpoint: endpointUrl,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
      forcePathStyle: false,
      useAccelerateEndpoint: false,
      useDualstackEndpoint: false,
    })
    
    console.log('✅ R2 client initialized successfully for chapters')
  }
  
  return r2Client
}

function getR2Client(): S3Client {
  return initializeR2Client()
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/[\r\n]/g, '')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params
    
    if (!bookId) {
      return NextResponse.json({
        success: false,
        error: 'Book ID is required'
      }, { status: 400 })
    }

    console.log('📚 Getting chapter count for book:', bookId)

    // First, try to get book metadata to check for inherited chapters
    try {
      const bookMetadata = await BookStorageService.getBookMetadata(bookId)
      
      if (bookMetadata && bookMetadata.chapterMap) {
        // Use chapterMap for accurate chapter count (includes inherited chapters)
        const chapterNumbers = Object.keys(bookMetadata.chapterMap)
          .map(key => parseInt(key.replace('ch', '')))
          .filter(num => !isNaN(num))
          .sort((a, b) => a - b)
        
        const totalChapters = chapterNumbers.length
        const latestChapter = totalChapters > 0 ? Math.max(...chapterNumbers) : 0
        const nextChapterNumber = totalChapters > 0 ? latestChapter + 1 : 1
        
        console.log('📊 Using chapterMap from metadata:', {
          totalChapters,
          latestChapter,
          nextChapterNumber,
          chapters: chapterNumbers
        })
        
        return NextResponse.json({
          success: true,
          data: {
            bookId,
            totalChapters,
            latestChapter,
            nextChapterNumber,
            chapters: chapterNumbers
          }
        })
      }
    } catch (metadataError) {
      console.log('⚠️ Could not load book metadata, falling back to R2 listing:', metadataError)
    }

    // Fallback: Parse book ID and list R2 directory
    let authorAddress: string
    let slug: string
    
    try {
      const parsed = BookStorageService.parseBookId(bookId)
      authorAddress = parsed.authorAddress.toLowerCase()
      slug = parsed.slug
    } catch (parseError) {
      console.error('❌ Failed to parse book ID:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID format'
      }, { status: 400 })
    }
    
    console.log('📖 Parsed book info:', { authorAddress, slug })

    const client = getR2Client()

    // List chapters for this book
    const chaptersPrefix = `books/${authorAddress}/${slug}/chapters/`
    
    console.log('🔍 Listing chapters with prefix:', chaptersPrefix)

    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: chaptersPrefix,
      // Remove delimiter to list all files, not just folders
      // Delimiter: '/'
    })

    let listResponse
    try {
      listResponse = await client.send(listCommand)
    } catch (r2Error) {
      console.warn('⚠️ R2 listing failed, assuming new book with no chapters:', r2Error)
      // For new books, return default values
      return NextResponse.json({
        success: true,
        data: {
          bookId,
          totalChapters: 0,
          latestChapter: 0,
          nextChapterNumber: 1,
          chapters: []
        }
      })
    }
    
    console.log('📊 Chapter listing response:', {
      KeyCount: listResponse.KeyCount,
      CommonPrefixesCount: listResponse.CommonPrefixes?.length || 0,
      IsTruncated: listResponse.IsTruncated
    })

    // Get chapter numbers from files (since we removed delimiter)
    const chapters: number[] = []
    const chapterSet = new Set<number>()
    
    // Check if there are any objects (files) that indicate chapters
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log('📁 Files found in listing:', listResponse.Contents.length)
      console.log('📁 First few files:', listResponse.Contents.slice(0, 5).map(obj => obj.Key))
      
      // Extract chapter numbers from file paths
      for (const object of listResponse.Contents) {
        if (object.Key) {
          // Match chapter patterns like "chapters/ch6/content.json"
          const fileChapterMatch = object.Key.match(/chapters\/ch(\d+)\//);
          if (fileChapterMatch) {
            const chapterNumber = parseInt(fileChapterMatch[1], 10);
            if (!chapterSet.has(chapterNumber)) {
              chapterSet.add(chapterNumber);
              chapters.push(chapterNumber);
              console.log(`📄 Found chapter ${chapterNumber} from file: ${object.Key}`);
            }
          }
        }
      }
    } else {
      console.log('📁 No files found in listing')
    }

    // Sort chapters to get the latest
    chapters.sort((a, b) => a - b)
    
    const totalChapters = chapters.length
    const latestChapter = totalChapters > 0 ? Math.max(...chapters) : 0
    const nextChapterNumber = totalChapters > 0 ? latestChapter + 1 : 1

    console.log('📊 Chapter summary:', {
      totalChapters,
      latestChapter,
      nextChapterNumber,
      chapters: chapters.join(', ')
    })

    return NextResponse.json({
      success: true,
      data: {
        bookId,
        totalChapters,
        latestChapter,
        nextChapterNumber,
        chapters
      }
    })

  } catch (error) {
    console.error('❌ Error getting chapter count:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get chapter information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}