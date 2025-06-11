# 📚 StoryHouse.vip - Web3 Publishing Platform

Revolutionary Web3 storytelling platform built on Story Protocol enabling chapter-level IP asset management, real-time royalty distribution, and AI-powered content creation.

## 🌐 Live Deployments

**Testnet (Fully Operational):**
- Frontend: https://testnet.storyhouse.vip/ 
- Backend: https://api-testnet.storyhouse.vip/
- **NEW**: Complete royalty claiming system operational

**Production (Backend Ready):**
- Frontend: https://storyhouse.vip/ 
- Backend: https://api.storyhouse.vip/
- **NEW**: All royalty APIs deployed and ready

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

## 🏗️ Architecture

```
Frontend (Vercel)     Backend (Vercel)       Story Protocol
Next.js + PIL UI  ←→  API + SDK v1.3.2   ←→  Blockchain IP Assets
```

- **Frontend**: React components, license management UI, Web3 integration
- **Backend**: Next.js API routes, Story Protocol SDK, AI integration
- **Storage**: Cloudflare R2 for global content delivery

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip && npm install

# Start development servers
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
| Storage | Cloudflare R2 | - |
| Hosting | Vercel | - |

## 🔗 Smart Contracts (Testnet)

**Network:** Story Protocol Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform token & royalty payments |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution & claiming |
| SPG NFT Contract | `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d` | IP asset NFTs |

## 🆕 **Royalty System APIs**

**Live Endpoints** (All operational on testnet):
- `POST /api/royalties/claim` - Individual chapter claiming with validation
- `GET /api/royalties/claimable/[chapterId]` - Real-time claimable amounts
- `GET /api/royalties/history/[authorAddress]` - Complete claim history
- `GET /api/royalties/preview` - Advanced analytics and forecasting
- `GET /api/royalties/notifications/[authorAddress]` - Multi-channel notifications

## 📚 Documentation

- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)
- [API Reference](./docs/API_REFERENCE.md) 
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Testing Strategy](./docs/TESTING_STRATEGY.md)

## 🎮 User Flow

1. **Create**: Write stories with AI assistance
2. **License**: Choose PIL template (Standard/Premium/Exclusive)  
3. **Publish**: Register chapters as IP assets on Story Protocol
4. **Monetize**: Earn from licenses, derivatives, and reader engagement
5. **🆕 Claim**: Real-time royalty claiming via comprehensive dashboard

## ✅ Current Status

**🎉 Phase 2 Complete** - Full royalty distribution system with:
- ✅ **Chapter-Level Claiming**: Individual chapter royalty management
- ✅ **Real-Time Analytics**: Advanced ROI analysis and tier optimization
- ✅ **Multi-Channel Notifications**: In-app, email, push, webhook delivery
- ✅ **Economic Modeling**: Break-even analysis and revenue forecasting
- ✅ **Production APIs**: 5 comprehensive endpoints with validation
- ✅ **Complete Frontend**: `/creator/royalties` dashboard with 3-tab interface
- ✅ **TIP Token Integration**: Real blockchain operations with error handling
- ✅ **Performance Optimized**: <2s response times with intelligent caching

**Previous Achievements:**
- ✅ Story Protocol SDK v1.3.2 integration
- ✅ Complete PIL template management
- ✅ Enhanced metadata system (25+ fields per chapter)
- ✅ Production-ready deployment architecture

## 🔮 Next Phases

- **Phase 3**: Derivative & remix tracking system
- **Phase 4**: Group IP collections and collaborative features
- **Phase 5**: Advanced analytics and business intelligence

---

**Ready to revolutionize publishing?** → [testnet.storyhouse.vip](https://testnet.storyhouse.vip/)