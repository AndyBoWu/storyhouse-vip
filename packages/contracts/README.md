# StoryHouse Smart Contracts

## 🎯 Minimal Architecture (2 Contracts Only)

This repository contains the minimal smart contracts needed for StoryHouse.vip, leveraging Story Protocol SDK for most functionality.

### Contracts

1. **TIPToken.sol** - ERC20 platform token (already deployed: `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`)
2. **HybridRevenueControllerV2.sol** - Permissionless revenue distribution (70/20/10 split)

### Why Only 2 Contracts?

Story Protocol SDK handles:
- ✅ IP Registration (`ipAsset.register`)
- ✅ NFT Minting (`mintAndRegisterIpAssetWithPilTerms`)
- ✅ Licensing (`license.attachTerms`)
- ✅ Derivatives (`ipAsset.registerDerivative`)
- ✅ Disputes (`dispute.initiateDispute`)
- ✅ Collections (`group.createGroup`)

We only need custom contracts for:
- 💰 **TIP Token** - Story Protocol doesn't support custom payment tokens
- 📊 **Revenue Distribution** - Handle author/curator/platform splits

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
│   └── HybridRevenueControllerV2.sol     # Permissionless revenue sharing
├── lib/                         # Dependencies (git submodules)
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

1. **TIPToken.sol** - Platform token with 10B supply cap
2. **HybridRevenueControllerV2.sol** - Permissionless revenue sharing (70/20/10 split)

### Key Features

**HybridRevenueControllerV2:**
- ✅ **Permissionless**: Anyone can register books without admin approval
- ✅ **Revenue Splits**: 70% author, 20% curator, 10% platform
- ✅ **Translation Support**: Translators can be set as curators for fair compensation
- ✅ **Chapter Attribution**: Track different authors per chapter
- ✅ **Gas Optimized**: Minimal external dependencies

### Integration with Story Protocol

The frontend directly calls Story Protocol SDK for:
- IP registration and management
- NFT minting and transfers
- License creation and enforcement
- Derivative registration
- Dispute resolution

Our contracts only handle:
- TIP token transfers
- Revenue distribution logic

## 🧪 Testing Standards

### Test Naming Convention
- All test files use **`*.t.sol`** suffix (Foundry standard)
- Test contracts end with **`Test`** (e.g., `TIPTokenTest`)
- Test functions start with **`test`** (e.g., `testMinting`)

### Test Coverage Achievements ✅
- **Structural Coverage**: 100% (5/5 contracts have test files)
- **Functional Coverage**: 100% line coverage achieved (220+ comprehensive tests)
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