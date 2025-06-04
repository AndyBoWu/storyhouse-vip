# 📡 StoryHouse.vip API Documentation

Complete API reference for StoryHouse.vip's enhanced storytelling and IP management platform.

## 🏗 **Base Configuration**

```typescript
Base URL: https://storyhouse.vip/api
Development: http://localhost:3000/api

Headers:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>" // When authentication is required
}
```

## 📚 **Story Generation API**

### **Generate Enhanced Story**

Create AI-powered stories with optional IP registration and collection management.

```typescript
POST /api/generate

Request Body:
{
  "plotDescription": string;        // Required: 1-1000 characters
  "genres": string[];              // Optional: ["fantasy", "mystery"]
  "moods": string[];               // Optional: ["epic", "dark"]
  "emojis": string[];              // Optional: ["🌟", "⚔️"]
  "chapterNumber": number;         // Optional: default 1
  "previousContent": string;       // Optional: for multi-chapter stories

  // Enhanced IP Options
  "ipOptions": {
    "registerAsIP": boolean;
    "licenseType": "standard" | "premium" | "exclusive" | "custom";
    "commercialRights": boolean;
    "derivativeRights": boolean;
    "customLicense": {             // Required if licenseType === "custom"
      "price": number;
      "royaltyPercentage": number;
      "terms": {
        "commercialUse": boolean;
        "derivativesAllowed": boolean;
        "attribution": boolean;
        "shareAlike": boolean;
        "exclusivity": boolean;
        "territories": string[];
        "contentRestrictions": string[];
      }
    }
  };

  // Collection Options
  "collectionOptions": {
    "addToCollection": string;     // Existing collection ID
    "createNewCollection": {
      "name": string;
      "description": string;
      "isPublic": boolean;
      "revenueShare": {
        "creator": number;         // Percentage (0-100)
        "collection": number;      // Percentage (0-100)
        "platform": number;        // Percentage (0-100)
      }
    }
  }
}

Response: EnhancedApiResponse<EnhancedGeneratedStory>
{
  "success": true,
  "data": {
    "title": string;
    "content": string;
    "wordCount": number;
    "readingTime": number;
    "themes": string[];

    // Enhanced metadata
    "suggestedTags": string[];
    "suggestedGenre": string;
    "contentRating": "G" | "PG" | "PG-13" | "R";
    "language": string;
    "qualityScore": number;        // 0-100
    "originalityScore": number;    // 0-100
    "commercialViability": number; // 0-100
  },
  "message": string;
  "ipData": {                     // Present if IP registration requested
    "operationId": string;
    "transactionHash": string;
    "ipAssetId": string;
    "gasUsed": bigint;
  }
}
```

**Error Responses:**

- `400`: Invalid input (plot too long, invalid license type)
- `503`: AI service unavailable
- `429`: Rate limit exceeded
- `500`: Internal server error

## 🛡 **IP Asset Management API**

### **Register IP Asset**

Register a story as an IP asset on Story Protocol blockchain.

```typescript
POST /api/ip/register

Request Body:
{
  "storyId": string;              // Required
  "storyTitle": string;           // Required
  "storyContent": string;         // Required
  "authorAddress": string;        // Required: Valid Ethereum address
  "licenseType": "standard" | "premium" | "exclusive" | "custom";
  "commercialRights": boolean;
  "derivativeRights": boolean;
  "customLicense": {             // Required if licenseType === "custom"
    "price": number;
    "royaltyPercentage": number;  // 0-100
    "terms": {
      "commercialUse": boolean;
      "derivativesAllowed": boolean;
      "attribution": boolean;
      "shareAlike": boolean;
      "exclusivity": boolean;
      "territories": string[];
      "contentRestrictions": string[];
    }
  }
}

Response: EnhancedApiResponse<RegisterIPAssetResponse>
{
  "success": true,
  "data": {
    "ipAssetId": string;          // Story Protocol IP Asset ID
    "transactionHash": string;    // Blockchain transaction hash
    "licenseTermsId": string;     // License terms identifier
    "registrationCost": bigint;   // Cost in wei
    "estimatedGas": bigint;
    "gasUsed": bigint;
    "blockNumber": bigint;
    "licenseTier": {
      "name": string;
      "displayName": string;
      "price": bigint;
      "royaltyPercentage": number;
      "terms": LicenseTerms;
    }
  },
  "message": "IP asset registration initiated successfully",
  "ipData": {
    "operationId": string;
    "transactionHash": string;
    "ipAssetId": string;
    "gasUsed": bigint;
  }
}
```

### **Check IP Registration Status**

Query the status of an IP registration operation.

```typescript
GET /api/ip/register?operationId={operationId}
GET /api/ip/register?storyId={storyId}

Response:
{
  "success": true,
  "data": {
    "id": string;
    "storyId": string;
    "operationType": "register";
    "status": "pending" | "success" | "failed";
    "createdAt": string;
    "updatedAt": string;
    "ipAssetId": string;          // Present if successful
    "licenseTokenId": string;     // Present if applicable
    "parentIpAssetId": string;    // Present if derivative
    "royaltyAmount": bigint;      // Present if royalties earned
    "collectionId": string;       // Present if part of collection
  }
}
```

**Error Responses:**

- `400`: Missing required parameters, invalid Ethereum address
- `402`: Insufficient funds for registration
- `404`: Operation not found
- `503`: Network error
- `500`: Registration failed

## 📁 **Collections Management API**

### **Create Collection**

Create a new story collection with revenue sharing configuration.

```typescript
POST /api/collections

Request Body:
{
  "name": string;                 // Required: Collection name
  "description": string;          // Required: Collection description
  "creatorAddress": string;       // Required: Valid Ethereum address
  "isPublic": boolean;            // Required: Public visibility
  "allowContributions": boolean;  // Required: Allow others to add stories
  "requireApproval": boolean;     // Required: Require approval for additions
  "revenueShare": {              // Required: Must total 100%
    "creator": number;            // Percentage for individual creators
    "collection": number;         // Percentage for collection pool
    "platform": number;           // Percentage for platform
  },
  "genre": string;               // Optional: Collection genre
  "theme": string;               // Optional: Collection theme
  "tags": string[];              // Optional: Collection tags
}

Response: EnhancedApiResponse<StoryCollection>
{
  "success": true,
  "data": {
    "id": string;
    "name": string;
    "description": string;
    "creatorAddress": string;
    "isPublic": boolean;
    "allowContributions": boolean;
    "requireApproval": boolean;
    "revenueShare": RevenueShare;
    "creators": string[];          // Array of creator addresses
    "stories": string[];           // Array of story IDs
    "ipAssets": string[];          // Array of IP asset IDs
    "genre": string;
    "theme": string;
    "tags": string[];
    "totalEarnings": number;
    "memberCount": number;
    "storyCount": number;
    "totalReads": number;
    "createdAt": Date;
    "updatedAt": Date;
  },
  "message": "Collection created successfully"
}
```

### **Search Collections**

Search and filter collections with pagination.

```typescript
GET /api/collections?creator={address}&public={boolean}&search={term}&genre={genre}&limit={number}&offset={number}

Query Parameters:
- creator: Filter by creator address
- public: Filter by public/private status
- search: Text search in name/description
- genre: Filter by genre
- limit: Number of results (default: 20, max: 100)
- offset: Pagination offset (default: 0)

Response:
{
  "success": true,
  "data": StoryCollection[];
  "pagination": {
    "limit": number;
    "offset": number;
    "total": number;
    "hasMore": boolean;
  }
}
```

### **Add Story to Collection**

Add a story to an existing collection.

```typescript
PUT /api/collections

Request Body:
{
  "collectionId": string;         // Required: Target collection ID
  "storyId": string;              // Required: Story to add
  "authorAddress": string;        // Required: Story author address
}

Response: EnhancedApiResponse<StoryCollection>
{
  "success": true,
  "data": StoryCollection;        // Updated collection data
  "message": "Story added to collection successfully"
}
```

**Error Responses:**

- `400`: Missing required fields, invalid addresses, revenue share ≠ 100%
- `403`: No permission to add to collection
- `404`: Collection not found
- `409`: Story already in collection
- `500`: Operation failed

## 📜 **Licensing Management API**

### **Create License Terms**

Create licensing terms for an IP asset.

```typescript
POST /api/ip/license

Request Body:
{
  "ipAssetId": string;            // Required: IP asset identifier
  "licenseType": "standard" | "premium" | "exclusive" | "custom";
  "price": number;                // Required: License price in TIP tokens
  "royaltyPercentage": number;    // Required: 0-100
  "terms": {                     // Required: License terms
    "commercialUse": boolean;
    "derivativesAllowed": boolean;
    "attribution": boolean;
    "shareAlike": boolean;
    "exclusivity": boolean;
    "territories": string[];      // Optional: Geographic restrictions
    "contentRestrictions": string[]; // Optional: Content usage restrictions
  },
  "authorAddress": string;        // Required: IP asset owner
}

Response: EnhancedApiResponse<LicenseResponse>
{
  "success": true,
  "data": {
    "licenseTokenId": string;
    "ipAssetId": string;
    "licenseTermsId": string;
    "price": bigint;              // Price in wei
    "royaltyPercentage": number;
    "terms": LicenseTerms;
    "status": "active" | "expired" | "revoked";
    "transactionHash": string;
    "blockNumber": bigint;
    "createdAt": string;
    "expiresAt": string;          // Optional
  },
  "message": "License terms created successfully",
  "ipData": {
    "operationId": string;
    "transactionHash": string;
    "ipAssetId": string;
    "gasUsed": bigint;
  }
}
```

### **Purchase License**

Purchase a license for an IP asset.

```typescript
PUT /api/ip/license

Request Body:
{
  "ipAssetId": string;            // Required
  "licenseTermsId": string;       // Required
  "buyerAddress": string;         // Required: Valid Ethereum address
  "licenseType": string;          // Required: License type being purchased
}

Response: EnhancedApiResponse<LicenseResponse>
{
  "success": true,
  "data": {
    "licenseTokenId": string;     // Unique license token ID
    "ipAssetId": string;
    "licenseTermsId": string;
    "price": bigint;
    "royaltyPercentage": number;
    "terms": LicenseTerms;
    "status": "active";
    "purchaser": string;          // Buyer address
    "transactionHash": string;
    "blockNumber": bigint;
    "createdAt": string;
  },
  "message": "License purchased successfully",
  "ipData": {
    "operationId": string;
    "transactionHash": string;
    "ipAssetId": string;
    "gasUsed": bigint;
  }
}
```

### **Get License Information**

Retrieve license information and ownership details.

```typescript
GET /api/ip/license?ipAssetId={id}
GET /api/ip/license?licenseTokenId={id}
GET /api/ip/license?owner={address}

Response:
{
  "success": true,
  "data": LicenseResponse[];
}
```

**Error Responses:**

- `400`: Missing required fields, invalid pricing
- `402`: Insufficient funds for license purchase
- `404`: License terms not found
- `500`: License operation failed

## 🚀 **Coming Soon: Chapter-Level IP API**

### **Register Chapter as IP Asset**

```typescript
POST /api/chapters/{chapterId}/register-ip

Request Body:
{
  "licenseType": "standard" | "premium" | "exclusive";
  "pricing": {
    "standardLicense": number;
    "premiumLicense": number;
    "exclusiveLicense": number;
  },
  "licenseConfig": {
    "allowIndividualLicensing": boolean;
    "requiresParentContext": boolean;
    "crossChapterDerivatives": boolean;
  },
  "authorAddress": string;
}
```

### **License Individual Chapter**

```typescript
POST /api/chapters/{chapterId}/license

Request Body:
{
  "licenseType": "standard" | "premium" | "exclusive";
  "buyerAddress": string;
  "intendedUse": "translation" | "adaptation" | "derivative" | "commercial";
  "bundleWith": string[];         // Optional: Bundle with other chapters
}
```

### **Chapter Bundle Licensing**

```typescript
POST /api/chapters/bundle-license

Request Body:
{
  "chapterIds": string[];
  "licenseType": "premium";
  "buyerAddress": string;
  "applyBundleDiscount": boolean;
}
```

## 🔧 **Common Types**

### **EnhancedApiResponse<T>**

```typescript
interface EnhancedApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  ipData?: {
    operationId: string;
    transactionHash?: string;
    ipAssetId?: string;
    gasUsed?: bigint;
  };
}
```

### **LicenseTerms**

```typescript
interface LicenseTerms {
  commercialUse: boolean;
  derivativesAllowed: boolean;
  attribution: boolean;
  shareAlike: boolean;
  exclusivity: boolean;
  territories?: string[];
  contentRestrictions?: string[];
}
```

### **RevenueShare**

```typescript
interface RevenueShare {
  creator: number; // 0-100
  collection: number; // 0-100
  platform: number; // 0-100
  // Note: creator + collection + platform must equal 100
}
```

## 🚨 **Error Handling**

All API endpoints follow consistent error response format:

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
  code?: string; // Optional error code
  details?: any; // Optional additional error details
}
```

### **Common HTTP Status Codes**

- `200`: Success
- `201`: Created successfully
- `202`: Accepted (async operation initiated)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `402`: Payment Required (insufficient funds)
- `429`: Too Many Requests (rate limited)
- `503`: Service Unavailable (external service down)
- `500`: Internal Server Error

## 🔐 **Authentication**

Currently, authentication is handled via Ethereum wallet signatures. Future versions will include:

- JWT token-based authentication
- OAuth integration
- Role-based access control
- API key management

## 🚦 **Rate Limiting**

Current rate limits (subject to change):

- **Story Generation**: 10 requests per minute per IP
- **IP Registration**: 5 requests per minute per wallet
- **Collection Operations**: 20 requests per minute per wallet
- **License Operations**: 15 requests per minute per wallet

## 📊 **Response Examples**

### **Successful Story Generation**

```json
{
  "success": true,
  "data": {
    "title": "The Mystic Portal",
    "content": "In the heart of the ancient forest...",
    "wordCount": 1247,
    "readingTime": 5,
    "themes": ["adventure", "magic", "discovery"],
    "suggestedTags": ["fantasy", "portal", "adventure"],
    "suggestedGenre": "Fantasy",
    "contentRating": "PG",
    "language": "en",
    "qualityScore": 85,
    "originalityScore": 78,
    "commercialViability": 82
  },
  "message": "Story generated with IP registration metadata",
  "ipData": {
    "operationId": "gen-1703123456789-abc123",
    "transactionHash": "0x...",
    "ipAssetId": "0x...",
    "gasUsed": "142350"
  }
}
```

### **Error Response**

```json
{
  "error": "Plot description must be under 1000 characters",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "plotDescription",
    "currentLength": 1247,
    "maxLength": 1000
  }
}
```

---

This API documentation covers all current endpoints and provides a foundation for the upcoming chapter-level IP features! 🚀
