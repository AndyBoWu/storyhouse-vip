/**
 * @fileoverview Royalty Calculation Utilities
 * 
 * Comprehensive utilities for calculating royalties, fees, and economic projections
 * across different license tiers with TIP token integration.
 */

import { formatEther, parseEther } from 'viem'
import type { 
  LicenseTier,
  RoyaltyCalculationInput,
  RoyaltyCalculationOutput,
  RoyaltyEconomics,
  RevenueBreakdown,
  LicenseTierComparison,
  RoyaltyPreview
} from '../types/royalty'

// Economic constants
export const ECONOMIC_CONSTANTS = {
  // Platform rates
  PLATFORM_FEE_RATE: 5, // 5% platform fee
  
  // License tier royalty rates
  ROYALTY_RATES: {
    free: 0, // 0% - attribution only
    premium: 10, // 10% - commercial with revenue sharing
    exclusive: 25 // 25% - exclusive commercial rights
  } as Record<LicenseTier, number>,
  
  // Reader reward rates
  READER_REWARD_RATES: {
    free: 2, // 2% of revenue goes to readers
    premium: 3, // 3% of revenue goes to readers
    exclusive: 5 // 5% of revenue goes to readers
  } as Record<LicenseTier, number>,
  
  // Base economic parameters
  TIP_TOKEN_DECIMALS: 18,
  ETH_TO_TIP_RATIO: 1, // 1 ETH = 1 TIP token
  GAS_ESTIMATE_MULTIPLIER: 1.2, // 20% buffer for gas estimation
  
  // Minimum thresholds
  MINIMUM_CLAIM_AMOUNT: parseEther('0.001'), // 0.001 TIP tokens
  MAXIMUM_CLAIM_AMOUNT: parseEther('10000'), // 10,000 TIP tokens
  
  // Economic modeling
  AVERAGE_CHAPTER_READS: 100,
  AVERAGE_READ_REWARD: parseEther('0.01'), // 0.01 TIP per read
  MONTHLY_GROWTH_RATE: 0.15 // 15% monthly growth assumption
} as const

/**
 * Calculate detailed royalty breakdown for a given revenue and license tier
 */
export function calculateRoyaltyBreakdown(
  input: RoyaltyCalculationInput
): RoyaltyCalculationOutput {
  const { totalRevenue, licenseTier, includeGasFees = true, includePlatformFees = true } = input
  
  // Get rates for license tier
  const royaltyRate = ECONOMIC_CONSTANTS.ROYALTY_RATES[licenseTier]
  const platformFeeRate = includePlatformFees ? ECONOMIC_CONSTANTS.PLATFORM_FEE_RATE : 0
  
  // Calculate amounts
  const royaltyAmount = (totalRevenue * BigInt(royaltyRate)) / BigInt(100)
  const platformFee = (totalRevenue * BigInt(platformFeeRate)) / BigInt(100)
  
  // Estimate gas fee (simplified calculation)
  const estimatedGasFee = includeGasFees ? parseEther('0.002') : BigInt(0) // ~$5 at $2500 ETH
  
  // Calculate net amount
  const netAmount = royaltyAmount - platformFee - estimatedGasFee
  
  // Calculate percentages for breakdown
  const totalDeductions = platformFee + estimatedGasFee
  const royaltyPercentage = totalRevenue > 0 ? Number((royaltyAmount * BigInt(10000)) / totalRevenue) / 100 : 0
  const platformFeePercentage = totalRevenue > 0 ? Number((platformFee * BigInt(10000)) / totalRevenue) / 100 : 0
  const gasFeePercentage = totalRevenue > 0 ? Number((estimatedGasFee * BigInt(10000)) / totalRevenue) / 100 : 0
  const netPercentage = totalRevenue > 0 ? Number((netAmount * BigInt(10000)) / totalRevenue) / 100 : 0
  
  return {
    input,
    royaltyAmount,
    royaltyAmountFormatted: formatEther(royaltyAmount),
    platformFee,
    platformFeeFormatted: formatEther(platformFee),
    estimatedGasFee,
    estimatedGasFeeFormatted: formatEther(estimatedGasFee),
    netAmount: netAmount > 0 ? netAmount : BigInt(0),
    netAmountFormatted: formatEther(netAmount > 0 ? netAmount : BigInt(0)),
    breakdown: {
      royaltyPercentage,
      platformFeePercentage,
      gasFeePercentage,
      netPercentage
    },
    calculated: true,
    timestamp: new Date()
  }
}

/**
 * Calculate comprehensive revenue breakdown including reader rewards
 */
export function calculateRevenueBreakdown(
  totalRevenue: bigint,
  licenseTier: LicenseTier
): RevenueBreakdown {
  const royaltyRate = ECONOMIC_CONSTANTS.ROYALTY_RATES[licenseTier]
  const platformFeeRate = ECONOMIC_CONSTANTS.PLATFORM_FEE_RATE
  const readerRewardRate = ECONOMIC_CONSTANTS.READER_REWARD_RATES[licenseTier]
  
  // Calculate amounts
  const creatorRoyalty = (totalRevenue * BigInt(royaltyRate)) / BigInt(100)
  const platformFee = (totalRevenue * BigInt(platformFeeRate)) / BigInt(100)
  const readerRewards = (totalRevenue * BigInt(readerRewardRate)) / BigInt(100)
  const remainingAmount = totalRevenue - creatorRoyalty - platformFee - readerRewards
  
  // Calculate percentage breakdown
  const breakdown = {
    creator: royaltyRate,
    platform: platformFeeRate,
    readers: readerRewardRate,
    remaining: 100 - royaltyRate - platformFeeRate - readerRewardRate
  }
  
  return {
    totalRevenue,
    creatorRoyalty,
    platformFee,
    readerRewards,
    remainingAmount,
    breakdown
  }
}

/**
 * Generate economic projection for a chapter based on license tier
 */
export function calculateRoyaltyEconomics(
  licenseTier: LicenseTier,
  estimatedMonthlyReads: number = ECONOMIC_CONSTANTS.AVERAGE_CHAPTER_READS
): RoyaltyEconomics {
  const royaltyRate = ECONOMIC_CONSTANTS.ROYALTY_RATES[licenseTier]
  const platformFeeRate = ECONOMIC_CONSTANTS.PLATFORM_FEE_RATE
  const readerRewardRate = ECONOMIC_CONSTANTS.READER_REWARD_RATES[licenseTier]
  
  // Base pricing strategy by tier
  const baseUnlockPrice = licenseTier === 'free' 
    ? BigInt(0)
    : licenseTier === 'premium'
    ? parseEther('0.01') // 0.01 TIP tokens
    : parseEther('0.05') // 0.05 TIP tokens for exclusive
  
  const readReward = ECONOMIC_CONSTANTS.AVERAGE_READ_REWARD
  
  // Calculate projected monthly revenue
  const unlockRevenue = baseUnlockPrice * BigInt(estimatedMonthlyReads)
  const readRewardCost = readReward * BigInt(estimatedMonthlyReads)
  const projectedMonthlyRevenue = unlockRevenue - readRewardCost
  
  // Calculate ROI based on creation costs (estimated)
  const estimatedCreationCost = parseEther('0.1') // Estimated chapter creation cost
  const monthlyRoyalty = (projectedMonthlyRevenue * BigInt(royaltyRate)) / BigInt(100)
  const estimatedROI = estimatedCreationCost > 0 
    ? Number((monthlyRoyalty * BigInt(1200)) / estimatedCreationCost) / 100 // Annual ROI
    : 0
  
  return {
    licenseTier,
    royaltyRate,
    platformFeeRate,
    readerRewardRate,
    baseUnlockPrice,
    readReward,
    projectedMonthlyRevenue,
    estimatedROI
  }
}

/**
 * Compare license tiers for optimization recommendations
 */
export function compareLicenseTiers(
  chapterId: string,
  currentTier: LicenseTier,
  currentRevenue: bigint
): LicenseTierComparison {
  const tiers: LicenseTierComparison['tiers'] = {} as any
  
  // Calculate projections for each tier
  const allTiers: LicenseTier[] = ['free', 'premium', 'exclusive']
  
  for (const tier of allTiers) {
    const calculation = calculateRoyaltyBreakdown({
      totalRevenue: currentRevenue,
      licenseTier: tier
    })
    
    const difference = calculation.netAmount - 
      calculateRoyaltyBreakdown({ totalRevenue: currentRevenue, licenseTier: currentTier }).netAmount
    
    tiers[tier] = {
      tier,
      royaltyRate: ECONOMIC_CONSTANTS.ROYALTY_RATES[tier],
      projectedRoyalty: calculation.royaltyAmount,
      projectedRoyaltyFormatted: calculation.royaltyAmountFormatted,
      platformFee: calculation.platformFee,
      netRoyalty: calculation.netAmount,
      netRoyaltyFormatted: calculation.netAmountFormatted,
      difference,
      differenceFormatted: formatEther(difference),
      differencePercentage: currentRevenue > 0 ? Number((difference * BigInt(10000)) / currentRevenue) / 100 : 0,
      recommended: false // Will be set below
    }
  }
  
  // Determine best tier recommendation
  const tiersByNet = allTiers.sort((a, b) => 
    Number(tiers[b].netRoyalty - tiers[a].netRoyalty)
  )
  const suggestedTier = tiersByNet[0]
  tiers[suggestedTier].recommended = true
  
  const currentTierNet = tiers[currentTier].netRoyalty
  const suggestedTierNet = tiers[suggestedTier].netRoyalty
  const potentialIncrease = suggestedTierNet - currentTierNet
  
  return {
    chapterId,
    currentTier,
    currentRevenue,
    tiers,
    recommendation: {
      suggestedTier,
      reasoning: generateOptimizationReasons(currentTier, suggestedTier, potentialIncrease),
      potentialIncrease,
      potentialIncreaseFormatted: formatEther(potentialIncrease),
      potentialIncreasePercentage: currentTierNet > 0 ? Number((potentialIncrease * BigInt(10000)) / currentTierNet) / 100 : 0
    }
  }
}

/**
 * Generate royalty preview with recommendations
 */
export function generateRoyaltyPreview(
  chapterId: string,
  authorAddress: string,
  licenseTier: LicenseTier,
  currentRevenue: bigint
): RoyaltyPreview {
  const calculation = calculateRoyaltyBreakdown({
    totalRevenue: currentRevenue,
    licenseTier
  })
  
  // Determine recommended action
  const minimumViable = parseEther('0.01') // 0.01 TIP tokens
  const optimalClaim = parseEther('0.1') // 0.1 TIP tokens
  
  let recommendedAction: RoyaltyPreview['recommendedAction']
  let reasoning: string[] = []
  
  if (calculation.netAmount < ECONOMIC_CONSTANTS.MINIMUM_CLAIM_AMOUNT) {
    recommendedAction = 'wait_for_more'
    reasoning.push('Amount below minimum claim threshold')
    reasoning.push(`Wait until you have at least ${formatEther(ECONOMIC_CONSTANTS.MINIMUM_CLAIM_AMOUNT)} TIP tokens`)
  } else if (calculation.netAmount < minimumViable) {
    recommendedAction = 'wait_for_more'
    reasoning.push('Gas fees will consume significant portion of claim')
    reasoning.push('Consider waiting for more revenue to accumulate')
  } else if (calculation.netAmount >= optimalClaim) {
    recommendedAction = 'claim_now'
    reasoning.push('Optimal claim amount reached')
    reasoning.push('Good balance between gas efficiency and timely rewards')
  } else {
    // Check if tier upgrade would be beneficial
    const comparison = compareLicenseTiers(chapterId, licenseTier, currentRevenue)
    if (comparison.recommendation.potentialIncrease > parseEther('0.01')) {
      recommendedAction = 'consider_tier_upgrade'
      reasoning.push(`Consider upgrading to ${comparison.recommendation.suggestedTier} tier`)
      reasoning.push(`Potential increase: ${comparison.recommendation.potentialIncreaseFormatted} TIP tokens`)
    } else {
      recommendedAction = 'claim_now'
      reasoning.push('Reasonable amount available for claiming')
    }
  }
  
  return {
    chapterId,
    authorAddress: authorAddress as any,
    licenseTier,
    currentRevenue,
    projectedRoyalty: calculation.royaltyAmount,
    projectedRoyaltyFormatted: calculation.royaltyAmountFormatted,
    platformFee: calculation.platformFee,
    platformFeeFormatted: calculation.platformFeeFormatted,
    netRoyalty: calculation.netAmount,
    netRoyaltyFormatted: calculation.netAmountFormatted,
    estimatedGasFee: calculation.estimatedGasFee,
    estimatedGasFeeFormatted: calculation.estimatedGasFeeFormatted,
    finalNetAmount: calculation.netAmount,
    finalNetAmountFormatted: calculation.netAmountFormatted,
    recommendedAction,
    reasoning,
    lastUpdated: new Date()
  }
}

/**
 * Generate optimization reasoning for license tier recommendations
 */
function generateOptimizationReasons(
  currentTier: LicenseTier,
  suggestedTier: LicenseTier,
  potentialIncrease: bigint
): string[] {
  const reasons: string[] = []
  
  if (suggestedTier === currentTier) {
    reasons.push('Current license tier is optimal for your revenue level')
    reasons.push('No immediate changes recommended')
    return reasons
  }
  
  if (potentialIncrease <= 0) {
    reasons.push('Current tier provides best net returns')
    reasons.push('Consider market conditions before changing tiers')
    return reasons
  }
  
  const increaseFormatted = formatEther(potentialIncrease)
  
  if (currentTier === 'free' && suggestedTier === 'premium') {
    reasons.push('Your content has commercial potential')
    reasons.push(`Upgrading to premium could increase earnings by ${increaseFormatted} TIP tokens`)
    reasons.push('Premium tier enables revenue sharing while maintaining broad accessibility')
  } else if (currentTier === 'premium' && suggestedTier === 'exclusive') {
    reasons.push('High-value content suitable for exclusive licensing')
    reasons.push(`Exclusive tier could increase earnings by ${increaseFormatted} TIP tokens`)
    reasons.push('Consider if reduced accessibility is acceptable for higher returns')
  } else if (suggestedTier === 'free') {
    reasons.push('Consider free tier to maximize reach and reader engagement')
    reasons.push('Attribution-based model may drive more long-term value')
  }
  
  return reasons
}

/**
 * Validate royalty calculation inputs
 */
export function validateCalculationInput(input: RoyaltyCalculationInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (input.totalRevenue < 0) {
    errors.push('Total revenue cannot be negative')
  }
  
  if (input.totalRevenue > ECONOMIC_CONSTANTS.MAXIMUM_CLAIM_AMOUNT) {
    errors.push(`Total revenue exceeds maximum claim amount of ${formatEther(ECONOMIC_CONSTANTS.MAXIMUM_CLAIM_AMOUNT)} TIP tokens`)
  }
  
  if (!['free', 'premium', 'exclusive'].includes(input.licenseTier)) {
    errors.push('Invalid license tier specified')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Format TIP token amounts for display
 */
export function formatTIPAmount(
  amount: bigint,
  options: {
    decimals?: number
    includeSymbol?: boolean
    useCompactNotation?: boolean
  } = {}
): string {
  const { decimals = 4, includeSymbol = true, useCompactNotation = false } = options
  
  const formatted = formatEther(amount)
  const numericValue = parseFloat(formatted)
  
  let displayValue: string
  
  if (useCompactNotation && numericValue >= 1000) {
    if (numericValue >= 1000000) {
      displayValue = (numericValue / 1000000).toFixed(2) + 'M'
    } else if (numericValue >= 1000) {
      displayValue = (numericValue / 1000).toFixed(2) + 'K'
    } else {
      displayValue = numericValue.toFixed(decimals)
    }
  } else {
    displayValue = numericValue.toFixed(decimals)
  }
  
  // Remove trailing zeros
  displayValue = displayValue.replace(/\.?0+$/, '')
  
  return includeSymbol ? `${displayValue} TIP` : displayValue
}

/**
 * Calculate break-even analysis for content creation
 */
export function calculateBreakEvenAnalysis(
  creationCost: bigint,
  licenseTier: LicenseTier,
  estimatedMonthlyReads: number = ECONOMIC_CONSTANTS.AVERAGE_CHAPTER_READS
): {
  breakEvenReads: number
  breakEvenTime: number // months
  monthlyRoyalty: bigint
  roi12Months: number
} {
  const economics = calculateRoyaltyEconomics(licenseTier, estimatedMonthlyReads)
  const monthlyRoyalty = (economics.projectedMonthlyRevenue * BigInt(economics.royaltyRate)) / BigInt(100)
  
  const breakEvenTime = monthlyRoyalty > 0 
    ? Number(creationCost * BigInt(100)) / Number(monthlyRoyalty) / 100
    : Infinity
  
  const breakEvenReads = breakEvenTime < Infinity 
    ? Math.ceil(breakEvenTime * estimatedMonthlyReads)
    : Infinity
  
  const roi12Months = monthlyRoyalty > 0
    ? Number((monthlyRoyalty * BigInt(1200) - creationCost * BigInt(100)) * BigInt(100)) / Number(creationCost) / 100
    : -100
  
  return {
    breakEvenReads,
    breakEvenTime,
    monthlyRoyalty,
    roi12Months
  }
}