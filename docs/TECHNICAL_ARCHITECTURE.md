# 🏗️ Technical Architecture

Comprehensive technical architecture for StoryHouse.vip's Web3 storytelling platform.

## 🏛️ System Architecture

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

### Core Innovation

```
Traditional Publishing:
📖 Book = 1 IP Asset = $1000+ registration

StoryHouse.vip Revolution:
📚 Story = Collection of Chapter IP Assets
├── 📄 Chapter 1 = IP Asset #1 = $50-500
├── 📄 Chapter 2 = IP Asset #2 = $50-500
└── 📄 Chapter 3 = IP Asset #3 = $50-500
```

### Chapter IP Registration

```typescript
// Initialize Story Protocol client
const storyConfig: StoryConfig = {
  account: walletAccount,
  transport: http(process.env.STORY_PROTOCOL_RPC_URL),
  chainId: "aeneid", // Story Protocol testnet
};

const storyClient = StoryClient.newClient(storyConfig);

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

### License Management

```typescript
// Standard License Tiers
export const LICENSE_TIERS = {
  standard: {
    name: "Standard License",
    price: BigInt("100000000000000000000"), // 100 TIP tokens
    royaltyPercentage: 5,
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false,
    },
  },
  premium: {
    name: "Premium License", 
    price: BigInt("500000000000000000000"), // 500 TIP tokens
    royaltyPercentage: 10,
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false,
    },
  },
};
```

### Read-to-Earn Implementation

```typescript
// Distribute reading rewards
await rewardManager.distributeReadingReward({
  reader: readerAddress,
  chapterId: chapter.id,
  amount: calculateReward(chapter, streak)
});

// Streak bonus calculation
const bonusMultiplier = Math.min(streak * 0.1, 1.0); // Max 100% bonus
const reward = baseReward * (1 + bonusMultiplier);
```

## 🌐 Cloudflare R2 Storage

### Architecture

R2 provides global CDN capabilities crucial for read-to-earn UX - fast chapter loading prevents user drop-off during token earning.

```
R2 Bucket Structure:
├── stories/
│   ├── {storyId}/
│   │   ├── metadata.json          # Story metadata
│   │   └── chapters/
│   │       ├── 1.json             # Chapter 1 content
│   │       ├── 2.json             # Chapter 2 content
│   │       └── ...
```

### Performance Benefits

- **Sub-100ms Loading**: 275+ edge locations worldwide
- **Mobile Optimized**: Critical for 83% mobile traffic  
- **90% Cost Reduction**: Compared to alternatives
- **Zero Egress Fees**: No charges for content delivery

### Chapter Metadata Structure

```typescript
interface ChapterMetadata {
  // Core Data
  storyId: string;
  chapterNumber: number;
  content: string;
  title: string;
  
  // Economics
  unlockPrice: number;          // TIP tokens required
  readReward: number;           // TIP tokens earned
  
  // IP Registration
  ipAssetId?: string;           // Story Protocol ID
  licenseTermsIds: string[];    // Applied licenses
  
  // Content Classification
  genre: string[];              // Classification
  wordCount: number;            // Content metrics
  authorAddress: string;        // Creator wallet
  
  // AI Metadata
  qualityScore: number;         // AI assessment (0-100)
  originalityScore: number;     // Uniqueness score (0-100)
  commercialViability: number;  // Market potential (0-100)
}
```

## 🔄 API Architecture

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ip/register` | POST | Register chapter as IP asset |
| `/api/ip/license` | POST | Create/purchase licenses |
| `/api/generate` | POST | AI story generation + auto R2 save |
| `/api/stories` | GET | Fetch published stories from R2 |
| `/api/upload` | POST | Manual R2 content upload |

### Seamless Integration Flow

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

### Response Format

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: Hash;
  
  // Enhanced for IP integration
  ipData?: {
    operationId: string;
    transactionHash: string;
    ipAssetId: string;
    gasUsed?: bigint;
  };
}
```

## 🔐 Security

### Smart Contract Security
- OpenZeppelin AccessControl for permissions
- ReentrancyGuard for reentrancy protection
- Pausable for emergency stops
- SafeERC20 for token transfers

### Frontend Security
- Environment variable protection
- Input validation and sanitization  
- XSS protection via Next.js
- Content validation before R2 upload

### Error Handling & Retry Strategy

```typescript
enum BlockchainErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS", 
  CONTRACT_ERROR = "CONTRACT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RPC_ERROR = "RPC_ERROR",
}

function getRetryStrategy(errorType: BlockchainErrorType): RetryStrategy {
  switch (errorType) {
    case BlockchainErrorType.NETWORK_ERROR:
    case BlockchainErrorType.RPC_ERROR:
      return {
        shouldRetry: true,
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
      };
    // ... other cases
  }
}
```

## ⚡ Performance

### Optimization Strategies
- Next.js Server-Side Rendering
- React Query for intelligent caching
- Code splitting and lazy loading
- Image optimization
- R2 global CDN integration

### Caching Strategy

```typescript
class StoryProtocolCache {
  private ipAssetCache = new Map<string, IPAsset>();
  private licenseTermsCache = new Map<string, LicenseTerms>();

  async getIPAsset(ipId: string): Promise<IPAsset | null> {
    if (this.ipAssetCache.has(ipId)) {
      return this.ipAssetCache.get(ipId)!;
    }

    const ipAsset = await fetchIPAssetFromBlockchain(ipId);
    if (ipAsset) {
      this.ipAssetCache.set(ipId, ipAsset);
    }

    return ipAsset;
  }
}
```

### Test Coverage
- Smart Contracts: 131/132 tests passing (99.2%)
- TypeScript: 0 errors
- Security: 0 vulnerabilities

## 🔧 Configuration

### Environment Variables

```bash
# Story Protocol
STORY_PROTOCOL_RPC_URL=https://testnet.storyrpc.io
STORY_PROTOCOL_CHAIN_ID=1315
STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyhouse-content
R2_PUBLIC_URL=https://your_account_id.r2.cloudflarestorage.com/storyhouse-content

# OpenAI
OPENAI_API_KEY=your_openai_key
```

### Network Configuration

| Environment | Network | Chain ID | RPC URL | Status |
|-------------|---------|----------|---------|--------|
| Development | Aeneid Testnet | 1315 | https://testnet.storyrpc.io | ✅ Active |
| Staging | Aeneid Testnet | 1315 | https://testnet.storyrpc.io | ✅ Active |
| Production | Story Mainnet | 1 | https://rpc.story.foundation | 🚀 Ready |

## 🔮 Future Enhancements

### Multi-Chain Support
```typescript
const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  story: {
    chainId: 1,
    rpcUrl: "https://rpc.story.foundation", 
    storyProtocolAddress: "0x...",
    supportedFeatures: ["ip-registration", "licensing", "royalties"],
  },
  polygon: {
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    storyProtocolAddress: "0x...", 
    supportedFeatures: ["ip-registration", "licensing"],
  },
};
```

### Advanced Features
- Cross-chain IP bridging
- Automated royalty distribution
- AI-powered content verification
- Institutional licensing tools
- IPFS hybrid storage (R2 primary, IPFS backup)

---

**StoryHouse.vip** - Pioneering granular IP monetization on blockchain with seamless user experience.