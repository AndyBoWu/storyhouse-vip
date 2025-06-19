# Smart Contract Architecture

## Overview

StoryHouse.vip has evolved to a minimal 2-contract architecture focused on core monetization features and permissionless book management. This document outlines the current contract design and recent architectural changes.

## Current Architecture (V2)

### Core Contracts

1. **TIPToken.sol** - Platform token (ERC-20)
2. **HybridRevenueControllerV2.sol** - Permissionless revenue sharing with built-in chapter access control

### Contract Relationships

```
TIPToken.sol
    ↓ (token transfers)
HybridRevenueControllerV2.sol
    (handles both chapter access and revenue sharing)
```

## Key Architectural Changes

### ❌ Removed Contracts

1. **RewardsManager.sol** - Complex reward orchestrator removed due to farming vulnerabilities
2. **UnifiedRewardsController.sol** - Automatic creation rewards removed to prevent bot exploitation
3. **ChapterAccessController.sol** - Functionality merged into HybridRevenueControllerV2
4. **HybridRevenueController.sol** (V1) - Legacy version requiring admin permissions

### ✅ Added Contracts

1. **HybridRevenueControllerV2.sol** - Permissionless version with integrated chapter access control

### 🔄 Architecture Benefits

1. **Simplified Design** - Only 2 contracts instead of 5+
2. **Gas Savings** - Fewer cross-contract calls
3. **Unified Logic** - Chapter access and revenue sharing in one contract

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