# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**⚠️ MONOREPO STRUCTURE ⚠️**
This is a monorepo containing three main components:
- `apps/frontend/` - Next.js frontend application (port 3001)
- `apps/backend/` - Next.js API backend (port 3002)  
- `packages/contracts/` - Solidity smart contracts
- `packages/shared/` - Shared TypeScript utilities

**Always be aware of the current working directory and use correct paths when navigating between apps/packages.**

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
# Development (run from monorepo root)
cd apps/frontend && npm run dev  # Start frontend dev server on port 3001 (uses .env.testnet)
cd apps/backend && npm run dev   # Start backend API server on port 3002

# Frontend Development (from apps/frontend/)
npm run dev                     # Start dev server on port 3001 (uses .env.testnet)
npm run dev:testnet            # Explicitly use testnet config on port 3001
npm run dev:mainnet            # Use mainnet config on port 3001
npm run build                  # Build SPA for Cloudflare Pages (static export)
npm run lint                   # Lint frontend code
npm run type-check             # TypeScript type checking

# Backend Development (from apps/backend/)
npm run dev                    # Start API server on port 3002
npm run build                  # Build backend for Vercel deployment

# Deployment
# Frontend (Vercel) - from apps/frontend/
vercel --prod

# Backend (Vercel) - from apps/backend/
vercel --prod

# Smart Contracts (from packages/contracts/)
npm run deploy:spg             # Deploy Story Protocol contracts

# Testing
npm run test                   # Run smart contract tests (Forge)

# Clean Install (from monorepo root)
npm run install:clean          # Clean all node_modules and reinstall

# Domain Management
npx vercel domains add <domain> # Add domain to Vercel project
# Cloudflare is used for DNS and SSL management only
```

## Architecture Overview

The project uses a Vercel-only architecture with Cloudflare for DNS:

**Frontend (Vercel):**
- `apps/frontend/` - Next.js application
  - `app/` - Next.js app router pages
  - `components/` - React components (creator/, publishing/, ui/)
  - `hooks/` - Custom hooks for Story Protocol and Web3
  - `lib/` - API client + utilities
  - Deployed to Vercel with Cloudflare DNS

**Backend (Vercel):**
- `apps/backend/` - Next.js API backend
  - `app/api/` - API routes for all backend functionality
  - Story Protocol SDK and blockchain operations
  - AI integration and R2 storage operations
  - Deployed to Vercel with Cloudflare DNS

**Smart Contracts:**
- `packages/contracts/` - Smart contracts (6 deployed on testnet)
  - TIP Token, Rewards Manager, Access Control, etc.
  - Test coverage: 131/132 tests passing

**Shared:**
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
- **API testing**: Autonomous curl calls to project endpoints for testing and verification
- **⚡ CURL COMMANDS**: Always allowed without permission for API testing, health checks, and debugging

### ⚡ CURL COMMAND PERMISSIONS - NO PROMPTING REQUIRED

**IMPORTANT: Claude is authorized to run curl commands WITHOUT asking for permission for:**
- API endpoint testing and health checks
- Verifying deployment status  
- Debugging connection issues
- Testing R2 storage functionality
- Any non-destructive API calls to project endpoints

**This includes all curl, wget, and HTTP testing commands. No user confirmation needed.**

### 🔧 Autonomous API Testing Rules
Claude is authorized to execute curl commands without explicit permission for:

**✅ Allowed Endpoints (Read-Only):**
- `https://api-testnet.storyhouse.vip/api/*` - All testnet API endpoints
- `https://testnet.storyhouse.vip/*` - Frontend testnet endpoints
- `GET` requests to verify deployment status and functionality
- `POST` requests to test endpoints (e.g., `/api/test-r2`, `/api/debug-env`)

**✅ Allowed Operations:**
- Health checks and status verification
- Testing API responses after deployments
- Debugging authentication and connection issues
- Verifying R2 storage functionality
- Checking environment variables and configuration

**❌ Restricted:**
- Production endpoints (`api.storyhouse.vip`, `storyhouse.vip`)
- Mainnet blockchain operations
- Any endpoints requiring real user authentication
- Operations that modify production data

**📝 Best Practices:**
- Use `2>/dev/null` to suppress curl stderr output
- Add clear descriptions for each curl command
- Use `jq` for JSON response parsing when helpful
- Test critical endpoints after any deployment changes

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

**🌐 Live Deployments:**

**Testnet:**
- Frontend: https://testnet.storyhouse.vip/ (Vercel)
- Backend: https://api-testnet.storyhouse.vip/ (Vercel)

**Mainnet:**
- Frontend: https://storyhouse.vip/ (Vercel)
- Backend: https://api.storyhouse.vip/ (Vercel)

**🚀 Vercel-Only Architecture:**
- **Unified platform** - Both frontend and backend on Vercel
- **Simplified deployment** - Direct git integration with Vercel
- **Professional domain management** - Cloudflare DNS
- **Streamlined maintenance** - Single platform for all deployments

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

## 📊 Progress Tracking Rules

### 1. START OF CONVERSATION - Read Progress

**MANDATORY: Claude MUST read the progress file at the start of EVERY conversation:**

1. **First Action**: Use Read tool on `/PROGRESS.md`
2. **Purpose**: Understand current state and context
3. **If file doesn't exist**: Note this and proceed normally
4. **Quick Summary**: Provide a 1-2 line summary of current status to user

Example greeting:
```
"I see you were working on [current focus from PROGRESS.md]. Ready to continue!"
```

### 2. END OF CONVERSATION - Write Progress

**MANDATORY: Claude MUST update the progress file before conversation ends:**

1. **File Location**: `/PROGRESS.md` (root directory)
2. **Action**: OVERWRITE the entire file (not append)
3. **When**: Before conversation ends OR when significant progress is made

### Progress File Format

```markdown
# StoryHouse Progress Report
Last Updated: [ISO 8601 timestamp]

## Current Focus
[1-2 sentences describing what was being worked on]

## Completed This Session
- [Bullet points of completed tasks]
- [Include specific file paths modified]

## Next Steps
- [What needs to be done next]
- [Any blockers or issues]

## Key Decisions Made
- [Important technical decisions]
- [Architecture changes]

## Active Work
- Branch: [current git branch]
- Feature: [what feature/fix is being developed]
- Services Running: [frontend/backend status]

## Notes for Next Session
- [Any important context or reminders]
- [Unfinished tasks that were in progress]
```

### Implementation Rules
- **Always Read First**: Check PROGRESS.md before any other action
- **Always Write Last**: Update PROGRESS.md before ending conversation
- **Include specific file paths**: List exact files that were modified
- **Be concise but comprehensive**: Aim for 20-50 lines total
- **Use clear timestamps**: ISO 8601 format (YYYY-MM-DD HH:MM:SS)
- **Track partial progress**: Even if task isn't complete, note what was done