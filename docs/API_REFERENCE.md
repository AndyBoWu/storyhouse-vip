# API Reference

## Overview

StoryHouse.vip provides a RESTful API for creating, managing, and licensing IP assets with PIL (Programmable IP License) support.

### Base URLs
```
Production: https://api.storyhouse.vip/api
Testnet: https://api-testnet.storyhouse.vip/api  
Development: http://localhost:3002/api
```

### Authentication
Session-based authentication with Web3 wallet integration.

---

## PIL Licensing API

### Get License Templates

Retrieve available PIL license templates.

```http
GET /api/licenses/templates
```

**Query Parameters:**
- `id` (optional): Get specific template by ID
- `category` (optional): Filter by category (open, commercial, exclusive)

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "standard",
      "name": "Standard License",
      "displayName": "Free License",
      "description": "Open access with attribution required",
      "price": 0,
      "currency": "TIP",
      "terms": {
        "commercialUse": false,
        "derivativesAllowed": true,
        "attribution": true,
        "commercialRevShare": 0
      },
      "royaltyPolicy": {
        "type": "LAP",
        "percentage": 0
      }
    }
  ]
}
```

### Attach License to IP Asset

Attach a PIL license to an existing IP asset.

```http
POST /api/ip/license/attach
```

**Request Body:**
```json
{
  "ipAssetId": "0x1234567890abcdef",
  "licenseTemplateId": "premium",
  "walletAddress": "0x9876543210fedcba",
  "chainId": 1315
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIL license attached successfully",
  "data": {
    "licenseTermsId": "lt_1234567890_abcdef123",
    "ipAssetId": "0x1234567890abcdef",
    "transactionHash": "0xabc123...",
    "effectiveDate": "2025-06-11T15:15:22.579Z"
  }
}
```

---

## Stories & Content API

### Get All Stories

Fetch published stories from R2 storage.

```http
GET /api/stories
```

**Response:**
```json
{
  "success": true,
  "stories": [
    {
      "id": "story_1703123456",
      "title": "The Detective's Portal",
      "genre": "Mystery",
      "chapters": 3,
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "contentUrl": "https://r2-endpoint/stories/story_1703123456.json"
    }
  ]
}
```

### Get Books

Retrieve book metadata with enhanced information.

```http
GET /api/books
```

**Response:**
```json
{
  "success": true,
  "books": [
    {
      "bookId": "0x1234-detective-portal",
      "title": "The Detective's Portal",
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "authorName": "Alice",
      "totalChapters": 5,
      "publishedChapters": 3,
      "ipAssetId": "0xabcdef1234567890",
      "licenseInfo": {
        "templateId": "premium",
        "commercialUse": true,
        "royaltyPercentage": 10
      }
    }
  ]
}
```

---

## Chapter Management API

### Get Chapter Info

Retrieve detailed chapter information.

```http
GET /api/books/[bookId]/chapter/[chapterNumber]/info
```

**Response:**
```json
{
  "success": true,
  "chapter": {
    "bookId": "0x1234-detective-portal",
    "chapterNumber": 1,
    "title": "The Discovery",
    "wordCount": 2500,
    "readingTime": 10,
    "unlockPrice": 0,
    "readReward": 5,
    "ipAssetId": "0xchapter123...",
    "licenseAttached": true
  }
}
```

### Unlock Chapter

Purchase access to a premium chapter.

```http
POST /api/books/[bookId]/chapter/[chapterNumber]/unlock
```

**Request Body:**
```json
{
  "userAddress": "0x9876543210fedcba",
  "paymentMethod": "TIP"
}
```

---

## Story Generation API

### Generate Story Content

Create AI-powered story content with PIL metadata.

```http
POST /api/generate
```

**Request Body:**
```json
{
  "prompt": "A detective discovers a hidden portal",
  "genre": "Mystery",
  "mood": "Suspenseful",
  "licensePreference": "premium"
}
```

**Response:**
```json
{
  "success": true,
  "story": {
    "title": "The Portal Detective",
    "content": "Detective Sarah Chen never believed in magic...",
    "metadata": {
      "wordCount": 1500,
      "readingTime": 6,
      "qualityScore": 85,
      "licenseTier": "premium"
    }
  }
}
```

---

## Utility APIs

### Test PIL Integration

Test Story Protocol SDK v1.3.2 compatibility.

```http
GET /api/test-pil
```

**Response:**
```json
{
  "success": true,
  "message": "PIL Integration Test Successful!",
  "data": {
    "serviceStatus": {
      "initialized": false,
      "chainId": 1315,
      "availableTiers": ["standard", "premium", "exclusive"]
    }
  }
}
```

### Debug Environment

Check environment configuration.

```http
GET /api/debug-env
```

**Response:**
```json
{
  "success": true,
  "environment": {
    "hasR2BucketName": true,
    "hasR2AccessKey": true,
    "hasStoryProtocolConfig": true,
    "nodeEnv": "development"
  }
}
```

---

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details",
  "troubleshooting": {
    "commonIssues": ["Issue 1", "Issue 2"],
    "solutions": ["Solution 1", "Solution 2"]
  }
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Rate Limiting

Current API limits:
- Development: No limits
- Production: 100 requests per minute per IP

## SDKs and Libraries

### Story Protocol Integration
```typescript
import { StoryConfig, StoryClient } from '@story-protocol/core-sdk'

const config: StoryConfig = {
  chainId: 1315,
  transport: http('https://aeneid.storyrpc.io')
}
```

### Frontend Integration
```typescript
import { apiClient } from '@/lib/api-client'

const templates = await apiClient.getLicenseTemplates()
const result = await apiClient.attachLicense(ipAssetId, templateId)
```