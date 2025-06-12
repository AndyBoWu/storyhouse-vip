# StoryHouse.vip Backend API

This is the backend API for StoryHouse.vip, providing all server-side functionality for the Web3 storytelling platform.

## Features

- **Story Management**: Create, read, update stories with cloud storage
- **AI Generation**: GPT-4 powered story generation with metadata
- **IP Registration**: Story Protocol integration for IP asset management
- **Collections**: Story collection management and collaboration
- **Cloud Storage**: Content storage integration
- **Security**: Anti-scraping and bot protection

## API Endpoints

### Stories
- `GET /api/stories` - List all published stories
- `POST /api/upload` - Upload story content to cloud storage
- `GET|PUT|DELETE /api/chapters/[storyId]/[chapterNumber]` - Chapter operations

### AI Generation
- `POST /api/generate` - Generate story content with AI

### IP Management
- `POST /api/ip/register` - Register stories as IP assets
- `GET|POST|PUT /api/ip/license` - License management

### Collections
- `GET|POST|PUT /api/collections` - Collection management

### Security
- `GET|POST /api/security` - Security and anti-scraping checks

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
- **Storage**: Cloud storage for content delivery
- **AI**: OpenAI GPT-4 for story generation
- **Blockchain**: Story Protocol for IP management
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