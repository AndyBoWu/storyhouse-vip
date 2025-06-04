# StoryHouse.vip Technical Architecture

**Owner**: @Andy Wu
**Date**: Updated December 2024
**Version**: 2.0 - Monorepo with Smart Contracts

## **Overview**

StoryHouse.vip is an AI-assisted storytelling platform built on Story Protocol's Layer 1 blockchain with read-to-earn tokenomics. This document outlines the complete technical architecture implemented as a modular monorepo.

---

## **🏗️ Monorepo Architecture**

### **Project Structure**

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

### **Package Management**

- **npm workspaces** - Monorepo dependency management
- **Shared dependencies** - Common packages across workspaces
- **Independent versioning** - Each package maintains its own version
- **Cross-package imports** - Type-safe imports between packages

---

## **💎 Smart Contract Stack (packages/contracts)**

### **Development Framework**

- **Foundry** - Fast, portable, and modular toolkit
  - **forge** - Solidity compilation and testing
  - **cast** - Swiss Army knife for interacting with EVM
  - **anvil** - Local Ethereum node for development
  - **chisel** - Fast, utilitarian, and verbose Solidity REPL

### **Core Contracts**

#### **TIPToken.sol** - ERC-20 Token with Controlled Minting

```solidity
- Supply cap management (10B max, 1B initial)
- Authorized minter system for reward controllers
- Pausable transfers for emergency situations
- Burn functionality for deflationary mechanics
- OpenZeppelin security standards
```

#### **RewardsManager.sol** - Central Reward Orchestration

```solidity
- Unified reward distribution across all controllers
- Cross-controller state management and coordination
- Global statistics tracking and analytics
- Batch operations for gas efficiency
- Comprehensive event logging
```

#### **ReadRewardsController.sol** - Chapter Reading Rewards

```solidity
- Anti-gaming mechanisms (time limits, daily caps)
- Reading streak bonuses (up to 100% extra rewards)
- Chapter metadata tracking (word count, read time)
- Session-based reward claiming system
- Daily limits and anti-farming protection
```

### **Planned Contracts**

- **CreatorRewardsController.sol** - Story creation & engagement rewards
- **RemixLicensingController.sol** - Remix fee distribution & royalties
- **ContentNFT.sol** - Story NFTs as IP assets on Story Protocol

### **Security & Standards**

- **OpenZeppelin Contracts ^5.0.0** - Battle-tested security
- **Solidity ^0.8.20** - Latest language features and optimizations
- **Access Control** - Role-based permissions with Ownable
- **Reentrancy Protection** - ReentrancyGuard for all critical functions
- **Pausable Contracts** - Emergency stop functionality

### **Testing & Quality**

- **Foundry Testing** - Fast Solidity-native testing
- **Fuzz Testing** - Property-based testing for edge cases
- **Gas Optimization** - Gas reports and optimization analysis
- **Coverage Reports** - Comprehensive test coverage tracking

---

## **🖥️ Frontend Stack (apps/frontend)**

### **Core Framework**

- **Next.js 15** - React framework with App Router
  - Server-side rendering (SSR) for SEO
  - API routes for AI story generation
  - Built-in optimization and performance
  - TypeScript strict mode

### **Web3 Integration**

- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **Custom Web3 Provider** - Direct MetaMask integration
- **Story Protocol Support** - Chain ID 1315 (Aeneid testnet)

### **Styling & UI**

- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **Responsive Design** - Mobile-first approach

### **AI Integration**

- **OpenAI GPT-4o** - Primary story generation
- **Vercel AI SDK** - Streamlined AI integration
- **TypeScript Types** - Strict typing for AI responses

---

## **📦 Shared Package (packages/shared)**

### **Type System**

```typescript
// Core entity types
interface Story, Chapter, User, Rewards

// API response types
interface GenerateRequest, GenerateResponse

// Contract interaction types
interface ContractConfig, NetworkConfig
```

### **Constants & Configuration**

```typescript
// Network configurations
STORY_TESTNET_CONFIG = {
  chainId: 1315,
  rpcUrl: "https://aeneid.storyrpc.io",
  explorer: "https://aeneid.storyscan.xyz",
};

// Token economics
REWARD_AMOUNTS = {
  baseChapterReward: "10000000000000000000", // 10 TIP
  maxDailyChapters: 20,
  streakBonusPercentage: 10,
};
```

### **Utility Functions**

```typescript
// Token formatting
formatTipTokens(amount: bigint): string
parseEtherAmount(value: string): bigint

// Address handling
truncateAddress(address: string): string
isValidAddress(address: string): boolean

// Time calculations
calculateReadingTime(wordCount: number): number
getDaysSinceEpoch(): number
```

---

## **🔗 Blockchain Integration**

### **Story Protocol Layer 1**

- **Chain ID**: 1315 (Aeneid testnet)
- **RPC URL**: https://aeneid.storyrpc.io
- **Block Explorer**: https://aeneid.storyscan.xyz
- **Testnet Faucet**: Available for IP tokens

### **Token Economics**

- **Base Reward**: 10 TIP per chapter read
- **Supply Cap**: 10B TIP tokens maximum
- **Initial Supply**: 1B TIP tokens
- **Daily Reading Limit**: 20 chapters per user
- **Streak Bonus**: 10% per consecutive day (max 100%)

### **Contract Deployment Strategy**

```bash
# Local development with Anvil
forge script script/Deploy.s.sol --rpc-url http://localhost:8545

# Story Protocol testnet deployment
forge script script/Deploy.s.sol --rpc-url $STORY_RPC_URL --broadcast --verify
```

---

## **🧪 Testing Strategy**

### **Smart Contract Testing**

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Cross-contract interactions
- **Fuzz Testing**: Property-based edge case discovery
- **Gas Optimization**: Efficiency analysis and reporting
- **Security Testing**: Reentrancy, overflow, access control

### **Frontend Testing**

- **Component Tests**: UI component behavior
- **Integration Tests**: Web3 wallet interactions
- **E2E Tests**: Complete user workflows
- **API Tests**: Story generation endpoints

---

## **🚀 Deployment & DevOps**

### **Smart Contract Deployment**

- **Foundry Scripts** - Automated deployment with verification
- **Environment Management** - Separate configs for testnet/mainnet
- **Contract Verification** - Source code verification on block explorers
- **Upgrade Patterns** - Proxy patterns for contract upgrades

### **Frontend Deployment**

- **Vercel** - Automatic deployments from GitHub
- **Environment Variables** - Secure API key management
- **Preview Deployments** - Branch-based staging environments
- **Custom Domain** - testnet.storyhouse.vip

### **CI/CD Pipeline**

```yaml
# GitHub Actions workflow
- Contract compilation and testing
- Frontend build and type checking
- Automated security checks
- Deployment to staging/production
```

---

## **📊 Monitoring & Analytics**

### **Smart Contract Monitoring**

- **Event Indexing** - Track all reward distributions
- **Gas Usage Analytics** - Optimize transaction costs
- **Contract State Monitoring** - Track token supplies and rewards
- **Security Alerts** - Monitor for unusual activity

### **Application Monitoring**

- **Vercel Analytics** - Performance and user analytics
- **Error Tracking** - Sentry for error monitoring
- **User Behavior** - Reading patterns and engagement
- **Token Metrics** - Reward distribution analytics

---

## **🔒 Security Considerations**

### **Smart Contract Security**

- **OpenZeppelin Standards** - Battle-tested contract libraries
- **Access Controls** - Role-based permissions and modifiers
- **Reentrancy Protection** - Guards against common attacks
- **Emergency Pausing** - Circuit breakers for critical functions
- **Supply Cap Enforcement** - Prevent infinite token minting

### **Frontend Security**

- **Environment Variables** - Secure API key storage
- **Input Validation** - Sanitize all user inputs
- **HTTPS Enforcement** - Secure data transmission
- **Content Security Policy** - XSS protection

---

## **🛠️ Development Tools**

### **Code Quality**

- **TypeScript 5.0+** - Strict type checking across monorepo
- **ESLint** - Consistent code style and error detection
- **Prettier** - Automated code formatting
- **Husky** - Pre-commit hooks for quality gates

### **Package Management**

- **npm workspaces** - Efficient dependency management
- **Shared configurations** - Consistent tooling across packages
- **Version synchronization** - Coordinated releases

---

## **🎯 Current Implementation Status**

### **✅ Completed**

- ✅ Monorepo architecture with npm workspaces
- ✅ Core smart contracts (TIP token, rewards system)
- ✅ Foundry development environment
- ✅ Frontend with AI story generation
- ✅ MetaMask integration for Story Protocol
- ✅ Shared type system and utilities

### **🚧 In Progress**

- 🚧 Creator & remix reward controllers
- 🚧 Comprehensive smart contract testing
- 🚧 Contract deployment scripts
- 🚧 SDK package for contract interactions

### **📋 Planned**

- 📋 Story Protocol testnet deployment
- 📋 End-to-end reward claiming flow
- 📋 Story NFT minting as IP assets
- 📋 Advanced analytics and creator tools
- 📋 Multi-chain support (Ethereum, Base)

---

## **📚 Additional Resources**

- **Foundry Documentation**: [book.getfoundry.sh](https://book.getfoundry.sh)
- **Story Protocol Docs**: [docs.story.foundation](https://docs.story.foundation)
- **OpenZeppelin Contracts**: [docs.openzeppelin.com](https://docs.openzeppelin.com)
- **Wagmi Documentation**: [wagmi.sh](https://wagmi.sh)

---

_This document is updated regularly to reflect the evolving technical architecture of StoryHouse.vip_
