# 📚 StoryHouse.vip

**The Web3 publishing platform where authors own their IP and creators earn 90% of revenue.** Built on Story Protocol, StoryHouse enables chapter-level IP management and automated licensing—with only 10% platform fee.

[![Live Demo](https://img.shields.io/badge/demo-testnet.storyhouse.vip-blue)](https://testnet.storyhouse.vip)
[![Story Protocol](https://img.shields.io/badge/built%20on-Story%20Protocol-purple)](https://www.storyprotocol.xyz/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## ✨ Why StoryHouse?

- **💰 90% Creator Revenue**: Authors get 70% + curators get 20% (only 10% platform fee)
  - Compare: Amazon KDP (30-65%), Traditional Publishers (7-15%), Medium (~50%), Substack (90%)
- **📝 Chapter-Level IP**: Register individual chapters as IP assets ($50 vs $1000+ for full books)
- **🤖 AI-Powered Features**: Content fraud detection, translation, text-to-audio, and smart recommendations
- **⚡ 40% Lower Gas Costs**: Single-transaction IP registration saves time and money
- **🔓 Permissionless Publishing**: No gatekeepers—anyone can publish directly to the blockchain

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip

# Install dependencies
npm install

# Start development servers
./start-local.sh
# Frontend: http://localhost:3001
# Backend:  http://localhost:3002
```

## 🎯 Key Features

### For Authors
- **Instant Monetization**: Earn from chapter 1 with pay-per-chapter model (0.5 TIP/chapter)
- **Flexible Licensing**: Choose from reading, commercial, or exclusive licenses
- **Real-Time Analytics**: Track earnings, readers, and derivative works
- **Direct Wallet Payments**: Receive payments instantly to your wallet
- **Content Protection**: AI-powered fraud detection prevents plagiarism

### For Readers  
- **Try Before You Buy**: First 3 chapters free for every story
- **Quality Content**: AI-verified stories with anti-plagiarism protection
- **Multiple Languages**: Stories available in 10+ languages through AI translation
- **Audio Experience**: Text-to-audio generation for listening on the go
- **Smart Recommendations**: AI-powered content suggestions based on your reading
- **Ownership Options**: Purchase reading licenses or full commercial rights
- **Direct Support**: 90% of payments go to creators (70% author + 20% curator)

## 🏗️ Architecture

StoryHouse uses a minimal 2-contract architecture integrated with Story Protocol:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                     Port 3001                            │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                 Backend API (Next.js)                    │
│                     Port 3002                            │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                  Smart Contracts                         │
│  ┌─────────────────┐        ┌──────────────────────┐   │
│  │   TIP Token     │        │ HybridRevenueV2      │   │
│  │  (Currency)     │        │ (Revenue Sharing)    │   │
│  └─────────────────┘        └──────────────────────┘   │
│                                                         │
│              Story Protocol SDK v1.3.2                  │
│         (IP Registration, NFTs, Licensing)              │
└─────────────────────────────────────────────────────────┘
```

### Smart Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | Platform currency |
| HybridRevenueControllerV2 | `0x9c6a3c50e5d77f99d805d8d7c935acb23208fd9f` | Revenue distribution (70/20/10) |

**Story Protocol Handles**: IP registration, NFT minting, licensing, derivatives, royalties

## 📚 Documentation

- [Product Specification](./docs/PRODUCT_SPEC.md) - Detailed features and roadmap
- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md) - System design and components  
- [API Reference](./docs/API_REFERENCE.md) - Complete API documentation
- [Development Guide](./docs/guides/DEVELOPMENT_GUIDE.md) - Setup and deployment
- [Smart Contracts](./packages/contracts/README.md) - Contract development with Foundry

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, TypeScript
- **Blockchain**: Story Protocol SDK v1.3.2, ethers.js
- **Smart Contracts**: Solidity 0.8.20, Foundry
- **AI**: OpenAI GPT-4
- **Storage**: Cloudflare R2

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- **Live Demo**: [testnet.storyhouse.vip](https://testnet.storyhouse.vip)
- **Documentation**: [docs.storyhouse.vip](https://docs.storyhouse.vip)
- **Story Protocol**: [storyprotocol.xyz](https://www.storyprotocol.xyz)

---

Built with ❤️ by the StoryHouse team. Empowering authors to own their stories.