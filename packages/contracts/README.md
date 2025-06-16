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
│   ├── TIPToken.sol             # Main platform token
│   ├── TIPTokenTestnet.sol      # Testnet version  
│   ├── RewardsManager.sol       # Central reward orchestrator
│   ├── UnifiedRewardsController.sol # Combined Read/Creator/Remix rewards
│   ├── ChapterAccessController.sol  # Chapter monetization
│   └── HybridRevenueController.sol  # Multi-author revenue sharing
├── test/                        # Test Files (Foundry *.t.sol)
│   ├── TIPToken.t.sol
│   ├── TIPTokenTestnet.t.sol
│   ├── RewardsManager.t.sol
│   ├── UnifiedRewardsController.t.sol
│   ├── ChapterAccessController.t.sol
│   └── HybridRevenueController.t.sol
├── script/                      # Deployment Scripts (Foundry *.s.sol)
├── lib/                         # Dependencies (git submodules)
├── out/                         # Compiled artifacts
├── foundry.toml                 # Foundry configuration
└── README.md                    # This file
```

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
forge script script/DeployAll.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

### Testnet Deployment
```bash
# Deploy to Story Protocol Testnet
forge script script/DeployAll.s.sol --rpc-url $STORY_TESTNET_RPC --private-key $PRIVATE_KEY --broadcast --verify

# Or use the optimized deployment script
forge script scripts/deploy-optimized.js --rpc-url $STORY_TESTNET_RPC --private-key $PRIVATE_KEY --broadcast
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

### Optimized 6-Contract Architecture
This repository contains an **optimized smart contract architecture** that was consolidated from 9 to 6 contracts for better gas efficiency and maintainability:

1. **TIPToken.sol** (3.7KB) - Main platform token with minting, burning, and access control
2. **TIPTokenTestnet.sol** (3.6KB) - Testnet version with flexible configuration
3. **RewardsManager.sol** (7.5KB) - Central orchestrator for all reward distributions
4. **UnifiedRewardsController.sol** (20.4KB) - Consolidated Read/Creator/Remix reward logic
5. **ChapterAccessController.sol** (15.3KB) - Chapter monetization with integrated AccessControl
6. **HybridRevenueController.sol** (16.0KB) - Multi-author revenue sharing for collaborative stories

### Key Optimizations
- ✅ **40% fewer contracts** (reduced from 9 to 6)
- ✅ **Integrated AccessControl** (no standalone AccessControlManager)
- ✅ **Unified reward logic** (combined 3 reward controllers into 1)
- ✅ **Gas optimized** architecture with fewer cross-contract calls

## 🧪 Testing Standards

### Test Naming Convention
- All test files use **`*.t.sol`** suffix (Foundry standard)
- Test contracts end with **`Test`** (e.g., `TIPTokenTest`)
- Test functions start with **`test`** (e.g., `testMinting`)

### Test Coverage Goals
- **Structural Coverage**: 100% (6/6 contracts have test files)
- **Functional Coverage**: Target 95%+ line coverage
- **Edge Cases**: All revert conditions tested
- **Integration**: Cross-contract interactions verified

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
forge script script/DeployAll.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast  # Terminal 2: Deploy contracts
```

**Ready to build the future of Web3 storytelling!** 🎯