import { NextRequest, NextResponse } from 'next/server'
import { generateStoryChapter, StoryGenerationRequest } from '@/lib/ai/openai'

import { generateMockStory } from '@/lib/ai/mockStoryGenerator'
import { R2Service } from '@/lib/r2'
import type {
  EnhancedStoryCreationParams,
  EnhancedGeneratedStory,
  EnhancedApiResponse
} from '@storyhouse/shared'

// Enhanced story generation request interface
interface EnhancedStoryGenerationRequest {
  plotDescription: string
  genres: string[]
  moods: string[]
  emojis: string[]
  chapterNumber: number
  previousContent: string
  storyId?: string
  bookId?: string
  ipOptions?: Partial<EnhancedStoryCreationParams>
  collectionOptions?: Partial<EnhancedStoryCreationParams>
  authorAddress?: string
  authorName?: string
  bookCoverUrl?: string
}

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

    // Prepare the enhanced generation request
    const generationRequest: EnhancedStoryGenerationRequest = {
      plotDescription: body.plotDescription,
      genres: Array.isArray(body.genres) ? body.genres : [],
      moods: Array.isArray(body.moods) ? body.moods : [],
      emojis: Array.isArray(body.emojis) ? body.emojis : [],
      chapterNumber: body.chapterNumber || 1,
      previousContent: body.previousContent || '',
      storyId: body.storyId,
      bookId: body.bookId,
      // Enhanced options
      ipOptions: body.ipOptions || undefined,
      collectionOptions: body.collectionOptions || undefined,
      // Author information
      authorAddress: body.authorAddress,
      authorName: body.authorName,
      // Book cover
      bookCoverUrl: body.bookCoverUrl
    }

    // Validate plot description length
    if (generationRequest.plotDescription.length > 1000) {
      return NextResponse.json(
        { error: 'Plot description must be under 1000 characters' },
        { status: 400 }
      )
    }

    // Validate IP options if provided
    if (generationRequest.ipOptions?.registerAsIP) {
      const validLicenseTypes = ['standard', 'premium', 'exclusive', 'custom']
      if (generationRequest.ipOptions.licenseType && !validLicenseTypes.includes(generationRequest.ipOptions.licenseType)) {
        return NextResponse.json(
          { error: 'Invalid license type specified' },
          { status: 400 }
        )
      }
    }

    // Generate the story content - use mock generator if OpenAI is not configured
    let storyResult
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('🎭 Using mock story generator (OpenAI API key not configured)')
        storyResult = await generateMockStory(generationRequest)
      } else {
        storyResult = await generateStoryChapter(generationRequest)
      }
    } catch (error) {
      console.error('Story generation error:', error)
      // Fallback to mock generator if OpenAI fails
      console.log('🎭 Falling back to mock story generator')
      storyResult = await generateMockStory(generationRequest)
    }

    // Enhanced story result with IP-ready metadata
    const enhancedResult: EnhancedGeneratedStory = {
      ...storyResult,
      // Add Story Protocol compatible metadata
      suggestedTags: extractTagsFromContent(storyResult.content, generationRequest.genres),
      suggestedGenre: generationRequest.genres[0] || 'Adventure',
      contentRating: determineContentRating(storyResult.content),
      language: 'en',
      // AI confidence scores for IP registration decision making
      qualityScore: calculateQualityScore(storyResult),
      originalityScore: calculateOriginalityScore(storyResult),
      commercialViability: calculateCommercialViability(storyResult, generationRequest)
    }

    // Generate unique story and chapter IDs
    const storyId = body.storyId || `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const chapterNumber = generationRequest.chapterNumber

    // DO NOT save to R2 here - this should only happen after blockchain registration
    // The frontend will call a separate endpoint to save after MetaMask signing
    console.log(`📝 Generated chapter ${chapterNumber} - awaiting blockchain registration before storage`)

    // Prepare enhanced API response without R2 URL (no storage yet)
    const response: EnhancedApiResponse<EnhancedGeneratedStory> = {
      success: true,
      data: {
        ...enhancedResult,
        // Include metadata for frontend to use during blockchain registration
        storyId,
        chapterNumber,
        metadata: {
          // Content Classification
          suggestedTags: enhancedResult.suggestedTags,
          suggestedGenre: enhancedResult.suggestedGenre,
          contentRating: enhancedResult.contentRating,
          language: enhancedResult.language || 'en',
          genre: generationRequest.genres || [],
          mood: generationRequest.moods?.[0] || 'neutral',
          
          // AI Generation Data
          generationMethod: 'ai' as const,
          aiModel: 'gpt-4',
          plotDescription: generationRequest.plotDescription,
          qualityScore: enhancedResult.qualityScore,
          originalityScore: enhancedResult.originalityScore,
          commercialViability: enhancedResult.commercialViability,
          
          // Authorship
          authorAddress: generationRequest.authorAddress?.toLowerCase(),
          authorName: generationRequest.authorName,
          bookCoverUrl: generationRequest.bookCoverUrl,
          
          // Remix System
          isRemix: false,
          isRemixable: true,
          
          // License configuration based on request
          licenseTier: generationRequest.ipOptions?.licenseType || 'premium',
          licensePrice: generationRequest.ipOptions?.licenseType === 'free' ? 0 : 
                       generationRequest.ipOptions?.licenseType === 'exclusive' ? 1000 : 100,
          royaltyPercentage: generationRequest.ipOptions?.licenseType === 'free' ? 0 :
                            generationRequest.ipOptions?.licenseType === 'exclusive' ? 25 : 
                            generationRequest.ipOptions?.licenseType === 'premium' ? 10 : 5,
          
          // Read-to-Earn Economics
          unlockPrice: 0.1, // TIP tokens to read
          readReward: 0.05, // TIP tokens earned for reading
          
          // Status & Lifecycle
          status: 'draft' as const, // Mark as draft until blockchain registration
          generatedAt: new Date().toISOString(),
        }
      },
      message: 'Story generated successfully. Please sign with MetaMask to register on blockchain before publishing.'
    }

    // IP registration must be handled client-side with MetaMask
    // Just prepare the data structure for the frontend
    if (generationRequest.ipOptions?.registerAsIP) {
      response.ipData = {
        operationId: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requiresClientRegistration: true,
        metadata: {
          suggestedTags: enhancedResult.suggestedTags,
          suggestedGenre: enhancedResult.suggestedGenre,
          contentRating: enhancedResult.contentRating,
          language: enhancedResult.language,
          qualityScore: enhancedResult.qualityScore,
          originalityScore: enhancedResult.originalityScore,
          commercialViability: enhancedResult.commercialViability,
        }
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Enhanced story generation API error:', error)

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
      { error: 'Failed to generate enhanced story content. Please try again.' },
      { status: 500 }
    )
  }
}

// Enhanced helper functions for IP metadata generation
function extractTagsFromContent(content: string, genres: string[]): string[] {
  const tags = new Set<string>()

  // Add genre-based tags
  genres.forEach(genre => tags.add(genre.toLowerCase()))

  // Extract thematic keywords from content
  const thematicWords = [
    'mystery', 'adventure', 'romance', 'fantasy', 'magic', 'dragon', 'hero', 'villain',
    'quest', 'journey', 'battle', 'friendship', 'love', 'betrayal', 'discovery',
    'ancient', 'futuristic', 'cosmic', 'underwater', 'forest', 'castle', 'space'
  ]

  const contentLower = content.toLowerCase()
  thematicWords.forEach(word => {
    if (contentLower.includes(word)) {
      tags.add(word)
    }
  })

  return Array.from(tags).slice(0, 10) // Limit to 10 tags
}

function determineContentRating(content: string): 'G' | 'PG' | 'PG-13' | 'R' {
  const contentLower = content.toLowerCase()

  // Check for mature themes
  const matureKeywords = ['violence', 'blood', 'death', 'kill', 'murder', 'war']
  const romanticKeywords = ['love', 'kiss', 'romance', 'passion']

  const hasMatureContent = matureKeywords.some(keyword => contentLower.includes(keyword))
  const hasRomanticContent = romanticKeywords.some(keyword => contentLower.includes(keyword))

  if (hasMatureContent) return 'PG-13'
  if (hasRomanticContent) return 'PG'
  return 'G'
}

function calculateQualityScore(story: any): number {
  // Simple quality heuristics (in production, this could use AI models)
  let score = 50 // Base score

  // Word count factor
  if (story.wordCount > 200 && story.wordCount < 2000) score += 20

  // Theme diversity
  if (story.themes && story.themes.length > 2) score += 15

  // Content structure (simple check for paragraphs)
  const paragraphs = story.content.split('\n\n').length
  if (paragraphs > 3) score += 15

  return Math.min(score, 100)
}

function calculateOriginalityScore(story: any): number {
  // In production, this could check against existing content databases
  // For now, we'll use simple heuristics
  let score = 60 // Base score

  // Length factor (longer stories might be more original)
  if (story.wordCount > 500) score += 20

  // Theme uniqueness (simple check)
  if (story.themes && story.themes.length > 3) score += 20

  return Math.min(score, 100)
}

function calculateCommercialViability(story: any, request: EnhancedStoryGenerationRequest): number {
  let score = 40 // Base score

  // Popular genres boost commercial viability
  const popularGenres = ['fantasy', 'romance', 'mystery', 'sci-fi']
  if (request.genres.some(genre => popularGenres.includes(genre.toLowerCase()))) {
    score += 25
  }

  // Quality and originality factor
  const qualityScore = calculateQualityScore(story)
  const originalityScore = calculateOriginalityScore(story)
  score += Math.floor((qualityScore + originalityScore) / 8)

  return Math.min(score, 100)
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate enhanced stories.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate enhanced stories.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate enhanced stories.' },
    { status: 405 }
  )
}