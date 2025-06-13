# 🚀 Development Guide

Complete guide for setting up and developing StoryHouse.vip's revolutionary Web3 storytelling platform with PIL licensing, blockchain derivative registration, AI-powered content analytics, automated notifications, and real-time royalty distribution.

## 🎯 Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0  
- **Git** latest version
- **VS Code** (recommended) with TypeScript extension

### 🆕 Phase 5.3 Status
**Current Implementation:** Full SPA optimization with enhanced UI/UX completed
- ✅ Zero commission messaging integrated throughout platform
- ✅ Color-coded chapter states for visual hierarchy
- ✅ Improved publishing workflow (Review → Publish)
- ✅ Enhanced pricing tiers and UX improvements
- ✅ Latest Vercel deployments operational

### 🆕 Unified Registration Feature
**Gas-Optimized IP Registration:** Single-transaction flow implemented
- ✅ 40% gas cost reduction via `mintAndRegisterIpAssetWithPilTerms`
- ✅ Automatic R2 metadata generation and SHA-256 verification
- ✅ Feature flag controlled gradual rollout
- ✅ Backward compatible with legacy multi-transaction flow

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

# Feature Flags
UNIFIED_REGISTRATION_ENABLED=false  # Set to true to enable gas optimization
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

# Test Story Protocol SDK
curl -X GET http://localhost:3002/api/test-pil

# 🆕 Test derivative registration system
curl -X POST http://localhost:3002/api/derivatives/register \
  -H "Content-Type: application/json" \
  -d '{
    "derivativeChapterId": "0x1234567890abcdef",
    "parentIpId": "0xfedcba0987654321",
    "authorAddress": "0x9876543210fedcba"
  }'

# 🆕 Test AI-powered auto-registration
curl -X POST http://localhost:3002/api/derivatives/auto-register \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "0x1234567890abcdef",
    "content": "Detective Sarah found another portal...",
    "authorAddress": "0x9876543210fedcba"
  }'

# 🆕 Test notification system
curl -X GET http://localhost:3002/api/notifications/0x9876543210fedcba

# 🆕 Test AI analytics
curl -X GET "http://localhost:3002/api/discovery?type=content-similarity"
```

### Test Blockchain & AI Integration

```bash
# Visit frontend test page
open http://localhost:3001/test-story-protocol

# 🆕 Test derivative analytics dashboard
open http://localhost:3001/creator/royalties

# 🆕 Test family tree visualization
open http://localhost:3001/discovery

# 🆕 Test notification center
open http://localhost:3001/ # Check notification bell in header

# Check configuration status
# Test blockchain connectivity and SDK integration
# Verify contract addresses and derivative registration
# Test AI analysis and notification systems
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

**4. Blockchain & SDK Connection Issues**
```bash
# Test Story Protocol SDK connection
curl -X GET http://localhost:3002/api/test-pil

# Test derivative registration endpoint
curl -X POST http://localhost:3002/api/derivatives/register \
  -H "Content-Type: application/json" \
  -d '{"derivativeChapterId": "0x123", "parentIpId": "0x456", "authorAddress": "0x789"}'

# Check if SDK is properly initialized
curl -X GET http://localhost:3002/api/debug-env
```

**5. R2 Storage Issues**
```bash
# Test R2 connection
curl -X POST http://localhost:3002/api/test-r2
```

**6. 🆕 AI Analysis Issues**
```bash
# Test OpenAI API connection
curl -X POST http://localhost:3002/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test story", "genre": "Mystery"}'

# Test content similarity analysis
curl -X GET "http://localhost:3002/api/discovery?type=content-similarity"
```

**7. 🆕 Notification System Issues**
```bash
# Test notification retrieval
curl -X GET http://localhost:3002/api/notifications/0x1234567890abcdef

# Test notification preferences
curl -X GET http://localhost:3002/api/notifications/preferences/0x1234567890abcdef
```

**8. 🆕 Derivative Registration Issues**
```bash
# Check family tree functionality
curl -X GET http://localhost:3002/api/derivatives/tree/0x1234567890abcdef

# Test license inheritance analysis
curl -X GET http://localhost:3002/api/derivatives/license-inheritance/0x1234567890abcdef
```

### Debug Mode

```bash
# Enable debug logging for frontend
DEBUG=* npm run dev

# 🆕 Enable detailed API logging
DEBUG=api:* npm run dev:backend

# 🆕 Monitor blockchain transactions
DEBUG=blockchain:* npm run dev:backend

# 🆕 Debug AI analysis operations
DEBUG=ai:* npm run dev:backend

# Check network requests in browser
# Open DevTools → Network tab
# Monitor WebSocket connections for real-time notifications
# Check Console for blockchain transaction logs
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
- Monitor API response times (target: <2s for standard, <5s for blockchain)
- Track blockchain transaction times and gas usage
- Monitor cloud storage performance and caching efficiency
- 🆕 **AI Analysis Performance**: Content similarity analysis <3s
- 🆕 **Notification Latency**: Real-time delivery <2s
- 🆕 **Family Tree Queries**: Unlimited depth traversal performance
- 🆕 **Background Processing**: Monitor 6-hour notification cycles

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

# 🆕 Test key integrations
curl -X GET http://localhost:3002/api/test-pil
curl -X GET "http://localhost:3002/api/discovery?type=content-similarity"
curl -X GET http://localhost:3002/api/notifications/0x1234567890abcdef

# 🆕 Verify blockchain connectivity
curl -X GET http://localhost:3002/api/debug-env
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

**Basic Setup:**
- [ ] Node.js >= 18.0.0 installed
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured in both apps
- [ ] OpenAI API key obtained and added
- [ ] Cloudflare R2 bucket created and configured
- [ ] Story Protocol testnet added to MetaMask
- [ ] Testnet tokens obtained from faucet

**Development Environment:**
- [ ] Frontend running on http://localhost:3001
- [ ] Backend running on http://localhost:3002
- [ ] All API tests passing

**🆕 Advanced Features:**
- [ ] Story Protocol SDK integration working (test with `/api/test-pil`)
- [ ] AI content analysis operational (test with `/api/discovery`)
- [ ] Derivative registration endpoints responding
- [ ] Notification system functional
- [ ] Family tree visualization loading
- [ ] Analytics dashboard accessible at `/creator/royalties`

**🆕 Blockchain Integration:**
- [ ] SDK can register derivatives on testnet
- [ ] License inheritance analysis working
- [ ] Economic projections calculating correctly
- [ ] Family tree queries returning data

**🆕 AI & Notifications:**
- [ ] OpenAI content similarity analysis working
- [ ] Real-time notification delivery <2s
- [ ] Background monitoring operational
- [ ] Notification preferences saving correctly

---

**Ready to build the future of AI-powered blockchain derivative registration and chapter-level IP monetization! 🚀**

---

## 🔗 **SDK Integration Workflow**

### Derivative Registration Development Flow

1. **AI Content Analysis**
   ```bash
   # Test similarity detection
   curl -X GET "http://localhost:3002/api/discovery?type=content-similarity"
   ```

2. **Manual Derivative Registration**
   ```bash
   # Register derivative on blockchain
   curl -X POST http://localhost:3002/api/derivatives/register \
     -H "Content-Type: application/json" \
     -d '{"derivativeChapterId": "0x123", "parentIpId": "0x456"}'
   ```

3. **AI-Powered Auto-Registration**
   ```bash
   # Let AI detect and register
   curl -X POST http://localhost:3002/api/derivatives/auto-register \
     -H "Content-Type: application/json" \
     -d '{"chapterId": "0x123", "content": "Story content..."}'
   ```

4. **Family Tree Visualization**
   ```bash
   # Query relationship tree
   curl -X GET http://localhost:3002/api/derivatives/tree/0x123
   ```

### AI-Blockchain Bridge Architecture

The platform seamlessly bridges AI analysis with blockchain registration:

1. **Content Ingestion** → AI analyzes for similarity and quality
2. **Parent Detection** → AI identifies potential derivative relationships  
3. **License Validation** → SDK checks parent license compatibility
4. **Blockchain Registration** → Story Protocol SDK registers derivative
5. **Economic Calculation** → Revenue sharing and royalty projections
6. **Real-time Notifications** → Alert all stakeholders

### Development Tips

- **Simulation Mode**: Test blockchain operations without real transactions
- **AI Thresholds**: Configure similarity detection sensitivity (default: 0.7)
- **Caching**: AI analysis results cached for 24 hours for performance
- **Error Handling**: Graceful fallback for both AI and blockchain failures
- **Type Safety**: Full TypeScript coverage across all operations