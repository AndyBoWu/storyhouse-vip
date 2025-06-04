# StoryHouse.vip

AI-powered storytelling platform built on Story Protocol Layer 1 blockchain with read-to-earn tokenomics using $TIP tokens.

## ✨ Features

- **📚 Read & Earn**: Earn $TIP tokens for every chapter you read with anti-gaming mechanisms
- **🤖 AI-Powered Writing**: Create stories with GPT-4o assistance and multi-modal inputs
- **🔄 Remix & Earn**: Remix existing stories and earn licensing fees through recursive creativity
- **💰 Progressive Paywall**: First 3 chapters free, chapter 4+ require token payments
- **⚔️ Reading Streaks**: Bonus rewards for consecutive daily reading
- **🔗 MetaMask Integration**: Seamless Web3 wallet connection on Story Protocol testnet
- **🎯 Creator Rewards**: Comprehensive reward system for story creation and engagement
- **🛡️ Access Control**: Role-based permission system for all contract operations
- **📊 Analytics**: Global statistics and user performance tracking

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
│   │   ├── src/              # Smart contract source code
│   │   ├── test/             # Comprehensive test suites
│   │   ├── script/           # Deployment scripts
│   │   └── foundry.toml      # Foundry configuration
│   ├── shared/              # Shared types & utilities
│   └── sdk/                 # Contract interaction SDK (planned)
├── tools/
│   └── scripts/             # Deployment & automation
└── docs/                    # Comprehensive documentation
    ├── technical/           # Technical specifications
    ├── product/             # Product requirements
    └── design/              # UI/UX documentation
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
- **Testing**: Comprehensive test coverage (95%+)

### Shared (packages/shared)

- **Types**: Comprehensive TypeScript interfaces
- **Constants**: Network configs, validation patterns
- **Utils**: Token formatting, address truncation

## 💎 Smart Contract Architecture

### Core Contracts (All Deployed & Tested)

1. **TIPToken.sol** - ERC-20 token with controlled minting

   - Supply cap management (10B max, 1B initial)
   - Authorized minter system
   - Pausable transfers & burn functionality
   - ✅ **28 tests** (25/28 passing)

2. **RewardsManager.sol** - Central reward orchestration

   - Unified reward distribution across all controllers
   - Cross-controller state management
   - Global statistics tracking
   - Batch operations for gas efficiency
   - ✅ **20 tests** covering all functionality

3. **AccessControlManager.sol** - Role-based permission system

   - Role-based access control with expiry support
   - Cross-contract permission management
   - Emergency admin functions & role delegation
   - Batch role operations
   - ✅ **21 tests** covering access patterns

4. **ReadRewardsController.sol** - Chapter reading rewards

   - Anti-gaming mechanisms (time limits, daily caps)
   - Reading streak bonuses (up to 100% extra)
   - Chapter metadata tracking & session-based claiming
   - ✅ **14 tests** covering reading mechanics

5. **CreatorRewardsController.sol** - Story creation & engagement rewards

   - Story/chapter creation rewards
   - Engagement-based rewards (reads, likes, shares)
   - Quality assessment bonuses
   - Milestone achievement system
   - ✅ **18 tests** covering creator incentives

6. **RemixLicensingController.sol** - Remix fee distribution & licensing
   - Multiple license types (standard, premium, exclusive)
   - Royalty distribution to original creators
   - Remix chain tracking & fee management
   - ✅ **20 tests** covering licensing mechanics

### Contract Integration

All contracts are fully integrated with comprehensive cross-contract testing:

- **RewardsManager** coordinates all reward distributions
- **AccessControlManager** handles permissions across all contracts
- **TIP Token** is the unified reward currency
- Each controller specializes in specific reward mechanisms

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

# Run comprehensive test suite
npm run contracts:test
```

### Smart Contract Development

```bash
# Navigate to contracts package
cd packages/contracts

# Install Foundry dependencies
forge install

# Compile all contracts
forge build

# Run full test suite with gas reporting
forge test --gas-report

# Run specific contract tests
forge test --match-contract TIPTokenTest
forge test --match-contract RewardsManagerTest
forge test --match-contract AccessControlManagerTest
forge test --match-contract ReadRewardsControllerTest
forge test --match-contract CreatorRewardsControllerTest
forge test --match-contract RemixLicensingControllerTest

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
npm run contracts:test         # Run comprehensive test suite
npm run contracts:deploy       # Deploy to testnet
npm run contracts:coverage     # Generate test coverage report

# Quality assurance
npm run lint                   # Lint all packages
npm run test:all              # Run all tests (frontend + contracts)

# Shared package
npm run build:all             # Build all packages
npm run clean                 # Clean all node_modules
```

## 🧪 Testing & Quality Assurance

### Smart Contract Testing

- **Framework**: Foundry with comprehensive test coverage
- **Total Tests**: 121 tests across 6 contracts
- **Coverage**: 95%+ line coverage
- **Gas Optimization**: All functions gas-optimized and tested

### Test Categories

1. **Unit Tests**: Individual contract functionality
2. **Integration Tests**: Cross-contract interactions
3. **Access Control Tests**: Permission and role management
4. **Economic Tests**: Token mechanics and reward distribution
5. **Edge Case Tests**: Boundary conditions and error handling
6. **Fuzz Tests**: Property-based testing for robustness

### Continuous Integration

```bash
# Run all tests with coverage
forge test --gas-report --coverage

# Test with different optimization levels
forge test --optimize --optimizer-runs 200
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
- **Creator Story Reward**: 50 TIP per story created
- **Creator Chapter Reward**: 20 TIP per chapter created
- **Remix License Fees**: 100-2000 TIP (based on license type)
- **Creator Royalty**: 5-20% of remix fees
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
  story?: {
    title: string;
    content: string;
    wordCount: number;
  };
  error?: string;
}
```

### Smart Contract Interfaces

#### RewardsManager

```solidity
function distributeReward(address recipient, uint256 amount, string memory rewardType, bytes32 contextId) external;
function addController(address controller, string memory controllerName) external;
function getGlobalStats() external view returns (uint256 totalDistributed, uint256 uniqueRecipients, uint256 remainingSupply);
```

#### ReadRewardsController

```solidity
function startReading(bytes32 storyId, uint256 chapterNumber) external;
function claimChapterReward(bytes32 storyId, uint256 chapterNumber) external;
function setChapterMetadata(bytes32 storyId, uint256 chapterNumber, uint256 wordCount) external;
```

#### CreatorRewardsController

```solidity
function claimStoryCreationReward(bytes32 storyId) external;
function claimChapterCreationReward(bytes32 storyId, uint256 chapterNumber) external;
function distributeEngagementReward(address creator, bytes32 storyId, uint256 readCount) external;
```

## 🔒 Security & Auditing

### Security Measures

- **Access Control**: Role-based permissions with expiry support
- **Reentrancy Protection**: All state-changing functions protected
- **Integer Overflow**: SafeMath equivalent in Solidity ^0.8.20
- **Pausable Operations**: Emergency pause functionality
- **Input Validation**: Comprehensive parameter validation

### Testing Security

- **Unauthorized Access Tests**: Verify role-based restrictions
- **Economic Attack Tests**: Test reward gaming prevention
- **Edge Case Tests**: Boundary condition testing
- **Fuzz Tests**: Random input testing for robustness

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Development Guide](./docs/DEVELOPMENT.md)** - Complete development workflow
- **[Technical Stack](./docs/technical/TECHSTACK.md)** - Detailed technical specifications
- **[Product Proposal](./docs/product/PROPOSAL.md)** - Product requirements and vision
- **[Frontend Design](./docs/design/FRONTEND.md)** - UI/UX implementation details
- **[Wireframes](./docs/design/WIREFRAMES.md)** - Complete UI wireframes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm run test:all`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Workflow

1. **Smart Contracts**: Use Foundry for development and testing
2. **Frontend**: Next.js with TypeScript and Tailwind CSS
3. **Testing**: Comprehensive test coverage required
4. **Documentation**: Update relevant docs with changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://testnet.storyhouse.vip](https://testnet.storyhouse.vip)
- **GitHub**: [https://github.com/AndyBoWu/storyhouse-vip](https://github.com/AndyBoWu/storyhouse-vip)
- **Story Protocol**: [https://storyprotocol.xyz](https://storyprotocol.xyz)
- **Documentation**: [./docs](./docs)

---

Built with ❤️ on Story Protocol by [Andy Bo Wu](https://github.com/AndyBoWu)
