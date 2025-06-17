import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

// Initialize R2 client for direct image serving with header cleaning
let r2Client: S3Client

function initializeR2Client(): S3Client {
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

  return new S3Client({
    region: 'auto',
    endpoint: `https://${cleanEndpoint}`,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    forcePathStyle: false,
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
    maxAttempts: 1,
    requestHandler: {
      connectionTimeout: 5000,
      socketTimeout: 5000,
      metadata: { handlerProtocol: 'http/1.1' },
      requestTimeout: 10000,
    },
    customUserAgent: 'storyhouse-r2-client/1.0'
  })
}

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = initializeR2Client()
  }
  return r2Client
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/[\r\n]/g, '')

/**
 * GET /api/books/[bookId]/cover
 * 
 * Serve book cover images directly from R2 storage
 * This provides permanent access to covers while keeping the bucket private
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params
    
    // Parse bookId to get author address and slug
    // bookId format: {authorAddress}/{slug}
    const decodedBookId = decodeURIComponent(bookId)
    const parts = decodedBookId.split('/')
    if (parts.length !== 2) {
      console.error('Invalid book ID format:', bookId, 'decoded:', decodedBookId)
      return new NextResponse('Invalid book ID format', { status: 400 })
    }
    
    // Extract author address and slug
    const authorAddress = parts[0]
    const slug = parts[1]
    
    // Generate the cover key
    const coverKey = `books/${authorAddress}/${slug}/cover.jpg`
    
    console.log('🖼️ Serving cover image:', coverKey)
    
    // Fetch the image from R2
    const client = getR2Client()
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: coverKey,
    })
    
    const response = await client.send(command)
    
    if (!response.Body) {
      return new NextResponse('Cover image not found', { status: 404 })
    }
    
    // Convert the stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const imageBuffer = Buffer.concat(chunks)
    
    console.log('✅ Cover image served successfully')
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Content-Length': response.ContentLength?.toString() || imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': response.ETag || '',
        'Last-Modified': response.LastModified?.toUTCString() || '',
      },
    })
    
  } catch (error) {
    console.error('❌ Error serving cover image:', error)
    
    // Check for specific R2 errors
    if ((error as any)?.name === 'NoSuchKey') {
      return new NextResponse('Cover image not found', { status: 404 })
    }
    
    return new NextResponse('Failed to load cover image', { status: 500 })
  }
}