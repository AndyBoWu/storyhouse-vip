/**
 * @fileoverview TIP Token Economics Integration
 * 
 * Integrates royalty distribution with existing StoryHouse TIP token economics,
 * including unlock prices, read rewards, and platform revenue sharing.
 */

import { formatEther, parseEther } from 'viem'
import type { 
  RoyaltyEconomics,
  RevenueBreakdown,
  LicenseTier,
  RoyaltyCalculationInput,
  RoyaltyCalculationOutput
} from '../types/royalty'
import { ECONOMIC_CONSTANTS, calculateRoyaltyBreakdown } from './royaltyCalculations'

// Economic configuration that integrates with existing TIP token system
export const TIP_ECONOMICS_CONFIG = {
  // Base TIP token economics (from existing system)
  baseUnlockPrices: {
    free: parseEther('0'), // Free content
    premium: parseEther('0.01'), // 0.01 TIP per chapter
    exclusive: parseEther('0.05') // 0.05 TIP per chapter
  },
  
  baseReadRewards: {
    free: parseEther('0.005'), // 0.005 TIP per read (higher for free to encourage engagement)
    premium: parseEther('0.01'), // 0.01 TIP per read
    exclusive: parseEther('0.02') // 0.02 TIP per read (premium content = premium rewards)
  },
  
  // Platform economics
  platformRevenue: {
    unlockFeePercentage: 10, // 10% of unlock fees go to platform
    readRewardFeePercentage: 5, // 5% of read reward pool funding
    royaltyPlatformFee: 5, // 5% of royalty claims
    subscriptionFeePercentage: 15 // 15% of subscription fees
  },
  
  // Economic thresholds
  thresholds: {
    minimumViableRevenue: parseEther('0.01'), // 0.01 TIP minimum for claiming
    optimalClaimThreshold: parseEther('0.1'), // 0.1 TIP optimal for gas efficiency
    largePaymentThreshold: parseEther('1'), // 1 TIP triggers special notifications
    monthlyRevenueTarget: parseEther('10'), // 10 TIP monthly target per chapter
    annualRevenueGoal: parseEther('120') // 120 TIP annual goal per chapter
  },
  
  // Growth projections
  projections: {
    userGrowthRate: 0.15, // 15% monthly user growth assumption
    engagementGrowthRate: 0.10, // 10% monthly engagement growth
    priceAppreciationRate: 0.05, // 5% monthly TIP token value growth
    churnRate: 0.02 // 2% monthly user churn
  }
} as const

/**
 * Comprehensive economic analysis for TIP token integration
 */
export class TIPTokenEconomicsService {
  
  /**
   * Calculate comprehensive chapter economics including all revenue streams
   */
  calculateChapterEconomics(
    licenseTier: LicenseTier,
    monthlyReads: number = 100,
    monthlyUnlocks: number = 50
  ): {
    revenue: {
      unlockRevenue: bigint
      readRewardCosts: bigint
      netUnlockRevenue: bigint
      projectedRoyalties: bigint
      platformFees: bigint
      authorNetIncome: bigint
    }
    breakdown: RevenueBreakdown
    projections: {
      monthly: bigint
      quarterly: bigint
      annual: bigint
    }
    metrics: {
      revenuePerRead: bigint
      revenuePerUnlock: bigint
      platformMargin: number
      authorMargin: number
      roiEstimate: number
    }
  } {
    const config = TIP_ECONOMICS_CONFIG
    
    // Calculate base revenue streams
    const unlockPrice = config.baseUnlockPrices[licenseTier]
    const readReward = config.baseReadRewards[licenseTier]
    
    // Monthly revenue calculation
    const unlockRevenue = unlockPrice * BigInt(monthlyUnlocks)
    const readRewardCosts = readReward * BigInt(monthlyReads)
    const netUnlockRevenue = unlockRevenue - readRewardCosts
    
    // Platform fees from unlock revenue
    const unlockPlatformFee = (unlockRevenue * BigInt(config.platformRevenue.unlockFeePercentage)) / BigInt(100)
    
    // Calculate royalties using existing system
    const royaltyCalculation = calculateRoyaltyBreakdown({
      totalRevenue: netUnlockRevenue,
      licenseTier,
      includeGasFees: true,
      includePlatformFees: true
    })
    
    // Author net income after all fees
    const authorNetIncome = royaltyCalculation.netAmount
    
    // Total platform fees
    const totalPlatformFees = unlockPlatformFee + royaltyCalculation.platformFee
    
    // Create comprehensive breakdown
    const breakdown = this.calculateDetailedRevenueBreakdown(
      unlockRevenue,
      readRewardCosts,
      totalPlatformFees,
      authorNetIncome
    )
    
    // Calculate projections
    const monthlyNet = authorNetIncome
    const quarterlyNet = monthlyNet * BigInt(3)
    const annualNet = monthlyNet * BigInt(12)
    
    // Calculate metrics
    const revenuePerRead = monthlyReads > 0 ? netUnlockRevenue / BigInt(monthlyReads) : BigInt(0)
    const revenuePerUnlock = monthlyUnlocks > 0 ? netUnlockRevenue / BigInt(monthlyUnlocks) : BigInt(0)
    const platformMargin = netUnlockRevenue > 0 ? Number((totalPlatformFees * BigInt(10000)) / netUnlockRevenue) / 100 : 0
    const authorMargin = netUnlockRevenue > 0 ? Number((authorNetIncome * BigInt(10000)) / netUnlockRevenue) / 100 : 0
    
    // ROI estimate (assuming 0.1 TIP creation cost)
    const creationCost = parseEther('0.1')
    const roiEstimate = creationCost > 0 ? Number((annualNet * BigInt(100)) / creationCost) / 100 : 0
    
    return {
      revenue: {
        unlockRevenue,
        readRewardCosts,
        netUnlockRevenue,
        projectedRoyalties: royaltyCalculation.royaltyAmount,
        platformFees: totalPlatformFees,
        authorNetIncome
      },
      breakdown,
      projections: {
        monthly: monthlyNet,
        quarterly: quarterlyNet,
        annual: annualNet
      },
      metrics: {
        revenuePerRead,
        revenuePerUnlock,
        platformMargin,
        authorMargin,
        roiEstimate
      }
    }
  }
  
  /**
   * Calculate optimal license tier for maximum revenue
   */
  calculateOptimalLicenseTier(
    expectedMonthlyReads: number,
    expectedMonthlyUnlocks: number,
    authorRiskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): {
    recommendation: LicenseTier
    reasoning: string[]
    comparison: Record<LicenseTier, {
      tier: LicenseTier
      monthlyIncome: bigint
      monthlyIncomeFormatted: string
      annualProjection: bigint
      annualProjectionFormatted: string
      riskLevel: 'low' | 'medium' | 'high'
      confidence: number
    }>
  } {
    const tiers: LicenseTier[] = ['free', 'premium', 'exclusive']
    const comparison: any = {}
    
    // Calculate economics for each tier
    for (const tier of tiers) {
      const economics = this.calculateChapterEconomics(tier, expectedMonthlyReads, expectedMonthlyUnlocks)
      
      comparison[tier] = {
        tier,
        monthlyIncome: economics.revenue.authorNetIncome,
        monthlyIncomeFormatted: formatEther(economics.revenue.authorNetIncome),
        annualProjection: economics.projections.annual,
        annualProjectionFormatted: formatEther(economics.projections.annual),
        riskLevel: tier === 'free' ? 'low' : tier === 'premium' ? 'medium' : 'high',
        confidence: this.calculateConfidenceScore(tier, expectedMonthlyReads, expectedMonthlyUnlocks)
      }
    }
    
    // Determine recommendation based on risk tolerance and income potential
    let recommendation: LicenseTier
    const reasoning: string[] = []
    
    if (authorRiskTolerance === 'low') {
      // Conservative approach - prioritize audience building
      if (expectedMonthlyReads > 200) {
        recommendation = 'premium'
        reasoning.push('High readership suggests premium monetization potential')
        reasoning.push('Premium tier balances revenue with accessibility')
      } else {
        recommendation = 'free'
        reasoning.push('Building audience is priority for new content')
        reasoning.push('Free tier maximizes reach and engagement')
      }
    } else if (authorRiskTolerance === 'high') {
      // Aggressive approach - maximize revenue
      if (comparison.exclusive.monthlyIncome > comparison.premium.monthlyIncome * BigInt(2)) {
        recommendation = 'exclusive'
        reasoning.push('Exclusive tier provides significantly higher returns')
        reasoning.push('High-value content suitable for premium pricing')
      } else {
        recommendation = 'premium'
        reasoning.push('Premium tier offers best risk-adjusted returns')
      }
    } else {
      // Balanced approach
      const premiumIncome = comparison.premium.monthlyIncome
      const exclusiveIncome = comparison.exclusive.monthlyIncome
      
      if (exclusiveIncome > premiumIncome && expectedMonthlyReads > 100) {
        recommendation = 'exclusive'
        reasoning.push('Exclusive tier justified by high engagement levels')
        reasoning.push('Premium content commands premium pricing')
      } else if (premiumIncome > BigInt(0)) {
        recommendation = 'premium'
        reasoning.push('Premium tier provides consistent revenue stream')
        reasoning.push('Balanced approach to monetization and accessibility')
      } else {
        recommendation = 'free'
        reasoning.push('Focus on audience building before monetization')
        reasoning.push('Free tier enables rapid growth and engagement')
      }
    }
    
    return {
      recommendation,
      reasoning,
      comparison
    }
  }
  
  /**
   * Calculate platform revenue sharing impact
   */
  calculatePlatformRevenueImpact(
    totalChapterRevenue: bigint,
    licenseTier: LicenseTier
  ): {
    totalRevenue: bigint
    platformRevenue: bigint
    authorRevenue: bigint
    readerRewards: bigint
    breakdown: {
      unlockFees: bigint
      royaltyFees: bigint
      readRewardFunding: bigint
      operationalCosts: bigint
    }
    impactAnalysis: {
      platformMargin: number
      authorMargin: number
      readerBenefit: number
      sustainabilityScore: number
    }
  } {
    const config = TIP_ECONOMICS_CONFIG
    
    // Calculate different fee components
    const unlockFees = (totalChapterRevenue * BigInt(config.platformRevenue.unlockFeePercentage)) / BigInt(100)
    const royaltyFees = (totalChapterRevenue * BigInt(config.platformRevenue.royaltyPlatformFee)) / BigInt(100)
    const readRewardFunding = (totalChapterRevenue * BigInt(config.platformRevenue.readRewardFeePercentage)) / BigInt(100)
    
    // Estimate operational costs (infrastructure, development, support)
    const operationalCosts = (totalChapterRevenue * BigInt(5)) / BigInt(100) // 5% operational overhead
    
    // Calculate distributions
    const totalPlatformRevenue = unlockFees + royaltyFees + operationalCosts
    const readerRewards = readRewardFunding
    const authorRevenue = totalChapterRevenue - totalPlatformRevenue - readerRewards
    
    // Calculate impact metrics
    const platformMargin = totalChapterRevenue > 0 ? Number((totalPlatformRevenue * BigInt(10000)) / totalChapterRevenue) / 100 : 0
    const authorMargin = totalChapterRevenue > 0 ? Number((authorRevenue * BigInt(10000)) / totalChapterRevenue) / 100 : 0
    const readerBenefit = totalChapterRevenue > 0 ? Number((readerRewards * BigInt(10000)) / totalChapterRevenue) / 100 : 0
    
    // Sustainability score (balance between all stakeholders)
    const sustainabilityScore = this.calculateSustainabilityScore(platformMargin, authorMargin, readerBenefit)
    
    return {
      totalRevenue: totalChapterRevenue,
      platformRevenue: totalPlatformRevenue,
      authorRevenue,
      readerRewards,
      breakdown: {
        unlockFees,
        royaltyFees,
        readRewardFunding,
        operationalCosts
      },
      impactAnalysis: {
        platformMargin,
        authorMargin,
        readerBenefit,
        sustainabilityScore
      }
    }
  }
  
  /**
   * Generate economic forecast with growth projections
   */
  generateEconomicForecast(
    currentMetrics: {
      monthlyReads: number
      monthlyUnlocks: number
      currentRevenue: bigint
      licenseTier: LicenseTier
    },
    forecastPeriodMonths: number = 12
  ): {
    forecast: Array<{
      month: number
      projectedReads: number
      projectedUnlocks: number
      projectedRevenue: bigint
      projectedRoyalties: bigint
      cumulativeRevenue: bigint
    }>
    summary: {
      totalProjectedRevenue: bigint
      totalProjectedRoyalties: bigint
      averageMonthlyGrowth: number
      confidenceInterval: { low: bigint; high: bigint }
    }
  } {
    const { userGrowthRate, engagementGrowthRate } = TIP_ECONOMICS_CONFIG.projections
    const forecast = []
    let cumulativeRevenue = BigInt(0)
    
    for (let month = 1; month <= forecastPeriodMonths; month++) {
      // Apply growth rates with some randomness for realism
      const growthVariation = 0.9 + Math.random() * 0.2 // ±10% variation
      const readGrowth = Math.pow(1 + engagementGrowthRate * growthVariation, month)
      const unlockGrowth = Math.pow(1 + userGrowthRate * growthVariation, month)
      
      const projectedReads = Math.round(currentMetrics.monthlyReads * readGrowth)
      const projectedUnlocks = Math.round(currentMetrics.monthlyUnlocks * unlockGrowth)
      
      // Calculate revenue for this month
      const monthEconomics = this.calculateChapterEconomics(
        currentMetrics.licenseTier,
        projectedReads,
        projectedUnlocks
      )
      
      const projectedRevenue = monthEconomics.revenue.netUnlockRevenue
      const projectedRoyalties = monthEconomics.revenue.authorNetIncome
      cumulativeRevenue += projectedRevenue
      
      forecast.push({
        month,
        projectedReads,
        projectedUnlocks,
        projectedRevenue,
        projectedRoyalties,
        cumulativeRevenue
      })
    }
    
    // Calculate summary statistics
    const totalProjectedRevenue = cumulativeRevenue
    const totalProjectedRoyalties = forecast.reduce((sum, f) => sum + f.projectedRoyalties, BigInt(0))
    const averageMonthlyGrowth = forecast.length > 1 
      ? ((forecast[forecast.length - 1].projectedRevenue / forecast[0].projectedRevenue) - BigInt(1)) / BigInt(forecast.length - 1)
      : BigInt(0)
    
    // Confidence interval (±20% based on market volatility)
    const confidenceInterval = {
      low: (totalProjectedRevenue * BigInt(80)) / BigInt(100),
      high: (totalProjectedRevenue * BigInt(120)) / BigInt(100)
    }
    
    return {
      forecast,
      summary: {
        totalProjectedRevenue,
        totalProjectedRoyalties,
        averageMonthlyGrowth: Number(averageMonthlyGrowth),
        confidenceInterval
      }
    }
  }
  
  // Private helper methods
  
  private calculateDetailedRevenueBreakdown(
    unlockRevenue: bigint,
    readRewardCosts: bigint,
    platformFees: bigint,
    authorRevenue: bigint
  ): RevenueBreakdown {
    const totalRevenue = unlockRevenue
    const remainingAmount = totalRevenue - platformFees - readRewardCosts - authorRevenue
    
    return {
      totalRevenue,
      creatorRoyalty: authorRevenue,
      platformFee: platformFees,
      readerRewards: readRewardCosts,
      remainingAmount,
      breakdown: {
        creator: totalRevenue > 0 ? Number((authorRevenue * BigInt(10000)) / totalRevenue) / 100 : 0,
        platform: totalRevenue > 0 ? Number((platformFees * BigInt(10000)) / totalRevenue) / 100 : 0,
        readers: totalRevenue > 0 ? Number((readRewardCosts * BigInt(10000)) / totalRevenue) / 100 : 0,
        remaining: totalRevenue > 0 ? Number((remainingAmount * BigInt(10000)) / totalRevenue) / 100 : 0
      }
    }
  }
  
  private calculateConfidenceScore(
    tier: LicenseTier,
    expectedReads: number,
    expectedUnlocks: number
  ): number {
    // Base confidence scores
    const baseConfidence = { free: 0.9, premium: 0.7, exclusive: 0.5 }
    let confidence = baseConfidence[tier]
    
    // Adjust based on expected engagement
    if (expectedReads > 500) confidence += 0.1
    if (expectedUnlocks > 100) confidence += 0.1
    if (expectedReads / Math.max(expectedUnlocks, 1) > 5) confidence += 0.1 // High read-to-unlock ratio
    
    return Math.min(confidence, 1.0)
  }
  
  private calculateSustainabilityScore(
    platformMargin: number,
    authorMargin: number,
    readerBenefit: number
  ): number {
    // Ideal distribution: ~20% platform, ~70% author, ~10% readers
    const idealPlatform = 20
    const idealAuthor = 70
    const idealReader = 10
    
    const platformDeviation = Math.abs(platformMargin - idealPlatform) / idealPlatform
    const authorDeviation = Math.abs(authorMargin - idealAuthor) / idealAuthor
    const readerDeviation = Math.abs(readerBenefit - idealReader) / idealReader
    
    const averageDeviation = (platformDeviation + authorDeviation + readerDeviation) / 3
    const sustainabilityScore = Math.max(0, 1 - averageDeviation) * 100
    
    return Math.round(sustainabilityScore)
  }
}

// Export singleton instance
export const tipTokenEconomicsService = new TIPTokenEconomicsService()

export default tipTokenEconomicsService