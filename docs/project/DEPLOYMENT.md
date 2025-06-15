# 🚀 Deployment Guide

Complete guide for deploying StoryHouse.vip to production with dual Vercel architecture and license management system.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │    │  License        │
│  (Vercel)       │◄──►│  (Vercel)       │◄──►│  Management     │
│  Next.js SPA    │    │  API Routes     │    │  System         │
│  + License UI   │    │  + Story Proto  │    │  (Integrated)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Current Status:** Phase 5.3 Complete - Dual Vercel deployment with comprehensive license management

## 🚀 Deployment Methods

### Option 1: GitHub Actions (Recommended)

StoryHouse uses GitHub Actions for controlled deployments to Vercel.

#### Prerequisites

1. **GitHub Repository Secrets**: Configure these in Settings → Secrets → Actions:
   - `STORYHOUSE_GHA_VERCEL`: Your Vercel authentication token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID_FRONTEND`: Frontend project ID
   - `VERCEL_PROJECT_ID_BACKEND`: Backend project ID

2. **Manual Deployment Workflow**:
   - Navigate to Actions tab in GitHub
   - Select "🚀 Deploy to Vercel (Manual)"
   - Click "Run workflow"
   - Choose which apps to deploy (frontend, backend, or both)
   - Click "Run workflow" to start deployment

#### GitHub Actions Features

- **Selective Deployment**: Choose specific apps to deploy
- **Automatic Project Linking**: Handles Vercel project configuration
- **Build Verification**: Ensures successful builds before deployment
- **Production Deployment**: Uses `--prod` flag for optimized deployments

### Option 2: Manual CLI Deployment

If you prefer manual control or need to deploy outside of GitHub Actions:

#### Prerequisites

1. **Vercel CLI:** Install and authenticate
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Project Structure:** Ensure monorepo structure is correct
   ```
   storyhouse-vip/
   ├── apps/
   │   ├── frontend/    # Next.js frontend
   │   └── backend/     # Next.js API backend
   └── docs/           # Documentation
   ```

#### Frontend Deployment

```bash
# Navigate to frontend directory
cd apps/frontend

# Set up production build
npm run build

# Deploy to Vercel
vercel --prod

# Configure domains (first time only)
vercel domains add storyhouse.vip
vercel domains add testnet.storyhouse.vip
```

#### Backend Deployment

```bash
# Navigate to backend directory
cd apps/backend

# Build the API backend
npm run build

# Deploy to Vercel
vercel --prod

# Configure API domains (first time only)
vercel domains add api.storyhouse.vip
vercel domains add api-testnet.storyhouse.vip
```

## 🌍 Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

### Frontend Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api-testnet.storyhouse.vip  # or api.storyhouse.vip for prod

# Story Protocol Configuration
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_CHAIN_NAME=Story Protocol Testnet (Aeneid)
NEXT_PUBLIC_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_EXPLORER_URL=https://aeneid.storyscan.xyz
```

### Backend Environment Variables

```bash
# Core API Configuration
ENVIRONMENT=production
API_BASE_URL=https://api-testnet.storyhouse.vip

# Story Protocol
STORY_RPC_URL=https://aeneid.storyrpc.io
STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d
STORY_IP_ASSET_REGISTRY=0x77319B4031e6eF1250907aa00018B8B1c67a244b
STORY_LICENSE_REGISTRY=0xbe39E1C756e921BD25DF86e7AAa31106d1eb0424

# AI Services
OPENAI_API_KEY=[your-openai-api-key]
OPENAI_MODEL=gpt-4

# Cloudflare R2 Storage
R2_ACCOUNT_ID=[your-cloudflare-account-id]
R2_ACCESS_KEY_ID=[your-r2-access-key]
R2_SECRET_ACCESS_KEY=[your-r2-secret-key]
R2_BUCKET_NAME=storyhouse-content
R2_PUBLIC_URL=https://storyhouse-content.your-domain.com

# Smart Contract Addresses (Testnet)
TIP_TOKEN_CONTRACT=0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E
REWARDS_MANAGER_CONTRACT=0xf5ae031ba92295c2ae86a99e88f09989339707e5
CREATOR_CONTROLLER_CONTRACT=0x8e2d21d1b9c744f772f15a7007de3d5757eea333
READ_CONTROLLER_CONTRACT=0x04553ba8316d407b1c58b99172956d2d5fe100e5
REMIX_CONTROLLER_CONTRACT=0x16144746a33d9a172039efc64bc2e12445fbbef2
ACCESS_CONTROL_CONTRACT=0x41e2db0d016e83ddc3c464ffd260d22a6c898341
```

### Environment-Specific Configuration

#### Testnet Deployment
```bash
# Frontend
NEXT_PUBLIC_API_BASE_URL=https://api-testnet.storyhouse.vip
NEXT_PUBLIC_ENABLE_TESTNET=true

# Backend  
ENVIRONMENT=testnet
API_BASE_URL=https://api-testnet.storyhouse.vip
```

#### Production Deployment
```bash
# Frontend
NEXT_PUBLIC_API_BASE_URL=https://api.storyhouse.vip
NEXT_PUBLIC_ENABLE_TESTNET=false

# Backend
ENVIRONMENT=production
API_BASE_URL=https://api.storyhouse.vip
```

## 🌐 Domain Configuration

### Add Domains in Vercel

**Frontend Project:**
- Add `storyhouse.vip` and `testnet.storyhouse.vip`

**Backend Project:**
- Add `api.storyhouse.vip` and `api-testnet.storyhouse.vip`

### Configure DNS in Cloudflare

```
# Frontend
A     @               76.76.19.61
CNAME testnet         frontend-testnet.vercel.app

# Backend
CNAME api             backend-prod.vercel.app
CNAME api-testnet     backend-testnet.vercel.app
```

## 📊 Build Configuration

### Frontend vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "regions": ["iad1"]
}
```

### Backend vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "regions": ["iad1"]
}
```

## ✅ Verification & Testing

After deployment, verify all components are working:

### 1. Frontend Verification

```bash
# Test frontend loading
curl -I https://testnet.storyhouse.vip/
curl -I https://storyhouse.vip/

# Expected: 200 OK with proper headers
```

### 2. Backend API Verification

```bash
# Health check
curl https://api-testnet.storyhouse.vip/api/test
curl https://api.storyhouse.vip/api/test

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "environment": "production",
  "services": {
    "r2": "connected",
    "openai": "connected",
    "storyProtocol": "connected"
  }
}
```

### 3. License System Verification

```bash
# Test story retrieval (includes license info)
curl https://api-testnet.storyhouse.vip/api/stories

# Verify license components are loaded in frontend
# Navigate to: https://testnet.storyhouse.vip/write
# Check: License selection UI appears in publishing flow
```

### 4. Story Protocol Integration

```bash
# Verify blockchain connectivity
curl https://api-testnet.storyhouse.vip/api/test

# Check contract addresses in response
# Verify testnet connection is working
```

### 5. Complete Deployment Checklist

- [ ] ✅ Frontend loads at both domains
- [ ] ✅ Backend API responds at `/api/test`
- [ ] ✅ Environment variables are set correctly
- [ ] ✅ DNS records are configured and propagated
- [ ] ✅ SSL certificates are active and valid
- [ ] ✅ License management UI is functional
- [ ] ✅ Story Protocol integration is working
- [ ] ✅ AI story generation is operational
- [ ] ✅ Cloudflare R2 storage is connected
- [ ] ✅ Cross-origin requests work properly
- [ ] ✅ Wallet connection functionality works
- [ ] ✅ Publishing flow with license selection works

### 6. Monitoring & Maintenance

#### Set up monitoring for:
- **Uptime monitoring:** Both frontend and backend
- **API response times:** Monitor `/api/test` endpoint
- **Error tracking:** Check Vercel function logs
- **R2 storage usage:** Monitor Cloudflare R2 metrics
- **Blockchain connectivity:** Story Protocol testnet status

#### Regular maintenance tasks:
- **Weekly:** Check Vercel deployment logs
- **Monthly:** Review environment variable security
- **Quarterly:** Update dependencies and redeploy

## 🔧 GitHub Actions Troubleshooting

### Common Issues and Solutions

1. **"Project not found" Error**
   - Verify all 4 GitHub secrets are correctly set
   - Check that project IDs match your Vercel projects
   - The workflow automatically creates `.vercel/project.json` files

2. **Build Failures**
   - Check the workflow logs for specific errors
   - Ensure all dependencies are properly installed
   - Verify that shared packages build before apps

3. **Authentication Errors**
   - Regenerate your Vercel token if needed
   - Ensure the token has full deployment permissions
   - Check that the token name matches `STORYHOUSE_GHA_VERCEL`

4. **Deployment Not Triggering**
   - Verify you're on the Actions tab
   - Select the correct workflow: "🚀 Deploy to Vercel (Manual)"
   - Ensure you have permissions to run workflows

## 🎯 Post-Deployment Configuration

### Frontend-Backend Communication

Verify the frontend can communicate with the backend:

```javascript
// Test API connection from browser console
fetch('https://api-testnet.storyhouse.vip/api/test')
  .then(response => response.json())
  .then(data => console.log('Backend connection:', data))
```

### License Component Integration

Verify license components are working:

1. **Navigate to writing interface:** https://testnet.storyhouse.vip/write
2. **Test story generation:** Create a sample story
3. **Verify license selection:** Check license tier options appear
4. **Test publishing flow:** Complete the publishing process
5. **Check story display:** Verify license info appears in story view

### Story Protocol Testing

Test blockchain integration:

1. **Connect wallet:** Use MetaMask on Aeneid testnet
2. **Publish chapter:** Complete the full publishing flow
3. **Verify transaction:** Check Story Protocol explorer
4. **Confirm IP registration:** Verify IP asset creation

## 🚀 Success!

Your StoryHouse.vip deployment is now complete with:

- ✅ **Dual Vercel Architecture** - Professional frontend/backend separation
- ✅ **License Management System** - Complete UI for license display and management
- ✅ **Story Protocol Integration** - Blockchain IP asset management
- ✅ **AI Story Generation** - GPT-4 powered content creation
- ✅ **Read-to-Earn Economics** - TIP token rewards system
- ✅ **Professional Domains** - Custom domain configuration
- ✅ **Production Security** - Proper environment variable management

**Ready to revolutionize Web3 publishing!** 🌟