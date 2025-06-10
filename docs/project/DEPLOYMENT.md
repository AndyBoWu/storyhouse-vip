# 🚀 Deployment Guide

Simple guide for deploying StoryHouse.vip to production.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │
│  (Vercel)       │◄──►│  (Vercel)       │
│  Next.js App    │    │  API Routes     │
└─────────────────┘    └─────────────────┘
```

Both frontend and backend are hosted on Vercel with Cloudflare DNS.

## 🚀 Deployment Steps

### Frontend Deployment

```bash
cd apps/frontend
vercel --prod
```

### Backend Deployment

```bash
cd apps/backend
vercel --prod
```

## 🌍 Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

### Required for Both

```bash
# Story Protocol
NEXT_PUBLIC_ENABLE_TESTNET=true
STORY_RPC_URL=https://aeneid.storyrpc.io
STORY_SPG_NFT_CONTRACT=0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d

# OpenAI
OPENAI_API_KEY=[your-key]
```

### Backend Only

```bash
# Cloudflare R2
R2_ACCOUNT_ID=[your-account-id]
R2_ACCESS_KEY_ID=[your-access-key]
R2_SECRET_ACCESS_KEY=[your-secret-key]
R2_BUCKET_NAME=storyhouse-content
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

## ✅ Verification

After deployment, verify:
- [ ] Frontend loads at your domain
- [ ] Backend API responds at `/api/test`
- [ ] Environment variables are set
- [ ] DNS records are configured
- [ ] SSL certificates are active

---

**🚀 Your StoryHouse.vip deployment is ready!**