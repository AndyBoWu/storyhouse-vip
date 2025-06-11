/**
 * @fileoverview GET /api/royalties/history/[authorAddress] - Royalty History Endpoint
 * 
 * Retrieves comprehensive royalty claiming history for an author with pagination,
 * filtering, and analytics capabilities.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Address, isAddress, formatEther } from 'viem'
import { royaltyService } from '../../../../../lib/services/royaltyService'
import type { 
  RoyaltyHistoryEntry,
  RoyaltyAnalytics,
  RoyaltyAPIResponse,
  LicenseTier
} from '../../../../../lib/types/royalty'

// Response interface for history endpoint
interface RoyaltyHistoryResponse {
  entries: RoyaltyHistoryEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  analytics?: RoyaltyAnalytics
  summary: {
    totalClaimed: string
    totalClaimedFormatted: string
    totalFeesPaid: string
    totalFeesPaidFormatted: string
    claimCount: number
    successRate: number
    averageClaimAmount: string
    averageClaimAmountFormatted: string
    lastClaimDate?: string
  }
}

/**
 * GET /api/royalties/history/[authorAddress]?page=1&limit=50&includeAnalytics=true&status=completed&chapterId=xxx
 * Get royalty claiming history for an author
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { authorAddress: string } }
) {
  const requestId = `history_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  try {
    const { authorAddress } = params
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true'
    const statusFilter = searchParams.get('status') as 'pending' | 'completed' | 'failed' | 'cancelled' | null
    const chapterIdFilter = searchParams.get('chapterId')
    const licenseTierFilter = searchParams.get('licenseTier') as LicenseTier | null
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    
    console.log(`📚 [${requestId}] Fetching royalty history for ${authorAddress}`, {
      page,
      limit,
      includeAnalytics,
      statusFilter,
      chapterIdFilter
    })
    
    // Validation
    const validationErrors = validateHistoryRequest(authorAddress, page, limit)
    if (validationErrors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        { errors: validationErrors },
        400,
        requestId
      )
    }
    
    // Get royalty history from service
    console.log(`🔍 [${requestId}] Fetching history from RoyaltyService`)
    const allHistory = await royaltyService.getRoyaltyHistory(
      authorAddress as Address,
      1000 // Get more for filtering
    )
    
    // Apply filters
    let filteredHistory = allHistory
    
    if (statusFilter) {
      filteredHistory = filteredHistory.filter(entry => entry.status === statusFilter)
    }
    
    if (chapterIdFilter) {
      filteredHistory = filteredHistory.filter(entry => entry.chapterId === chapterIdFilter)
    }
    
    if (licenseTierFilter) {
      filteredHistory = filteredHistory.filter(entry => entry.licenseTier === licenseTierFilter)
    }
    
    if (startDate) {
      filteredHistory = filteredHistory.filter(entry => entry.timestamp >= startDate)
    }
    
    if (endDate) {
      filteredHistory = filteredHistory.filter(entry => entry.timestamp <= endDate)
    }
    
    // Apply pagination
    const total = filteredHistory.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex)
    
    // Enhance entries with formatted amounts
    const enhancedEntries: RoyaltyHistoryEntry[] = paginatedHistory.map(entry => ({
      ...entry,
      amountFormatted: formatEther(entry.amount),
      platformFeeFormatted: formatEther(entry.platformFee),
      netAmountFormatted: formatEther(entry.netAmount),
      gaasFeeFormatted: entry.gasUsed ? formatEther(BigInt(entry.gasUsed)) : undefined
    }))
    
    // Calculate summary statistics
    const completedEntries = allHistory.filter(e => e.status === 'completed')
    const totalClaimed = completedEntries.reduce((sum, e) => sum + e.amount, BigInt(0))
    const totalFeesPaid = completedEntries.reduce((sum, e) => sum + e.platformFee, BigInt(0))
    const claimCount = completedEntries.length
    const totalAttempts = allHistory.length
    const successRate = totalAttempts > 0 ? (claimCount / totalAttempts) * 100 : 0
    const averageClaimAmount = claimCount > 0 ? totalClaimed / BigInt(claimCount) : BigInt(0)
    const lastClaimDate = completedEntries.length > 0 ? completedEntries[0].timestamp : undefined
    
    // Prepare summary
    const summary = {
      totalClaimed: totalClaimed.toString(),
      totalClaimedFormatted: formatEther(totalClaimed),
      totalFeesPaid: totalFeesPaid.toString(),
      totalFeesPaidFormatted: formatEther(totalFeesPaid),
      claimCount,
      successRate: Math.round(successRate * 100) / 100,
      averageClaimAmount: averageClaimAmount.toString(),
      averageClaimAmountFormatted: formatEther(averageClaimAmount),
      lastClaimDate: lastClaimDate?.toISOString()
    }
    
    // Prepare pagination info
    const pagination = {
      page,
      limit,
      total,
      hasMore: endIndex < total
    }
    
    // Get analytics if requested
    let analytics: RoyaltyAnalytics | undefined
    if (includeAnalytics) {
      console.log(`📊 [${requestId}] Generating analytics`)
      analytics = await generateAnalytics(authorAddress as Address, allHistory)
    }
    
    // Prepare response
    const response: RoyaltyHistoryResponse = {
      entries: enhancedEntries,
      pagination,
      analytics,
      summary
    }
    
    console.log(`✅ [${requestId}] History fetched successfully:`, {
      authorAddress,
      totalEntries: total,
      returnedEntries: enhancedEntries.length,
      totalClaimed: summary.totalClaimedFormatted,
      successRate: summary.successRate
    })
    
    return createSuccessResponse(response, requestId)
    
  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error fetching royalty history:`, error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while fetching royalty history',
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
 * Generate analytics from history data
 */
async function generateAnalytics(
  authorAddress: Address,
  history: RoyaltyHistoryEntry[]
): Promise<RoyaltyAnalytics> {
  const now = new Date()
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  
  // Filter to completed claims in the period
  const periodHistory = history.filter(h => 
    h.status === 'completed' && 
    h.timestamp >= startDate
  )
  
  // Calculate basic metrics
  const totalClaimed = periodHistory.reduce((sum, h) => sum + h.amount, BigInt(0))
  const totalFeesPaid = periodHistory.reduce((sum, h) => sum + h.platformFee, BigInt(0))
  const claimCount = periodHistory.length
  const averageClaimAmount = claimCount > 0 ? totalClaimed / BigInt(claimCount) : BigInt(0)
  
  // Calculate success rate
  const allAttempts = history.filter(h => h.timestamp >= startDate)
  const successRate = allAttempts.length > 0 ? (claimCount / allAttempts.length) * 100 : 100
  
  // Find largest claim
  const largestClaim = periodHistory.reduce((max, h) => h.amount > max ? h.amount : max, BigInt(0))
  
  // Calculate average claim time (simplified)
  const averageClaimTime = 5 // Average 5 seconds (simplified calculation)
  
  // Calculate tier breakdown
  const tierBreakdown: Record<LicenseTier, any> = {
    free: { count: 0, totalAmount: BigInt(0), averageAmount: BigInt(0) },
    premium: { count: 0, totalAmount: BigInt(0), averageAmount: BigInt(0) },
    exclusive: { count: 0, totalAmount: BigInt(0), averageAmount: BigInt(0) }
  }
  
  for (const entry of periodHistory) {
    const tier = entry.licenseTier || 'premium' // Default if not specified
    tierBreakdown[tier].count++
    tierBreakdown[tier].totalAmount += entry.amount
  }
  
  // Calculate averages
  for (const tier of Object.keys(tierBreakdown) as LicenseTier[]) {
    const data = tierBreakdown[tier]
    data.averageAmount = data.count > 0 ? data.totalAmount / BigInt(data.count) : BigInt(0)
    data.totalAmountFormatted = formatEther(data.totalAmount)
    data.averageAmountFormatted = formatEther(data.averageAmount)
  }
  
  // Calculate growth rate (simplified - compare to previous 30 days)
  const previousPeriodStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  const previousPeriodHistory = history.filter(h => 
    h.status === 'completed' && 
    h.timestamp >= previousPeriodStart && 
    h.timestamp < startDate
  )
  const previousTotal = previousPeriodHistory.reduce((sum, h) => sum + h.amount, BigInt(0))
  
  const growthRate = previousTotal > 0 
    ? Number((totalClaimed - previousTotal) * BigInt(10000) / previousTotal) / 100
    : totalClaimed > 0 ? 100 : 0
  
  // Project next period (simple growth projection)
  const projectedNext = totalClaimed + (totalClaimed * BigInt(Math.max(0, Math.round(growthRate)))) / BigInt(100)
  
  return {
    authorAddress,
    period: 'month',
    startDate,
    endDate: now,
    totalClaimed,
    totalClaimedFormatted: formatEther(totalClaimed),
    totalFeesPaid,
    totalFeesPaidFormatted: formatEther(totalFeesPaid),
    claimCount,
    averageClaimAmount,
    averageClaimAmountFormatted: formatEther(averageClaimAmount),
    successRate: Math.round(successRate * 100) / 100,
    averageClaimTime,
    largestClaim,
    largestClaimFormatted: formatEther(largestClaim),
    lastClaimDate: periodHistory.length > 0 ? periodHistory[0].timestamp : undefined,
    tierBreakdown,
    growthRate: Math.round(growthRate * 100) / 100,
    projectedNext,
    projectedNextFormatted: formatEther(projectedNext)
  }
}

/**
 * Validate history request parameters
 */
function validateHistoryRequest(authorAddress: string, page: number, limit: number): string[] {
  const errors: string[] = []
  
  if (!authorAddress || typeof authorAddress !== 'string') {
    errors.push('authorAddress is required and must be a string')
  } else if (!isAddress(authorAddress)) {
    errors.push('authorAddress must be a valid Ethereum address')
  }
  
  if (page < 1) {
    errors.push('page must be a positive integer')
  }
  
  if (limit < 1 || limit > 100) {
    errors.push('limit must be between 1 and 100')
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
      version: '2.1.3',
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
      version: '2.1.3',
      requestId
    }
  }, { status })
}