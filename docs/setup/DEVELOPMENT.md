# 🚀 Development Setup Guide

Complete guide for setting up the StoryHouse.vip development environment.

## 🎯 **Prerequisites**

### **Required Software**

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git** latest version
- **VS Code** (recommended) with TypeScript extension

### **Blockchain Requirements**

- **MetaMask** wallet or similar
- **Testnet ETH** for Story Protocol transactions
- **Story Protocol RPC** access

---

## 🏗️ **Project Setup**

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/storyhouse-vip.git
cd storyhouse-vip
```

### **2. Install Dependencies**

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm ls --depth=0
```

### **3. Environment Configuration**

Create `.env.local` in the root directory:

```bash
# Copy example environment file
cp .env.example .env.local
```

**Required Environment Variables:**

```bash
# OpenAI API Key (for story generation)
OPENAI_API_KEY=your_openai_api_key_here

# Story Protocol Configuration
STORY_PROTOCOL_RPC_URL=https://testnet.storyrpc.io
STORY_PROTOCOL_CHAIN_ID=1513
STORY_PROTOCOL_PRIVATE_KEY=your_private_key_here

# Alternative Networks
# STORY_PROTOCOL_RPC_URL=https://rpc.odyssey.storyrpc.io  # Odyssey testnet
# STORY_PROTOCOL_CHAIN_ID=1516

# Wallet Configuration
WALLET_PRIVATE_KEY=your_private_key_for_transactions

# Gas Configuration (optional)
MAX_GAS_PRICE=20000000000  # 20 gwei
MAX_GAS_LIMIT=5000000
GAS_BUFFER_PERCENTAGE=20

# Demo Configuration (optional)
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_MOCK_BLOCKCHAIN_DELAY=2000
```

**⚠️ Security Notes:**

- Never commit `.env.local` to version control
- Store private keys securely
- Use testnet tokens for development
- Rotate keys regularly

---

## 🔧 **Development Workflow**

### **Start Development Server**

```bash
# Start all services
npm run dev

# Or start individual services
npm run dev --workspace=@storyhouse/frontend
npm run build --workspace=@storyhouse/shared
```

### **Build All Packages**

```bash
# Production build
npm run build

# Build order: shared → contracts → frontend
```

### **Run Tests**

```bash
# Run all tests
npm run test

# Smart contract tests specifically
npm run test --workspace=@storyhouse/contracts

# With coverage
npm run test:coverage --workspace=@storyhouse/contracts
```

### **Type Checking**

```bash
# Check all packages
npm run type-check

# Individual packages
npm run type-check --workspace=@storyhouse/shared
npm run type-check --workspace=@storyhouse/frontend
```

### **Linting & Formatting**

```bash
# Lint code
npm run lint --workspace=@storyhouse/frontend

# Format code
npm run format --workspace=@storyhouse/frontend
```

---

## 🏛️ **Workspace Structure**

```
storyhouse-vip/
├── apps/
│   └── frontend/                # Next.js application
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # React components
│       │   └── lib/           # Utility functions
│       ├── public/            # Static assets
│       └── package.json       # Frontend dependencies
│
├── packages/
│   ├── contracts/             # Smart contracts
│   │   ├── contracts/         # Solidity contracts
│   │   ├── test/             # Contract tests
│   │   └── scripts/          # Deployment scripts
│   │
│   └── shared/               # Shared utilities
│       ├── src/
│       │   ├── types/        # TypeScript types
│       │   ├── services/     # Business logic
│       │   ├── config/       # Configuration
│       │   └── utils/        # Utility functions
│       └── package.json      # Shared dependencies
│
├── docs/                     # Documentation
└── package.json            # Root workspace config
```

---

## 🔗 **Blockchain Setup**

### **1. Wallet Configuration**

Create a new wallet for development:

```bash
# Using MetaMask or other wallet
# Export private key (keep secure!)
# Add to .env.local as STORY_PROTOCOL_PRIVATE_KEY
```

### **2. Get Testnet Tokens**

**Story Protocol Faucet:**

- Visit: https://faucet.story.foundation
- Connect wallet
- Request testnet tokens
- Verify balance

### **3. Test Blockchain Connection**

```bash
# Run integration test
npm run test:blockchain

# Expected output: Connection successful
```

---

## 🧪 **Testing Strategy**

### **Smart Contract Tests**

```bash
# Run contract tests
npm run test --workspace=@storyhouse/contracts

# Coverage report
npm run coverage --workspace=@storyhouse/contracts

# Gas report
npm run gas-report --workspace=@storyhouse/contracts
```

### **Frontend Tests**

```bash
# Unit tests
npm run test:unit --workspace=@storyhouse/frontend

# Integration tests
npm run test:integration --workspace=@storyhouse/frontend

# E2E tests
npm run test:e2e --workspace=@storyhouse/frontend
```

### **API Tests**

```bash
# Test API endpoints
npm run test:api --workspace=@storyhouse/frontend
```

---

## 🚀 **Deployment Testing**

### **Local Production Build**

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

### **Environment Testing**

```bash
# Test with different environments
NODE_ENV=production npm run dev
NODE_ENV=staging npm run dev
```

---

## 🛠️ **Development Tools**

### **Recommended VS Code Extensions**

- TypeScript Hero
- Solidity
- Prettier
- ESLint
- Tailwind CSS IntelliSense

### **Useful Commands**

```bash
# Clean and reinstall
npm run install:clean

# Check dependency security
npm audit
npm audit fix

# Update dependencies
npm update --workspaces

# Check workspace integrity
npm ls --depth=0
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**1. TypeScript Errors**

```bash
# Clean TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

**2. Dependency Conflicts**

```bash
# Clean and reinstall
npm run install:clean
```

**3. Blockchain Connection Issues**

```bash
# Check environment variables
cat .env.local | grep STORY_PROTOCOL

# Test connection
npm run test:blockchain
```

**4. Build Failures**

```bash
# Build in order
npm run build --workspace=@storyhouse/shared
npm run build --workspace=@storyhouse/contracts
npm run build --workspace=@storyhouse/frontend
```

### **Debug Mode**

```bash
# Enable debug logging
DEBUG=storyhouse:* npm run dev

# Verbose npm output
npm run dev --verbose
```

---

## 📊 **Performance Monitoring**

### **Build Performance**

```bash
# Analyze bundle size
npm run analyze --workspace=@storyhouse/frontend

# Check build times
time npm run build
```

### **Runtime Performance**

- Use Next.js built-in analytics
- Monitor blockchain transaction times
- Track API response times

---

## 🔄 **Git Workflow**

### **Branch Strategy**

```bash
# Feature development
git checkout -b feature/new-feature
npm run dev
# Make changes
npm run test
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### **Pre-commit Checks**

```bash
# Before committing
npm run type-check
npm run lint
npm run test
npm run build
```

---

## ✅ **Development Checklist**

Before starting development:

- [ ] Node.js >= 18.0.0 installed
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Blockchain wallet set up with testnet tokens
- [ ] All tests passing
- [ ] Development server running on http://localhost:3000

---

**Ready to build the future of chapter-level IP monetization! 🚀**
