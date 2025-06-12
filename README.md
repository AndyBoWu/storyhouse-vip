# 📚 StoryHouse.vip - Web3 Publishing Platform

Revolutionary Web3 storytelling platform built on Story Protocol enabling chapter-level IP asset management, blockchain derivative registration, and AI-powered content analytics with real-time royalty distribution.

## 🌐 Live Deployments

**Testnet (Fully Operational):**
- Frontend: https://testnet.storyhouse.vip/ 
- Backend: https://api-testnet.storyhouse.vip/
- **NEW**: Story Protocol SDK derivative registration system operational
- **AI Analytics**: Complete derivative tracking and notification system

**Production (Ready for Mainnet):**
- Frontend: https://storyhouse.vip/ 
- Backend: https://api.storyhouse.vip/
- **Blockchain Integration**: Full SDK derivative registration infrastructure deployed

**Latest Deployments (Vercel):**
- Frontend: https://frontend-3pf89c73v-andy-wus-projects.vercel.app
- Backend: https://backend-dxtj0y3su-andy-wus-projects.vercel.app
- **Phase 5.3 Complete**: SPA optimization with enhanced UI/UX and color-coded chapter states

## 🎯 Core Features

### Chapter-Level IP Management
Register individual chapters as IP assets ($50-500 each) vs traditional book-level registration ($1000+):
- Immediate monetization from Chapter 1
- Granular licensing control
- Lower barrier to entry for creators

### PIL (Programmable IP License) System
Complete licensing infrastructure with Story Protocol SDK v1.3.2:
- **Standard (0 TIP)**: Open access, attribution required, non-commercial
- **Premium (100 TIP)**: Commercial use, 10% royalty, derivatives allowed  
- **Exclusive (1000 TIP)**: Full rights, 25% royalty, exclusive licensing

### Read-to-Earn Economics
- Readers earn $TIP tokens while reading
- Free chapters 1-3, monetized content thereafter
- Dynamic pricing based on engagement

### 🆕 **Real-Time Royalty Distribution**
Complete chapter-level royalty management system:
- **Individual Chapter Claiming**: Claim royalties per chapter with real-time validation
- **Multi-Tier Revenue Sharing**: Free (0%), Premium (10%), Exclusive (25%) royalty rates
- **Advanced Analytics**: ROI analysis, tier optimization, revenue forecasting
- **Real-Time Notifications**: Multi-channel delivery (in-app, email, push, webhook)
- **Economic Modeling**: Break-even analysis and optimization recommendations

### 🔗 **Story Protocol SDK Derivative Registration**
Complete blockchain derivative registration system:
- **Real Blockchain Registration**: Story Protocol SDK v1.3.2 `registerDerivative()` operations
- **AI-Blockchain Bridge**: Seamless integration between AI analysis and blockchain registration
- **License Inheritance**: Automatic parent license inheritance with compatibility analysis
- **Auto-Detection**: AI-powered parent content detection with similarity scoring
- **Family Tree Visualization**: Unlimited depth derivative relationship queries
- **Economic Intelligence**: Revenue sharing calculations and royalty projections

### 🤖 **AI-Powered Content Analytics**
Advanced AI analysis with blockchain integration:
- **Content Similarity Detection**: OpenAI embeddings for semantic analysis
- **Derivative Analytics Dashboard**: Comprehensive visualization suite with blockchain data
- **Quality Assessment**: Multi-factor quality scoring with AI recommendations
- **Influence Tracking**: Author influence metrics and performance analysis
- **Smart Discovery**: AI-powered recommendations with blockchain verification

### 🔔 **Automated Notification System**
Real-time alerts and monitoring:
- **AI Derivative Detection**: Automatic similarity analysis with configurable thresholds
- **Real-time Notifications**: In-app notification center with <2 second latency
- **Background Monitoring**: Automated detection every 6 hours with intelligent caching
- **Multi-channel Delivery**: In-app, email, push, and webhook notifications
- **Quality Alerts**: Automated improvement suggestions and collaboration matching

## 🏗️ Architecture

```
Frontend (Vercel)     Backend (Vercel)         Story Protocol
Next.js + Analytics ←→ API + SDK v1.3.2    ←→  Blockchain Derivatives
     ↓                      ↓                      ↓
PIL Dashboard         Derivative Registration  IP Asset Network
Notification Center   AI Content Analysis      License Inheritance
Family Tree UI        Real-time Monitoring     Revenue Distribution
```

- **Frontend**: React analytics dashboard, blockchain derivative UI, notification center
- **Backend**: Story Protocol SDK integration, AI analysis engine, derivative registration
- **Blockchain**: Real derivative registration, license inheritance, economic modeling
- **AI**: OpenAI embeddings, similarity detection, automated quality assessment
- **Storage**: Global content delivery with enhanced metadata

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip && npm install

# Start development servers (option 1: script)
./start-local.sh

# Or start manually (option 2)
cd apps/frontend && npm run dev  # Port 3001
cd apps/backend && npm run dev   # Port 3002
```

## 📊 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 15.3.3 |
| Backend | Next.js API | 15.3.3 |
| Blockchain | Story Protocol SDK | 1.3.2 |
| AI | OpenAI GPT-4 | Latest |
| Storage | Cloud Storage | - |
| Hosting | Vercel | - |

## 🔗 Smart Contracts (Testnet)

**Network:** Story Protocol Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform token & royalty payments |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution & claiming |
| SPG NFT Contract | `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d` | IP asset NFTs |

## 🆕 **API Endpoints**

**Royalty System** (All operational on testnet):
- `POST /api/royalties/claim` - Individual chapter claiming with validation
- `GET /api/royalties/claimable/[chapterId]` - Real-time claimable amounts
- `GET /api/royalties/history/[authorAddress]` - Complete claim history
- `GET /api/royalties/preview` - Advanced analytics and forecasting
- `GET /api/royalties/notifications/[authorAddress]` - Multi-channel notifications

**Story Protocol SDK Derivative Registration** (NEW - SDK Integration):
- `POST /api/derivatives/register` - Manual blockchain derivative registration
- `POST /api/derivatives/auto-register` - AI-powered auto-detection and registration
- `GET /api/derivatives/tree/[ipId]` - Family tree queries with unlimited depth
- `GET /api/derivatives/license-inheritance/[parentIpId]` - License compatibility analysis

**Automated Notifications** (NEW - Phase 3.3.1):
- `GET /api/notifications/[userAddress]` - Real-time notification retrieval
- `POST /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/preferences/[userAddress]` - User notification preferences
- `POST /api/notifications/preferences` - Update notification settings

**AI Content Analytics** (Phase 3.1-3.2):
- `GET /api/discovery?type=content-similarity` - AI-powered derivative detection
- `GET /api/discovery?type=influence-analysis` - Author influence metrics
- `GET /api/discovery?type=quality-assessment` - Content quality scoring
- `GET /api/discovery?type=derivative-analytics` - Comprehensive analytics

## 📚 Documentation

- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)
- [API Reference](./docs/API_REFERENCE.md) 
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Testing Strategy](./docs/TESTING_STRATEGY.md)

## 🎮 User Flow

1. **Create**: Write stories with AI assistance and quality assessment
2. **License**: Choose PIL template (Standard/Premium/Exclusive)  
3. **Publish**: Register chapters as IP assets on Story Protocol
4. **🆕 Register Derivatives**: AI-powered detection and blockchain registration of derivative works
5. **Monitor**: Real-time notifications for derivative activity and opportunities
6. **Analyze**: Comprehensive analytics dashboard with family tree visualization
7. **Monetize**: Earn from licenses, derivatives, and reader engagement with automated royalty distribution

## ✅ Current Status

**🎉 Phase 5.3 Complete** - Full SPA Optimization with Enhanced UI/UX:

**Latest UI Enhancements:**
- ✅ **Zero Commission Emphasis**: Platform messaging highlights 100% creator revenue
- ✅ **Color-Coded Chapter States**: Visual hierarchy for free (green), locked premium (gray), and unlocked premium (purple) chapters  
- ✅ **Improved Publishing Flow**: Clear "Review" → "Publish" workflow with simplified UI
- ✅ **Enhanced Pricing**: Updated default chapter pricing to 0.5 TIP with optimized tiers (0.3, 0.5, 0.8)
- ✅ **Streamlined Input UX**: Fixed price input fields with proper state management
- ✅ **Vercel Deployment**: Latest frontend and backend deployed with performance optimizations

**🎉 Story Protocol SDK Integration Complete** - Full Blockchain Derivative Registration:
- ✅ **Real Blockchain Registration**: Story Protocol SDK v1.3.2 `registerDerivative()` operations
- ✅ **AI-Blockchain Bridge**: Seamless integration between AI analysis and blockchain registration
- ✅ **License Inheritance**: Automatic parent license inheritance with compatibility analysis
- ✅ **Auto-Detection**: AI-powered parent content detection with similarity scoring
- ✅ **Family Tree Queries**: Unlimited depth derivative relationship visualization
- ✅ **Economic Intelligence**: Revenue sharing calculations and royalty projections
- ✅ **Type Safety**: Complete TypeScript coverage across all derivative operations
- ✅ **Production Ready**: 2,476+ lines of blockchain integration code

**🔔 Phase 3.3.1 Complete** - Automated Notification System:
- ✅ **AI Derivative Detection**: Automatic similarity analysis with configurable thresholds
- ✅ **Real-time Notifications**: In-app notification center with <2 second latency
- ✅ **Background Monitoring**: Automated detection every 6 hours with intelligent caching
- ✅ **Multi-channel Delivery**: In-app, email, push, and webhook notifications
- ✅ **Production Ready**: 3,500+ lines of notification infrastructure

**📊 Phase 3.2 Complete** - Advanced Analytics Dashboard:
- ✅ **Derivative Analytics Tab**: 4th tab in royalty dashboard for tracking derivatives
- ✅ **5 Analytics Components**: Complete visualization suite (charts, gauges, comparisons)
- ✅ **Enhanced Family Tree**: AI similarity indicators with hover tooltips
- ✅ **Smart Discovery**: Quality filtering and AI-powered recommendations
- ✅ **Production Ready**: 2,500+ lines of React/TypeScript frontend code

**🤖 Phase 3.1 Complete** - AI Content Analysis Engine:
- ✅ **OpenAI Integration**: Content similarity analysis with semantic embeddings
- ✅ **Derivative Detection**: Automated parent content identification
- ✅ **Quality Assessment**: Multi-factor analysis with AI recommendations
- ✅ **Enhanced Discovery**: 3 AI analysis types with real-time processing

**💰 Phase 2 Complete** - Full Royalty Distribution System:
- ✅ Chapter-level claiming with real-time validation
- ✅ Advanced analytics and economic modeling
- ✅ Multi-channel notification system
- ✅ Complete frontend dashboard with 3-tab interface

**🏗️ Phase 1 Complete** - Foundation:
- ✅ Story Protocol SDK v1.3.2 integration
- ✅ Complete PIL template management
- ✅ Enhanced metadata system (25+ fields per chapter)
- ✅ Production-ready deployment architecture

## 🎯 Implementation Statistics

**Total Achievement: 8,476+ Lines of Production Code**
- **SDK Integration**: 2,476+ lines of blockchain derivative registration
- **Notification System**: 3,500+ lines of AI-powered alerts and monitoring
- **Analytics Dashboard**: 2,500+ lines of React/TypeScript visualization
- **15+ API Endpoints**: Complete derivative tracking and registration infrastructure
- **Full TypeScript Coverage**: Type-safe development across entire system
- **Live Production Deployment**: All features operational on testnet with mainnet ready

## 🔮 Next Phases

- **Phase 4**: Enhanced Creator Economy (revenue automation, collaboration tools, marketplace)
- **Phase 5**: Community & Social Features (reviews, discussions, creator following)
- **Phase 6**: Advanced AI Features (story continuation, character consistency, plot analysis)

---

**Ready to revolutionize publishing?** → [testnet.storyhouse.vip](https://testnet.storyhouse.vip/)