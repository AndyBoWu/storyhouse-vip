# 📚 StoryHouse.vip - Read, Earn, Create, Remix 🚀

Revolutionary Web3 storytelling platform built on Story Protocol enabling chapter-level IP asset management, read-to-earn mechanics, and AI-powered remix creation.

## 🌐 Live Deployments

**Testnet:**
- Frontend: https://testnet.storyhouse.vip/
- Backend: https://api-testnet.storyhouse.vip/

**Production:**
- Frontend: https://storyhouse.vip/
- Backend: https://api.storyhouse.vip/

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
StoryHouse implements sophisticated on-chain licensing through Story Protocol:
- **Standard License ($100)**: 5% royalty, non-exclusive commercial use
- **Premium License ($500)**: 10% royalty, enhanced commercial rights
- **Exclusive License ($2,000)**: 20% royalty, exclusive adaptation rights

[Learn more about our licensing system →](./docs/technical/LICENSING_SYSTEM.md)

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

### Vercel-Only Hosting
```
┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │
│  (Vercel)       │◄──►│  (Vercel)       │
│  Next.js App    │    │  API Routes     │
└─────────────────┘    └─────────────────┘
```

**Frontend:** Next.js app with React components, Web3 integration
**Backend:** Next.js API routes with Story Protocol SDK, AI integration, R2 storage

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip
npm install

# Start development
cd apps/frontend && npm run dev  # Frontend on port 3001
cd apps/backend && npm run dev   # Backend on port 3002
```

## 📊 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 15.3.3 |
| Language | TypeScript | 5.8.3 |
| Styling | Tailwind CSS | 3.4.17 |
| Blockchain | Story Protocol SDK | 1.3.1 |
| AI | OpenAI GPT-4 | Latest |
| Storage | Cloudflare R2 | - |
| Hosting | Vercel | - |

## 📚 Documentation

- [Development Setup](./docs/setup/DEVELOPMENT.md)
- [API Documentation](./docs/technical/API.md)
- [Smart Contracts](./docs/technical/CONTRACTS.md)
- [Deployment Guide](./docs/project/DEPLOYMENT.md)

## 🎮 User Journeys

**Writers:** Create content with AI → Register chapter IP → Earn from sales & licensing
**Readers:** Browse stories → Read 3 chapters FREE → Pay to unlock premium chapters
**Remixers:** Find content → Purchase license → Create derivatives → Earn revenue

## 🔮 Roadmap

- **Phase 4:** Database integration, user authentication
- **Phase 5:** Multi-chain support, mobile app
- **Phase 6:** Enterprise features, global scaling

---

**Ready to revolutionize publishing? Start at [https://testnet.storyhouse.vip/](https://testnet.storyhouse.vip/)**