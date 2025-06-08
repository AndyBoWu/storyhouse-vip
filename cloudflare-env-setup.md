# 🔧 Cloudflare Pages Environment Variables Setup

## 📋 **Required Environment Variables**

Go to: **Cloudflare Dashboard → Pages → storyhouse-vip → Settings → Environment Variables**

### **Production Environment Variables**

```bash
# HYBRID ARCHITECTURE - API PROXY
VERCEL_API_URL=https://testnet.storyhouse.vip
NEXT_PUBLIC_API_BASE_URL=https://testnet.storyhouse.vip

# AI Generation
OPENAI_API_KEY=sk-your-openai-key

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=storyhouse-stories
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://stories.storyhouse.vip

# Story Protocol Configuration
STORY_PROTOCOL_RPC_URL=https://testnet.storyrpc.io
STORY_PROTOCOL_CHAIN_ID=1315

# Note: WalletConnect not used - app uses direct MetaMask integration

# Contract Addresses (Testnet)
NEXT_PUBLIC_TIP_TOKEN_ADDRESS=0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E
NEXT_PUBLIC_REWARDS_MANAGER_ADDRESS=0xf5ae031ba92295c2ae86a99e88f09989339707e5
NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=0xBe60c8Fc35003A063BB04d7d9FC7829eDD3Fe1f5
NEXT_PUBLIC_TIP_DISTRIBUTION_ADDRESS=0xF76c479C11051599e2Bd0a3ee08e91b16F0EB2d0
NEXT_PUBLIC_ENGAGEMENT_TRACKER_ADDRESS=0x80f37ABAE1F973C2D31e0B14C14Da02E67AB9bE5
NEXT_PUBLIC_REFERRAL_SYSTEM_ADDRESS=0xc1d96F2993B99d5a6FcBF80F14c1FcdD84F0E973
NEXT_PUBLIC_SPG_NFT_CONTRACT_ADDRESS=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d

# App Configuration
NEXT_PUBLIC_ENABLE_TESTNET=true
NODE_ENV=production
```

### **Preview Environment Variables**
Copy the same variables for the preview environment.

## 🚀 **Setting Variables via CLI**

You can set these environment variables using the Wrangler CLI:

```bash
# Set each environment variable
npx wrangler pages secret put VERCEL_API_URL --project-name storyhouse-vip
# When prompted, enter: https://testnet.storyhouse.vip

npx wrangler pages secret put NEXT_PUBLIC_API_BASE_URL --project-name storyhouse-vip
# When prompted, enter: https://testnet.storyhouse.vip

npx wrangler pages secret put NEXT_PUBLIC_ENABLE_TESTNET --project-name storyhouse-vip
# When prompted, enter: true

# Continue for each variable...
```

Or create a script to set all at once:

```bash
#!/bin/bash
# save as set-cloudflare-env.sh

# API Proxy
echo "https://testnet.storyhouse.vip" | npx wrangler pages secret put VERCEL_API_URL --project-name storyhouse-vip
echo "https://testnet.storyhouse.vip" | npx wrangler pages secret put NEXT_PUBLIC_API_BASE_URL --project-name storyhouse-vip

# Add your actual values for these:
# echo "YOUR_VALUE" | npx wrangler pages secret put OPENAI_API_KEY --project-name storyhouse-vip
```

## 🔄 **After Setting Environment Variables**

1. **Redeploy** to apply the environment variables:
   ```bash
   npx wrangler pages deployment retry --project-name storyhouse-vip
   ```

2. **Test the deployment**:
   ```bash
   curl https://d7cebd16.storyhouse-vip.pages.dev
   ```

## 🧪 **Testing Checklist**

- [ ] Home page loads
- [ ] API proxy works (check network tab)
- [ ] Story generation works (via Vercel backend)
- [ ] Wallet connection works
- [ ] R2 storage operations work
- [ ] All contract addresses load correctly