# 🚀 Development Guide

Complete guide for setting up and developing StoryHouse.vip's revolutionary Web3 storytelling platform with PIL licensing, blockchain derivative registration, AI-powered content analytics, automated notifications, and real-time royalty distribution.

## 🎯 Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0  
- **Git** latest version
- **VS Code** (recommended) with TypeScript extension

### 🏗️ Phase 6.4 Status  
**Current Implementation:** 2-Contract Architecture with Permissionless Publishing
- ✅ **Minimal Architecture**: TIP Token + HybridRevenueControllerV2 only
- ✅ **Permissionless Publishing**: Anyone can publish without admin approval
- ✅ **Full Deployment**: All contracts operational on Story Protocol testnet
- ✅ **Story Protocol Integration**: IP registration, NFTs, and licensing handled by SDK
- ✅ **Legacy Workflow Removed**: Single unified registration path only
- ✅ **Anti-AI Farming Protection**: Secure economics with human-verified rewards

### 🆕 Phase 5.4 Achievements
**Unified IP Registration with Revolutionary Gas Optimization:**
- ✅ **40% Gas Cost Reduction**: Single-transaction registration using `mintAndRegisterIpAssetWithPilTerms`
- ✅ **66% Faster Execution**: Atomic operations with intelligent flow detection
- ✅ **Enhanced R2 Integration**: Automatic metadata generation with SHA-256 verification
- ✅ **Backward Compatible**: Legacy flow support with gradual rollout capability
- ✅ **Production Ready**: Complete API endpoints and frontend hooks implemented

### Previous Phase 5.3 Achievements
**SPA Optimization with Enhanced UI/UX:**
- ✅ Zero commission messaging integrated throughout platform
- ✅ Color-coded chapter states for visual hierarchy
- ✅ Improved publishing workflow (Review → Publish)
- ✅ Enhanced pricing tiers and UX improvements

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
UNIFIED_REGISTRATION_ENABLED=true  # Always enabled - legacy workflow removed

# 2-Contract Architecture (Deployed)
TIP_TOKEN_ADDRESS=0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E
HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812

# Story Protocol handles: IP registration, NFT minting, licensing, derivatives
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
- **Important**: All blockchain transactions are executed client-side with user's wallet
- Backend only handles metadata generation, not blockchain operations
- Add testnet network to MetaMask

---

## 🧪 Testing Your Setup

### Test API Connections

```bash
# Test backend API - Get books list
curl http://localhost:3002/api/books

# Test frontend health check
curl http://localhost:3001/api/version

# Test unified IP registration status
curl -X GET http://localhost:3002/api/ip/register-unified

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

## 🆕 HybridRevenueControllerV2 Development

### Overview
HybridRevenueControllerV2 enables permissionless book registration, removing the need for admin intervention and democratizing the publishing platform.

### Key Development Features

#### 1. Smart Contract Integration
```typescript
// Frontend hook for V2
import { useBookRegistration } from '@/hooks/useBookRegistration'

const { registerBook, isLoading } = useBookRegistration()

// Register book directly from user's wallet
await registerBook({
  bookId: generateBookId(authorAddress, slug),
  authorAddress,
  chapterPrice: parseEther('0.5') // 0.5 TIP
})
```

#### 2. Backend Fallback Logic
```typescript
// Check if V2 is deployed
if (process.env.HYBRID_REVENUE_CONTROLLER_V2_ADDRESS) {
  return {
    success: true,
    message: "Use frontend with MetaMask for permissionless registration",
    v2Address: process.env.HYBRID_REVENUE_CONTROLLER_V2_ADDRESS
  }
}
// Fall back to V1 with admin key
```

#### 3. Environment Configuration
```bash
# Add to .env.local after V2 deployment
HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=0x... # V2 contract address
NEXT_PUBLIC_HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=0x... # For frontend
```

#### 4. Testing V2 Features
```bash
# Deploy V2 locally (from contracts directory)
cd packages/contracts
forge script script/DeployHybridRevenueControllerV2.s.sol --rpc-url $RPC_URL

# Update environment variables with deployed address
# Test permissionless registration via frontend
```

### Migration Path
1. **Deploy V2 Contract**: Use deployment script
2. **Update Environment**: Add V2 addresses to .env files
3. **Test Registration**: Verify permissionless flow works
4. **Monitor Both Versions**: V1 and V2 can coexist
5. **Gradual Migration**: New books use V2, existing remain on V1

### Development Checklist
- [ ] Deploy HybridRevenueControllerV2 to testnet
- [ ] Update frontend and backend environment variables
- [ ] Test permissionless registration flow
- [ ] Verify book discovery functions (getAllBooks, etc.)
- [ ] Test revenue distribution remains at 70/20/10
- [ ] Document deployment address in README

---

## 🔗 Unified IP Registration Flow

### Architecture Overview

The unified registration system uses a client-server separation:

1. **Client-Side (Frontend)**:
   - Executes blockchain transactions with user's MetaMask wallet
   - Uses Story Protocol SDK directly in the browser
   - Handles transaction signing and gas payment

2. **Server-Side (Backend)**:
   - Generates and stores IP metadata only
   - No blockchain operations or private keys
   - Provides metadata URI and hash to frontend

### Implementation Details

```typescript
// Frontend: Client-side blockchain transaction
const storyProtocolClient = createClientStoryProtocolService(userAddress)
const result = await storyProtocolClient.mintAndRegisterWithPilTerms({
  spgNftContract: nftContract,
  metadata: { ipMetadataURI, ipMetadataHash },
  licenseTier: 'premium',
  recipient: userAddress
})

// Backend: Metadata generation only
POST /api/ip/metadata
{
  "story": { ... },
  "licenseTier": "premium"
}
// Returns: { metadataUri, metadataHash }
```

### Key Benefits
- No server-side private keys required
- Users control their own transactions
- 40% gas savings with single transaction
- Clear separation of concerns

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
curl -X GET http://localhost:3002/api/ip/register-unified

# Test derivative registration endpoint
curl -X POST http://localhost:3002/api/derivatives/register \
  -H "Content-Type: application/json" \
  -d '{"derivativeChapterId": "0x123", "parentIpId": "0x456", "authorAddress": "0x789"}'

# Check if SDK is properly initialized
# Note: Debug endpoints have been removed for security
```

**5. R2 Storage Issues**
```bash
# Test R2 connection
# Note: Test endpoints have been removed for security
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
curl -X GET http://localhost:3002/api/ip/register-unified
curl -X GET "http://localhost:3002/api/discovery?type=content-similarity"
curl -X GET http://localhost:3002/api/notifications/0x1234567890abcdef

# 🆕 Verify blockchain connectivity
# Note: Debug endpoints have been removed for security
```

---

## 🚀 Deployment

### Recommended: GitHub Actions (Manual Trigger)

1. Navigate to GitHub repository → Actions tab
2. Select "🚀 Deploy to Vercel (Manual)" workflow
3. Click "Run workflow"
4. Choose which apps to deploy (frontend, backend, or both)
5. Monitor deployment progress in Actions tab

**Prerequisites**: Ensure GitHub repository secrets are configured (see [Deployment Guide](./docs/project/DEPLOYMENT.md))

### Alternative: Manual CLI Deployment

If you need to deploy directly:

```bash
# Frontend
cd apps/frontend
vercel --prod

# Backend
cd apps/backend  
vercel --prod
```

### Environment Variables

For GitHub Actions deployment, configure these as repository secrets:
- `STORYHOUSE_GHA_VERCEL`: Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID_FRONTEND`: Frontend project ID
- `VERCEL_PROJECT_ID_BACKEND`: Backend project ID

Environment variables are managed through Vercel dashboard. See [Deployment Guide](./project/DEPLOYMENT.md) for complete list.

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
- [ ] Story Protocol SDK integration working (test with `/api/ip/register-unified`)
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

---

## 🚀 Deployment

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │    │  License        │
│  (Vercel)       │◄──►│  (Vercel)       │◄──►│  Management     │
│  Next.js SPA    │    │  API Routes     │    │  System         │
│  + License UI   │    │  + Story Proto  │    │  (Integrated)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Deployment Methods

#### Option 1: GitHub Actions (Recommended)

1. **Configure GitHub Secrets** (Settings → Secrets → Actions):
   - `STORYHOUSE_GHA_VERCEL`: Vercel authentication token
   - `VERCEL_ORG_ID`: Vercel organization ID
   - `VERCEL_PROJECT_ID_FRONTEND`: Frontend project ID
   - `VERCEL_PROJECT_ID_BACKEND`: Backend project ID

2. **Deploy via GitHub Actions**:
   - Navigate to Actions tab
   - Select "🚀 Deploy to Vercel (Manual)"
   - Choose apps to deploy (frontend/backend/both)
   - Click "Run workflow"

#### Option 2: Manual CLI Deployment

```bash
# Frontend deployment
cd apps/frontend
npm run build
vercel --prod

# Backend deployment
cd apps/backend
npm run build
vercel --prod
```

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=https://api-testnet.storyhouse.vip
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_RPC_URL=https://aeneid.storyrpc.io
```

#### Backend (.env)
```bash
ENVIRONMENT=production
API_BASE_URL=https://api-testnet.storyhouse.vip
STORY_RPC_URL=https://aeneid.storyrpc.io
OPENAI_API_KEY=[your-key]
R2_ACCOUNT_ID=[your-account-id]
R2_ACCESS_KEY_ID=[your-access-key]
R2_SECRET_ACCESS_KEY=[your-secret-key]
```

### Domain Configuration

1. **Add domains in Vercel**:
   - Frontend: `storyhouse.vip`, `testnet.storyhouse.vip`
   - Backend: `api.storyhouse.vip`, `api-testnet.storyhouse.vip`

2. **Configure DNS**:
   ```
   A     @               76.76.19.61
   CNAME testnet         frontend-testnet.vercel.app
   CNAME api             backend-prod.vercel.app
   CNAME api-testnet     backend-testnet.vercel.app
   ```

### Post-Deployment Verification

```bash
# Frontend health check
curl -I https://testnet.storyhouse.vip/

# Backend API health check
curl https://api-testnet.storyhouse.vip/api/test

# Test Story Protocol integration
curl https://api-testnet.storyhouse.vip/api/test
```

### Deployment Checklist

- [ ] Frontend loads at both domains
- [ ] Backend API responds at `/api/test`
- [ ] Environment variables configured
- [ ] DNS records propagated
- [ ] SSL certificates active
- [ ] License management UI functional
- [ ] Story Protocol integration working
- [ ] AI story generation operational
- [ ] R2 storage connected
- [ ] Wallet connection working
- **Type Safety**: Full TypeScript coverage across all operations