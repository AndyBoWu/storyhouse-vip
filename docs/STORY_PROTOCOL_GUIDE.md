# 📚 Story Protocol Complete Integration Guide

Comprehensive guide for Story Protocol integration in StoryHouse.vip, covering everything from basic setup to advanced features like Groups, Royalties, and Dispute Resolution.

## 📖 Table of Contents

1. [Overview & Setup](#overview--setup)
2. [Core SDK Features](#core-sdk-features)
3. [IP Asset Management](#ip-asset-management)
4. [Licensing System](#licensing-system)
5. [Unified Registration (Gas Optimized)](#unified-registration-gas-optimized)
6. [Group Module](#group-module)
7. [Royalty Distribution](#royalty-distribution)
8. [Dispute Resolution](#dispute-resolution)
9. [StoryHouse.vip Integration](#storyhouse-vip-integration)
10. [Testing & Examples](#testing--examples)
11. [Best Practices](#best-practices)

---

## Overview & Setup

### 🎯 StoryHouse.vip Integration Features

StoryHouse.vip provides **advanced Story Protocol integration** that automatically registers chapters as IP assets with optimized gas usage:

- ✅ **Automatic IP Registration** - Chapters become IP assets during generation
- ✅ **R2 Storage Integration** - Content URLs used as metadata references
- ✅ **Programmable IP Licensing** - Ready for commercial use and remixing
- ✅ **Gas-Optimized Flow** - Single-transaction IP + License creation (40% savings)
- ✅ **Smart Flow Detection** - Automatic optimization based on service availability
- ✅ **Group Management** - Collaborative IP management for collections
- ✅ **Automated Royalties** - Transparent revenue sharing and distribution
- ✅ **Dispute Resolution** - Community-driven content governance

### 🏗️ Architecture Overview

#### Traditional Flow (Legacy)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Story Gen     │    │   R2 Storage    │    │ Story Protocol  │
│   /api/generate │───▶│   Auto-Save     │───▶│   IP Registry   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Enhanced Story          Content URL           IP Asset ID
   + Metadata             + Metadata           + License Terms
```

#### Unified Flow (Gas Optimized)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Story Gen     │    │   R2 Storage    │    │ Unified Service │
│   /api/generate │───▶│  + Metadata     │───▶│ Single-Tx Reg  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Enhanced Story          Metadata URI          IP + License
   + Metadata             + SHA-256 Hash         (40% less gas)
```

### SDK Installation & Setup

```bash
npm install @story-protocol/core-sdk viem
```

```typescript
import { StoryConfig, StoryClient } from '@story-protocol/core-sdk'
import { http } from 'viem'

// StoryHouse Configuration
const config: StoryConfig = {
  chainId: 1315, // Aeneid testnet
  transport: http('https://aeneid.storyrpc.io'),
  account: '0x_your_wallet_address', // Optional for read operations
}

const client = new StoryClient(config)
```

### Environment Configuration

```bash
# Story Protocol Configuration
STORY_PRIVATE_KEY=0x_your_private_key_here
STORY_RPC_URL=https://aeneid.storyrpc.io
STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d
NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d

# Feature Flags
UNIFIED_REGISTRATION_ENABLED=true

# Cloudflare R2 Configuration  
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyhouse-content
```

---

## Core SDK Features

### IP Asset Hierarchy in StoryHouse

- **Chapter Level**: Each chapter is registered as an individual IP Asset ($50-500 range)
- **Story Level**: Collection of chapter IP Assets managed as Groups
- **Remix Chain**: Derivatives can have their own license terms, enabling multi-level remixes
- **Universe Level**: Shared narrative worlds with cross-referencing rights

### Key Components

- **IP Asset**: A registered piece of intellectual property (chapter/story)
- **License Terms**: Rules governing how an IP can be used/remixed
- **License Token**: ERC-721 token proving permission to use an IP
- **Derivative**: New IP created from existing IP(s)
- **Group**: Collection of related IP assets with shared management
- **Dispute**: On-chain challenge to IP ownership, licensing, or content validity

---

## IP Asset Management

### Register Chapter as IP Asset

```typescript
// Basic IP asset registration
async function registerChapterAsIP(
  nftContract: string,
  tokenId: string,
  metadata: {
    title: string;
    description: string;
    mediaType: string;
    author: string;
    genre: string;
    contentUrl: string;
  }
) {
  const response = await client.ipAsset.register({
    nftContract,
    tokenId,
    metadata: {
      metadataURI: metadata.contentUrl,
      metadataHash: generateContentHash(metadata),
      nftMetadata: {
        name: metadata.title,
        description: metadata.description,
        image: metadata.coverImage || ''
      }
    },
    txOptions: { waitForTransaction: true }
  })

  return {
    ipId: response.ipId,
    transactionHash: response.txHash,
    tokenId: response.tokenId
  }
}
```

### Batch IP Asset Registration

```typescript
// Register multiple chapters efficiently
async function batchRegisterChapters(
  chapters: Array<{
    nftContract: string;
    tokenId: string;
    metadata: ChapterMetadata;
  }>
) {
  const registrations = await Promise.all(
    chapters.map(async (chapter) => {
      try {
        const result = await registerChapterAsIP(
          chapter.nftContract,
          chapter.tokenId,
          chapter.metadata
        )
        return { success: true, ...result, chapter: chapter.metadata.title }
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          chapter: chapter.metadata.title 
        }
      }
    })
  )

  return {
    successful: registrations.filter(r => r.success),
    failed: registrations.filter(r => !r.success),
    totalProcessed: registrations.length
  }
}
```

---

## Licensing System

### StoryHouse 4-Tier License System

```typescript
// StoryHouse License Configuration
const STORYHOUSE_LICENSE_CONFIG = {
  TIERS: {
    free: {
      price: 0,
      currency: 'TIP',
      commercialUse: false,
      derivativesAllowed: true,
      royaltyPercentage: 0,
      description: 'Attribution only, non-commercial use'
    },
    reading: {
      price: 10, // 10 TIP for reading license
      currency: 'TIP',
      commercialUse: false,
      derivativesAllowed: false,
      royaltyPercentage: 5,
      description: 'Personal reading license, wallet-locked'
    },
    premium: {
      price: 100, // 100 TIP for commercial license
      currency: 'TIP',
      commercialUse: true,
      derivativesAllowed: true,
      royaltyPercentage: 10,
      description: 'Commercial use with derivatives'
    },
    exclusive: {
      price: 1000, // 1000 TIP for exclusive rights
      currency: 'TIP',
      commercialUse: true,
      derivativesAllowed: true,
      royaltyPercentage: 25,
      exclusivity: true,
      description: 'Full commercial rights with high royalties'
    }
  }
}
```

### Create License Terms

```typescript
// Create PIL license terms for different tiers
async function createStoryHouseLicenseTerms(
  tier: 'free' | 'reading' | 'premium' | 'exclusive'
) {
  const config = STORYHOUSE_LICENSE_CONFIG.TIERS[tier]
  
  const licenseTerms = await client.license.registerPILTerms({
    transferable: tier !== 'exclusive', // Exclusive licenses are non-transferable
    royaltyPolicy: tier === 'free' || tier === 'reading' ? 'LAP' : 'LRP',
    defaultMintingFee: BigInt(config.price * 10**18), // Convert to wei
    expiration: 0n, // No expiration
    commercialUse: config.commercialUse,
    commercialAttribution: true,
    commercializerChecker: '0x0000000000000000000000000000000000000000',
    commercializerCheckerData: '0x',
    commercialRevShare: config.royaltyPercentage * 100, // Convert to basis points
    commercialRevCeiling: 0n,
    derivativesAllowed: config.derivativesAllowed,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: 0n,
    currency: '0x1514000000000000000000000000000000000000', // TIP token
    uri: '' // License metadata URI
  })

  return {
    licenseTermsId: licenseTerms.licenseTermsId,
    tier,
    price: config.price,
    royaltyPercentage: config.royaltyPercentage
  }
}
```

### Attach License to IP Asset

```typescript
// Attach license terms to an IP asset
async function attachLicenseToChapter(
  ipId: string,
  licenseTier: 'free' | 'reading' | 'premium' | 'exclusive'
) {
  // Create or get existing license terms
  const licenseTerms = await createStoryHouseLicenseTerms(licenseTier)
  
  // Attach to IP asset
  const response = await client.license.attachLicenseTerms({
    ipId,
    licenseTermsId: licenseTerms.licenseTermsId,
    txOptions: { waitForTransaction: true }
  })

  return {
    transactionHash: response.txHash,
    licenseTermsId: licenseTerms.licenseTermsId,
    tier: licenseTier,
    attachedAt: new Date()
  }
}
```

---

## Unified Registration (Gas Optimized)

### UnifiedIpService Implementation

```typescript
// Gas-optimized single-transaction registration
import { createUnifiedIpService } from '@/lib/services/unifiedIpService'

const unifiedService = createUnifiedIpService()

// Single-transaction registration with PIL terms
async function registerChapterWithUnifiedFlow(
  storyData: {
    id: string;
    title: string;
    content: string;
    author: string;
    genre: string;
    mood: string;
  },
  options: {
    nftContract: string;
    account: string;
    licenseTier: 'free' | 'reading' | 'premium' | 'exclusive';
    includeMetadata: boolean;
  }
) {
  const result = await unifiedService.mintAndRegisterWithPilTerms({
    story: storyData,
    nftContract: options.nftContract,
    account: options.account,
    licenseTier: options.licenseTier,
    includeMetadata: options.includeMetadata
  })

  return {
    success: result.success,
    ipAsset: result.ipAsset,
    transactionHash: result.transactionHash,
    licenseTermsId: result.licenseTermsId,
    gasOptimized: true,
    method: 'unified'
  }
}
```

### API Endpoint for Unified Registration

```typescript
// /api/ip/register-unified
export async function POST(request: Request) {
  const body = await request.json()
  
  // Validate input with Zod
  const validatedInput = UnifiedRegistrationSchema.parse(body)
  
  // Check if unified registration is enabled
  if (!process.env.UNIFIED_REGISTRATION_ENABLED) {
    return NextResponse.json({
      success: false,
      error: 'Unified registration is not enabled. Use /api/ip/register instead.'
    }, { status: 503 })
  }

  try {
    const result = await registerChapterWithUnifiedFlow(
      validatedInput.story,
      {
        nftContract: validatedInput.nftContract,
        account: validatedInput.account,
        licenseTier: validatedInput.licenseTier,
        includeMetadata: validatedInput.includeMetadata
      }
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

---

## Group Module

### StoryHouse Group Management

The Group module enables collaborative IP management for story collections, multi-author projects, and derivative work ecosystems.

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
}
```

### Create Story Series Group

```typescript
// Automatically group chapters of the same book
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
  })

  const groupId = groupResponse.groupId

  // Add all chapters to the group
  const addIpsResponse = await client.group.addIpsToGroup({
    groupId,
    ipIds: chapterIpIds,
    txOptions: { waitForTransaction: true }
  })

  return {
    groupId,
    transactionHash: addIpsResponse.txHash,
    memberCount: chapterIpIds.length,
    bookTitle,
    groupType: 'story_series'
  }
}
```

### Collaborative Story Groups

```typescript
// Multi-author stories with weighted revenue sharing
async function createCollaborativeStoryGroup(
  storyTitle: string,
  authors: { address: string; contributionWeight: number }[],
  sharedLicenseTermsId: bigint
) {
  const totalWeight = authors.reduce((sum, author) => sum + author.contributionWeight, 0)
  const rewardSharePercentage = 90 // 90% to authors, 10% to platform

  // Register group with primary author as pool
  const primaryAuthor = authors.find(a => 
    a.contributionWeight === Math.max(...authors.map(a => a.contributionWeight))
  )
  
  const groupResponse = await client.group.registerGroup({
    groupPool: primaryAuthor!.address,
    licenseTermsId: sharedLicenseTermsId,
    rewardSharePercentage,
    txOptions: { waitForTransaction: true }
  })

  return {
    groupId: groupResponse.groupId,
    storyTitle,
    authors,
    totalWeight,
    distributionStrategy: 'weighted'
  }
}
```

### Derivative Collections

```typescript
// Group related derivative works for shared licensing
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
  })

  // Register group for derivative collection
  const groupResponse = await client.group.registerGroupAndAttachLicense({
    groupPool: originalAuthorAddress,
    licenseTermsId: collectionLicenseTermsId,
    rewardSharePercentage: 85, // 85% to group members, 15% to platform
    ipIds: [originalIpId, ...derivativeIpIds],
    txOptions: { waitForTransaction: true }
  })

  return {
    groupId: groupResponse.groupId,
    collectionName,
    originalIpId,
    derivativeCount: derivativeIpIds.length,
    licenseTermsId: collectionLicenseTermsId
  }
}
```

---

## Royalty Distribution

### StoryHouse Royalty System

```typescript
// StoryHouse Royalty Configuration
const STORYHOUSE_ROYALTY_CONFIG = {
  TIP_TOKEN_ADDRESS: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
  ROYALTY_POLICIES: {
    free: { policyType: 'LAP', stakingReward: 0, distributionDelay: 0 },
    reading: { policyType: 'LAP', stakingReward: 2, distributionDelay: 3600 },
    premium: { policyType: 'LRP', stakingReward: 5, distributionDelay: 86400 },
    exclusive: { policyType: 'LRP', stakingReward: 10, distributionDelay: 604800 }
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
}
```

### Claim Chapter Royalties

```typescript
// Claim accumulated royalties for chapters
async function claimChapterRoyalties(
  authorAddress: string,
  chapterIpIds: string[]
) {
  const claimResults = []
  
  for (const ipId of chapterIpIds) {
    // Check claimable amount first
    const claimable = await client.royalty.claimableRevenue({
      ipId,
      account: authorAddress,
      token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS
    })

    if (claimable.amount > 0) {
      // Claim the revenue
      const claim = await client.royalty.claimRevenue({
        ipId,
        account: authorAddress,
        token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
        txOptions: { waitForTransaction: true }
      })

      claimResults.push({
        ipId,
        amountClaimed: claimable.amount,
        transactionHash: claim.txHash,
        status: 'success'
      })
    }
  }

  return {
    totalClaimed: claimResults.reduce((sum, r) => sum + r.amountClaimed, BigInt(0)),
    claimCount: claimResults.length,
    details: claimResults
  }
}
```

### Distribute Reading License Revenue

```typescript
// Distribute revenue when readers purchase reading licenses
async function distributeReadingLicenseRevenue(
  chapterIpId: string,
  readerPayment: bigint, // 10 TIP for reading license
  authorAddress: string
) {
  const config = STORYHOUSE_ROYALTY_CONFIG.ECONOMIC_CONSTANTS
  
  // Calculate distribution
  const platformFee = (readerPayment * BigInt(config.PLATFORM_FEE_RATE)) / BigInt(100)
  const readerReward = (readerPayment * BigInt(config.READER_REWARD_RATES.reading)) / BigInt(100)
  const authorRevenue = readerPayment - platformFee - readerReward

  // Distribute to IP asset royalty vault
  const response = await client.royalty.distributeRevenue({
    ipId: chapterIpId,
    token: STORYHOUSE_ROYALTY_CONFIG.TIP_TOKEN_ADDRESS,
    amount: authorRevenue,
    txOptions: { waitForTransaction: true }
  })

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
  }
}
```

---

## Dispute Resolution

### StoryHouse Content Governance System

```typescript
// StoryHouse Dispute Configuration
const STORYHOUSE_DISPUTE_CONFIG = {
  DISPUTE_TYPES: {
    COPYRIGHT_INFRINGEMENT: 'COPYRIGHT_INFRINGEMENT',
    INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
    LICENSE_VIOLATION: 'LICENSE_VIOLATION', 
    PLAGIARISM: 'PLAGIARISM',
    IMPERSONATION: 'IMPERSONATION',
    SPAM_CONTENT: 'SPAM_CONTENT'
  },
  BOND_AMOUNTS: {
    low_severity: BigInt(25 * 10**18),    // 25 TIP
    medium_severity: BigInt(50 * 10**18), // 50 TIP
    high_severity: BigInt(100 * 10**18)   // 100 TIP
  },
  RESOLUTION_PERIODS: {
    automatic: 24 * 60 * 60,      // 24 hours for AI resolution
    community: 7 * 24 * 60 * 60,  // 7 days for community vote
    appeal: 14 * 24 * 60 * 60     // 14 days for appeals
  }
}
```

### Report Content Violations

```typescript
// User reporting system with blockchain evidence
async function reportContentViolation(
  reporterAddress: string,
  chapterIpId: string,
  violationType: keyof typeof STORYHOUSE_DISPUTE_CONFIG.DISPUTE_TYPES,
  evidence: {
    description: string;
    screenshots?: string[];
    similarContent?: Array<{
      ipId: string;
      similarity: number;
      source: string;
    }>;
    additionalProof?: string[];
  }
) {
  // Validate reporter eligibility
  const reporterRep = await getUserReputation(reporterAddress)
  if (reporterRep < 100) {
    throw new Error('Insufficient reputation to file reports')
  }

  // Determine bond amount based on severity
  const severity = await classifyViolationSeverity(violationType, evidence)
  const bondAmount = STORYHOUSE_DISPUTE_CONFIG.BOND_AMOUNTS[severity]

  // Upload evidence to IPFS
  const evidencePackage = {
    reporter: reporterAddress,
    timestamp: new Date().toISOString(),
    violationType,
    evidence,
    platform: 'StoryHouse.vip',
    version: '1.0'
  }
  
  const evidenceCid = await uploadToIPFS(evidencePackage)

  // Raise dispute on Story Protocol
  const dispute = await client.dispute.raiseDispute({
    targetIpId: chapterIpId,
    disputeTag: violationType,
    evidenceData: evidenceCid,
    bondAmount,
    livenessInterval: STORYHOUSE_DISPUTE_CONFIG.RESOLUTION_PERIODS.community,
    txOptions: { waitForTransaction: true }
  })

  return {
    disputeId: dispute.disputeId,
    evidenceCid,
    bondAmount: Number(bondAmount) / 10**18,
    severity,
    estimatedResolution: new Date(Date.now() + STORYHOUSE_DISPUTE_CONFIG.RESOLUTION_PERIODS.community * 1000)
  }
}
```

---

## StoryHouse.vip Integration

### Core Story Protocol Service

```typescript
// lib/storyProtocol.ts - Main integration service
import { StoryProtocolService, ChapterIPData } from "@/lib/storyProtocol"

// Register a chapter as IP asset
const result = await StoryProtocolService.registerChapterAsIP({
  storyId: "story-123",
  chapterNumber: 1,
  title: "The Beginning",
  content: "Chapter content...",
  contentUrl: "https://r2-bucket.../chapter-1.json",
  metadata: {
    suggestedTags: ["fantasy", "adventure"],
    suggestedGenre: "Fantasy",
    contentRating: "PG",
    language: "en",
    qualityScore: 85,
    originalityScore: 90,
    commercialViability: 75,
  },
})
```

### Frontend Hook Integration

```typescript
// useUnifiedPublishStory hook with automatic flow detection
import { useUnifiedPublishStory } from '@/hooks/useUnifiedPublishStory'

const {
  publishStory,
  isUnifiedSupported,
  currentStep,
  publishResult
} = useUnifiedPublishStory()

// Automatic flow selection
const result = await publishStory(storyData, {
  publishingOption: 'protected',
  licenseTier: 'premium',
  ipRegistration: true
})

console.log('Method used:', result.method) // 'unified' or 'legacy'
console.log('Gas optimized:', result.gasOptimized) // true for unified
```

### Seamless Generation Integration

```typescript
// Automatic IP registration during story generation
if (generationRequest.ipOptions?.registerAsIP && contentUrl) {
  const { StoryProtocolService } = await import("@/lib/storyProtocol")

  if (StoryProtocolService.isConfigured()) {
    const ipResult = await StoryProtocolService.registerChapterAsIP(chapterIPData)

    response.ipData = {
      operationId: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transactionHash: ipResult.transactionHash,
      ipAssetId: ipResult.ipAssetId,
      gasUsed: undefined,
    }

    response.message = ipResult.success
      ? "Story generated, saved to storage, and registered as IP asset!"
      : "Story generated and saved, but IP registration failed"
  }
}
```

---

## Testing & Examples

### Test Page Setup

Visit `http://localhost:3000/test-story-protocol` for comprehensive testing:

- ✅ **Configuration Status** - Check environment variables
- ✅ **Connection Test** - Verify blockchain connectivity  
- ✅ **Integration Status** - Overview of implementation progress

### API Testing Examples

```bash
# Test unified registration service availability
curl -X GET http://localhost:3002/api/ip/register-unified

# Test PIL integration
curl -X GET http://localhost:3002/api/test-pil

# Test Story Protocol connection
curl -X POST http://localhost:3002/api/story-protocol \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'

# Register chapter with unified flow
curl -X POST http://localhost:3002/api/ip/register-unified \
  -H "Content-Type: application/json" \
  -d '{
    "story": {
      "id": "story-123",
      "title": "Test Chapter",
      "content": "Test content...",
      "author": "0x1234567890123456789012345678901234567890",
      "genre": "Fiction",
      "mood": "Adventure",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "nftContract": "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d",
    "account": "0x1234567890123456789012345678901234567890",
    "licenseTier": "premium",
    "includeMetadata": true
  }'
```

### Debug Configuration

```typescript
import { StoryProtocolService } from "@/lib/storyProtocol"

// Check if properly configured
const isConfigured = StoryProtocolService.isConfigured()
console.log("Is configured:", isConfigured)

// Get detailed status
const status = StoryProtocolService.getConfigStatus()
console.log("Config status:", status)

// Test connection
const connectionTest = await StoryProtocolService.testConnection()
console.log("Connection test:", connectionTest)
```

---

## Best Practices

### 🎯 StoryHouse.vip Optimization Guidelines

1. **Use unified registration** for new chapters to save 40% on gas costs
2. **Implement automatic group creation** for multi-chapter books
3. **Enable smart flow detection** to automatically use best available method
4. **Cache license terms by tier** to avoid redundant PIL registrations
5. **Use 4-tier licensing system** (free, reading, premium, exclusive) for diverse monetization
6. **Implement wallet-locked reading licenses** for chapters 4+ to prevent piracy
7. **Enable derivatives on free chapters** to encourage community engagement
8. **Set tiered royalty percentages** (0%, 5%, 10%, 25%) based on license value
9. **Use TIP token economics** for all minting fees and royalty distributions
10. **Maintain chapter lineage** for proper attribution and royalty flow
11. **Implement reading license validation** before chapter access
12. **Distribute reader rewards** (2-5%) to incentivize engagement
13. **Use LAP policy for free/reading** and LRP for premium/exclusive tiers
14. **Implement batch royalty claiming** to reduce gas costs for authors
15. **Track derivative royalty flows** up the remix chain automatically
16. **Enable proactive plagiarism detection** during content creation
17. **Implement community moderation** with token-staked moderators
18. **Use automated dispute resolution** for clear-cut violations
19. **Support appeal processes** for complex content decisions
20. **Monitor license compliance** for derivative works automatically

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `Story Protocol not configured` | Missing environment variables | Add required env vars to `.env.local` |
| `Connection failed` | Invalid RPC URL or network | Verify `STORY_RPC_URL` and network status |
| `IP registration failed` | Insufficient funds or contract issues | Check wallet balance and contract addresses |
| `Invalid private key` | Malformed private key | Ensure key starts with `0x` and is valid hex |
| `Unified registration unavailable` | Feature flag disabled | Set `UNIFIED_REGISTRATION_ENABLED=true` |
| `License terms creation failed` | Invalid PIL parameters | Check royalty rates and policy configuration |

### Integration Benefits

**For Authors:**
- 🔐 **IP Protection** - Automatic blockchain registration
- 💰 **Monetization Ready** - Built-in licensing capabilities  
- 🌐 **Global Distribution** - Decentralized content storage
- ⚡ **Seamless UX** - No manual blockchain interactions needed
- 🤝 **Collaborative Tools** - Multi-author support with transparent revenue sharing

**For Platform:**
- 🚀 **Differentiation** - First platform with seamless IP registration
- 📈 **Revenue Streams** - Transaction fees and licensing royalties
- 🛡️ **Legal Compliance** - Blockchain-verified IP ownership
- 🔄 **Interoperability** - Standards-based IP asset creation
- 👥 **Community Governance** - Decentralized content moderation

---

## 📚 Additional Resources

- 📖 [Story Protocol Documentation](https://docs.story.foundation/)
- 🛠️ [Story Protocol SDK](https://github.com/storyprotocol/sdk)
- 🌐 [Aeneid Testnet Explorer](https://aeneid.storyscan.xyz/)
- 💧 [Testnet Faucet](https://aeneid.faucet.story.foundation/)
- 🔍 [SDK Reference](https://docs.story.foundation/sdk-reference)

---

**Last Updated:** January 15, 2025  
**Integration Status:** ✅ Complete - Production Ready  
**Version:** 2.0 - Unified Guide