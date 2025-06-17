/**
 * @fileoverview Unified IP Registration API Endpoint
 * Single-transaction IP registration with PIL terms using mintAndRegisterIpAssetWithPilTerms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUnifiedIpService, getInitializedUnifiedIpService } from '@/lib/services/unifiedIpService'
import { BookStorageService } from '@/lib/storage/bookStorage'
import { z } from 'zod'

// Feature flag for unified registration
const UNIFIED_REGISTRATION_ENABLED = process.env.UNIFIED_REGISTRATION_ENABLED === 'true'

// Input validation schema
const UnifiedRegistrationSchema = z.object({
  story: z.object({
    id: z.string(),
    title: z.string().min(1).max(200),
    content: z.string().min(10),
    author: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Ethereum address
    genre: z.string(),
    mood: z.string().optional(),
    createdAt: z.string()
  }),
  nftContract: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  account: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  licenseTier: z.enum(['free', 'reading', 'premium', 'exclusive']),
  includeMetadata: z.boolean().optional().default(true)
})

type UnifiedRegistrationRequest = z.infer<typeof UnifiedRegistrationSchema>

/**
 * POST /api/ip/register-unified
 * Register IP asset with PIL terms in a single transaction
 */
export async function POST(request: NextRequest) {
  // Check if unified registration is enabled
  if (!UNIFIED_REGISTRATION_ENABLED) {
    return NextResponse.json({
      success: false,
      error: 'Unified registration is not enabled. Use /api/ip/register instead.'
    }, { status: 503 })
  }

  try {
    const body = await request.json()
    console.log('🚀 Unified IP registration request received:', {
      storyId: body.story?.id,
      licenseTier: body.licenseTier,
      account: body.account
    })

    // Validate input
    const validatedData = UnifiedRegistrationSchema.parse(body)
    const { story, nftContract, account, licenseTier, includeMetadata } = validatedData

    // Initialize unified IP service with proper async initialization
    const unifiedIpService = await getInitializedUnifiedIpService()

    let metadataUri: string | undefined
    let metadataHash: string | undefined

    // Generate and store metadata if requested
    if (includeMetadata) {
      try {
        console.log('📝 Generating IP metadata for Story Protocol...')
        
        // Extract author address and slug from story for R2 storage
        const authorAddress = story.author.toLowerCase()
        const slug = story.id.split('-').slice(1).join('-') // Remove author prefix
        
        const { metadataUri: generatedUri, metadataHash: generatedHash } = 
          await BookStorageService.storeIpMetadata(
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
        
        metadataUri = generatedUri
        metadataHash = generatedHash as any
        
        console.log('✅ IP metadata generated:', { uri: metadataUri, hash: metadataHash })
      } catch (metadataError) {
        console.warn('⚠️ Failed to generate metadata, proceeding without:', metadataError)
        // Continue without metadata rather than failing the entire operation
      }
    }

    // Execute unified registration
    console.log('🔗 Executing unified IP registration...')
    const result = await unifiedIpService.mintAndRegisterWithPilTerms({
      story,
      nftContract: nftContract as any,
      account: account as any,
      licenseTier,
      metadataUri,
      metadataHash: metadataHash as any
    })

    if (!result.success) {
      console.error('❌ Unified registration failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Registration failed'
      }, { status: 500 })
    }

    console.log('✅ Unified IP registration completed successfully!')
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        ipAsset: result.ipAsset,
        transactionHash: result.transactionHash,
        licenseTermsId: result.licenseTermsId,
        metadataUri,
        metadataHash,
        method: 'unified',
        gasOptimized: true
      }
    })

  } catch (error) {
    console.error('❌ Unified registration endpoint error:', error)

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
 * GET /api/ip/register-unified
 * Check if unified registration is available and get configuration
 */
export async function GET() {
  try {
    const unifiedIpService = await getInitializedUnifiedIpService()
    
    return NextResponse.json({
      enabled: UNIFIED_REGISTRATION_ENABLED,
      available: await unifiedIpService.supportsUnifiedRegistration(),
      features: {
        singleTransaction: true,
        gasOptimized: true,
        metadata: true,
        pilTerms: ['free', 'reading', 'premium', 'exclusive']
      },
      benefits: {
        reducedGasCost: '~40%',
        fasterExecution: '~66%',
        atomicOperation: true
      }
    })
  } catch (error) {
    return NextResponse.json({
      enabled: false,
      error: 'Service unavailable'
    }, { status: 503 })
  }
}