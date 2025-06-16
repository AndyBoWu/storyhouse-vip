# 🔍 Version Checking Guide
**How to verify deployment versions and smart contract status**

## 🚀 **Quick Version Check**

Once your Vercel deployment is complete, you can verify versions using these methods:

### **1. Frontend Version Display** 
Look for the version badge in the bottom-right corner of any page:
- Click the version badge (e.g., `v6.0.0 • 0080e8d`) 
- View detailed deployment information
- See frontend/backend sync status
- Check smart contract addresses

### **2. API Endpoints**

**Frontend Version:**
```bash
curl https://your-frontend-url.vercel.app/api/version
```

**Backend Version:**
```bash
curl https://your-backend-url.vercel.app/api/version
```

## 📊 **What Each Endpoint Returns**

### **Frontend `/api/version`**
```json
{
  "success": true,
  "service": "StoryHouse.vip Frontend",
  "deployment": {
    "gitCommit": "0080e8d",
    "gitBranch": "main", 
    "vercelUrl": "frontend-gurgat8po-andy-wus-...",
    "vercelEnv": "production",
    "appVersion": "6.0.0",
    "architecture": "5-contract-optimized"
  },
  "contracts": {
    "network": "Story Protocol Aeneid Testnet",
    "chainId": 1315,
    "spgNftContract": "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d"
  },
  "phase": "Phase 6.0 Complete - 5-Contract Architecture Deployed"
}
```

### **Backend `/api/version`**
```json
{
  "success": true,
  "service": "StoryHouse.vip Backend API",
  "deployment": {
    "gitCommit": "0080e8d",
    "gitBranch": "main",
    "vercelUrl": "backend-lqs555w37-andy-wus-...",
    "appVersion": "6.0.0",
    "architecture": "5-contract-optimized"
  },
  "contracts": {
    "network": "Story Protocol Aeneid Testnet",
    "chainId": 1315,
    "contracts": {
      "tipToken": "0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E",
      "rewardsManager": "0xf5aE031bA92295C2aE86a99e88f09989339707E5",
      "unifiedRewardsController": "0x741105d6ee9b25567205f57c0e4f1d293f0d00c5",
      "chapterAccessController": "0x1bd65ad10b1ca3ed67ae75fcdd3aba256a9918e3",
      "hybridRevenueController": "0xd1f7e8c6fd77dadbe946ae3e4141189b39ef7b08"
    },
    "testCoverage": "97.3%",
    "totalTests": 182
  }
}
```

## ✅ **Verification Checklist**

### **Deployment Sync Check**
- [ ] Frontend and backend have **same git commit** (e.g., `0080e8d`)
- [ ] Both show **same app version** (`6.0.0`)
- [ ] Both show **same architecture** (`5-contract-optimized`)
- [ ] Both show **same phase** (Phase 6.0 Complete)

### **Smart Contract Verification**
- [ ] All 5 contract addresses match deployed contracts
- [ ] Network shows `Story Protocol Aeneid Testnet`
- [ ] Chain ID is `1315`
- [ ] Test coverage shows `97.3%`

### **Feature Flags Check**
- [ ] `testnetMode: true` (should be true for testnet deployment)
- [ ] `r2StorageConfigured: true` (should be true if R2 is set up)
- [ ] `unifiedRegistrationEnabled` (check if you want to enable 40% gas savings)

## 🔧 **Troubleshooting Version Mismatches**

### **If Frontend/Backend Show Different Commits:**
1. Check GitHub Actions logs for deployment order
2. Verify both deployments completed successfully
3. Re-trigger deployment if needed
4. Clear browser cache and check again

### **If Smart Contract Addresses Don't Match:**
1. Check environment variables in Vercel dashboard
2. Verify contract addresses in `packages/contracts/deployments.json`
3. Ensure environment variables are properly set in GitHub Actions

### **If Version API Returns Error:**
1. Check if the deployment is complete
2. Verify API routes are included in build
3. Check Vercel function logs for errors
4. Test locally first: `npm run dev`

## 🎯 **Quick Commands for Your Current Deployment**

Based on your GitHub Actions output:

```bash
# Frontend version check
curl https://frontend-gurgat8po-andy-wus-projects.vercel.app/api/version

# Backend version check  
curl https://backend-lqs555w37-andy-wus-projects.vercel.app/api/version

# Test a smart contract interaction
curl https://backend-lqs555w37-andy-wus-projects.vercel.app/api/test-pil

# Check environment configuration
curl https://backend-lqs555w37-andy-wus-projects.vercel.app/api/debug-env
```

## 📱 **Visual Version Display Features**

The frontend now includes a **floating version badge** that shows:

1. **Current app version** and **git commit**
2. **Clickable details** with full deployment info
3. **Frontend/backend sync status**
4. **Smart contract information**
5. **Real-time connectivity** to backend

This makes it easy to verify that:
- Latest code is deployed
- Frontend and backend are in sync
- Smart contracts are properly configured
- All services are healthy

## 🚀 **Ready for QA Testing**

Once you see matching versions across frontend/backend and all contract addresses are correct, you can proceed with the QA test cases from `QA_TEST_CASES.md`!

The version information will help you:
- Confirm you're testing the right deployment
- Verify smart contract integration
- Track any issues to specific commits
- Ensure QA results are valid for the current codebase