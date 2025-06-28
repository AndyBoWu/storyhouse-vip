# StoryHouse.vip Product Specification

**Version 1.0** - Production-Ready Implementation
**Last Updated**: December 19, 2024

## Table of Contents

1. [Architecture](#architecture)
2. [Core Features](#core-features)
3. [Development Phases](#development-phases)
4. [Technical Roadmap](#technical-roadmap)
5. [Data Models](#data-models)
6. [User Flows](#user-flows)

---

## 1. Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Port 3001)                  │
│         Next.js 15.3.3 | React 19 | TypeScript         │
│                     Tailwind CSS                        │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                    Backend API (Port 3002)               │
│              Next.js API Routes | TypeScript            │
│          AI Services (Fraud Detection, Translation)     │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                 Blockchain Layer                         │
│                                                         │
│  Custom Contracts (2)          Story Protocol SDK      │
│  ├─ TIP Token                  ├─ IP Registration      │
│  └─ HybridRevenueV2            ├─ NFT Minting         │
│                                ├─ Licensing            │
│                                ├─ Derivatives          │
│                                └─ Disputes             │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                    Infrastructure                        │
│      Cloudflare R2 | OpenAI API | Blockchain RPC       │
└─────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
storyhouse-vip/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # Next.js API backend
├── packages/
│   ├── contracts/         # Solidity smart contracts
│   └── shared/           # Shared TypeScript utilities
└── docs/                 # Documentation
```

### Key Design Principles

1. **Frontend-First Architecture**: Direct blockchain interactions from the browser
2. **Minimal Smart Contracts**: Only 2 custom contracts, leverage Story Protocol SDK for everything else
3. **Author Ownership**: Creators retain 100% IP ownership of their content
4. **Fair IP Model**: One book = One IP. First author owns the book IP forever
   - Original books: Single IP asset for entire work
   - Derivative books: No book-level IP, only individual chapter IPs
   - Inherited chapters maintain original author's IP ownership
5. **Atomic Operations**: Single-transaction IP registration for 40% gas savings
6. **90% Creator Revenue**: Authors keep 90% of all sales (only 10% platform fee vs Amazon KDP 35-70%)
7. **Hybrid Approach**: Story Protocol for IP/licensing, custom contracts for TIP payments

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 15.3.3 |
| Backend | Next.js API | 15.3.3 |
| Smart Contracts | Solidity/Foundry | Latest |
| Blockchain | Story Protocol | SDK v1.3.2 |
| AI | OpenAI GPT-4 | Latest |
| Storage | Cloudflare R2 | - |
| Hosting | Vercel | - |

### Smart Contract Architecture (2-Contract System)

1. **TIP Token (`0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`)** ✅ Already Deployed
   - ERC-20 token with minting controls
   - 10B max supply cap
   - Platform's native currency

2. **HybridRevenueControllerV2** (To Deploy)
   - Permissionless book registration
   - Revenue distribution (70/20/10 split)
   - Chapter monetization (0.5 TIP/chapter)
   - Translation support via curator mechanism
   - Chapter-level attribution tracking

### Why Only 2 Contracts?

Story Protocol SDK handles everything else:
- **IP Registration**: `ipAsset.mintAndRegisterIpAssetWithPilTerms()`
- **NFT Minting**: SPG NFT contract at `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d`
- **Licensing**: `license.attachTerms()` and `license.mintLicenseTokens()`
- **Derivatives**: `ipAsset.registerDerivative()`
- **Disputes**: `dispute.initiateDispute()`
- **Collections**: `group.createGroup()`
- **Batch Operations**: `sdk.batch()` for 70% gas savings

We only need custom contracts for:
- **TIP Token**: Story Protocol doesn't support custom payment tokens
- **Revenue Distribution**: Handle complex splits between authors, curators, and platform

---

## 2. Core Features

### For Readers

#### Chapter Access System
- **Free Access**: First 3 chapters of every story
- **Chapter Unlocking**: 0.5 TIP per premium chapter (4+)
- **Revenue Model**: Pay-to-read for premium content
- **Creator Revenue**: 90% of chapter payments go to creators (70% author + 20% curator)

#### Content Discovery
- AI-powered recommendations based on reading history
- Genre and tag-based filtering
- Trending stories algorithm
- Featured author collections
- Personalized reading lists

#### Social Features
- Follow favorite authors
- Rate and review chapters
- Share reading progress
- Community discussions
- Reading achievements/badges

### For Creators

#### AI-Enhanced Platform Services
- **Content Fraud Detection**: AI-powered plagiarism and originality verification
- **Translation Services**: Multi-language translation for global reach
- **Text-to-Audio**: AI voice narration for accessibility
- **Content Recommendations**: Personalized discovery based on reading history
- **Quality Analysis**: Content quality scoring and improvement suggestions
- **Content Moderation**: Automated safety and appropriateness checks

#### Multiple Earning Models
- **Pay-per-chapter**: Instant monetization from chapter 1 (0.5 TIP/chapter)
- **Subscription tiers**: Reading, commercial, or exclusive licenses
- **Translation rights**: Earn from 10+ language versions of your content
- **Audiobook licensing**: Text-to-speech and professional narration rights
  - Powered by Poseidon Project storage solution for high-quality audiobook distribution
  - Direct partnerships with Spotify Audiobooks, Apple Podcasts, and major streaming platforms
- **Derivative works**: License remixes, adaptations, and parallel universe stories
- **Format multiplication**: Each format (text, audio, translation) = separate revenue stream
- **90% Creator Revenue**: Authors keep 90% of all sales (only 10% platform fee)
- **Real-time Payouts**: Instant settlement on blockchain

#### IP Management System
- **Chapter-Level Registration**: Each chapter is a separate IP asset
- **Unified Registration**: Single transaction for NFT + IP + License terms
- **Metadata System**: 25+ fields per chapter for attribution
- **License Management**: Automated PIL (Programmable IP License) terms
- **Derivative Tracking**: Full family tree of remixes and translations

### For Developers

#### Open API System
- RESTful endpoints for all platform features
- WebSocket support for real-time updates
- Comprehensive API documentation
- Rate limiting and authentication
- SDK for easy integration

#### Blockchain Integration
- Direct Story Protocol SDK access
- Event-driven architecture
- Gas optimization helpers
- Transaction builders
- Smart contract interfaces

### Platform Features

#### Unified IP Registration (40% Gas Savings)
- Single-transaction registration using `mintAndRegisterIpAssetWithPilTerms`
- Atomic operations (all-or-nothing)
- Automatic metadata generation with SHA-256 verification
- Client-side execution with user's wallet
- No backend dependencies for registration

#### Enhanced Metadata System (25+ Fields)
- Core information (title, content, summary)
- Complete attribution (author wallet, name, bio)
- Timestamps (created, published, modified)
- Story context (chapter number, total chapters)
- IP & Licensing data (IP ID, license terms, fees)
- Content classification (genre, tags, rating)
- Analytics (views, purchases, ratings)
- Discovery metadata (keywords, themes, characters)
- Technical data (hashes, transaction info)
- AI generation info (if applicable)

#### Security & Anti-Fraud
- Anti-bot reading protection with human verification
- Removed automatic creation rewards to prevent AI farming
- Transaction verification for all payments
- Server-side access control enforcement
- Rate limiting on sensitive operations

---

## 3. Development Phases

### Phase 1.0: Foundation ✅ Complete
- Basic smart contract deployment
- Story creation and reading functionality
- Initial UI/UX implementation
- Basic wallet integration

### Phase 2.0: AI Integration ✅ Complete
- AI fraud detection system
- Multi-language translation
- Text-to-audio narration
- Recommendation engine

### Phase 3.0: Tokenomics ✅ Complete
- TIP token implementation
- Creator reward system
- Anti-farming protections

### Phase 4.0: IP Management ✅ Complete
- Story Protocol integration
- Chapter-level ownership
- PIL licensing system
- Metadata standards

### Phase 5.0: Architecture Upgrade ✅ Complete
- 5-contract system deployment
- Enhanced metadata (25+ fields)
- Performance optimization
- Gas cost reduction

### Phase 5.1-5.4: Polish & Optimization ✅ Complete
- UI/UX improvements
- SPA architecture implementation
- Unified IP registration (40% gas savings)
- Legacy workflow removal

### Phase 6.0: Enterprise Features ✅ Complete
- Smart contract consolidation (9→2 contracts)
- Full-stack migration
- Chapter monetization system
- Multi-author revenue sharing
- Production deployment readiness

### Phase 6.1: QA & Refinements 🚧 In Progress
- Comprehensive testing suite
- Version tracking system
- UX flow optimization
- Bug fixes and performance tuning

### Phase 6.2: Book System Enhancement ✅ Complete
- Clean URL structure (/book/authorAddress/slug)
- Multi-book per author support
- Improved book identification system
- R2 storage optimization

### Phase 6.3: Unified Registration Only ✅ Complete
- Removed legacy multi-transaction workflow
- Single registration method for all users
- 40% gas savings guaranteed
- Cleaner codebase

### Phase 6.4: Permissionless Publishing 🚧 Ready to Deploy
- HybridRevenueControllerV2 implementation
- No admin keys required
- Authors self-register books
- Fully decentralized platform

---

## 4. Technical Roadmap

### Q3 2025: Mainnet Launch
- [ ] Security audit completion
- [ ] Mainnet smart contract deployment
- [ ] TIP token public launch
- [ ] Marketing campaign kickoff
- [ ] Creator onboarding program

### Q4 2025: Mobile & Ecosystem
- [ ] Native iOS application
  - Full reading experience
  - Offline support
  - Push notifications
  - Face ID wallet integration
- [ ] Native Android application
  - Material Design UI
  - Background downloads
  - Google Pay integration
  - Widget support
- [ ] Partner integrations
- [ ] Translation system
- [ ] AI voice narration

### 2026: Global Scale
- [ ] Multi-language support (10+ languages)
- [ ] Regional content hubs
- [ ] Enterprise API solutions
- [ ] Educational programs
- [ ] Creator accelerator

### 2026+: Platform Evolution
- [ ] Video/audio content support
- [ ] Cross-media storytelling
- [ ] Advanced creator tools
- [ ] Open-source core components
- [ ] Industry standard development

### Feature Pipeline

#### Short Term (1-3 months)
- Atomic license purchase contract
- Advanced search functionality
- Creator analytics dashboard
- Bulk chapter operations
- Social sharing features

#### Medium Term (3-6 months)
- Collaborative writing tools
- Series/collection management
- Advanced recommendation engine
- Creator verification system
- Subscription models

#### Long Term (6-12 months)
- DAO governance implementation
- Cross-chain compatibility
- NFT marketplace integration
- Advanced royalty models
- Enterprise features

---

## 5. Data Models

### Core Entities

#### User
```typescript
interface User {
  address: string;           // Wallet address (primary key)
  username?: string;         // Optional display name
  bio?: string;             // User biography
  avatarUrl?: string;       // Profile picture
  createdAt: Date;          // Registration date
  role: 'reader' | 'creator' | 'both';
  stats: {
    storiesCreated: number;
    chaptersPublished: number;
    totalReads: number;
    tipEarned: number;
    currentStreak: number;
  };
}
```

#### Story/Book
```typescript
interface Story {
  id: string;               // Unique identifier
  authorAddress: string;    // Creator wallet address
  title: string;
  description: string;
  coverImageUrl: string;
  genre: string;
  tags: string[];
  language: string;
  contentRating: 'G' | 'PG' | 'PG-13' | 'R';
  createdAt: Date;
  publishedAt: Date;
  lastUpdated: Date;
  stats: {
    chapterCount: number;
    totalReads: number;
    totalRevenue: number;
    averageRating: number;
  };
  status: 'draft' | 'published' | 'completed';
  isAiGenerated: boolean;
}
```

#### Chapter
```typescript
interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  summary: string;
  
  // IP & Licensing
  ipId: string;
  nftTokenId: string;
  licenseTermsId: string;
  licenseType: 'free' | 'reading' | 'premium' | 'exclusive';
  mintingFee: string;       // In TIP tokens
  
  // Metadata
  wordCount: number;
  readingTime: number;      // In minutes
  createdAt: Date;
  publishedAt: Date;
  
  // Blockchain
  transactionHash: string;
  blockNumber: number;
  metadataUri: string;
  metadataHash: string;
  
  // Analytics
  viewCount: number;
  purchaseCount: number;
  remixCount: number;
  rating: number;
}
```

#### License
```typescript
interface License {
  id: string;
  ipId: string;
  licenseId: string;
  holderAddress: string;
  type: 'reading' | 'premium' | 'exclusive';
  mintedAt: Date;
  transactionHash: string;
  expiresAt?: Date;
  commercialUse: boolean;
  derivativesAllowed: boolean;
  royaltyPercentage: number;
}
```

#### Transaction
```typescript
interface Transaction {
  id: string;
  type: 'chapter_unlock' | 'license_mint' | 'reward_claim';
  fromAddress: string;
  toAddress: string;
  amount: string;           // In TIP tokens
  chapterId?: string;
  licenseId?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}
```

### Blockchain State

#### On-Chain Data
- IP registrations (Story Protocol)
- License terms and ownership
- TIP token balances and transfers
- Chapter access records
- Revenue distribution

#### Off-Chain Data (R2 Storage)
- Chapter content
- Story metadata
- User profiles
- Analytics data
- AI generation parameters

---

## 6. User Flows

### Reader Journey

#### 1. Discovery Flow
```
Landing Page → Browse Stories → Filter by Genre/Tags → View Story Details
→ Read Free Chapters (1-3) → Decision Point
```

#### 2. Chapter Unlock Flow
```
Premium Chapter → "Get Reading License" → 
→ Check TIP Balance → Approve Transaction (0.5 TIP) →
→ Payment Processed → License NFT Minted →
→ Chapter Unlocked → Continue Reading
```


### Creator Journey

#### 1. Story Creation Flow
```
Dashboard → "Create New Story" → Enter Details →
→ Write/Import Content → AI Quality Check →
→ Fraud Detection Analysis → Preview →
→ Set License Terms → Publish
```

#### 2. Chapter Publishing Flow
```
Story Dashboard → "Add Chapter" → Write Content →
→ Review → Choose License Tier → 
→ Single Transaction (NFT + IP + License) →
→ Published with IP Registration
```

#### 3. Monetization Flow
```
Reader Purchases → TIP Transfer → 
→ Creator Dashboard Updates → View Analytics →
→ Track Derivatives → Monitor Royalties
```

### Advanced Flows

#### 1. Derivative Creation
```
Find Parent Content → "Create Derivative" →
→ Check License Compatibility → Write/Generate →
→ Register with Parent Link → Automatic Royalty Setup
```

#### 2. Collaborative Writing
```
Create Book → Register in HybridRevenueController →
→ Set Revenue Splits (70/20/10) → Invite Collaborators →
→ Multi-Author Publishing → Automatic Revenue Distribution
```

#### 3. License Upgrade
```
Own Reading License → View Premium Features →
→ "Upgrade License" → Pay Difference →
→ New License NFT → Access Commercial Rights
```

### Error Handling Flows

#### 1. Insufficient Balance
```
Attempt Purchase → Balance Check Fails →
→ "Insufficient TIP" Modal → Options:
  - Buy TIP on DEX
  - View Rewards History
```

#### 2. Transaction Failure
```
Submit Transaction → Network Error →
→ Retry with Higher Gas → Still Fails →
→ Save Draft State → Support Ticket
```

#### 3. Access Denied
```
Try to Read Premium Chapter → No License →
→ Show Preview + Metadata → Unlock Options →
→ Clear Pricing Display → Purchase Flow
```

### Mobile-Specific Flows (Future)

#### 1. Offline Reading
```
Download Chapters → Store Encrypted →
→ Read Offline → Sync Progress →
→ Claim Rewards When Online
```

#### 2. Biometric Wallet
```
Face ID Setup → Secure Key Storage →
→ Quick Transaction Approval → No Password Needed
```

---

## Summary

StoryHouse.vip is a production-ready Web3 storytelling platform that revolutionizes content creation and monetization through:

1. **Technical Innovation**: 40% gas savings, unified IP registration, enhanced metadata
2. **Minimal Architecture**: Only 2 custom contracts, leveraging Story Protocol SDK for everything else
3. **Creator Empowerment**: 100% revenue, instant monetization, IP ownership
4. **Sustainable Economics**: Pay-to-read model, removed exploitable rewards
5. **Future-Ready**: Mobile apps, multi-language, cross-chain compatibility

The platform is currently in Phase 6.4 with all core features implemented and ready for mainnet deployment.