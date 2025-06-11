/**
 * @fileoverview GET /api/royalties/claimable/[chapterId] - Check Claimable Royalties Endpoint
 * 
 * Checks how much royalty is available for claiming for a specific chapter,
 * including calculations for gas fees and net amounts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Address, isAddress, formatEther } from 'viem'
import { AdvancedStoryProtocolService } from '../../../../../lib/services/advancedStoryProtocolService'
import { royaltyService } from '../../../../../lib/services/royaltyService'
import { calculateRoyaltyBreakdown } from '../../../../../lib/utils/royaltyCalculations'
import { categorizeBlockchainError } from '../../../../../lib/utils/blockchainErrors'
import type { 
  ClaimableRoyaltyCheck,
  RoyaltyAPIResponse,
  LicenseTier
} from '../../../../../lib/types/royalty'

// Cache for claimable amounts (30 second TTL)
const claimableCache = new Map<string, {
  data: ClaimableRoyaltyCheck
  expiry: number
}>()
const CACHE_TTL = 30 * 1000 // 30 seconds

/**
 * GET /api/royalties/claimable/[chapterId]?authorAddress=0x...&refresh=true
 * Check claimable royalty amount for a chapter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const requestId = `claimable_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  try {
    const { chapterId } = params
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('authorAddress') as Address
    const refresh = searchParams.get('refresh') === 'true'
    const includeLicenseTier = searchParams.get('includeLicenseTier') === 'true'
    
    console.log(`🔍 [${requestId}] Checking claimable royalties for chapter ${chapterId}`)
    
    // Validation
    const validationErrors = validateClaimableRequest(chapterId, authorAddress)
    if (validationErrors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        { errors: validationErrors },
        400,
        requestId
      )
    }
    
    // Check cache first (unless refresh requested)
    const cacheKey = `${chapterId}_${authorAddress}`
    if (!refresh) {
      const cached = claimableCache.get(cacheKey)
      if (cached && Date.now() < cached.expiry) {
        console.log(`💨 [${requestId}] Returning cached claimable data`)
        return createSuccessResponse(cached.data, requestId)
      }
    }
    
    // Initialize services
    const storyProtocolService = new AdvancedStoryProtocolService()
    
    // Get claimable royalties from blockchain
    console.log(`🔗 [${requestId}] Fetching claimable royalties from blockchain`)
    const claimableResult = await storyProtocolService.getClaimableRoyalties(chapterId)
    
    if (!claimableResult.success) {
      console.error(`❌ [${requestId}] Failed to fetch claimable royalties:`, claimableResult.error)
      const categorizedError = categorizeBlockchainError(new Error(claimableResult.error || 'Unknown error'))
      
      return createErrorResponse(
        'BLOCKCHAIN_ERROR',
        'Failed to check claimable royalties',
        {
          blockchainError: claimableResult.error,
          category: categorizedError.category,
          troubleshooting: categorizedError.troubleshooting
        },
        500,
        requestId
      )
    }
    
    // Determine license tier (simplified logic - in production, fetch from metadata)
    let licenseTier: LicenseTier = 'premium' // Default assumption
    let licenseTermsId: string | undefined
    
    if (includeLicenseTier) {
      try {
        // In production, this would fetch actual license data from storage/blockchain
        // For now, determine based on amount ranges
        const amount = claimableResult.claimableAmount
        if (amount === BigInt(0)) {
          licenseTier = 'free'
        } else if (amount < BigInt('100000000000000000')) { // < 0.1 ETH
          licenseTier = 'premium'
        } else {
          licenseTier = 'exclusive'
        }
        licenseTermsId = `terms_${licenseTier}_${chapterId}`
      } catch (error) {
        console.warn(`⚠️ [${requestId}] Could not determine license tier:`, error)
      }
    }
    
    // Calculate detailed breakdown including fees
    const breakdown = calculateRoyaltyBreakdown({
      totalRevenue: claimableResult.claimableAmount,
      licenseTier
    })
    
    // Check if TIP token balance is sufficient (platform side)
    let canClaim = true
    const blockingReasons: string[] = []
    
    try {
      await royaltyService.validateTIPTokenBalance(
        authorAddress,
        breakdown.netAmount
      )
    } catch (error) {
      canClaim = false
      blockingReasons.push(`Insufficient platform TIP token balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Additional validation checks
    if (breakdown.netAmount <= BigInt(0)) {
      canClaim = false
      blockingReasons.push('Net amount after fees would be zero or negative')
    }
    
    if (claimableResult.claimableAmount === BigInt(0)) {
      canClaim = false
      blockingReasons.push('No royalties currently available for claiming')
    }
    
    // Get last claim date from history
    let lastClaimDate: Date | undefined
    try {
      const history = await royaltyService.getRoyaltyHistory(authorAddress, 1)
      const lastClaim = history.find(h => h.chapterId === chapterId && h.status === 'completed')
      lastClaimDate = lastClaim?.timestamp
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Could not fetch claim history:`, error)
    }
    
    // Prepare response
    const response: ClaimableRoyaltyCheck = {
      chapterId,
      authorAddress,
      claimableAmount: claimableResult.claimableAmount,
      claimableAmountFormatted: formatEther(claimableResult.claimableAmount),
      lastClaimDate,
      licenseTermsId,
      licenseTier,
      estimatedGasFee: breakdown.estimatedGasFee,
      estimatedNetAmount: breakdown.netAmount,
      canClaim,
      blockingReasons: blockingReasons.length > 0 ? blockingReasons : undefined
    }
    
    // Cache the result
    claimableCache.set(cacheKey, {
      data: response,
      expiry: Date.now() + CACHE_TTL
    })
    
    console.log(`✅ [${requestId}] Claimable check completed:`, {
      chapterId,
      authorAddress,
      claimableAmount: response.claimableAmountFormatted,
      canClaim,
      blockingReasons: blockingReasons.length
    })
    
    return createSuccessResponse(response, requestId)
    
  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error checking claimable royalties:`, error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while checking claimable royalties',
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
 * Validate claimable request parameters
 */
function validateClaimableRequest(chapterId: string, authorAddress: string | null): string[] {
  const errors: string[] = []
  
  if (!chapterId || typeof chapterId !== 'string') {
    errors.push('chapterId is required and must be a string')
  }
  
  if (!authorAddress || typeof authorAddress !== 'string') {
    errors.push('authorAddress query parameter is required')
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

/**
 * Clear expired cache entries (cleanup function)
 */
function cleanupCache(): void {
  const now = Date.now()
  for (const [key, value] of claimableCache.entries()) {
    if (now >= value.expiry) {
      claimableCache.delete(key)
    }
  }
}

// Cleanup cache every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000)