# SDK Upgrade and PIL Implementation Plan

## Overview
This plan covers the high-priority tasks for upgrading Story Protocol SDK from v1.3.1 to v1.3.2 and implementing the PIL (Programmable IP License) licensing system. This represents Phase 1 (Weeks 1-3) of the comprehensive Story Protocol enhancement roadmap.

## Current Problem Analysis
- **SDK Version Gap**: Currently using v1.3.1, latest is v1.3.2 with breaking changes
- **Limited IP Features**: Only ~20% of SDK capabilities implemented
- **No Licensing System**: PIL licensing not yet integrated
- **Disabled Features**: Some blockchain features temporarily disabled during migration

## Strategy and Approach
1. Test SDK compatibility in isolated environment first
2. Fix breaking changes incrementally
3. Implement PIL licensing as the foundation for advanced features
4. Ensure backward compatibility where possible

## Implementation Steps

### Task 1: Test SDK v1.3.2 Compatibility (2-4 hours)
**Priority**: High  
**Status**: ⏳ Ready to start

#### Steps:
1. **Set up test environment**
   - ✅ Created `/apps/backend/app/api/test-pil/route.ts` endpoint
   - ✅ Created `advancedStoryProtocolService.ts` with v1.3.2 compatibility layer
   - ⏳ Deploy to testnet and verify endpoint functionality

2. **Run compatibility tests**
   - ⏳ Test basic IP registration with new SDK
   - ⏳ Test PIL attachment functionality
   - ⏳ Verify chainId parameter handling (string → number)
   - ⏳ Test royalty module parameter changes

3. **Document findings**
   - ⏳ List all breaking changes encountered
   - ⏳ Create migration checklist
   - ⏳ Identify any unexpected issues

### Task 2: Complete SDK Upgrade (1-2 days)
**Priority**: High  
**Status**: ⏳ Pending

#### Breaking Changes to Address:
1. **chainId Type Change**
   - Old: `chainId: string`
   - New: `chainId: number`
   - Files affected:
     - `/apps/frontend/lib/storyProtocol.ts`
     - `/apps/backend/lib/storyProtocol.ts`
     - Environment configurations

2. **Royalty Module Parameters**
   - Review parameter mapping changes
   - Update all royalty-related calls
   - Test with actual transactions

3. **TypeScript Interfaces**
   - Update all SDK type imports
   - Fix any type mismatches
   - Ensure proper error handling

#### Migration Steps:
1. **Backend Migration**
   - ⏳ Update `/apps/backend/package.json` to v1.3.2
   - ⏳ Fix breaking changes in `/apps/backend/lib/storyProtocol.ts`
   - ⏳ Update all API routes using Story Protocol
   - ⏳ Test all endpoints thoroughly

2. **Frontend Migration**
   - ⏳ Update `/apps/frontend/package.json` to v1.3.2
   - ⏳ Fix breaking changes in `/apps/frontend/lib/storyProtocol.ts`
   - ⏳ Update hooks: `useStoryProtocol.ts`, `useEnhancedStoryProtocol.ts`
   - ⏳ Test all UI interactions

3. **Shared Package Updates**
   - ⏳ Ensure type consistency across packages
   - ⏳ Update shared utilities if needed

### Task 3: Implement PIL Licensing System (1-2 weeks)
**Priority**: High  
**Status**: ⏳ Pending

#### Core Components:

1. **PIL Templates Management**
   - ⏳ Create PIL template service
   - ⏳ Implement default license templates:
     - Non-Commercial Social Remixing
     - Commercial Use
     - Commercial Remix
     - Custom terms
   - ⏳ Add template storage and retrieval

2. **License Attachment System**
   - ⏳ Create `attachLicense()` functionality
   - ⏳ Implement license validation
   - ⏳ Add license metadata storage
   - ⏳ Create license display components

3. **Frontend Integration**
   - ⏳ Add license selection UI in publishing flow
   - ⏳ Create license display components
   - ⏳ Implement license terms viewer
   - ⏳ Add license management dashboard

4. **API Endpoints**
   - ⏳ `POST /api/ip/license/attach` - Attach PIL to IP
   - ⏳ `GET /api/ip/license/[ipId]` - Get license info
   - ⏳ `GET /api/licenses/templates` - List available templates
   - ⏳ `POST /api/licenses/custom` - Create custom license

5. **Smart Contract Integration**
   - ⏳ Deploy PIL template contracts
   - ⏳ Integrate with existing IP registration flow
   - ⏳ Add royalty configuration support

#### Implementation Phases:

**Week 1: Foundation**
- Complete SDK upgrade
- Implement basic PIL attachment
- Create template management system

**Week 2: Integration**
- Add PIL to publishing flow
- Implement license display UI
- Create license management features

**Week 3: Polish & Testing**
- Comprehensive testing
- Performance optimization
- Documentation and examples

## Timeline
- **Day 1**: Test SDK compatibility (Task 1)
- **Day 2-3**: Complete SDK upgrade (Task 2)
- **Week 1**: PIL system foundation
- **Week 2**: Full integration
- **Week 3**: Testing and polish

## Risk Assessment
1. **Breaking Changes**: SDK upgrade may reveal more issues than documented
   - Mitigation: Thorough testing in isolated environment first

2. **Contract Compatibility**: Existing contracts may need updates
   - Mitigation: Review all contract interactions before upgrade

3. **User Experience**: License selection may complicate publishing flow
   - Mitigation: Design intuitive UI with sensible defaults

4. **Performance**: Additional blockchain calls may slow operations
   - Mitigation: Implement caching and batch operations

## Success Criteria
- ✅ All tests pass with SDK v1.3.2
- ✅ PIL licensing fully integrated into publishing flow
- ✅ Users can attach and view licenses on all IP assets
- ✅ No regression in existing functionality
- ✅ Performance remains acceptable (<3s for operations)
- ✅ Documentation complete for all new features

## Progress Tracking
### Task 1: Test Compatibility ⏳
- [ ] Deploy test endpoint
- [ ] Run basic tests
- [ ] Document findings

### Task 2: SDK Upgrade ⏳
- [ ] Backend migration
- [ ] Frontend migration
- [ ] Full testing

### Task 3: PIL Implementation ⏳
- [ ] Template system
- [ ] Attachment functionality
- [ ] UI integration
- [ ] API endpoints
- [ ] Testing & documentation

## Related Files
### Configuration Files
- `/apps/frontend/package.json`
- `/apps/backend/package.json`
- `/packages/shared/package.json`

### Core Integration Files
- `/apps/frontend/lib/storyProtocol.ts`
- `/apps/backend/lib/storyProtocol.ts`
- `/apps/frontend/hooks/useStoryProtocol.ts`
- `/apps/frontend/hooks/useEnhancedStoryProtocol.ts`
- `/packages/shared/src/services/advancedStoryProtocolService.ts`

### New PIL Files (To Be Created)
- `/apps/backend/app/api/ip/license/attach/route.ts`
- `/apps/backend/app/api/licenses/templates/route.ts`
- `/apps/frontend/components/licensing/LicenseSelector.tsx`
- `/apps/frontend/components/licensing/LicenseViewer.tsx`
- `/apps/backend/lib/services/pilService.ts`

## Notes
- Ensure all changes maintain backward compatibility where possible
- Consider feature flags for gradual rollout
- Keep detailed logs of all breaking changes encountered
- Update CLAUDE.md with any new development patterns