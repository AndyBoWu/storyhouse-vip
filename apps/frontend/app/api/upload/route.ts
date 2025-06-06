import { NextRequest, NextResponse } from 'next/server'
import { R2Service } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, storyId, chapterNumber, contentType = 'application/json' } = body

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

    // Generate appropriate key based on content type
    let key: string
    let metadata: Record<string, string> = {
      storyId,
      uploadedAt: new Date().toISOString(),
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
      contentType,
      metadata,
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      metadata,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload content' },
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
