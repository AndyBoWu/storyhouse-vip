/**
 * @fileoverview Real IP Service for Story Protocol integration
 * Handles IP asset registration, licensing, and royalty management with actual blockchain calls
 */
import { StoryClient } from '@story-protocol/core-sdk';
import type { Address, Hash } from 'viem';
import type { IPAsset, LicenseTerms, LicenseTier, StoryWithIP, RegisterIPAssetResponse, CreateLicenseResponse, PurchaseLicenseResponse, CreateDerivativeResponse, ClaimRoyaltyResponse, StoryProtocolConfig } from '../types/ip';
export declare class IPService {
    private config;
    private blockchainConfig;
    private storyClient;
    private publicClient;
    private walletClient;
    private isInitialized;
    constructor(config?: StoryProtocolConfig);
    /**
     * Initialize Story Protocol SDK client and Viem clients
     */
    private initializeClients;
    /**
     * Execute operation with retry logic and error handling
     */
    private executeWithRetry;
    /**
     * Register a story as an IP Asset on Story Protocol
     */
    registerStoryAsIPAsset(story: StoryWithIP, nftContract: Address, tokenId: string, account: Address): Promise<RegisterIPAssetResponse>;
    /**
     * Create license terms for a story matching your current tier system
     */
    createLicenseTermsForTier(tier: LicenseTier, royaltyPolicyAddress: Address, account: Address): Promise<CreateLicenseResponse>;
    /**
     * Attach license terms to an IP Asset
     */
    attachLicenseToIPAsset(ipAssetId: string, licenseTermsId: string, account: Address): Promise<{
        success: boolean;
        transactionHash?: Hash;
        error?: string;
    }>;
    /**
     * Purchase a license for remixing (mint license token)
     */
    purchaseRemixLicense(ipAssetId: string, licenseTermsId: string, recipient: Address, account: Address): Promise<PurchaseLicenseResponse>;
    /**
     * Register a remix/derivative story
     */
    registerDerivativeStory(derivativeNftContract: Address, derivativeTokenId: string, parentIpAssetIds: string[], licenseTokenIds: string[], account: Address): Promise<CreateDerivativeResponse>;
    /**
     * Claim royalties for an IP Asset
     */
    claimRoyalties(ipAssetId: string, recipient: Address, currencyTokens: Address[], account: Address): Promise<ClaimRoyaltyResponse>;
    /**
     * Get IP Asset information from blockchain
     */
    getIPAsset(ipAssetId: string): Promise<IPAsset | null>;
    /**
     * Get license terms information from blockchain
     */
    getLicenseTerms(licenseTermsId: string): Promise<LicenseTerms | null>;
    /**
     * Test Story Protocol connection with real blockchain call
     */
    testConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    getDefaultLicenseTiers(): Record<string, LicenseTier>;
    isAvailable(): boolean;
    getConfig(): StoryProtocolConfig;
    getStoryClient(): StoryClient | null;
}
export declare function createIPService(config?: StoryProtocolConfig): IPService;
export declare const defaultStoryProtocolConfig: StoryProtocolConfig;
//# sourceMappingURL=ipService.d.ts.map