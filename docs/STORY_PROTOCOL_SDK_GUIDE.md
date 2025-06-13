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

### Set Royalty Distribution
```typescript
async function setupRoyaltyDistribution(ipId: string) {
  // Configure how royalties flow up the remix chain
  const response = await client.royalty.payRoyaltyOnBehalf({
    receiverIpId: ipId,
    payerIpId: derivativeIpId,
    token: TIP_TOKEN_ADDRESS,
    amount: royaltyAmount,
    txOptions: { waitForTransaction: true }
  });
  
  return response;
}
```

### Claim Royalties
```typescript
async function claimRoyalties(ipId: string, claimer: string) {
  const response = await client.royalty.claimRevenue({
    snapshotIds: [snapshotId],
    token: TIP_TOKEN_ADDRESS,
    ipId,
    claimer,
    txOptions: { waitForTransaction: true }
  });
  
  return response;
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