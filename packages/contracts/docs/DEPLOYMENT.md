# Deployment Guide

## Overview

This guide covers deployment of the StoryHouse.vip smart contract architecture, including both V1 (legacy) and V2 (current) contracts.

## Contract Deployment Order

### V2 Deployment (2-Contract Architecture)

1. **TIPToken.sol** - Platform token (already deployed on testnet)
2. **HybridRevenueControllerV2.sol** - Permissionless revenue sharing with integrated chapter access

## Environment Setup

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install

# Verify environment
forge --version
cast --version
```

### Environment Variables

```bash
# Network Configuration
export STORY_RPC_URL="https://rpc.odyssey.storyhub.io"
export STORY_TESTNET_RPC="https://testnet.storyhub.io"

# Deployment Keys
export PRIVATE_KEY="your_deployer_private_key"
export DEPLOYER_ADDRESS="your_deployer_address"

# Contract Configuration
export TIP_INITIAL_SUPPLY="1000000000000000000000000000"  # 1B TIP
export TIP_SUPPLY_CAP="10000000000000000000000000000"     # 10B TIP

# Verification (optional)
export ETHERSCAN_API_KEY="your_api_key"
```

## Local Development Deployment

### Start Local Network

```bash
# Terminal 1: Start Anvil
anvil --host 0.0.0.0 --port 8545

# Note the default accounts and private keys from anvil output
```

### Deploy to Local Network

```bash
# Deploy all contracts
forge script script/Deploy.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast

# Check deployment result
cat deployment-result.json
```

## Testnet Deployment

### Story Protocol Testnet

```bash
# Deploy to Story testnet
forge script script/Deploy.s.sol \
    --rpc-url $STORY_TESTNET_RPC \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify

# Monitor deployment
forge script script/Deploy.s.sol \
    --rpc-url $STORY_TESTNET_RPC \
    --private-key $PRIVATE_KEY \
    --resume
```

### Alternative Minimal Deployment

```bash
# Deploy only essential contracts
forge script script/DeployMinimal.s.sol \
    --rpc-url $STORY_TESTNET_RPC \
    --private-key $PRIVATE_KEY \
    --broadcast
```

## Mainnet Deployment

### Pre-deployment Checklist

- [ ] All tests passing (`forge test`)
- [ ] Gas optimization verified (`forge snapshot`)
- [ ] Security audit completed
- [ ] Deployment script tested on testnet
- [ ] Emergency procedures documented
- [ ] Multi-sig wallet configured (recommended)

### Production Deployment

```bash
# Deploy to Story Protocol mainnet
forge script script/Deploy.s.sol \
    --rpc-url $STORY_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --slow  # Use slower deployment for stability
```

## Post-Deployment Configuration

### 1. Contract Verification

```bash
# Verify contracts on block explorer
forge verify-contract \
    --chain-id 1515 \
    --compiler-version 0.8.20+commit.a1b79de6 \
    CONTRACT_ADDRESS \
    src/TIPToken.sol:TIPToken \
    --constructor-args $(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS)
```

### 2. Initial Configuration

```bash
# Add HybridRevenueControllerV2 as TIP minter  
cast send $TIP_TOKEN_ADDRESS \
    "addMinter(address)" \
    $HYBRID_REVENUE_CONTROLLER_V2_ADDRESS \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL

# Grant STORY_MANAGER_ROLE (if using V1)
cast send $CHAPTER_ACCESS_CONTROLLER_ADDRESS \
    "grantRole(bytes32,address)" \
    $(cast keccak "STORY_MANAGER_ROLE") \
    $BACKEND_ADDRESS \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL
```

### 3. Frontend Configuration

Update frontend configuration with deployed addresses:

```typescript
// contracts.config.ts
export const CONTRACTS = {
  TIP_TOKEN: "0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E",
  HYBRID_REVENUE_CONTROLLER_V2: "0x...", // Deploy and update
};
```

## Deployment Scripts

### script/Deploy.s.sol

Main deployment script that deploys all contracts in correct order with proper configuration.

```solidity
// Deploys:
// 1. TIPToken (if not already deployed)
// 2. HybridRevenueControllerV2
// 3. Configures permissions and roles
```

### script/DeployMinimal.s.sol

Minimal deployment for testing or specific use cases.

```solidity
// Deploys:
// 1. HybridRevenueControllerV2 (using existing TIP token)
```

### script/DeployTIPToken.s.sol

Token-only deployment for testing or separate token deployment.

## Upgrade Strategies

### V1 to V2 Migration

#### Option 1: Parallel Deployment
1. Deploy V2 contracts alongside V1
2. Update frontend to use V2 for new books
3. Maintain V1 support for existing books
4. Gradual user migration

#### Option 2: Proxy Upgrade (Future)
1. Implement proxy pattern in future versions
2. Enable seamless contract upgrades
3. Maintain state across upgrades

### Configuration Migration

```bash
# Script to migrate essential configuration from V1 to V2
# (Customize based on your specific needs)

# Copy admin roles
ADMIN_ROLE=$(cast call $V1_CONTRACT "ADMIN_ROLE()" --rpc-url $RPC_URL)
cast send $V2_CONTRACT \
    "grantRole(bytes32,address)" \
    $ADMIN_ROLE \
    $ADMIN_ADDRESS \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL

# Update minter permissions
cast send $TIP_TOKEN \
    "addMinter(address)" \
    $V2_CONTRACT \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL
```

## Monitoring & Maintenance

### Health Checks

```bash
# Check contract state
cast call $TIP_TOKEN "totalSupply()" --rpc-url $RPC_URL
cast call $TIP_TOKEN "supplyCap()" --rpc-url $RPC_URL

# Check permissions
cast call $TIP_TOKEN "minters(address)" $HYBRID_REVENUE_CONTROLLER_V2 --rpc-url $RPC_URL

# Check contract balances
cast balance $TIP_TOKEN --rpc-url $RPC_URL
```

### Emergency Procedures

```bash
# Pause contracts in emergency
cast send $TIP_TOKEN "pause()" --private-key $ADMIN_PRIVATE_KEY --rpc-url $RPC_URL
cast send $HYBRID_REVENUE_CONTROLLER_V2 "pause()" --private-key $ADMIN_PRIVATE_KEY --rpc-url $RPC_URL

# Unpause when resolved
cast send $TIP_TOKEN "unpause()" --private-key $ADMIN_PRIVATE_KEY --rpc-url $RPC_URL
cast send $HYBRID_REVENUE_CONTROLLER_V2 "unpause()" --private-key $ADMIN_PRIVATE_KEY --rpc-url $RPC_URL
```

## Troubleshooting

### Common Issues

1. **Gas Estimation Failures**
   - Solution: Use `--gas-limit` flag with higher value
   - Check: Network congestion and gas prices

2. **Verification Failures**
   - Solution: Ensure exact compiler version match
   - Check: Constructor arguments encoding

3. **Permission Errors**
   - Solution: Verify deployer has required roles
   - Check: Deployment script role assignments

4. **Transaction Reverts**
   - Solution: Use `cast run` to simulate transactions
   - Check: Contract state and input validation

### Debug Commands

```bash
# Simulate transaction before sending
cast run $TX_HASH --rpc-url $RPC_URL

# Check transaction receipt
cast receipt $TX_HASH --rpc-url $RPC_URL

# Debug with traces
cast run $TX_HASH --trace --rpc-url $RPC_URL
```