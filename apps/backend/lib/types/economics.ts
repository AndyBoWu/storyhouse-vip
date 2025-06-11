/**
 * @fileoverview Economic Types for TIP Token Integration
 * 
 * Comprehensive type definitions for economic modeling, revenue projections,
 * and platform sustainability metrics in the TIP token ecosystem.
 */

import { Address } from 'viem'
import type { LicenseTier } from './royalty'

// Core economic configuration types
export interface EconomicConfiguration {
  baseUnlockPrices: Record<LicenseTier, bigint>
  baseReadRewards: Record<LicenseTier, bigint>
  platformRevenue: {
    unlockFeePercentage: number
    readRewardFeePercentage: number
    royaltyPlatformFee: number
    subscriptionFeePercentage: number
  }
  thresholds: {
    minimumViableRevenue: bigint
    optimalClaimThreshold: bigint
    largePaymentThreshold: bigint
    monthlyRevenueTarget: bigint
    annualRevenueGoal: bigint
  }
  projections: {
    userGrowthRate: number
    engagementGrowthRate: number
    priceAppreciationRate: number
    churnRate: number
  }
}

// Chapter economics analysis
export interface ChapterEconomicsAnalysis {
  chapterId: string
  licenseTier: LicenseTier
  timeframe: 'monthly' | 'quarterly' | 'annual'
  
  revenue: {
    unlockRevenue: bigint
    unlockRevenueFormatted: string
    readRewardCosts: bigint
    readRewardCostsFormatted: string
    netUnlockRevenue: bigint
    netUnlockRevenueFormatted: string
    projectedRoyalties: bigint
    projectedRoyaltiesFormatted: string
    platformFees: bigint
    platformFeesFormatted: string
    authorNetIncome: bigint
    authorNetIncomeFormatted: string
  }
  
  breakdown: {
    totalRevenue: bigint
    creatorShare: bigint
    platformShare: bigint
    readerRewards: bigint
    percentages: {
      creatorPercentage: number
      platformPercentage: number
      readerPercentage: number
    }
  }
  
  projections: {
    monthly: bigint
    monthlyFormatted: string
    quarterly: bigint
    quarterlyFormatted: string
    annual: bigint
    annualFormatted: string
  }
  
  metrics: {
    revenuePerRead: bigint
    revenuePerReadFormatted: string
    revenuePerUnlock: bigint
    revenuePerUnlockFormatted: string
    platformMargin: number
    authorMargin: number
    roiEstimate: number
    paybackPeriodMonths: number
  }
  
  calculatedAt: Date
}

// License tier optimization
export interface LicenseTierOptimization {
  chapterId: string
  currentTier: LicenseTier
  expectedMetrics: {
    monthlyReads: number
    monthlyUnlocks: number
    userGrowthRate: number
  }
  
  recommendation: {
    suggestedTier: LicenseTier
    confidence: number
    reasoning: string[]
    expectedImpact: {
      revenueIncrease: bigint
      revenueIncreaseFormatted: string
      revenueIncreasePercentage: number
      riskLevel: 'low' | 'medium' | 'high'
    }
  }
  
  comparison: Record<LicenseTier, {
    tier: LicenseTier
    monthlyIncome: bigint
    monthlyIncomeFormatted: string
    annualProjection: bigint
    annualProjectionFormatted: string
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    advantages: string[]
    disadvantages: string[]
  }>
  
  authorRiskProfile: {
    tolerance: 'low' | 'medium' | 'high'
    preferences: string[]
    constraints: string[]
  }
  
  marketConditions: {
    competitiveAnalysis: string[]
    trendsImpact: string[]
    seasonalFactors: string[]
  }
  
  calculatedAt: Date
}

// Platform revenue analysis
export interface PlatformRevenueAnalysis {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  startDate: Date
  endDate: Date
  
  totalMetrics: {
    totalRevenue: bigint
    totalRevenueFormatted: string
    platformRevenue: bigint
    platformRevenueFormatted: string
    authorRevenue: bigint
    authorRevenueFormatted: string
    readerRewards: bigint
    readerRewardsFormatted: string
  }
  
  breakdown: {
    unlockFees: bigint
    unlockFeesFormatted: string
    royaltyFees: bigint
    royaltyFeesFormatted: string
    subscriptionFees: bigint
    subscriptionFeesFormatted: string
    readRewardFunding: bigint
    readRewardFundingFormatted: string
    operationalCosts: bigint
    operationalCostsFormatted: string
  }
  
  margins: {
    platformMargin: number
    authorMargin: number
    readerBenefit: number
    operationalMargin: number
  }
  
  sustainability: {
    sustainabilityScore: number
    sustainabilityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    keyRisks: string[]
    recommendations: string[]
  }
  
  trends: {
    revenueGrowthRate: number
    userAcquisitionCost: bigint
    userLifetimeValue: bigint
    churnRate: number
    engagementTrends: Record<string, number>
  }
}

// Economic forecasting
export interface EconomicForecast {
  forecastId: string
  chapterId: string
  authorAddress: Address
  licenseTier: LicenseTier
  
  baseMetrics: {
    currentMonthlyReads: number
    currentMonthlyUnlocks: number
    currentRevenue: bigint
    currentRevenueFormatted: string
    historicalGrowthRate: number
  }
  
  assumptions: {
    userGrowthRate: number
    engagementGrowthRate: number
    priceAppreciationRate: number
    marketExpansionRate: number
    competitiveImpact: number
  }
  
  forecast: Array<{
    month: number
    date: Date
    projectedReads: number
    projectedUnlocks: number
    projectedRevenue: bigint
    projectedRevenueFormatted: string
    projectedRoyalties: bigint
    projectedRoyaltiesFormatted: string
    cumulativeRevenue: bigint
    cumulativeRevenueFormatted: string
    confidenceLevel: number
  }>
  
  summary: {
    forecastPeriodMonths: number
    totalProjectedRevenue: bigint
    totalProjectedRevenueFormatted: string
    totalProjectedRoyalties: bigint
    totalProjectedRoyaltiesFormatted: string
    averageMonthlyGrowth: number
    projectedROI: number
    breakEvenMonth: number
    
    confidenceInterval: {
      low: bigint
      lowFormatted: string
      high: bigint
      highFormatted: string
      confidence: number
    }
  }
  
  scenarios: {
    conservative: {
      totalRevenue: bigint
      totalRevenueFormatted: string
      probability: number
    }
    realistic: {
      totalRevenue: bigint
      totalRevenueFormatted: string
      probability: number
    }
    optimistic: {
      totalRevenue: bigint
      totalRevenueFormatted: string
      probability: number
    }
  }
  
  risks: {
    marketRisks: string[]
    technicalRisks: string[]
    competitiveRisks: string[]
    mitigationStrategies: string[]
  }
  
  generatedAt: Date
  lastUpdated: Date
}

// Revenue optimization recommendations
export interface RevenueOptimizationRecommendations {
  chapterId: string
  authorAddress: Address
  currentPerformance: ChapterEconomicsAnalysis
  
  recommendations: Array<{
    id: string
    category: 'pricing' | 'engagement' | 'distribution' | 'content' | 'marketing'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    implementation: {
      effort: 'low' | 'medium' | 'high'
      timeframe: string
      resources: string[]
      dependencies: string[]
    }
    expectedImpact: {
      revenueIncrease: bigint
      revenueIncreaseFormatted: string
      revenueIncreasePercentage: number
      timeToImpact: number
      confidence: number
    }
    metrics: {
      kpis: string[]
      measurementMethods: string[]
      successCriteria: string[]
    }
  }>
  
  strategicAnalysis: {
    currentPosition: string
    competitiveAdvantages: string[]
    marketOpportunities: string[]
    threatsAndChallenges: string[]
  }
  
  actionPlan: {
    shortTerm: string[] // 1-3 months
    mediumTerm: string[] // 3-6 months
    longTerm: string[] // 6+ months
  }
  
  monitoringPlan: {
    keyMetrics: string[]
    reviewFrequency: string
    alertThresholds: Record<string, number>
  }
  
  generatedAt: Date
}

// Economic dashboard data
export interface EconomicDashboardData {
  authorAddress: Address
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year'
  
  overview: {
    totalRevenue: bigint
    totalRevenueFormatted: string
    totalRoyalties: bigint
    totalRoyaltiesFormatted: string
    activeChapters: number
    totalReads: number
    totalUnlocks: number
    averageRevenuePerChapter: bigint
    averageRevenuePerChapterFormatted: string
  }
  
  performance: {
    revenueGrowth: number
    readGrowth: number
    unlockGrowth: number
    royaltyClaimRate: number
    engagementRate: number
  }
  
  breakdown: {
    byLicenseTier: Record<LicenseTier, {
      chapters: number
      revenue: bigint
      revenueFormatted: string
      averageRevenue: bigint
      averageRevenueFormatted: string
    }>
    
    byTimeframe: Array<{
      period: string
      revenue: bigint
      revenueFormatted: string
      reads: number
      unlocks: number
    }>
  }
  
  topPerformers: {
    chapters: Array<{
      chapterId: string
      title: string
      revenue: bigint
      revenueFormatted: string
      tier: LicenseTier
    }>
    
    metrics: Array<{
      metric: string
      value: string
      trend: 'up' | 'down' | 'stable'
      change: number
    }>
  }
  
  insights: {
    achievements: string[]
    opportunities: string[]
    concerns: string[]
    recommendations: string[]
  }
  
  projections: {
    nextMonth: {
      revenue: bigint
      revenueFormatted: string
      confidence: number
    }
    nextQuarter: {
      revenue: bigint
      revenueFormatted: string
      confidence: number
    }
    nextYear: {
      revenue: bigint
      revenueFormatted: string
      confidence: number
    }
  }
  
  lastUpdated: Date
}

// Market analysis types
export interface MarketAnalysisData {
  analysisDate: Date
  marketSegment: 'fiction' | 'non-fiction' | 'educational' | 'entertainment' | 'technical'
  
  marketMetrics: {
    totalMarketSize: bigint
    totalMarketSizeFormatted: string
    growthRate: number
    competitorCount: number
    marketShare: number
    penetrationRate: number
  }
  
  pricingAnalysis: {
    averageUnlockPrice: Record<LicenseTier, bigint>
    averageReadReward: Record<LicenseTier, bigint>
    priceElasticity: number
    optimalPriceRange: {
      min: bigint
      max: bigint
      optimal: bigint
    }
  }
  
  userBehavior: {
    averageReadsPerUser: number
    averageUnlocksPerUser: number
    userRetentionRate: number
    paymentWillingness: Record<LicenseTier, number>
    engagementPatterns: Record<string, number>
  }
  
  trends: {
    emergingTrends: string[]
    decliningTrends: string[]
    seasonalPatterns: Record<string, number>
    technologicalImpact: string[]
  }
  
  recommendations: {
    marketingStrategy: string[]
    pricingStrategy: string[]
    contentStrategy: string[]
    partnershipOpportunities: string[]
  }
}

// Economic alerts and notifications
export interface EconomicAlert {
  alertId: string
  authorAddress: Address
  chapterId?: string
  
  type: 'revenue_threshold' | 'growth_anomaly' | 'market_opportunity' | 'performance_decline' | 'optimization_suggestion'
  severity: 'info' | 'warning' | 'critical'
  
  title: string
  message: string
  details: {
    currentValue: string
    thresholdValue: string
    change: string
    trend: 'up' | 'down' | 'stable'
  }
  
  recommendations: string[]
  actionItems: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    timeframe: string
  }>
  
  metadata: {
    triggeredAt: Date
    source: string
    confidence: number
    impact: 'low' | 'medium' | 'high'
  }
  
  acknowledged: boolean
  resolvedAt?: Date
}