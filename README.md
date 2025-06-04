# 📚 StoryHouse.vip

> **The world's first Web3 storytelling platform with chapter-level IP asset management on Story Protocol**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Story Protocol](https://img.shields.io/badge/Story_Protocol-Integrated-purple)](https://storyprotocol.xyz/)

## 🎯 **Revolutionary Vision**

StoryHouse.vip enables **granular IP ownership** where each story chapter becomes an individual, tradeable IP asset. Unlike traditional publishing where you buy rights to entire books, creators can:

- ✅ **Monetize Chapter 1** while writing Chapter 2
- ✅ **License individual scenes** for $50 instead of $1000+ for full books
- ✅ **Create cross-chapter derivatives** mixing content from different stories
- ✅ **Build IP portfolios progressively** with immediate market feedback

## 🌟 **Core Innovation: Chapter-Level IP Assets**

```
Traditional Model:          StoryHouse.vip Model:
📚 Buy entire book IP      📄 Buy specific chapter IP
💰 $1000+ investment       💰 $50-500 per chapter
⏰ Wait for completion     ⚡ Immediate availability
🔒 All-or-nothing rights   🎯 Granular rights control
```

### **Real-World Use Cases:**

- 🎬 **Film Studios**: License just "epic battle scene" from Chapter 7 for short film
- 🌍 **Translators**: License specific chapters for localization projects
- 🎮 **Game Developers**: License "magic system" from Chapter 3 across stories
- 🎨 **Comic Artists**: License individual scenes for visual adaptation

## 🏗 **Technical Architecture**

### **Smart Contracts** (6 deployed, 95%+ test coverage)

- **TIPToken.sol**: Read-to-earn tokenomics with faucet system
- **StoryNFT.sol**: Story ownership and metadata management
- **RewardManager.sol**: Automated reward distribution
- **IPAssetRegistry.sol**: Story Protocol IP asset tracking
- **LicenseManager.sol**: Granular licensing and royalty management
- **CollectionManager.sol**: Collaborative story collections

### **Frontend Stack**

- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety across the stack
- **Tailwind CSS**: Modern responsive design
- **Framer Motion**: Smooth animations and interactions
- **Story Protocol SDK**: Blockchain IP asset management

### **Enhanced Story Creation Flow**

- **IPRegistrationSection**: Comprehensive IP protection interface
- **CollectionSection**: Collaborative story collection management
- **IPStatusIndicator**: Real-time IP registration tracking
- **Progressive Enhancement**: Features unlock as users engage

## 🚀 **Quick Start**

### Prerequisites

```bash
Node.js 18+
npm or yarn
Git
```

### Installation

```bash
# Clone the repository
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Environment Setup

```env
# Database
DATABASE_URL="postgresql://..."

# Story Protocol
STORY_PROTOCOL_RPC_URL="..."
STORY_PROTOCOL_CHAIN_ID="..."

# AI Generation (OpenAI)
OPENAI_API_KEY="sk-..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## 📡 **API Endpoints**

### **Enhanced Story Generation**

```typescript
POST /api/generate
{
  "plotDescription": "A young detective discovers...",
  "genres": ["mystery", "fantasy"],
  "ipOptions": {
    "registerAsIP": true,
    "licenseType": "premium",
    "commercialRights": true
  },
  "collectionOptions": {
    "addToCollection": "col-123"
  }
}
```

### **IP Asset Management**

```typescript
// Register story as IP asset
POST /api/ip/register
{
  "storyId": "story-123",
  "licenseType": "standard",
  "authorAddress": "0x..."
}

// Check IP registration status
GET /api/ip/register?storyId=story-123
```

### **Chapter-Level IP (Coming Soon)**

```typescript
// Register individual chapter as IP asset
POST / api / chapters / { chapterId } / register - ip;

// License specific chapter
POST / api / chapters / { chapterId } / license;

// Bundle chapter licensing
POST / api / chapters / bundle - license;
```

### **Collection Management**

```typescript
// Create story collection
POST /api/collections
{
  "name": "Epic Fantasy Adventures",
  "revenueShare": { "creator": 70, "collection": 20, "platform": 10 }
}

// Search collections
GET /api/collections?genre=fantasy&public=true
```

### **Licensing System**

```typescript
// Create license terms
POST /api/ip/license
{
  "ipAssetId": "0x...",
  "licenseType": "premium",
  "price": 500,
  "royaltyPercentage": 10
}

// Purchase license
PUT /api/ip/license
{
  "ipAssetId": "0x...",
  "buyerAddress": "0x..."
}
```

## 🎮 **User Experience**

### **For Authors**

```
📝 Writing Dashboard:
┌─ Chapter 1: "The Beginning" ✅ Published → 💰 12 licenses ($600)
├─ Chapter 2: "First Magic" ✅ Published → 💰 8 licenses ($400)
├─ Chapter 3: "Dark Turn" ⏳ Writing...
└─ Chapter 4: "Revelation" 📝 Planned

🎯 Next Action: "Publish Chapter 3 and register as IP asset"
💡 Insight: "Chapter 2 has 3x higher licensing rate"
```

### **For Licensees**

```
🛒 Chapter Marketplace:
┌─ "Epic Battle Scenes" Collection
│  ├─ Chapter 7: "Dragon Fight" - 🔥 Trending - $75
│  ├─ Chapter 12: "Final Duel" - $50
│  └─ Chapter 3: "First Battle" - $25
├─ "Romance Moments" Collection
└─ "Plot Twist Chapters" Collection

💡 Bundle Offer: "Buy all 3 battle chapters for $120 (20% off)"
```

## 📈 **Development Status**

### ✅ **Completed Phases**

**Phase 1: Foundation & Smart Contracts**

- 6 deployed smart contracts with comprehensive testing
- TIP token economics and faucet system
- Gas optimization and security audits

**Phase 2: Story Protocol Integration**

- Enhanced types extending base Story interface
- SDK integration foundation and service layer
- IP asset types and licensing structures

**Phase 3: Enhanced Story Creation Flow**

- IPRegistrationSection with comprehensive IP protection
- CollectionSection for collaborative management
- IPStatusIndicator for real-time tracking
- Progressive enhancement UI

**Phase 4.1: API Integration**

- Enhanced story generation with IP-ready metadata
- IP registration and licensing endpoints
- Collection management APIs
- Comprehensive validation and error handling

### 🚀 **Current Phase**

**Phase 4.2: Revolutionary Chapter-Level IP System**

- Individual chapter IP asset registration
- Granular licensing and bundle systems
- Chapter dependency tracking
- Cross-story chapter remixing

**Phase 4.3: Story Protocol SDK Integration** ⬅️ **CURRENT FOCUS**

- Replace mock functions with real Story Protocol calls
- Implement actual IP asset registration on blockchain
- Handle real transactions and gas optimization
- Connect to Story Protocol testnet/mainnet

## 🏆 **Innovation Advantages**

### **vs Traditional Publishing**

- **Granular Access**: License specific scenes/chapters
- **Immediate Monetization**: No waiting for book completion
- **Market-Driven Pricing**: Popular chapters command premium prices
- **Reduced Risk**: Lower investment per IP asset

### **vs Other Web3 Platforms**

- **Chapter-Level Granularity**: Most platforms treat entire works as single NFTs
- **Progressive Rights Building**: Build IP portfolio incrementally
- **Real Utility**: Actual licensing rights, not just ownership tokens
- **Cross-Story Derivatives**: Mix chapters from different stories

## 📊 **Success Metrics**

- Chapter IP registration rate (target: 80% of published chapters)
- Average time from chapter publish to first license (target: < 24 hours)
- Chapter-level revenue per author (target: $500/month)
- Cross-chapter derivative creation rate (target: 20% of licensed chapters)

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 **Documentation**

- [📋 Roadmap](ROADMAP.md) - Development roadmap and future plans
- [⚡ Chapter IP Technical Spec](docs/CHAPTER_IP_TECHNICAL_SPEC.md) - Chapter-level IP system
- [🔧 API Documentation](docs/API.md) - Complete API reference
- [🎨 UI Components](docs/COMPONENTS.md) - Frontend component guide
- [🔗 Smart Contracts](docs/CONTRACTS.md) - Contract documentation

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 **Acknowledgments**

- [Story Protocol](https://storyprotocol.xyz/) for revolutionary IP infrastructure
- [Next.js](https://nextjs.org/) for the incredible React framework
- [OpenAI](https://openai.com/) for AI-powered story generation
- The Web3 and DeFi communities for inspiration and innovation

---

**Built with ❤️ for the future of digital storytelling and IP ownership**

_StoryHouse.vip - Where every chapter becomes valuable IP_ ✨
