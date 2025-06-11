import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { notificationService } from '../../../../../lib/services/notificationService'

/**
 * GET /api/notifications/[authorAddress]/preferences
 * Get notification preferences for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  try {
    const { authorAddress } = params

    console.log(`⚙️ [API] Fetching notification preferences for ${authorAddress}`)

    const preferences = await notificationService.getUserPreferences(
      authorAddress as Address
    )

    return NextResponse.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    console.error('❌ [API] Failed to fetch notification preferences:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/[authorAddress]/preferences
 * Update notification preferences for a user
 * 
 * Body:
 * {
 *   emailNotifications?: boolean,
 *   pushNotifications?: boolean,
 *   inAppNotifications?: boolean,
 *   notificationTypes?: string[],
 *   minimumAmountThreshold?: string,
 *   frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly'
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  try {
    const { authorAddress } = params
    const updates = await request.json()

    console.log(`⚙️ [API] Updating notification preferences for ${authorAddress}:`, updates)

    // Convert minimumAmountThreshold to BigInt if provided
    if (updates.minimumAmountThreshold) {
      updates.minimumAmountThreshold = BigInt(updates.minimumAmountThreshold)
    }

    const updatedPreferences = await notificationService.updateUserPreferences(
      authorAddress as Address,
      updates
    )

    return NextResponse.json({
      success: true,
      data: updatedPreferences
    })
  } catch (error) {
    console.error('❌ [API] Failed to update notification preferences:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}