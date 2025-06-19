# 🛠️ TIP Token Developer Guide

**Quick reference for deploying, minting, and testing TIP tokens**

## ✅ Production Ready Status
- **100% test coverage** achieved with 220+ comprehensive tests
- **All critical bugs fixed** including arithmetic underflow protection
- **OpenZeppelin v5 compatible** with latest security features
- **Gas optimized** with efficient storage patterns
- **Reentrancy protected** with comprehensive security measures

---

## 🎯 **Quick Start**

### **Prerequisites**

- Wallet with ≥ 0.001 ETH on Ethereum Mainnet (for testnet faucets)
- Story Protocol Aeneid testnet added to MetaMask
- Foundry installed for contract deployment

### **Network Details**

```
Network Name: Story Protocol Aeneid
RPC URL: https://aeneid.storyprotocol.org
Chain ID: 1516
Currency: IP
```

---

## 🚰 **Getting Testnet IP Tokens (Gas)**

### **QuickNode Faucet** (Recommended)

1. **Visit**: https://faucet.quicknode.com/story/aeneid
2. **Requirements**: Wallet must hold ≥ 0.001 ETH on Ethereum Mainnet
3. **Process**: Connect MetaMask → Select Story Aeneid → Get 1 IP token
4. **Rate Limit**: 1 drip per 12 hours

### **Alternative Faucets**

- **Google Cloud**: https://cloud.google.com/application/web3/faucet/story/aeneid
- **Community Faucets**: Check Discord for additional options

---

## 💎 **Deploying TIP Token Contract**

### **1. Environment Setup**

```bash
cd packages/contracts
cp .env.example .env

# Add to .env:
PRIVATE_KEY="your_private_key_here"
STORY_RPC_URL="https://aeneid.storyprotocol.org"
```

### **2. Deploy Contract**

```bash
# Deploy to Aeneid testnet
forge script script/DeployTIPToken.s.sol:DeployTIPToken \
  --rpc-url $STORY_RPC_URL \
  --broadcast \
  --verify

# Save the deployed contract address
export TIP_TOKEN_ADDRESS="0x..." # from deployment output
```

### **3. Verify Deployment**

```bash
# Check initial supply (should be 1B TIP)
cast call $TIP_TOKEN_ADDRESS "totalSupply()" --rpc-url $STORY_RPC_URL

# Check your balance
cast call $TIP_TOKEN_ADDRESS "balanceOf(address)" $YOUR_ADDRESS --rpc-url $STORY_RPC_URL
```

---

## 🪙 **Minting TIP Tokens**

### **Minting Constraints**

- **Max Supply**: 10B TIP tokens (capped)
- **Current Supply**: 1B TIP (initial mint)
- **Available to Mint**: 9B TIP remaining
- **Minter Role**: Deployer automatically has minting rights

### **Mint Tokens**

```bash
# Set environment variables
export TIP_TOKEN_ADDRESS="your_deployed_contract"
export RECIPIENT_ADDRESS="address_to_receive_tokens"
export MINT_AMOUNT="1000000000000000000000"  # 1,000 TIP tokens

# Run minting script
forge script script/MintTIPTokens.s.sol:MintTIPTokens \
  --rpc-url $STORY_RPC_URL \
  --broadcast
```

### **Common Mint Amounts**

```bash
# Small testing amount (100 TIP)
export MINT_AMOUNT="100000000000000000000"

# Medium testing (10K TIP)
export MINT_AMOUNT="10000000000000000000000"

# Large testing (1M TIP)
export MINT_AMOUNT="1000000000000000000000000"

# Maximum single mint (1B TIP)
export MINT_AMOUNT="1000000000000000000000000000"
```

---

## 📈 **Updating Supply Cap (Optional)**

If you need more than 10B tokens for testing:

```bash
# Increase supply cap to 100B tokens
export TIP_TOKEN_ADDRESS="your_contract"
export NEW_SUPPLY_CAP="100000000000000000000000000000"

forge script script/UpdateSupplyCap.s.sol:UpdateSupplyCap \
  --rpc-url $STORY_RPC_URL \
  --broadcast
```

---

## 🔧 **Integration with Frontend**

### **Contract Configuration**

Update your frontend config with deployed addresses:

```typescript
// apps/frontend/config/contracts.ts
export const TIP_TOKEN_CONFIG = {
  address: "0x..." as `0x${string}`, // Your deployed contract
  abi: TIPTokenABI,
  chainId: 1516, // Story Aeneid
} as const;
```

### **Add to Wagmi Config**

```typescript
// Make sure Story Aeneid is in your wagmi chains config
import { defineChain } from "viem";

const storyAeneid = defineChain({
  id: 1516,
  name: "Story Protocol Aeneid",
  network: "story-aeneid",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://aeneid.storyprotocol.org"] },
  },
  blockExplorers: {
    default: { name: "Story Explorer", url: "https://aeneid.storyscan.xyz" },
  },
});
```

---

## 🧪 **Testing Scenarios**

### **Basic Token Operations**

```bash
# Check balance
cast call $TIP_TOKEN_ADDRESS "balanceOf(address)" $YOUR_ADDRESS

# Transfer tokens
cast send $TIP_TOKEN_ADDRESS "transfer(address,uint256)" $RECIPIENT_ADDRESS $AMOUNT

# Approve spending
cast send $TIP_TOKEN_ADDRESS "approve(address,uint256)" $SPENDER_ADDRESS $AMOUNT
```

### **Reward System Testing**

```bash
# Deploy rewards manager (after TIP token)
forge script script/DeployRewardsManager.s.sol --broadcast

# Test reward distribution
forge script script/TestRewardDistribution.s.sol --broadcast
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**"Supply cap exceeded" Error:**

```bash
# Check current supply vs cap
cast call $TIP_TOKEN_ADDRESS "totalSupply()"
cast call $TIP_TOKEN_ADDRESS "supplyCap()"

# Increase cap if needed (see Update Supply Cap section)
```

**"Not a minter" Error:**

```bash
# Check if address has minter role
cast call $TIP_TOKEN_ADDRESS "minters(address)" $YOUR_ADDRESS

# Add minter role (only owner can do this)
cast send $TIP_TOKEN_ADDRESS "addMinter(address)" $NEW_MINTER_ADDRESS
```

**Low Gas/IP Token Balance:**

```bash
# Check IP balance
cast balance $YOUR_ADDRESS --rpc-url $STORY_RPC_URL

# Get more IP from faucet (see Getting IP Tokens section)
```

### **Useful Commands**

```bash
# Get contract info
cast call $TIP_TOKEN_ADDRESS "name()"
cast call $TIP_TOKEN_ADDRESS "symbol()"
cast call $TIP_TOKEN_ADDRESS "decimals()"

# Check ownership
cast call $TIP_TOKEN_ADDRESS "owner()"

# View recent transfers
cast logs --address $TIP_TOKEN_ADDRESS --from-block latest-100
```

---

## 📚 **Reference Links**

- **Story Protocol Docs**: https://docs.storyprotocol.org
- **Aeneid Explorer**: https://aeneid.storyscan.xyz
- **Foundry Book**: https://book.getfoundry.sh
- **TIP Tokenomics**: [TOKENOMICS_WHITEPAPER.md](./TOKENOMICS_WHITEPAPER.md)

---

## ⚡ **Quick Reference Card**

| Operation            | Command                                                        |
| -------------------- | -------------------------------------------------------------- |
| **Deploy TIP Token** | `forge script script/DeployTIPToken.s.sol --broadcast`         |
| **Mint Tokens**      | `forge script script/MintTIPTokens.s.sol --broadcast`          |
| **Check Balance**    | `cast call $TIP_TOKEN "balanceOf(address)" $ADDRESS`           |
| **Transfer**         | `cast send $TIP_TOKEN "transfer(address,uint256)" $TO $AMOUNT` |
| **Get Testnet IP**   | Visit https://faucet.quicknode.com/story/aeneid                |

**Need help?** Check the [TOKENOMICS_WHITEPAPER.md](./TOKENOMICS_WHITEPAPER.md) for complete economic context.
