import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../lib/services/notificationService'

/**
 * GET /api/notifications/[authorAddress]
 * Get notifications for a specific author
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  try {
    const { authorAddress } = params
    const { searchParams } = new URL(request.url)
    
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const typesParam = searchParams.get('types')
    const sinceParam = searchParams.get('since')

    // Parse types if provided
    const types = typesParam ? typesParam.split(',') : undefined

    // Parse since date if provided
    const since = sinceParam ? new Date(sinceParam) : undefined

    console.log(`🔔 [API] Fetching notifications for author ${authorAddress}`)

    const notifications = await notificationService.getNotifications(
      authorAddress as Address,
      {
        unreadOnly,
        limit,
        types,
        since
      }
    )

    return NextResponse.json({
      success: true,
      data: notifications
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch author notifications:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}