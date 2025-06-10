# 🏗️ Technical Overview

Comprehensive technical architecture for StoryHouse.vip's Web3 storytelling platform.

## 🏛️ Architecture

### Vercel-Only Hosting

```
┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │
│  (Vercel)       │◄──►│  (Vercel)       │
│  Next.js App    │    │  API Routes     │
└─────────────────┘    └─────────────────┘
```

**Frontend:** React components, Web3 integration, user interface
**Backend:** API routes, Story Protocol SDK, AI integration, R2 storage

## 🔗 Smart Contracts

**Network:** Story Protocol Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform utility token |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution |
| Creator Controller | `0x8e2d21d1b9c744f772f15a7007de3d5757eea333` | Creator incentives |
| Read Controller | `0x04553ba8316d407b1c58b99172956d2d5fe100e5` | Reader rewards |
| Remix Controller | `0x16144746a33d9a172039efc64bc2e12445fbbef2` | IP licensing |
| Access Control | `0x41e2db0d016e83ddc3c464ffd260d22a6c898341` | Permission management |

## 📊 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Next.js | 15.3.3 | React application |
| Language | TypeScript | 5.8.3 | Type safety |
| Styling | Tailwind CSS | 3.4.17 | UI styling |
| Blockchain | Story Protocol SDK | 1.3.1 | IP management |
| AI | OpenAI GPT-4 | Latest | Content generation |
| Storage | Cloudflare R2 | - | Content storage |
| Hosting | Vercel | - | Application hosting |

## 🔗 Story Protocol Integration

### Chapter IP Registration

```typescript
// Register chapter as IP asset
const ipAsset = await storyClient.ipAsset.mintAndRegisterIp({
  spgNftContract: nftContract,
  ipMetadata: {
    ipMetadataURI: chapterMetadataURI,
    ipMetadataHash: chapterHash
  }
});

// Create license terms
const licenseTerms = await storyClient.license.registerPILTerms({
  transferable: true,
  commercialUse: true,
  derivativesAllowed: true,
  defaultMintingFee: tier.price
});
```

### Read-to-Earn Implementation

```typescript
// Distribute reading rewards
await rewardManager.distributeReadingReward({
  reader: readerAddress,
  chapterId: chapter.id,
  amount: calculateReward(chapter, streak)
});
```

## 🔄 API Architecture

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ip/register` | POST | Register chapter as IP asset |
| `/api/ip/license` | POST | Create/purchase licenses |
| `/api/generate` | POST | AI story generation |
| `/api/stories` | GET | Fetch published stories |

### Response Format

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: Hash;
}
```

## 💾 Data Architecture

### Cloudflare R2 Structure

```
stories/
├── story-{timestamp}-{id}/
│   ├── chapters/
│   │   ├── 1.json              # Chapter content + metadata
│   │   ├── 2.json
│   │   └── ...
│   └── metadata.json           # Story-level metadata
```

### Chapter Metadata

```typescript
interface ChapterMetadata {
  // Economics
  unlockPrice: number;          // TIP tokens required
  readReward: number;           // TIP tokens earned
  
  // IP Registration
  ipAssetId?: string;           // Story Protocol ID
  licenseTermsIds: string[];    // Applied licenses
  
  // Content
  genre: string[];              // Classification
  wordCount: number;            // Content metrics
  authorAddress: string;        // Creator wallet
}
```

## 🔐 Security

### Smart Contract Security
- OpenZeppelin AccessControl for permissions
- ReentrancyGuard for reentrancy protection
- Pausable for emergency stops

### Frontend Security
- Environment variable protection
- Input validation and sanitization
- XSS protection via Next.js

## ⚡ Performance

### Optimization Strategies
- Next.js Server-Side Rendering
- React Query for intelligent caching
- Code splitting and lazy loading
- Image optimization

### Test Coverage
- Smart Contracts: 131/132 tests passing (99.2%)
- TypeScript: 0 errors
- Security: 0 vulnerabilities

---

**StoryHouse.vip** - Pioneering granular IP monetization on blockchain.