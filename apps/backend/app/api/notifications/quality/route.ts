import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../lib/services/notificationService'
import { eventDetectionService } from '../../../../lib/services/eventDetectionService'

/**
 * POST /api/notifications/quality
 * Trigger quality assessment and improvement suggestions
 * 
 * Body:
 * {
 *   authorAddress: string,
 *   storyId: string,
 *   minQualityThreshold?: number,
 *   includeComparison?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      authorAddress, 
      storyId,
      minQualityThreshold = 0.7,
      includeComparison = true
    } = await request.json()

    if (!authorAddress || !storyId) {
      return NextResponse.json(
        { error: 'Author address and story ID are required' },
        { status: 400 }
      )
    }

    console.log(`📈 [API] Triggering quality assessment for story ${storyId}`)

    const result = await notificationService.assessAndSuggestQualityImprovements(
      authorAddress as Address,
      storyId,
      {
        minQualityThreshold,
        includeComparison
      }
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('❌ [API] Failed to assess quality:', error)
    return NextResponse.json(
      { 
        error: 'Failed to assess quality',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/quality
 * Get quality events for a user
 * 
 * Query params:
 * - authorAddress: Author wallet address (required)
 * - limit: Maximum number of events (optional, default: 20)
 * - unprocessedOnly: Only return unprocessed events (optional, default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('authorAddress')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unprocessedOnly = searchParams.get('unprocessedOnly') === 'true'

    if (!authorAddress) {
      return NextResponse.json(
        { error: 'Author address is required' },
        { status: 400 }
      )
    }

    console.log(`📈 [API] Fetching quality events for ${authorAddress}`)

    const events = await eventDetectionService.getEventsForAuthor(
      authorAddress as Address,
      {
        types: ['quality'],
        limit,
        unprocessedOnly
      }
    )

    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch quality events:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch quality events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}