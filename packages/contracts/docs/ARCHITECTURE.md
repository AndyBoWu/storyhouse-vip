# Smart Contract Architecture

## Overview

StoryHouse.vip has evolved to a streamlined 4-contract architecture focused on core monetization features and permissionless book management. This document outlines the current contract design and recent architectural changes.

## Current Architecture (V2)

### Core Contracts

1. **TIPToken.sol** - Platform token
2. **ChapterAccessController.sol** - Chapter access and monetization
3. **HybridRevenueControllerV2.sol** - Permissionless revenue sharing
4. **HybridRevenueControllerV2Standalone.sol** - Dependency-free version

### Contract Relationships

```
TIPToken.sol
    ↓ (token transfers)
ChapterAccessController.sol
    ↓ (revenue sharing)
HybridRevenueControllerV2.sol
```

## Key Architectural Changes

### ❌ Removed Contracts

1. **RewardsManager.sol** - Complex reward orchestrator removed due to farming vulnerabilities
2. **UnifiedRewardsController.sol** - Automatic creation rewards removed to prevent bot exploitation

### ✅ Added Contracts

1. **HybridRevenueControllerV2.sol** - Permissionless version of revenue controller
2. **HybridRevenueControllerV2Standalone.sol** - Clean implementation without external dependencies

### 🔄 Updated Contracts

1. **ChapterAccessController.sol** - Removed read-to-earn features, simplified to purchase-only model
2. **HybridRevenueController.sol** - Kept as V1 for backward compatibility

## Design Principles

### 1. Anti-Farming Security
- Eliminated automatic rewards for story/chapter creation
- Only genuine chapter purchases generate revenue
- No rewards for reading completion

### 2. Permissionless Operation
- Anyone can register books without admin approval
- Authors automatically become curators of their books
- No special roles required for book management

### 3. Simplified Dependencies
- Reduced external contract dependencies
- Standalone versions available for key contracts
- Cleaner upgrade paths

### 4. Gas Optimization
- Fewer cross-contract calls
- Reduced state variables
- Optimized for common operations

## Revenue Model

### Revenue Distribution (70/20/10)
- **70%** - Chapter author
- **20%** - Book curator
- **10%** - Platform

### Chapter Pricing
- **Chapters 1-3**: Free access
- **Chapters 4+**: 0.5 TIP per chapter

## Security Features

### Access Control
- Role-based permissions using OpenZeppelin AccessControl
- Admin roles for emergency functions only
- No admin control over user funds or content

### Reentrancy Protection
- ReentrancyGuard on all external calls
- Safe transfer patterns
- State updates before external calls

### Pausability
- Emergency pause functionality
- Admin-only pause controls
- Granular pause per contract

## Migration Path

### From V1 to V2
1. V1 contracts remain operational for existing books
2. New books should use V2 for permissionless registration
3. V2 maintains interface compatibility with V1
4. Optional migration tools for existing books

### Deployment Strategy
1. Deploy V2 contracts alongside V1
2. Update frontend to use V2 for new registrations
3. Gradually migrate existing books (optional)
4. Maintain V1 support for legacy books

## Testing Coverage

All contracts maintain comprehensive test coverage including:
- Unit tests for all functions
- Integration tests for cross-contract interactions
- Edge case testing (zero amounts, overflows)
- Security testing (reentrancy, access control)
- Gas optimization benchmarks

## Future Considerations

### Potential Upgrades
- Proxy pattern implementation for upgradeability
- Multi-token support beyond TIP
- Advanced royalty mechanisms
- Cross-chain deployment

### Monitoring Requirements
- Revenue distribution tracking
- Gas usage optimization
- User adoption metrics
- Security incident response