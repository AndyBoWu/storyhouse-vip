# StoryHouse.vip

AI-powered storytelling platform built on Story Protocol Layer 1 blockchain with read-to-earn tokenomics using $TIP tokens.

## ✨ Features

- **📚 Read & Earn**: Earn $TIP tokens for every chapter you read with anti-gaming mechanisms
- **🤖 AI-Powered Writing**: Create stories with GPT-4o assistance and multi-modal inputs
- **🔄 Remix & Earn**: Remix existing stories and earn licensing fees through recursive creativity
- **💰 Progressive Paywall**: First 3 chapters free, chapter 4+ require token payments
- **⚔️ Reading Streaks**: Bonus rewards for consecutive daily reading
- **🔗 MetaMask Integration**: Seamless Web3 wallet connection on Story Protocol testnet

## 🌐 Live Demo

- **Production**: [https://testnet.storyhouse.vip](https://testnet.storyhouse.vip)
- **Creator Interface**: [/create](https://testnet.storyhouse.vip/create)

## 🏗️ Monorepo Structure

```
storyhouse-vip/
├── apps/
│   └── frontend/              # Next.js web application
├── packages/
│   ├── contracts/            # Foundry smart contracts
│   ├── shared/              # Shared types & utilities
│   └── sdk/                 # Contract interaction SDK (planned)
├── tools/
│   └── scripts/             # Deployment & automation
└── docs/                    # Comprehensive documentation
```

## 🔧 Tech Stack

### Frontend (apps/frontend)

- **Framework**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion animations
- **Web3**: Wagmi, Viem for Story Protocol integration
- **AI**: OpenAI GPT-4o for story generation
- **Icons**: Lucide React

### Smart Contracts (packages/contracts)

- **Framework**: Foundry for development & testing
- **Language**: Solidity ^0.8.20
- **Standards**: OpenZeppelin contracts
- **Network**: Story Protocol testnet (Chain ID: 1315)

### Shared (packages/shared)

- **Types**: Comprehensive TypeScript interfaces
- **Constants**: Network configs, validation patterns
- **Utils**: Token formatting, address truncation

## 💎 Smart Contract Architecture

### Core Contracts

1. **TIPToken.sol** - ERC-20 token with controlled minting

   - Supply cap management (10B max, 1B initial)
   - Authorized minter system
   - Pausable transfers
   - Burn functionality

2. **RewardsManager.sol** - Central reward orchestration

   - Unified reward distribution
   - Cross-controller state management
   - Global statistics tracking
   - Batch operations for gas efficiency

3. **ReadRewardsController.sol** - Chapter reading rewards
   - Anti-gaming mechanisms (time limits, daily caps)
   - Reading streak bonuses (up to 100% extra)
   - Chapter metadata tracking
   - Session-based reward claiming

### Planned Contracts

- **CreatorRewardsController.sol** - Story creation & engagement rewards
- **RemixLicensingController.sol** - Remix fee distribution
- **ContentNFT.sol** - Story NFTs as IP assets

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Foundry (for smart contract development)
- OpenAI API key
- MetaMask wallet

### Installation

1. **Clone and install:**

```bash
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip
npm install
```

2. **Environment setup:**

```bash
# Frontend environment
cd apps/frontend
cp .env.example .env.local
# Add your OPENAI_API_KEY

# Smart contracts environment
cd ../../packages/contracts
cp .env.example .env
# Add your PRIVATE_KEY for deployments
```

3. **Development servers:**

```bash
# Frontend development
npm run dev

# Smart contract compilation
npm run contracts:build

# Run tests
npm run contracts:test
```

### Smart Contract Development

```bash
# Navigate to contracts package
cd packages/contracts

# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run tests with gas reporting
forge test --gas-report

# Deploy to Story Protocol testnet
forge script script/Deploy.s.sol --rpc-url $STORY_RPC_URL --broadcast
```

## 📋 Workspace Commands

```bash
# Frontend development
npm run dev                    # Start Next.js dev server
npm run build                  # Build frontend for production

# Smart contract operations
npm run contracts:build        # Compile all contracts
npm run contracts:test         # Run Foundry test suite
npm run contracts:deploy       # Deploy to testnet

# Shared package
npm run build:all             # Build all packages
npm run clean                 # Clean all node_modules
```

## 🔗 Story Protocol Integration

### Network Configuration

- **Chain ID**: 1315 (Aeneid testnet)
- **RPC URL**: https://aeneid.storyrpc.io
- **Explorer**: https://aeneid.storyscan.xyz
- **Faucet**: Available for testnet IP tokens

### Token Economics

- **Base Reward**: 10 TIP per chapter read
- **Daily Limit**: 20 chapters max per user
- **Streak Bonus**: 10% per consecutive day (max 100%)
- **Creator Royalty**: 5% of remix fees
- **Supply Cap**: 10B TIP tokens maximum

## 📖 API Reference

### Story Generation API

**POST** `/api/generate`

```typescript
interface GenerateRequest {
  plotDescription: string; // Max 500 characters
  genre: string; // From predefined list
  mood: string; // From predefined list
  emoji: string; // Selected emoji
  chapterNumber?: number; // For multi-chapter stories
}

interface GenerateResponse {
  success: boolean;
  data: {
    title: string;
    content: string;
    wordCount: number;
    readingTime: number;
    themes: string[];
  };
}
```

## 🧪 Testing Strategy

### Smart Contract Tests

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Cross-contract interactions
- **Fuzz Testing**: Edge case discovery
- **Gas Optimization**: Efficient operations

### Frontend Tests

- **Component Tests**: UI component behavior
- **Integration Tests**: Web3 wallet interactions
- **E2E Tests**: Complete user workflows

## 📁 Documentation

Comprehensive documentation available in the `/docs` folder:

- **📋 Product**: [`PROPOSAL.md`](./docs/product/PROPOSAL.md) - Product vision & roadmap
- **🎨 Design**: [`WIREFRAMES.md`](./docs/design/WIREFRAMES.md) - UI/UX specifications
- **⚙️ Technical**: [`TECHSTACK.md`](./docs/technical/TECHSTACK.md) - Technical architecture
- **🖥️ Frontend**: [`FRONTEND.md`](./docs/design/FRONTEND.md) - Frontend implementation guide

## 🛠️ Development Workflow

1. **Smart Contract Development**

   - Write contracts in `packages/contracts/src/`
   - Add comprehensive tests in `test/`
   - Use Foundry for compilation and testing

2. **Frontend Development**

   - Build UI components in `apps/frontend/src/`
   - Use shared types from `packages/shared/`
   - Integrate with contracts via generated ABIs

3. **Deployment Process**
   - Deploy contracts to Story Protocol testnet
   - Update contract addresses in shared constants
   - Deploy frontend to Vercel with automatic CD

## 🎯 Current Development Status

### ✅ Completed

- Monorepo architecture with npm workspaces
- Core smart contracts (TIP token, rewards system)
- Frontend with AI story generation
- MetaMask integration for Story Protocol
- Foundry development environment

### 🚧 In Progress

- Creator & remix reward controllers
- Smart contract testing suite
- SDK package for contract interactions

### 📋 Planned

- Story Protocol testnet deployment
- End-to-end reward claiming flow
- Story NFT minting as IP assets
- Advanced creator tools & analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write comprehensive tests for smart contracts
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **GitHub**: [@AndyBoWu](https://github.com/AndyBoWu)
- **Live Site**: [testnet.storyhouse.vip](https://testnet.storyhouse.vip)
- **Documentation**: [docs/](./docs/)

---

_Built with ❤️ for the Story Protocol ecosystem_
