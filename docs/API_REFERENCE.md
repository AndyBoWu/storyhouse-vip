# API Reference

## Overview

StoryHouse.vip provides a comprehensive RESTful API for creating, managing, and licensing IP assets with PIL (Programmable IP License) support, blockchain derivative registration, AI-powered content analytics, automated notifications, and real-time royalty distribution.

### Base URLs
```
Production: https://api.storyhouse.vip/api
Testnet: https://api-testnet.storyhouse.vip/api  
Development: http://localhost:3002/api
```

### Authentication
Session-based authentication with Web3 wallet integration.

---

## 🔗 **Story Protocol SDK Derivative Registration API**

### Register Derivative Manually

Register a derivative work on blockchain using Story Protocol SDK.

```http
POST /api/derivatives/register
```

**Request Body:**
```json
{
  "derivativeChapterId": "0x1234567890abcdef",
  "parentIpId": "0xfedcba0987654321",
  "authorAddress": "0x9876543210fedcba",
  "metadata": {
    "title": "Extended Chapter: The Portal's Secret",
    "description": "A derivative work expanding on the original portal story",
    "derivativeType": "expansion"
  },
  "options": {
    "skipLicenseCheck": false,
    "economicProjection": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Derivative registered successfully on blockchain",
  "data": {
    "derivativeIpId": "0xnewderivative123",
    "parentIpId": "0xfedcba0987654321",
    "transactionHash": "0xabc123def456...",
    "licenseInheritance": {
      "inheritedFrom": "Premium License",
      "royaltyRate": 10,
      "commercialUse": true
    },
    "economicProjection": {
      "projectedRevenue": 250.00,
      "parentRoyaltyShare": 25.00,
      "derivativeShare": 225.00
    },
    "registeredAt": "YYYY-MM-DDTHH:MM:SS.SSSZ"
  }
}
```

### Auto-Register Derivative with AI Detection

AI-powered detection and automatic derivative registration.

```http
POST /api/derivatives/auto-register
```

**Request Body:**
```json
{
  "chapterId": "0x1234567890abcdef",
  "content": "Detective Sarah Chen discovered another portal, deeper in the forest...",
  "authorAddress": "0x9876543210fedcba",
  "options": {
    "similarityThreshold": 0.7,
    "autoRegister": true,
    "requireConfirmation": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI detected parent content and registered derivative",
  "data": {
    "detectedParents": [
      {
        "parentIpId": "0xfedcba0987654321",
        "similarityScore": 0.85,
        "title": "The Detective's Portal - Chapter 1",
        "matchingElements": ["character: Detective Sarah Chen", "setting: forest portal"]
      }
    ],
    "derivativeIpId": "0xnewderivative456",
    "transactionHash": "0xdef456ghi789...",
    "aiAnalysis": {
      "originalityScore": 75,
      "qualityScore": 88,
      "derivativeType": "sequel",
      "confidence": 92
    }
  }
}
```

### Get Family Tree

Retrieve derivative relationship tree with unlimited depth.

```http
GET /api/derivatives/tree/[ipId]
```

**Query Parameters:**
- `depth` (optional): Maximum depth to traverse (default: unlimited)
- `includeMetadata` (optional): Include full metadata for each node
- `format` (optional): Response format ("tree" | "flat")

**Response:**
```json
{
  "success": true,
  "data": {
    "rootIpId": "0xoriginal123",
    "title": "The Detective's Portal",
    "totalDerivatives": 15,
    "maxDepth": 4,
    "familyTree": {
      "ipId": "0xoriginal123",
      "title": "The Detective's Portal - Chapter 1",
      "level": 0,
      "children": [
        {
          "ipId": "0xderivative456",
          "title": "The Portal's Secret",
          "similarityScore": 0.85,
          "level": 1,
          "children": [
            {
              "ipId": "0xsubderivative789",
              "title": "Portal Mysteries Unveiled",
              "similarityScore": 0.72,
              "level": 2,
              "children": []
            }
          ]
        }
      ]
    },
    "statistics": {
      "directDerivatives": 3,
      "totalRevenue": 1250.00,
      "averageSimilarity": 0.78
    }
  }
}
```

### Analyze License Inheritance

Check license compatibility for derivative registration.

```http
GET /api/derivatives/license-inheritance/[parentIpId]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "parentIpId": "0xfedcba0987654321",
    "parentLicense": {
      "templateId": "premium",
      "name": "Premium License",
      "derivativesAllowed": true,
      "commercialUse": true,
      "royaltyRate": 10
    },
    "inheritance": {
      "canCreateDerivative": true,
      "inheritedRoyaltyRate": 10,
      "inheritedTerms": {
        "commercialUse": true,
        "attribution": true,
        "shareAlike": false
      }
    },
    "economicAnalysis": {
      "parentRevenueShare": 10,
      "derivativeRevenueShare": 90,
      "projectedParentEarnings": {
        "conservative": 25.00,
        "optimistic": 75.00
      }
    }
  }
}
```

---

## 🔔 **Automated Notification System API**

### Get User Notifications

Retrieve real-time notifications for a user.

```http
GET /api/notifications/[userAddress]
```

**Query Parameters:**
- `type` (optional): Filter by notification type
- `read` (optional): Filter by read status
- `limit` (optional): Number of notifications to return

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_derivative_123",
        "type": "derivative_detected",
        "title": "New Derivative Detected",
        "message": "AI detected a potential derivative of your work 'The Detective's Portal'",
        "metadata": {
          "parentIpId": "0xoriginal123",
          "derivativeIpId": "0xderivative456",
          "similarityScore": 0.85,
          "potentialRevenue": 25.00
        },
        "createdAt": "YYYY-MM-DDTHH:MM:SS.SSSZ",
        "read": false,
        "priority": "high"
      }
    ],
    "summary": {
      "total": 15,
      "unread": 8,
      "byType": {
        "derivative_detected": 3,
        "quality_improvement": 2,
        "collaboration_opportunity": 3
      }
    }
  }
}
```

### Mark Notifications as Read

Mark one or more notifications as read.

```http
POST /api/notifications/mark-read
```

**Request Body:**
```json
{
  "userAddress": "0x9876543210fedcba",
  "notificationIds": ["notif_derivative_123", "notif_quality_456"],
  "markAll": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 notifications marked as read",
  "data": {
    "updatedCount": 2,
    "remainingUnread": 6
  }
}
```

### Get Notification Preferences

Retrieve user notification preferences.

```http
GET /api/notifications/preferences/[userAddress]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "derivative_detected": {
        "enabled": true,
        "channels": ["in_app", "email"],
        "threshold": 0.7
      },
      "quality_improvement": {
        "enabled": true,
        "channels": ["in_app"],
        "minScore": 60
      },
      "collaboration_opportunity": {
        "enabled": false,
        "channels": []
      }
    },
    "globalSettings": {
      "emailEnabled": true,
      "pushEnabled": true,
      "webhookUrl": "https://example.com/webhook"
    }
  }
}
```

### Update Notification Preferences

Update user notification preferences.

```http
POST /api/notifications/preferences
```

**Request Body:**
```json
{
  "userAddress": "0x9876543210fedcba",
  "preferences": {
    "derivative_detected": {
      "enabled": true,
      "channels": ["in_app", "email", "push"],
      "threshold": 0.8
    }
  },
  "globalSettings": {
    "emailEnabled": true,
    "webhookUrl": "https://mynewwebhook.com/notifications"
  }
}
```

---

## 🤖 **AI Content Analytics API**

### Content Similarity Analysis

Analyze content similarity for derivative detection.

```http
GET /api/discovery?type=content-similarity
```

**Query Parameters:**
- `chapterId` (optional): Specific chapter to analyze
- `threshold` (optional): Similarity threshold (0.0-1.0)
- `limit` (optional): Max results to return

**Response:**
```json
{
  "success": true,
  "data": {
    "similarities": [
      {
        "sourceChapter": "0x1234567890abcdef",
        "targetChapter": "0xfedcba0987654321",
        "similarityScore": 0.85,
        "matchingElements": ["character names", "plot structure", "setting"],
        "analysis": {
          "isDerivative": true,
          "confidence": 92,
          "derivativeType": "adaptation"
        }
      }
    ],
    "summary": {
      "totalAnalyzed": 50,
      "potentialDerivatives": 3,
      "avgSimilarityScore": 0.23
    }
  }
}
```

### Influence Analysis

Analyze author influence and derivative impact.

```http
GET /api/discovery?type=influence-analysis
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authors": [
      {
        "authorAddress": "0x9876543210fedcba",
        "influenceScore": 85,
        "metrics": {
          "directDerivatives": 12,
          "indirectDerivatives": 35,
          "totalRevenue": 2500.00,
          "readerEngagement": 78
        },
        "trending": {
          "weeklyGrowth": 15.5,
          "derivativeVelocity": 3.2
        }
      }
    ]
  }
}
```

### Quality Assessment

AI-powered content quality analysis.

```http
GET /api/discovery?type=quality-assessment
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "chapterId": "0x1234567890abcdef",
        "qualityScore": 88,
        "breakdown": {
          "plot": 90,
          "character": 85,
          "writing": 87,
          "engagement": 92
        },
        "recommendations": [
          "Consider developing secondary characters more deeply",
          "Excellent pacing and tension building"
        ]
      }
    ]
  }
}
```

---

## 💰 **Enhanced Royalty Distribution API**

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
    "claimedAt": "YYYY-MM-DDTHH:MM:SS.SSSZ",
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
    "lastClaimedAt": "YYYY-MM-DDTHH:MM:SS.SSSZ",
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
        "claimedAt": "YYYY-MM-DDTHH:MM:SS.SSSZ",
        "transactionHash": "0xabc123...",
        "status": "completed"
      }
    ],
    "analytics": {
      "averageClaimAmount": 166.67,
      "topPerformingChapter": "0x1234567890abcdef",
      "monthlyTrend": [
        {"month": "YYYY-MM", "amount": 500.00},
        {"month": "YYYY-MM", "amount": 400.00}
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
        "break_even_date": "YYYY-MM-DD"
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
        "createdAt": "YYYY-MM-DDTHH:MM:SS.SSSZ",
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
      "last_delivery": "YYYY-MM-DDTHH:MM:SS.SSSZ",
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
    "effectiveDate": "YYYY-MM-DDTHH:MM:SS.SSSZ"
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

// 🆕 Derivative Registration
const manualDerivative = await apiClient.registerDerivative({
  derivativeChapterId: '0x1234567890abcdef',
  parentIpId: '0xfedcba0987654321',
  authorAddress: '0x9876543210fedcba'
})

const autoDerivative = await apiClient.autoRegisterDerivative({
  chapterId: '0x1234567890abcdef',
  content: 'Story content...',
  authorAddress: '0x9876543210fedcba'
})

const familyTree = await apiClient.getDerivativeTree('0xoriginal123')
const licenseInheritance = await apiClient.getLicenseInheritance('0xparent456')

// 🆕 Notification Management
const notifications = await apiClient.getNotifications('0x9876543210fedcba')
const markRead = await apiClient.markNotificationsRead({
  userAddress: '0x9876543210fedcba',
  notificationIds: ['notif_123']
})
const preferences = await apiClient.getNotificationPreferences('0x9876543210fedcba')
const updatePrefs = await apiClient.updateNotificationPreferences({
  userAddress: '0x9876543210fedcba',
  preferences: {...}
})

// 🆕 AI Analytics
const similarity = await apiClient.getContentSimilarity()
const influence = await apiClient.getInfluenceAnalysis()
const quality = await apiClient.getQualityAssessment()

// Royalty Management
const claimResult = await apiClient.claimRoyalty({
  chapterId: '0x1234567890abcdef',
  authorAddress: '0x9876543210fedcba'
})

const claimableAmount = await apiClient.getClaimableRoyalties('0x1234567890abcdef')
const history = await apiClient.getRoyaltyHistory('0x9876543210fedcba')
const analytics = await apiClient.getRoyaltyPreview()
const royaltyNotifications = await apiClient.getRoyaltyNotifications('0x9876543210fedcba')
```

---

## 🆕 **Rate Limiting & Performance**

### Enhanced API Limits
- **Development**: No limits
- **Production**: 
  - **Derivative Registration**: 5 per minute per wallet (blockchain operations)
  - **Notification Operations**: 50 per minute per user
  - **AI Analytics**: 20 per minute per wallet
  - **Royalty Claims**: 10 per minute per wallet
  - **Read Operations**: 100 per minute per IP

### Performance Optimization
- **Response Times**: 
  - AI Analysis: <3s for content similarity
  - Blockchain Operations: <5s for derivative registration
  - Notifications: <2s for real-time delivery
  - Standard APIs: <2s for all operations
- **Caching**: 
  - Intelligent caching for analytics and family tree data
  - AI analysis results cached for 24 hours
  - Notification preferences cached for performance
- **Batch Operations**: 
  - Concurrent processing for multiple derivative registrations
  - Background notification processing every 6 hours
- **Error Recovery**: 
  - Automatic retry logic for blockchain operations
  - Graceful fallback for AI service interruptions

---

## 🔐 **Security Features**

### Comprehensive Security Framework
- **Multi-signature validation** for high-value claims and derivative registrations
- **Rate limiting** to prevent abuse across all API endpoints
- **Input validation** with comprehensive sanitization and type checking
- **Blockchain verification** for all Story Protocol SDK transactions
- **AI Content Protection** with privacy-preserving analysis
- **Notification Security** with anti-spam and content filtering
- **Audit trails** for all blockchain operations and sensitive actions

### Enhanced Error Categories
1. **Validation Errors**: Invalid parameters or missing data
2. **Blockchain Errors**: Network issues, insufficient gas, or SDK failures
3. **AI Errors**: OpenAI API failures or analysis timeouts
4. **Economic Errors**: Insufficient balance or invalid amounts
5. **Authorization Errors**: Wallet verification or permission failures
6. **System Errors**: Infrastructure or configuration issues
7. **Rate Limit Errors**: Too many requests across different endpoints
8. **Notification Errors**: Delivery failures or preference conflicts
9. **Derivative Errors**: License incompatibility or registration failures