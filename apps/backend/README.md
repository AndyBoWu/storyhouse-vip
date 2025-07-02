# StoryHouse.vip Backend API

This is the backend API for StoryHouse.vip, providing all server-side functionality for the Web3 storytelling platform.

## Features

- **Story Management**: Create, read, update stories with cloud storage
- **IP Registration**: Story Protocol integration for IP asset management
- **Cloud Storage**: Content storage integration (R2)
- **Blockchain Integration**: Story Protocol SDK for IP management
- **Revenue Sharing**: HybridRevenueControllerV2 for automated distribution

## API Endpoints

### Books & Content
- `GET /api/books` - List all published books
- `GET /api/books/[bookId]` - Get book details
- `PUT /api/books/[bookId]` - Update book details
- `GET /api/books/[bookId]/cover` - Get book cover image (proxy for private R2 bucket)
- `GET /api/books/[bookId]/chapters` - List all chapters in a book
- `POST /api/books/[bookId]/chapters/save` - Save multiple chapters
- `GET /api/books/[bookId]/chapter/[chapterNumber]` - Get chapter content
- `PUT /api/books/[bookId]/chapter/[chapterNumber]` - Update chapter content
- `DELETE /api/books/[bookId]/chapter/[chapterNumber]` - Delete chapter
- `GET /api/books/[bookId]/chapter/[chapterNumber]/info` - Get chapter metadata
- `GET /api/books/[bookId]/chapter/[chapterNumber]/access` - Check chapter access
- `POST /api/books/[bookId]/chapter/[chapterNumber]/unlock` - Unlock chapter with payment
- `POST /api/books/[bookId]/chapter/[chapterNumber]/mint-reading-license` - Mint reading license
- `GET /api/books/[bookId]/chapter/[chapterNumber]/attribution` - Get chapter attribution
- `GET /api/books/[bookId]/registration-status` - Check book registration status
- `GET /api/books/[bookId]/ownership` - Get book ownership details
- `PUT /api/books/[bookId]/manage` - Update book management settings
- `PUT /api/books/[bookId]/update-ip` - Update book IP settings
- `POST /api/books/register` - Register a new book
- `POST /api/books/register-hybrid` - Register book on HybridRevenueControllerV2
- `POST /api/books/branch` - Create derivative book
- `POST /api/upload` - Upload content to cloud storage

### IP Management
- `POST /api/ip/register-unified` - Unified single-transaction IP registration (only method)
- `GET /api/ip/register-unified` - Check service capabilities
- `POST /api/ip/metadata` - Generate IP metadata

### Derivatives
- `POST /api/derivatives/register` - Register derivative work
- `POST /api/derivatives/auto-register` - Auto-register derivative
- `GET /api/derivatives/license-inheritance/[parentIpId]` - Get license inheritance
- `GET /api/derivatives/tree/[ipId]` - Get derivative tree

### Royalties
- `POST /api/royalties/claim` - Claim royalties
- `GET /api/royalties/claimable/[chapterId]` - Get claimable royalties
- `GET /api/royalties/history/[authorAddress]` - Get royalty history
- `POST /api/royalties/preview` - Preview royalty calculations

### Notifications
- `GET /api/notifications` - List all notifications
- `GET /api/notifications/[authorAddress]` - Get author notifications
- `GET /api/notifications/[authorAddress]/preferences` - Get notification preferences
- `PUT /api/notifications/[authorAddress]/preferences` - Update preferences
- `POST /api/notifications/[authorAddress]/mark-read` - Mark notifications as read
- `POST /api/notifications/webhooks` - Webhook endpoint
- `POST /api/notifications/derivatives` - Derivative notifications
- `POST /api/notifications/opportunities` - Opportunity notifications
- `POST /api/notifications/quality` - Quality notifications

### Other
- `GET /api/health` - Health check endpoint
- `GET /api/version` - API version info
- `GET /api/discovery` - Content discovery
- `GET /api/licenses/templates` - License templates
- `POST /api/authors/tip` - Send tips to authors
- `POST /api/admin/rebuild-index` - Rebuild search index (admin only)

## Environment Setup

The backend uses the same environment variables as the frontend:

```bash
# Copy environment file
cp .env.testnet .env.local

# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

This backend is designed to be deployed on Vercel:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Architecture

- **Runtime**: Node.js with Next.js API routes
- **Storage**: Cloudflare R2 for content and metadata storage
- **Blockchain**: Story Protocol for IP management
- **Smart Contracts**: HybridRevenueControllerV2 for permissionless book registration
- **Database**: Currently using cloud storage as primary storage (can be extended with traditional DB)

## Development

```bash
# Start development server on port 3002
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

The backend API will be available at `http://localhost:3002/api/`