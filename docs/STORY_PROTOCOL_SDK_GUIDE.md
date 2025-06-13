# Story Protocol SDK Integration Guide

## Overview
This guide provides a comprehensive reference for integrating Story Protocol SDK features into StoryHouse.vip, focusing on our unique chapter-based IP asset model and remix capabilities.

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [SDK Setup](#sdk-setup)
3. [IP Asset Registration](#ip-asset-registration)
4. [Batch Operations](#batch-operations)
5. [License Management](#license-management)
6. [Derivative Creation](#derivative-creation)
7. [Royalty Distribution](#royalty-distribution)
8. [Optimization Strategies](#optimization-strategies)
9. [Implementation Examples](#implementation-examples)

## Core Concepts

### IP Asset Hierarchy in StoryHouse
- **Chapter Level**: Each chapter is registered as an individual IP Asset ($50-500 range)
- **Story Level**: Collection of chapter IP Assets
- **Remix Chain**: Derivatives can have their own license terms, enabling multi-level remixes

### Key Components
- **IP Asset**: A registered piece of intellectual property (chapter/story)
- **License Terms**: Rules governing how an IP can be used/remixed
- **License Token**: ERC-721 token proving permission to use an IP
- **Derivative**: New IP created from existing IP(s)

## SDK Setup

### Installation
```bash
npm install @story-protocol/core-sdk viem
```

### Client Initialization
```typescript
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const config: StoryConfig = {
  account,
  transport: http(process.env.RPC_URL),
  chainId: 'odyssey' // or 'mainnet'
};

const client = StoryClient.newClient(config);
```

## IP Asset Registration

### Method 1: Mint and Register with License Terms (Recommended)
```typescript
// Single transaction approach - more efficient
async function mintAndRegisterChapterWithLicense(
  spgNftContract: string,
  chapterMetadata: {
    title: string;
    author: string;
    chapterNumber: number;
    storyId: string;
    content: string;
    // ... other metadata
  },
  licenseTermsData: any[]
) {
  // Prepare metadata for IPFS
  const ipMetadataHash = toHex(JSON.stringify(chapterMetadata), { size: 32 });
  const nftMetadataHash = toHex(JSON.stringify({
    name: chapterMetadata.title,
    description: `Chapter ${chapterMetadata.chapterNumber} of ${chapterMetadata.storyId}`,
    image: 'ipfs://...', // Chapter cover image
    attributes: [
      { trait_type: 'Author', value: chapterMetadata.author },
      { trait_type: 'Chapter Number', value: chapterMetadata.chapterNumber },
      { trait_type: 'Story ID', value: chapterMetadata.storyId }
    ]
  }), { size: 32 });

  const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
    spgNftContract,
    licenseTermsData,
    allowDuplicates: true,
    ipMetadata: {
      ipMetadataURI: 'ipfs://...', // Upload chapterMetadata to IPFS first
      ipMetadataHash,
      nftMetadataURI: 'ipfs://...', // Upload NFT metadata to IPFS first
      nftMetadataHash
    },
    txOptions: { waitForTransaction: true }
  });
  
  return {
    ipId: response.ipId,
    tokenId: response.tokenId,
    licenseTermsIds: response.licenseTermsIds
  };
}
```

### Method 2: Register Existing NFT as IP Asset
```typescript
async function registerChapter(
  nftAddress: string,
  tokenId: string,
  metadata: {
    title: string;
    author: string;
    chapterNumber: number;
    storyId: string;
    // ... other metadata
  }
) {
  const response = await client.ipAsset.register({
    nftContract: nftAddress,
    tokenId: tokenId,
    metadata: {
      metadataURI: 'ipfs://...', // IPFS hash of metadata
      metadataHash: '0x...', // Hash of metadata
      nftMetadataHash: '0x...' // Hash of NFT metadata
    },
    txOptions: { waitForTransaction: true }
  });
  
  return response.ipId; // The IP Asset ID
}
```

### Method 3: Register NFT and Attach PIL Terms (Comprehensive)
```typescript
async function registerIpAndAttachPilTerms(
  nftContract: string,
  tokenId: string,
  pilTermsData: any[],
  metadata?: {
    ipMetadataURI?: string;
    ipMetadataHash?: string;
    nftMetadataURI?: string;
    nftMetadataHash?: string;
  }
) {
  const response = await client.ipAsset.registerIpAndAttachPilTerms({
    nftContract,
    tokenId,
    terms: pilTermsData,
    ipMetadata: metadata,
    txOptions: { waitForTransaction: true }
  });
  
  return {
    ipId: response.ipId,
    licenseTermsIds: response.licenseTermsIds
  };
}
```

### Method 4: Mint NFT and Register IP (Simple)
```typescript
async function mintAndRegisterIp(
  spgNftContract: string,
  metadata?: {
    nftMetadataURI?: string;
    nftMetadataHash?: string;
    ipMetadataURI?: string;
    ipMetadataHash?: string;
  }
) {
  const response = await client.ipAsset.mintAndRegisterIp({
    spgNftContract,
    ipMetadata: metadata,
    txOptions: { waitForTransaction: true }
  });
  
  return {
    ipId: response.ipId,
    tokenId: response.tokenId
  };
}
```

## Batch Operations

### Batch Register Multiple Chapters
```typescript
async function batchRegisterChapters(
  registrations: Array<{
    nftContract: string;
    tokenId: string;
    metadata: any;
  }>
) {
  const response = await client.ipAsset.batchRegister({
    ipRegistrations: registrations.map(reg => ({
      nftContract: reg.nftContract,
      tokenId: reg.tokenId,
      ipMetadata: {
        metadataURI: reg.metadata.metadataURI,
        metadataHash: reg.metadata.metadataHash,
        nftMetadataHash: reg.metadata.nftMetadataHash
      }
    })),
    txOptions: { waitForTransaction: true }
  });
  
  return response.results; // Array of IP IDs
}
```

### Optimized Batch Registration with Workflows
```typescript
async function batchRegisterWithOptimizedWorkflows(
  chapters: Array<{
    title: string;
    content: string;
    author: string;
    chapterNumber: number;
  }>
) {
  // Prepare metadata for all chapters
  const preparations = await Promise.all(
    chapters.map(async (chapter) => {
      const ipMetadataUri = await uploadToIPFS(chapter);
      const nftMetadataUri = await uploadToIPFS({
        name: chapter.title,
        description: `Chapter ${chapter.chapterNumber}`,
        image: await generateChapterCover(chapter)
      });
      
      return {
        spgNftContract: STORYHOUSE_NFT_CONTRACT,
        licenseTermsData: [{ terms: preparePilTermsData('reading') }],
        ipMetadata: {
          ipMetadataURI: ipMetadataUri,
          ipMetadataHash: toHex(JSON.stringify(chapter), { size: 32 }),
          nftMetadataURI: nftMetadataUri,
          nftMetadataHash: toHex(JSON.stringify({ name: chapter.title }), { size: 32 })
        }
      };
    })
  );
  
  // Execute optimized batch registration
  const response = await client.ipAsset.batchRegisterIpAssetsWithOptimizedWorkflows({
    registrations: preparations,
    txOptions: { waitForTransaction: true }
  });
  
  return response.results;
}
```

## License Management

### StoryHouse License Tier System

StoryHouse implements a 4-tier licensing system optimized for chapter-based storytelling:

```typescript
// StoryHouse License Tiers
const STORYHOUSE_LICENSE_TIERS = {
  free: {
    displayName: 'Free License',
    transferable: true,
    defaultMintingFee: 0n,
    commercialUse: false,
    derivativesAllowed: true,
    tipPrice: 0,
    royaltyPercentage: 0
  },
  reading: {
    displayName: 'Reading License',
    transferable: false, // 🔒 Wallet-locked for anti-piracy
    defaultMintingFee: BigInt(10 * 10**18), // 10 TIP (updated from 0.5)
    commercialUse: false,
    derivativesAllowed: false,
    tipPrice: 10,
    royaltyPercentage: 5
  },
  premium: {
    displayName: 'Premium License',
    transferable: true,
    defaultMintingFee: BigInt(100 * 10**18), // 100 TIP
    commercialUse: true,
    derivativesAllowed: true,
    tipPrice: 100,
    royaltyPercentage: 10
  },
  exclusive: {
    displayName: 'Exclusive License',
    transferable: false,
    defaultMintingFee: BigInt(1000 * 10**18), // 1000 TIP
    commercialUse: true,
    derivativesAllowed: true,
    tipPrice: 1000,
    royaltyPercentage: 25,
    exclusivity: true
  }
};
```

### Register PIL Terms (Comprehensive)
```typescript
// StoryHouse-optimized PIL terms registration
async function registerStoryHousePilTerms(
  tier: 'free' | 'reading' | 'premium' | 'exclusive',
  customConfig?: Partial<LicenseTermsConfig>
) {
  const licenseConfig = { ...STORYHOUSE_LICENSE_TIERS[tier], ...customConfig };
  
  const pilTerms = {
    transferable: licenseConfig.transferable,
    royaltyPolicy: 'LAP', // Liquid Absolute Percentage
    defaultMintingFee: licenseConfig.defaultMintingFee,
    expiration: BigInt(0), // No expiration
    commercialUse: licenseConfig.commercialUse,
    commercialAttribution: true,
    commercializerChecker: '0x0000000000000000000000000000000000000000',
    commercializerCheckerData: '0x',
    commercialRevShare: licenseConfig.royaltyPercentage, // % to original creator
    commercialRevCeiling: BigInt(1000000 * 10**18), // 1M TIP ceiling
    derivativesAllowed: licenseConfig.derivativesAllowed,
    derivativesAttribution: true,
    derivativesApproval: false, // No approval needed for remixes
    derivativesReciprocal: true, // Same license for derivatives
    derivativeRevCeiling: BigInt(1000000 * 10**18),
    currency: '0x1514000000000000000000000000000000000000', // TIP token
    uri: '' // Optional metadata URI
  };
  
  const response = await client.license.registerPILTerms(pilTerms);
  return response.licenseTermsId;
}
```

### Attach License Terms to IP Asset
```typescript
async function attachLicenseTerms(
  ipId: string, 
  licenseTermsId: string,
  licenseTemplate?: string
) {
  const response = await client.license.attachLicenseTerms({
    ipId,
    licenseTermsId,
    licenseTemplate, // Optional: specify template
    txOptions: { waitForTransaction: true }
  });
  
  return response;
}
```

### Mint License Tokens (Advanced)
```typescript
// Standard license token minting
async function mintLicenseForRemix(
  ipId: string,
  licenseTermsId: string,
  receiver: string,
  options?: {
    amount?: number;
    maxMintingFee?: bigint;
    maxRevenueShare?: number;
    royaltyContext?: any;
  }
) {
  const response = await client.license.mintLicenseTokens({
    licenseTermsId,
    licensorIpId: ipId,
    receiver,
    amount: options?.amount || 1,
    maxMintingFee: options?.maxMintingFee || BigInt(0),
    maxRevenueShare: options?.maxRevenueShare || 100,
    royaltyContext: options?.royaltyContext,
    txOptions: { waitForTransaction: true }
  });
  
  return response.licenseTokenIds[0];
}

// Reading license minting (StoryHouse-specific)
async function mintReadingLicense(
  chapterIpId: string,
  reader: string,
  chapterNumber: number
) {
  // Only required for chapters 4+
  if (chapterNumber <= 3) {
    throw new Error('Reading license not required for free chapters 1-3');
  }
  
  const readingLicenseTermsId = await registerStoryHousePilTerms('reading');
  
  const response = await client.license.mintLicenseTokens({
    licenseTermsId: readingLicenseTermsId,
    licensorIpId: chapterIpId,
    receiver: reader,
    amount: 1,
    maxMintingFee: BigInt(10 * 10**18), // 10 TIP fee
    maxRevenueShare: 5, // 5% to author
    txOptions: { waitForTransaction: true }
  });
  
  return {
    licenseTokenId: response.licenseTokenIds[0],
    walletLocked: true, // Non-transferable
    chapterAccess: chapterNumber
  };
}
```

### License Template Management
```typescript
// Get predefined license templates
async function getLicenseTemplates() {
  const templates = await client.license.getLicenseTemplates();
  return templates;
}

// Use template for registration
async function registerWithTemplate(
  templateId: string,
  customTerms?: any
) {
  const response = await client.license.registerPILTerms({
    template: templateId,
    terms: customTerms
  });
  
  return response.licenseTermsId;
}
```

## Derivative Creation

### Method 1: Register Derivative (Standard)
```typescript
async function registerDerivative(
  childIpId: string,
  parentIpIds: string[],
  royaltyContext?: {
    royaltyPolicy?: string;
    royaltyShare?: number;
    parentRoyalties?: Array<{
      parentIpId: string;
      royaltyShare: number;
    }>;
  }
) {
  const response = await client.ipAsset.registerDerivative({
    childIpId,
    parentIpIds,
    royaltyContext,
    txOptions: { waitForTransaction: true }
  });
  
  return response;
}
```

### Method 2: Register Derivative with License Tokens
```typescript
async function registerDerivativeWithLicenseTokens(
  childIpId: string,
  licenseTokenIds: string[],
  options?: {
    royaltyContext?: any;
    burnLicenseTokens?: boolean;
  }
) {
  const response = await client.ipAsset.registerDerivativeWithLicenseTokens({
    childIpId,
    licenseTokenIds,
    royaltyContext: options?.royaltyContext,
    burnLicenseTokens: options?.burnLicenseTokens || false,
    txOptions: { waitForTransaction: true }
  });
  
  return response;
}
```

### Legacy: Register a Remix as Derivative

### Complete Remix Creation with License Tokens
```typescript
async function createRemix(
  parentLicenseTokenId: string,
  remixNftAddress: string,
  remixTokenId: string,
  remixMetadata: any
) {
  // First register the remix as an IP Asset
  const remixIpId = await registerChapter(
    remixNftAddress,
    remixTokenId,
    remixMetadata
  );
  
  // Then link it as a derivative
  const response = await client.ipAsset.registerDerivative({
    childIpId: remixIpId,
    parentIpIds: [parentLicenseTokenId],
    licenseTokenIds: [parentLicenseTokenId],
    txOptions: { waitForTransaction: true }
  });
  
  // Optionally attach new license terms to allow further remixes
  await attachLicenseTerms(remixIpId, remixLicenseTermsId);
  
  return remixIpId;
}
```

### Query Derivative Chain and IP Information
```typescript
// Get derivative chain information
async function getRemixChain(ipId: string) {
  // Get parent IPs
  const parents = await client.ipAsset.getParentIps(ipId);
  
  // Get child derivatives
  const children = await client.ipAsset.getDerivativeIps(ipId);
  
  return { parents, children };
}

// Get detailed IP Asset information
async function getIpAssetDetails(ipId: string) {
  const details = await client.ipAsset.getIpAsset(ipId);
  return details;
}

// Check if IP Asset exists
async function checkIpAssetExists(ipId: string): Promise<boolean> {
  try {
    await client.ipAsset.getIpAsset(ipId);
    return true;
  } catch (error) {
    return false;
  }
}
```

## Optimization Strategies

### Gas Optimization Techniques

#### 1. Use Single-Transaction Methods
```typescript
// ✅ GOOD: Single transaction
const result = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
  spgNftContract,
  licenseTermsData,
  ipMetadata
});

// ❌ AVOID: Multiple transactions
// const mintResult = await mintNFT();
// const registerResult = await client.ipAsset.register();
// const licenseResult = await client.license.attachLicenseTerms();
```

#### 2. Batch Operations for Multiple Items
```typescript
// ✅ GOOD: Batch registration
const results = await client.ipAsset.batchRegister({
  ipRegistrations: multipleRegistrations
});

// ❌ AVOID: Individual registrations in loop
// for (const registration of registrations) {
//   await client.ipAsset.register(registration);
// }
```

#### 3. Prepare Data Off-Chain
```typescript
// ✅ GOOD: Pre-calculate hashes and upload metadata
const ipMetadataHash = toHex(JSON.stringify(metadata), { size: 32 });
const ipMetadataUri = await uploadToIPFS(metadata);

// Then use in registration
const result = await client.ipAsset.register({
  nftContract,
  tokenId,
  metadata: {
    metadataURI: ipMetadataUri,
    metadataHash: ipMetadataHash
  }
});
```

### Caching and Performance

#### 1. Cache License Terms
```typescript
class StoryHouseLicenseCache {
  private static licenseTermsCache = new Map<string, string>();
  
  static async getCachedLicenseTerms(tier: string): Promise<string> {
    if (this.licenseTermsCache.has(tier)) {
      return this.licenseTermsCache.get(tier)!;
    }
    
    const licenseTermsId = await createLicenseTermsForTier(tier);
    this.licenseTermsCache.set(tier, licenseTermsId);
    return licenseTermsId;
  }
}
```

#### 2. Batch Metadata Uploads
```typescript
async function batchUploadMetadata(chapters: Chapter[]): Promise<Map<string, string>> {
  const uploads = await Promise.all(
    chapters.map(async (chapter) => {
      const uri = await uploadToIPFS(chapter);
      return [chapter.id, uri] as [string, string];
    })
  );
  
  return new Map(uploads);
}
```

## Royalty Distribution

### StoryHouse Royalty System Integration

StoryHouse implements a sophisticated 4-tier royalty system with TIP token economics:

```typescript
// StoryHouse Royalty Configuration
const STORYHOUSE_ROYALTY_CONFIG = {
  TIP_TOKEN_ADDRESS: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
  ROYALTY_POLICIES: {
    free: { policyType: 'LAP', stakingReward: 0, distributionDelay: 0 },
    reading: { policyType: 'LAP', stakingReward: 2, distributionDelay: 3600 }, // 1 hour
    premium: { policyType: 'LRP', stakingReward: 5, distributionDelay: 86400 }, // 24 hours
    exclusive: { policyType: 'LRP', stakingReward: 10, distributionDelay: 604800 } // 7 days
  },
  ECONOMIC_CONSTANTS: {
    PLATFORM_FEE_RATE: 5, // 5% platform fee
    ROYALTY_RATES: {
      free: 0,     // 0% - attribution only
      reading: 5,  // 5% - reading license
      premium: 10, // 10% - commercial use
      exclusive: 25 // 25% - exclusive rights
    },
    READER_REWARD_RATES: {
      free: 2,     // 2% of revenue to readers
      reading: 2,  // 2% of revenue to readers
      premium: 3,  // 3% of revenue to readers
      exclusive: 5 // 5% of revenue to readers
    }
  }
};
```

### Pay Royalties on Behalf (Derivative to Parent)
```typescript
// Pay royalties from derivative work to original chapter
async function payRoyaltyToParent(
  derivativeIpId: string,
  parentIpId: string,
  amount: bigint,
  licenseTier: 'free' | 'reading' | 'premium' | 'exclusive'
) {
  const royaltyRate = STORYHOUSE_ROYALTY_CONFIG.ECONOMIC_CONSTANTS.ROYALTY_RATES[licenseTier];
  const royaltyAmount = (amount * BigInt(royaltyRate)) / BigInt(100);
  
  const response = await client.royalty.payRoyaltyOnBehalf({
    receiverIpId: parentIpId,
    payerIpId: derivativeIpId,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    amount: royaltyAmount,
    txOptions: { waitForTransaction: true }
  });
  
  return {
    transactionHash: response.txHash,
    royaltyAmount,
    royaltyRate,
    parentIpId,
    derivativeIpId
  };
}
```

### Check Claimable Revenue
```typescript
// Check how much revenue an author can claim from their chapters
async function getClaimableRevenue(
  authorAddress: string,
  chapterIpIds: string[]
): Promise<{
  totalClaimable: bigint;
  claimableByChapter: Record<string, bigint>;
  estimatedGasFee: bigint;
}> {
  const claimableByChapter: Record<string, bigint> = {};
  let totalClaimable = BigInt(0);
  
  // Check claimable revenue for each chapter
  for (const ipId of chapterIpIds) {
    const claimable = await client.royalty.claimableRevenue({
      ipId,
      account: authorAddress,
      token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS
    });
    
    claimableByChapter[ipId] = claimable.amount;
    totalClaimable += claimable.amount;
  }
  
  // Estimate gas fee for claiming
  const estimatedGasFee = BigInt(150000) * BigInt(20000000000); // 150k gas * 20 gwei
  
  return {
    totalClaimable,
    claimableByChapter,
    estimatedGasFee
  };
}
```

### Claim All Revenue (Batch Claiming)
```typescript
// Claim revenue from multiple chapters in a single transaction
async function claimAllChapterRevenue(
  authorAddress: string,
  chapterIpIds: string[],
  options?: {
    unwrapToNative?: boolean;
    autoTransfer?: boolean;
  }
) {
  // Get snapshots for revenue claiming
  const snapshots = await Promise.all(
    chapterIpIds.map(async (ipId) => {
      const snapshot = await client.royalty.getSnapshot({
        ipId,
        token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS
      });
      return snapshot.id;
    })
  );
  
  const response = await client.royalty.claimAllRevenue({
    account: authorAddress,
    snapshotIds: snapshots,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    unwrapToNative: options?.unwrapToNative ?? false,
    autoTransfer: options?.autoTransfer ?? true,
    txOptions: { waitForTransaction: true }
  });
  
  return {
    transactionHash: response.txHash,
    totalClaimed: response.claimedAmount,
    chapterCount: chapterIpIds.length,
    snapshotIds: snapshots
  };
}
```

### Revenue Distribution for Reading Licenses
```typescript
// Distribute revenue when readers purchase reading licenses
async function distributeReadingLicenseRevenue(
  chapterIpId: string,
  readerPayment: bigint, // 10 TIP for reading license
  authorAddress: string
) {
  const config = STORYHOUSE_ROYALTY_CONFIG.ECONOMIC_CONSTANTS;
  
  // Calculate distribution
  const platformFee = (readerPayment * BigInt(config.PLATFORM_FEE_RATE)) / BigInt(100);
  const readerReward = (readerPayment * BigInt(config.READER_REWARD_RATES.reading)) / BigInt(100);
  const authorRevenue = readerPayment - platformFee - readerReward;
  
  // Distribute to IP asset royalty vault
  const response = await client.royalty.distributeRevenue({
    ipId: chapterIpId,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    amount: authorRevenue,
    txOptions: { waitForTransaction: true }
  });
  
  return {
    transactionHash: response.txHash,
    authorRevenue,
    platformFee,
    readerReward,
    distribution: {
      author: Number(authorRevenue) / 10**18,
      platform: Number(platformFee) / 10**18,
      readers: Number(readerReward) / 10**18
    }
  };
}
```

### Royalty Analytics and Tracking
```typescript
// Get comprehensive royalty analytics for a story
async function getStoryRoyaltyAnalytics(
  chapterIpIds: string[],
  authorAddress: string,
  timeRange: { from: Date; to: Date }
) {
  const analytics = {
    totalEarned: BigInt(0),
    earningsByChapter: new Map<string, bigint>(),
    earningsBySource: {
      readingLicenses: BigInt(0),
      derivatives: BigInt(0),
      commercial: BigInt(0)
    },
    readerRewardsDistributed: BigInt(0),
    platformFeesCollected: BigInt(0)
  };
  
  for (const ipId of chapterIpIds) {
    // Get revenue history for this chapter
    const revenue = await client.royalty.getRevenueHistory({
      ipId,
      account: authorAddress,
      token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
      fromTimestamp: Math.floor(timeRange.from.getTime() / 1000),
      toTimestamp: Math.floor(timeRange.to.getTime() / 1000)
    });
    
    analytics.earningsByChapter.set(ipId, revenue.totalEarned);
    analytics.totalEarned += revenue.totalEarned;
    
    // Categorize earnings by source
    revenue.transactions.forEach(tx => {
      if (tx.source === 'reading_license') {
        analytics.earningsBySource.readingLicenses += tx.amount;
      } else if (tx.source === 'derivative') {
        analytics.earningsBySource.derivatives += tx.amount;
      } else if (tx.source === 'commercial') {
        analytics.earningsBySource.commercial += tx.amount;
      }
    });
  }
  
  return analytics;
}
```

## Implementation Examples

### Complete Chapter Registration Flow (StoryHouse Optimized)
```typescript
// StoryHouse chapter registration with tiered licensing
async function registerStoryHouseChapter(chapterData: {
  title: string;
  author: string;
  content: string;
  chapterNumber: number;
  storyId: string;
  genre?: string;
  mood?: string;
}) {
  try {
    // 1. Determine license tier based on chapter number
    const licenseTier = chapterData.chapterNumber <= 3 ? 'free' : 'reading';
    
    // 2. Prepare StoryHouse-specific PIL terms
    const pilTermsData = await registerStoryHousePilTerms(licenseTier, {
      // Custom config for this chapter
      ...(chapterData.chapterNumber === 1 && { 
        derivativesAllowed: true // Enable remixes on chapter 1
      })
    });

    // 3. Upload comprehensive metadata to R2/IPFS
    const ipMetadata = {
      name: chapterData.title,
      description: `Chapter ${chapterData.chapterNumber} of ${chapterData.storyId}`,
      type: 'chapter',
      chapterNumber: chapterData.chapterNumber,
      content: chapterData.content,
      genre: chapterData.genre || 'Fiction',
      mood: chapterData.mood || 'Neutral',
      author: chapterData.author,
      storyId: chapterData.storyId,
      licenseTier,
      platform: 'StoryHouse.vip',
      createdAt: new Date().toISOString()
    };
    
    const ipMetadataUri = await uploadToIPFS(ipMetadata);
    const nftMetadataUri = await uploadToIPFS({
      name: chapterData.title,
      description: `Chapter ${chapterData.chapterNumber} of ${chapterData.storyId}`,
      image: await generateChapterCover(chapterData),
      external_url: `https://storyhouse.vip/read/${chapterData.author.toLowerCase()}-${chapterData.storyId}`,
      attributes: [
        { trait_type: 'Author', value: chapterData.author },
        { trait_type: 'Chapter Number', value: chapterData.chapterNumber },
        { trait_type: 'Story ID', value: chapterData.storyId },
        { trait_type: 'Genre', value: chapterData.genre || 'Fiction' },
        { trait_type: 'License Tier', value: licenseTier },
        { trait_type: 'Platform', value: 'StoryHouse.vip' }
      ]
    });

    // 4. Execute unified registration with StoryHouse license terms
    const result = await mintAndRegisterChapterWithLicense(
      STORYHOUSE_NFT_CONTRACT,
      chapterData,
      [{ terms: pilTermsData }]
    );
    
    // 5. Store comprehensive chapter info in database
    await updateChapterWithIpInfo(chapterData.storyId, chapterData.chapterNumber, {
      ipId: result.ipId,
      tokenId: result.tokenId,
      licenseTermsIds: result.licenseTermsIds,
      licenseTier,
      registeredAt: new Date(),
      metadata: {
        ipMetadataUri,
        nftMetadataUri,
        genre: chapterData.genre,
        mood: chapterData.mood
      }
    });
    
    return {
      ...result,
      licenseTier,
      requiresReadingLicense: chapterData.chapterNumber > 3
    };
  } catch (error) {
    console.error('StoryHouse chapter registration failed:', error);
    throw error;
  }
}

// Legacy approach for existing NFTs
async function registerExistingChapterWithLicense(chapter: Chapter) {
  try {
    // 1. Register chapter as IP Asset
    const ipId = await registerChapter(
      chapter.nftContract,
      chapter.tokenId,
      chapter.metadata
    );
    
    // 2. Create or use existing license terms
    const licenseTermsId = await createRemixLicense();
    
    // 3. Attach license terms
    await attachLicenseTerms(ipId, licenseTermsId);
    
    // 4. Store in database
    await updateChapterWithIpInfo(chapter.id, {
      ipId,
      licenseTermsId,
      registeredAt: new Date()
    });
    
    return { ipId, licenseTermsId };
  } catch (error) {
    console.error('Chapter registration failed:', error);
    throw error;
  }
}
```

### Remix Creation Flow
```typescript
async function createStoryRemix(
  originalChapterId: string,
  remixContent: string,
  remixAuthor: string
) {
  try {
    // 1. Get original chapter's IP info
    const originalChapter = await getChapter(originalChapterId);
    
    // 2. Mint license token for remix creator
    const licenseTokenId = await mintLicenseForRemix(
      originalChapter.ipId,
      originalChapter.licenseTermsId,
      remixAuthor
    );
    
    // 3. Create NFT for remix
    const { nftAddress, tokenId } = await mintRemixNFT(remixContent);
    
    // 4. Register remix as derivative
    const remixIpId = await createRemix(
      licenseTokenId,
      nftAddress,
      tokenId,
      {
        title: `Remix of ${originalChapter.title}`,
        author: remixAuthor,
        originalChapterId,
        content: remixContent
      }
    );
    
    // 5. Enable further remixes by attaching license terms
    const remixLicenseTermsId = await createRemixLicense();
    await attachLicenseTerms(remixIpId, remixLicenseTermsId);
    
    return {
      remixIpId,
      licenseTokenId,
      remixLicenseTermsId
    };
  } catch (error) {
    console.error('Remix creation failed:', error);
    throw error;
  }
}
```

### Query Remix Tree
```typescript
async function getCompleteRemixTree(rootIpId: string) {
  const tree = {
    id: rootIpId,
    children: []
  };
  
  async function buildTree(node: any) {
    const derivatives = await client.ipAsset.getDerivativeIps(node.id);
    
    for (const derivative of derivatives) {
      const childNode = {
        id: derivative.ipId,
        children: []
      };
      
      node.children.push(childNode);
      await buildTree(childNode); // Recursive build
    }
  }
  
  await buildTree(tree);
  return tree;
}
```

## Testing Considerations

### Test Scenarios
1. **Single chapter registration**: Test mintAndRegisterIpAssetWithPilTerms
2. **Batch chapter registration**: Test batchRegister for multiple chapters
3. **Single-level remix**: Original → Remix using license tokens
4. **Multi-level remix**: Original → Remix 1 → Remix 2 with proper attribution
5. **Multiple remixes**: One original spawning multiple remixes simultaneously
6. **License term variations**: Different fee structures and permissions across tiers
7. **Royalty flow**: Verify payments flow correctly up the chain
8. **Gas optimization**: Compare single-transaction vs multi-transaction costs
9. **Metadata integrity**: Verify IPFS uploads and hash consistency
10. **Error recovery**: Test transaction failure and retry scenarios

### Test Data
```typescript
const testLicenseTerms = {
  basic: "1", // Basic remix allowed
  premium: "2", // Higher fees, more restrictions
  open: "3" // Free remixing
};

const testChapters = [
  {
    id: "test-chapter-1",
    ipId: "0x...",
    tokenId: "1",
    licenseTermsId: testLicenseTerms.open
  }
];

// Test the optimized flow
const testChapterData = {
  title: "The Beginning",
  author: "0x1234...",
  content: "Once upon a time...",
  chapterNumber: 1,
  storyId: "test-story-1"
};

// Test batch operations
const testBatchData = [
  { title: "Chapter 1", content: "...", chapterNumber: 1 },
  { title: "Chapter 2", content: "...", chapterNumber: 2 },
  { title: "Chapter 3", content: "...", chapterNumber: 3 }
];
```

## Best Practices

### Transaction Optimization
1. **Use mintAndRegisterIpAssetWithPilTerms** for new chapters - single transaction saves ~40% gas
2. **Use batch operations** for multiple registrations to reduce overall gas costs
3. **Pre-upload metadata to IPFS** before blockchain calls to avoid timeouts
4. **Use registerIpAndAttachPilTerms** when you need both IP registration and license attachment

### Data Management
5. **Cache license terms IDs** to avoid recreating identical terms
6. **Track remix lineage** in your database for faster queries
7. **Cache frequently accessed IP data** to reduce RPC calls
8. **Validate metadata** before registration to avoid failed transactions

### Error Handling & Reliability
9. **Implement retry logic** for blockchain transactions
10. **Monitor gas costs** and set appropriate gas limits
11. **Use atomic operations** when possible to prevent partial state
12. **Always verify license terms** before minting license tokens

### StoryHouse-Specific
13. **Use 4-tier licensing system** (free, reading, premium, exclusive) for diverse monetization
14. **Implement wallet-locked reading licenses** for chapters 4+ to prevent piracy
15. **Enable derivatives on free chapters** to encourage community engagement
16. **Set tiered royalty percentages** (0%, 5%, 10%, 25%) based on license value
17. **Use TIP token economics** for all minting fees and royalty distributions
18. **Maintain chapter lineage** for proper attribution and royalty flow
19. **Cache license terms by tier** to avoid redundant PIL registrations
20. **Implement reading license validation** before chapter access
21. **Distribute reader rewards** (2-5%) to incentivize engagement
22. **Use LAP policy for free/reading** and LRP for premium/exclusive tiers
23. **Implement batch royalty claiming** to reduce gas costs for authors
24. **Track derivative royalty flows** up the remix chain automatically

## Group Module Integration

### StoryHouse.vip Group Management for Collections

The Group module enables powerful collaborative IP management for story collections, multi-author projects, and derivative work ecosystems.

```typescript
// Story Protocol Group Configuration for StoryHouse
const STORYHOUSE_GROUP_CONFIG = {
  GROUP_TYPES: {
    STORY_SERIES: 'story_series',     // Multi-chapter books
    COLLABORATIVE: 'collaborative',   // Multi-author stories
    DERIVATIVE_COLLECTION: 'derivative_collection', // Related derivatives
    UNIVERSE: 'universe'              // Shared story universe
  },
  REVENUE_SHARING: {
    EQUAL_SPLIT: 'equal',             // Equal distribution among members
    WEIGHTED: 'weighted',             // Based on contribution percentage
    TIERED: 'tiered',                 // Based on chapter importance
    CUSTOM: 'custom'                  // Custom distribution logic
  }
};
```

### Register Story Series as Group
```typescript
// Create a group for a multi-chapter story with shared licensing
async function createStorySeriesGroup(
  bookTitle: string,
  authorAddress: string,
  chapterIpIds: string[],
  groupConfig: {
    licenseTermsId: bigint;
    rewardSharePercentage: number;
    distributionStrategy: 'equal' | 'weighted';
  }
) {
  // Register the group for story series
  const groupResponse = await client.group.registerGroup({
    groupPool: authorAddress,
    licenseTermsId: groupConfig.licenseTermsId,
    rewardSharePercentage: groupConfig.rewardSharePercentage,
    txOptions: { waitForTransaction: true }
  });

  const groupId = groupResponse.groupId;

  // Add all chapters to the group
  const addIpsResponse = await client.group.addIpsToGroup({
    groupId,
    ipIds: chapterIpIds,
    txOptions: { waitForTransaction: true }
  });

  return {
    groupId,
    transactionHash: addIpsResponse.txHash,
    memberCount: chapterIpIds.length,
    bookTitle,
    groupType: 'story_series'
  };
}
```

### Collaborative Story Group Management
```typescript
// Create group for multi-author collaborative stories
async function createCollaborativeStoryGroup(
  storyTitle: string,
  authors: { address: string; contributionWeight: number }[],
  sharedLicenseTermsId: bigint
) {
  // Calculate weighted reward distribution
  const totalWeight = authors.reduce((sum, author) => sum + author.contributionWeight, 0);
  const rewardSharePercentage = 90; // 90% to authors, 10% to platform

  // Register group with primary author as pool
  const primaryAuthor = authors.find(a => a.contributionWeight === Math.max(...authors.map(a => a.contributionWeight)));
  
  const groupResponse = await client.group.registerGroup({
    groupPool: primaryAuthor!.address,
    licenseTermsId: sharedLicenseTermsId,
    rewardSharePercentage,
    txOptions: { waitForTransaction: true }
  });

  return {
    groupId: groupResponse.groupId,
    storyTitle,
    authors,
    totalWeight,
    distributionStrategy: 'weighted'
  };
}
```

### Derivative Collection Groups
```typescript
// Group related derivative works for shared licensing and royalties
async function createDerivativeCollectionGroup(
  originalIpId: string,
  derivativeIpIds: string[],
  collectionName: string,
  originalAuthorAddress: string
) {
  // Create shared license terms for derivative collection
  const collectionLicenseTermsId = await createCollectionLicenseTerms({
    originalAuthorRoyalty: 15, // 15% to original author
    derivativeAuthorRoyalty: 10, // 10% to derivative authors
    commercialUse: true,
    derivativesAllowed: true
  });

  // Register group for derivative collection
  const groupResponse = await client.group.registerGroupAndAttachLicense({
    groupPool: originalAuthorAddress,
    licenseTermsId: collectionLicenseTermsId,
    rewardSharePercentage: 85, // 85% to group members, 15% to platform
    ipIds: [originalIpId, ...derivativeIpIds],
    txOptions: { waitForTransaction: true }
  });

  return {
    groupId: groupResponse.groupId,
    collectionName,
    originalIpId,
    derivativeCount: derivativeIpIds.length,
    licenseTermsId: collectionLicenseTermsId
  };
}
```

### Group Royalty Collection and Distribution
```typescript
// Collect and distribute royalties for a story group
async function distributeGroupRoyalties(
  groupId: string,
  distributionStrategy: 'equal' | 'weighted' | 'custom',
  memberWeights?: Record<string, number>
) {
  // Collect group royalties first
  const collectResponse = await client.group.collectGroupRoyalties({
    groupId,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    txOptions: { waitForTransaction: true }
  });

  const totalCollected = collectResponse.collectedAmount;

  // Distribute based on strategy
  const distributeResponse = await client.group.distributeGroupRoyalties({
    groupId,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    distributionStrategy,
    memberWeights: memberWeights || {},
    txOptions: { waitForTransaction: true }
  });

  return {
    collectionHash: collectResponse.txHash,
    distributionHash: distributeResponse.txHash,
    totalCollected,
    totalDistributed: distributeResponse.distributedAmount,
    strategy: distributionStrategy
  };
}
```

### Story Universe Group Management
```typescript
// Create shared universe for interconnected stories
async function createStoryUniverseGroup(
  universeName: string,
  creatorAddress: string,
  universeConfig: {
    openCollaboration: boolean;
    maxMembers?: number;
    entryFee?: bigint;
    sharedRoyaltyPool: number;
  }
) {
  // Create universe-specific license terms
  const universeLicenseTermsId = await createUniverseLicenseTerms({
    universeCreatorRoyalty: 5, // 5% to universe creator
    storyAuthorRoyalty: 15, // 15% to individual story authors
    commercialUse: true,
    crossoverAllowed: true, // Stories can reference each other
    merchandisingRights: true
  });

  const groupResponse = await client.group.registerGroup({
    groupPool: creatorAddress,
    licenseTermsId: universeLicenseTermsId,
    rewardSharePercentage: universeConfig.sharedRoyaltyPool,
    txOptions: { waitForTransaction: true }
  });

  return {
    groupId: groupResponse.groupId,
    universeName,
    creatorAddress,
    licenseTermsId: universeLicenseTermsId,
    openCollaboration: universeConfig.openCollaboration,
    maxMembers: universeConfig.maxMembers || 100
  };
}
```

### Add New Chapter to Existing Group
```typescript
// Add new chapter to existing story series group
async function addChapterToStoryGroup(
  groupId: string,
  newChapterIpId: string,
  chapterMetadata: {
    chapterNumber: number;
    title: string;
    authorContribution: number;
  }
) {
  // Add the new chapter IP to the group
  const response = await client.group.addIpsToGroup({
    groupId,
    ipIds: [newChapterIpId],
    txOptions: { waitForTransaction: true }
  });

  // Update group metadata with new chapter info
  const updatedGroup = await updateGroupMetadata(groupId, {
    lastChapterAdded: new Date(),
    totalChapters: chapterMetadata.chapterNumber,
    latestChapterTitle: chapterMetadata.title
  });

  return {
    transactionHash: response.txHash,
    groupId,
    newChapterIpId,
    chapterNumber: chapterMetadata.chapterNumber,
    updatedGroup
  };
}
```

### Group Analytics and Management
```typescript
// Get comprehensive group analytics
async function getGroupAnalytics(groupId: string) {
  // Get group details
  const groupInfo = await client.group.getGroupDetails({
    groupId
  });

  // Get all group members
  const members = await client.group.getGroupMembers({
    groupId
  });

  // Calculate revenue analytics
  const revenueAnalytics = await client.group.getGroupRevenueAnalytics({
    groupId,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    timeRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      to: new Date()
    }
  });

  return {
    groupInfo,
    memberCount: members.length,
    totalRevenue: revenueAnalytics.totalRevenue,
    averageRevenuePerMember: revenueAnalytics.totalRevenue / BigInt(members.length),
    topPerformingMember: revenueAnalytics.topPerformer,
    distributionHistory: revenueAnalytics.distributionHistory,
    growthMetrics: {
      revenueGrowth: revenueAnalytics.monthOverMonthGrowth,
      memberGrowth: members.filter(m => m.joinedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
    }
  };
}
```

### StoryHouse Group Integration Patterns

#### 1. Automatic Group Creation for New Books
```typescript
// Automatically create group when first chapter is published
async function createBookGroupOnFirstChapter(
  bookId: string,
  firstChapterIpId: string,
  authorAddress: string,
  licenseTemplateId: bigint
) {
  const groupId = await createStorySeriesGroup(
    bookId,
    authorAddress,
    [firstChapterIpId],
    {
      licenseTermsId: licenseTemplateId,
      rewardSharePercentage: 95, // 95% to author, 5% to platform
      distributionStrategy: 'equal'
    }
  );

  // Store group ID with book metadata
  await updateBookMetadata(bookId, {
    groupId,
    groupType: 'story_series',
    createdAt: new Date()
  });

  return groupId;
}
```

#### 2. Collaborative Story Creation UI
```typescript
// Support multi-author story creation
async function createCollaborativeStoryFlow(
  storyTitle: string,
  collaborators: { address: string; role: string; percentage: number }[],
  licensePreferences: {
    commercialUse: boolean;
    derivativesAllowed: boolean;
    crossReferenceAllowed: boolean;
  }
) {
  // Create collaborative license terms
  const licenseTermsId = await createCollaborativeLicenseTerms(licensePreferences);

  // Create group with weighted distribution
  const groupId = await createCollaborativeStoryGroup(
    storyTitle,
    collaborators,
    licenseTermsId
  );

  // Setup collaborative editing permissions
  await setupCollaborativePermissions(groupId, collaborators);

  return {
    groupId,
    storyTitle,
    collaborators,
    licenseTermsId,
    editingUrl: `/collaborative/${groupId}/edit`
  };
}
```

#### 3. Derivative Collection Management
```typescript
// Automatically group derivatives of popular stories
async function manageDerivativeCollections(
  originalStoryId: string,
  derivativeThreshold: number = 5 // Create collection after 5 derivatives
) {
  const derivatives = await getStoryDerivatives(originalStoryId);
  
  if (derivatives.length >= derivativeThreshold) {
    const originalStory = await getStory(originalStoryId);
    
    const collectionGroupId = await createDerivativeCollectionGroup(
      originalStory.ipId,
      derivatives.map(d => d.ipId),
      `${originalStory.title} - Derivative Collection`,
      originalStory.authorAddress
    );

    // Notify original author and derivative creators
    await notifyCollectionCreation(collectionGroupId, [
      originalStory.authorAddress,
      ...derivatives.map(d => d.authorAddress)
    ]);

    return collectionGroupId;
  }

  return null;
}
```

### Group Module Benefits for StoryHouse.vip

1. **Simplified Multi-Chapter Management**: Automatic grouping of story chapters with consistent licensing
2. **Collaborative Storytelling**: Easy setup for multi-author projects with transparent revenue sharing
3. **Derivative Work Collections**: Organized management of remixes and adaptations
4. **Scalable Royalty Distribution**: Automated revenue sharing based on contribution weights
5. **Story Universe Building**: Support for interconnected narrative worlds
6. **Analytics and Insights**: Group-level performance metrics and revenue tracking

### Implementation Priority for StoryHouse.vip

1. **Phase 1**: Story Series Groups (auto-group chapters of same book)
2. **Phase 2**: Derivative Collections (group related remixes)
3. **Phase 3**: Collaborative Stories (multi-author support)
4. **Phase 4**: Story Universes (shared narrative worlds)

## Error Handling

```typescript
class StoryProtocolError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}

async function safeRegister(data: any) {
  try {
    return await client.ipAsset.register(data);
  } catch (error) {
    if (error.message.includes('already registered')) {
      throw new StoryProtocolError(
        'Chapter already registered as IP',
        'IP_ALREADY_EXISTS',
        { chapterId: data.tokenId }
      );
    }
    throw error;
  }
}
```

## Migration Notes

When migrating existing chapters to Story Protocol:
1. Batch process to save gas
2. Start with test chapters
3. Implement gradual rollout
4. Maintain mapping of old IDs to IP IDs
5. Update UI to show IP registration status

---

This guide will be updated as we implement and test each feature. For the latest Story Protocol documentation, visit: https://docs.story.foundation/