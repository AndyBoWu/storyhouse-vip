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
- Automated licensing and royalty distribution
- **Enhanced metadata system** with 25+ tracked fields per chapter
- **Complete user attribution** with wallet integration
- **Advanced caching** and performance optimization
- **AI-powered features**: content fraud detection, translation, text-to-audio, and content recommendations

Tech Stack: Next.js 15.3.3, TypeScript, Story Protocol SDK, OpenAI GPT-4, Smart Contracts (Solidity)

**Current Status: Phase 6.3 Complete** - Legacy workflow removed, unified registration only

## Development Practices

### Documentation Dates
- **ALWAYS use the actual current date** in all documentation
- **DO NOT use placeholder dates** like "June 2025" or "January 2025"
- **Update dates to actual date** when modifying documentation
- **Format**: Use ISO format (YYYY-MM-DD) or Month DD, YYYY
- **IMPORTANT**: The current date is available in the environment context. Always check `Today's date:` in the env block
- **When in doubt**: Use the date from the environment context, not from memory or previous documents

### Git Commits
- **DO NOT include Claude as a co-author** in commit messages
- **DO NOT add "Generated with Claude Code" or similar attributions** to commits
- Keep commit messages clean and professional without AI/Claude references

### GitHub Actions Workflow Naming
- **Always use emoji prefixes** for workflow names to enable quick visual identification
- **Include trigger context in parentheses** after the main action
- **Follow this naming pattern**: `[Emoji] [Action] ([Trigger/Context])`
- **Standard emoji categories**:
  - 🚀 = Deployment workflows
  - 🧪 = Testing workflows
  - 🔍 = Code quality/linting workflows
  - 🛡️ = Security scanning workflows
  - 📦 = Build/release workflows
  - 🔧 = Maintenance/utility workflows
- **Examples**:
  - `🚀 Deploy to Vercel (Manual/PR)`
  - `🚀 Deploy to Production (Auto on Main)`
  - `🧪 Test Suite (All Tests)`
  - `🔍 Code Quality (Lint, Type Check)`

## Recent Implementation Work

### 🚀 Unified IP Registration ONLY (Phase 6.3 - LEGACY REMOVED)

**Status: Fully Implemented, Legacy Workflow Removed**

#### Overview
All IP registration now exclusively uses Story Protocol's `mintAndRegisterIpAssetWithPilTerms` method. The legacy multi-transaction workflow has been completely removed, ensuring 40% gas savings for all users.

#### Key Files (Current State)
- `apps/backend/lib/services/unifiedIpService.ts` - Core service for unified registration
- `apps/backend/app/api/ip/register-unified/route.ts` - ONLY IP registration endpoint
- `apps/frontend/hooks/useUnifiedPublishStory.ts` - Single publishing hook (no legacy)
- `apps/frontend/components/publishing/PublishingModal.tsx` - Simplified UI without legacy steps
- `apps/frontend/lib/api-client.ts` - Unified registration methods only

#### Removed Files (Legacy Cleanup)
- ~~`apps/frontend/hooks/usePublishStory.ts`~~ - **DELETED** (legacy hook)
- ~~`apps/backend/app/api/ip/register/`~~ - **DELETED** (legacy endpoint)
- ~~`apps/backend/app/api/ip/license/`~~ - **DELETED** (legacy license endpoints)

#### Feature Configuration
```bash
# Unified registration is now mandatory
UNIFIED_REGISTRATION_ENABLED=true  # Always enabled, legacy removed
```

#### API Endpoints
- `POST /api/ip/register-unified` - Single-transaction registration
- `GET /api/ip/register-unified` - Service capability detection

#### Benefits
- 40% gas cost reduction (guaranteed for all chapters)
- 66% faster execution time  
- Atomic operations (all-or-nothing)
- Automatic R2 metadata generation with SHA-256 verification
- Cleaner codebase without legacy confusion
- Single clear path for all users

#### License Tiers Supported
- `free` - No commercial use, attribution required
- `reading` - Personal reading (0.5 TIP)
- `premium` - Commercial use (100 TIP, 10% royalty)
- `exclusive` - Full rights (1000 TIP, 25% royalty)

#### Implementation Notes
1. All new chapters automatically use unified registration
2. No feature flags needed - legacy is completely removed
3. Client-side execution with user's wallet (MetaMask)
4. Backend only handles metadata generation

### 🔥 Legacy Workflow Removal (December 2024)

**Status: Completed**

#### Overview
Completely removed the legacy multi-transaction publishing workflow to simplify the codebase and ensure all users benefit from gas savings.

#### Removed Components
- **Frontend**:
  - `usePublishStory.ts` - Legacy publishing hook
  - Multi-step UI components (minting-nft, registering-ip, creating-license, attaching-license)
  - Legacy API client methods
  
- **Backend**:
  - `/api/ip/register` - Legacy registration endpoint
  - `/api/ip/license/*` - All license management endpoints
  - Legacy service methods in `advancedStoryProtocolService.ts`

#### Results
- Eliminated ~1,500 lines of legacy code
- Single clear path for IP registration
- 40% gas savings guaranteed for all users
- No more confusion between unified and legacy flows
- Cleaner, more maintainable codebase

### 🔥 API Cleanup (December 2024)

**Status: Completed**

#### Overview
Removed unused and test API endpoints to improve security and reduce maintenance burden. Cleaned up ~10 endpoints that were either test/debug endpoints exposing sensitive data or unused features.

#### Removed Endpoints
- **Test/Debug Endpoints** (security risk):
  - `/api/test`, `/api/test-pil`, `/api/test-r2` - Test endpoints
  - `/api/debug-env`, `/api/debug-r2` - Debug endpoints exposing environment variables
  - `/api/books/[bookId]/debug-chapters` - Debug endpoint

- **Unused Feature Endpoints**:
  - `/api/security` - Unused security endpoint
  - `/api/collections` - Collections feature never implemented in UI
  - `/api/unlock-stats` - Statistics endpoint with no UI
  - `/api/stories` - Deprecated in favor of `/api/books`

#### Code Updates
- Updated `api-client.ts` to redirect `getStories()` to `/api/books`
- Removed unused methods: `getCollections()`, `createCollection()`, `checkSecurity()`
- All frontend functionality preserved using existing endpoints

#### Results
- Reduced API surface from 88 to ~78 endpoints
- Eliminated security risk from debug endpoints
- Removed 1,438 lines of unused code
- Improved maintainability

### 🚀 HybridRevenueControllerV2 - Permissionless Revenue Sharing (December 2024)

**Status: Ready for Deployment**

#### Overview
Replaced centralized HybridRevenueController (V1) with fully permissionless V2. Authors can now register their own books without admin approval, making the platform truly decentralized.

#### Key Changes
- **Removed HybridRevenueController V1** - No more STORY_MANAGER_ROLE requirement
- **Permissionless Registration** - Authors register books directly through MetaMask
- **Automatic Curator Assignment** - Registering address becomes the curator
- **Same Revenue Model** - 70% author, 20% curator, 10% platform
- **Frontend-Only Registration** - Backend just directs to frontend for registration

#### Deployment
```bash
cd packages/contracts
forge script script/Deploy.s.sol:Deploy --broadcast --rpc-url $STORY_RPC_URL
```

#### Updated Files
- `packages/contracts/src/HybridRevenueControllerV2.sol` - New permissionless contract
- `packages/contracts/script/Deploy.s.sol` - Updated to deploy only V2
- `apps/frontend/hooks/useBookRegistration.ts` - Frontend registration hook
- `apps/frontend/components/BookRegistrationModal.tsx` - Registration UI
- `apps/backend/app/api/books/register-hybrid/route.ts` - Redirects to frontend

#### Removed Files
- HybridRevenueController V1 contract and deployment
- Backend registration scripts (now frontend-only)
- V1 ABI files and references

#### Results
- Fully decentralized book registration
- No admin keys or special roles needed
- Authors have complete control over their books
- Simpler architecture with only one revenue controller

## Memories

- Remember that our mainnet is not integrated yet
- Unified registration uses Story Protocol SDK v1.3.2+ 
- All license terms are configured in `advancedStoryProtocolService.ts`
- R2 metadata storage includes SHA-256 verification for Story Protocol compliance
- API has been cleaned up - no test/debug endpoints in production
- Stories endpoint deprecated - use books endpoint instead
- Legacy multi-transaction workflow completely removed - only unified registration exists
- All publishing uses `mintAndRegisterIpAssetWithPilTerms` exclusively
- IP registration happens client-side with user's wallet
- **Royalty Policy Decision (December 2024)**: All tiers use zero address (0x0000...0000) for both royalty policy and currency
- **Revenue Distribution**: 100% handled by HybridRevenueControllerV2 (70% author, 20% curator, 10% platform)
- **Story Protocol Role**: IP registration and licensing only - no royalty involvement
- **Token Strategy**: TIP tokens exclusively - no WIP token dependencies
- **Chapter Access Control (December 2024)**: Server-side enforcement prevents unauthorized access
- **Two-Step License Purchase**: TIP payment first, then Story Protocol license mint (zero currency)
- **Transaction Verification**: All paid unlocks require blockchain transaction verification
- **HybridRevenueControllerV2 (December 2024)**: Permissionless book registration - authors manage their own books
- **No Admin Keys**: All book registration happens through frontend with user's wallet
- **Security**: Backend validates all access - frontend cannot bypass access control
- **Read-to-Earn Removed (December 2024)**: Feature removed to simplify platform focus
- **AI Story Generation Removed (December 2024)**: No longer generating or remixing stories with AI
- **AI Role Redefined (December 2024)**: AI now used for: content fraud detection, translation, text-to-audio, and content recommendations