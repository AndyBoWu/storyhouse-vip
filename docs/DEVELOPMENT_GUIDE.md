# 🚀 Development Guide

Complete guide for setting up and developing StoryHouse.vip's Web3 storytelling platform with PIL licensing and royalty distribution.

## 🎯 Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0  
- **Git** latest version
- **VS Code** (recommended) with TypeScript extension

### Blockchain Requirements

- **MetaMask** wallet or similar
- **Testnet ETH** for Story Protocol transactions
- **Story Protocol RPC** access

---

## 🏗️ Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm ls --depth=0
```

### 3. Environment Configuration

Create environment files for both frontend and backend:

**Frontend (.env.local in apps/frontend/):**
```bash
# OpenAI API Key (for story generation)
OPENAI_API_KEY=your_openai_api_key_here

# Story Protocol Configuration
NEXT_PUBLIC_ENABLE_TESTNET=true
STORY_RPC_URL=https://aeneid.storyrpc.io
STORY_EXPLORER_URL=https://aeneid.storyscan.io
STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d
NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d

# Cloudflare R2 Configuration  
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyhouse-content
R2_ENDPOINT=your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your_account_id.r2.cloudflarestorage.com/storyhouse-content
```

**Backend (.env.local in apps/backend/):**
```bash
# Same as frontend, plus any backend-specific variables
OPENAI_API_KEY=your_openai_api_key_here
STORY_RPC_URL=https://aeneid.storyrpc.io
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyhouse-content
```

### 4. Network Configuration

**Story Protocol Aeneid Testnet:**
```bash
Network Name: Story Protocol Aeneid
RPC URL: https://aeneid.storyrpc.io
Chain ID: 1315
Currency Symbol: IP
Block Explorer: https://aeneid.storyscan.xyz
```

**Adding to MetaMask:**
1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Fill in the testnet details above

---

## 🔧 Development Workflow

### Start Development Servers

```bash
# Start frontend (port 3001)
cd apps/frontend && npm run dev

# Start backend (port 3002) 
cd apps/backend && npm run dev

# Or from root directory
npm run dev:frontend
npm run dev:backend
```

### Build Projects

```bash
# Build frontend
cd apps/frontend && npm run build

# Build backend
cd apps/backend && npm run build

# Build from root
npm run build:frontend
npm run build:backend
```

### Run Tests

```bash
# Smart contract tests
npm run test

# Frontend tests
cd apps/frontend && npm run test

# Backend tests  
cd apps/backend && npm run test
```

### Type Checking

```bash
# Check frontend types
cd apps/frontend && npm run type-check

# Check backend types
cd apps/backend && npm run type-check
```

### Linting & Formatting

```bash
# Lint frontend
cd apps/frontend && npm run lint

# Format frontend
cd apps/frontend && npm run format
```

---

## 🏛️ Project Structure

```
storyhouse-vip/
├── apps/
│   ├── frontend/              # Next.js frontend application
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── lib/             # Frontend utilities
│   │   ├── hooks/           # Custom React hooks
│   │   └── package.json     # Frontend dependencies
│   │
│   └── backend/              # Next.js API backend
│       ├── app/api/         # API routes
│       ├── lib/            # Backend utilities
│       └── package.json    # Backend dependencies
│
├── packages/
│   ├── contracts/           # Smart contracts
│   │   ├── contracts/      # Solidity contracts
│   │   ├── test/          # Contract tests
│   │   └── scripts/       # Deployment scripts
│   │
│   └── shared/             # Shared utilities
│       ├── src/types/     # TypeScript types
│       ├── src/config/    # Configuration
│       └── src/utils/     # Utility functions
│
├── docs/                   # Documentation
└── package.json           # Root workspace config
```

---

## 🔗 Getting API Keys

### 1. OpenAI API Key

- Sign up at [OpenAI Platform](https://platform.openai.com)
- Create an API key in your dashboard
- Add credits to your account
- Add to your `.env.local` files

### 2. Cloudflare R2 Storage

- Create Cloudflare account
- Go to R2 Object Storage
- Create bucket named `storyhouse-content`
- Generate API token with R2 edit permissions
- Add credentials to `.env.local` files

### 3. Story Protocol Setup

- Get testnet tokens from [Story Protocol Faucet](https://aeneid.faucet.story.foundation/)
- No private keys needed - uses MetaMask integration
- Add testnet network to MetaMask

---

## 🧪 Testing Your Setup

### Test API Connections

```bash
# Test backend API
curl http://localhost:3002/api/test

# Test frontend
curl http://localhost:3001/api/test

# Test R2 storage
curl -X POST http://localhost:3002/api/test-r2

# Test Story Protocol
curl -X POST http://localhost:3002/api/story-protocol \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

### Test Blockchain Connection

```bash
# Visit frontend test page
open http://localhost:3001/test-story-protocol

# Check configuration status
# Test blockchain connectivity
# Verify contract addresses
```

---

## 🛠️ Development Tools

### Recommended VS Code Extensions

- TypeScript Hero
- Solidity (if working with contracts)
- Prettier
- ESLint
- Tailwind CSS IntelliSense
- Next.js snippets

### Useful Commands

```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check dependency security
npm audit
npm audit fix

# Update dependencies
npm update

# Check workspace integrity
npm ls --depth=0
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Check what's running on ports 3001/3002
lsof -ti:3001
lsof -ti:3002

# Kill processes if needed
kill -9 $(lsof -ti:3001)
```

**2. TypeScript Errors**
```bash
# Clean TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

**3. Environment Variable Issues**
```bash
# Check if variables are loaded
cat apps/frontend/.env.local | grep OPENAI
cat apps/backend/.env.local | grep R2
```

**4. Blockchain Connection Issues**
```bash
# Test Story Protocol connection
curl -X POST http://localhost:3002/api/story-protocol \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

**5. R2 Storage Issues**
```bash
# Test R2 connection
curl -X POST http://localhost:3002/api/test-r2
```

### Debug Mode

```bash
# Enable debug logging for frontend
DEBUG=* npm run dev

# Check network requests in browser
# Open DevTools → Network tab
```

---

## 📊 Performance Monitoring

### Build Performance

```bash
# Analyze frontend bundle size
cd apps/frontend && npm run analyze

# Check build times
time npm run build
```

### Runtime Performance

- Use Next.js built-in analytics
- Monitor API response times
- Track blockchain transaction times
- Monitor R2 storage performance

---

## 🔄 Git Workflow

### Branch Strategy

```bash
# Feature development
git checkout -b feature/new-feature
npm run dev
# Make changes
npm run test
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Pre-commit Checks

```bash
# Before committing
npm run type-check
npm run lint
npm run test
npm run build
```

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
cd apps/frontend
vercel --prod
```

### Backend Deployment (Vercel)

```bash
cd apps/backend  
vercel --prod
```

### Environment Variables for Production

Set these in Vercel dashboard for each project:

**Frontend:**
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_ENABLE_TESTNET`
- `STORY_RPC_URL`
- `STORY_SPG_NFT_CONTRACT`

**Backend:**
- `OPENAI_API_KEY`
- `STORY_RPC_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

---

## ✅ Development Checklist

Before starting development:

- [ ] Node.js >= 18.0.0 installed
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured in both apps
- [ ] OpenAI API key obtained and added
- [ ] Cloudflare R2 bucket created and configured
- [ ] Story Protocol testnet added to MetaMask
- [ ] Testnet tokens obtained from faucet
- [ ] Frontend running on http://localhost:3001
- [ ] Backend running on http://localhost:3002
- [ ] All API tests passing

---

**Ready to build the future of chapter-level IP monetization! 🚀**