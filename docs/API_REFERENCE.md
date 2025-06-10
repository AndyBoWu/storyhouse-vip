# 🔧 API Reference

Comprehensive API documentation for StoryHouse.vip's Web3 storytelling platform.

## 🌟 Overview

StoryHouse.vip provides a RESTful API for creating, managing, and licensing IP assets on the blockchain. Features enhanced metadata system, user attribution, and real Story Protocol integration.

### Base URLs

```
Production: https://api.storyhouse.vip/api
Testnet: https://api-testnet.storyhouse.vip/api  
Development: http://localhost:3002/api
```

### Authentication

Currently using session-based authentication. API keys coming in future versions.

---

## 📚 Stories & Books API

### Get All Stories

Fetch all published stories from R2 storage with enhanced metadata.

```http
GET /api/stories
```

**Query Parameters:**
- `cache` (optional): Set to "false" to bypass cache and force refresh

**Response:**
```json
{
  "success": true,
  "stories": [
    {
      "id": "story_1703123456",
      "title": "The Shadowbrook Mysteries",
      "genre": "Mystery",
      "chapters": 3,
      "lastUpdated": "2 hours ago",
      "earnings": 0,
      "preview": "Detective Sarah Chen never believed in magic...",
      "contentUrl": "https://r2-endpoint/stories/story_1703123456/chapters/1.json",
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "authorName": "0x1234...7890",
      "contentRating": "PG-13",
      "unlockPrice": 0.1,
      "readReward": 0.05,
      "licensePrice": 100,
      "isRemixable": true,
      "totalReads": 0,
      "wordCount": 1987,
      "readingTime": 8,
      "mood": "mysterious",
      "tags": ["mystery", "fantasy", "urban"],
      "qualityScore": 87,
      "originalityScore": 94,
      "isRemix": false,
      "generationMethod": "ai"
    }
  ],
  "count": 1
}
```

### Get Books

Fetch all books (hierarchical IP structure).

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
      "description": "A mystery that spans dimensions",
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "authorName": "Andy",
      "slug": "detective-portal",
      "coverUrl": "https://r2-endpoint/books/0x1234-detective-portal/cover.jpg",
      "ipAssetId": "0xabc...",
      "licenseTermsId": "123",
      "chapters": 6,
      "derivativeBooks": ["0x5678-detective-portal-sf"],
      "chapterMap": {
        "ch1": "0x1234-detective-portal/chapters/ch1",
        "ch2": "0x1234-detective-portal/chapters/ch2",
        "ch3": "0x1234-detective-portal/chapters/ch3"
      },
      "originalAuthors": {
        "0x1234567890123456789012345678901234567890": {
          "chapters": ["ch1", "ch2", "ch3"],
          "revenueShare": 60
        }
      }
    }
  ]
}
```

### Register Book

Register a new book as a parent IP asset.

```http
POST /api/books/register
```

**Request Body:**
```json
{
  "title": "My Epic Story",
  "description": "An adventure across time and space",
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "authorName": "Author Name",
  "coverFile": "base64_encoded_image_data",
  "licenseTerms": {
    "commercialUse": true,
    "derivativesAllowed": true,
    "royaltyPercentage": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "book": {
    "bookId": "0x1234-my-epic-story",
    "ipAssetId": "0xabc123...",
    "transactionHash": "0xdef456...",
    "coverUrl": "https://r2-endpoint/books/0x1234-my-epic-story/cover.jpg"
  }
}
```

### Create Derivative Book

Branch from an existing book to create a derivative.

```http
POST /api/books/branch
```

**Request Body:**
```json
{
  "parentBookId": "0x1234-detective-portal",
  "branchPoint": "ch3",
  "title": "Detective Portal: Sci-Fi Adventure", 
  "description": "Taking the story in a sci-fi direction",
  "authorAddress": "0x5678901234567890123456789012345678901234",
  "authorName": "Boris",
  "coverFile": "base64_encoded_image_data"
}
```

### Get Book Details

Fetch complete book metadata and chapter information.

```http
GET /api/books/{bookId}
```

**Response:**
```json
{
  "success": true,
  "book": {
    "bookId": "0x1234-detective-portal",
    "title": "The Detective's Portal",
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "The Beginning",
        "summary": "Detective Sarah Chen discovers the portal",
        "wordCount": 2450,
        "readingTime": 10,
        "unlockPrice": 0,
        "readReward": 0.05,
        "isUnlocked": true,
        "contentUrl": "https://r2-endpoint/.../ch1.json"
      }
    ],
    "totalChapters": 6,
    "familyTree": {
      "parent": null,
      "derivatives": ["0x5678-detective-portal-sf"]
    }
  }
}
```

---

## 🤖 AI Generation API

### Generate Story

Create AI-generated content with automatic R2 storage and optional IP registration.

```http
POST /api/generate
```

**Request Body:**
```json
{
  "plotDescription": "A detective discovers a portal to another dimension",
  "genres": ["mystery", "sci-fi"],
  "moods": ["mysterious", "exciting"],
  "emojis": ["🕵️", "🌀", "🔍"],
  "chapterNumber": 1,
  "previousContent": "",
  "storyTitle": "The Portal Detective",
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "ipOptions": {
    "registerAsIP": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Chapter 1: The Discovery",
    "content": "Detective Sarah Chen had seen many strange cases...",
    "storyId": "story_1703123456",
    "chapterNumber": 1,
    "contentUrl": "https://r2-endpoint/stories/story_1703123456/chapters/1.json",
    "metadata": {
      "suggestedTags": ["mystery", "portal", "discovery"],
      "suggestedGenre": "Mystery Sci-Fi",
      "contentRating": "PG-13",
      "qualityScore": 87,
      "originalityScore": 94,
      "commercialViability": 76,
      "generatedAt": "2024-12-21T10:30:00Z"
    }
  },
  "ipData": {
    "operationId": "gen-1703123456-abc123",
    "transactionHash": "0xdef456...",
    "ipAssetId": "0xabc789...",
    "gasUsed": "245000"
  },
  "message": "Story generated, saved to storage, and registered as IP asset!"
}
```

---

## 📖 Chapter Management API

### Get Chapter Count

Get the current number of chapters for a story (used for automatic numbering).

```http
GET /api/books/{bookId}/chapters
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "nextChapterNumber": 4,
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "The Beginning",
      "wordCount": 2450,
      "readingTime": 10,
      "unlockPrice": 0,
      "readReward": 0.05,
      "isUnlocked": true
    }
  ]
}
```

### Save Chapter

Save a new chapter to a book.

```http
POST /api/books/{bookId}/chapters/save
```

**Request Body:**
```json
{
  "chapterNumber": 4,
  "title": "The New Discovery",
  "content": "Chapter content here...",
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "metadata": {
    "genre": ["mystery", "sci-fi"],
    "mood": "exciting",
    "contentRating": "PG-13"
  }
}
```

### Get Chapter Content

Retrieve a specific chapter's content.

```http
GET /api/books/{bookId}/chapter/{chapterNumber}
```

**Response:**
```json
{
  "success": true,
  "chapter": {
    "chapterNumber": 1,
    "title": "The Beginning",
    "content": "Full chapter content...",
    "wordCount": 2450,
    "readingTime": 10,
    "unlockPrice": 0,
    "readReward": 0.05,
    "metadata": {
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "createdAt": "2024-12-21T10:30:00Z",
      "genre": ["mystery"],
      "mood": "mysterious"
    }
  }
}
```

### Unlock Chapter

Unlock premium chapter content (paid content).

```http
POST /api/books/{bookId}/chapter/{chapterNumber}/unlock
```

**Request Body:**
```json
{
  "userAddress": "0x9876543210987654321098765432109876543210",
  "paymentProof": "transaction_hash_or_signature"
}
```

---

## 🔗 Story Protocol IP Management

### Register IP Asset

Register content as an IP asset on Story Protocol.

```http
POST /api/ip/register
```

**Request Body:**
```json
{
  "contentType": "chapter", // or "book"
  "title": "Chapter 1: The Beginning",
  "description": "First chapter of an epic story",
  "contentUrl": "https://r2-endpoint/stories/123/chapters/1.json",
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "metadata": {
    "genre": ["fantasy"],
    "wordCount": 2450,
    "qualityScore": 87
  }
}
```

**Response:**
```json
{
  "success": true,
  "ipAssetId": "0xabc123...",
  "tokenId": "456",
  "transactionHash": "0xdef789...",
  "gasUsed": "245000",
  "blockNumber": "12345678"
}
```

### Create License Terms

Create licensing terms for IP assets.

```http
POST /api/ip/license
```

**Request Body:**
```json
{
  "ipAssetId": "0xabc123...",
  "licenseType": "standard", // standard, premium, exclusive
  "terms": {
    "commercialUse": true,
    "derivativesAllowed": true,
    "royaltyPercentage": 10,
    "price": "100000000000000000000" // 100 TIP tokens in wei
  }
}
```

---

## 📊 Collections & Discovery

### Get Collections

Fetch curated story collections.

```http
GET /api/collections
```

**Response:**
```json
{
  "success": true,
  "collections": [
    {
      "id": "trending",
      "title": "Trending Stories",
      "description": "Most popular stories this week",
      "stories": [
        {
          "id": "story_123",
          "title": "The Portal Detective",
          "preview": "A detective discovers...",
          "metrics": {
            "reads": 1250,
            "rating": 4.8,
            "earnings": 450.75
          }
        }
      ]
    }
  ]
}
```

### Get Discovery Feed

Get personalized story recommendations.

```http
GET /api/discovery
```

**Query Parameters:**
- `userAddress` (optional): User wallet address for personalization
- `genre` (optional): Filter by genre
- `mood` (optional): Filter by mood

---

## 🔄 Upload & Storage

### Upload Content

Manual upload to R2 storage.

```http
POST /api/upload
```

**Request Body:**
```json
{
  "content": "Content to upload",
  "storyId": "story_123", 
  "chapterNumber": 1,
  "contentType": "application/json"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://r2-endpoint/stories/story_123/chapters/1.json",
  "key": "stories/story_123/chapters/1.json",
  "metadata": {
    "storyId": "story_123",
    "chapterNumber": "1",
    "contentType": "chapter",
    "uploadedAt": "2024-12-21T10:30:00Z"
  }
}
```

---

## 🚨 Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details",
    "timestamp": "2024-12-21T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_INPUT` | Request validation failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `BLOCKCHAIN_ERROR` | Blockchain operation failed | 500 |
| `STORAGE_ERROR` | R2 storage operation failed | 500 |
| `AI_ERROR` | AI generation failed | 500 |

---

## 🧪 Testing

### Health Check

```http
GET /api/test
```

### Debug Environment

```http
GET /api/debug-env
```

### Test R2 Connection

```http
GET /api/test-r2
```

### Test Story Protocol

```http
POST /api/story-protocol
Content-Type: application/json

{
  "action": "test"
}
```

---

**API Status**: ✅ **Production Ready** with comprehensive IP management and real blockchain integration.