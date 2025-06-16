# Configuration Update Guide for 5-Contract Architecture

This guide details all configuration changes needed to migrate from the legacy 6-contract architecture to the new 5-contract architecture.

## Contract Address Mapping

### Contracts Being Replaced
| Legacy Contract | Legacy Address | New Contract | New Address |
|-----------------|----------------|--------------|-------------|
| AccessControlManager | `0x41e2db0d016e83ddc3c464ffd260d22a6c898341` | *(Integrated)* | N/A |
| CreatorRewardsController | `0x8e2d21d1b9c744f772f15a7007de3d5757eea333` | UnifiedRewardsController | *TBD* |
| ReadRewardsController | `0x04553ba8316d407b1c58b99172956d2d5fe100e5` | UnifiedRewardsController | *TBD* |
| RemixLicensingController | `0x16144746a33d9a172039efc64bc2e12445fbbef2` | UnifiedRewardsController | *TBD* |

### Contracts Being Kept
| Contract | Address | Status |
|----------|---------|--------|
| TIPToken | `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` | ✅ No change |
| RewardsManager | `0xf5aE031bA92295C2aE86a99e88f09989339707E5` | ✅ No change |

### New Contracts
| Contract | Purpose | Address |
|----------|---------|---------|
| ChapterAccessController | Chapter monetization | *TBD* |
| HybridRevenueController | Multi-author revenue | *TBD* |

## Backend Configuration Updates

### 1. Update `/apps/backend/lib/contracts/storyhouse.ts`

```typescript
// Remove these exports
export const ACCESS_CONTROL_MANAGER_ABI = [...];
export const CREATOR_REWARDS_CONTROLLER_ABI = [...];
export const READ_REWARDS_CONTROLLER_ABI = [...];
export const REMIX_LICENSING_CONTROLLER_ABI = [...];

// Add these exports
export const UNIFIED_REWARDS_CONTROLLER_ABI = [...];
export const CHAPTER_ACCESS_CONTROLLER_ABI = [...];
export const HYBRID_REVENUE_CONTROLLER_ABI = [...];

// Update contract addresses
export const STORYHOUSE_CONTRACTS = {
  TIP_TOKEN: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E', // No change
  REWARDS_MANAGER: '0xf5aE031bA92295C2aE86a99e88f09989339707E5', // No change
  UNIFIED_REWARDS_CONTROLLER: '<NEW_ADDRESS>',
  CHAPTER_ACCESS_CONTROLLER: '<NEW_ADDRESS>',
  HYBRID_REVENUE_CONTROLLER: '<NEW_ADDRESS>'
};
```

### 2. Update `/apps/backend/lib/web3/config.ts`

```typescript
export const STORYHOUSE_CONTRACT_CONFIG = {
  TIP_TOKEN: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
  REWARDS_MANAGER: '0xf5aE031bA92295C2aE86a99e88f09989339707E5',
  UNIFIED_REWARDS_CONTROLLER: '<NEW_ADDRESS>',
  CHAPTER_ACCESS_CONTROLLER: '<NEW_ADDRESS>',
  HYBRID_REVENUE_CONTROLLER: '<NEW_ADDRESS>'
} as const;
```

### 3. Update `/apps/backend/lib/config/blockchain.ts`

Update the `contracts` section in the `storyTestnet` configuration.

### 4. Update Service Files

- **`rewardsService.ts`**: Update to use UnifiedRewardsController
- **`chapterService.ts`**: Create new service for ChapterAccessController
- **`revenueService.ts`**: Create new service for HybridRevenueController

## Frontend Configuration Updates

### 1. Update `/apps/frontend/lib/contracts/storyhouse.ts`

Same changes as backend - remove old ABIs, add new ones, update addresses.

### 2. Update `/apps/frontend/lib/web3/config.ts`

Same address updates as backend.

### 3. Update Hooks

- **`useRewards.ts`**: Update to use UnifiedRewardsController
- **`useChapterAccess.ts`**: Create new hook
- **`useHybridRevenue.ts`**: Create new hook

## Environment Variables

No changes needed - contract addresses are hardcoded in TypeScript files, not in .env files.

## API Endpoint Updates

### Endpoints to Update
- `/api/rewards/*` - Update to use UnifiedRewardsController
- `/api/chapters/*` - Update to use ChapterAccessController
- `/api/revenue/*` - Create new endpoints for HybridRevenueController

### Deprecated Endpoints
- `/api/access-control/*` - Remove (integrated into controllers)

## Testing Checklist

After updating configurations:

- [ ] TIP token transfers work
- [ ] Reward distribution works through UnifiedRewardsController
- [ ] Chapter unlocking works through ChapterAccessController
- [ ] Multi-author revenue sharing works through HybridRevenueController
- [ ] All frontend interactions work correctly
- [ ] API endpoints return correct data

## Rollback Plan

If issues occur, revert configurations to use legacy addresses:

1. Restore original `storyhouse.ts` files
2. Restore original `config.ts` files
3. Redeploy frontend and backend
4. Verify legacy contracts still work

## Post-Migration Cleanup

After successful migration:

1. Remove legacy contract ABIs from codebase
2. Remove deprecated API endpoints
3. Update documentation
4. Archive legacy contract code