import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

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

    r2Client = new S3Client({
      region: 'auto',
      endpoint: cleanEndpoint,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
      forcePathStyle: true,
    })
    
    console.log('✅ R2 client initialized successfully for chapters')
  }
  
  return r2Client
}

function getR2Client(): S3Client {
  return initializeR2Client()
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME

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

    // Parse book ID to get author address and slug
    const bookIdParts = bookId.split('-')
    if (bookIdParts.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID format'
      }, { status: 400 })
    }

    const authorAddress = bookIdParts[0].toLowerCase()
    const slug = bookIdParts.slice(1).join('-')
    
    console.log('📖 Parsed book info:', { authorAddress, slug })

    const client = getR2Client()

    // List chapters for this book
    const chaptersPrefix = `books/${authorAddress}/${slug}/chapters/`
    
    console.log('🔍 Listing chapters with prefix:', chaptersPrefix)

    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: chaptersPrefix,
      Delimiter: '/'
    })

    const listResponse = await client.send(listCommand)
    
    console.log('📊 Chapter listing response:', {
      KeyCount: listResponse.KeyCount,
      CommonPrefixesCount: listResponse.CommonPrefixes?.length || 0,
      IsTruncated: listResponse.IsTruncated
    })

    // Get chapter numbers from the folder prefixes
    const chapters: number[] = []
    
    if (listResponse.CommonPrefixes) {
      for (const prefix of listResponse.CommonPrefixes) {
        if (prefix.Prefix) {
          // Extract chapter number from path like "books/author/slug/chapters/ch1/"
          const chapterMatch = prefix.Prefix.match(/\/ch(\d+)\/$/)
          if (chapterMatch) {
            const chapterNumber = parseInt(chapterMatch[1], 10)
            chapters.push(chapterNumber)
            console.log(`📄 Found chapter: ${chapterNumber}`)
          }
        }
      }
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