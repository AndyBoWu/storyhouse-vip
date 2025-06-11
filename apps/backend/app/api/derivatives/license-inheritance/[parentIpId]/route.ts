import { NextRequest, NextResponse } from 'next/server'
import { derivativeRegistrationService } from '../../../../lib/services/derivativeRegistrationService'
import { Address } from 'viem'

// Enable BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }

export async function GET(
  request: NextRequest,
  { params }: { params: { parentIpId: string } }
) {
  try {
    const { parentIpId } = params
    console.log('🏷️ API: License inheritance analysis for parent IP:', parentIpId)

    if (!parentIpId) {
      return NextResponse.json({
        error: 'Parent IP ID is required'
      }, { status: 400 })
    }

    // Validate IP ID format
    if (parentIpId.length < 20) {
      return NextResponse.json({
        error: 'Invalid parent IP ID format'
      }, { status: 400 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const derivativeCreator = searchParams.get('derivativeCreator')

    if (!derivativeCreator) {
      return NextResponse.json({
        error: 'derivativeCreator parameter is required'
      }, { status: 400 })
    }

    // Validate creator address format
    if (derivativeCreator.length !== 42 || !derivativeCreator.startsWith('0x')) {
      return NextResponse.json({
        error: 'Invalid derivativeCreator address format'
      }, { status: 400 })
    }

    console.log('👤 Analyzing inheritance for creator:', derivativeCreator)

    try {
      // Analyze license inheritance
      const inheritanceInfo = await derivativeRegistrationService.analyzeLicenseInheritance(
        parentIpId,
        derivativeCreator as Address
      )

      console.log('✅ License inheritance analysis complete:', {
        parentLicenseTermsId: inheritanceInfo.parentLicenseTermsId,
        canInherit: inheritanceInfo.canInherit,
        parentTier: inheritanceInfo.parentLicenseTier
      })

      // Calculate additional inheritance insights
      const inheritanceInsights = generateInheritanceInsights(inheritanceInfo)

      return NextResponse.json({
        success: true,
        parentIpId,
        derivativeCreator,
        inheritanceInfo,
        insights: inheritanceInsights,
        recommendations: generateInheritanceRecommendations(inheritanceInfo),
        metadata: {
          analysisTime: new Date().toISOString(),
          parentLicenseTier: inheritanceInfo.parentLicenseTier,
          inheritanceEligible: inheritanceInfo.canInherit
        }
      })

    } catch (analysisError) {
      console.error('❌ License inheritance analysis failed:', analysisError)
      
      let errorMessage = 'Failed to analyze license inheritance'
      let statusCode = 500
      
      if (analysisError instanceof Error) {
        if (analysisError.message.includes('not found')) {
          errorMessage = 'Parent IP license information not found'
          statusCode = 404
        } else if (analysisError.message.includes('unauthorized')) {
          errorMessage = 'Insufficient permissions to analyze this IP license'
          statusCode = 403
        } else if (analysisError.message.includes('license')) {
          errorMessage = 'Parent IP license terms are invalid or corrupted'
          statusCode = 400
        } else {
          errorMessage = analysisError.message
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        parentIpId,
        derivativeCreator,
        troubleshooting: {
          'License not found': 'Verify parent IP has valid license terms attached',
          'Permission denied': 'Check if derivative creator has proper access rights',
          'Invalid license': 'Parent IP license may be corrupted or unsupported',
          'Network issues': 'Verify connection to Story Protocol network'
        }
      }, { status: statusCode })
    }

  } catch (error) {
    console.error('❌ License inheritance API error:', error)
    return NextResponse.json({
      error: 'Failed to process license inheritance request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { parentIpId: string } }
) {
  try {
    const { parentIpId } = params
    const body = await request.json()
    
    console.log('🏷️ API: Detailed license inheritance analysis for parent IP:', parentIpId)

    const {
      derivativeCreator,
      derivativeContent,
      derivativeType,
      intendedUse = 'commercial', // 'commercial', 'non-commercial', 'educational'
      targetAudience = 'general',  // 'general', 'adult', 'children'
      distributionChannels = ['digital'] // ['digital', 'print', 'audio', 'video']
    } = body

    if (!derivativeCreator || !derivativeContent) {
      return NextResponse.json({
        error: 'derivativeCreator and derivativeContent are required'
      }, { status: 400 })
    }

    console.log('📋 Detailed analysis parameters:', {
      derivativeCreator,
      derivativeType,
      intendedUse,
      targetAudience,
      distributionChannels
    })

    try {
      // Get basic inheritance info
      const inheritanceInfo = await derivativeRegistrationService.analyzeLicenseInheritance(
        parentIpId,
        derivativeCreator as Address
      )

      // Perform detailed compatibility analysis
      const compatibilityAnalysis = analyzeDerivativeCompatibility(
        inheritanceInfo,
        {
          derivativeContent,
          derivativeType,
          intendedUse,
          targetAudience,
          distributionChannels
        }
      )

      // Calculate economic projections
      const economicProjections = calculateDetailedEconomics(
        inheritanceInfo,
        derivativeContent,
        intendedUse
      )

      // Generate detailed recommendations
      const detailedRecommendations = generateDetailedRecommendations(
        inheritanceInfo,
        compatibilityAnalysis,
        economicProjections
      )

      return NextResponse.json({
        success: true,
        parentIpId,
        derivativeCreator,
        inheritanceInfo,
        compatibilityAnalysis,
        economicProjections,
        recommendations: detailedRecommendations,
        metadata: {
          analysisTime: new Date().toISOString(),
          analysisType: 'detailed',
          intendedUse,
          targetAudience,
          distributionChannels
        }
      })

    } catch (detailedAnalysisError) {
      console.error('❌ Detailed license inheritance analysis failed:', detailedAnalysisError)
      return NextResponse.json({
        error: detailedAnalysisError instanceof Error ? detailedAnalysisError.message : 'Detailed analysis failed',
        parentIpId,
        derivativeCreator
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Detailed license inheritance API error:', error)
    return NextResponse.json({
      error: 'Failed to process detailed license inheritance request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Generate inheritance insights from analysis results
 */
function generateInheritanceInsights(inheritanceInfo: any) {
  const insights = []

  if (inheritanceInfo.canInherit) {
    insights.push({
      type: 'positive',
      title: 'License Inheritance Available',
      description: `You can inherit the ${inheritanceInfo.parentLicenseTier} license terms from the parent IP`,
      impact: 'Simplified licensing process and automatic compliance'
    })

    if (inheritanceInfo.economicImplications.parentRoyaltyPercentage > 0) {
      insights.push({
        type: 'economic',
        title: 'Royalty Sharing Required',
        description: `${inheritanceInfo.economicImplications.parentRoyaltyPercentage}% of derivative revenue will go to original creator`,
        impact: `Your share: ${inheritanceInfo.economicImplications.derivativeRoyaltyShare}%`
      })
    }
  } else {
    insights.push({
      type: 'warning',
      title: 'License Inheritance Not Available',
      description: 'You will need to create custom license terms for this derivative',
      impact: 'Additional licensing setup required'
    })

    if (inheritanceInfo.suggestedLicenseTermsId) {
      insights.push({
        type: 'suggestion',
        title: 'Alternative License Suggested',
        description: 'A compatible license alternative has been identified',
        impact: 'Use suggested license to maintain compatibility'
      })
    }
  }

  // Analyze inheritance conditions
  if (inheritanceInfo.inheritanceConditions.length > 0) {
    insights.push({
      type: 'requirements',
      title: 'Inheritance Conditions',
      description: `${inheritanceInfo.inheritanceConditions.length} conditions must be met`,
      impact: 'Review and comply with all conditions before proceeding'
    })
  }

  return insights
}

/**
 * Generate inheritance recommendations
 */
function generateInheritanceRecommendations(inheritanceInfo: any) {
  const recommendations = []

  if (inheritanceInfo.canInherit) {
    recommendations.push({
      priority: 'high',
      action: 'Inherit Parent License',
      reason: 'Simplifies licensing and ensures automatic compliance',
      steps: [
        'Use inheritParentLicense: true in registration',
        'Verify compliance with inheritance conditions',
        'Review economic implications before proceeding'
      ]
    })
  } else {
    recommendations.push({
      priority: 'high',
      action: 'Create Custom License',
      reason: 'Parent license cannot be inherited - custom terms required',
      steps: [
        'Review parent license restrictions',
        'Create compatible license terms',
        'Ensure derivative rights are properly granted'
      ]
    })
  }

  // Economic recommendations
  if (inheritanceInfo.economicImplications.parentRoyaltyPercentage > 15) {
    recommendations.push({
      priority: 'medium',
      action: 'Consider Revenue Impact',
      reason: `High royalty rate (${inheritanceInfo.economicImplications.parentRoyaltyPercentage}%) may impact profitability`,
      steps: [
        'Calculate break-even point for derivative',
        'Consider pricing strategy adjustments',
        'Evaluate alternative licensing options'
      ]
    })
  }

  // Condition-based recommendations
  if (inheritanceInfo.inheritanceConditions.includes('Attribution required')) {
    recommendations.push({
      priority: 'medium',
      action: 'Prepare Attribution Text',
      reason: 'Attribution is required for license inheritance',
      steps: [
        'Draft proper attribution text',
        'Include in derivative metadata',
        'Display prominently in derivative content'
      ]
    })
  }

  return recommendations
}

/**
 * Analyze derivative compatibility with parent license
 */
function analyzeDerivativeCompatibility(inheritanceInfo: any, derivativeParams: any) {
  const compatibility = {
    overall: 'compatible' as 'compatible' | 'conditional' | 'incompatible',
    issues: [] as string[],
    warnings: [] as string[],
    requirements: [] as string[]
  }

  // Check commercial use compatibility
  if (derivativeParams.intendedUse === 'commercial') {
    if (inheritanceInfo.parentLicenseTier === 'free') {
      compatibility.issues.push('Parent license does not allow commercial use')
      compatibility.overall = 'incompatible'
    } else {
      compatibility.requirements.push('Commercial use royalty payments required')
    }
  }

  // Check distribution channel compatibility
  if (derivativeParams.distributionChannels.includes('print') && 
      inheritanceInfo.parentLicenseTier === 'free') {
    compatibility.warnings.push('Print distribution may have restrictions under free license')
  }

  // Check audience compatibility
  if (derivativeParams.targetAudience === 'children') {
    compatibility.requirements.push('Additional content rating requirements for children\'s content')
  }

  return compatibility
}

/**
 * Calculate detailed economic projections
 */
function calculateDetailedEconomics(inheritanceInfo: any, derivativeContent: any, intendedUse: string) {
  const baseRevenue = estimateDerivativeRevenue(derivativeContent, intendedUse)
  const parentRoyalty = baseRevenue * (inheritanceInfo.economicImplications.parentRoyaltyPercentage / 100)
  const platformFee = baseRevenue * (inheritanceInfo.economicImplications.platformFee / 100)
  const netRevenue = baseRevenue - parentRoyalty - platformFee

  return {
    estimatedGrossRevenue: baseRevenue,
    parentRoyalty,
    platformFee,
    estimatedNetRevenue: netRevenue,
    profitMargin: (netRevenue / baseRevenue) * 100,
    breakEvenPoint: calculateBreakEven(derivativeContent, netRevenue),
    revenueProjection: {
      conservative: netRevenue * 0.7,
      expected: netRevenue,
      optimistic: netRevenue * 1.5
    }
  }
}

/**
 * Generate detailed recommendations based on all analyses
 */
function generateDetailedRecommendations(inheritanceInfo: any, compatibility: any, economics: any) {
  const recommendations = []

  // Compatibility-based recommendations
  if (compatibility.overall === 'incompatible') {
    recommendations.push({
      priority: 'critical',
      category: 'licensing',
      action: 'Resolve License Incompatibility',
      issue: compatibility.issues.join(', '),
      solution: 'Create custom license or change derivative parameters'
    })
  }

  // Economic recommendations
  if (economics.profitMargin < 30) {
    recommendations.push({
      priority: 'high',
      category: 'economics',
      action: 'Optimize Revenue Strategy',
      issue: `Low profit margin (${economics.profitMargin.toFixed(1)}%)`,
      solution: 'Consider adjusting pricing, reducing costs, or negotiating royalty rates'
    })
  }

  // Success optimization
  if (economics.profitMargin > 50) {
    recommendations.push({
      priority: 'low',
      category: 'optimization',
      action: 'Maximize Success Potential',
      opportunity: 'High profit margin indicates strong opportunity',
      solution: 'Consider increased marketing investment or premium positioning'
    })
  }

  return recommendations
}

/**
 * Estimate derivative revenue based on content and intended use
 */
function estimateDerivativeRevenue(derivativeContent: any, intendedUse: string): number {
  const baseRevenue = derivativeContent.metadata?.qualityScore || 50
  const useMultiplier = intendedUse === 'commercial' ? 2 : intendedUse === 'educational' ? 0.5 : 1
  return baseRevenue * useMultiplier * 10 // Simple estimation
}

/**
 * Calculate break-even point for derivative
 */
function calculateBreakEven(derivativeContent: any, netRevenue: number): number {
  const estimatedCosts = 100 // Simplified cost estimation
  return Math.ceil(estimatedCosts / Math.max(netRevenue / 100, 1)) // Break-even in units
}