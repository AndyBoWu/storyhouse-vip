# Smart Contract Documentation

This directory contains comprehensive documentation for the StoryHouse.vip smart contract architecture.

## 📚 Documentation Index

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
Complete architectural overview of the smart contract system including:
- Current V2 architecture design
- Contract relationships and dependencies  
- Security principles and anti-farming measures
- Migration strategies from V1 to V2

### 📖 [CONTRACTS.md](./CONTRACTS.md) 
Detailed documentation for each smart contract including:
- Contract purposes and key features
- Function signatures and parameters
- Event definitions and use cases
- Security considerations and best practices

### 📝 [CHANGELOG.md](./CHANGELOG.md)
Historical record of all contract changes including:
- V2 architecture and security improvements
- Removed contracts and rationale
- Breaking changes and migration notes
- Feature additions and deprecations

### 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md)
Complete deployment guide covering:
- Local, testnet, and mainnet deployment procedures
- Environment setup and configuration
- Post-deployment verification steps
- Upgrade strategies and troubleshooting

## 🎯 Quick Navigation

### For Developers
- **Getting Started**: See [main README](../README.md) for setup instructions
- **Testing**: Foundry test commands and coverage requirements
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

### For Deployers  
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide
- **Configuration**: Contract setup and role management
- **Monitoring**: Health checks and emergency procedures

### For Auditors
- **Security**: [ARCHITECTURE.md](./ARCHITECTURE.md) for security principles
- **Changes**: [CHANGELOG.md](./CHANGELOG.md) for recent modifications
- **Contracts**: [CONTRACTS.md](./CONTRACTS.md) for detailed implementation

## 🔍 Key Features

### Current Architecture (V2)
- **4 Core Contracts**: Streamlined from 5-contract architecture
- **Permissionless**: Anyone can register books without admin approval
- **Anti-Farming**: Eliminated automatic rewards prone to bot exploitation
- **Gas Optimized**: Reduced cross-contract calls and dependencies

### Security Highlights
- ✅ **OpenZeppelin v5** battle-tested security patterns
- ✅ **ReentrancyGuard** protection on all external calls  
- ✅ **AccessControl** role-based permissions
- ✅ **Pausable** emergency controls
- ✅ **Comprehensive Testing** with edge case coverage

### Business Model
- **Revenue Sharing**: 70% author, 20% curator, 10% platform
- **Chapter Pricing**: Free chapters 1-3, 0.5 TIP for chapters 4+
- **Permissionless Registration**: Authors control their own books
- **IP Integration**: Story Protocol compatibility

## 🚦 Contract Status

| Contract | Status | Purpose |
|----------|--------|---------|
| TIPToken.sol | ✅ Active | Platform token with controlled minting |
| ChapterAccessController.sol | ✅ Active | Chapter monetization and access control |
| HybridRevenueControllerV2.sol | ✅ Active | Permissionless revenue sharing |
| HybridRevenueControllerV2Standalone.sol | ✅ Active | Dependency-free version |
| HybridRevenueController.sol | 🔄 Legacy | V1 - maintained for backward compatibility |
| RewardsManager.sol | ❌ Removed | Eliminated due to farming vulnerabilities |
| UnifiedRewardsController.sol | ❌ Removed | Automatic rewards removed |

## 🔧 Development Workflow

### 1. Read Documentation
- Start with [main README](../README.md) for overview
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [CONTRACTS.md](./CONTRACTS.md) for specific contract details

### 2. Local Development
```bash
# Install and build
forge install && forge build

# Run tests  
forge test

# Coverage analysis
forge coverage
```

### 3. Deployment
- Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
- Test on local/testnet before mainnet
- Verify contracts and configure permissions

### 4. Integration
- Update frontend with new contract addresses
- Test end-to-end functionality
- Monitor for any issues

## 📞 Support

### Documentation Issues
- Missing information? Create an issue or PR
- Unclear explanations? Suggest improvements
- Found errors? Submit corrections

### Contract Questions  
- Security concerns? Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- Implementation details? Check [CONTRACTS.md](./CONTRACTS.md)
- Deployment help? Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

### Development Help
- Testing guidance in [main README](../README.md)
- Code examples in individual contract docs
- Best practices in architecture documentation

---

**Ready to build the future of Web3 storytelling!** 🎯

For the most up-to-date information, always refer to the contract source code and tests in the `/src` and `/test` directories.