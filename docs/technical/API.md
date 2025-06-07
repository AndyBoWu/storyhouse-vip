# 🔧 StoryHouse.vip API Documentation

## 🌟 **Overview**

StoryHouse.vip provides a comprehensive RESTful API for creating, managing, and licensing intellectual property assets on the blockchain. With **Phase 5.0 complete**, all endpoints now feature **enhanced metadata system**, **user attribution**, and **real Story Protocol blockchain integration**.

### **Base URL**

```
Production: https://storyhouse.vip/api
Development: http://localhost:3001/api
```

### **Authentication**

Currently using session-based authentication. API keys coming in Phase 5.

---

## 🔗 **Real Blockchain Integration Status**

**✅ Phase 5.0 COMPLETE**: All API endpoints now feature comprehensive enhancements:

- ✅ **Enhanced Metadata System** with 25+ tracked fields per chapter
- ✅ **User Attribution** with complete author tracking and wallet integration
- ✅ **Read-to-Earn Economics** with full token flow tracking
- ✅ **Remix Economy** with IP licensing metadata and royalty tracking
- ✅ **Real IP Asset Registration** via `mintAndRegisterIp()`
- ✅ **Smart Contract Licensing** via `registerPILTerms()`
- ✅ **Blockchain Transaction Processing** with gas optimization
- ✅ **Enhanced Storage** with Cloudflare R2 caching and metadata
- ✅ **AI Generation Tracking** with complete provenance and quality scores

---

## 📚 **Story Generation API**

### **Enhanced Story Generation**

Generate AI-powered stories with built-in IP asset metadata and blockchain registration options.

```http
POST /api/generate
```

**Request Body (Enhanced with Phase 5.0 Features):**

```json
{
  "plotDescription": "A young detective discovers ancient magic in modern London",
  "storyTitle": "The Arcane Detective",
  "genres": ["mystery", "fantasy", "urban"],
  "moods": ["mysterious", "dark"],
  "emojis": ["🔍", "✨", "🌙"],
  "chapterNumber": 1,
  "isNewStory": true,
  
  // Enhanced Author Attribution (NEW)
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "authorName": "0x1234...7890",
  
  // Read-to-Earn Economics (NEW)
  "economics": {
    "unlockPrice": 0.1,
    "readReward": 0.05,
    "licensePrice": 100,
    "royaltyPercentage": 5
  },
  
  // Content Classification (NEW)
  "contentRating": "PG-13",
  "language": "en",
  "isRemixable": true,
  
  // IP Options (Enhanced)
  "ipOptions": {
    "registerAsIP": true,
    "licenseType": "premium",
    "commercialRights": true,
    "derivativeRights": true,
    "autoRegister": false
  },
  
  // Collection Options
  "collectionOptions": {
    "addToCollection": "col-fantasy-mysteries",
    "createNewCollection": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "story": {
    "id": "story_1703123456",
    "title": "The Shadowbrook Mysteries",
    "content": "Detective Sarah Chen never believed in magic...",
    "author": "0x1234567890123456789012345678901234567890",
    "genre": "mystery",
    "mood": "mysterious",
    "emoji": "🔍",
    "createdAt": "2024-12-21T10:30:00Z",
    "metadata": {
      "wordCount": 1987,
      "readingTime": 8,
      "contentRating": "PG-13",
      "qualityScore": 87,
      "commercialViability": 92,
      "uniquenessScore": 94
    },
    "ipRegistrationStatus": "ready",
    "licenseStatus": "pending",
    "availableLicenseTypes": ["standard", "premium", "exclusive"]
  },
  "ipMetadata": {
    "readyForRegistration": true,
    "estimatedRegistrationCost": "0.05 ETH",
    "suggestedLicensePrice": 250
  }
}
```

---

## 🏛️ **IP Asset Management API**

### **Register Story as IP Asset**

Register stories as legally-enforceable IP assets on Story Protocol blockchain.

```http
POST /api/ip/register
```

**Request Body:**

```json
{
  "storyId": "story_1703123456",
  "storyTitle": "The Shadowbrook Mysteries",
  "storyContent": "Detective Sarah Chen never believed in magic...",
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "licenseType": "premium",
  "commercialRights": true,
  "derivativeRights": true,
  "customLicense": {
    "price": 500,
    "royaltyPercentage": 12,
    "terms": {
      "commercialUse": true,
      "derivativesAllowed": true,
      "attribution": true,
      "shareAlike": false,
      "exclusivity": false,
      "territories": ["US", "EU", "CA"],
      "contentRestrictions": ["no-adult-content"]
    }
  }
}
```

**Response (Real Blockchain):**

```json
{
  "success": true,
  "ipAsset": {
    "id": "0xa1b2c3d4e5f6789012345678901234567890abcd",
    "address": "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
    "tokenId": "12345",
    "metadata": {
      "mediaType": "text/story",
      "title": "The Shadowbrook Mysteries",
      "description": "Detective Sarah Chen never believed in magic...",
      "genre": "mystery",
      "wordCount": 1987,
      "language": "en",
      "tags": ["mystery", "fantasy", "urban"],
      "createdAt": "2024-12-21T10:30:00Z",
      "author": "0x1234567890123456789012345678901234567890"
    },
    "licenseTermsIds": ["0xdef456..."]
  },
  "licenseTerms": {
    "id": "0xdef456789012345678901234567890123456789abc",
    "transferable": true,
    "royaltyPolicy": "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
    "defaultMintingFee": "500000000000000000000",
    "commercialUse": true,
    "derivativesAllowed": true
  },
  "transactionHashes": {
    "ipRegistration": "0x1a2b3c4d5e6f789012345678901234567890abcdef123456789",
    "licenseCreation": "0x2b3c4d5e6f789012345678901234567890abcdef1234567890",
    "licenseAttachment": "0x3c4d5e6f789012345678901234567890abcdef12345678901"
  },
  "blockchainStatus": {
    "connected": true,
    "network": "odyssey",
    "blockNumber": 1234567,
    "gasUsed": "245821",
    "gasCost": "0.0012 ETH"
  }
}
```

### **Check IP Registration Status**

```http
GET /api/ip/register?storyId=story_1703123456
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "reg_1703123456_story_001",
    "storyId": "story_1703123456",
    "operationType": "register",
    "status": "success",
    "createdAt": "2024-12-21T10:30:00Z",
    "updatedAt": "2024-12-21T10:32:15Z",
    "ipAssetId": "0xa1b2c3d4e5f6789012345678901234567890abcd",
    "transactionHash": "0x1a2b3c4d5e6f789012345678901234567890abcdef123456789",
    "blockNumber": 1234567,
    "networkFees": "0.0012 ETH"
  }
}
```

---

## 📄 **Licensing API**

### **Create and Purchase Licenses**

Create license terms and purchase licensing rights for derivative works.

```http
POST /api/ip/license
```

**Request Body:**

```json
{
  "ipAssetId": "0xa1b2c3d4e5f6789012345678901234567890abcd",
  "licenseType": "premium",
  "buyerAddress": "0x9876543210987654321098765432109876543210",
  "customTerms": {
    "price": 750,
    "royaltyPercentage": 15,
    "usageScope": ["film", "game", "book"],
    "territory": "worldwide",
    "duration": "perpetual"
  }
}
```

**Response (Real Blockchain):**

```json
{
  "success": true,
  "licenseToken": {
    "id": "67890",
    "licenseTermsId": "0xdef456789012345678901234567890123456789abc",
    "licensorIpId": "0xa1b2c3d4e5f6789012345678901234567890abcd",
    "transferable": true,
    "mintingFee": "750000000000000000000",
    "owner": "0x9876543210987654321098765432109876543210"
  },
  "transactionHash": "0x4d5e6f789012345678901234567890abcdef1234567890123",
  "blockchainStatus": {
    "confirmed": true,
    "blockNumber": 1234568,
    "gasUsed": "156342",
    "gasCost": "0.0008 ETH"
  },
  "licenseDetails": {
    "licenseType": "premium",
    "commercialUse": true,
    "derivativesAllowed": true,
    "royaltyPercentage": 15,
    "territory": "worldwide",
    "validUntil": null
  }
}
```

### **Get License Information**

```http
GET /api/ip/license?ipAssetId=0xa1b2c3d4e5f6789012345678901234567890abcd
```

---

## 📚 **Collections API**

### **Create IP Collection**

Create collections for organizing related IP assets with shared revenue models.

```http
POST /api/collections
```

**Request Body:**

```json
{
  "name": "Urban Fantasy Mystery Series",
  "description": "Modern mysteries with magical elements set in contemporary cities",
  "creatorAddress": "0x1234567890123456789012345678901234567890",
  "isPublic": true,
  "revenueShare": {
    "creator": 70,
    "collection": 20,
    "platform": 10
  },
  "licenseDefaults": {
    "standardPrice": 150,
    "premiumPrice": 400,
    "exclusivePrice": 1200
  },
  "metadata": {
    "genre": "urban-fantasy",
    "tags": ["mystery", "magic", "contemporary"],
    "targetAudience": "adult",
    "contentRating": "PG-13"
  }
}
```

**Response:**

```json
{
  "success": true,
  "collection": {
    "id": "col_urban_fantasy_001",
    "name": "Urban Fantasy Mystery Series",
    "description": "Modern mysteries with magical elements...",
    "creator": "0x1234567890123456789012345678901234567890",
    "isPublic": true,
    "storyCount": 0,
    "totalRevenue": 0,
    "revenueShare": {
      "creator": 70,
      "collection": 20,
      "platform": 10
    },
    "createdAt": "2024-12-21T10:35:00Z"
  }
}
```

### **Search Collections**

```http
GET /api/collections?genre=fantasy&public=true&limit=10&offset=0
```

### **Add Story to Collection**

```http
PUT /api/collections/col_urban_fantasy_001/stories
```

**Request Body:**

```json
{
  "storyId": "story_1703123456",
  "royaltyShare": 5
}
```

---

## 🔍 **Real Blockchain Operations**

### **Test Connection**

Verify Story Protocol blockchain connectivity and configuration.

```http
GET /api/blockchain/test
```

**Response:**

```json
{
  "success": true,
  "network": {
    "name": "Story Protocol Odyssey",
    "chainId": 1513,
    "rpcUrl": "https://testnet.storyrpc.io",
    "blockNumber": 1234567,
    "connected": true
  },
  "sdk": {
    "version": "1.0.0",
    "initialized": true,
    "account": "0x1234567890123456789012345678901234567890"
  },
  "contracts": {
    "ipAssetRegistry": "0x...",
    "licensingModule": "0x...",
    "royaltyModule": "0x..."
  }
}
```

### **Gas Estimation**

```http
POST /api/blockchain/estimate-gas
```

**Request Body:**

```json
{
  "operation": "register-ip",
  "storyLength": 2000,
  "licenseType": "premium"
}
```

**Response:**

```json
{
  "success": true,
  "estimation": {
    "gasLimit": 245821,
    "gasPrice": "20000000000",
    "estimatedCost": "0.0049 ETH",
    "estimatedCostUSD": 12.25
  }
}
```

---

## 📊 **License Tiers & Pricing**

### **Standard Tier**

```json
{
  "name": "standard",
  "displayName": "Standard License",
  "priceRange": "$50-150",
  "royaltyPercentage": 5,
  "terms": {
    "commercialUse": true,
    "derivativesAllowed": true,
    "attribution": true,
    "shareAlike": false,
    "exclusivity": false
  }
}
```

### **Premium Tier**

```json
{
  "name": "premium",
  "displayName": "Premium License",
  "priceRange": "$200-500",
  "royaltyPercentage": 10,
  "terms": {
    "commercialUse": true,
    "derivativesAllowed": true,
    "attribution": true,
    "shareAlike": false,
    "exclusivity": false
  }
}
```

### **Exclusive Tier**

```json
{
  "name": "exclusive",
  "displayName": "Exclusive License",
  "priceRange": "$1000+",
  "royaltyPercentage": 20,
  "terms": {
    "commercialUse": true,
    "derivativesAllowed": true,
    "attribution": true,
    "shareAlike": false,
    "exclusivity": true
  }
}
```

---

## ⚠️ **Error Handling**

### **Blockchain Error Responses**

```json
{
  "success": false,
  "error": "Insufficient funds for gas fees",
  "blockchainStatus": {
    "connected": true,
    "error": "INSUFFICIENT_FUNDS"
  },
  "details": {
    "required": "0.005 ETH",
    "available": "0.002 ETH",
    "shortfall": "0.003 ETH"
  },
  "suggestedAction": "Add more tokens to your wallet and try again"
}
```

### **Common Error Codes**

| Error Code                    | Description                         | Retryable |
| ----------------------------- | ----------------------------------- | --------- |
| `RPC_ERROR`                   | Blockchain RPC failure              | ✅ Yes    |
| `INSUFFICIENT_FUNDS`          | Not enough tokens for gas           | ❌ No     |
| `GAS_LIMIT_EXCEEDED`          | Operation requires more gas         | ✅ Yes    |
| `TRANSACTION_REVERTED`        | Smart contract rejected transaction | ❌ No     |
| `NETWORK_UNAVAILABLE`         | Cannot connect to blockchain        | ✅ Yes    |
| `IP_ASSET_ALREADY_REGISTERED` | Content already registered          | ❌ No     |

---

## 🔧 **Rate Limiting**

| Endpoint                | Rate Limit   | Window   |
| ----------------------- | ------------ | -------- |
| `POST /api/generate`    | 10 requests  | 1 minute |
| `POST /api/ip/register` | 5 requests   | 1 minute |
| `POST /api/ip/license`  | 20 requests  | 1 minute |
| `POST /api/collections` | 10 requests  | 1 minute |
| `GET` endpoints         | 100 requests | 1 minute |

---

## 📋 **API Status**

| Feature          | Status  | Blockchain |
| ---------------- | ------- | ---------- |
| Story Generation | ✅ Live | N/A        |
| IP Registration  | ✅ Live | ✅ Real    |
| License Creation | ✅ Live | ✅ Real    |
| License Purchase | ✅ Live | ✅ Real    |
| Collections      | ✅ Live | ✅ Real    |
| Royalty Claims   | ✅ Live | ✅ Real    |
| Derivatives      | ✅ Live | ✅ Real    |

---

**API Version**: 4.4 - Real Blockchain Integration ✅

**Last Updated**: December 2024

**Next Update**: Phase 5 - Production Optimization 🚀
