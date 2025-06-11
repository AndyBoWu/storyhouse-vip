# Technical Architecture

## System Overview

StoryHouse.vip is a Web3 publishing platform built on Story Protocol, enabling chapter-level IP asset management with PIL (Programmable IP License) licensing and comprehensive real-time royalty distribution.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │    │  Story Protocol │
│  (Vercel)       │◄──►│  (Vercel)       │◄──►│  Blockchain     │
│  Next.js + PIL  │    │  API + SDK      │    │  IP Assets      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tech Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Frontend | Next.js | 15.3.3 | React application with PIL UI |
| Backend | Next.js API | 15.3.3 | API routes with Story Protocol |
| Language | TypeScript | 5.8.3 | Full type safety |
| Blockchain | Story Protocol SDK | 1.3.2 | IP asset management |
| AI | OpenAI GPT-4 | Latest | Content generation |
| Storage | Cloudflare R2 | - | Global content delivery |
| Hosting | Vercel | - | Serverless deployment |

## Core Components

### Frontend (`apps/frontend/`)
- **Pages**: Next.js app router with static export
- **Components**: React components for PIL licensing UI
- **Hooks**: Web3 and Story Protocol integration
- **Types**: Shared TypeScript definitions

### Backend (`apps/backend/`)
- **API Routes**: Next.js API endpoints
- **Services**: Story Protocol SDK integration
- **Storage**: R2 content management
- **AI Integration**: OpenAI GPT-4 story generation

### Smart Contracts
**Network:** Story Protocol Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform token & royalty payments |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution & claiming |
| SPG NFT Contract | `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d` | IP asset NFTs |

## 🆕 **Royalty Distribution Architecture**

### Chapter-Level Royalty System
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Reader Actions │    │  Revenue Engine │    │  Distribution   │
│  • Read Chapter │───►│  • Track Usage  │───►│  • Calculate    │
│  • Buy License  │    │  • License Fees │    │  • TIP Tokens   │
│  • Tip Creator  │    │  • TIP Rewards  │    │  • Multi-tier   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Tier Revenue Sharing
- **Free Chapters**: 0% royalty (open access)
- **Premium Chapters**: 10% royalty (commercial use)
- **Exclusive Chapters**: 25% royalty (full rights)

### Real-Time Analytics Engine
```
Revenue Data ─→ Economic Modeling ─→ Optimization ─→ Recommendations
     ↓                  ↓                 ↓              ↓
  Tracking          ROI Analysis     Tier Analysis   Auto-suggest
  License Fees      Break-even       Performance     Upgrades
  TIP Earnings      Projections      Metrics         Actions
```

## PIL Licensing System

### Template Management
- **Standard License**: Free access, attribution required
- **Premium License**: Commercial use, 10% royalty
- **Exclusive License**: Full rights, 25% royalty

### API Endpoints
- `GET /api/licenses/templates` - Retrieve license templates
- `POST /api/ip/license/attach` - Attach license to IP asset
- `GET /api/test-pil` - SDK compatibility testing

### UI Components
- `LicenseSelector.tsx` - Interactive license selection
- `LicenseViewer.tsx` - License information display

## Data Flow

### Chapter Publishing
1. User creates content with AI assistance
2. Selects PIL license template via UI
3. Content stored in R2 with metadata
4. Chapter registered as IP asset on Story Protocol
5. License attached to IP asset via PIL

### Revenue Distribution
1. Reader purchases chapter access
2. TIP tokens distributed to creator
3. Royalties calculated based on license terms
4. Automatic distribution via smart contracts

## Security & Performance

### Security
- TypeScript for type safety
- Input validation on all API endpoints
- Secure wallet integration via Web3
- Content protection with access controls

### Performance
- Static site generation for frontend
- Cloudflare R2 global CDN
- Serverless API deployment
- Optimized component lazy loading

## Development Workflow

### Local Development
```bash
cd apps/frontend && npm run dev  # Port 3001
cd apps/backend && npm run dev   # Port 3002
```

### Deployment
- **Frontend**: Vercel with static export
- **Backend**: Vercel serverless functions
- **Database**: No traditional database - blockchain + R2 storage

## Monitoring & Analytics

### Testing
- Unit tests for core components
- Integration tests for API endpoints
- End-to-end testing for user workflows

### Performance Monitoring
- Vercel analytics for deployment metrics
- Story Protocol transaction monitoring
- R2 storage usage tracking

## Scalability Considerations

### Current Capacity
- Vercel serverless functions auto-scale
- R2 storage globally distributed
- Story Protocol handles blockchain scaling

### Future Enhancements
- Multi-chain support preparation
- Advanced caching strategies
- GraphQL API layer for complex queries