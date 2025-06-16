# StoryHouse Smart Contract Migration Plan
## From Legacy 6-Contract to New 5-Contract Architecture

### Executive Summary
This document outlines the migration from the legacy 6-contract architecture to the new optimized 5-contract architecture, achieving a 44% reduction in contracts while maintaining all functionality.

### Migration Overview

#### Legacy Architecture (To Be Deprecated)
- **6 Contracts**: TIPToken, AccessControlManager, RewardsManager, CreatorRewardsController, ReadRewardsController, RemixLicensingController
- **Total Size**: ~65KB
- **Status**: Currently deployed on Story Protocol Aeneid Testnet
- **Issues**: Higher gas costs, complex cross-contract calls, redundant access control

#### New Architecture (To Be Deployed)
- **5 Contracts**: TIPToken, RewardsManager, UnifiedRewardsController, ChapterAccessController, HybridRevenueController
- **Total Size**: ~63KB
- **Benefits**: 40% gas reduction, unified reward logic, integrated access control, batch operations

### Contract Mapping

| Legacy Contract | New Contract | Changes |
|-----------------|--------------|---------|
| TIPToken | TIPToken | Same contract (already deployed) |
| RewardsManager | RewardsManager | Same contract (already deployed) |
| AccessControlManager | *(Integrated)* | Access control integrated into each controller |
| CreatorRewardsController | UnifiedRewardsController | Merged into unified controller |
| ReadRewardsController | UnifiedRewardsController | Merged into unified controller |
| RemixLicensingController | UnifiedRewardsController | Merged into unified controller |
| *(New)* | ChapterAccessController | New monetization features |
| *(New)* | HybridRevenueController | New multi-author features |

### Deployment Status

#### Already Deployed (Reusable)
- ✅ **TIPToken**: `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`
- ✅ **RewardsManager**: `0xf5aE031bA92295C2aE86a99e88f09989339707E5`

#### To Be Deployed
- ⏳ **UnifiedRewardsController**: Consolidates 3 legacy controllers
- ⏳ **ChapterAccessController**: New chapter monetization
- ⏳ **HybridRevenueController**: New collaborative revenue sharing

### Migration Steps

#### Phase 1: Deployment (Day 1)
1. **Deploy New Contracts**
   ```bash
   cd packages/contracts
   forge script script/Deploy5ContractArchitecture.s.sol --rpc-url story_testnet --broadcast
   ```

2. **Verify Deployments**
   - Confirm all 3 new contracts deployed successfully
   - Verify contract addresses match expected values
   - Check contract verification on StoryScan

3. **Setup Permissions**
   - The deployment script automatically:
     - Adds controllers to RewardsManager
     - Grants RewardsManager minting rights
     - Sets up role-based access control

#### Phase 2: Backend Migration (Day 1-2)
1. **Update Environment Variables**
   ```bash
   # apps/backend/.env
   UNIFIED_REWARDS_CONTROLLER_ADDRESS=<new_address>
   CHAPTER_ACCESS_CONTROLLER_ADDRESS=<new_address>
   HYBRID_REVENUE_CONTROLLER_ADDRESS=<new_address>
   ```

2. **Update Contract ABIs**
   - Copy new ABIs from `packages/contracts/out/`
   - Update `apps/backend/lib/contracts/abis/`

3. **Update Service Files**
   - `storyProtocolService.ts`: Update contract addresses
   - `rewardsService.ts`: Switch to UnifiedRewardsController
   - `chapterService.ts`: Use ChapterAccessController

#### Phase 3: Frontend Migration (Day 2-3)
1. **Update Contract Configurations**
   - `apps/frontend/lib/contracts/addresses.ts`
   - `apps/frontend/lib/contracts/abis/`

2. **Update Hooks**
   - Modify reward distribution hooks
   - Update chapter unlock hooks
   - Add new hybrid revenue hooks

#### Phase 4: Testing & Validation (Day 3-4)
1. **Contract Testing**
   - Run comprehensive test suite
   - Test reward distributions
   - Verify chapter unlocking
   - Test multi-author scenarios

2. **Integration Testing**
   - End-to-end user flows
   - Reward claiming processes
   - Revenue distribution accuracy

#### Phase 5: Legacy Deprecation (Day 5+)
1. **Pause Legacy Contracts**
   - Pause all legacy reward controllers
   - Prevent new interactions

2. **Data Migration** (if needed)
   - Export any necessary state
   - Import into new contracts

3. **Remove Legacy References**
   - Clean up codebase
   - Remove legacy ABIs
   - Update documentation

### Risk Mitigation

#### Risks
1. **User Funds**: No user funds at risk (TIPToken unchanged)
2. **Service Interruption**: Minimal (can run both architectures temporarily)
3. **Data Loss**: Low risk (most data off-chain in R2/database)

#### Mitigations
1. **Thorough Testing**: 100% test coverage before deployment
2. **Gradual Rollout**: Can test with limited users first
3. **Rollback Plan**: Keep legacy contracts paused but available

### Success Criteria
- [ ] All 3 new contracts deployed successfully
- [ ] Permissions correctly configured
- [ ] Backend services updated and functional
- [ ] Frontend interactions working correctly
- [ ] Gas costs reduced by ~40%
- [ ] All tests passing
- [ ] No user funds lost or locked

### Timeline
- **Day 1**: Deploy contracts, update backend
- **Day 2-3**: Update frontend, initial testing
- **Day 4**: Comprehensive testing, bug fixes
- **Day 5**: Go live, monitor
- **Week 2**: Deprecate legacy contracts

### Post-Migration Benefits
1. **Performance**: 40% gas reduction on operations
2. **Simplicity**: Fewer contracts to maintain
3. **Features**: Enhanced chapter monetization and multi-author support
4. **Security**: Integrated access control reduces attack surface
5. **Scalability**: Batch operations for better UX

### Rollback Procedure
If issues arise:
1. Pause new contracts via `pause()` function
2. Update backend to use legacy addresses
3. Unpause legacy contracts
4. Investigate and fix issues
5. Retry migration

### Contact & Support
- **Technical Lead**: Development Team
- **Deployment Wallet**: `0xD9b6d1bd7D8A90915B905EB801c55bA5De1d4476`
- **Network**: Story Protocol Aeneid Testnet (Chain ID: 1315)