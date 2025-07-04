# Cloudflare MCP Server Usage Guide for StoryHouse

**⚠️ IMPORTANT: Cloudflare R2 is NOT supported by the official Cloudflare MCP server ⚠️**

The Cloudflare MCP server only supports:
- Workers & Pages management
- KV Store operations
- D1 Database management
- Durable Objects

For R2 operations, continue using the existing backend API endpoints that handle R2 via the Cloudflare SDK.

## R2 Operations for StoryHouse

Since R2 is not supported by MCP, use the existing StoryHouse backend APIs:

### API Endpoints for R2 Operations

1. **Upload Book Cover**:
   ```bash
   POST /api/books/{bookId}/cover
   ```

2. **Get Book Cover**:
   ```bash
   GET /api/books/{bookId}/cover
   ```

3. **Upload Chapter Metadata**:
   ```bash
   POST /api/chapters/{chapterId}/metadata
   ```

### R2 Bucket Structure
Your R2 structure follows this pattern:
```
storyhouse-metadata/
├── books/
│   ├── {bookId}/
│   │   ├── metadata.json
│   │   ├── cover.jpg
│   │   └── chapters/
│   │       ├── 1/
│   │       │   └── metadata.json
│   │       └── 2/
│   │           └── metadata.json
```

## Security Considerations

- Your R2 bucket is **private** - never expose direct R2 URLs
- Always use the proxy endpoints (`/api/books/{bookId}/cover`)
- Backend handles all R2 authentication via Cloudflare SDK

## Alternative: Cloudflare Dashboard

For manual R2 operations, use the Cloudflare Dashboard:
1. Log in to https://dash.cloudflare.com
2. Navigate to R2 > Overview
3. Select your `storyhouse-metadata` bucket
4. Use the web interface for file operations