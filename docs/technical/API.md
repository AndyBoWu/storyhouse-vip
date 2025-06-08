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

## 📚 **Stories API**

### **Get All Published Stories**

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
      "preview": "Detective Sarah Chen never believed in magic until she encountered the strange case...",
      "contentUrl": "https://r2.example.com/stories/story_1703123456/chapters/1.json",
      "publishedAt": "2024-12-21T10:30:00Z",
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "authorName": "0x1234...7890",
      "contentRating": "PG-13",
      "unlockPrice": 0.1,
      "readReward": 0.05,
      "licensePrice": 100,
      "isRemixable": true,
      "totalReads": 0,
      "averageRating": 0,
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
  "count": 1,
  "debug": {
    "bucket": "storyhouse-stories",
    "totalDirectories": 1,
    "processedDirectories": 1,
    "processedStories": 1
  }
}
```

### **Get Story Table of Contents**

Fetch complete story metadata and all chapters for a specific story by wallet and slug.

```http
GET /api/stories/[walletAddress]/[storySlug]/chapters
```

**Path Parameters:**
- `walletAddress`: Author's wallet address (case-insensitive)
- `storySlug`: Story slug derived from title or story ID

**Response:**

```json
{
  "success": true,
  "story": {
    "id": "story_1703123456",
    "title": "The Shadowbrook Mysteries",
    "authorName": "Detective Writer",
    "authorAddress": "0x1234567890123456789012345678901234567890",
    "genre": "Mystery",
    "totalChapters": 3,
    "totalWords": 5961,
    "totalReadingTime": 24,
    "averageRating": 4.2,
    "description": "A gripping mystery series following Detective Sarah Chen...",
    "tags": ["mystery", "detective", "urban"],
    "createdAt": "2024-12-21T10:30:00Z",
    "updatedAt": "2024-12-21T14:30:00Z"
  },
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "The First Case",
      "summary": "Detective Sarah Chen receives her first supernatural case...",
      "wordCount": 1987,
      "readingTime": 8,
      "unlockPrice": 0.1,
      "readReward": 0.05,
      "totalReads": 45,
      "isUnlocked": false,
      "createdAt": "2024-12-21T10:30:00Z",
      "genre": "Mystery",
      "mood": "mysterious",
      "contentRating": "PG-13"
    },
    {
      "chapterNumber": 2,
      "title": "Strange Evidence",
      "summary": "The investigation takes an unexpected turn when Chen discovers...",
      "wordCount": 2100,
      "readingTime": 8,
      "unlockPrice": 0.1,
      "readReward": 0.05,
      "totalReads": 32,
      "isUnlocked": false,
      "createdAt": "2024-12-21T12:15:00Z",
      "genre": "Mystery",
      "mood": "suspenseful",
      "contentRating": "PG-13"
    }
  ],
  "debug": {
    "storyId": "story_1703123456",
    "totalChapters": 3,
    "totalWords": 5961,
    "totalReadingTime": 24
  }
}
```

### **Get Individual Chapter**

Fetch complete content for a specific chapter.

```http
GET /api/chapters/[storyId]/[chapterNumber]
```

**Path Parameters:**
- `storyId`: Unique story identifier
- `chapterNumber`: Chapter number (starting from 1)

**Response:**

```json
{
  "success": true,
  "data": {
    "storyId": "story_1703123456",
    "chapterNumber": 1,
    "content": "Detective Sarah Chen never believed in magic until...",
    "title": "The First Case",
    "themes": ["mystery", "supernatural", "detective"],
    "wordCount": 1987,
    "readingTime": 8,
    "metadata": {
      "suggestedTags": ["mystery", "detective", "supernatural"],
      "suggestedGenre": "Mystery",
      "contentRating": "PG-13",
      "language": "en",
      "genre": ["mystery", "fantasy"],
      "mood": "mysterious",
      "generationMethod": "ai",
      "aiModel": "gpt-4",
      "plotDescription": "A detective discovers supernatural elements in her cases",
      "qualityScore": 87,
      "originalityScore": 94,
      "commercialViability": 89,
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "authorName": "Detective Writer",
      "isRemix": false,
      "isRemixable": true,
      "licensePrice": 100,
      "royaltyPercentage": 5,
      "unlockPrice": 0.1,
      "readReward": 0.05,
      "totalReads": 45,
      "totalEarned": 2.25,
      "totalRevenue": 4.5,
      "status": "published",
      "visibility": "public",
      "generatedAt": "2024-12-21T10:30:00Z",
      "publishedAt": "2024-12-21T10:30:00Z",
      "lastModified": "2024-12-21T10:30:00Z",
      "averageRating": 4.2,
      "remixCount": 0,
      "streakBonus": 0
    }
  }
}
```

---

## 📚 **Book Registration & Branching API** ✨ NEW!

### **Register New Book**

Register a book as a parent IP asset with custom cover and metadata.

```http
POST /api/books/register
```

**Request Body:**

```json
{
  "title": "The Detective's Portal",
  "description": "A time-traveling detective discovers ancient mysteries across different eras",
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "authorName": "Detective Writer",
  "coverFile": "File object",
  "genres": ["mystery", "fantasy", "time-travel"],
  "contentRating": "PG-13",
  "licenseTerms": {
    "commercialUse": true,
    "derivativesAllowed": true,
    "commercialRevShare": 2500,
    "mintingFee": "100000000000000000000"
  }
}
```

**Response:**

```json
{
  "success": true,
  "book": {
    "bookId": "0x1234-detective-portal",
    "ipAssetId": "0xa1b2c3d4e5f6789012345678901234567890abcd",
    "slug": "detective-portal",
    "coverUrl": "https://r2.example.com/books/0x1234-detective-portal/cover.jpg",
    "licenseTermsId": "0xdef456789012345678901234567890123456789abc"
  },
  "transactionHash": "0x1a2b3c4d5e6f789012345678901234567890abcdef123456789",
  "blockchainStatus": {
    "connected": true,
    "network": "odyssey",
    "gasUsed": "245821"
  }
}
```

### **Create Derivative Book**

Branch from an existing book to create a new derivative book.

```http
POST /api/books/branch
```

**Request Body:**

```json
{
  "parentBookId": "0x1234-detective-portal",
  "branchPoint": "ch3",
  "newTitle": "The Detective's Portal: Sci-Fi Adventure",
  "newDescription": "The detective's journey takes a futuristic turn",
  "newCover": "File object",
  "authorAddress": "0x5678901234567890123456789012345678901234",
  "authorName": "Sci-Fi Writer",
  "genres": ["sci-fi", "mystery", "space"],
  "contentRating": "PG-13"
}
```

**Response:**

```json
{
  "success": true,
  "book": {
    "bookId": "0x5678-detective-portal-sf",
    "parentBookId": "0x1234-detective-portal",
    "ipAssetId": "0xb2c3d4e5f6789012345678901234567890abcdef",
    "branchPoint": "ch3",
    "coverUrl": "https://r2.example.com/books/0x5678-detective-portal-sf/cover.jpg",
    "chapterMap": {
      "ch1": "0x1234-detective-portal/chapters/ch1",
      "ch2": "0x1234-detective-portal/chapters/ch2", 
      "ch3": "0x1234-detective-portal/chapters/ch3"
    },
    "originalAuthors": {
      "0x1234567890123456789012345678901234567890": {
        "chapters": ["ch1", "ch2", "ch3"],
        "revenueShare": 50
      },
      "0x5678901234567890123456789012345678901234": {
        "chapters": [],
        "revenueShare": 50
      }
    }
  },
  "transactionHash": "0x2b3c4d5e6f789012345678901234567890abcdef1234567890"
}
```

### **Get Book Metadata**

Retrieve complete book information including chapter mapping.

```http
GET /api/books/[bookId]
```

**Path Parameters:**
- `bookId`: Book identifier in format `{authorAddress}-{slug}`

**Response:**

```json
{
  "success": true,
  "book": {
    "bookId": "0x5678-detective-portal-sf",
    "title": "The Detective's Portal: Sci-Fi Adventure",
    "description": "The detective's journey takes a futuristic turn",
    "authorAddress": "0x5678901234567890123456789012345678901234",
    "authorName": "Sci-Fi Writer",
    "slug": "detective-portal-sf",
    "coverUrl": "https://r2.example.com/books/0x5678-detective-portal-sf/cover.jpg",
    "ipAssetId": "0xb2c3d4e5f6789012345678901234567890abcdef",
    "parentBook": "0x1234-detective-portal",
    "branchPoint": "ch3",
    "totalChapters": 6,
    "chapterMap": {
      "ch1": "0x1234-detective-portal/chapters/ch1",
      "ch2": "0x1234-detective-portal/chapters/ch2",
      "ch3": "0x1234-detective-portal/chapters/ch3",
      "ch4": "0x5678-detective-portal-sf/chapters/ch4",
      "ch5": "0x5678-detective-portal-sf/chapters/ch5",
      "ch6": "0x5678-detective-portal-sf/chapters/ch6"
    },
    "originalAuthors": {
      "0x1234567890123456789012345678901234567890": {
        "chapters": ["ch1", "ch2", "ch3"],
        "revenueShare": 50
      },
      "0x5678901234567890123456789012345678901234": {
        "chapters": ["ch4", "ch5", "ch6"],
        "revenueShare": 50
      }
    },
    "derivativeBooks": [],
    "genres": ["sci-fi", "mystery", "space"],
    "contentRating": "PG-13",
    "isRemixable": true,
    "totalReads": 0,
    "averageRating": 0,
    "totalRevenue": 0,
    "createdAt": "2024-12-21T10:30:00Z",
    "updatedAt": "2024-12-21T10:30:00Z"
  }
}
```

### **Get All Books**

Browse all registered books with filtering options.

```http
GET /api/books
```

**Query Parameters:**
- `author`: Filter by author address
- `genre`: Filter by genre
- `remixable`: Filter by remixable status (true/false)
- `parentBook`: Filter derivative books by parent
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "books": [
    {
      "bookId": "0x1234-detective-portal",
      "title": "The Detective's Portal",
      "authorName": "Detective Writer",
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "coverUrl": "https://r2.example.com/books/0x1234-detective-portal/cover.jpg",
      "totalChapters": 3,
      "genres": ["mystery", "fantasy", "time-travel"],
      "averageRating": 4.5,
      "totalReads": 150,
      "derivativeBooks": ["0x5678-detective-portal-sf", "0x9abc-detective-portal-dark"],
      "isRemixable": true,
      "createdAt": "2024-12-20T08:00:00Z"
    },
    {
      "bookId": "0x5678-detective-portal-sf",
      "title": "The Detective's Portal: Sci-Fi Adventure",
      "authorName": "Sci-Fi Writer",
      "authorAddress": "0x5678901234567890123456789012345678901234",
      "coverUrl": "https://r2.example.com/books/0x5678-detective-portal-sf/cover.jpg",
      "totalChapters": 6,
      "parentBook": "0x1234-detective-portal",
      "branchPoint": "ch3",
      "genres": ["sci-fi", "mystery", "space"],
      "averageRating": 4.2,
      "totalReads": 89,
      "derivativeBooks": [],
      "isRemixable": true,
      "createdAt": "2024-12-21T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### **Hybrid Chapter Resolution**

Get chapter content with automatic source resolution for branched books.

```http
GET /api/books/[bookId]/chapters/[chapterNumber]
```

**Path Parameters:**
- `bookId`: Book identifier
- `chapterNumber`: Chapter number (1-indexed)

**Response:**

```json
{
  "success": true,
  "chapter": {
    "chapterNumber": 2,
    "title": "Strange Evidence",
    "content": "Detective Sarah Chen examined the peculiar artifacts...",
    "summary": "The investigation takes an unexpected turn when Chen discovers...",
    "wordCount": 2100,
    "readingTime": 8,
    "unlockPrice": 0.1,
    "readReward": 0.05,
    "source": {
      "bookId": "0x1234-detective-portal",
      "authorAddress": "0x1234567890123456789012345678901234567890",
      "authorName": "Detective Writer",
      "isOriginalContent": true
    },
    "revenueAttribution": {
      "chapterAuthor": "0x1234567890123456789012345678901234567890",
      "bookCurator": "0x5678901234567890123456789012345678901234",
      "revenueShare": {
        "chapterAuthor": 80,
        "bookCurator": 10,
        "platform": 10
      }
    },
    "metadata": {
      "genre": "mystery",
      "mood": "suspenseful",
      "contentRating": "PG-13",
      "qualityScore": 89,
      "originalityScore": 92,
      "generationMethod": "ai",
      "createdAt": "2024-12-20T12:15:00Z"
    }
  }
}
```

### **Get Book Derivation Tree**

Get the complete branching tree for a book and its derivatives.

```http
GET /api/books/[bookId]/derivatives
```

**Response:**

```json
{
  "success": true,
  "tree": {
    "root": {
      "bookId": "0x1234-detective-portal",
      "title": "The Detective's Portal",
      "authorName": "Detective Writer",
      "totalChapters": 3,
      "totalReads": 150,
      "createdAt": "2024-12-20T08:00:00Z"
    },
    "derivatives": [
      {
        "bookId": "0x5678-detective-portal-sf",
        "title": "The Detective's Portal: Sci-Fi Adventure",
        "authorName": "Sci-Fi Writer",
        "branchPoint": "ch3",
        "totalChapters": 6,
        "totalReads": 89,
        "createdAt": "2024-12-21T10:30:00Z",
        "derivatives": []
      },
      {
        "bookId": "0x9abc-detective-portal-dark",
        "title": "The Detective's Portal: Dark Chronicles",
        "authorName": "Dark Writer",
        "branchPoint": "ch2",
        "totalChapters": 8,
        "totalReads": 67,
        "createdAt": "2024-12-21T14:00:00Z",
        "derivatives": [
          {
            "bookId": "0xdef0-detective-portal-horror",
            "title": "The Detective's Portal: Horror Edition",
            "authorName": "Horror Writer",
            "branchPoint": "ch5",
            "totalChapters": 4,
            "totalReads": 23,
            "createdAt": "2024-12-22T09:00:00Z",
            "derivatives": []
          }
        ]
      }
    ]
  },
  "analytics": {
    "totalDerivatives": 3,
    "totalAuthors": 4,
    "totalChapters": 21,
    "totalReads": 329,
    "averageRating": 4.3,
    "totalRevenue": 45.67
  }
}
```

---

## 📝 **Story Generation API**

### **Enhanced Story Generation**

Generate AI-powered stories with built-in IP asset metadata and blockchain registration options.

```http
POST /api/generate
```

**Request Body (Enhanced with Phase 5.0 Features):**

**For New Stories:**
```json
{
  "plotDescription": "A young detective discovers ancient magic in modern London",
  "genres": ["mystery", "fantasy", "urban"],
  "moods": ["mysterious", "dark"],
  "emojis": ["🔍", "✨", "🌙"],
  "chapterNumber": 1,
  
  // Enhanced Author Attribution
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "authorName": "0x1234...7890",
  
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

**For Story Continuation (Adding Chapters):**
```json
{
  "plotDescription": "The detective delves deeper into the magical underworld of London",
  "storyId": "story_1703123456",
  "chapterNumber": 2,
  "previousContent": "Detective Sarah Chen had just discovered that magic was real...",
  "genres": ["mystery", "fantasy", "urban"],
  "moods": ["suspenseful", "mysterious"],
  "emojis": ["🔍", "✨", "🌙"],
  
  // Author Attribution (must match existing story)
  "authorAddress": "0x1234567890123456789012345678901234567890",
  "authorName": "0x1234...7890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "storyId": "story_1703123456",
    "chapterNumber": 1,
    "title": "The Shadowbrook Mysteries",
    "content": "Detective Sarah Chen never believed in magic...",
    "themes": ["mystery", "supernatural", "detective"],
    "wordCount": 1987,
    "readingTime": 8,
    "contentUrl": "https://r2.example.com/stories/story_1703123456/chapters/1.json",
    "suggestedTags": ["mystery", "detective", "supernatural"],
    "suggestedGenre": "Mystery",
    "contentRating": "PG-13",
    "language": "en",
    "qualityScore": 87,
    "originalityScore": 94,
    "commercialViability": 89
  },
  "message": "Story generated successfully and saved to storage",
  "ipData": {
    "operationId": "gen-1703123456-abc123",
    "transactionHash": null,
    "ipAssetId": null,
    "gasUsed": null
  }
}
```

### **Story Continuation Workflow**

The platform supports continuing existing stories by adding new chapters. This workflow enables serialized content and multi-chapter narratives.

**1. Generate New Story (Chapter 1):**
```http
POST /api/generate
{
  "plotDescription": "A young detective discovers ancient magic",
  "chapterNumber": 1,
  "authorAddress": "0x1234..."
}
```

**2. Continue Story (Chapter 2+):**
```http
POST /api/generate
{
  "plotDescription": "The detective investigates deeper",
  "storyId": "story_1703123456",
  "chapterNumber": 2,
  "previousContent": "Previous chapter summary or ending...",
  "authorAddress": "0x1234..."
}
```

**3. Get Story Table of Contents:**
```http
GET /api/stories/{walletAddress}/{storySlug}/chapters
```

**4. Read Individual Chapters:**
```http
GET /api/chapters/{storyId}/{chapterNumber}
```

**Key Features:**
- **Story Continuity**: AI uses `previousContent` to maintain narrative consistency
- **Author Verification**: `authorAddress` must match the original story creator
- **Automatic Organization**: Chapters are automatically organized and numbered
- **Rich Metadata**: Each chapter includes complete metadata for the read-to-earn economy

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

| Feature                    | Status  | Blockchain | Description                           |
| -------------------------- | ------- | ---------- | ------------------------------------- |
| Story Generation           | ✅ Live | N/A        | AI-powered story creation             |
| Story Continuation         | ✅ Live | N/A        | Multi-chapter story support           |
| Stories Listing            | ✅ Live | N/A        | Get all published stories             |
| Table of Contents          | ✅ Live | N/A        | Story metadata and chapter listing    |
| Chapter Reading            | ✅ Live | N/A        | Individual chapter content access     |
| IP Registration            | ✅ Live | ✅ Real    | Register stories as IP assets         |
| License Creation           | ✅ Live | ✅ Real    | Create licensing terms                |
| License Purchase           | ✅ Live | ✅ Real    | Purchase usage rights                 |
| Collections                | ✅ Live | ✅ Real    | Organize related IP assets            |
| Royalty Claims             | ✅ Live | ✅ Real    | Claim earnings from licensing         |
| Derivatives                | ✅ Live | ✅ Real    | Create remixes and derivative works   |

---

**API Version**: 4.4 - Real Blockchain Integration ✅

**Last Updated**: December 2024

**Next Update**: Phase 5 - Production Optimization 🚀
