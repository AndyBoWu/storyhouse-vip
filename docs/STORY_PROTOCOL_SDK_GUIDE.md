# Story Protocol SDK Integration Guide

## Overview
This guide provides a comprehensive reference for integrating Story Protocol SDK features into StoryHouse.vip, focusing on our unique chapter-based IP asset model and remix capabilities.

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [SDK Setup](#sdk-setup)
3. [IP Asset Registration](#ip-asset-registration)
4. [License Management](#license-management)
5. [Derivative Creation](#derivative-creation)
6. [Royalty Distribution](#royalty-distribution)
7. [Implementation Examples](#implementation-examples)

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

## License Management

### Attach License Terms to IP Asset
```typescript
async function attachLicenseTerms(ipId: string, licenseTermsId: string) {
  const response = await client.license.attachLicenseTerms({
    ipId,
    licenseTermsId,
    txOptions: { waitForTransaction: true }
  });
  
  return response;
}
```

### Create Custom License Terms (for remix permissions)
```typescript
async function createRemixLicense() {
  const licenseTerms = {
    transferable: true,
    royaltyPolicy: "LAP", // or custom policy
    defaultMintingFee: BigInt(10 * 10**18), // 10 TIP tokens
    expiration: 0, // No expiration
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: "0x0000...", // Zero address = no restrictions
    commercializerCheckerData: "0x",
    commercialRevShare: 10, // 10% to original creator
    commercialRevCeiling: BigInt(1000000 * 10**18), // Revenue ceiling
    derivativesAllowed: true, // KEY: Allow further remixes
    derivativesAttribution: true,
    derivativesApproval: false, // No approval needed
    derivativesReciprocal: true,
    derivativeRevCeiling: BigInt(1000000 * 10**18),
    currency: "0x..." // TIP token address
  };
  
  return await client.license.registerPILTerms(licenseTerms);
}
```

### Mint License Tokens
```typescript
async function mintLicenseForRemix(
  ipId: string,
  licenseTermsId: string,
  receiver: string
) {
  const response = await client.license.mintLicenseTokens({
    licenseTermsId,
    licensorIpId: ipId,
    receiver, // User who wants to create remix
    amount: 1,
    maxMintingFee: BigInt(0),
    maxRevenueShare: 100,
    txOptions: { waitForTransaction: true }
  });
  
  return response.licenseTokenIds[0];
}
```

## Derivative Creation

### Register a Remix as Derivative
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

### Query Derivative Chain
```typescript
async function getRemixChain(ipId: string) {
  // Get parent IPs
  const parents = await client.ipAsset.getParentIps(ipId);
  
  // Get child derivatives
  const children = await client.ipAsset.getDerivativeIps(ipId);
  
  return { parents, children };
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

### Complete Chapter Registration Flow (Optimized)
```typescript
// Using the single-transaction approach
async function registerChapterWithLicense(chapterData: {
  title: string;
  author: string;
  content: string;
  chapterNumber: number;
  storyId: string;
}) {
  try {
    // 1. Prepare license terms for remixing
    const remixLicenseTerms = {
      transferable: true,
      royaltyPolicy: "LAP",
      defaultMintingFee: BigInt(10 * 10**18), // 10 TIP tokens
      expiration: 0,
      commercialUse: true,
      commercialAttribution: true,
      commercializerChecker: "0x0000000000000000000000000000000000000000",
      commercializerCheckerData: "0x",
      commercialRevShare: 10, // 10% to original creator
      commercialRevCeiling: BigInt(1000000 * 10**18),
      derivativesAllowed: true, // Enable remixes
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: true,
      derivativeRevCeiling: BigInt(1000000 * 10**18),
      currency: TIP_TOKEN_ADDRESS
    };

    // 2. Upload metadata to IPFS
    const ipMetadataUri = await uploadToIPFS(chapterData);
    const nftMetadataUri = await uploadToIPFS({
      name: chapterData.title,
      description: `Chapter ${chapterData.chapterNumber} of ${chapterData.storyId}`,
      image: await generateChapterCover(chapterData),
      attributes: [
        { trait_type: 'Author', value: chapterData.author },
        { trait_type: 'Chapter Number', value: chapterData.chapterNumber },
        { trait_type: 'Story ID', value: chapterData.storyId }
      ]
    });

    // 3. Mint NFT + Register IP + Attach License in single transaction
    const result = await mintAndRegisterChapterWithLicense(
      STORYHOUSE_NFT_CONTRACT,
      chapterData,
      [{ terms: remixLicenseTerms }]
    );
    
    // 4. Store in database
    await updateChapterWithIpInfo(chapterData.storyId, chapterData.chapterNumber, {
      ipId: result.ipId,
      tokenId: result.tokenId,
      licenseTermsIds: result.licenseTermsIds,
      registeredAt: new Date()
    });
    
    return result;
  } catch (error) {
    console.error('Chapter registration failed:', error);
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
1. **Single-level remix**: Original → Remix
2. **Multi-level remix**: Original → Remix 1 → Remix 2
3. **Multiple remixes**: One original spawning multiple remixes
4. **License term variations**: Different fee structures and permissions
5. **Royalty flow**: Verify payments flow correctly up the chain

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
```

## Best Practices

1. **Use mintAndRegisterIpAssetWithPilTerms** for new chapters - single transaction is more gas efficient
2. **Always verify license terms** before minting license tokens
3. **Track remix lineage** in your database for faster queries
4. **Cache frequently accessed IP data** to reduce RPC calls
5. **Implement retry logic** for blockchain transactions
6. **Monitor gas costs** and optimize batch operations
7. **Validate metadata** before registration to avoid failed transactions
8. **Upload to IPFS first** before calling blockchain functions
9. **Use atomic operations** when possible to prevent partial state

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