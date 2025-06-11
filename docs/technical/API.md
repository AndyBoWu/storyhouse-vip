# StoryHouse API Documentation

This document describes the API endpoints for the StoryHouse.vip platform, covering story management, license operations, AI generation, and Story Protocol integration.

## Base URLs

- **Testnet:** `https://api-testnet.storyhouse.vip`
- **Production:** `https://api.storyhouse.vip`

## Architecture

The API runs on Vercel as a Next.js backend with the following structure:

```
apps/backend/app/api/
├── stories/                 # Story management
├── chapters/               # Chapter operations
├── generate/               # AI story generation
├── upload/                 # File upload to R2
├── security/               # Security headers
└── test/                   # Health checks
```

## Core Endpoints

### Story Management

#### GET /api/stories
Retrieve all published stories with metadata.

**Response:**
```json
{
  "stories": [
    {
      "id": "story-uuid",
      "title": "Story Title",
      "description": "Story description",
      "author": "0x...",
      "authorName": "Author Name",
      "totalChapters": 5,
      "publishedChapters": 3,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUpdated": "2024-01-02T00:00:00Z",
      "genre": ["fantasy", "adventure"],
      "contentRating": "PG-13",
      "totalWordCount": 15000,
      "estimatedReadingTime": 60,
      "featuredChapter": {
        "number": 1,
        "title": "Chapter 1: The Beginning",
        "excerpt": "First 150 characters...",
        "license": {
          "tier": "free",
          "price": 0,
          "commercialUse": false,
          "derivativesAllowed": false
        }
      }
    }
  ]
}
```

#### GET /api/chapters/{storyId}/{chapterNumber}
Retrieve specific chapter content and metadata.

**Parameters:**
- `storyId`: Story identifier
- `chapterNumber`: Chapter number (1-based)

**Response:**
```json
{
  "chapter": {
    "id": "chapter-uuid",
    "storyId": "story-uuid",
    "number": 1,
    "title": "Chapter Title",
    "content": "Full chapter content...",
    "wordCount": 3000,
    "readingTime": 12,
    "themes": ["friendship", "adventure"],
    "contentRating": "PG",
    "publishedAt": "2024-01-01T00:00:00Z",
    "author": "0x...",
    "authorName": "Author Name",
    "license": {
      "tier": "premium",
      "price": 0.1,
      "commercialUse": true,
      "derivativesAllowed": true,
      "royaltyPercentage": 25,
      "transferable": true,
      "expiration": null
    },
    "storyProtocol": {
      "ipAssetId": "0x...",
      "tokenId": "123",
      "transactionHash": "0x...",
      "licenseTermsId": "456",
      "explorerUrl": "https://aeneid.storyscan.xyz/tx/0x..."
    },
    "economics": {
      "unlockPrice": 0.1,
      "readerReward": 0.05,
      "creatorRevenue": 0.05,
      "totalReads": 150,
      "totalRevenue": 7.5
    }
  }
}
```

### AI Story Generation

#### POST /api/generate
Generate story content using OpenAI GPT-4.

**Request Body:**
```json
{
  "prompt": "A fantasy adventure about...",
  "genre": "fantasy",
  "chapterNumber": 1,
  "previousChapters": [], // For continuity
  "style": "descriptive",
  "targetWordCount": 3000,
  "contentRating": "PG-13"
}
```

**Response:**
```json
{
  "success": true,
  "story": {
    "title": "Generated Story Title",
    "content": "Generated story content...",
    "wordCount": 2950,
    "readingTime": 12,
    "themes": ["adventure", "magic", "friendship"],
    "contentUrl": "https://r2-url/story-content.txt",
    "metadata": {
      "model": "gpt-4",
      "prompt": "Original prompt",
      "generatedAt": "2024-01-01T00:00:00Z",
      "qualityScore": 0.85,
      "originalityScore": 0.92
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Generation failed: Invalid prompt",
  "details": "Prompt must be at least 10 characters"
}
```

### License Management

#### GET /api/stories/{storyId}/chapters/{chapterNumber}/license
Get license information for a specific chapter.

**Response:**
```json
{
  "license": {
    "tier": "premium",
    "price": 0.1,
    "currency": "TIP",
    "commercialUse": true,
    "derivativesAllowed": true,
    "royaltyPercentage": 25,
    "transferable": true,
    "attribution": "required",
    "expiration": null,
    "restrictions": [
      "Attribution must be prominent",
      "25% royalty on derivative works",
      "Cannot claim original authorship"
    ],
    "useCases": [
      "Commercial publications",
      "Educational course materials",
      "Derivative works (remixes, adaptations)"
    ]
  },
  "storyProtocol": {
    "licenseTermsId": "456",
    "registrationTx": "0x...",
    "isActive": true
  }
}
```

#### PUT /api/stories/{storyId}/chapters/{chapterNumber}/license
Update license terms for a chapter (creator only).

**Request Body:**
```json
{
  "tier": "exclusive",
  "price": 0.5,
  "commercialUse": true,
  "derivativesAllowed": true,
  "royaltyPercentage": 15
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    // Updated license object
  },
  "storyProtocol": {
    "newLicenseTermsId": "789",
    "updateTx": "0x...",
    "explorerUrl": "https://aeneid.storyscan.xyz/tx/0x..."
  }
}
```

### File Upload & Storage

#### POST /api/upload
Upload content to Cloudflare R2 storage.

**Request Body (multipart/form-data):**
- `file`: File to upload
- `type`: Content type (story, image, metadata)
- `storyId`: Associated story ID (optional)
- `chapterNumber`: Associated chapter number (optional)

**Response:**
```json
{
  "success": true,
  "url": "https://r2-domain/path/file.txt",
  "key": "stories/story-uuid/chapter-1.txt",
  "size": 1024,
  "contentType": "text/plain"
}
```

### Security & Health

#### GET /api/security
Returns security headers and CSP information.

**Response:**
```json
{
  "contentSecurityPolicy": "default-src 'self'...",
  "xssProtection": "1; mode=block",
  "frameOptions": "DENY",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### GET /api/test
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "environment": "production",
  "services": {
    "r2": "connected",
    "openai": "connected",
    "storyProtocol": "connected"
  },
  "version": "1.0.0"
}
```

## Story Protocol Integration

### Blockchain Operations

The API integrates with Story Protocol for IP asset management:

#### Chapter Registration Flow
1. **NFT Minting**: Create NFT for chapter content
2. **IP Registration**: Register NFT as IP Asset on Story Protocol
3. **License Creation**: Define license terms on-chain
4. **License Attachment**: Attach license to IP Asset

#### Smart Contract Addresses (Testnet)
```javascript
{
  "TIP_TOKEN": "0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E",
  "REWARDS_MANAGER": "0xf5ae031ba92295c2ae86a99e88f09989339707e5",
  "SPG_NFT": "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d",
  "IP_ASSET_REGISTRY": "0x77319B4031e6eF1250907aa00018B8B1c67a244b",
  "LICENSE_REGISTRY": "0xbe39E1C756e921BD25DF86e7AAa31106d1eb0424"
}
```

### Transaction Responses

Story Protocol operations return transaction details:

```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "ipAssetId": "0x...",
    "tokenId": "123",
    "licenseTermsId": "456",
    "contentUrl": "ipfs://...",
    "explorerUrl": "https://aeneid.storyscan.xyz/tx/0x...",
    "gasUsed": "245000",
    "gasPrice": "20000000000"
  }
}
```

## Economics & Analytics

### Revenue Tracking

#### GET /api/analytics/revenue
Get revenue analytics for stories and chapters.

**Parameters:**
- `storyId`: Optional story filter
- `chapterNumber`: Optional chapter filter
- `timeframe`: day|week|month|all
- `walletAddress`: Creator wallet address

**Response:**
```json
{
  "revenue": {
    "total": 25.5,
    "currency": "TIP",
    "timeframe": "month",
    "breakdown": {
      "chapterSales": 15.0,
      "licensingFees": 8.5,
      "royalties": 2.0
    },
    "topChapters": [
      {
        "chapterNumber": 4,
        "title": "Chapter 4: The Revelation",
        "revenue": 5.2,
        "reads": 104,
        "license": "premium"
      }
    ]
  },
  "projections": {
    "nextMonth": 28.3,
    "confidence": 0.75
  }
}
```

### License Performance

#### GET /api/analytics/license-performance
Analyze license tier performance across the platform.

**Response:**
```json
{
  "performance": {
    "free": {
      "adoption": 0.45,
      "totalChapters": 1250,
      "averageReads": 85.2
    },
    "premium": {
      "adoption": 0.40,
      "totalChapters": 1100,
      "averageRevenue": 2.3,
      "averageReads": 45.8
    },
    "exclusive": {
      "adoption": 0.15,
      "totalChapters": 420,
      "averageRevenue": 8.7,
      "averageReads": 12.1
    }
  },
  "recommendations": {
    "optimalTier": "premium",
    "reasoning": "Best balance of adoption and revenue"
  }
}
```

## Error Handling

### Standard Error Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req-uuid"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `STORY_NOT_FOUND` | 404 | Story or chapter not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied (not author) |
| `INVALID_LICENSE` | 400 | Invalid license configuration |
| `BLOCKCHAIN_ERROR` | 500 | Story Protocol transaction failed |
| `AI_GENERATION_FAILED` | 500 | OpenAI generation error |
| `UPLOAD_FAILED` | 500 | R2 storage upload error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Blockchain-Specific Errors

```json
{
  "success": false,
  "error": "Transaction failed",
  "code": "BLOCKCHAIN_ERROR",
  "details": {
    "reason": "Insufficient gas",
    "transactionHash": "0x...",
    "gasEstimate": 250000,
    "gasProvided": 200000
  },
  "recovery": {
    "suggestion": "Increase gas limit",
    "retryable": true
  }
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/generate` | 10 requests | 1 hour |
| `/api/upload` | 100 requests | 1 hour |
| `/api/stories` | 1000 requests | 1 hour |
| Other endpoints | 500 requests | 1 hour |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 3600
```

## Authentication

### Wallet-Based Authentication

The API uses wallet-based authentication for creator operations:

```javascript
// Request headers
{
  "Authorization": "Bearer <wallet-signature>",
  "X-Wallet-Address": "0x...",
  "X-Timestamp": "1640995200",
  "X-Signature": "0x..."
}
```

### Public Endpoints

These endpoints are publicly accessible:
- `GET /api/stories`
- `GET /api/chapters/{storyId}/{chapterNumber}` (free chapters)
- `GET /api/test`
- `GET /api/security`

### Protected Endpoints

These endpoints require authentication:
- `POST /api/generate`
- `POST /api/upload`
- `PUT /api/stories/{storyId}/chapters/{chapterNumber}/license`
- `GET /api/analytics/*`

## SDK Integration

### Frontend API Client

The frontend uses a centralized API client:

```typescript
// apps/frontend/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const apiClient = {
  stories: {
    getAll: () => fetch(`${API_BASE_URL}/api/stories`),
    getChapter: (storyId: string, chapterNumber: number) => 
      fetch(`${API_BASE_URL}/api/chapters/${storyId}/${chapterNumber}`)
  },
  generate: {
    story: (prompt: string) => 
      fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({ prompt })
      })
  }
}
```

### Environment Configuration

```bash
# Frontend (.env.production)
NEXT_PUBLIC_API_BASE_URL=https://api-testnet.storyhouse.vip

# Backend (.env.production)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
```

## Development and Testing

### Local Development

```bash
# Start backend API server
cd apps/backend
npm run dev  # Runs on port 3002

# Test endpoints
curl http://localhost:3002/api/test
curl http://localhost:3002/api/stories
```

### API Testing

Use the built-in health check for monitoring:

```bash
# Health check
curl https://api-testnet.storyhouse.vip/api/test

# Story retrieval
curl https://api-testnet.storyhouse.vip/api/stories

# License information
curl https://api-testnet.storyhouse.vip/api/chapters/story-id/1
```

This API provides the complete backend functionality for the StoryHouse platform, supporting all features from AI story generation to blockchain IP management and comprehensive license handling.