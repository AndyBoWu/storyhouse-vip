# 📚 StoryHouse.vip - Web3 Publishing Platform

Revolutionary Web3 storytelling platform built on Story Protocol enabling chapter-level IP asset management, PIL licensing, and AI-powered content creation.

## 🌐 Live Deployments

**Testnet:**
- Frontend: https://testnet.storyhouse.vip/ 
- Backend: https://api-testnet.storyhouse.vip/

**Production:**
- Frontend: https://storyhouse.vip/
- Backend: https://api.storyhouse.vip/

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
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform token |
| Rewards Manager | `0xf5ae031ba92295c2ae86a99e88f09989339707e5` | Reward distribution |
| SPG NFT Contract | `0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d` | IP asset NFTs |

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

## ✅ Current Status

**Phase 5.3 Complete** - Full PIL licensing system with:
- ✅ Story Protocol SDK v1.3.2 integration
- ✅ Complete PIL template management
- ✅ License attachment functionality
- ✅ Rich UI components for license selection
- ✅ Enhanced metadata system (25+ fields per chapter)
- ✅ Automated R2 storage and caching
- ✅ Production-ready deployment architecture

## 🔮 Next Phases

- **Phase 6**: Royalty distribution system
- **Phase 7**: Derivative & remix features
- **Phase 8**: Group IP collections

---

**Ready to revolutionize publishing?** → [testnet.storyhouse.vip](https://testnet.storyhouse.vip/)