import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../lib/services/notificationService'
import { eventDetectionService } from '../../../../lib/services/eventDetectionService'

/**
 * POST /api/notifications/derivatives
 * Trigger derivative detection and notification for a story
 * 
 * Body:
 * {
 *   authorAddress: string,
 *   storyId: string,
 *   similarityThreshold?: number,
 *   autoNotify?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { authorAddress, storyId, similarityThreshold = 0.4, autoNotify = true } = await request.json()

    if (!authorAddress || !storyId) {
      return NextResponse.json(
        { error: 'Author address and story ID are required' },
        { status: 400 }
      )
    }

    console.log(`🔍 [API] Triggering derivative detection for story ${storyId}`)

    const result = await notificationService.detectAndNotifyDerivatives(
      authorAddress as Address,
      storyId,
      {
        similarityThreshold,
        autoNotify
      }
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('❌ [API] Failed to detect derivatives:', error)
    return NextResponse.json(
      { 
        error: 'Failed to detect derivatives',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/derivatives
 * Get derivative events for a user
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

    console.log(`🔍 [API] Fetching derivative events for ${authorAddress}`)

    const events = await eventDetectionService.getEventsForAuthor(
      authorAddress as Address,
      {
        types: ['derivative'],
        limit,
        unprocessedOnly
      }
    )

    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch derivative events:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch derivative events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}