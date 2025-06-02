import { NextRequest, NextResponse } from 'next/server'
import { generateStoryChapter, StoryGenerationRequest } from '@/lib/ai/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.plotDescription || typeof body.plotDescription !== 'string') {
      return NextResponse.json(
        { error: 'Plot description is required' },
        { status: 400 }
      )
    }

    // Prepare the generation request
    const generationRequest: StoryGenerationRequest = {
      plotDescription: body.plotDescription,
      genres: Array.isArray(body.genres) ? body.genres : [],
      moods: Array.isArray(body.moods) ? body.moods : [],
      emojis: Array.isArray(body.emojis) ? body.emojis : [],
      chapterNumber: body.chapterNumber || 1,
      previousContent: body.previousContent || ''
    }

    // Validate plot description length
    if (generationRequest.plotDescription.length > 1000) {
      return NextResponse.json(
        { error: 'Plot description must be under 1000 characters' },
        { status: 400 }
      )
    }

    // Generate the story content
    const result = await generateStoryChapter(generationRequest)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Story generation API error:', error)

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please try again later.' },
          { status: 503 }
        )
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'AI service is busy. Please try again in a moment.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate story content. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate stories.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate stories.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate stories.' },
    { status: 405 }
  )
}
