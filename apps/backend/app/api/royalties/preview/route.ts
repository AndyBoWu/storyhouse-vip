/**
 * @fileoverview GET /api/royalties/preview - Royalty Preview and Calculation Tools Endpoint
 * 
 * Provides comprehensive royalty calculations, projections, and optimization
 * recommendations without executing any blockchain transactions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Address, isAddress, parseEther, formatEther } from 'viem'
import { royaltyService } from '../../../../lib/services/royaltyService'
import { generateRoyaltyPreview, compareLicenseTiers, calculateRoyaltyBreakdown } from '../../../../lib/utils/royaltyCalculations'
import { tipTokenEconomicsService } from '../../../../lib/utils/tipTokenEconomics'
import type { 
  RoyaltyPreview,
  LicenseTier,
  RoyaltyAPIResponse,
  LicenseTierComparison,
  RoyaltyCalculationOutput
} from '../../../../lib/types/royalty'
import type { ChapterEconomicsAnalysis, LicenseTierOptimization } from '../../../../lib/types/economics'

// Response interface for preview endpoint
interface RoyaltyPreviewResponse {
  preview: RoyaltyPreview
  calculation: RoyaltyCalculationOutput
  tierComparison: LicenseTierComparison
  economicsAnalysis: ChapterEconomicsAnalysis
  optimization: LicenseTierOptimization
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

/**
 * GET /api/royalties/preview?chapterId=xxx&authorAddress=0x...&licenseTier=premium&currentRevenue=1000000000000000000&monthlyReads=100&monthlyUnlocks=50&includeOptimization=true
 * Generate comprehensive royalty preview and calculations
 */
export async function GET(request: NextRequest) {
  const requestId = `preview_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse required parameters
    const chapterId = searchParams.get('chapterId')
    const authorAddress = searchParams.get('authorAddress') as Address
    const licenseTier = searchParams.get('licenseTier') as LicenseTier
    const currentRevenueStr = searchParams.get('currentRevenue') // in wei
    
    // Parse optional parameters
    const monthlyReads = parseInt(searchParams.get('monthlyReads') || '100')
    const monthlyUnlocks = parseInt(searchParams.get('monthlyUnlocks') || '50')
    const includeOptimization = searchParams.get('includeOptimization') === 'true'
    const includeEconomics = searchParams.get('includeEconomics') === 'true'
    const forecastMonths = parseInt(searchParams.get('forecastMonths') || '12')
    const riskTolerance = (searchParams.get('riskTolerance') || 'medium') as 'low' | 'medium' | 'high'
    
    console.log(`🔮 [${requestId}] Generating royalty preview:`, {
      chapterId,
      authorAddress,
      licenseTier,
      currentRevenue: currentRevenueStr,
      monthlyReads,
      monthlyUnlocks
    })
    
    // Validation
    const validationErrors = validatePreviewRequest({
      chapterId,
      authorAddress,
      licenseTier,
      currentRevenueStr,
      monthlyReads,
      monthlyUnlocks
    })
    
    if (validationErrors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request parameters',
        { errors: validationErrors },
        400,
        requestId
      )
    }
    
    // Parse revenue amount
    const currentRevenue = currentRevenueStr ? BigInt(currentRevenueStr) : parseEther('0.1') // Default 0.1 ETH
    
    console.log(`📊 [${requestId}] Calculating preview for ${formatEther(currentRevenue)} ETH revenue`)
    
    // 1. Generate basic royalty preview
    const preview = generateRoyaltyPreview(
      chapterId!,
      authorAddress,
      licenseTier,
      currentRevenue
    )
    
    // 2. Calculate detailed breakdown
    const calculation = calculateRoyaltyBreakdown({
      totalRevenue: currentRevenue,
      licenseTier,
      includeGasFees: true,
      includePlatformFees: true
    })
    
    // 3. Compare license tiers
    const tierComparison = compareLicenseTiers(
      chapterId!,
      licenseTier,
      currentRevenue
    )
    
    // 4. Generate economics analysis if requested
    let economicsAnalysis: ChapterEconomicsAnalysis | undefined
    if (includeEconomics) {
      console.log(`💰 [${requestId}] Generating economics analysis`)
      const economics = tipTokenEconomicsService.calculateChapterEconomics(
        licenseTier,
        monthlyReads,
        monthlyUnlocks
      )
      
      economicsAnalysis = {
        chapterId: chapterId!,
        licenseTier,
        timeframe: 'monthly',
        revenue: {
          unlockRevenue: economics.revenue.unlockRevenue,
          unlockRevenueFormatted: formatEther(economics.revenue.unlockRevenue),
          readRewardCosts: economics.revenue.readRewardCosts,
          readRewardCostsFormatted: formatEther(economics.revenue.readRewardCosts),
          netUnlockRevenue: economics.revenue.netUnlockRevenue,
          netUnlockRevenueFormatted: formatEther(economics.revenue.netUnlockRevenue),
          projectedRoyalties: economics.revenue.projectedRoyalties,
          projectedRoyaltiesFormatted: formatEther(economics.revenue.projectedRoyalties),
          platformFees: economics.revenue.platformFees,
          platformFeesFormatted: formatEther(economics.revenue.platformFees),
          authorNetIncome: economics.revenue.authorNetIncome,
          authorNetIncomeFormatted: formatEther(economics.revenue.authorNetIncome)
        },
        breakdown: {
          totalRevenue: economics.breakdown.totalRevenue,
          creatorShare: economics.breakdown.creatorRoyalty,
          platformShare: economics.breakdown.platformFee,
          readerRewards: economics.breakdown.readerRewards,
          percentages: {
            creatorPercentage: economics.breakdown.breakdown.creator,
            platformPercentage: economics.breakdown.breakdown.platform,
            readerPercentage: economics.breakdown.breakdown.readers
          }
        },
        projections: {
          monthly: economics.projections.monthly,
          monthlyFormatted: formatEther(economics.projections.monthly),
          quarterly: economics.projections.quarterly,
          quarterlyFormatted: formatEther(economics.projections.quarterly),
          annual: economics.projections.annual,
          annualFormatted: formatEther(economics.projections.annual)
        },
        metrics: {
          revenuePerRead: economics.metrics.revenuePerRead,
          revenuePerReadFormatted: formatEther(economics.metrics.revenuePerRead),
          revenuePerUnlock: economics.metrics.revenuePerUnlock,
          revenuePerUnlockFormatted: formatEther(economics.metrics.revenuePerUnlock),
          platformMargin: economics.metrics.platformMargin,
          authorMargin: economics.metrics.authorMargin,
          roiEstimate: economics.metrics.roiEstimate,
          paybackPeriodMonths: economics.metrics.roiEstimate > 0 ? 12 / economics.metrics.roiEstimate : 0
        },
        calculatedAt: new Date()
      }
    }
    
    // 5. Generate optimization recommendations if requested
    let optimization: LicenseTierOptimization | undefined
    if (includeOptimization) {
      console.log(`🎯 [${requestId}] Generating optimization recommendations`)
      const optimalTier = tipTokenEconomicsService.calculateOptimalLicenseTier(
        monthlyReads,
        monthlyUnlocks,
        riskTolerance
      )
      
      optimization = {
        chapterId: chapterId!,
        currentTier: licenseTier,
        expectedMetrics: {
          monthlyReads,
          monthlyUnlocks,
          userGrowthRate: 0.15 // 15% assumed growth
        },
        recommendation: {
          suggestedTier: optimalTier.recommendation,
          confidence: 0.8, // 80% confidence
          reasoning: optimalTier.reasoning,
          expectedImpact: {
            revenueIncrease: BigInt(0), // Calculate based on comparison
            revenueIncreaseFormatted: '0',
            revenueIncreasePercentage: 0,
            riskLevel: optimalTier.comparison[optimalTier.recommendation].riskLevel
          }
        },
        comparison: optimalTier.comparison,
        authorRiskProfile: {
          tolerance: riskTolerance,
          preferences: getRiskPreferences(riskTolerance),
          constraints: getRiskConstraints(riskTolerance)
        },
        marketConditions: {
          competitiveAnalysis: [
            'Premium content market showing 15% growth',
            'Increased demand for exclusive access models',
            'Reader willingness to pay for quality content rising'
          ],
          trendsImpact: [
            'Micropayments gaining mainstream adoption',
            'Creator economy expansion',
            'Decentralized content monetization trending'
          ],
          seasonalFactors: [
            'Higher engagement during holiday seasons',
            'Summer reading peak periods',
            'Back-to-school content consumption spikes'
          ]
        },
        calculatedAt: new Date()
      }
      
      // Calculate revenue impact
      const currentTierEconomics = tierComparison.tiers[licenseTier]
      const suggestedTierEconomics = tierComparison.tiers[optimalTier.recommendation]
      const revenueIncrease = suggestedTierEconomics.netRoyalty - currentTierEconomics.netRoyalty
      
      optimization.recommendation.expectedImpact = {
        revenueIncrease,
        revenueIncreaseFormatted: formatEther(revenueIncrease),
        revenueIncreasePercentage: currentTierEconomics.netRoyalty > 0 
          ? Number((revenueIncrease * BigInt(10000)) / currentTierEconomics.netRoyalty) / 100
          : 0,
        riskLevel: optimalTier.comparison[optimalTier.recommendation].riskLevel
      }
    }
    
    // 6. Generate recommendations
    const recommendations = generateRecommendations(preview, tierComparison, economicsAnalysis, optimization)
    
    // Prepare response
    const response: RoyaltyPreviewResponse = {
      preview,
      calculation,
      tierComparison,
      economicsAnalysis: economicsAnalysis!,
      optimization: optimization!,
      recommendations
    }
    
    console.log(`✅ [${requestId}] Preview generated successfully:`, {
      chapterId,
      recommendedAction: preview.recommendedAction,
      suggestedTier: optimization?.recommendation.suggestedTier,
      projectedIncome: economicsAnalysis?.revenue.authorNetIncomeFormatted
    })
    
    return createSuccessResponse(response, requestId)
    
  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error generating royalty preview:`, error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while generating royalty preview',
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
 * Validate preview request parameters
 */
function validatePreviewRequest(params: {
  chapterId: string | null
  authorAddress: string | null
  licenseTier: string | null
  currentRevenueStr: string | null
  monthlyReads: number
  monthlyUnlocks: number
}): string[] {
  const errors: string[] = []
  
  if (!params.chapterId) {
    errors.push('chapterId is required')
  }
  
  if (!params.authorAddress) {
    errors.push('authorAddress is required')
  } else if (!isAddress(params.authorAddress)) {
    errors.push('authorAddress must be a valid Ethereum address')
  }
  
  if (!params.licenseTier) {
    errors.push('licenseTier is required')
  } else if (!['free', 'premium', 'exclusive'].includes(params.licenseTier)) {
    errors.push('licenseTier must be one of: free, premium, exclusive')
  }
  
  if (params.currentRevenueStr) {
    try {
      BigInt(params.currentRevenueStr)
    } catch {
      errors.push('currentRevenue must be a valid bigint string')
    }
  }
  
  if (params.monthlyReads < 0 || params.monthlyReads > 100000) {
    errors.push('monthlyReads must be between 0 and 100,000')
  }
  
  if (params.monthlyUnlocks < 0 || params.monthlyUnlocks > 10000) {
    errors.push('monthlyUnlocks must be between 0 and 10,000')
  }
  
  return errors
}

/**
 * Generate comprehensive recommendations based on analysis
 */
function generateRecommendations(
  preview: RoyaltyPreview,
  tierComparison: LicenseTierComparison,
  economicsAnalysis?: ChapterEconomicsAnalysis,
  optimization?: LicenseTierOptimization
): {
  immediate: string[]
  shortTerm: string[]
  longTerm: string[]
} {
  const immediate: string[] = []
  const shortTerm: string[] = []
  const longTerm: string[] = []
  
  // Immediate recommendations based on preview
  if (preview.recommendedAction === 'claim_now') {
    immediate.push('Claim available royalties now for optimal gas efficiency')
  } else if (preview.recommendedAction === 'wait_for_more') {
    immediate.push('Wait for more revenue to accumulate before claiming')
    immediate.push('Monitor claimable amount to reach optimal threshold')
  } else if (preview.recommendedAction === 'consider_tier_upgrade') {
    immediate.push('Consider upgrading license tier for better returns')
  }
  
  // Tier optimization recommendations
  if (tierComparison.recommendation.potentialIncrease > parseEther('0.01')) {
    immediate.push(`Consider switching to ${tierComparison.recommendation.suggestedTier} tier for ${tierComparison.recommendation.potentialIncreaseFormatted} TIP increase`)
  }
  
  // Short-term recommendations
  if (economicsAnalysis) {
    if (economicsAnalysis.metrics.authorMargin < 50) {
      shortTerm.push('Optimize pricing strategy to improve author margin')
    }
    
    if (economicsAnalysis.metrics.roiEstimate < 1) {
      shortTerm.push('Focus on increasing engagement to improve ROI')
      shortTerm.push('Consider content marketing to boost readership')
    }
    
    shortTerm.push('Track revenue trends monthly for optimization opportunities')
    shortTerm.push('Experiment with different content formats and pricing')
  }
  
  // Long-term recommendations
  if (optimization) {
    if (optimization.recommendation.expectedImpact.revenueIncreasePercentage > 50) {
      longTerm.push('Develop premium content strategy for sustainable growth')
    }
    
    longTerm.push('Build audience base for stable revenue streams')
    longTerm.push('Diversify content portfolio across multiple license tiers')
    longTerm.push('Consider creating series or collections for recurring revenue')
  }
  
  longTerm.push('Monitor market trends for strategic positioning')
  longTerm.push('Build community engagement for organic growth')
  
  return { immediate, shortTerm, longTerm }
}

/**
 * Get risk preferences based on tolerance level
 */
function getRiskPreferences(tolerance: 'low' | 'medium' | 'high'): string[] {
  const preferences = {
    low: [
      'Stable, predictable income streams',
      'Wide accessibility and audience reach',
      'Lower revenue variance',
      'Conservative growth strategies'
    ],
    medium: [
      'Balanced revenue and reach approach',
      'Moderate growth with calculated risks',
      'Diversified monetization strategies',
      'Adaptive pricing models'
    ],
    high: [
      'Maximum revenue optimization',
      'Premium positioning strategies',
      'Exclusive access models',
      'Aggressive growth tactics'
    ]
  }
  
  return preferences[tolerance]
}

/**
 * Get risk constraints based on tolerance level
 */
function getRiskConstraints(tolerance: 'low' | 'medium' | 'high'): string[] {
  const constraints = {
    low: [
      'Must maintain broad accessibility',
      'Avoid volatile pricing strategies',
      'Minimize audience segmentation',
      'Prefer proven monetization models'
    ],
    medium: [
      'Balance accessibility with profitability',
      'Gradual pricing adjustments only',
      'Monitor audience response carefully',
      'Test new strategies incrementally'
    ],
    high: [
      'Revenue optimization is priority',
      'Acceptable to limit audience size',
      'Willing to experiment with pricing',
      'Focus on high-value user segments'
    ]
  }
  
  return constraints[tolerance]
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
      version: '2.2.3',
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
      version: '2.2.3',
      requestId
    }
  }, { status })
}