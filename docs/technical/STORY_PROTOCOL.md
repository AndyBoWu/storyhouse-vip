# 🔗 Story Protocol Integration Guide

Comprehensive guide for Story Protocol blockchain integration in StoryHouse.vip.

## 🎯 **Integration Overview**

StoryHouse.vip leverages Story Protocol for **chapter-level IP asset management**, enabling authors to register individual chapters as blockchain-verified intellectual property assets instead of entire books.

### **Core Innovation**

```
Traditional Publishing:
📖 Book = 1 IP Asset = $1000+ registration

StoryHouse.vip Revolution:
📚 Story = Collection of Chapter IP Assets
├── 📄 Chapter 1 = IP Asset #1 = $50-500
├── 📄 Chapter 2 = IP Asset #2 = $50-500
└── 📄 Chapter 3 = IP Asset #3 = $50-500
```

---

## 🏗️ **Technical Architecture**

### **Story Protocol SDK Integration**

```typescript
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { http, createPublicClient, createWalletClient } from "viem";

// Initialize Story Protocol client
const storyConfig: StoryConfig = {
  account: walletAccount,
  transport: http(process.env.STORY_PROTOCOL_RPC_URL),
  chainId: "aeneid", // Story Protocol testnet
};

const storyClient = StoryClient.newClient(storyConfig);
```

### **Network Configuration**

| Environment     | Network        | Chain ID | RPC URL                      | Status    |
| --------------- | -------------- | -------- | ---------------------------- | --------- |
| **Development** | Aeneid Testnet | 1513     | https://testnet.storyrpc.io  | ✅ Active |
| **Staging**     | Aeneid Testnet | 1513     | https://testnet.storyrpc.io  | ✅ Active |
| **Production**  | Story Mainnet  | 1        | https://rpc.story.foundation | 🚀 Ready  |

---

## 🔄 **Core IP Operations**

### **1. Chapter IP Registration**

**Mint and Register IP Asset:**

```typescript
async function registerChapterAsIPAsset(
  chapterData: ChapterData,
  nftContract: Address,
  account: Address
): Promise<RegisterIPAssetResponse> {
  // Upload metadata to IPFS
  const metadataURI = await uploadToIPFS({
    title: chapterData.title,
    description: chapterData.content.substring(0, 200),
    mediaType: "text/story",
    genre: chapterData.genre,
    wordCount: chapterData.content.length,
    author: chapterData.author,
    createdAt: new Date().toISOString(),
  });

  // Register as IP Asset on Story Protocol
  const result = await storyClient.ipAsset.mintAndRegisterIp({
    spgNftContract: nftContract,
    ipMetadata: {
      ipMetadataURI: metadataURI,
      ipMetadataHash: calculateHash(metadataURI),
      nftMetadataURI: metadataURI,
      nftMetadataHash: calculateHash(metadataURI),
    },
    txOptions: { waitForTransaction: true },
  });

  return {
    success: true,
    ipAssetId: result.ipId,
    tokenId: result.tokenId,
    transactionHash: result.txHash,
  };
}
```

### **2. License Terms Creation**

**Register Programmable IP License (PIL) Terms:**

```typescript
async function createLicenseTerms(
  tier: LicenseTier,
  royaltyPolicyAddress: Address
): Promise<CreateLicenseResponse> {
  const licenseResult = await storyClient.license.registerPILTerms({
    transferable: true,
    royaltyPolicy: royaltyPolicyAddress,
    defaultMintingFee: tier.price, // e.g., 100 TIP tokens
    expiration: 0n, // No expiration
    commercialUse: tier.terms.commercialUse,
    commercialAttribution: tier.terms.attribution,
    commercializerChecker: "0x0000000000000000000000000000000000000000",
    commercializerCheckerData: "0x",
    commercialRevShare: tier.royaltyPercentage, // e.g., 5%
    commercialRevCeiling: 0n,
    derivativesAllowed: tier.terms.derivativesAllowed,
    derivativesAttribution: tier.terms.attribution,
    derivativesApproval: false,
    derivativesReciprocal: tier.terms.shareAlike,
    derivativeRevCeiling: 0n,
    currency: "0x1514000000000000000000000000000000000000", // TIP token
    uri: "",
    txOptions: { waitForTransaction: true },
  });

  return {
    success: true,
    licenseTermsId: licenseResult.licenseTermsId,
    transactionHash: licenseResult.txHash,
  };
}
```

### **3. License Attachment**

**Attach License Terms to IP Asset:**

```typescript
async function attachLicenseToChapter(
  ipAssetId: string,
  licenseTermsId: string
): Promise<AttachLicenseResponse> {
  const attachResult = await storyClient.license.attachLicenseTerms({
    ipId: ipAssetId as Address,
    licenseTermsId: licenseTermsId,
    txOptions: { waitForTransaction: true },
  });

  return {
    success: true,
    transactionHash: attachResult.txHash,
  };
}
```

### **4. License Token Minting**

**Purchase License for Derivatives:**

```typescript
async function purchaseChapterLicense(
  parentChapterIpId: string,
  licenseTermsId: string,
  buyer: Address
): Promise<PurchaseLicenseResponse> {
  const purchaseResult = await storyClient.license.mintLicenseTokens({
    licensorIpId: parentChapterIpId as Address,
    licenseTermsId: licenseTermsId,
    licenseTemplate: undefined, // Use default PIL template
    maxMintingFee: BigInt("1000000000000000000"), // 1 ETH max
    maxRevenueShare: 100, // 100% max revenue share
    amount: 1,
    receiver: buyer,
    txOptions: { waitForTransaction: true },
  });

  return {
    success: true,
    licenseTokenId: purchaseResult.licenseTokenIds[0],
    transactionHash: purchaseResult.txHash,
  };
}
```

### **5. Derivative Registration**

**Register Remix/Derivative Chapter:**

```typescript
async function registerDerivativeChapter(
  derivativeIpId: Address,
  parentChapterIpIds: string[],
  licenseTermsIds: string[]
): Promise<CreateDerivativeResponse> {
  const derivativeResult = await storyClient.ipAsset.registerDerivative({
    childIpId: derivativeIpId,
    parentIpIds: parentChapterIpIds as Address[],
    licenseTermsIds: licenseTermsIds,
    txOptions: { waitForTransaction: true },
  });

  return {
    success: true,
    derivative: {
      childIpId: derivativeResult.childIpId || derivativeIpId,
      parentIpIds: parentChapterIpIds,
      licenseTermsIds: licenseTermsIds,
    },
    transactionHash: derivativeResult.txHash,
  };
}
```

### **6. Royalty Collection**

**Claim Revenue from Derivatives:**

```typescript
async function claimChapterRoyalties(
  chapterIpId: string,
  claimer: Address,
  currencyTokens: Address[]
): Promise<ClaimRoyaltyResponse> {
  const claimResult = await storyClient.royalty.claimAllRevenue({
    ancestorIpId: chapterIpId as Address,
    claimer: claimer,
    childIpIds: [], // All children
    royaltyPolicies: [], // All policies
    currencyTokens: currencyTokens,
  });

  return {
    success: true,
    amount: claimResult.claimedTokens[0]?.amount || BigInt(0),
    transactionHash: claimResult.txHashes[0],
  };
}
```

---

## 💰 **License Tier System**

### **Standard License Tiers**

```typescript
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
  exclusive: {
    name: "Exclusive License",
    price: BigInt("2000000000000000000000"), // 2000 TIP tokens
    royaltyPercentage: 20,
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: true,
    },
  },
};
```

### **Custom License Creation**

```typescript
interface CustomLicenseTerms {
  price: bigint;
  royaltyPercentage: number;
  commercialUse: boolean;
  derivativesAllowed: boolean;
  attribution: boolean;
  exclusivity: boolean;
  territories: string[];
  distributionChannels: string[];
  contentRestrictions: string[];
}

async function createCustomLicense(
  terms: CustomLicenseTerms
): Promise<CreateLicenseResponse> {
  // Implementation for custom license creation
}
```

---

## 🔐 **Security & Error Handling**

### **Blockchain Error Types**

```typescript
enum BlockchainErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RPC_ERROR = "RPC_ERROR",
  GAS_ESTIMATION_ERROR = "GAS_ESTIMATION_ERROR",
}

interface BlockchainError {
  type: BlockchainErrorType;
  message: string;
  userMessage: string;
  code?: number;
  data?: any;
}
```

### **Retry Strategy**

```typescript
interface RetryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
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

    case BlockchainErrorType.GAS_ESTIMATION_ERROR:
      return {
        shouldRetry: true,
        maxRetries: 2,
        baseDelay: 500,
        backoffMultiplier: 1.5,
      };

    case BlockchainErrorType.INSUFFICIENT_FUNDS:
    case BlockchainErrorType.VALIDATION_ERROR:
      return {
        shouldRetry: false,
        maxRetries: 0,
        baseDelay: 0,
        backoffMultiplier: 1,
      };

    default:
      return {
        shouldRetry: true,
        maxRetries: 1,
        baseDelay: 1000,
        backoffMultiplier: 1,
      };
  }
}
```

### **Gas Optimization**

```typescript
async function calculateGasWithBuffer(
  operation: () => Promise<any>,
  bufferPercentage: number = 20
): Promise<bigint> {
  try {
    const estimatedGas = await publicClient.estimateGas(operation);
    const buffer = (estimatedGas * BigInt(bufferPercentage)) / BigInt(100);
    return estimatedGas + buffer;
  } catch (error) {
    // Fallback to default gas limits
    return BigInt(500000); // 500k gas default
  }
}
```

---

## 📊 **Transaction Monitoring**

### **Transaction Status Tracking**

```typescript
interface TransactionStatus {
  hash: Hash;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: bigint;
  gasUsed?: bigint;
  timestamp: number;
}

async function monitorTransaction(txHash: Hash): Promise<TransactionStatus> {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: 60000, // 1 minute timeout
  });

  return {
    hash: txHash,
    status: receipt.status === "success" ? "confirmed" : "failed",
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    timestamp: Date.now(),
  };
}
```

### **Event Listening**

```typescript
// Listen for IP Asset registration events
const unwatch = publicClient.watchContractEvent({
  address: IP_ASSET_REGISTRY_ADDRESS,
  abi: ipAssetRegistryAbi,
  eventName: "IPRegistered",
  onLogs: (logs) => {
    logs.forEach((log) => {
      console.log("New IP Asset registered:", {
        ipId: log.args.ipId,
        owner: log.args.owner,
        tokenContract: log.args.tokenContract,
        tokenId: log.args.tokenId,
      });
    });
  },
});
```

---

## 🧪 **Testing & Validation**

### **Integration Testing**

```typescript
describe("Story Protocol Integration", () => {
  it("should register chapter as IP asset", async () => {
    const chapter = {
      title: "Test Chapter",
      content: "This is a test chapter content...",
      genre: "sci-fi",
      author: "0x123...",
    };

    const result = await registerChapterAsIPAsset(
      chapter,
      mockNftContract,
      testAccount
    );

    expect(result.success).toBe(true);
    expect(result.ipAssetId).toBeDefined();
    expect(result.transactionHash).toBeDefined();
  });

  it("should create and attach license terms", async () => {
    const licenseResult = await createLicenseTerms(
      LICENSE_TIERS.standard,
      royaltyPolicyAddress
    );

    expect(licenseResult.success).toBe(true);

    const attachResult = await attachLicenseToChapter(
      mockIpAssetId,
      licenseResult.licenseTermsId
    );

    expect(attachResult.success).toBe(true);
  });
});
```

### **Connection Testing**

```typescript
async function testStoryProtocolConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Test basic connectivity
    const blockNumber = await publicClient.getBlockNumber();

    // Test Story Protocol SDK
    const isConnected = storyClient.isConnected();

    return {
      success: true,
      message: `Connected to Story Protocol! Block: ${blockNumber}, SDK: ${isConnected}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
    };
  }
}
```

---

## 🔧 **Configuration Management**

### **Environment Configuration**

```typescript
interface StoryProtocolConfig {
  rpcUrl: string;
  chainId: number;
  privateKey: string;
  contractAddresses: {
    ipAssetRegistry: Address;
    licensingModule: Address;
    royaltyModule: Address;
    pilTemplate: Address;
  };
  gasLimits: {
    registerIP: bigint;
    createLicense: bigint;
    mintLicenseToken: bigint;
    claimRoyalty: bigint;
  };
}

function getStoryProtocolConfig(): StoryProtocolConfig {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rpcUrl: isProduction
      ? "https://rpc.story.foundation"
      : "https://testnet.storyrpc.io",
    chainId: isProduction ? 1 : 1513,
    privateKey: process.env.STORY_PROTOCOL_PRIVATE_KEY!,
    contractAddresses: {
      ipAssetRegistry: "0x..." as Address,
      licensingModule: "0x..." as Address,
      royaltyModule: "0x..." as Address,
      pilTemplate: "0x..." as Address,
    },
    gasLimits: {
      registerIP: BigInt(300000),
      createLicense: BigInt(200000),
      mintLicenseToken: BigInt(150000),
      claimRoyalty: BigInt(100000),
    },
  };
}
```

### **Validation**

```typescript
function validateStoryProtocolConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.STORY_PROTOCOL_RPC_URL) {
    errors.push("STORY_PROTOCOL_RPC_URL is required");
  }

  if (!process.env.STORY_PROTOCOL_PRIVATE_KEY) {
    errors.push("STORY_PROTOCOL_PRIVATE_KEY is required");
  }

  if (!process.env.STORY_PROTOCOL_CHAIN_ID) {
    errors.push("STORY_PROTOCOL_CHAIN_ID is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## 📈 **Performance Optimization**

### **Caching Strategy**

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

  clearCache(): void {
    this.ipAssetCache.clear();
    this.licenseTermsCache.clear();
  }
}
```

### **Batch Operations**

```typescript
async function batchRegisterChapters(
  chapters: ChapterData[]
): Promise<RegisterIPAssetResponse[]> {
  const batchSize = 5; // Process 5 chapters at a time
  const results: RegisterIPAssetResponse[] = [];

  for (let i = 0; i < chapters.length; i += batchSize) {
    const batch = chapters.slice(i, i + batchSize);
    const batchPromises = batch.map((chapter) =>
      registerChapterAsIPAsset(chapter, nftContract, account)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < chapters.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

---

## 🔮 **Future Enhancements**

### **Multi-Chain Support**

```typescript
interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  storyProtocolAddress: Address;
  supportedFeatures: string[];
}

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

### **Advanced Features**

- **Cross-chain IP bridging**
- **Automated royalty distribution**
- **AI-powered content verification**
- **Institutional licensing tools**

---

**StoryHouse.vip × Story Protocol** - Revolutionizing chapter-level IP management on blockchain! 🚀
