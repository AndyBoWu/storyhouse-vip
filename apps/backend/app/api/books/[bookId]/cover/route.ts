import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

// Helper function to generate placeholder SVG
function generatePlaceholderSVG(title: string, authorAddress: string): string {
  const firstLetter = title.charAt(0).toUpperCase() || 'B'
  
  // Generate consistent colors based on author address
  const hash = authorAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue1 = hash % 360
  const hue2 = (hash + 120) % 360
  
  return `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1}, 70%, 60%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue2}, 70%, 50%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#grad)"/>
      <text x="200" y="320" font-family="Arial, sans-serif" font-size="180" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="middle">${firstLetter}</text>
    </svg>
  `
}

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
    
    // Try different image formats
    const imageFormats = ['jpg', 'png', 'webp', 'jpeg']
    const client = getR2Client()
    
    let response
    let coverKey
    let contentType = 'image/jpeg'
    
    // Try each format until we find the cover
    for (const format of imageFormats) {
      coverKey = `books/${authorAddress}/${slug}/cover.${format}`
      console.log('🖼️ Trying cover image:', coverKey)
      
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: coverKey,
        })
        
        response = await client.send(command)
        
        // Set correct content type based on format
        switch (format) {
          case 'png':
            contentType = 'image/png'
            break
          case 'webp':
            contentType = 'image/webp'
            break
          case 'jpg':
          case 'jpeg':
          default:
            contentType = 'image/jpeg'
        }
        
        console.log(`✅ Found cover in ${format} format`)
        break // Found the image, exit loop
      } catch (error) {
        if ((error as any)?.name === 'NoSuchKey') {
          console.log(`❌ No cover found in ${format} format`)
          continue // Try next format
        }
        throw error // Re-throw other errors
      }
    }
    
    if (!response) {
      console.log('❌ No cover found in any format, generating placeholder')
      
      // Try to get book metadata to generate a better placeholder
      try {
        const metadataCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `books/${authorAddress}/${slug}/metadata.json`,
        })
        
        const metadataResponse = await client.send(metadataCommand)
        if (metadataResponse.Body) {
          const metadataText = await metadataResponse.Body.transformToString()
          const metadata = JSON.parse(metadataText)
          const title = metadata.title || slug
          
          // Generate placeholder SVG
          const svgContent = generatePlaceholderSVG(title, authorAddress)
          const svgBuffer = Buffer.from(svgContent, 'utf-8')
          
          return new NextResponse(svgBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml',
              'Content-Length': svgBuffer.length.toString(),
              'Cache-Control': 'public, max-age=86400', // Cache for 1 day
            },
          })
        }
      } catch (metadataError) {
        console.log('❌ Could not fetch metadata for placeholder generation')
      }
      
      // Fallback: Generate placeholder with slug
      const svgContent = generatePlaceholderSVG(slug, authorAddress)
      const svgBuffer = Buffer.from(svgContent, 'utf-8')
      
      return new NextResponse(svgBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Length': svgBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        },
      })
    }
    
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
        'Content-Type': response.ContentType || contentType,
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