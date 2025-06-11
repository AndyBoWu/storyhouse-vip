# 📚 StoryHouse.vip - Read, Earn, Create, Remix 🚀

Revolutionary Web3 storytelling platform built on Story Protocol enabling chapter-level IP asset management, read-to-earn mechanics, and AI-powered remix creation with comprehensive license management.

## 🌐 Live Deployments

**Testnet:**
- Frontend: https://testnet.storyhouse.vip/ (Vercel)
- Backend: https://api-testnet.storyhouse.vip/ (Vercel)

**Production:**
- Frontend: https://storyhouse.vip/ (Vercel)
- Backend: https://api.storyhouse.vip/ (Vercel)

## 🎯 What Makes StoryHouse Different

### Chapter-Level IP Management
Traditional publishing registers entire books as IP assets ($1000+). StoryHouse registers individual chapters as separate IP assets ($50-500 each), enabling:
- Immediate monetization from Chapter 1
- Granular licensing at chapter level
- Lower barrier to entry for new authors

### Read-to-Earn Economics
Readers earn $TIP tokens for reading the first 3 chapters, then pay to unlock premium content.

### AI-Powered Remix Economy
Authors can remix existing chapters with AI assistance and automated licensing.

### 3-Tier Programmable IP License System
StoryHouse implements sophisticated on-chain licensing through Story Protocol with comprehensive UI management:
- **Free License (0 TIP)**: Attribution required, non-commercial use, audience building
- **Premium License (0.1 TIP)**: 25% royalty, commercial use permitted, derivatives allowed
- **Exclusive License (0.5 TIP)**: 15% royalty, full commercial rights, exclusive licensing

**New License Management System:**
- Interactive license display components with pricing calculators
- Revenue projections and read-to-earn economics
- Detailed permissions and rights comparison tables
- Chapter-based strategy (free chapters 1-3, monetized 4+)

## 🔗 Smart Contract Addresses

**Network:** Story Protocol Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform utility token |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution |
| Creator Controller | `0x8e2d21d1b9c744f772f15a7007de3d5757eea333` | Creator incentives |
| Read Controller | `0x04553ba8316d407b1c58b99172956d2d5fe100e5` | Reader rewards |
| Remix Controller | `0x16144746a33d9a172039efc64bc2e12445fbbef2` | IP licensing |
| Access Control | `0x41e2db0d016e83ddc3c464ffd260d22a6c898341` | Permission management |

## 🏗️ Architecture

### Dual Vercel Deployment Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │    │  License        │
│  (Vercel)       │◄──►│  (Vercel)       │◄──►│  Management     │
│  Next.js App    │    │  API Routes     │    │  System         │
│  + License UI   │    │  + Story Proto  │    │  (React)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Frontend:** Next.js app with React components, Web3 integration, comprehensive license UI
**Backend:** Next.js API routes with Story Protocol SDK, AI integration, R2 storage
**License System:** Interactive components for license management, pricing, and permissions

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip
npm install

# Start development (from separate terminals)
cd apps/frontend && npm run dev  # Frontend on port 3001
cd apps/backend && npm run dev   # Backend on port 3002

# Build for production
cd apps/frontend && npm run build  # Static export for Vercel
cd apps/backend && npm run build   # API build for Vercel
```

## 📊 Tech Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | Next.js | 15.3.3 | Static export + React components |
| Backend | Next.js API | 15.3.3 | API routes + Story Protocol |
| Language | TypeScript | 5.8.3 | Full type safety |
| Styling | Tailwind CSS | 3.4.17 | + Framer Motion animations |
| Blockchain | Story Protocol SDK | 1.3.1 | IP asset management |
| AI | OpenAI GPT-4 | Latest | Story generation + AI features |
| Storage | Cloudflare R2 | - | Global CDN + content storage |
| Hosting | Vercel | - | Dual deployment architecture |
| License UI | React Components | Custom | Interactive license management |

## 📚 Documentation

- [Development Setup](./docs/setup/DEVELOPMENT.md) - Environment setup and local development
- [API Documentation](./docs/technical/API.md) - Backend API endpoints and usage
- [Smart Contracts](./docs/technical/CONTRACTS.md) - Blockchain contracts and deployment
- [License System](./docs/technical/LICENSE_COMPONENTS.md) - License UI components and usage
- [Deployment Guide](./docs/project/DEPLOYMENT.md) - Production deployment on Vercel

## 🎮 User Journeys

**Writers:** Create content with AI → Choose license tier → Register chapter IP → Earn from sales & licensing
**Readers:** Browse stories → Read 3 chapters FREE → Pay to unlock premium chapters → Earn TIP tokens
**Remixers:** Find content → View license options → Purchase appropriate license → Create derivatives → Earn revenue

## ✨ Recent Achievements

- ✅ **License Management System** - Complete UI for license display, pricing, and permissions
- ✅ **Dual Vercel Architecture** - Professional frontend/backend separation with custom domains
- ✅ **Story Protocol Integration** - Full blockchain IP asset registration and management
- ✅ **Read-to-Earn Economics** - TIP token rewards and creator revenue sharing
- ✅ **AI Story Generation** - GPT-4 powered content creation with metadata tracking
- ✅ **Chapter-Based Strategy** - Free chapters 1-3, monetized chapters 4+ with license management

## 🔮 Roadmap

- **Phase 6:** Story marketplace and discovery features
- **Phase 7:** Multi-chain support and mobile app
- **Phase 8:** Enterprise features and global scaling

---

**Ready to revolutionize publishing? Start at [https://testnet.storyhouse.vip/](https://testnet.storyhouse.vip/)**