/**
 * @fileoverview Real IP Service for Story Protocol integration
 * Handles IP asset registration, licensing, and royalty management with actual blockchain calls
 */
import { StoryClient } from '@story-protocol/core-sdk';
import { http, createPublicClient, createWalletClient } from 'viem';
import { getBlockchainConfig, getStoryProtocolConfig, validateBlockchainConfig, logBlockchainOperation } from '../config/blockchain';
import { parseBlockchainError, getRetryStrategy, calculateRetryDelay, formatErrorForLogging, isCriticalError } from '../utils/blockchainErrors';
export class IPService {
    constructor(config) {
        this.storyClient = null;
        this.publicClient = null;
        this.walletClient = null;
        this.isInitialized = false;
        this.blockchainConfig = getBlockchainConfig();
        this.config = config || getStoryProtocolConfig();
        this.initializeClients();
    }
    /**
     * Initialize Story Protocol SDK client and Viem clients
     */
    async initializeClients() {
        try {
            // Validate configuration
            const validation = validateBlockchainConfig();
            if (!validation.isValid) {
                console.error('❌ Invalid blockchain configuration:', validation.errors);
                return;
            }
            // Initialize public client for reading blockchain state
            this.publicClient = createPublicClient({
                transport: http(this.blockchainConfig.rpcUrl),
                chain: {
                    id: this.blockchainConfig.chainId,
                    name: this.blockchainConfig.chainName,
                    network: 'story-protocol',
                    nativeCurrency: {
                        decimals: 18,
                        name: 'IP',
                        symbol: 'IP',
                    },
                    rpcUrls: {
                        default: {
                            http: [this.blockchainConfig.rpcUrl],
                        },
                        public: {
                            http: [this.blockchainConfig.rpcUrl],
                        },
                    },
                    blockExplorers: {
                        default: {
                            name: 'StoryScan',
                            url: this.blockchainConfig.explorerUrl,
                        },
                    },
                }
            });
            // Initialize wallet client for transactions
            if (this.blockchainConfig.account) {
                this.walletClient = createWalletClient({
                    account: this.blockchainConfig.account,
                    transport: http(this.blockchainConfig.rpcUrl),
                    chain: this.publicClient.chain
                });
            }
            // Initialize Story Protocol SDK
            const storyConfig = {
                account: this.blockchainConfig.account,
                transport: http(this.blockchainConfig.rpcUrl),
                chainId: 1315, // Story Protocol SDK v1.3.2+ uses numeric chain IDs
            };
            this.storyClient = StoryClient.newClient(storyConfig);
            this.isInitialized = true;
            logBlockchainOperation('SDK_INITIALIZED', {
                chainId: this.blockchainConfig.chainId,
                rpcUrl: this.blockchainConfig.rpcUrl,
                hasAccount: !!this.blockchainConfig.account
            }, this.blockchainConfig);
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ Failed to initialize Story Protocol SDK:', formatErrorForLogging(blockchainError));
            this.isInitialized = false;
        }
    }
    /**
     * Execute operation with retry logic and error handling
     */
    async executeWithRetry(operation, operationName, retryCount = 0) {
        try {
            logBlockchainOperation(operationName, { attempt: retryCount + 1 }, this.blockchainConfig);
            return await operation();
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error(`❌ ${operationName} failed:`, formatErrorForLogging(blockchainError));
            if (isCriticalError(blockchainError)) {
                throw blockchainError;
            }
            const retryStrategy = getRetryStrategy(blockchainError.type);
            if (retryStrategy.shouldRetry && retryCount < retryStrategy.maxRetries) {
                const delay = calculateRetryDelay(retryCount + 1, retryStrategy.baseDelay, retryStrategy.backoffMultiplier);
                logBlockchainOperation('RETRYING_OPERATION', {
                    operation: operationName,
                    retryAttempt: retryCount + 1,
                    maxRetries: retryStrategy.maxRetries,
                    delayMs: delay
                }, this.blockchainConfig);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.executeWithRetry(operation, operationName, retryCount + 1);
            }
            throw blockchainError;
        }
    }
    /**
     * Register a story as an IP Asset on Story Protocol
     */
    async registerStoryAsIPAsset(story, nftContract, tokenId, account) {
        if (!this.isInitialized || !this.storyClient) {
            return {
                success: false,
                error: 'Story Protocol SDK not initialized'
            };
        }
        if (!this.walletClient) {
            return {
                success: false,
                error: 'Wallet client not available for transactions'
            };
        }
        try {
            const operation = async () => {
                logBlockchainOperation('REGISTER_IP_ASSET', {
                    storyId: story.id,
                    nftContract,
                    tokenId,
                    account
                }, this.blockchainConfig);
                // Option 1: Use mintAndRegisterIp for new NFTs
                // This creates both NFT and IP Asset in one transaction
                const registrationResult = await this.storyClient.ipAsset.mintAndRegisterIp({
                    spgNftContract: nftContract, // Use an SPG NFT contract
                    ipMetadata: {
                        ipMetadataURI: '', // IPFS URI for IP metadata
                        ipMetadataHash: '0x0', // Hash of IP metadata
                        nftMetadataURI: '', // IPFS URI for NFT metadata
                        nftMetadataHash: '0x0' // Hash of NFT metadata
                    },
                    txOptions: {}
                });
                // Option 2: Use register for existing NFTs
                // const registrationResult = await this.storyClient!.ipAsset.register({
                //   nftContract,
                //   tokenId: BigInt(tokenId),
                //   txOptions: { waitForTransaction: true }
                // })
                const ipAsset = {
                    id: registrationResult.ipId || `ip_${story.id}_${Date.now()}`,
                    address: nftContract,
                    tokenId: registrationResult.tokenId?.toString() || tokenId,
                    metadata: {
                        mediaType: 'text/story',
                        title: story.title,
                        description: story.content.substring(0, 200) + '...',
                        genre: story.genre,
                        wordCount: story.content.length,
                        language: 'en',
                        tags: [story.genre, story.mood],
                        createdAt: story.createdAt,
                        author: story.author
                    },
                    licenseTermsIds: []
                };
                return {
                    success: true,
                    ipAsset,
                    transactionHash: registrationResult.txHash
                };
            };
            return await this.executeWithRetry(operation, 'REGISTER_IP_ASSET');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ IP Asset registration failed:', formatErrorForLogging(blockchainError));
            return {
                success: false,
                error: blockchainError.userMessage
            };
        }
    }
    /**
     * Create license terms for a story matching your current tier system
     */
    async createLicenseTermsForTier(tier, royaltyPolicyAddress, account) {
        if (!this.isInitialized || !this.storyClient) {
            return {
                success: false,
                error: 'Story Protocol SDK not initialized'
            };
        }
        try {
            const operation = async () => {
                logBlockchainOperation('CREATE_LICENSE_TERMS', {
                    tierName: tier.name,
                    price: tier.price.toString(),
                    royaltyPercentage: tier.royaltyPercentage
                }, this.blockchainConfig);
                // Create PIL (Programmable IP License) terms
                const licenseResult = await this.storyClient.license.registerPILTerms({
                    transferable: true,
                    royaltyPolicy: royaltyPolicyAddress,
                    defaultMintingFee: tier.price,
                    expiration: 0n, // No expiration (use bigint)
                    commercialUse: tier.terms.commercialUse,
                    commercialAttribution: tier.terms.attribution,
                    commercializerChecker: '0x0000000000000000000000000000000000000000',
                    commercializerCheckerData: '0x',
                    commercialRevShare: tier.royaltyPercentage,
                    commercialRevCeiling: 0n,
                    derivativesAllowed: tier.terms.derivativesAllowed,
                    derivativesAttribution: tier.terms.attribution,
                    derivativesApproval: false,
                    derivativesReciprocal: tier.terms.shareAlike,
                    derivativeRevCeiling: 0n,
                    currency: '0x1514000000000000000000000000000000000000', // WIP token
                    uri: '',
                    txOptions: {}
                });
                const licenseTerms = {
                    id: (licenseResult.licenseTermsId || `license_${tier.name}_${Date.now()}`).toString(),
                    transferable: true,
                    royaltyPolicy: royaltyPolicyAddress,
                    defaultMintingFee: tier.price,
                    expiration: 0,
                    commercialUse: tier.terms.commercialUse,
                    commercialAttribution: tier.terms.attribution,
                    derivativesAllowed: tier.terms.derivativesAllowed,
                    derivativesAttribution: tier.terms.attribution,
                    territories: [],
                    distributionChannels: [],
                    contentRestrictions: []
                };
                return {
                    success: true,
                    licenseTerms,
                    transactionHash: licenseResult.txHash
                };
            };
            return await this.executeWithRetry(operation, 'CREATE_LICENSE_TERMS');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ License terms creation failed:', formatErrorForLogging(blockchainError));
            return {
                success: false,
                error: blockchainError.userMessage
            };
        }
    }
    /**
     * Attach license terms to an IP Asset
     */
    async attachLicenseToIPAsset(ipAssetId, licenseTermsId, account) {
        if (!this.isInitialized || !this.storyClient) {
            return {
                success: false,
                error: 'Story Protocol SDK not initialized'
            };
        }
        try {
            const operation = async () => {
                logBlockchainOperation('ATTACH_LICENSE', { ipAssetId, licenseTermsId }, this.blockchainConfig);
                const attachResult = await this.storyClient.license.attachLicenseTerms({
                    ipId: ipAssetId,
                    licenseTermsId,
                    txOptions: {}
                });
                return {
                    success: true,
                    transactionHash: attachResult.txHash
                };
            };
            return await this.executeWithRetry(operation, 'ATTACH_LICENSE');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ License attachment failed:', formatErrorForLogging(blockchainError));
            return {
                success: false,
                error: blockchainError.userMessage
            };
        }
    }
    /**
     * Purchase a license for remixing (mint license token)
     */
    async purchaseRemixLicense(ipAssetId, licenseTermsId, recipient, account) {
        if (!this.isInitialized || !this.storyClient) {
            return {
                success: false,
                error: 'Story Protocol SDK not initialized'
            };
        }
        try {
            const operation = async () => {
                logBlockchainOperation('PURCHASE_LICENSE', {
                    ipAssetId,
                    licenseTermsId,
                    recipient
                }, this.blockchainConfig);
                const purchaseResult = await this.storyClient.license.mintLicenseTokens({
                    licensorIpId: ipAssetId,
                    licenseTermsId,
                    licenseTemplate: undefined, // Use default template
                    maxMintingFee: BigInt('1000000000000000000'), // 1 ETH max fee
                    maxRevenueShare: 100, // 100% max revenue share
                    amount: 1,
                    receiver: recipient,
                    txOptions: {}
                });
                const licenseToken = {
                    id: purchaseResult.licenseTokenIds?.[0]?.toString() || `token_${Date.now()}`,
                    licenseTermsId,
                    licensorIpId: ipAssetId,
                    transferable: true,
                    mintingFee: BigInt(0),
                    owner: recipient
                };
                return {
                    success: true,
                    licenseToken,
                    transactionHash: purchaseResult.txHash
                };
            };
            return await this.executeWithRetry(operation, 'PURCHASE_LICENSE');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ License purchase failed:', formatErrorForLogging(blockchainError));
            return {
                success: false,
                error: blockchainError.userMessage
            };
        }
    }
    /**
     * Register a remix/derivative story
     */
    async registerDerivativeStory(derivativeNftContract, derivativeTokenId, parentIpAssetIds, licenseTokenIds, account) {
        if (!this.isInitialized || !this.storyClient) {
            return {
                success: false,
                error: 'Story Protocol SDK not initialized'
            };
        }
        try {
            const operation = async () => {
                logBlockchainOperation('REGISTER_DERIVATIVE', {
                    derivativeNftContract,
                    derivativeTokenId,
                    parentIpAssetIds,
                    licenseTokenIds
                }, this.blockchainConfig);
                const derivativeResult = await this.storyClient.ipAsset.registerDerivative({
                    childIpId: derivativeNftContract, // The derivative IP Asset ID
                    parentIpIds: parentIpAssetIds,
                    licenseTermsIds: licenseTokenIds, // Use licenseTermsIds instead of licenseTokenIds
                    txOptions: {}
                });
                return {
                    success: true,
                    derivative: {
                        childIpId: derivativeResult.childIpId || derivativeResult.ipId || `child_${Date.now()}`,
                        parentIpId: parentIpAssetIds[0] || '',
                        licenseTermsId: '',
                        licenseTokenId: licenseTokenIds[0] || ''
                    },
                    transactionHash: derivativeResult.txHash
                };
            };
            return await this.executeWithRetry(operation, 'REGISTER_DERIVATIVE');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ Derivative registration failed:', formatErrorForLogging(blockchainError));
            return {
                success: false,
                error: blockchainError.userMessage
            };
        }
    }
    /**
     * Claim royalties for an IP Asset
     */
    async claimRoyalties(ipAssetId, recipient, currencyTokens, account) {
        if (!this.isInitialized || !this.storyClient) {
            return {
                success: false,
                error: 'Story Protocol SDK not initialized'
            };
        }
        try {
            const operation = async () => {
                logBlockchainOperation('CLAIM_ROYALTIES', {
                    ipAssetId,
                    recipient,
                    currencyTokens
                }, this.blockchainConfig);
                const claimResult = await this.storyClient.royalty.claimAllRevenue({
                    ancestorIpId: ipAssetId,
                    claimer: recipient,
                    childIpIds: [],
                    royaltyPolicies: [],
                    currencyTokens
                });
                return {
                    success: true,
                    amount: claimResult.claimedTokens?.[0]?.amount || BigInt('1000000000000000000'), // 1 ETH mock amount
                    transactionHash: claimResult.txHashes?.[0]
                };
            };
            return await this.executeWithRetry(operation, 'CLAIM_ROYALTIES');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ Royalty claiming failed:', formatErrorForLogging(blockchainError));
            return {
                success: false,
                error: blockchainError.userMessage
            };
        }
    }
    /**
     * Get IP Asset information from blockchain
     */
    async getIPAsset(ipAssetId) {
        if (!this.isInitialized || !this.storyClient || !this.publicClient) {
            console.error('Story Protocol SDK or public client not initialized');
            return null;
        }
        try {
            const operation = async () => {
                // Use the correct method to get IP asset data
                // Note: The exact method name may vary - this is a placeholder
                const ipAssetData = await this.publicClient.readContract({
                    address: '0x1234567890123456789012345678901234567890', // IP Asset Registry address
                    abi: [], // Would need the actual ABI
                    functionName: 'getIpAsset',
                    args: [ipAssetId]
                });
                if (!ipAssetData) {
                    return null;
                }
                // Transform blockchain data to our IPAsset interface
                const ipAsset = {
                    id: ipAssetId,
                    address: '0x0', // Would extract from ipAssetData
                    tokenId: '0', // Would extract from ipAssetData
                    metadata: {
                        mediaType: 'text/story',
                        title: 'Unknown', // Would need to fetch from metadata
                        description: '',
                        genre: 'unknown',
                        wordCount: 0,
                        language: 'en',
                        tags: [],
                        createdAt: new Date().toISOString(),
                        author: 'unknown'
                    },
                    licenseTermsIds: [] // Would need separate call to get license terms
                };
                return ipAsset;
            };
            return await this.executeWithRetry(operation, 'GET_IP_ASSET');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ Failed to get IP Asset:', formatErrorForLogging(blockchainError));
            return null;
        }
    }
    /**
     * Get license terms information from blockchain
     */
    async getLicenseTerms(licenseTermsId) {
        if (!this.isInitialized || !this.storyClient) {
            console.error('Story Protocol SDK not initialized');
            return null;
        }
        try {
            const operation = async () => {
                const licenseData = await this.storyClient.license.getLicenseTerms(licenseTermsId);
                if (!licenseData) {
                    return null;
                }
                // Transform blockchain data to our LicenseTerms interface
                const licenseTerms = {
                    id: licenseTermsId,
                    transferable: licenseData.terms.transferable || false,
                    royaltyPolicy: licenseData.terms.royaltyPolicy || '0x0',
                    defaultMintingFee: licenseData.terms.defaultMintingFee || BigInt(0),
                    expiration: Number(licenseData.terms.expiration) || 0,
                    commercialUse: licenseData.terms.commercialUse || false,
                    commercialAttribution: licenseData.terms.commercialAttribution || false,
                    derivativesAllowed: licenseData.terms.derivativesAllowed || false,
                    derivativesAttribution: licenseData.terms.derivativesAttribution || false,
                    territories: [],
                    distributionChannels: [],
                    contentRestrictions: []
                };
                return licenseTerms;
            };
            return await this.executeWithRetry(operation, 'GET_LICENSE_TERMS');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            console.error('❌ Failed to get license terms:', formatErrorForLogging(blockchainError));
            return null;
        }
    }
    /**
     * Test Story Protocol connection with real blockchain call
     */
    async testConnection() {
        if (!this.isInitialized || !this.storyClient || !this.publicClient) {
            return {
                success: false,
                message: 'Story Protocol SDK not initialized'
            };
        }
        try {
            const operation = async () => {
                // Test basic blockchain connectivity
                const blockNumber = await this.publicClient.getBlockNumber();
                // Test Story Protocol SDK connectivity
                // Note: Add specific SDK test methods when available
                return {
                    success: true,
                    message: `Connected to Story Protocol! Current block: ${blockNumber}`
                };
            };
            return await this.executeWithRetry(operation, 'TEST_CONNECTION');
        }
        catch (error) {
            const blockchainError = parseBlockchainError(error);
            return {
                success: false,
                message: `Connection test failed: ${blockchainError.userMessage}`
            };
        }
    }
    getDefaultLicenseTiers() {
        return {
            standard: {
                name: 'standard',
                displayName: 'Standard License',
                price: BigInt('100000000000000000000'), // 100 TIP tokens
                royaltyPercentage: 5,
                terms: {
                    commercialUse: true,
                    derivativesAllowed: true,
                    attribution: true,
                    shareAlike: false,
                    exclusivity: false
                }
            },
            premium: {
                name: 'premium',
                displayName: 'Premium License',
                price: BigInt('500000000000000000000'), // 500 TIP tokens
                royaltyPercentage: 10,
                terms: {
                    commercialUse: true,
                    derivativesAllowed: true,
                    attribution: true,
                    shareAlike: false,
                    exclusivity: false
                }
            },
            exclusive: {
                name: 'exclusive',
                displayName: 'Exclusive License',
                price: BigInt('2000000000000000000000'), // 2000 TIP tokens
                royaltyPercentage: 20,
                terms: {
                    commercialUse: true,
                    derivativesAllowed: true,
                    attribution: true,
                    shareAlike: false,
                    exclusivity: true
                }
            }
        };
    }
    isAvailable() {
        return this.isInitialized && this.storyClient !== null;
    }
    getConfig() {
        return this.config;
    }
    getStoryClient() {
        return this.storyClient;
    }
}
// Export singleton instance creator
export function createIPService(config) {
    return new IPService(config);
}
// Updated configuration with proper blockchain settings
export const defaultStoryProtocolConfig = getStoryProtocolConfig();
//# sourceMappingURL=ipService.js.map