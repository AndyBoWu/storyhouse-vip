# Technical Architecture

## System Overview

StoryHouse.vip is a revolutionary Web3 publishing platform built on Story Protocol, enabling chapter-level IP asset management with PIL (Programmable IP License) licensing, blockchain derivative registration, AI-powered content analytics, and comprehensive real-time royalty distribution with automated notifications.

**🆕 Phase 5.3 Architecture Enhancements:**
- **Enhanced UI/UX Layer**: Zero commission messaging, color-coded chapter states, improved publishing flow
- **Optimized Frontend**: SPA optimization with enhanced routing and component performance  
- **Streamlined UX**: Simplified pricing input, better visual hierarchy, clearer user journeys
- **Production Deployments**: Latest Vercel deployments with performance optimizations

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │    │  Story Protocol │
│  (Vercel)       │◄──►│  (Vercel)       │◄──►│  Blockchain     │
│  Analytics UI   │    │  SDK v1.3.2     │    │  Derivatives    │
│  Notifications  │    │  AI Analysis    │    │  IP Network     │
│  Family Tree    │    │  Registration   │    │  Licensing      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Interface │    │  AI Services    │    │  Economic Flow  │
│  • Dashboard    │    │  • OpenAI GPT-4 │    │  • Revenue      │
│  • Notifications│    │  • Similarity   │    │  • Royalties    │
│  • Analytics    │    │  • Detection    │    │  • TIP Tokens   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tech Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Frontend | Next.js | 15.3.3 | React application with PIL UI |
| Backend | Next.js API | 15.3.3 | API routes with Story Protocol |
| Language | TypeScript | 5.8.3 | Full type safety |
| Blockchain | Story Protocol SDK | 1.3.2 | IP asset management |
| AI | OpenAI GPT-4 | Latest | Content generation & analysis |
| Analytics | React/D3 | Latest | Derivative tracking dashboard |
| Notifications | Real-time | - | AI-powered alerts & monitoring |
| Storage | Cloud Storage | - | Global content delivery |
| Hosting | Vercel | - | Serverless deployment |

## Core Components

### Frontend (`apps/frontend/`)
- **Pages**: Next.js app router with static export
- **Components**: React components for PIL licensing UI, analytics dashboard, notification center
- **Hooks**: Web3 and Story Protocol integration, derivative registration
- **Types**: Shared TypeScript definitions with derivative workflows
- **Analytics**: Comprehensive visualization suite with family tree UI
- **Notifications**: Real-time notification center with toast alerts

### Backend (`apps/backend/`)
- **API Routes**: Next.js API endpoints (15+ endpoints)
- **Services**: Story Protocol SDK v1.3.2 integration with derivative registration
- **Storage**: Cloud storage content management with enhanced metadata
- **AI Integration**: OpenAI GPT-4 story generation & content similarity analysis
- **Derivative Registration**: Complete blockchain registration service
- **Notification Engine**: Real-time alert system with background monitoring
- **Analytics Engine**: AI-powered content analysis and quality assessment

### Smart Contracts
**Network:** Story Protocol Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform token & royalty payments |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution & claiming |
| SPG NFT Contract | `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d` | IP asset NFTs |

## 🔗 **Story Protocol SDK Derivative Registration Architecture**

### Blockchain Derivative Registration System
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  AI Detection   │    │  SDK Integration│    │  Blockchain     │
│  • Similarity   │───►│  • registerDerivative()│───►│  • IP Network   │
│  • Parent Match │    │  • License Check│    │  • Inheritance  │
│  • Quality Score│    │  • Economic Calc│    │  • Revenue Flow │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### AI-Blockchain Bridge
- **Content Analysis**: OpenAI embeddings for semantic similarity
- **Auto-Detection**: AI-powered parent content identification
- **Blockchain Registration**: Real Story Protocol SDK v1.3.2 transactions
- **License Inheritance**: Automatic parent license compatibility analysis

### Family Tree Visualization
```
Parent IP ──┬── Derivative 1 ──┬── Sub-derivative 1.1
            │                 └── Sub-derivative 1.2
            ├── Derivative 2 ──── Sub-derivative 2.1
            └── Derivative 3 (unlimited depth)
```

## 🔔 **Automated Notification Architecture**

### Real-Time Monitoring System
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Event Detection│    │  Notification   │    │  Multi-Channel  │
│  • AI Analysis  │───►│  • Process      │───►│  • In-App       │
│  • Derivatives  │    │  • Categorize   │    │  • Email        │
│  • Quality      │    │  • Personalize  │    │  • Push/Webhook │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Background Processing
- **Monitoring Frequency**: Every 6 hours automated detection
- **AI Thresholds**: Configurable similarity detection (default 0.7)
- **Intelligent Caching**: Performance optimization with Redis-like behavior
- **Real-time Delivery**: <2 second notification latency

## 💰 **Enhanced Royalty Distribution Architecture**

### Chapter-Level Royalty System
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Reader Actions │    │  Revenue Engine │    │  Distribution   │
│  • Read Chapter │───►│  • Track Usage  │───►│  • Calculate    │
│  • Buy License  │    │  • License Fees │    │  • TIP Tokens   │
│  • Derivative   │    │  • TIP Rewards  │    │  • Multi-tier   │
│  • Tip Creator  │    │  • Inheritance  │    │  • Blockchain   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Tier Revenue Sharing
- **Free Chapters**: 0% royalty (open access)
- **Premium Chapters**: 10% royalty (commercial use)
- **Exclusive Chapters**: 25% royalty (full rights)
- **Derivative Revenue**: Automatic parent IP revenue sharing

### Real-Time Analytics Engine
```
Revenue Data ─→ Economic Modeling ─→ Optimization ─→ Recommendations
     ↓                  ↓                 ↓              ↓
  Tracking          ROI Analysis     Tier Analysis   Auto-suggest
  License Fees      Break-even       Performance     Upgrades
  TIP Earnings      Projections      Metrics         Actions
  Derivatives       Inheritance      AI Insights     Opportunities
```

## PIL Licensing System

### Template Management
- **Standard License**: Free access, attribution required
- **Premium License**: Commercial use, 10% royalty
- **Exclusive License**: Full rights, 25% royalty

### Core API Endpoints
- `GET /api/licenses/templates` - Retrieve license templates
- `POST /api/ip/license/attach` - Attach license to IP asset
- `GET /api/test-pil` - SDK compatibility testing

### 🆕 Derivative Registration API
- `POST /api/derivatives/register` - Manual blockchain derivative registration
- `POST /api/derivatives/auto-register` - AI-powered auto-detection and registration
- `GET /api/derivatives/tree/[ipId]` - Family tree queries with unlimited depth
- `GET /api/derivatives/license-inheritance/[parentIpId]` - License compatibility analysis

### 🆕 Notification System API
- `GET /api/notifications/[userAddress]` - Real-time notification retrieval
- `POST /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/preferences/[userAddress]` - User notification preferences
- `POST /api/notifications/preferences` - Update notification settings

### 🆕 AI Analytics API
- `GET /api/discovery?type=content-similarity` - AI-powered derivative detection
- `GET /api/discovery?type=influence-analysis` - Author influence metrics
- `GET /api/discovery?type=quality-assessment` - Content quality scoring
- `GET /api/discovery?type=derivative-analytics` - Comprehensive analytics

### UI Components
- `LicenseSelector.tsx` - Interactive license selection
- `LicenseViewer.tsx` - License information display

### 🆕 Analytics & Notification UI Components
- `DerivativeAnalytics.tsx` - Comprehensive analytics dashboard (5 components)
- `BookFamilyTree.tsx` - Interactive family tree visualization with AI indicators
- `NotificationCenter.tsx` - Real-time notification management center
- `NotificationToast.tsx` - Immediate notification alerts with auto-dismiss
- `DiscoveryDashboard.tsx` - Enhanced discovery with quality filtering

## Data Flow

### Chapter Publishing
1. User creates content with AI assistance and quality assessment
2. Selects PIL license template via UI
3. Content stored in cloud storage with enhanced metadata (25+ fields)
4. Chapter registered as IP asset on Story Protocol
5. License attached to IP asset via PIL
6. 🆕 AI analysis for similarity detection and derivative potential

### 🆕 Derivative Registration Flow
1. AI detects potential derivative content via OpenAI embeddings
2. Parent content similarity analysis (configurable threshold)
3. License compatibility check for derivative permissions
4. Blockchain registration using Story Protocol SDK v1.3.2
5. Economic calculations for revenue sharing
6. Family tree relationship established
7. Real-time notifications sent to relevant parties

### 🆕 Notification Processing Flow
1. Background monitoring detects events (every 6 hours)
2. AI analyzes content for derivative relationships
3. Quality assessment identifies improvement opportunities
4. Collaboration matching finds compatible creators
5. Notifications categorized and personalized
6. Multi-channel delivery (in-app, email, push, webhook)
7. User preferences respected for delivery methods

### Enhanced Revenue Distribution
1. Reader purchases chapter access or creates derivative
2. AI analyzes content relationships and inheritance
3. TIP tokens distributed to creator and parent IP holders
4. Royalties calculated based on license terms and derivative chain
5. Automatic distribution via smart contracts with blockchain verification
6. Real-time analytics update performance metrics

## Security & Performance

### Security
- TypeScript for type safety across 8,476+ lines of code
- Input validation on all API endpoints (15+ endpoints)
- Secure wallet integration via Web3 with MetaMask
- Content protection with access controls and blockchain verification
- 🆕 AI content analysis with privacy protection
- 🆕 Blockchain transaction security with graceful fallback
- 🆕 Notification system with anti-spam and rate limiting

### Performance
- Static site generation for frontend with SPA optimization
- Global CDN with enhanced metadata caching
- Serverless API deployment with optimized cold starts
- Optimized component lazy loading with analytics dashboard
- 🆕 Intelligent caching for AI analysis results
- 🆕 Background processing for notification monitoring
- 🆕 Real-time updates with <2 second notification latency
- 🆕 Efficient blockchain operations with batch processing

## Development Workflow

### Local Development
```bash
cd apps/frontend && npm run dev  # Port 3001
cd apps/backend && npm run dev   # Port 3002
```

### Deployment
- **Frontend**: Vercel with static export
- **Backend**: Vercel serverless functions
- **Database**: No traditional database - blockchain + cloud storage

## Monitoring & Analytics

### Testing
- Unit tests for core components
- Integration tests for API endpoints
- End-to-end testing for user workflows

### Performance Monitoring
- Vercel analytics for deployment metrics
- Story Protocol transaction monitoring
- Cloud storage usage tracking

## Scalability Considerations

### Current Capacity
- Vercel serverless functions auto-scale
- Cloud storage globally distributed
- Story Protocol handles blockchain scaling

### Future Enhancements
- Multi-chain support preparation
- Advanced caching strategies with Redis integration
- GraphQL API layer for complex derivative queries
- 🆕 Advanced AI models for enhanced content analysis
- 🆕 Real-time collaboration features for multi-author projects
- 🆕 Enhanced analytics with predictive modeling
- 🆕 Mobile app development with offline capabilities