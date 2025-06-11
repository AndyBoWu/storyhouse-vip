/**
 * @fileoverview GET/POST /api/royalties/notifications/[authorAddress] - Royalty Notifications Endpoint
 * 
 * Handles notification management including:
 * - Retrieving notifications for an author
 * - Marking notifications as read
 * - Managing notification preferences
 * - Triggering manual notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { Address, isAddress } from 'viem'
import { notificationService } from '../../../../../lib/services/notificationService'
import type { 
  RoyaltyNotification,
  NotificationPreferences,
  RoyaltyNotificationType,
  RoyaltyAPIResponse
} from '../../../../../lib/types/royalty'

// Response interfaces
interface NotificationsResponse {
  notifications: RoyaltyNotification[]
  unreadCount: number
  totalCount: number
  pagination: {
    limit: number
    hasMore: boolean
  }
  preferences: NotificationPreferences
  statistics: {
    deliverySuccessRate: number
    recentActivity: Array<{ date: string; count: number }>
    byType: Record<RoyaltyNotificationType, number>
  }
}

interface NotificationActionResponse {
  success: boolean
  action: 'mark_read' | 'update_preferences' | 'send_test'
  affected: number
  message: string
}

/**
 * GET /api/royalties/notifications/[authorAddress]?unreadOnly=true&limit=50&types=new_royalty,claim_success&since=2024-01-01
 * Retrieve notifications for an author
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  const requestId = `notifications_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  try {
    const { authorAddress } = params
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const typesParam = searchParams.get('types')
    const sinceParam = searchParams.get('since')
    const includeStats = searchParams.get('includeStats') !== 'false'
    
    console.log(`🔔 [${requestId}] Fetching notifications for ${authorAddress}`, {
      unreadOnly,
      limit,
      types: typesParam,
      since: sinceParam
    })
    
    // Validation
    const validationErrors = validateAuthorAddress(authorAddress)
    if (validationErrors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        { errors: validationErrors },
        400,
        requestId
      )
    }
    
    // Parse types filter
    let types: RoyaltyNotificationType[] | undefined
    if (typesParam) {
      const requestedTypes = typesParam.split(',') as RoyaltyNotificationType[]
      const validTypes: RoyaltyNotificationType[] = [
        'new_royalty', 'claim_success', 'claim_failed', 'large_payment', 
        'monthly_summary', 'threshold_reached', 'system_alert'
      ]
      
      types = requestedTypes.filter(type => validTypes.includes(type))
    }
    
    // Parse since date
    let since: Date | undefined
    if (sinceParam) {
      try {
        since = new Date(sinceParam)
        if (isNaN(since.getTime())) {
          throw new Error('Invalid date format')
        }
      } catch (error) {
        return createErrorResponse(
          'INVALID_DATE',
          'Invalid since date format. Use ISO 8601 format.',
          { provided: sinceParam },
          400,
          requestId
        )
      }
    }
    
    // Get notifications
    console.log(`📬 [${requestId}] Retrieving notifications from service`)
    const notifications = await notificationService.getNotifications(
      authorAddress as Address,
      { unreadOnly, limit: limit + 1, types, since } // Get one extra to check for more
    )
    
    // Check if there are more notifications
    const hasMore = notifications.length > limit
    const returnedNotifications = hasMore ? notifications.slice(0, limit) : notifications
    
    // Get user preferences
    const preferences = await notificationService.getUserPreferences(authorAddress as Address)
    
    // Count totals
    const allNotifications = await notificationService.getNotifications(
      authorAddress as Address,
      { unreadOnly: false, limit: 1000 }
    )
    const unreadCount = allNotifications.filter(n => !n.read).length
    const totalCount = allNotifications.length
    
    // Get statistics if requested
    let statistics: any = {}
    if (includeStats) {
      console.log(`📊 [${requestId}] Generating notification statistics`)
      statistics = notificationService.getNotificationStats(authorAddress as Address)
    }
    
    // Prepare response
    const response: NotificationsResponse = {
      notifications: returnedNotifications,
      unreadCount,
      totalCount,
      pagination: {
        limit,
        hasMore
      },
      preferences,
      statistics
    }
    
    console.log(`✅ [${requestId}] Notifications retrieved successfully:`, {
      authorAddress,
      returned: returnedNotifications.length,
      unreadCount,
      totalCount,
      hasMore
    })
    
    return createSuccessResponse(response, requestId)
    
  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error retrieving notifications:`, error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while retrieving notifications',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      500,
      requestId
    )
  }
}

/**
 * POST /api/royalties/notifications/[authorAddress]
 * Perform actions on notifications (mark as read, update preferences, send test notification)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  const requestId = `notification_action_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  try {
    const { authorAddress } = params
    const body = await request.json()
    const { action, data } = body
    
    console.log(`🔔 [${requestId}] Processing notification action for ${authorAddress}:`, { action })
    
    // Validation
    const validationErrors = validateAuthorAddress(authorAddress)
    if (validationErrors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        { errors: validationErrors },
        400,
        requestId
      )
    }
    
    let response: NotificationActionResponse
    
    switch (action) {
      case 'mark_read':
        response = await handleMarkAsRead(authorAddress as Address, data, requestId)
        break
        
      case 'update_preferences':
        response = await handleUpdatePreferences(authorAddress as Address, data, requestId)
        break
        
      case 'send_test':
        response = await handleSendTestNotification(authorAddress as Address, data, requestId)
        break
        
      default:
        return createErrorResponse(
          'INVALID_ACTION',
          'Invalid action specified',
          { 
            provided: action, 
            allowed: ['mark_read', 'update_preferences', 'send_test'] 
          },
          400,
          requestId
        )
    }
    
    console.log(`✅ [${requestId}] Notification action completed:`, response)
    
    return createSuccessResponse(response, requestId)
    
  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error processing notification action:`, error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while processing notification action',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      500,
      requestId
    )
  }
}

/**
 * Handle marking notifications as read
 */
async function handleMarkAsRead(
  authorAddress: Address,
  data: { notificationIds?: string[]; markAll?: boolean },
  requestId: string
): Promise<NotificationActionResponse> {
  console.log(`📖 [${requestId}] Marking notifications as read`)
  
  if (data.markAll) {
    // Get all unread notifications
    const unreadNotifications = await notificationService.getNotifications(
      authorAddress,
      { unreadOnly: true, limit: 1000 }
    )
    
    const notificationIds = unreadNotifications.map(n => n.id)
    const result = await notificationService.markAsRead(authorAddress, notificationIds)
    
    return {
      success: true,
      action: 'mark_read',
      affected: result.marked,
      message: `Marked ${result.marked} notifications as read`
    }
  } else if (data.notificationIds && Array.isArray(data.notificationIds)) {
    const result = await notificationService.markAsRead(authorAddress, data.notificationIds)
    
    return {
      success: true,
      action: 'mark_read',
      affected: result.marked,
      message: `Marked ${result.marked} of ${data.notificationIds.length} notifications as read`
    }
  } else {
    throw new Error('Either notificationIds array or markAll=true must be provided')
  }
}

/**
 * Handle updating notification preferences
 */
async function handleUpdatePreferences(
  authorAddress: Address,
  data: Partial<NotificationPreferences>,
  requestId: string
): Promise<NotificationActionResponse> {
  console.log(`⚙️ [${requestId}] Updating notification preferences`)
  
  // Validate preference updates
  const allowedUpdates = [
    'emailNotifications', 'pushNotifications', 'inAppNotifications',
    'notificationTypes', 'minimumAmountThreshold', 'frequency'
  ]
  
  const updates: Partial<NotificationPreferences> = {}
  for (const [key, value] of Object.entries(data)) {
    if (allowedUpdates.includes(key)) {
      updates[key as keyof NotificationPreferences] = value
    }
  }
  
  if (Object.keys(updates).length === 0) {
    throw new Error('No valid preference updates provided')
  }
  
  await notificationService.updateUserPreferences(authorAddress, updates)
  
  return {
    success: true,
    action: 'update_preferences',
    affected: Object.keys(updates).length,
    message: `Updated ${Object.keys(updates).length} notification preferences`
  }
}

/**
 * Handle sending test notification
 */
async function handleSendTestNotification(
  authorAddress: Address,
  data: { type?: RoyaltyNotificationType; amount?: string },
  requestId: string
): Promise<NotificationActionResponse> {
  console.log(`🧪 [${requestId}] Sending test notification`)
  
  const type = data.type || 'system_alert'
  const amount = data.amount ? BigInt(data.amount) : undefined
  
  const result = await notificationService.sendNotification(
    authorAddress,
    type,
    {
      chapterId: 'test_chapter',
      chapterTitle: 'Test Chapter',
      amount,
      message: 'This is a test notification to verify your notification settings.',
      metadata: { test: true }
    }
  )
  
  return {
    success: result.success,
    action: 'send_test',
    affected: result.success ? 1 : 0,
    message: result.success 
      ? `Test notification sent via ${result.deliveryChannels.join(', ')}`
      : `Failed to send test notification: ${result.error}`
  }
}

/**
 * Validate author address parameter
 */
function validateAuthorAddress(authorAddress: string): string[] {
  const errors: string[] = []
  
  if (!authorAddress || typeof authorAddress !== 'string') {
    errors.push('authorAddress is required and must be a string')
  } else if (!isAddress(authorAddress)) {
    errors.push('authorAddress must be a valid Ethereum address')
  }
  
  return errors
}

/**
 * Create standardized success response
 */
function createSuccessResponse<T>(
  data: T,
  requestId: string
): NextResponse<RoyaltyAPIResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '2.3.1',
      requestId
    }
  })
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  code: string,
  message: string,
  details: any = {},
  status: number = 400,
  requestId: string
): NextResponse<RoyaltyAPIResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '2.3.1',
      requestId
    }
  }, { status })
}