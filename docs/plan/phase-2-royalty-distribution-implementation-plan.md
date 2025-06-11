# Phase 2: Royalty Distribution System Implementation Plan

## Overview
This plan details the implementation of Phase 2 of the Story Protocol SDK enhancement roadmap, focusing on automated royalty distribution and TIP token integration. Building on the successful Phase 1 PIL licensing foundation, Phase 2 enables creators to claim and manage royalties from their licensed content.

**Start Date**: December 2025  
**Target Completion**: February 2026  
**Current Status**: 🎯 **Ready to Start**  
**Last Updated**: December 11, 2025

## Phase 2 Objectives

### Primary Goals
1. **Basic Royalty Claiming Infrastructure** - Individual chapter royalty claiming
2. **TIP Token Integration** - Connect Story Protocol royalties with TIP token economics
3. **Manual Claiming System** - User-controlled royalty claiming with real-time notifications
4. **Foundation for Phase 3** - Extensible architecture for advanced features

### Success Criteria
- ✅ Creators can manually claim royalties from individual chapters
- ✅ Real-time notifications when new royalties become available
- ✅ Seamless integration with existing TIP token economics
- ✅ <3s operation time for royalty claiming
- ✅ Comprehensive error handling with actionable guidance
- ✅ Production-ready deployment on testnet and mainnet

## Architecture Strategy

### Hybrid Service Approach ✅ RECOMMENDED
Based on comprehensive architecture analysis, we'll use a hybrid approach:

1. **Extend `AdvancedStoryProtocolService`** - For blockchain operations
   - Chapter-level royalty claiming via Story Protocol SDK
   - Integration with existing PIL license tiers
   - Consistent error handling and blockchain interaction patterns

2. **Create New `RoyaltyService`** - For business logic and TIP integration
   - TIP token balance management and distribution
   - Royalty calculation and revenue sharing
   - Real-time notification system
   - Royalty history and analytics

3. **Integration Layer** - Coordinate between services
   - Convert Story Protocol royalties to TIP token rewards
   - Handle notification triggers and user experience
   - Maintain separation of concerns while ensuring seamless operation

## Implementation Phases

### **Phase 2.1: Core Infrastructure** (Weeks 1-2)
*Priority: Critical | Status: 🎯 Ready to Start*

#### Ticket 2.1.1: Extend AdvancedStoryProtocolService for Royalty Operations
**Priority**: High  
**Estimated Effort**: 3 days  
**Dependencies**: None

**Tasks:**
- [ ] Add `claimChapterRoyalties(chapterId: string, authorAddress: Address)` method
- [ ] Add `getClaimableRoyalties(chapterId: string)` method  
- [ ] Add `calculateRoyaltySharing(chapterId: string, totalRevenue: bigint)` method
- [ ] Integrate with existing error handling system (6-category errors)
- [ ] Add support for graceful fallback to simulation mode
- [ ] Update TypeScript interfaces for royalty operations

**Files to Modify:**
- `/apps/backend/lib/services/advancedStoryProtocolService.ts`
- `/apps/backend/lib/types/ip.ts` (add royalty operation types)
- `/apps/backend/lib/types/shared/ip.ts` (enhance royalty interfaces)

**Acceptance Criteria:**
- [ ] All new methods integrate seamlessly with existing PIL system
- [ ] Comprehensive error handling for all royalty operations
- [ ] TypeScript interfaces support all royalty use cases
- [ ] Unit tests cover all new functionality
- [ ] Documentation updated with royalty API examples

#### Ticket 2.1.2: Create RoyaltyService for Business Logic
**Priority**: High  
**Estimated Effort**: 4 days  
**Dependencies**: Ticket 2.1.1

**Tasks:**
- [ ] Create `/apps/backend/lib/services/royaltyService.ts`
- [ ] Implement TIP token balance checking and validation
- [ ] Add royalty calculation utilities for different license tiers
- [ ] Create revenue sharing calculation methods
- [ ] Implement royalty history tracking and storage
- [ ] Add notification trigger system

**Files to Create:**
- `/apps/backend/lib/services/royaltyService.ts`
- `/apps/backend/lib/types/royalty.ts`
- `/apps/backend/lib/utils/royaltyCalculations.ts`

**Technical Requirements:**
- Integration with TIP token contract (`0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`)
- Support for Free (0%), Premium (10%), and Exclusive (25%) royalty tiers
- Real-time calculation of claimable amounts
- Comprehensive logging for all royalty operations

**Acceptance Criteria:**
- [ ] TIP token integration fully functional
- [ ] Royalty calculations accurate for all license tiers
- [ ] Notification system triggers correctly
- [ ] Error handling consistent with existing patterns
- [ ] Performance optimized for <2s operations

#### Ticket 2.1.3: Create Royalty Claiming API Endpoints
**Priority**: High  
**Estimated Effort**: 2 days  
**Dependencies**: Tickets 2.1.1, 2.1.2

**Tasks:**
- [ ] Create `POST /api/royalties/claim` endpoint for individual chapter claiming
- [ ] Create `GET /api/royalties/claimable/:chapterId` endpoint for claimable amount checking
- [ ] Create `GET /api/royalties/history/:authorAddress` endpoint for royalty history
- [ ] Add comprehensive validation and error responses
- [ ] Implement rate limiting and security measures

**Files to Create:**
- `/apps/backend/app/api/royalties/claim/route.ts`
- `/apps/backend/app/api/royalties/claimable/[chapterId]/route.ts`
- `/apps/backend/app/api/royalties/history/[authorAddress]/route.ts`

**API Specifications:**
```typescript
// POST /api/royalties/claim
{
  chapterId: string
  authorAddress: Address
  licenseTermsId?: string
}

// Response
{
  success: boolean
  claimedAmount: string // TIP tokens
  transactionHash: Hash
  fees: {
    gasFee: string
    platformFee: string
  }
}
```

**Acceptance Criteria:**
- [ ] All endpoints return consistent response formats
- [ ] Comprehensive error handling with actionable messages
- [ ] Security measures prevent unauthorized claiming
- [ ] API documentation complete with examples
- [ ] Integration tests cover all endpoints

### **Phase 2.2: TIP Token Integration** (Weeks 3-4)
*Priority: High | Status: 🎯 Ready after Phase 2.1*

#### Ticket 2.2.1: Implement TIP Token Distribution System
**Priority**: High  
**Estimated Effort**: 3 days  
**Dependencies**: Ticket 2.1.2

**Tasks:**
- [ ] Create TIP token transfer utilities
- [ ] Implement automatic conversion from Story Protocol royalties to TIP tokens
- [ ] Add TIP token balance validation before claiming
- [ ] Create TIP token allowance management
- [ ] Implement batch TIP token operations for efficiency

**Files to Modify/Create:**
- `/apps/backend/lib/utils/tipTokenUtils.ts`
- `/apps/backend/lib/services/royaltyService.ts` (enhance)
- `/apps/backend/lib/contracts/storyhouse.ts` (enhance)

**Technical Requirements:**
- Integration with existing TIP token contract ABIs
- Support for TIP token decimal handling (18 decimals)
- Gas optimization for TIP token operations
- Real-time balance checking and validation

**Acceptance Criteria:**
- [ ] TIP token transfers execute successfully
- [ ] Balance validation prevents overdraft scenarios
- [ ] Gas costs optimized for production use
- [ ] Error handling covers all TIP token edge cases
- [ ] Performance meets <2s operation targets

#### Ticket 2.2.2: Create Economic Integration with Existing TIP System
**Priority**: High  
**Estimated Effort**: 4 days  
**Dependencies**: Ticket 2.2.1

**Tasks:**
- [ ] Integrate with existing TIP token economics (unlock prices, read rewards)
- [ ] Implement platform revenue sharing (5% platform fee)
- [ ] Create economic modeling for sustainable royalty rates
- [ ] Add revenue projection calculations for creators
- [ ] Implement economic analytics and reporting

**Files to Modify:**
- `/apps/backend/lib/services/royaltyService.ts`
- `/apps/backend/lib/utils/tipTokenEconomics.ts` (create)
- `/apps/backend/lib/types/economics.ts` (create)

**Economic Model:**
- **Free License**: 0% royalty sharing (pure attribution)
- **Premium License**: 10% royalty to original creator, 5% platform fee
- **Exclusive License**: 25% royalty to original creator, 5% platform fee
- **TIP Token Conversion**: 1:1 ratio with ETH royalties

**Acceptance Criteria:**
- [ ] Economic calculations accurate and verified
- [ ] Platform fee collection automated
- [ ] Revenue projections help creators make informed decisions
- [ ] Integration maintains backward compatibility
- [ ] Economic reports provide valuable insights

#### Ticket 2.2.3: Add Royalty Preview and Calculation Tools
**Priority**: Medium  
**Estimated Effort**: 2 days  
**Dependencies**: Ticket 2.2.2

**Tasks:**
- [ ] Create royalty preview calculations before claiming
- [ ] Add "what-if" scenario calculations for different license tiers
- [ ] Implement real-time royalty estimation based on current usage
- [ ] Create royalty optimization suggestions for creators
- [ ] Add economic impact analysis tools

**Files to Create:**
- `/apps/backend/lib/utils/royaltyPreview.ts`
- `/apps/backend/app/api/royalties/preview/route.ts`

**Features:**
- Real-time claimable amount calculation
- Revenue projection based on historical data
- License tier optimization recommendations
- Economic impact analysis for different strategies

**Acceptance Criteria:**
- [ ] Preview calculations match actual claiming results
- [ ] Optimization suggestions provide valuable guidance
- [ ] Real-time updates reflect current blockchain state
- [ ] User interface supports informed decision-making
- [ ] Performance optimized for real-time calculations

### **Phase 2.3: Notifications & Manual Claiming UI** (Weeks 5-6)
*Priority: Medium | Status: 🎯 Ready after Phase 2.2*

#### Ticket 2.3.1: Implement Real-time Royalty Notifications
**Priority**: Medium  
**Estimated Effort**: 3 days  
**Dependencies**: Ticket 2.2.1

**Tasks:**
- [ ] Create notification service for new royalty events
- [ ] Implement webhook system for blockchain event monitoring
- [ ] Add email/push notification support for creators
- [ ] Create notification preference management
- [ ] Implement notification history and read status

**Files to Create:**
- `/apps/backend/lib/services/notificationService.ts`
- `/apps/backend/lib/utils/blockchainEventMonitor.ts`
- `/apps/backend/app/api/notifications/royalties/route.ts`

**Notification Types:**
- New royalty available for claiming
- Royalty claim successful
- Large royalty payment received (threshold-based)
- Monthly royalty summary

**Acceptance Criteria:**
- [ ] Real-time notifications trigger immediately upon royalty events
- [ ] Notification preferences allow granular control
- [ ] Email/push notifications work reliably
- [ ] Notification history provides complete audit trail
- [ ] Performance impact minimal on main application

#### Ticket 2.3.2: Create Individual Chapter Claiming Interface
**Priority**: High  
**Estimated Effort**: 4 days  
**Dependencies**: Tickets 2.1.3, 2.3.1

**Tasks:**
- [ ] Create chapter royalty management page
- [ ] Implement individual chapter claiming UI
- [ ] Add claimable amount display with real-time updates
- [ ] Create claiming transaction status monitoring
- [ ] Implement claiming history and analytics

**Files to Create:**
- `/apps/frontend/app/creator/royalties/page.tsx`
- `/apps/frontend/components/creator/ChapterRoyaltyCard.tsx`
- `/apps/frontend/components/creator/RoyaltyClaimButton.tsx`
- `/apps/frontend/hooks/useChapterRoyalties.ts`

**UI Requirements:**
- Individual chapter cards with claimable amounts
- One-click claiming with transaction confirmation
- Real-time status updates during claiming process
- Clear error messages and retry options
- Mobile-responsive design

**Acceptance Criteria:**
- [ ] UI is intuitive and user-friendly
- [ ] Real-time updates reflect current blockchain state
- [ ] Error handling provides clear guidance
- [ ] Mobile experience is fully functional
- [ ] Accessibility standards met (WCAG 2.1)

#### Ticket 2.3.3: Add Basic Royalty Analytics Dashboard
**Priority**: Low  
**Estimated Effort**: 3 days  
**Dependencies**: Ticket 2.3.2

**Tasks:**
- [ ] Create royalty analytics overview page
- [ ] Implement revenue charts and graphs
- [ ] Add royalty performance metrics
- [ ] Create license tier performance comparison
- [ ] Implement export functionality for royalty data

**Files to Create:**
- `/apps/frontend/components/creator/RoyaltyAnalytics.tsx`
- `/apps/frontend/components/creator/RoyaltyCharts.tsx`
- `/apps/frontend/hooks/useRoyaltyAnalytics.ts`

**Analytics Features:**
- Total royalties earned (all-time, monthly, weekly)
- Royalty breakdown by license tier
- Top-performing chapters by royalty income
- Revenue trends and projections
- Export to CSV/JSON functionality

**Acceptance Criteria:**
- [ ] Analytics provide valuable insights for creators
- [ ] Charts and graphs are clear and informative
- [ ] Data export functionality works correctly
- [ ] Performance optimized for large datasets
- [ ] Real-time data updates automatically

## Risk Assessment and Mitigation

### Technical Risks

**Medium Risk: TIP Token Integration Complexity**
- **Risk**: TIP token contract interactions may have unexpected edge cases
- **Mitigation**: Comprehensive testing with small amounts first, fallback to manual processing
- **Monitoring**: Real-time transaction monitoring and alerting

**Medium Risk: Royalty Calculation Accuracy**
- **Risk**: Incorrect royalty calculations could lead to financial disputes
- **Mitigation**: Extensive unit testing, independent calculation verification, audit trail
- **Monitoring**: Calculation accuracy monitoring and discrepancy alerting

**Low Risk: Notification System Reliability**
- **Risk**: Notification system might miss important royalty events
- **Mitigation**: Redundant notification channels, event replay capability, manual notification triggers
- **Monitoring**: Notification delivery monitoring and failure alerting

### Business Risks

**Low Risk: Economic Model Sustainability**
- **Risk**: Royalty rates might not provide sustainable creator incentives
- **Mitigation**: Economic modeling and analysis, adjustable rate parameters, creator feedback integration
- **Monitoring**: Creator engagement metrics, royalty claiming rates, economic impact analysis

## Timeline and Milestones

### Phase 2 Timeline (6 weeks)
| Week | Phase | Key Deliverables | Status |
|------|-------|------------------|---------|
| **1-2** | 2.1 Core Infrastructure | Extended services, API endpoints | 🎯 **Ready** |
| **3-4** | 2.2 TIP Integration | Token distribution, economic integration | ⏳ **Pending** |
| **5-6** | 2.3 UI & Notifications | Claiming interface, analytics | ⏳ **Pending** |

### Key Milestones
- **Week 2**: Core royalty claiming infrastructure operational
- **Week 4**: Full TIP token integration complete
- **Week 6**: Complete royalty management system deployed

## Success Metrics

### Technical Metrics
- [ ] **Performance**: <3s for all royalty operations
- [ ] **Reliability**: >99.5% uptime for royalty services
- [ ] **Accuracy**: 100% accuracy in royalty calculations
- [ ] **Security**: Zero security incidents or unauthorized claims

### Business Metrics
- [ ] **Creator Adoption**: >80% of creators use royalty claiming
- [ ] **User Satisfaction**: >4.5/5 rating for royalty experience
- [ ] **Economic Impact**: Sustainable creator revenue generation
- [ ] **Platform Growth**: Increased content creation due to royalty incentives

## Related Files and Integration Points

### Core Service Files
```
# Extended Services
✅ apps/backend/lib/services/advancedStoryProtocolService.ts (extend)
⏳ apps/backend/lib/services/royaltyService.ts (create)
⏳ apps/backend/lib/services/notificationService.ts (create)

# API Endpoints
⏳ apps/backend/app/api/royalties/claim/route.ts (create)
⏳ apps/backend/app/api/royalties/claimable/[chapterId]/route.ts (create)
⏳ apps/backend/app/api/royalties/history/[authorAddress]/route.ts (create)

# Frontend Components
⏳ apps/frontend/app/creator/royalties/page.tsx (create)
⏳ apps/frontend/components/creator/ChapterRoyaltyCard.tsx (create)
⏳ apps/frontend/hooks/useChapterRoyalties.ts (create)
```

### Integration Points
- **Phase 1 PIL System**: Royalty rates based on license tiers
- **TIP Token Contracts**: Integration with existing token economics
- **Error Handling**: Extend 6-category error system
- **Type System**: Enhance with royalty-specific interfaces

## Next Steps After Phase 2

### Phase 3 Preparation
- **Derivative Tracking**: Foundation for tracking content derivatives
- **Batch Operations**: Efficient bulk royalty claiming
- **Advanced Analytics**: Comprehensive revenue analytics
- **Cross-chain Support**: Multi-chain royalty distribution

### Production Deployment
- **Testnet Validation**: Complete Phase 2 testing on Aeneid testnet
- **Mainnet Preparation**: Production configuration and security audit
- **Monitoring Setup**: Comprehensive monitoring and alerting
- **Documentation**: Complete user and developer documentation

---

**This plan provides a comprehensive roadmap for implementing Phase 2 of the royalty distribution system, building on the successful Phase 1 PIL foundation to create a complete creator economy solution.**

**Phase 2 Status**: 🎯 **Ready to Start**  
**Next Milestone**: Core Infrastructure (2.1) - Individual chapter royalty claiming  
**Target Completion**: February 2026