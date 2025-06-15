/**
 * @fileoverview Advanced Story Protocol Service for Enhanced Licensing Features
 * Builds on the existing StoryProtocolService with advanced licensing, royalties, and derivatives
 * Supports Phase 1 of the SDK enhancement plan with 3-tier licensing system
 */
import { Address, Hash, WalletClient } from 'viem';
import type { LicenseTermsConfig, EnhancedChapterIPData, EnhancedIPRegistrationResult } from '../types/ip';
export interface RoyaltyPolicyConfig {
    policyType: 'LAP' | 'LRP';
    address: Address;
    stakingReward: number;
    distributionDelay: number;
    maxStakingThreshold: bigint;
}
export declare const ROYALTY_POLICIES: Record<string, RoyaltyPolicyConfig>;
export declare const LICENSE_TIERS: Record<string, LicenseTermsConfig>;
/**
 * Advanced Story Protocol Service
 * Extends basic IP registration with comprehensive licensing and royalty features
 */
export declare class AdvancedStoryProtocolService {
    private client;
    private walletClient;
    /**
     * Initialize the service with a wallet client
     */
    initialize(walletClient: WalletClient): Promise<void>;
    /**
     * Create license terms for a specific tier
     * Phase 1 implementation - creates PIL (Programmable IP License) terms
     */
    createChapterLicenseTerms(tier: 'free' | 'premium' | 'exclusive', customConfig?: Partial<LicenseTermsConfig>): Promise<{
        success: boolean;
        licenseTermsId?: string;
        transactionHash?: Hash;
        error?: string;
    }>;
    /**
     * Register a chapter as IP with enhanced metadata and licensing
     * Builds on existing registration with advanced features
     */
    registerEnhancedChapterIP(chapterData: EnhancedChapterIPData, licenseTermsId?: string): Promise<EnhancedIPRegistrationResult>;
    /**
     * Get available license tiers with current pricing
     */
    getLicenseTiers(): Record<string, LicenseTermsConfig>;
    /**
     * Get license tier by name
     */
    getLicenseTier(tier: 'free' | 'premium' | 'exclusive'): LicenseTermsConfig | null;
    /**
     * Calculate licensing costs for a chapter
     */
    calculateLicensingCosts(tier: 'free' | 'premium' | 'exclusive', customPrice?: number): {
        mintingFee: bigint;
        tipPrice: number;
        royaltyPercentage: number;
    };
    /**
     * Validate license configuration
     */
    validateLicenseConfig(config: LicenseTermsConfig): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Initialize royalty policies for all license tiers
     * Configures LAP (Liquid Absolute Percentage) and LRP (Liquid Royalty Policy)
     */
    initializeRoyaltyPolicies(): Promise<{
        success: boolean;
        policies?: Record<string, {
            address: Address;
            transactionHash: Hash;
        }>;
        error?: string;
    }>;
    /**
     * Configure royalty policy from environment variables
     * Sets up LAP/LRP addresses from environment configuration
     */
    configureRoyaltyPoliciesFromEnvironment(): void;
    /**
     * Get royalty policy configuration for a tier
     */
    getRoyaltyPolicy(tier: 'free' | 'premium' | 'exclusive'): RoyaltyPolicyConfig | null;
    /**
     * Calculate expected royalty distribution for a derivative
     */
    calculateRoyaltyDistribution(tier: 'free' | 'premium' | 'exclusive', derivativeRevenue: number): {
        originalCreator: number;
        platform: number;
        stakers: number;
        total: number;
    };
    /**
     * Estimate gas costs for royalty operations
     */
    estimateRoyaltyGasCosts(operationType: 'claim' | 'distribute' | 'stake'): {
        estimatedGas: bigint;
        estimatedCostInETH: number;
        estimatedCostInTIP: number;
    };
    /**
     * Get service status and configuration including royalty policies
     */
    getServiceStatus(): {
        initialized: boolean;
        connectedWallet?: Address;
        chainId: number;
        availableTiers: string[];
        royaltyPolicies: Record<string, RoyaltyPolicyConfig>;
        sdkVersion: string;
    };
}
export declare const advancedStoryProtocolService: AdvancedStoryProtocolService;
export interface TIPTokenEconomics {
    unlockPrice: number;
    readReward: number;
    creatorReward: number;
    licensePrice: number;
    royaltyPercentage: number;
    platformFee: number;
    stakingReward: number;
    qualityBonus: number;
    streakBonus: number;
    volumeDiscount: number;
}
/**
 * TIP Token Economics Calculator
 * Integrates licensing system with existing token economics
 */
export declare class TIPTokenEconomicsCalculator {
    /**
     * Calculate complete economics for a chapter with licensing
     */
    static calculateChapterEconomics(chapterData: EnhancedChapterIPData, licenseTier: 'free' | 'premium' | 'exclusive'): TIPTokenEconomics;
    /**
     * Calculate revenue distribution for a story with derivatives
     */
    static calculateRevenueDistribution(originalEconomics: TIPTokenEconomics, derivativeRevenue: number, licenseTier: 'free' | 'premium' | 'exclusive'): {
        originalCreator: number;
        derivativeCreator: number;
        platform: number;
        stakers: number;
        total: number;
        breakdown: {
            baseRoyalty: number;
            stakingBonus: number;
            platformFee: number;
            creatorShare: number;
        };
    };
    /**
     * Calculate optimal pricing strategy for a chapter
     */
    static calculateOptimalPricing(chapterData: EnhancedChapterIPData, targetAudience: 'mass' | 'premium' | 'exclusive'): {
        suggestedTier: 'free' | 'premium' | 'exclusive';
        suggestedPricing: TIPTokenEconomics;
        reasoning: string[];
        projectedRevenue: {
            conservative: number;
            optimistic: number;
            aggressive: number;
        };
    };
    /**
     * Calculate staking rewards for IP holders
     */
    static calculateStakingRewards(stakedAmount: number, stakingDuration: number, // days
    licenseTier: 'free' | 'premium' | 'exclusive', totalStaked: number): {
        baseReward: number;
        bonusReward: number;
        totalReward: number;
        apy: number;
    };
}
export declare function isValidLicenseTier(tier: string): tier is 'free' | 'premium' | 'exclusive';
export declare function getLicenseTierDisplayName(tier: 'free' | 'premium' | 'exclusive'): string;
export declare function getLicenseTierDescription(tier: 'free' | 'premium' | 'exclusive'): string;
export declare function calculateTIPTokenValue(amount: number, operation: 'unlock' | 'read' | 'license' | 'royalty'): {
    tipAmount: number;
    usdEquivalent: number;
    gasEstimate: number;
};
//# sourceMappingURL=advancedStoryProtocolService.d.ts.map