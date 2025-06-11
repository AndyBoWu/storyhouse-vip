import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../lib/services/notificationService'
import { eventDetectionService } from '../../../../lib/services/eventDetectionService'

/**
 * POST /api/notifications/webhooks
 * Register webhook for automated derivative detection
 * 
 * Body:
 * {
 *   authorAddress: string,
 *   storyId: string,
 *   webhookUrl?: string,
 *   eventTypes?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { authorAddress, storyId, webhookUrl, eventTypes } = await request.json()

    if (!authorAddress || !storyId) {
      return NextResponse.json(
        { error: 'Author address and story ID are required' },
        { status: 400 }
      )
    }

    console.log(`🔗 [API] Registering webhook for story ${storyId} by ${authorAddress}`)

    const result = await notificationService.registerDerivativeWebhook(
      authorAddress as Address,
      storyId,
      webhookUrl
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('❌ [API] Failed to register webhook:', error)
    return NextResponse.json(
      { 
        error: 'Failed to register webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/webhooks
 * Get webhook status and statistics
 * 
 * Query params:
 * - authorAddress: Author wallet address (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('authorAddress')

    console.log(`📊 [API] Fetching webhook statistics`)

    // Get event detection stats
    const detectionStats = eventDetectionService.getDetectionStats()
    
    // Get notification stats
    const notificationStats = notificationService.getNotificationStats(
      authorAddress ? (authorAddress as Address) : undefined
    )

    return NextResponse.json({
      success: true,
      data: {
        webhookStats: {
          totalWebhooks: 0, // Would track registered webhooks in production
          activeWebhooks: 0,
          lastProcessed: new Date().toISOString()
        },
        detectionStats,
        notificationStats
      }
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch webhook stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch webhook statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}