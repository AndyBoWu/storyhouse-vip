# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryHouse.vip is a revolutionary Web3 storytelling platform built on Story Protocol that enables:
- Chapter-level IP asset management ($50-500 vs $1000+ for full books)
- Read-to-earn mechanics where readers earn $TIP tokens while reading
- AI-powered story generation and remix creation
- Automated licensing and royalty distribution
- **Enhanced metadata system** with 25+ tracked fields per chapter
- **Complete user attribution** with wallet integration
- **Advanced caching** and performance optimization

Tech Stack: Next.js 15.3.3, TypeScript, Story Protocol SDK, OpenAI GPT-4, Cloudflare R2, Smart Contracts (Solidity)

**Current Status: Phase 5.3 Complete** - Full SPA optimization with story routing and UI polish

## Common Development Commands

```bash
# Development
npm run dev                      # Start frontend dev server on port 3001 (uses .env.testnet)
npm run dev:testnet             # Explicitly use testnet config on port 3001
npm run dev:mainnet             # Use mainnet config on port 3001

# Build & Deployment (Cloudflare Pages)
npm run build                   # Build SPA for Cloudflare Pages (static export)
npm run deploy:cloudflare       # Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name storyhouse-vip # Manual deploy

# Testing
npm run test                    # Run smart contract tests (Forge)
npm run lint                    # Lint frontend code
npm run type-check              # TypeScript type checking

# Smart Contracts
npm run deploy:spg              # Deploy Story Protocol contracts

# Clean Install
npm run install:clean           # Clean all node_modules and reinstall

# Domain Management
npx wrangler pages domain add <domain> --project-name storyhouse-vip # Add custom domain
npx vercel domains add <api-domain> # Add API domain to Vercel
```

## Architecture Overview

The project uses a hybrid Cloudflare + Vercel architecture:

**Frontend (Cloudflare Pages):**
- `apps/frontend/` - Next.js SPA with static export
  - `app/` - Static-exported pages (no API routes)
  - `components/` - React components (creator/, publishing/, ui/)
  - `hooks/` - Custom hooks for Story Protocol and Web3
  - `lib/` - API client + utilities
  - `out/` - Static build output → deployed to Cloudflare

**Backend (Vercel):**
- API routes moved to dedicated backend deployment
- Story Protocol SDK and blockchain operations
- AI integration and R2 storage operations

- `packages/contracts/` - Smart contracts (6 deployed on testnet)
  - TIP Token, Rewards Manager, Access Control, etc.
  - Test coverage: 131/132 tests passing

- `packages/shared/` - Shared TypeScript utilities and types

## Key Integration Points

### Story Protocol Integration
The platform registers individual chapters as IP assets on Story Protocol. Key files:
- `lib/storyProtocol.ts` - Core SDK integration
- `hooks/useStoryProtocol.ts` - React hook for blockchain interactions
- `lib/contracts/storyProtocol.ts` - Contract interactions

### AI Story Generation
GPT-4 powered story generation with automatic R2 storage:
- `lib/ai/openai.ts` - OpenAI integration
- `app/api/generate/route.ts` - Story generation endpoint

### Storage System
Cloudflare R2 for global CDN and content storage:
- `lib/r2.ts` - R2 client configuration
- `app/api/stories/route.ts` - Fetch published stories from R2
- Stories are automatically saved to R2 when published

### Smart Contract Addresses (Testnet)
All contracts are deployed on Story Protocol Aeneid testnet (Chain ID: 1315):
- TIP Token: `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`
- Rewards Manager: `0xf5ae031ba92295c2ae86a99e88f09989339707e5`
- SPG NFT Contract: `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d`

## Environment Configuration

The project uses multiple `.env` files:
- `.env.testnet` - Testnet configuration (default for development)
- `.env.mainnet` - Mainnet configuration
- `.env.local` - Local overrides (gitignored)

Key environment variables:
- `R2_*` - Cloudflare R2 credentials
- `STORY_*` - Story Protocol configuration
- `OPENAI_API_KEY` - For AI features
- `NEXT_PUBLIC_ENABLE_TESTNET` - Enable blockchain transactions

Note: Private keys and WalletConnect are no longer needed. All blockchain operations use direct MetaMask integration.

## Claude Code Permissions

Claude has comprehensive permissions to work effectively on this project:

### ✅ Allowed Operations
- **Full file operations**: Read, write, create, delete (except protected files)
- **All development commands**: npm, yarn, git, build, deploy, test
- **Smart contract operations**: Deploy, test, interact with contracts
- **AI integrations**: OpenAI API calls, story generation
- **Blockchain operations**: Story Protocol SDK, Web3 interactions
- **Cloudflare operations**: R2 storage, Pages deployment

### 🔒 Protected Files
- Environment files (`.env*`) - read-only
- Private keys and certificates
- `package-lock.json` - warns before changes
- `.gitignore` - read-only

### ⚠️ Safety Rules
- Always check git status before major changes
- Require tests to pass before contract deployment
- Confirm destructive operations
- Warn before mainnet operations

### 📝 Git Commit Rules
- **NEVER include Co-Authored-By lines** - The repository owner is the sole author
- **NEVER add Claude attribution** in commit messages
- Use standard commit message format without AI attribution
- Keep commit messages professional and technical only

## Important Notes from Cursor Rules

1. Avoid code duplication - check existing implementations first
2. Keep files under 200-300 lines - refactor when needed
3. Never mock data for dev/prod - only for tests
4. Don't overwrite .env files without confirmation
5. Prefer simple solutions over complex patterns
6. Consider dev/test/prod environments when coding

## Current Development Status (Phase 5.3 Complete)

**🌐 Live Deployment:**
- Frontend: https://testnet.storyhouse.vip/ (Cloudflare Pages)
- Backend: https://api-testnet.storyhouse.vip/ (Vercel API)

**🚀 Cloudflare Migration Success:**
- **70% cost reduction** - $60-100/month → $15-25/month
- **50% faster loading** - Global CDN with 330+ edge locations
- **Hybrid architecture** - Static frontend + API backend
- **Professional domain structure** - Separate API endpoints

**✅ Core Features Operational:**
- All smart contracts deployed and operational
- **Enhanced metadata system** with comprehensive chapter tracking
- **User attribution system** with complete author tracking
- **Advanced R2 caching** with manual refresh capabilities
- R2 integration complete for story storage with rich metadata
- AI story generation working with GPT-4 and full provenance tracking
- Read-to-earn mechanics implemented with economic flow tracking
- Chapter-level IP registration functional with licensing metadata
- **SPA optimization** - Next.js static export for maximum performance
- **Hash-based routing** - Complete story navigation system for static deployment
- **UI polish** - Streamlined wallet address display and user experience
- **R2 cleanup utilities** - Automated bucket management tools

## Enhanced Metadata System

Every chapter now includes 25+ metadata fields:
- **Read-to-Earn Economics**: unlock price, read reward, total reads, revenue
- **IP & Licensing**: license price, royalty percentage, remix status
- **Content Classification**: genre, mood, content rating, tags
- **AI Generation**: quality scores, originality scores, provenance
- **User Attribution**: author address, author name, timestamps
- **Engagement**: ratings, word count, reading time, remix count