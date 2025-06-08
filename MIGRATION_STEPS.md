# 🚀 Cloudflare Pages Migration Steps

## 📋 **Pre-Migration Checklist**

### **Step 1: Install Wrangler CLI**
```bash
# Install Wrangler globally
npm install -g wrangler

# Or use the local version we added
npm install

# Login to Cloudflare
wrangler auth login
```

### **Step 2: Bundle Size Analysis**
```bash
# Analyze current bundle size
npm run cf:analyze

# Check if it's under 25MB limit
du -sh apps/frontend/.next
```

### **Step 3: Test Local Build**
```bash
# Test the build process
npm run build

# Verify all API routes work
npm run cf:dev
# Visit http://localhost:8788 to test
```

---

## 🌐 **Cloudflare Pages Setup**

### **Step 1: Create Cloudflare Pages Project**

1. **Go to Cloudflare Dashboard** → Pages
2. **Create Application** → Connect to Git
3. **Select Repository**: `andybowu/storyhouse-vip`
4. **Configure Build Settings**:
   ```
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: apps/frontend/.next
   Root directory: /
   ```

### **Step 2: Environment Variables**

Copy all environment variables from Vercel to Cloudflare:

#### **Production Environment**
```bash
# Required for AI Generation
OPENAI_API_KEY=sk-your-openai-key

# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=storyhouse-content
R2_ENDPOINT=your-r2-endpoint.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-r2-endpoint.r2.cloudflarestorage.com/storyhouse-content

# Story Protocol Configuration
STORY_PROTOCOL_RPC_URL=https://testnet.storyrpc.io
STORY_PROTOCOL_CHAIN_ID=1315
# Note: WalletConnect not used - app uses direct MetaMask integration

# App Configuration
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
NODE_ENV=production
```

### **Step 3: Custom Domain Setup**

1. **In Cloudflare Pages** → Custom Domains
2. **Add Domain**: `testnet.storyhouse.vip`
3. **Configure DNS**: 
   - CNAME: `testnet` → `your-project.pages.dev`
   - Or use Cloudflare's automatic DNS

---

## 🧪 **Testing Phase**

### **Step 1: Staging Deployment**
```bash
# Deploy to staging
npm run cf:deploy:staging

# Test all functionality:
# - Story creation with AI
# - Story reading and TOC
# - Wallet connection
# - Blockchain interactions
```

### **Step 2: Performance Testing**
```bash
# Monitor function execution times
npm run cf:tail

# Check for timeout issues on:
# - /api/generate (AI story generation)
# - /api/ip/register (blockchain calls)
```

### **Step 3: Load Testing**
```bash
# Test with realistic traffic
curl -X POST https://your-staging.pages.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{"plotDescription":"Test story","genres":["Mystery"]}'
```

---

## 🎯 **Production Migration**

### **Step 1: DNS Preparation**
```bash
# Lower TTL on existing DNS records
# Set TTL to 300 seconds (5 minutes) 24 hours before migration
```

### **Step 2: Production Deployment**
```bash
# Deploy to production
npm run cf:deploy:production

# Verify deployment
curl https://your-domain.pages.dev/api/stories
```

### **Step 3: DNS Switchover**
1. **Update DNS records** to point to Cloudflare Pages
2. **Monitor traffic** for any issues
3. **Keep Vercel deployment** as backup for 24-48 hours

### **Step 4: SSL and Security**
1. **Verify SSL certificate** is working
2. **Test security headers** are applied
3. **Check CSP policies** if any

---

## 📊 **Post-Migration Monitoring**

### **Key Metrics to Monitor**
- **Page Load Times**: Should improve by 20-50%
- **API Response Times**: Monitor for timeout issues
- **Error Rates**: Should remain at < 0.1%
- **Global Availability**: Test from multiple regions

### **Monitoring Tools**
```bash
# Real-time function logs
wrangler pages deployment tail

# Performance monitoring
wrangler pages deployment list

# Analytics in Cloudflare Dashboard
# Pages → Analytics → Web Vitals
```

---

## 🚨 **Rollback Plan**

If issues occur:

### **Immediate Rollback (DNS)**
1. **Revert DNS** to point back to Vercel
2. **Wait 5-10 minutes** for propagation
3. **Verify service restored**

### **Configuration Rollback**
1. **Check environment variables** are correctly set
2. **Verify build configuration** matches requirements
3. **Test individual API endpoints**

---

## 🎉 **Success Criteria**

- [ ] All pages load correctly
- [ ] All API endpoints respond
- [ ] AI story generation works
- [ ] Wallet connection functions
- [ ] Blockchain transactions succeed  
- [ ] R2 storage operations work
- [ ] Performance meets expectations
- [ ] Cost savings achieved

---

## 🔗 **Useful Commands**

```bash
# Development
npm run cf:dev                    # Local development with Wrangler
npm run cf:deploy:staging         # Deploy to staging
npm run cf:deploy:production      # Deploy to production

# Monitoring
npm run cf:tail                   # View real-time logs
wrangler pages deployment list    # List deployments
wrangler pages deployment tail    # Live function logs

# Troubleshooting
wrangler pages deployment logs    # View deployment logs
wrangler pages project list       # List projects
```

## 🎯 **Next Steps**

1. **Complete bundle analysis**: `npm run cf:analyze`
2. **Test local development**: `npm run cf:dev`
3. **Create staging deployment**: Follow Cloudflare Pages setup
4. **Run comprehensive tests**: All user journeys
5. **Plan production migration**: Schedule DNS switchover

**Ready to proceed with testing!** 🚀