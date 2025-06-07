# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryHouse.vip is a revolutionary Web3 storytelling platform built on Story Protocol that enables:
- Chapter-level IP asset management ($50-500 vs $1000+ for full books)
- Read-to-earn mechanics where readers earn $TIP tokens while reading
- AI-powered story generation and remix creation
- Automated licensing and royalty distribution

Tech Stack: Next.js 15.3.3, TypeScript, Story Protocol SDK, OpenAI GPT-4, Cloudflare R2, Smart Contracts (Solidity)

## Common Development Commands

```bash
# Development
npm run dev                      # Start frontend dev server (uses .env.testnet)
npm run dev:testnet             # Explicitly use testnet config
npm run dev:mainnet             # Use mainnet config

# Build & Test
npm run build                   # Build all packages in order
npm run test                    # Run smart contract tests (Forge)
npm run lint                    # Lint frontend code
npm run type-check              # TypeScript type checking

# Smart Contracts
npm run deploy:spg              # Deploy Story Protocol contracts

# Clean Install
npm run install:clean           # Clean all node_modules and reinstall
```

## Architecture Overview

The project uses a monorepo structure with NPM workspaces:

- `apps/frontend/` - Next.js app with App Router
  - `app/api/` - Server-side API routes (collections, stories, upload, etc.)
  - `components/` - React components (creator/, publishing/, ui/)
  - `hooks/` - Custom hooks for Story Protocol and Web3
  - `lib/` - Core utilities (AI, contracts, storage, web3)

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

## Important Notes from Cursor Rules

1. Avoid code duplication - check existing implementations first
2. Keep files under 200-300 lines - refactor when needed
3. Never mock data for dev/prod - only for tests
4. Don't overwrite .env files without confirmation
5. Prefer simple solutions over complex patterns
6. Consider dev/test/prod environments when coding

## Current Development Status

- Live testnet deployment: https://testnet.storyhouse.vip/
- All smart contracts deployed and operational
- R2 integration complete for story storage
- AI story generation working with GPT-4
- Read-to-earn mechanics implemented
- Chapter-level IP registration functional