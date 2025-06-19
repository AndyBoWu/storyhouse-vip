# StoryHouse V2 Architecture

## Overview

StoryHouse V2 is built as a Story Protocol native application, leveraging the protocol's parent-child IP system for multi-language publishing.

## Core Principles

1. **Story Protocol First**: All IP management, licensing, and royalties handled by Story Protocol
2. **Author Ownership**: Authors own all translations of their work
3. **Translation as Service**: Translators are service providers with revenue shares
4. **AI Quality Control**: All translations verified by AI before publication
5. **Minimal Backend**: Frontend-first architecture with minimal backend for AI services

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
│  - Story Protocol SDK integration                             │
│  - MetaMask wallet connection                                 │
│  - Direct blockchain interactions                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ├── Story Protocol
                              │   - IP Registration
                              │   - License Management
                              │   - Royalty Distribution
                              │
                              └── Backend API (Minimal)
                                  - AI Translation Verification
                                  - Fraud Detection
                                  - Metadata Storage (R2)

```

## Key Design Decisions

### 1. Chapter-Level IPs
- Each chapter is a separate IP asset
- Enables granular licensing and royalty tracking
- Supports partial book translations

### 2. Author-Owned Translation Model
- Authors retain ownership of all language versions
- Translators receive revenue share (75%) without IP ownership
- Simplifies rights management and licensing deals

### 3. Story Protocol Native Implementation
- No custom smart contracts
- Uses PIL (Programmable IP License) terms
- Automatic royalty distribution via Story Protocol

### 4. Multi-Level Royalty Cascades
- Translations pay 25% to original chapter
- Audio/video versions pay 20% to parent translation
- All handled automatically by Story Protocol

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Blockchain**: Story Protocol SDK, Viem, Wagmi
- **Backend**: Node.js, Express (minimal)
- **AI Services**: OpenAI GPT-4 for quality verification
- **Storage**: Cloudflare R2 for metadata
- **Database**: PostgreSQL (for caching and analytics only)

## Security Considerations

- All payment flows through Story Protocol
- No custom token handling
- Server-side validation for chapter access
- AI-powered plagiarism detection
- Content verification before IP registration