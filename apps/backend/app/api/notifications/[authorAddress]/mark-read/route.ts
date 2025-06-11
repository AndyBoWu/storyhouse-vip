import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../../lib/services/notificationService'

/**
 * PUT /api/notifications/[authorAddress]/mark-read
 * Mark notifications as read for a user
 * 
 * Body:
 * {
 *   notificationIds: string[]
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  try {
    const { authorAddress } = params
    const { notificationIds } = await request.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      )
    }

    console.log(`📖 [API] Marking ${notificationIds.length} notifications as read for ${authorAddress}`)

    const result = await notificationService.markAsRead(
      authorAddress as Address,
      notificationIds
    )

    return NextResponse.json({
      success: true,
      data: {
        marked: result.marked,
        notFound: result.notFound
      }
    })
  } catch (error) {
    console.error('❌ [API] Failed to mark notifications as read:', error)
    return NextResponse.json(
      { 
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}