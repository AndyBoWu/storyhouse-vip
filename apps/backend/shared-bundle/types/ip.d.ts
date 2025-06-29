/**
 * @fileoverview IP Asset types for Story Protocol integration
 * Extends existing story types with IP functionality
 */
import type { Address, Hash } from 'viem';
export interface IPAsset {
    id: string;
    address: Address;
    tokenId: string;
    metadata: IPMetadata;
    licenseTermsIds: string[];
    royaltyPolicyAddress?: Address;
}
export interface IPMetadata {
    mediaType: 'text/story';
    title: string;
    description: string;
    genre: string;
    wordCount: number;
    language: string;
    tags: string[];
    createdAt: string;
    author: string;
}
export interface LicenseTerms {
    id: string;
    transferable: boolean;
    royaltyPolicy: Address;
    defaultMintingFee: bigint;
    expiration: number;
    commercialUse: boolean;
    commercialAttribution: boolean;
    derivativesAllowed: boolean;
    derivativesAttribution: boolean;
    territories: string[];
    distributionChannels: string[];
    contentRestrictions: string[];
}
export interface LicenseToken {
    id: string;
    licenseTermsId: string;
    licensorIpId: string;
    transferable: boolean;
    mintingFee: bigint;
    owner: Address;
}
export interface Derivative {
    childIpId: string;
    parentIpId: string;
    licenseTermsId: string;
    licenseTokenId?: string;
}
export interface RoyaltyDistribution {
    ipId: string;
    amount: bigint;
    currency: Address;
    recipients: Address[];
    shares: number[];
}
export interface StoryWithIP {
    id: string;
    title: string;
    content: string;
    author: string;
    genre: string;
    mood: string;
    emoji: string;
    createdAt: string;
    ipAssetId?: string;
    ipAssetAddress?: Address;
    tokenId?: string;
    licenseTermsId?: string;
    ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed';
    ipRegistrationTxHash?: Hash;
    licenseStatus: 'none' | 'attached' | 'available';
    availableLicenseTypes: LicenseTier[];
    parentStoryId?: string;
    parentIpAssetId?: string;
    derivativeChain?: string[];
    royaltyEarnings?: bigint;
    hasClaimableRoyalties?: boolean;
}
export interface ChapterWithIP {
    id: string;
    storyId: string;
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
    ipAssetId?: string;
    ipAssetAddress?: Address;
    tokenId?: string;
    ipRegistrationStatus: 'none' | 'pending' | 'registered' | 'failed';
    isPartOfStoryIP: boolean;
}
export interface LicenseTier {
    name: 'standard' | 'premium' | 'exclusive';
    displayName: string;
    price: bigint;
    royaltyPercentage: number;
    terms: {
        commercialUse: boolean;
        derivativesAllowed: boolean;
        attribution: boolean;
        shareAlike: boolean;
        exclusivity: boolean;
    };
    storyProtocolTermsId?: string;
}
export interface StoryCollection {
    id: string;
    name: string;
    description: string;
    groupId?: string;
    groupPoolAddress?: Address;
    rewardPoolAddress?: Address;
    isPublic: boolean;
    allowContributions: boolean;
    shareDistribution: {
        creator: number;
        collection: number;
        platform: number;
    };
    creators: Address[];
    stories: string[];
    ipAssets: string[];
    genre?: string;
    theme?: string;
    tags: string[];
    totalEarnings?: bigint;
    memberCount: number;
    storyCount: number;
}
export interface IPOperation {
    id: string;
    storyId: string;
    operationType: 'register' | 'license' | 'derivative' | 'royalty' | 'collection';
    transactionHash?: Hash;
    status: 'pending' | 'success' | 'failed';
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    operationData?: {
        ipAssetId?: string;
        licenseTokenId?: string;
        parentIpAssetId?: string;
        royaltyAmount?: bigint;
        collectionId?: string;
    };
}
export interface StoryProtocolConfig {
    chainId: number;
    rpcUrl: string;
    apiKey?: string;
    contracts?: {
        ipAssetRegistry?: Address;
        licensingModule?: Address;
        royaltyModule?: Address;
        groupModule?: Address;
    };
    defaultLicenseTiers: Record<string, LicenseTier>;
    defaultCollectionSettings: {
        revenueShareCreator: number;
        revenueShareCollection: number;
        revenueSharePlatform: number;
    };
}
export interface LicenseTermsConfig {
    tier: 'free' | 'premium' | 'exclusive';
    displayName: string;
    description: string;
    transferable: boolean;
    royaltyPolicy: Address;
    defaultMintingFee: bigint;
    expiration: number;
    commercialUse: boolean;
    commercialAttribution: boolean;
    derivativesAllowed: boolean;
    derivativesAttribution: boolean;
    territories: string[];
    distributionChannels: string[];
    contentRestrictions: string[];
    tipPrice: number;
    royaltyPercentage: number;
    exclusivity: boolean;
    shareAlike: boolean;
    attribution: boolean;
}
export interface EnhancedChapterIPData {
    storyId: string;
    chapterNumber: number;
    title: string;
    content: string;
    contentUrl: string;
    metadata: {
        suggestedTags: string[];
        suggestedGenre: string;
        contentRating: 'G' | 'PG' | 'PG-13' | 'R';
        language: string;
        qualityScore: number;
        originalityScore: number;
        commercialViability: number;
        wordCount: number;
        estimatedReadingTime: number;
        authorAddress: Address;
        authorName?: string;
        preferredLicenseTier: 'free' | 'premium' | 'exclusive';
        allowDerivatives: boolean;
        commercialRights: boolean;
        unlockPrice: number;
        readReward: number;
        licensePrice: number;
        royaltyPercentage: number;
        createdAt: Date;
        updatedAt: Date;
        ipfsHash?: string;
        r2Url?: string;
        mediaType: 'text/story';
        rights?: string;
        source?: string;
    };
    licenseConfig?: LicenseTermsConfig;
    collectionId?: string;
    parentIpAssetId?: string;
    isRemix: boolean;
    remixSourceStoryId?: string;
}
export interface EnhancedIPRegistrationResult {
    success: boolean;
    ipAssetId?: string;
    transactionHash?: Hash;
    tokenId?: string;
    licenseTermsId?: string;
    licenseTokenId?: string;
    operationId?: string;
    gasUsed?: bigint;
    gasPrice?: bigint;
    blockNumber?: number;
    registrationTime?: Date;
    confirmationTime?: Date;
    error?: string;
    errorCode?: string;
    retryable?: boolean;
    metadata?: {
        ipMetadataURI?: string;
        nftMetadataURI?: string;
        spgNftContract?: Address;
        registrationMethod: 'mintAndRegisterIp' | 'registerIp';
    };
}
export interface ChapterGenealogy {
    chapterId: string;
    ipAssetId?: string;
    parentIpAssetIds: string[];
    childIpAssetIds: string[];
    ancestorIds: string[];
    descendantIds: string[];
    relationships: {
        ipAssetId: string;
        relationship: 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant';
        licenseTermsId?: string;
        licenseTokenId?: string;
        createdAt: Date;
        transactionHash?: Hash;
    }[];
    royaltyFlow: {
        fromIpAssetId: string;
        toIpAssetId: string;
        percentage: number;
        totalClaimed: number;
        lastClaimDate?: Date;
    }[];
    generationLevel: number;
    branchId?: string;
    branchName?: string;
    lastUpdated: Date;
    genealogyVersion: number;
}
export interface RegisterIPAssetResponse {
    success: boolean;
    ipAsset?: IPAsset;
    transactionHash?: Hash;
    error?: string;
}
export interface CreateLicenseResponse {
    success: boolean;
    licenseTerms?: LicenseTerms;
    transactionHash?: Hash;
    error?: string;
}
export interface PurchaseLicenseResponse {
    success: boolean;
    licenseToken?: LicenseToken;
    transactionHash?: Hash;
    error?: string;
}
export interface CreateDerivativeResponse {
    success: boolean;
    derivative?: Derivative;
    transactionHash?: Hash;
    error?: string;
}
export interface ClaimRoyaltyResponse {
    success: boolean;
    amount?: bigint;
    transactionHash?: Hash;
    error?: string;
}
export interface IPAssetEvent {
    type: 'registered' | 'licensed' | 'derivative_created' | 'royalty_distributed';
    ipAssetId: string;
    storyId?: string;
    transactionHash: Hash;
    blockNumber: number;
    timestamp: string;
    data: Record<string, any>;
}
//# sourceMappingURL=ip.d.ts.map