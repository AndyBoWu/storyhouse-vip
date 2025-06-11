import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../lib/services/notificationService'
import { eventDetectionService } from '../../../../lib/services/eventDetectionService'

/**
 * POST /api/notifications/opportunities
 * Trigger content opportunity analysis and notifications
 * 
 * Body:
 * {
 *   authorAddress: string,
 *   analysisType: 'collaboration' | 'content' | 'all',
 *   storyId?: string,
 *   engagementThreshold?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      authorAddress, 
      analysisType = 'all',
      storyId,
      engagementThreshold = 0.6
    } = await request.json()

    if (!authorAddress) {
      return NextResponse.json(
        { error: 'Author address is required' },
        { status: 400 }
      )
    }

    console.log(`💡 [API] Triggering ${analysisType} opportunity analysis for ${authorAddress}`)

    const results: any = {}

    // Collaboration opportunities
    if ((analysisType === 'collaboration' || analysisType === 'all') && storyId) {
      results.collaboration = await notificationService.findCollaborationOpportunities(
        authorAddress as Address,
        storyId,
        {
          compatibilityThreshold: 0.7,
          maxSuggestions: 5
        }
      )
    }

    // Content opportunities
    if (analysisType === 'content' || analysisType === 'all') {
      results.content = await notificationService.identifyContentOpportunities(
        authorAddress as Address,
        {
          engagementThreshold
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('❌ [API] Failed to analyze opportunities:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/opportunities
 * Get opportunity events for a user
 * 
 * Query params:
 * - authorAddress: Author wallet address (required)
 * - types: Comma-separated event types (optional)
 * - limit: Maximum number of events (optional, default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('authorAddress')
    const typesParam = searchParams.get('types')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!authorAddress) {
      return NextResponse.json(
        { error: 'Author address is required' },
        { status: 400 }
      )
    }

    // Parse event types
    const types = typesParam ? 
      typesParam.split(',').filter(t => ['collaboration', 'trend'].includes(t)) :
      ['collaboration', 'trend']

    console.log(`💡 [API] Fetching opportunity events for ${authorAddress}`)

    const events = await eventDetectionService.getEventsForAuthor(
      authorAddress as Address,
      {
        types: types as any,
        limit
      }
    )

    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch opportunity events:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch opportunity events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}