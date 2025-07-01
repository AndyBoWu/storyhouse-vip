# Backend CLAUDE.md

This file provides specific guidance for working with the StoryHouse.vip backend API.

## Overview

Next.js API backend serving as the bridge between frontend and blockchain/storage systems. Handles metadata generation, R2 storage, and provides proxy endpoints for secure resource access.

## Key Technologies

- **Framework**: Next.js API Routes (App Router)
- **Storage**: Cloudflare R2 (private bucket)
- **Blockchain**: Story Protocol SDK, Viem
- **Authentication**: Wallet-based (signature verification)
- **Metadata**: SHA-256 hashing for Story Protocol compliance

## Directory Structure

```
apps/backend/
├── app/
│   └── api/                    # API routes
│       ├── books/             # Book management
│       ├── chapters/          # Chapter operations
│       ├── ip/                # IP registration
│       └── users/             # User management
├── lib/
│   ├── services/              # Business logic
│   │   ├── unifiedIpService.ts         # Unified registration
│   │   ├── advancedStoryProtocolService.ts # Story Protocol
│   │   └── r2Service.ts                # R2 storage
│   ├── utils/                 # Helper functions
│   └── types/                 # TypeScript types
└── public/                    # Static assets
```

## Critical Services

### 1. Unified IP Service (`lib/services/unifiedIpService.ts`)
- Generates Story Protocol compliant metadata
- Creates SHA-256 hashes for verification
- Stores metadata in R2 with proper structure
- Returns metadata URI and hash for blockchain

### 2. R2 Service & Image Proxy
**CRITICAL**: R2 bucket is PRIVATE - never expose direct URLs

```typescript
// WRONG - Never return R2 URLs directly
return { coverUrl: r2DirectUrl };

// CORRECT - Always use proxy endpoint
return { coverUrl: `/api/books/${bookId}/cover` };
```

Proxy endpoint handles:
- Authentication (if needed)
- R2 bucket access
- Proper content-type headers
- Error handling

### 3. Advanced Story Protocol Service
- Manages PIL license terms configuration
- Handles license tier mappings
- All royalty addresses set to zero address (0x0)
- Revenue handled by HybridRevenueControllerV2

## API Endpoints

### Core Endpoints
```
POST   /api/ip/register-unified     # Generate metadata for IP registration
GET    /api/ip/register-unified     # Check service availability

GET    /api/books                   # List all books
GET    /api/books/[bookId]         # Get book details
GET    /api/books/[bookId]/cover   # Proxy for book cover images
POST   /api/books/[bookId]/publish # Create new chapter

GET    /api/chapters/[chapterId]   # Get chapter content
POST   /api/chapters/[chapterId]/unlock # Record chapter unlock

GET    /api/users/[address]/books  # Get user's books
```

### Removed Endpoints (Legacy)
- ❌ `/api/ip/register/*` - Legacy registration
- ❌ `/api/ip/license/*` - Legacy licensing
- ❌ `/api/test/*` - Debug endpoints
- ❌ `/api/debug-*` - Security risk

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:3002
STORY_PROTOCOL_RPC_URL=https://rpc.storynetwork.io
STORY_PROTOCOL_CHAIN_ID=513226

# R2 Storage (Private Bucket)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=storyhouse-metadata
R2_PUBLIC_URL=https://... # For proxy, not direct access

# Contracts
STORY_MANAGER_PRIVATE_KEY=... # Admin operations only
HYBRID_REVENUE_CONTROLLER_ADDRESS=0x995c...
```

## Development Guidelines

### 1. API Design Principles
- RESTful conventions
- Consistent error responses
- Proper HTTP status codes
- Input validation on all endpoints

### 2. Error Handling Pattern
```typescript
try {
  // Operation
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

### 3. R2 Storage Best Practices
- Always use proxy endpoints for public access
- Store metadata with consistent structure
- Include SHA-256 hashes for verification
- Use proper content types

### 4. Blockchain Integration
- Backend only generates metadata
- Frontend handles actual blockchain transactions
- Never store private keys in code
- Use environment variables for sensitive data

## Common Tasks

### Adding New API Endpoint
1. Create route file in appropriate directory
2. Implement request handlers (GET, POST, etc.)
3. Add input validation
4. Update API client in frontend
5. Document in this file

### Implementing New Service
1. Create service file in `lib/services/`
2. Define clear interfaces
3. Handle errors appropriately
4. Add logging for debugging
5. Write integration tests

### Working with R2
```typescript
// Upload file
const key = `books/${bookId}/metadata.json`;
await r2Service.uploadJson(key, metadata);

// Serve via proxy
app.get('/api/books/:bookId/cover', async (req, res) => {
  const image = await r2Service.getObject(key);
  res.contentType('image/jpeg').send(image);
});
```

## Security Considerations

1. **Private R2 Bucket**: Never expose direct URLs
2. **Input Validation**: Validate all user inputs
3. **Rate Limiting**: Implement on public endpoints
4. **Authentication**: Verify wallet signatures
5. **CORS**: Configure appropriately
6. **Environment Variables**: Never commit secrets

## Testing

### Unit Tests (TODO)
```bash
npm test               # Run all tests
npm test:watch        # Watch mode
npm test:coverage     # Coverage report
```

### Manual Testing
1. Use Postman or similar for API testing
2. Test error cases explicitly
3. Verify R2 uploads work correctly
4. Check blockchain metadata compliance

## Monitoring & Logging

### Current State
- Basic console.error for errors
- No structured logging

### Improvements Needed
- Implement structured logging (Winston/Pino)
- Add request/response logging
- Monitor R2 usage
- Track API performance
- Add health check endpoint

## Known Issues

1. **No Rate Limiting**: Add express-rate-limit
2. **No API Documentation**: Generate OpenAPI spec
3. **Limited Error Details**: Improve error messages
4. **No Caching**: Add Redis for frequently accessed data
5. **No Request Validation**: Add Zod or Joi schemas

## Future Improvements

1. **API Documentation**: OpenAPI/Swagger spec
2. **Rate Limiting**: Protect against abuse
3. **Caching Layer**: Redis for performance
4. **Monitoring**: DataDog or similar
5. **Testing**: Comprehensive test suite
6. **Webhooks**: For async operations
7. **GraphQL**: For complex queries
8. **Background Jobs**: Queue system for heavy operations