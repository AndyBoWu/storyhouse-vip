# StoryHouse.vip Development Guide

**Last Updated**: December 2024
**Architecture**: Monorepo with Foundry Smart Contracts

## 🏗️ Project Overview

StoryHouse.vip is built as a monorepo containing a Next.js frontend and Foundry smart contracts for the Story Protocol blockchain. This guide covers the complete development workflow.

## 📁 Repository Structure

```
storyhouse-vip/
├── apps/
│   └── frontend/              # Next.js 15 + TypeScript frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── pages/         # Next.js pages
│       │   ├── hooks/         # Custom hooks
│       │   ├── utils/         # Utility functions
│       │   └── types/         # TypeScript type definitions
│       ├── public/            # Static assets
│       └── styles/            # Global styles
├── packages/
│   ├── contracts/            # Smart contracts & tests
│   │   ├── src/              # Solidity source files
│   │   ├── test/             # Foundry test suites
│   │   ├── script/           # Deployment scripts
│   │   ├── foundry.toml      # Foundry configuration
│   │   ├── remappings.txt    # Import remappings
│   │   └── .env.example      # Environment template
│   ├── shared/              # Shared TypeScript utilities
│   │   ├── src/
│   │   │   ├── types/        # Shared type definitions
│   │   │   ├── constants/    # Shared constants
│   │   │   └── utils/        # Shared utilities
│   │   └── package.json
│   └── sdk/                 # Contract interaction SDK (planned)
├── tools/
│   └── scripts/             # Automation scripts
└── docs/                    # Documentation
    ├── technical/           # Technical specifications
    ├── product/             # Product requirements
    └── design/              # UI/UX documentation
```

## 🚀 Quick Start

### Prerequisites

```bash
# Required tools
node --version    # >= 18.0.0
npm --version     # >= 8.0.0
forge --version   # Foundry for smart contracts
```

### Installation

```bash
# Clone repository
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip

# Install all dependencies
npm install

# Install Foundry dependencies
cd packages/contracts
forge install
cd ../..
```

### Environment Setup

```bash
# Frontend environment (apps/frontend/.env.local)
OPENAI_API_KEY=your_openai_api_key_here

# Contracts environment (packages/contracts/.env)
PRIVATE_KEY=your_ethereum_private_key
STORY_RPC_URL=https://aeneid.storyrpc.io
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 💻 Development Workflow

### Frontend Development

```bash
# Start Next.js development server
npm run dev

# Build for production
npm run build

# Lint and format code
npm run lint
npm run format
```

**Frontend Tech Stack:**

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Web3**: Wagmi + Viem for blockchain interactions
- **AI**: OpenAI GPT-4o integration
- **Animations**: Framer Motion

### Smart Contract Development

```bash
# Navigate to contracts package
cd packages/contracts

# Compile contracts
forge build

# Run tests with gas reporting
forge test --gas-report

# Run tests with coverage
forge coverage

# Format Solidity code
forge fmt

# Clean build artifacts
forge clean
```

**Contract Architecture:**

- **TIPToken.sol**: ERC-20 token with controlled minting
- **AccessControlManager.sol**: Role-based permission system
- **RewardsManager.sol**: Central reward orchestration
- **ReadRewardsController.sol**: Reading reward mechanics
- **CreatorRewardsController.sol**: Creator incentive system
- **RemixLicensingController.sol**: Remix licensing and royalties

### Shared Package Development

```bash
# Build shared types and utilities
npm run build:shared

# Use in other packages
import { Story, Chapter } from '@storyhouse/shared'
import { formatTipTokens } from '@storyhouse/shared/utils'
```

## 🧪 Testing Strategy

### Smart Contract Testing

```bash
cd packages/contracts

# Run all tests
forge test

# Run specific test file
forge test --match-path test/TIPToken.t.sol

# Run with gas profiling
forge test --gas-report

# Fuzz testing (property-based)
forge test --fuzz-runs 10000
```

**Test Coverage:**

- Unit tests for individual contract functions
- Integration tests for cross-contract interactions
- Fuzz testing for edge cases and security
- Gas optimization analysis

### Frontend Testing

```bash
# Component tests (planned)
npm run test

# E2E tests (planned)
npm run test:e2e
```

## 🚀 Deployment

### Smart Contract Deployment

```bash
cd packages/contracts

# Deploy to local Anvil node
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Story Protocol testnet
forge script script/Deploy.s.sol --rpc-url $STORY_RPC_URL --broadcast --verify

# Verify contracts on block explorer
forge verify-contract --chain 1315 <contract_address> <contract_name>
```

**Deployment Checklist:**

- [ ] Update contract addresses in shared constants
- [ ] Verify source code on block explorer
- [ ] Configure initial contract parameters
- [ ] Test contract interactions on frontend

### Frontend Deployment

```bash
# Automatic deployment via Vercel
git push origin main

# Manual deployment
npm run build
# Deploy to your preferred hosting provider
```

**Live Environment:**

- **Production**: [testnet.storyhouse.vip](https://testnet.storyhouse.vip)
- **Staging**: Automatic Vercel preview deployments
- **Local**: http://localhost:3000

## 🔗 Story Protocol Integration

### Network Configuration

```typescript
// packages/shared/src/constants/networks.ts
export const STORY_TESTNET = {
  chainId: 1315,
  name: "Story Protocol Testnet",
  rpcUrl: "https://aeneid.storyrpc.io",
  blockExplorer: "https://aeneid.storyscan.xyz",
  currency: {
    name: "IP Token",
    symbol: "IP",
    decimals: 18,
  },
};
```

### MetaMask Integration

```typescript
// Direct MetaMask integration without wagmi
const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  await window.ethereum.request({
    method: "wallet_requestPermissions",
    params: [{ eth_accounts: {} }],
  });

  // Switch to Story Protocol testnet
  await switchToStoryNetwork();
};
```

## 📦 Package Management

### Workspace Commands

```bash
# Install dependency in specific workspace
npm install lodash --workspace=apps/frontend

# Run command in specific workspace
npm run test --workspace=packages/contracts

# Build all packages
npm run build:all

# Clean all node_modules
npm run clean
```

### Cross-Package Dependencies

```json
// apps/frontend/package.json
{
  "dependencies": {
    "@storyhouse/shared": "*"
  }
}
```

## 🔧 Development Tools

### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "JuanBlanco.solidity"
  ]
}
```

### Git Hooks

```bash
# Pre-commit hooks via Husky
npm run lint        # ESLint checks
npm run format      # Prettier formatting
npm run type-check  # TypeScript compilation
forge test          # Smart contract tests
```

## 🐛 Debugging

### Frontend Debugging

```bash
# Debug Next.js
DEBUG=* npm run dev

# Inspect Web3 calls
console.log(window.ethereum)

# Check contract interactions
# Use browser console with MetaMask
```

### Contract Debugging

```bash
# Debug with Foundry
forge test --debug <test_name>

# Use console logging in tests
import "forge-std/console.sol";
console.log("Debug value:", someVariable);

# Gas profiling
forge test --gas-report
```

## 🔒 Security Considerations

### Smart Contract Security

```bash
# Static analysis (planned)
slither packages/contracts/src/

# Test coverage
forge coverage

# Formal verification (planned)
# Use Certora or similar tools
```

### Frontend Security

```bash
# Dependency auditing
npm audit

# Environment variable validation
# Never commit .env files
# Use validation in CI/CD
```

## 📊 Monitoring

### Development Metrics

- **Contract Tests**: 100% pass rate required
- **Gas Usage**: Monitor for optimization opportunities
- **Bundle Size**: Keep frontend builds optimized
- **Type Coverage**: Maintain strict TypeScript compliance

### Production Monitoring

- **Contract Events**: Monitor reward distributions
- **User Interactions**: Track wallet connections and transactions
- **Error Rates**: Monitor for failed transactions
- **Performance**: Page load times and Web3 responsiveness

## 🤝 Contributing

### Code Standards

- **TypeScript**: Strict mode enabled
- **Solidity**: OpenZeppelin standards
- **Formatting**: Prettier for JS/TS, forge fmt for Solidity
- **Testing**: Comprehensive coverage required
- **Documentation**: Update docs with new features

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation as needed
4. Ensure all checks pass
5. Request review from maintainers

---

## 📚 Additional Resources

- **Foundry Book**: [book.getfoundry.sh](https://book.getfoundry.sh)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Story Protocol**: [docs.story.foundation](https://docs.story.foundation)
- **OpenZeppelin**: [docs.openzeppelin.com](https://docs.openzeppelin.com)

---

_For questions or issues, please refer to the [project documentation](./docs/) or create an issue on GitHub._
