import { NextRequest, NextResponse } from 'next/server'
import { R2Service } from '../../../lib/r2'


export async function POST(request: NextRequest) {
  try {
    // Check Content-Type to handle different request formats
    const contentType = request.headers.get('content-type') || ''
    
    let body: any
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData uploads
      const formData = await request.formData()
      
      // Check if this is a book cover upload
      const uploadType = formData.get('type') as string
      if (uploadType === 'cover') {
        // Handle book cover upload
        const file = formData.get('file') as File
        const storyTitle = formData.get('storyTitle') as string
        
        if (!file) {
          return NextResponse.json(
            { error: 'File is required for cover upload' },
            { status: 400 }
          )
        }
        
        if (!storyTitle) {
          return NextResponse.json(
            { error: 'Story title is required for cover upload' },
            { status: 400 }
          )
        }
        
        // Convert file to buffer for R2 upload
        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Generate a simple slug from the title for the key
        const slug = storyTitle.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-')
        
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const key = `covers/${slug}-${Date.now()}.${fileExtension}`
        
        try {
          const publicUrl = await R2Service.uploadContent(key, buffer, {
            contentType: file.type || 'image/jpeg',
            metadata: {
              uploadType: 'cover',
              originalName: file.name,
              storyTitle,
              uploadedAt: new Date().toISOString(),
            },
          })
          
          return NextResponse.json({
            success: true,
            url: publicUrl,
            key,
            type: 'cover'
          })
        } catch (uploadError) {
          console.error('Cover upload to R2 failed:', uploadError)
          return NextResponse.json(
            { error: 'Failed to upload cover to storage' },
            { status: 500 }
          )
        }
      }
      
      // Handle regular content uploads
      body = {
        content: formData.get('content'),
        storyId: formData.get('storyId'),
        chapterNumber: formData.get('chapterNumber'),
        contentType: formData.get('contentType') || 'application/json',
        authorAddress: formData.get('authorAddress'),
        authorName: formData.get('authorName')
      }
    } else {
      // Handle JSON uploads with error handling
      const requestText = await request.text()
      if (!requestText || requestText.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        )
      }
      
      try {
        body = JSON.parse(requestText)
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        console.error('Raw request text:', requestText.slice(0, 200) + '...')
        return NextResponse.json(
          { error: 'Invalid JSON format in request body' },
          { status: 400 }
        )
      }
    }
    
    const { content, storyId, chapterNumber, contentType: reqContentType = 'application/json', authorAddress, authorName } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      )
    }

    try {
      // Check if this is NFT metadata upload (from Story Protocol registration)
      if (storyId.startsWith('nft-metadata-')) {
        // Handle NFT metadata uploads with simple key generation
        const timestamp = Date.now()
        const key = `metadata/nft-metadata-${timestamp}.json`
        
        const contentToUpload = typeof content === 'string' ? content : JSON.stringify(content)
        
        const publicUrl = await R2Service.uploadContent(key, contentToUpload, {
          contentType: reqContentType,
          metadata: {
            type: 'nft-metadata',
            storyId,
            uploadedAt: new Date().toISOString(),
          },
        })
        
        return NextResponse.json({
          success: true,
          url: publicUrl,
          key,
          type: 'nft-metadata'
        })
      }

      // Generate appropriate key based on content type for regular uploads
      let key: string
      let metadata: Record<string, string> = {
        storyId,
        uploadedAt: new Date().toISOString(),
        ...(authorAddress && { authorAddress }),
        ...(authorName && { authorName }),
      }

      if (chapterNumber !== undefined) {
        // Chapter content
        key = R2Service.generateChapterKey(storyId, chapterNumber)
        metadata.chapterNumber = chapterNumber.toString()
        metadata.contentType = 'chapter'
      } else {
        // Story metadata
        key = R2Service.generateStoryKey(storyId)
        metadata.contentType = 'story'
      }

      // Prepare content for upload
      const contentToUpload = typeof content === 'string'
        ? content
        : JSON.stringify(content)

      // Upload to R2
      const publicUrl = await R2Service.uploadContent(key, contentToUpload, {
        contentType: reqContentType,
        metadata,
      })

      return NextResponse.json({
        success: true,
        url: publicUrl,
        key,
        metadata,
      })
    } catch (uploadError) {
      console.error('Upload processing error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to process upload', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to upload content', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'general_upload_error'
      },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to retrieve content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      )
    }

    const content = await R2Service.getContent(key)

    return NextResponse.json({
      success: true,
      content,
      key,
    })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}