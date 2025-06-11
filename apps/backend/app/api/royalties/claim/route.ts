/**
 * @fileoverview POST /api/royalties/claim - Individual Chapter Royalty Claiming Endpoint
 * 
 * Handles royalty claiming for individual chapters with comprehensive validation,
 * error handling, and integration with both AdvancedStoryProtocolService and RoyaltyService.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Address, isAddress } from 'viem'
import { AdvancedStoryProtocolService } from '../../../../lib/services/advancedStoryProtocolService'
import { royaltyService } from '../../../../lib/services/royaltyService'
import { categorizeBlockchainError } from '../../../../lib/utils/blockchainErrors'
import type { 
  RoyaltyClaimRequest,
  RoyaltyClaimResponse,
  RoyaltyAPIResponse 
} from '../../../../lib/types/royalty'

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * POST /api/royalties/claim
 * Claim royalties for an individual chapter
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  try {
    console.log(`🎯 [${requestId}] Royalty claim request started`)
    
    // Parse and validate request body
    const body = await request.json()
    const { chapterId, authorAddress, licenseTermsId, expectedAmount } = body as RoyaltyClaimRequest & {
      expectedAmount?: string
    }
    
    // Validation
    const validationErrors = validateClaimRequest(body)
    if (validationErrors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        { errors: validationErrors },
        400,
        requestId
      )
    }
    
    // Rate limiting check
    const rateLimitKey = `claim_${authorAddress}`
    if (isRateLimited(rateLimitKey)) {
      return createErrorResponse(
        'RATE_LIMITED',
        'Too many claim requests. Please try again later.',
        { retryAfter: 3600 },
        429,
        requestId
      )
    }
    
    // Convert expectedAmount if provided
    const expectedAmountBigInt = expectedAmount ? BigInt(expectedAmount) : undefined
    
    console.log(`🔍 [${requestId}] Processing claim for chapter ${chapterId} by ${authorAddress}`)
    
    // Initialize services
    const storyProtocolService = new AdvancedStoryProtocolService()
    
    // Step 1: Get claimable royalties from blockchain
    console.log(`🔗 [${requestId}] Checking claimable royalties on blockchain`)
    const claimableResult = await storyProtocolService.getClaimableRoyalties(chapterId)
    
    if (!claimableResult.success) {
      console.error(`❌ [${requestId}] Failed to check claimable royalties:`, claimableResult.error)
      const categorizedError = categorizeBlockchainError(new Error(claimableResult.error || 'Unknown blockchain error'))
      
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
    
    // Validate claimable amount
    if (claimableResult.claimableAmount <= 0) {
      return createErrorResponse(
        'NO_CLAIMABLE_ROYALTIES',
        'No royalties available for claiming',
        { 
          chapterId,
          claimableAmount: claimableResult.claimableAmount.toString(),
          lastChecked: claimableResult.timestamp
        },
        400,
        requestId
      )
    }
    
    // Step 2: Process the claim through blockchain
    console.log(`💰 [${requestId}] Claiming royalties: ${claimableResult.claimableAmount.toString()}`)
    const claimResult = await storyProtocolService.claimChapterRoyalties(
      chapterId,
      authorAddress
    )
    
    if (!claimResult.success) {
      console.error(`❌ [${requestId}] Blockchain claim failed:`, claimResult.error)
      
      // Increment rate limit counter for failed attempts
      incrementRateLimit(rateLimitKey)
      
      const categorizedError = categorizeBlockchainError(new Error(claimResult.error || 'Claim failed'))
      
      return createErrorResponse(
        'CLAIM_FAILED',
        'Royalty claim transaction failed',
        {
          blockchainError: claimResult.error,
          category: categorizedError.category,
          troubleshooting: categorizedError.troubleshooting,
          retryRecommended: categorizedError.retryable
        },
        500,
        requestId
      )
    }
    
    // Step 3: Process through RoyaltyService for business logic
    console.log(`📊 [${requestId}] Processing through RoyaltyService`)
    const royaltyClaimRequest: RoyaltyClaimRequest = {
      chapterId,
      authorAddress,
      licenseTermsId,
      expectedAmount: claimResult.claimedAmount
    }
    
    const businessResult = await royaltyService.processRoyaltyClaim(royaltyClaimRequest)
    
    if (!businessResult.success) {
      console.error(`❌ [${requestId}] RoyaltyService processing failed:`, businessResult.error)
      
      return createErrorResponse(
        'BUSINESS_LOGIC_ERROR',
        'Failed to process royalty claim',
        { 
          businessError: businessResult.error,
          blockchainSuccess: true,
          transactionHash: claimResult.transactionHash
        },
        500,
        requestId
      )
    }
    
    // Step 4: Prepare successful response
    const response: RoyaltyClaimResponse = {
      success: true,
      chapterId,
      authorAddress,
      claimedAmount: businessResult.claimedAmount.toString(),
      platformFee: businessResult.platformFee.toString(),
      netAmount: businessResult.netAmount.toString(),
      transactionHash: claimResult.transactionHash,
      gasUsed: claimResult.gasUsed?.toString(),
      gasFee: claimResult.gasFee?.toString(),
      timestamp: businessResult.timestamp.toISOString()
    }
    
    console.log(`✅ [${requestId}] Royalty claim completed successfully:`, {
      chapterId,
      authorAddress,
      netAmount: businessResult.netAmount.toString(),
      transactionHash: claimResult.transactionHash
    })
    
    // Increment rate limit counter for successful attempts
    incrementRateLimit(rateLimitKey)
    
    return createSuccessResponse(response, requestId)
    
  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error in royalty claim:`, error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred during royalty claiming',
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
 * Validate royalty claim request parameters
 */
function validateClaimRequest(body: any): string[] {
  const errors: string[] = []
  
  if (!body.chapterId || typeof body.chapterId !== 'string') {
    errors.push('chapterId is required and must be a string')
  }
  
  if (!body.authorAddress || typeof body.authorAddress !== 'string') {
    errors.push('authorAddress is required and must be a string')
  } else if (!isAddress(body.authorAddress)) {
    errors.push('authorAddress must be a valid Ethereum address')
  }
  
  if (body.licenseTermsId && typeof body.licenseTermsId !== 'string') {
    errors.push('licenseTermsId must be a string if provided')
  }
  
  if (body.expectedAmount) {
    try {
      BigInt(body.expectedAmount)
    } catch {
      errors.push('expectedAmount must be a valid bigint string if provided')
    }
  }
  
  return errors
}

/**
 * Check if request is rate limited
 */
function isRateLimited(key: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(key)
  
  if (!limit || now > limit.resetTime) {
    return false
  }
  
  return limit.count >= RATE_LIMIT
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit(key: string): void {
  const now = Date.now()
  const limit = rateLimitMap.get(key)
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
  } else {
    limit.count++
  }
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