# StoryHouse Smart Contracts

## 🔨 Foundry Development Environment

This project uses **[Foundry](https://book.getfoundry.sh/)** as the primary smart contract development framework for Solidity development, testing, and deployment.

### Why Foundry?
- ⚡ **Fast**: Written in Rust, significantly faster than Hardhat
- 🧪 **Advanced Testing**: Built-in fuzzing, invariant testing, and gas profiling
- 🏗️ **Native Solidity**: Write tests in Solidity, no JavaScript required
- 📦 **Built-in Tools**: Forge (build/test), Cast (CLI), Anvil (local node)

## 📋 Prerequisites

### Install Foundry
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
anvil --version
```

### Install Dependencies
```bash
# Install git submodules (OpenZeppelin, forge-std)
forge install

# Alternative: Update existing dependencies
forge update
```

## 🏗️ Project Structure

```
packages/contracts/
├── src/                          # Smart Contracts (Production)
│   ├── TIPToken.sol             # Platform token with 10B supply cap
│   └── HybridRevenueControllerV2.sol     # PERMISSIONLESS revenue sharing + chapter access (V2)
├── deployments/                 # Deployment Information
│   ├── addresses.ts             # SINGLE SOURCE OF TRUTH for contract addresses
│   ├── story-testnet.json       # Network deployment registry
│   └── README.md                # Deployment documentation
├── test/                        # Test Files (Foundry *.t.sol)
│   ├── TIPToken.t.sol          # Platform token tests
│   └── HybridRevenueControllerV2.t.sol  # V2 tests
├── script/                      # Deployment Scripts (Foundry *.s.sol)
├── lib/                         # Dependencies (git submodules)
├── out/                         # Compiled artifacts
├── index.ts                     # Package entry point
├── foundry.toml                 # Foundry configuration
└── README.md                    # This file
```

## 📍 Contract Addresses - Single Source of Truth

**IMPORTANT**: All contract addresses are maintained in `/deployments/addresses.ts`

### Current Deployment (Story Protocol Testnet)

| Contract | Address | Status | Date |
|----------|---------|--------|------|
| TIP Token | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | ✅ Active | 2024-12-xx |
| HybridRevenueControllerV2 | `0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6` | ✅ Active | 2025-06-29 |

### Recent Updates (2025-06-29)
- **HybridRevenueControllerV2 Updated**: Removed derivative book registration
- **Contract enforces**: Only original books can be registered
- **Added**: `updateTotalChapters()` admin function
- **Deployed to**: Block 6105838

### Usage in Frontend/Backend

```typescript
import { ADDRESSES } from '@storyhouse/contracts';

// Use addresses
const tipToken = ADDRESSES.TIP_TOKEN;
const hybridController = ADDRESSES.HYBRID_REVENUE_CONTROLLER_V2;
```

⚠️ **WARNING**: Never hardcode addresses. Always import from the contracts package.

## 🧪 Testing Commands

### Run All Tests
```bash
forge test
```

### Run Tests with Verbosity
```bash
forge test -vvv    # Show detailed test output
forge test -vvvv   # Show traces for failing tests
```

### Run Specific Test Contract
```bash
forge test --match-contract TIPTokenTest
forge test --match-contract UnifiedRewardsControllerTest
```

### Run Specific Test Function
```bash
forge test --match-test testMinting
forge test --match-test testReadingRewards
```

### Test Coverage Analysis
```bash
# Generate coverage report
forge coverage

# Generate detailed coverage with lcov report
forge coverage --report lcov

# Generate coverage for specific contract
forge coverage --match-contract TIPToken
```

### Gas Usage Analysis
```bash
# Show gas usage for all tests
forge test --gas-report

# Snapshot gas usage (save to .gas-snapshot)
forge snapshot

# Compare gas usage with snapshot
forge snapshot --diff
```

## 🔧 Building & Compilation

### Compile Contracts
```bash
forge build
```

### Clean Build Artifacts
```bash
forge clean
```

### Check for Compilation Issues
```bash
forge build --sizes    # Show contract sizes
forge build --force    # Force recompilation
```

## 🚀 Deployment

### Local Development (Anvil)
```bash
# Start local blockchain
anvil

# Deploy to local network (in another terminal)
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

### Testnet Deployment
```bash
# Deploy to Story Protocol Testnet
forge script script/Deploy.s.sol --rpc-url $STORY_TESTNET_RPC --private-key $PRIVATE_KEY --broadcast --verify
```

## 🧰 Development Tools

### Interactive Console (Cast)
```bash
# Check contract balance
cast balance 0x... --rpc-url $RPC_URL

# Call contract function
cast call 0x... "totalSupply()" --rpc-url $RPC_URL

# Send transaction
cast send 0x... "mint(address,uint256)" 0x... 1000000000000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

### Code Formatting
```bash
# Format Solidity code
forge fmt

# Check formatting without changes
forge fmt --check
```

## 📊 Architecture Overview

### Minimal 2-Contract Architecture
This repository contains a **minimal smart contract architecture** focused on core monetization and permissionless book management:

1. **TIPToken.sol** - Platform token with 10B supply cap, minting roles, and pausable transfers
2. **HybridRevenueControllerV2.sol** - **PERMISSIONLESS** multi-author revenue sharing (70/20/10 split) with integrated chapter access control

**Key Changes:**
- ❌ **Removed RewardsManager.sol** - Eliminated complex reward system prone to farming
- ❌ **Removed UnifiedRewardsController.sol** - No more automatic creation rewards
- ❌ **Removed ChapterAccessController.sol** - Functionality merged into HybridRevenueControllerV2
- ❌ **Removed HybridRevenueController.sol** - V1 replaced by V2
- ✅ **Added HybridRevenueControllerV2** - Permissionless book registration with integrated chapter access

**Security & Architecture Improvements:**
- 🔒 **Eliminated farming vulnerabilities** - Removed automatic creation rewards that were prone to AI/bot farming
- ✅ **Permissionless book registration** - Authors can register their own books without admin approval
- 🛡️ **Simplified architecture** - Fewer contracts means reduced attack surface and gas costs
- 🎯 **Revenue-focused design** - Only genuine chapter purchases generate rewards
- ⚡ **Gas optimized** - Reduced cross-contract calls and external dependencies

### Key Benefits
- ✅ **Permissionless**: Anyone can register books and become a curator
- ✅ **Decentralized**: No admin keys required for book registration
- ✅ **Fair revenue sharing**: 70% author, 20% curator, 10% platform
- ✅ **Anti-farming**: No automatic rewards that can be gamed
- ✅ **Backward compatible**: V2 maintains same interfaces as V1
- ✅ **Flexible deployment**: Standalone version available without dependencies
- ✅ **Battle-tested**: Built on proven OpenZeppelin v5 standards

## 🧪 Testing Standards

### Test Naming Convention
- All test files use **`*.t.sol`** suffix (Foundry standard)
- Test contracts end with **`Test`** (e.g., `TIPTokenTest`)
- Test functions start with **`test`** (e.g., `testMinting`)

### Test Coverage Achievements ✅
- **Structural Coverage**: 100% (2/2 contracts have test files)
- **Functional Coverage**: Comprehensive testing for all functions
- **Edge Cases**: All revert conditions and boundary cases thoroughly tested
- **Integration**: Cross-contract interactions verified
- **Security**: Reentrancy protection and access control fully tested
- **Gas Optimization**: Comprehensive gas usage benchmarks established

### Example Test Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TIPToken.sol";

contract TIPTokenTest is Test {
    TIPToken public token;
    address public owner = address(1);
    
    function setUp() public {
        vm.prank(owner);
        token = new TIPToken(owner, 1000000000 ether, 10000000000 ether);
    }
    
    function testInitialState() public {
        assertEq(token.totalSupply(), 1000000000 ether);
        assertEq(token.balanceOf(owner), 1000000000 ether);
    }
}
```

## 🔍 Code Quality

### Static Analysis
```bash
# Install Slither (optional)
pip install slither-analyzer

# Run static analysis
slither .
```

### Best Practices Enforced
- ✅ **Foundry conventions** for all files and naming
- ✅ **OpenZeppelin** contracts for security standards
- ✅ **AccessControl** integrated directly into contracts
- ✅ **Comprehensive testing** with edge cases and fuzzing
- ✅ **Gas optimization** through architectural improvements

## 📚 Useful Resources

- **Foundry Book**: https://book.getfoundry.sh/
- **Forge Testing**: https://book.getfoundry.sh/forge/tests
- **Cast CLI**: https://book.getfoundry.sh/cast/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Story Protocol**: https://docs.story.foundation/

## 🔧 Configuration

See `foundry.toml` for project configuration including:
- Solidity version (0.8.20)
- Optimizer settings
- Library remappings
- Test configuration

---

## 🚀 Quick Start

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Install dependencies
forge install

# 3. Build contracts
forge build

# 4. Run tests
forge test

# 5. Run with coverage
forge coverage

# 6. Start local development
anvil                                    # Terminal 1: Start local blockchain
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast  # Terminal 2: Deploy contracts
```

**Ready to build the future of Web3 storytelling!** 🎯