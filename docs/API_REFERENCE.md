# API Reference

## Overview

StoryHouse.vip provides a RESTful API for creating, managing, and licensing IP assets with PIL (Programmable IP License) support and comprehensive royalty distribution.

### Base URLs
```
Production: https://api.storyhouse.vip/api
Testnet: https://api-testnet.storyhouse.vip/api  
Development: http://localhost:3002/api
```

### Authentication
Session-based authentication with Web3 wallet integration.

---

## 🆕 **Royalty Distribution API**

### Claim Chapter Royalties

Claim accumulated royalties for a specific chapter.

```http
POST /api/royalties/claim
```

**Request Body:**
```json
{
  "chapterId": "0x1234567890abcdef",
  "authorAddress": "0x9876543210fedcba"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Royalty claimed successfully",
  "data": {
    "claimId": "claim_1234567890",
    "chapterId": "0x1234567890abcdef",
    "amountClaimed": 125.50,
    "tipTokens": 2500,
    "transactionHash": "0xabc123...",
    "claimedAt": "2025-06-11T15:15:22.579Z",
    "gasUsed": 21000,
    "status": "completed"
  }
}
```

### Get Claimable Royalties

Check claimable amount for a specific chapter.

```http
GET /api/royalties/claimable/[chapterId]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chapterId": "0x1234567890abcdef",
    "claimableAmount": 125.50,
    "totalRevenue": 500.00,
    "lastClaimedAt": "2025-06-01T10:30:00Z",
    "royaltyPercentage": 25,
    "licenseTier": "Premium",
    "readCount": 150,
    "tipEarnings": 75.30,
    "breakdown": {
      "licenseRevenue": 400.00,
      "tipRewards": 100.00,
      "totalEarned": 500.00,
      "previouslyClaimed": 374.50,
      "availableToClaim": 125.50
    }
  }
}
```

### Get Royalty History

Retrieve complete claim history for an author.

```http
GET /api/royalties/history/[authorAddress]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorAddress": "0x9876543210fedcba",
    "totalClaimed": 2500.00,
    "totalPending": 125.50,
    "claimCount": 15,
    "history": [
      {
        "claimId": "claim_1234567890",
        "chapterId": "0x1234567890abcdef",
        "bookTitle": "The Digital Realm",
        "chapterNumber": 1,
        "amountClaimed": 125.50,
        "claimedAt": "2025-06-11T15:15:22.579Z",
        "transactionHash": "0xabc123...",
        "status": "completed"
      }
    ],
    "analytics": {
      "averageClaimAmount": 166.67,
      "topPerformingChapter": "0x1234567890abcdef",
      "monthlyTrend": [
        {"month": "2025-06", "amount": 500.00},
        {"month": "2025-05", "amount": 400.00}
      ]
    }
  }
}
```

### Get Royalty Analytics

Advanced analytics and optimization recommendations.

```http
GET /api/royalties/preview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClaimable": 250.75,
    "totalRevenue": 1500.00,
    "projectedEarnings": {
      "nextWeek": 125.30,
      "nextMonth": 450.20,
      "confidence": 85
    },
    "recommendations": [
      "Consider upgrading Chapter 2 to Premium license tier",
      "Your Premium chapters generate 3.2x more revenue",
      "High engagement on Chapter 1 - perfect for Exclusive tier"
    ],
    "tier_analysis": {
      "Free": {
        "current_royalty": 0,
        "potential_revenue": 200.00,
        "optimization_score": 25
      },
      "Premium": {
        "current_royalty": 150.75,
        "potential_revenue": 600.00,
        "optimization_score": 85
      },
      "Exclusive": {
        "current_royalty": 100.00,
        "potential_revenue": 400.00,
        "optimization_score": 90
      }
    },
    "performance_metrics": {
      "roi_analysis": {
        "investment_cost": 500.00,
        "total_returns": 1500.00,
        "roi_percentage": 200.00,
        "break_even_date": "2025-03-15"
      },
      "engagement_stats": {
        "average_read_time": 8.5,
        "completion_rate": 78,
        "reader_retention": 65
      }
    }
  }
}
```

### Get Royalty Notifications

Retrieve and manage royalty notifications.

```http
GET /api/royalties/notifications/[authorAddress]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_1234567890",
        "type": "royalty_ready",
        "chapterId": "0x1234567890abcdef",
        "amount": 125.50,
        "createdAt": "2025-06-11T15:15:22.579Z",
        "read": false,
        "priority": "high"
      }
    ],
    "preferences": {
      "email_enabled": true,
      "push_enabled": true,
      "webhook_url": "https://example.com/webhook",
      "minimum_threshold": 50.00
    },
    "delivery_stats": {
      "success_rate": 95.5,
      "last_delivery": "2025-06-11T14:30:00Z",
      "total_sent": 42
    }
  }
}
```

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

// PIL Licensing
const templates = await apiClient.getLicenseTemplates()
const result = await apiClient.attachLicense(ipAssetId, templateId)

// Royalty Management
const claimResult = await apiClient.claimRoyalty({
  chapterId: '0x1234567890abcdef',
  authorAddress: '0x9876543210fedcba'
})

const claimableAmount = await apiClient.getClaimableRoyalties('0x1234567890abcdef')
const history = await apiClient.getRoyaltyHistory('0x9876543210fedcba')
const analytics = await apiClient.getRoyaltyPreview()
const notifications = await apiClient.getRoyaltyNotifications('0x9876543210fedcba')
```

---

## 🆕 **Rate Limiting & Performance**

### Royalty API Limits
- **Development**: No limits
- **Production**: 
  - Claim operations: 10 per minute per wallet
  - Read operations: 100 per minute per IP
  - Analytics: 20 per minute per wallet

### Performance Optimization
- **Response Times**: <2s for all operations
- **Caching**: Intelligent caching for analytics and history data
- **Batch Operations**: Concurrent processing for multiple claims
- **Error Recovery**: Automatic retry logic for blockchain operations

---

## 🔐 **Security Features**

### Royalty System Security
- **Multi-signature validation** for high-value claims
- **Rate limiting** to prevent abuse
- **Input validation** with comprehensive sanitization
- **Blockchain verification** for all TIP token transfers
- **Audit trails** for all claiming operations

### Error Categories
1. **Validation Errors**: Invalid parameters or missing data
2. **Blockchain Errors**: Network issues or insufficient gas
3. **Economic Errors**: Insufficient balance or invalid amounts
4. **Authorization Errors**: Wallet verification failures
5. **System Errors**: Infrastructure or configuration issues
6. **Rate Limit Errors**: Too many requests