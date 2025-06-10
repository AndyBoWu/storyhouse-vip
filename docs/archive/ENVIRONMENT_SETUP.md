# 🔧 Environment Setup for Story Protocol Integration

This guide covers the environment variables needed for real blockchain integration with Story Protocol.

## 📋 **Required Environment Variables**

Create a `.env.local` file in your project root with the following variables:

```bash
# OpenAI API Key for story generation
OPENAI_API_KEY=your_openai_api_key_here

# Story Protocol Configuration
STORY_PROTOCOL_RPC_URL=https://testnet.storyrpc.io
STORY_PROTOCOL_CHAIN_ID=1315

# Alternative Story Protocol endpoints
# STORY_PROTOCOL_RPC_URL=https://rpc.odyssey.storyrpc.io  # Odyssey testnet
# STORY_PROTOCOL_CHAIN_ID=1516

# For production (when available)
# STORY_PROTOCOL_RPC_URL=https://rpc.story.foundation
# STORY_PROTOCOL_CHAIN_ID=1

# Note: WalletConnect not used - app uses direct MetaMask integration

# Database (for storing IP operation tracking)
DATABASE_URL=postgresql://username:password@localhost:5432/storyhouse_vip

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Rate Limiting and Caching
REDIS_URL=redis://localhost:6379

# NFT Contract Addresses (will be deployed)
STORY_NFT_CONTRACT_ADDRESS=
IP_ASSET_REGISTRY_CONTRACT_ADDRESS=

# Story Protocol Contract Addresses (pre-deployed on testnet)
STORY_PROTOCOL_IP_ASSET_REGISTRY=
STORY_PROTOCOL_LICENSING_MODULE=
STORY_PROTOCOL_ROYALTY_MODULE=
STORY_PROTOCOL_DISPUTE_MODULE=

# Gas Configuration
MAX_GAS_PRICE=50000000000  # 50 gwei
MAX_GAS_LIMIT=500000
GAS_BUFFER_PERCENTAGE=20

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_ENV=development
```

## 🔑 **Getting Your Keys**

### **1. Story Protocol Private Key**

- Create a new wallet for Story Protocol testnet
- Fund it with testnet tokens from the [Story Protocol Faucet](https://testnet.storyrpc.io/faucet)
- Export the private key (without 0x prefix)

### **2. OpenAI API Key**

- Sign up at [OpenAI Platform](https://platform.openai.com)
- Create an API key in your dashboard
- Add credits to your account

### **3. Database Setup**

- Install PostgreSQL locally or use a cloud provider
- Create a database named `storyhouse_vip`
- Update the DATABASE_URL with your credentials

## 🌐 **Network Configuration**

### **Story Protocol Odyssey Testnet**

```bash
Network Name: Story Protocol Odyssey
RPC URL: https://testnet.storyrpc.io
Chain ID: 1513
Currency Symbol: IP
Block Explorer: https://odyssey.storyscan.xyz
```

### **Adding to MetaMask**

1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Fill in the testnet details above

## 🔧 **Testing Your Setup**

Run this command to test your environment:

```bash
# Test Story Protocol connection
npm run test:connection

# Test OpenAI integration
npm run test:openai

# Test database connection
npm run test:db
```

## ⚡ **Quick Setup Script**

```bash
#!/bin/bash
# setup-env.sh

echo "Setting up StoryHouse.vip environment..."

# Copy environment template
cp docs/env.template .env.local

echo "✅ Environment template created"
echo "📝 Please edit .env.local with your actual values"
echo "🔑 Don't forget to fund your wallet with testnet tokens!"
echo "🌐 Add Story Protocol testnet to MetaMask"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your keys"
echo "2. Run: npm run test:connection"
echo "3. Run: npm run dev"
```

## 🚨 **Security Notes**

- **Never commit private keys to git**
- Use different keys for development and production
- Keep your `.env.local` file in `.gitignore`
- Use environment-specific wallets
- Monitor your testnet token balance

## 📞 **Getting Help**

If you encounter issues:

1. **Check the logs**: `npm run logs`
2. **Verify network**: Use the block explorer
3. **Test connection**: `npm run test:connection`
4. **Join Discord**: [Story Protocol Community](https://discord.gg/storyprotocol)

---

**Next**: [Real Blockchain Integration Guide](./BLOCKCHAIN_INTEGRATION.md)
