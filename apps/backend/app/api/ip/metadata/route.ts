/**
 * @fileoverview IP Metadata Generation API Endpoint
 * Generates and stores metadata for IP assets without executing blockchain transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { BookStorageService } from '@/lib/storage/bookStorage'
import { z } from 'zod'

// Input validation schema
const MetadataGenerationSchema = z.object({
  story: z.object({
    id: z.string(),
    title: z.string().min(1).max(200),
    content: z.string().min(10),
    author: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Ethereum address
    genre: z.string(),
    mood: z.string().optional(),
    createdAt: z.string()
  }),
  licenseTier: z.enum(['free', 'reading', 'premium', 'exclusive'])
})

type MetadataGenerationRequest = z.infer<typeof MetadataGenerationSchema>

/**
 * POST /api/ip/metadata
 * Generate and store IP metadata for Story Protocol
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 IP metadata generation request received:', {
      storyId: body.story?.id,
      licenseTier: body.licenseTier
    })

    // Validate input
    const validatedData = MetadataGenerationSchema.parse(body)
    const { story, licenseTier } = validatedData

    try {
      console.log('📝 Generating IP metadata for Story Protocol...')
      
      // Extract author address and slug from story for R2 storage
      const authorAddress = story.author.toLowerCase()
      
      // Parse bookId - handle both formats: {authorAddress}/{slug} and {authorAddress}-{slug}
      let slug: string
      if (story.id.includes('/')) {
        // New format: authorAddress/slug
        const parts = story.id.split('/')
        slug = parts[1]
      } else {
        // Legacy format: authorAddress-slug
        const idParts = story.id.split('-')
        slug = idParts.slice(1).join('-') // Everything after the address is the slug
      }
      
      const { metadataUri, metadataHash } = await BookStorageService.storeIpMetadata(
        authorAddress as any,
        slug,
        {
          title: story.title,
          description: story.content.substring(0, 200) + '...',
          type: 'chapter',
          content: story.content,
          genre: story.genre,
          mood: story.mood,
          tags: [story.genre, story.mood].filter(Boolean),
          licenseType: licenseTier
        }
      )
      
      console.log('✅ IP metadata generated:', { uri: metadataUri, hash: metadataHash })
      
      // Return metadata information
      return NextResponse.json({
        success: true,
        data: {
          metadataUri,
          metadataHash
        }
      })
      
    } catch (metadataError) {
      console.error('❌ Failed to generate metadata:', metadataError)
      return NextResponse.json({
        success: false,
        error: 'Failed to generate metadata'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Metadata generation endpoint error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET /api/ip/metadata
 * Check metadata generation service status
 */
export async function GET() {
  return NextResponse.json({
    available: true,
    features: {
      ipfsSupport: false, // Currently using R2
      r2Support: true,
      sha256Verification: true
    }
  })
}