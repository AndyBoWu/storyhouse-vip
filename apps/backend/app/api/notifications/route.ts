import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../lib/services/notificationService'
import { eventDetectionService } from '../../../lib/services/eventDetectionService'

/**
 * GET /api/notifications
 * Fetch notifications for a user with optional filtering
 * 
 * Query params:
 * - authorAddress: Author wallet address (required)
 * - unreadOnly: Only return unread notifications (optional, default: false)
 * - limit: Maximum number of notifications (optional, default: 50)
 * - types: Comma-separated notification types (optional)
 * - since: ISO date string for filtering recent notifications (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('authorAddress')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const typesParam = searchParams.get('types')
    const sinceParam = searchParams.get('since')

    if (!authorAddress) {
      return NextResponse.json(
        { error: 'Author address is required' },
        { status: 400 }
      )
    }

    // Parse types if provided
    const types = typesParam ? typesParam.split(',') : undefined

    // Parse since date if provided
    const since = sinceParam ? new Date(sinceParam) : undefined

    console.log(`🔔 [API] Fetching notifications for ${authorAddress}`)

    const notifications = await notificationService.getNotifications(
      authorAddress as Address,
      {
        unreadOnly,
        limit,
        types,
        since
      }
    )

    const stats = notificationService.getNotificationStats(authorAddress as Address)

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        stats: {
          total: stats.totalNotifications,
          unread: stats.unreadCount,
          deliverySuccessRate: stats.deliverySuccessRate
        }
      }
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch notifications:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Send a notification manually (for testing or admin purposes)
 * 
 * Body:
 * {
 *   authorAddress: string,
 *   type: string,
 *   data: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authorAddress, type, data } = body

    if (!authorAddress || !type) {
      return NextResponse.json(
        { error: 'Author address and notification type are required' },
        { status: 400 }
      )
    }

    console.log(`🔔 [API] Sending manual notification: ${type} to ${authorAddress}`)

    const result = await notificationService.sendNotification(
      authorAddress as Address,
      type,
      data || {}
    )

    return NextResponse.json({
      success: result.success,
      data: {
        notificationId: result.notificationId,
        deliveryChannels: result.deliveryChannels,
        error: result.error
      }
    })
  } catch (error) {
    console.error('❌ [API] Failed to send notification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}