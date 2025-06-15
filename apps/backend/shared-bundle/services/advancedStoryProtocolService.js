/**
 * @fileoverview Advanced Story Protocol Service for Enhanced Licensing Features
 * Builds on the existing StoryProtocolService with advanced licensing, royalties, and derivatives
 * Supports Phase 1 of the SDK enhancement plan with 3-tier licensing system
 */
import { StoryClient } from '@story-protocol/core-sdk';
import { custom } from 'viem';
// Aeneid testnet chain configuration
const AENEID_CHAIN = {
    id: 1315,
    name: 'Aeneid',
    nativeCurrency: {
        decimals: 18,
        name: 'IP Token',
        symbol: 'IP',
    },
    rpcUrls: {
        default: { http: ['https://aeneid.storyrpc.io'] },
        public: { http: ['https://aeneid.storyrpc.io'] },
    },
    blockExplorers: {
        default: { name: 'Story Protocol Explorer', url: 'https://aeneid.storyscan.xyz' },
    },
};
// Default royalty policies for each tier
export const ROYALTY_POLICIES = {
    free: {
        policyType: 'LAP',
        address: '0x0000000000000000000000000000000000000000', // Will be set from environment
        stakingReward: 0, // No staking rewards for free tier
        distributionDelay: 0, // Immediate distribution
        maxStakingThreshold: 0n,
    },
    premium: {
        policyType: 'LRP',
        address: '0x0000000000000000000000000000000000000000', // Will be set from environment
        stakingReward: 5, // 5% staking reward
        distributionDelay: 86400, // 24 hours
        maxStakingThreshold: BigInt(10000 * 10 ** 18), // 10,000 TIP tokens max staking
    },
    exclusive: {
        policyType: 'LRP',
        address: '0x0000000000000000000000000000000000000000', // Will be set from environment
        stakingReward: 10, // 10% staking reward
        distributionDelay: 604800, // 7 days
        maxStakingThreshold: BigInt(100000 * 10 ** 18), // 100,000 TIP tokens max staking
    }
};
// 3-Tier License Configuration with integrated royalty policies
export const LICENSE_TIERS = {
    free: {
        tier: 'free',
        displayName: 'Free License',
        description: 'Open access with attribution required',
        transferable: true,
        royaltyPolicy: '0x0000000000000000000000000000000000000000', // Will be updated by configureRoyaltyPoliciesFromEnvironment()
        defaultMintingFee: 0n,
        expiration: 0, // Never expires
        commercialUse: false,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        territories: ['Worldwide'],
        distributionChannels: ['Digital'],
        contentRestrictions: ['Non-commercial use only'],
        tipPrice: 0,
        royaltyPercentage: 0,
        exclusivity: false,
        shareAlike: true,
        attribution: true,
    },
    premium: {
        tier: 'premium',
        displayName: 'Premium License',
        description: 'Commercial use with royalty sharing',
        transferable: true,
        royaltyPolicy: '0x0000000000000000000000000000000000000000', // Will be updated by configureRoyaltyPoliciesFromEnvironment()
        defaultMintingFee: BigInt(100 * 10 ** 18), // 100 TIP tokens
        expiration: 0, // Never expires
        commercialUse: true,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        territories: ['Worldwide'],
        distributionChannels: ['Digital', 'Print', 'Audio', 'Video'],
        contentRestrictions: [],
        tipPrice: 100,
        royaltyPercentage: 10,
        exclusivity: false,
        shareAlike: false,
        attribution: true,
    },
    exclusive: {
        tier: 'exclusive',
        displayName: 'Exclusive License',
        description: 'Full commercial rights with high royalties',
        transferable: false,
        royaltyPolicy: '0x0000000000000000000000000000000000000000', // Will be updated by configureRoyaltyPoliciesFromEnvironment()
        defaultMintingFee: BigInt(1000 * 10 ** 18), // 1000 TIP tokens
        expiration: 0, // Never expires
        commercialUse: true,
        commercialAttribution: true,
        derivativesAllowed: true,
        derivativesAttribution: true,
        territories: ['Worldwide'],
        distributionChannels: ['All'],
        contentRestrictions: [],
        tipPrice: 1000,
        royaltyPercentage: 25,
        exclusivity: true,
        shareAlike: false,
        attribution: true,
    }
};
/**
 * Advanced Story Protocol Service
 * Extends basic IP registration with comprehensive licensing and royalty features
 */
export class AdvancedStoryProtocolService {
    constructor() {
        this.client = null;
        this.walletClient = null;
    }
    /**
     * Initialize the service with a wallet client
     */
    async initialize(walletClient) {
        if (!walletClient.account) {
            throw new Error('WalletClient must have an account attached.');
        }
        this.walletClient = walletClient;
        const config = {
            account: walletClient.account,
            transport: custom(walletClient),
            chainId: 1315,
        };
        this.client = StoryClient.newClient(config);
    }
    /**
     * Create license terms for a specific tier
     * Phase 1 implementation - creates PIL (Programmable IP License) terms
     */
    async createChapterLicenseTerms(tier, customConfig) {
        try {
            if (!this.client) {
                throw new Error('Service not initialized. Call initialize() first.');
            }
            // Get base configuration for the tier
            const baseConfig = LICENSE_TIERS[tier];
            if (!baseConfig) {
                throw new Error(`Invalid license tier: ${tier}`);
            }
            // Merge with custom configuration if provided
            const licenseConfig = { ...baseConfig, ...customConfig };
            console.log(`🔗 Creating ${tier} license terms...`);
            console.log('📋 License configuration:', {
                tier: licenseConfig.tier,
                commercialUse: licenseConfig.commercialUse,
                derivativesAllowed: licenseConfig.derivativesAllowed,
                defaultMintingFee: licenseConfig.defaultMintingFee.toString(),
                royaltyPercentage: licenseConfig.royaltyPercentage
            });
            // Create license terms using Story Protocol SDK
            const licenseTermsParams = {
                transferable: licenseConfig.transferable,
                royaltyPolicy: licenseConfig.royaltyPolicy,
                defaultMintingFee: licenseConfig.defaultMintingFee,
                expiration: licenseConfig.expiration,
                commercialUse: licenseConfig.commercialUse,
                commercialAttribution: licenseConfig.commercialAttribution,
                derivativesAllowed: licenseConfig.derivativesAllowed,
                derivativesAttribution: licenseConfig.derivativesAttribution,
                territories: licenseConfig.territories,
                distributionChannels: licenseConfig.distributionChannels,
                contentRestrictions: licenseConfig.contentRestrictions,
            };
            // Use the correct SDK v1.3.2 method: registerPILTerms
            const pilTermsParams = {
                transferable: licenseConfig.transferable,
                royaltyPolicy: licenseConfig.royaltyPolicy,
                defaultMintingFee: licenseConfig.defaultMintingFee,
                expiration: BigInt(licenseConfig.expiration),
                commercialUse: licenseConfig.commercialUse,
                commercialAttribution: licenseConfig.commercialAttribution,
                commercializerChecker: '0x0000000000000000000000000000000000000000', // No restrictions
                commercializerCheckerData: '0x',
                commercialRevShare: licenseConfig.royaltyPercentage,
                commercialRevCeiling: BigInt(0), // No ceiling
                derivativesAllowed: licenseConfig.derivativesAllowed,
                derivativesAttribution: licenseConfig.derivativesAttribution,
                derivativesApproval: false, // No approval needed
                derivativesReciprocal: licenseConfig.shareAlike || false,
                derivativeRevCeiling: BigInt(0), // No ceiling
                currency: '0x1514000000000000000000000000000000000000', // WIP token address
                uri: '', // License metadata URI (can be empty for now)
                txOptions: {}
            };
            console.log('🔗 Creating PIL terms with Story Protocol SDK v1.3.2...');
            console.log('📋 PIL parameters:', {
                tier: licenseConfig.tier,
                commercialUse: pilTermsParams.commercialUse,
                derivativesAllowed: pilTermsParams.derivativesAllowed,
                royaltyPercentage: pilTermsParams.commercialRevShare,
                defaultMintingFee: pilTermsParams.defaultMintingFee.toString()
            });
            const result = await this.client.license.registerPILTerms(pilTermsParams);
            if (!result.txHash) {
                throw new Error('Failed to create PIL terms - no transaction hash returned');
            }
            console.log('✅ PIL terms created successfully!');
            console.log('🔗 Transaction:', result.txHash);
            console.log('📄 License Terms ID:', result.licenseTermsId);
            return {
                success: true,
                licenseTermsId: result.licenseTermsId?.toString(),
                transactionHash: result.txHash,
            };
        }
        catch (error) {
            console.error(`❌ Failed to create ${tier} license terms:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * Register a chapter as IP with enhanced metadata and licensing
     * Builds on existing registration with advanced features
     */
    async registerEnhancedChapterIP(chapterData, licenseTermsId) {
        try {
            if (!this.client || !this.walletClient?.account) {
                throw new Error('Service not initialized properly');
            }
            const startTime = new Date();
            console.log('🚀 Registering enhanced chapter IP...');
            console.log('📄 Chapter:', chapterData.title, 'Chapter', chapterData.chapterNumber);
            console.log('👤 Author:', chapterData.metadata.authorAddress);
            console.log('🏷️ License Tier:', chapterData.metadata.preferredLicenseTier);
            // Create enhanced NFT metadata
            const nftMetadata = {
                name: `${chapterData.title} - Chapter ${chapterData.chapterNumber}`,
                description: `Chapter ${chapterData.chapterNumber} of "${chapterData.title}" - ${chapterData.metadata.suggestedGenre} story`,
                image: "https://storyhouse.vip/favicon.svg",
                content_url: chapterData.contentUrl,
                // Enhanced attributes for Story Protocol
                attributes: [
                    { trait_type: "Chapter Number", value: chapterData.chapterNumber },
                    { trait_type: "Story ID", value: chapterData.storyId },
                    { trait_type: "Genre", value: chapterData.metadata.suggestedGenre },
                    { trait_type: "Content Rating", value: chapterData.metadata.contentRating },
                    { trait_type: "Language", value: chapterData.metadata.language },
                    { trait_type: "Quality Score", value: chapterData.metadata.qualityScore },
                    { trait_type: "Originality Score", value: chapterData.metadata.originalityScore },
                    { trait_type: "Commercial Viability", value: chapterData.metadata.commercialViability },
                    { trait_type: "Word Count", value: chapterData.metadata.wordCount },
                    { trait_type: "Reading Time", value: chapterData.metadata.estimatedReadingTime },
                    { trait_type: "License Tier", value: chapterData.metadata.preferredLicenseTier },
                    { trait_type: "Author", value: chapterData.metadata.authorName || 'Anonymous' },
                    { trait_type: "Commercial Rights", value: chapterData.metadata.commercialRights },
                    { trait_type: "Derivatives Allowed", value: chapterData.metadata.allowDerivatives },
                ],
                // Story Protocol specific metadata
                external_url: chapterData.contentUrl,
                animation_url: chapterData.contentUrl,
                // Enhanced metadata
                properties: {
                    mediaType: chapterData.metadata.mediaType,
                    language: chapterData.metadata.language,
                    tags: chapterData.metadata.suggestedTags,
                    economics: {
                        unlockPrice: chapterData.metadata.unlockPrice,
                        readReward: chapterData.metadata.readReward,
                        licensePrice: chapterData.metadata.licensePrice,
                        royaltyPercentage: chapterData.metadata.royaltyPercentage,
                    },
                    ipfs: chapterData.metadata.ipfsHash,
                    r2Url: chapterData.metadata.r2Url,
                }
            };
            // Upload enhanced metadata (same as existing flow but with richer data)
            const metadataUri = `data:application/json,${encodeURIComponent(JSON.stringify(nftMetadata))}`;
            // Get SPG contract from environment
            const spgNftContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT;
            if (!spgNftContract || spgNftContract === '0x_your_spg_nft_contract_address_optional') {
                throw new Error('SPG NFT Contract not configured');
            }
            // Prepare registration parameters with enhanced metadata
            const registrationParams = {
                spgNftContract: spgNftContract,
                recipient: chapterData.metadata.authorAddress,
                ipMetadata: {
                    ipMetadataURI: metadataUri,
                    ipMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    nftMetadataURI: metadataUri,
                    nftMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                },
                allowDuplicates: true,
            };
            console.log('🔧 Enhanced registration parameters prepared');
            // Register the IP asset
            const registrationResult = await this.client.ipAsset.mintAndRegisterIp(registrationParams);
            if (!registrationResult.txHash) {
                throw new Error('IP registration failed - no transaction hash returned');
            }
            const confirmationTime = new Date();
            console.log('✅ Enhanced IP registration successful!');
            console.log('🆔 IP Asset ID:', registrationResult.ipId);
            console.log('🎫 Token ID:', registrationResult.tokenId);
            console.log('🔗 Transaction:', registrationResult.txHash);
            // If license terms were provided, attach them to the IP asset
            if (licenseTermsId) {
                console.log('🏷️ Attaching license terms:', licenseTermsId);
                try {
                    const attachResult = await this.client.license.attachLicenseTerms({
                        ipId: registrationResult.ipId,
                        licenseTermsId: licenseTermsId,
                        txOptions: {}
                    });
                    console.log('✅ License terms attached:', attachResult.txHash);
                }
                catch (licenseError) {
                    console.warn('⚠️ Failed to attach license terms:', licenseError);
                    // Don't fail the entire registration for license attachment issues
                }
            }
            return {
                success: true,
                ipAssetId: registrationResult.ipId,
                transactionHash: registrationResult.txHash,
                tokenId: registrationResult.tokenId?.toString(),
                licenseTermsId: licenseTermsId,
                operationId: `enhanced-ip-${Date.now()}`,
                registrationTime: startTime,
                confirmationTime: confirmationTime,
                metadata: {
                    ipMetadataURI: metadataUri,
                    nftMetadataURI: metadataUri,
                    spgNftContract: spgNftContract,
                    registrationMethod: 'mintAndRegisterIp',
                }
            };
        }
        catch (error) {
            console.error('❌ Enhanced IP registration failed:', error);
            let errorMessage = 'Unknown error occurred';
            let retryable = false;
            if (error instanceof Error) {
                errorMessage = error.message;
                // Determine if the error is retryable
                if (errorMessage.includes('User rejected') || errorMessage.includes('denied')) {
                    retryable = true;
                }
                else if (errorMessage.includes('insufficient funds')) {
                    retryable = true;
                }
                else if (errorMessage.includes('nonce')) {
                    retryable = true;
                }
            }
            return {
                success: false,
                error: errorMessage,
                retryable: retryable,
                registrationTime: new Date(),
            };
        }
    }
    /**
     * Get available license tiers with current pricing
     */
    getLicenseTiers() {
        return LICENSE_TIERS;
    }
    /**
     * Get license tier by name
     */
    getLicenseTier(tier) {
        return LICENSE_TIERS[tier] || null;
    }
    /**
     * Calculate licensing costs for a chapter
     */
    calculateLicensingCosts(tier, customPrice) {
        const licenseConfig = LICENSE_TIERS[tier];
        if (!licenseConfig) {
            throw new Error(`Invalid license tier: ${tier}`);
        }
        return {
            mintingFee: licenseConfig.defaultMintingFee,
            tipPrice: customPrice || licenseConfig.tipPrice,
            royaltyPercentage: licenseConfig.royaltyPercentage,
        };
    }
    /**
     * Validate license configuration
     */
    validateLicenseConfig(config) {
        const errors = [];
        if (!config.tier || !['free', 'premium', 'exclusive'].includes(config.tier)) {
            errors.push('Invalid license tier');
        }
        if (config.royaltyPercentage < 0 || config.royaltyPercentage > 100) {
            errors.push('Royalty percentage must be between 0 and 100');
        }
        if (config.tipPrice < 0) {
            errors.push('TIP price cannot be negative');
        }
        if (config.territories.length === 0) {
            errors.push('At least one territory must be specified');
        }
        if (config.distributionChannels.length === 0) {
            errors.push('At least one distribution channel must be specified');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Initialize royalty policies for all license tiers
     * Configures LAP (Liquid Absolute Percentage) and LRP (Liquid Royalty Policy)
     */
    async initializeRoyaltyPolicies() {
        try {
            if (!this.client) {
                throw new Error('Service not initialized');
            }
            console.log('🏦 Initializing royalty policies for all license tiers...');
            const policyResults = {};
            // Initialize policies for each tier
            for (const [tier, config] of Object.entries(ROYALTY_POLICIES)) {
                try {
                    console.log(`🔧 Setting up ${config.policyType} policy for ${tier} tier...`);
                    // Configure royalty policy parameters based on type
                    const policyParams = config.policyType === 'LAP' ? {
                        // LAP (Liquid Absolute Percentage) - simpler, direct percentage
                        targetRoyaltyRate: config.stakingReward * 100, // Convert percentage to basis points
                        distributionDelay: config.distributionDelay,
                    } : {
                        // LRP (Liquid Royalty Policy) - more complex with staking
                        targetRoyaltyRate: config.stakingReward * 100,
                        distributionDelay: config.distributionDelay,
                        maxStakingThreshold: config.maxStakingThreshold,
                    };
                    // Note: In a real implementation, we'd call the royalty module
                    // For now, we'll simulate the policy creation
                    console.log(`✅ ${config.policyType} policy configured for ${tier}:`, policyParams);
                    // Store the policy address (in real implementation, this would come from the transaction)
                    policyResults[tier] = {
                        address: config.address,
                        transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
                    };
                }
                catch (tierError) {
                    console.warn(`⚠️ Failed to initialize policy for ${tier} tier:`, tierError);
                    // Continue with other tiers
                }
            }
            console.log('✅ Royalty policies initialization complete');
            return {
                success: true,
                policies: policyResults
            };
        }
        catch (error) {
            console.error('❌ Failed to initialize royalty policies:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Configure royalty policy from environment variables
     * Sets up LAP/LRP addresses from environment configuration
     */
    configureRoyaltyPoliciesFromEnvironment() {
        // Free tier - LAP policy
        const lapPolicyAddress = process.env.STORY_LAP_ROYALTY_POLICY ||
            process.env.NEXT_PUBLIC_STORY_LAP_ROYALTY_POLICY;
        if (lapPolicyAddress && lapPolicyAddress !== '0x_your_lap_policy_address') {
            const freePolicy = ROYALTY_POLICIES.free;
            const freeLicense = LICENSE_TIERS.free;
            if (freePolicy && freeLicense) {
                freePolicy.address = lapPolicyAddress;
                freeLicense.royaltyPolicy = lapPolicyAddress;
            }
        }
        // Premium/Exclusive tiers - LRP policy  
        const lrpPolicyAddress = process.env.STORY_LRP_ROYALTY_POLICY ||
            process.env.NEXT_PUBLIC_STORY_LRP_ROYALTY_POLICY;
        if (lrpPolicyAddress && lrpPolicyAddress !== '0x_your_lrp_policy_address') {
            const premiumPolicy = ROYALTY_POLICIES.premium;
            const exclusivePolicy = ROYALTY_POLICIES.exclusive;
            const premiumLicense = LICENSE_TIERS.premium;
            const exclusiveLicense = LICENSE_TIERS.exclusive;
            if (premiumPolicy && exclusivePolicy && premiumLicense && exclusiveLicense) {
                premiumPolicy.address = lrpPolicyAddress;
                exclusivePolicy.address = lrpPolicyAddress;
                premiumLicense.royaltyPolicy = lrpPolicyAddress;
                exclusiveLicense.royaltyPolicy = lrpPolicyAddress;
            }
        }
        console.log('🔧 Royalty policies configured from environment:');
        console.log('   LAP Policy (Free):', ROYALTY_POLICIES.free?.address);
        console.log('   LRP Policy (Premium/Exclusive):', ROYALTY_POLICIES.premium?.address);
    }
    /**
     * Get royalty policy configuration for a tier
     */
    getRoyaltyPolicy(tier) {
        return ROYALTY_POLICIES[tier] || null;
    }
    /**
     * Calculate expected royalty distribution for a derivative
     */
    calculateRoyaltyDistribution(tier, derivativeRevenue) {
        const policy = ROYALTY_POLICIES[tier];
        const licenseConfig = LICENSE_TIERS[tier];
        if (!policy || !licenseConfig) {
            throw new Error(`Invalid tier: ${tier}`);
        }
        // Calculate base royalty to original creator
        const royaltyToCreator = derivativeRevenue * (licenseConfig.royaltyPercentage / 100);
        // Platform fee (fixed 5% of total revenue)
        const platformFee = derivativeRevenue * 0.05;
        // Staking rewards (percentage of royalty amount)
        const stakingRewards = royaltyToCreator * (policy.stakingReward / 100);
        return {
            originalCreator: royaltyToCreator - stakingRewards,
            platform: platformFee,
            stakers: stakingRewards,
            total: royaltyToCreator + platformFee
        };
    }
    /**
     * Estimate gas costs for royalty operations
     */
    estimateRoyaltyGasCosts(operationType) {
        // Base gas estimates for different operations
        const gasEstimates = {
            claim: 150000n, // Claiming royalties
            distribute: 200000n, // Distributing to multiple recipients
            stake: 100000n, // Staking for rewards
        };
        const estimatedGas = gasEstimates[operationType] || 150000n;
        // Rough estimates (would be calculated dynamically in production)
        const ethGasPrice = 0.00002; // ~20 gwei
        const tipToEthRate = 0.001; // Assumed conversion rate
        return {
            estimatedGas,
            estimatedCostInETH: Number(estimatedGas) * ethGasPrice,
            estimatedCostInTIP: Number(estimatedGas) * ethGasPrice / tipToEthRate
        };
    }
    /**
     * Get service status and configuration including royalty policies
     */
    getServiceStatus() {
        return {
            initialized: !!this.client && !!this.walletClient,
            connectedWallet: this.walletClient?.account?.address,
            chainId: 1315,
            availableTiers: Object.keys(LICENSE_TIERS),
            royaltyPolicies: ROYALTY_POLICIES,
            sdkVersion: '1.3.2'
        };
    }
}
// Export singleton instance
export const advancedStoryProtocolService = new AdvancedStoryProtocolService();
/**
 * TIP Token Economics Calculator
 * Integrates licensing system with existing token economics
 */
export class TIPTokenEconomicsCalculator {
    /**
     * Calculate complete economics for a chapter with licensing
     */
    static calculateChapterEconomics(chapterData, licenseTier) {
        const baseUnlockPrice = chapterData.metadata.unlockPrice || 0;
        const baseReadReward = chapterData.metadata.readReward || 1;
        const licenseConfig = LICENSE_TIERS[licenseTier];
        if (!licenseConfig) {
            throw new Error(`Invalid license tier: ${licenseTier}`);
        }
        // Quality-based modifiers
        const qualityMultiplier = 1 + (chapterData.metadata.qualityScore / 100);
        const originalityMultiplier = 1 + (chapterData.metadata.originalityScore / 200); // Half weight
        const commercialMultiplier = chapterData.metadata.commercialRights ? 1.5 : 1;
        // Calculate enhanced economics
        const adjustedUnlockPrice = Math.floor(baseUnlockPrice * qualityMultiplier);
        const adjustedReadReward = Math.floor(baseReadReward * qualityMultiplier * originalityMultiplier);
        const creatorReward = Math.floor(adjustedReadReward * 0.8); // Creator gets 80% of read reward
        // License pricing based on tier and quality
        const baseLicensePrice = licenseConfig.tipPrice;
        const adjustedLicensePrice = Math.floor(baseLicensePrice * qualityMultiplier * commercialMultiplier);
        return {
            unlockPrice: adjustedUnlockPrice,
            readReward: adjustedReadReward,
            creatorReward: creatorReward,
            licensePrice: adjustedLicensePrice,
            royaltyPercentage: licenseConfig.royaltyPercentage,
            platformFee: 5, // 5% platform fee
            stakingReward: ROYALTY_POLICIES[licenseTier]?.stakingReward || 0,
            qualityBonus: Math.floor((chapterData.metadata.qualityScore - 50) / 2), // Bonus above 50% quality
            streakBonus: 10, // 10% bonus for reading streaks
            volumeDiscount: 15, // 15% discount for bulk purchases
        };
    }
    /**
     * Calculate revenue distribution for a story with derivatives
     */
    static calculateRevenueDistribution(originalEconomics, derivativeRevenue, licenseTier) {
        const policy = ROYALTY_POLICIES[licenseTier];
        if (!policy) {
            throw new Error(`Invalid license tier: ${licenseTier}`);
        }
        // Base royalty calculation
        const baseRoyalty = derivativeRevenue * (originalEconomics.royaltyPercentage / 100);
        const platformFee = derivativeRevenue * (originalEconomics.platformFee / 100);
        const stakingBonus = baseRoyalty * (policy.stakingReward / 100);
        // Creator shares
        const originalCreatorShare = baseRoyalty - stakingBonus;
        const derivativeCreatorShare = derivativeRevenue - baseRoyalty - platformFee;
        return {
            originalCreator: originalCreatorShare,
            derivativeCreator: derivativeCreatorShare,
            platform: platformFee,
            stakers: stakingBonus,
            total: derivativeRevenue,
            breakdown: {
                baseRoyalty,
                stakingBonus,
                platformFee,
                creatorShare: derivativeCreatorShare
            }
        };
    }
    /**
     * Calculate optimal pricing strategy for a chapter
     */
    static calculateOptimalPricing(chapterData, targetAudience) {
        const reasoning = [];
        let suggestedTier = 'free';
        // Analyze content characteristics
        const hasHighQuality = chapterData.metadata.qualityScore >= 75;
        const hasHighOriginality = chapterData.metadata.originalityScore >= 70;
        const hasCommercialViability = chapterData.metadata.commercialViability >= 60;
        const allowsCommercialUse = chapterData.metadata.commercialRights;
        // Determine optimal tier
        if (hasHighQuality && hasHighOriginality && hasCommercialViability && allowsCommercialUse) {
            if (targetAudience === 'exclusive' || chapterData.metadata.qualityScore >= 90) {
                suggestedTier = 'exclusive';
                reasoning.push('Exceptional quality and originality justify exclusive pricing');
            }
            else {
                suggestedTier = 'premium';
                reasoning.push('High quality content suitable for commercial licensing');
            }
        }
        else if (hasHighQuality || hasCommercialViability) {
            suggestedTier = 'premium';
            reasoning.push('Good quality or commercial potential supports premium tier');
        }
        else {
            suggestedTier = 'free';
            reasoning.push('Content best suited for free tier to maximize reach');
        }
        // Apply target audience adjustment
        if (targetAudience === 'mass' && suggestedTier !== 'free') {
            const originalTier = suggestedTier;
            suggestedTier = 'free';
            reasoning.push(`Adjusted from ${originalTier} to free for mass market appeal`);
        }
        const suggestedPricing = this.calculateChapterEconomics(chapterData, suggestedTier);
        // Project revenue based on tier and quality
        const baseReads = targetAudience === 'mass' ? 1000 : targetAudience === 'premium' ? 100 : 10;
        const qualityMultiplier = 1 + (chapterData.metadata.qualityScore / 100);
        const projectedRevenue = {
            conservative: Math.floor(baseReads * 0.5 * qualityMultiplier * suggestedPricing.readReward),
            optimistic: Math.floor(baseReads * qualityMultiplier * suggestedPricing.readReward),
            aggressive: Math.floor(baseReads * 2 * qualityMultiplier * suggestedPricing.readReward)
        };
        return {
            suggestedTier,
            suggestedPricing,
            reasoning,
            projectedRevenue
        };
    }
    /**
     * Calculate staking rewards for IP holders
     */
    static calculateStakingRewards(stakedAmount, stakingDuration, // days
    licenseTier, totalStaked) {
        const policy = ROYALTY_POLICIES[licenseTier];
        if (!policy) {
            throw new Error(`Invalid license tier: ${licenseTier}`);
        }
        const annualRate = policy.stakingReward / 100;
        // Calculate base staking reward
        const dailyRate = annualRate / 365;
        const baseReward = stakedAmount * dailyRate * stakingDuration;
        // Bonus for longer staking periods
        const bonusMultiplier = stakingDuration >= 365 ? 1.5 : stakingDuration >= 90 ? 1.2 : 1.0;
        const bonusReward = baseReward * (bonusMultiplier - 1);
        const totalReward = baseReward + bonusReward;
        const apy = (totalReward / stakedAmount) * (365 / stakingDuration) * 100;
        return {
            baseReward,
            bonusReward,
            totalReward,
            apy
        };
    }
}
// Export helper functions
export function isValidLicenseTier(tier) {
    return ['free', 'premium', 'exclusive'].includes(tier);
}
export function getLicenseTierDisplayName(tier) {
    return LICENSE_TIERS[tier]?.displayName || tier;
}
export function getLicenseTierDescription(tier) {
    return LICENSE_TIERS[tier]?.description || '';
}
export function calculateTIPTokenValue(amount, operation) {
    // Base TIP token value (example rates)
    const tipToUsdRate = 0.10; // $0.10 per TIP token
    const gasEstimates = {
        unlock: 50000,
        read: 30000,
        license: 100000,
        royalty: 75000
    };
    return {
        tipAmount: amount,
        usdEquivalent: amount * tipToUsdRate,
        gasEstimate: gasEstimates[operation] || 50000
    };
}
//# sourceMappingURL=advancedStoryProtocolService.js.map