# 🧪 StoryHouse.vip QA Test Cases
**Based on Visual Story Map - Phase 6.0 Architecture Testing**

## 📊 **Test Overview**

Testing the 5-contract architecture with the branching story model:
- **Free Chapters**: Ch1-Ch3 (green boxes)
- **Paid Chapters**: Ch4+ at 0.5 TIP each (gray boxes)
- **Story Branches**: Multiple author paths from Chapter 3
- **Licensing**: 2.0 TIP derivative licenses (orange boxes)
- **Multi-Author Revenue**: Different authors continuing stories

---

## 🟢 **Test Suite 1: Free Chapter Access (Ch1-Ch3)**

### **TC-001: Basic Free Chapter Reading**
**Scenario**: New user reads the first 3 chapters
```
Steps:
1. Connect wallet to platform
2. Navigate to story beginning
3. Read Chapter 1 (should be FREE)
4. Read Chapter 2 (should be FREE) 
5. Read Chapter 3 (should be FREE)
6. Attempt to read Chapter 4 (should require payment)

Expected Results:
✅ Chapters 1-3 accessible without payment
✅ Chapter 4 shows payment prompt (0.5 TIP)
✅ User can read content of free chapters
✅ Navigation between Ch1-Ch3 works smoothly
❌ Should NOT be able to access Ch4+ without payment
```

### **TC-002: Free Chapter Progress Tracking**
**Scenario**: Verify reading progress is saved
```
Steps:
1. Read Chapter 1 completely
2. Close browser/refresh page
3. Return to story
4. Check if Chapter 1 is marked as read
5. Verify progress indicator

Expected Results:
✅ Chapter 1 marked as completed
✅ Progress saved in user profile
✅ Can resume from where left off
✅ Reading history tracked correctly
```

### **TC-003: Multiple Story Discovery**
**Scenario**: User explores different stories in free chapters
```
Steps:
1. Browse available stories
2. Read Ch1-Ch3 of Story A (Original)
3. Browse and find Story B
4. Read Ch1-Ch3 of Story B
5. Return to Story A

Expected Results:
✅ Can access multiple story beginnings
✅ Progress tracked separately for each story
✅ No payment required for any Ch1-Ch3
✅ Story selection UI works correctly
```

---

## 💰 **Test Suite 2: Paid Chapter Access (Ch4+)**

### **TC-004: Chapter 4 Purchase Flow**
**Scenario**: User purchases first paid chapter
```
Steps:
1. Complete reading Ch1-Ch3
2. Navigate to Chapter 4
3. See payment prompt for 0.5 TIP
4. Confirm wallet has sufficient TIP balance
5. Approve and pay 0.5 TIP
6. Access Chapter 4 content

Expected Results:
✅ Payment prompt shows exactly 0.5 TIP
✅ Wallet integration works smoothly
✅ Transaction completes successfully
✅ Chapter 4 content unlocks immediately
✅ Gas fees are reasonable (<$5)
✅ Chapter marked as "owned" in UI
```

### **TC-005: Insufficient Balance Handling**
**Scenario**: User tries to purchase with insufficient TIP
```
Steps:
1. Ensure wallet has <0.5 TIP
2. Attempt to purchase Chapter 4
3. Try to complete transaction

Expected Results:
❌ Transaction should fail gracefully
✅ Clear error message about insufficient balance
✅ Suggestion to get more TIP tokens
✅ No partial charges or failed states
✅ User can retry after getting more TIP
```

### **TC-006: Batch Chapter Purchase**
**Scenario**: User purchases multiple chapters at once
```
Steps:
1. Navigate to Chapter 4
2. Select "Buy Chapters 4-6" option (if available)
3. See total cost (1.5 TIP)
4. Complete bulk purchase
5. Verify access to all purchased chapters

Expected Results:
✅ Bulk pricing calculation correct (3 × 0.5 = 1.5 TIP)
✅ Single transaction for efficiency
✅ All chapters unlock simultaneously
✅ Gas optimization for batch purchase
✅ Can read any purchased chapter
```

---

## 🌲 **Test Suite 3: Story Branching & Derivatives**

### **TC-007: Story Branch Navigation**
**Scenario**: User explores different author paths from Chapter 3
```
Steps:
1. Complete reading Ch1-Ch3 (original story)
2. See branching options at end of Ch3
3. Choose Andy's continuation (Ch4 Andy Original)
4. Read Andy's Chapter 4
5. Return and try Boris's path (Ch4 Boris Sci-Fi)

Expected Results:
✅ Clear branching interface after Ch3
✅ Different authors' styles are distinct
✅ Both paths accessible with 0.5 TIP each
✅ Can switch between author paths
✅ Progress tracked separately for each branch
✅ Visual indication of different authors
```

### **TC-008: Derivative Story Creation**
**Scenario**: Test the derivative creation flow
```
Steps:
1. Find "Create Derivative" option on existing story
2. Choose starting point (e.g., after Ch3)
3. Write new Chapter 4 content
4. Set licensing terms (2.0 TIP)
5. Publish derivative chapter
6. Verify it appears in story map

Expected Results:
✅ Derivative creation interface works
✅ Can select branch point from existing story
✅ Content editor functional
✅ Licensing options available
✅ Published derivative appears in branching diagram
✅ Original author gets attribution/revenue share
```

### **TC-009: Multi-Path Story Completion**
**Scenario**: User completes different story branches
```
Steps:
1. Complete Andy's path: Ch4-Ch8 Andy + Ch9-Ch10 Andy
2. Go back and complete Boris's path: Ch4-Ch8 Boris + Ch9 Cecilia
3. Compare completion tracking

Expected Results:
✅ Both paths can be completed independently
✅ Different endings/outcomes
✅ Progress tracking shows both completions
✅ Total cost calculation correct
✅ Achievement tracking for multiple completions
```

---

## 📜 **Test Suite 4: Licensing System**

### **TC-010: Derivative License Purchase**
**Scenario**: User buys license to create derivative from Daisy Dark's story
```
Steps:
1. Navigate to Ch9 Daisy Dark (orange box in diagram)
2. See "2.0 TIP license" option
3. Purchase derivative license for 2.0 TIP
4. Verify license ownership
5. Create derivative content based on Daisy's story

Expected Results:
✅ License purchase flow clear and secure
✅ 2.0 TIP transaction completes
✅ License ownership recorded on blockchain
✅ Can create derivative content
✅ Original author (Daisy) receives revenue share
✅ License terms clearly displayed
```

### **TC-011: License Verification**
**Scenario**: Ensure only licensed users can create derivatives
```
Steps:
1. Attempt to create derivative without license
2. Verify blocking mechanism
3. Purchase license
4. Retry derivative creation

Expected Results:
❌ Derivative creation blocked without license
✅ Clear message about license requirement
✅ Direct link to purchase license
✅ License purchase enables derivative creation
✅ Blockchain verification of license ownership
```

### **TC-012: Revenue Sharing Validation**
**Scenario**: Test that original authors receive revenue from derivatives
```
Steps:
1. Purchase license from original author's work
2. Create and publish derivative chapter
3. Have another user purchase your derivative
4. Check revenue distribution to original author

Expected Results:
✅ Original author receives percentage of derivative sales
✅ Revenue distribution happens automatically
✅ Smart contract handles calculations correctly
✅ Both authors see revenue in their dashboards
✅ Transaction history shows revenue sharing
```

---

## 👥 **Test Suite 5: Multi-Author Revenue Sharing**

### **TC-013: Cross-Author Chapter Purchases**
**Scenario**: User purchases chapters from different authors
```
Steps:
1. Purchase Ch4 from Andy (0.5 TIP)
2. Purchase Ch4 from Boris (0.5 TIP)
3. Purchase Ch9 from Cecilia (0.5 TIP)
4. Verify each author receives their revenue

Expected Results:
✅ Each 0.5 TIP goes to respective author
✅ Platform fee handled correctly
✅ Authors can withdraw earnings
✅ Revenue tracking per author works
✅ No cross-contamination of payments
```

### **TC-014: Collaborative Chapter Revenue**
**Scenario**: Test revenue for chapters with multiple contributors
```
Steps:
1. Create collaborative chapter with 2+ authors
2. Set revenue sharing percentages
3. Have users purchase the chapter
4. Verify revenue splits correctly

Expected Results:
✅ Revenue splits according to preset percentages
✅ All contributors receive their share
✅ Smart contract handles multiple payouts
✅ Gas costs distributed fairly
✅ Clear revenue breakdown in UI
```

---

## 🔧 **Test Suite 6: Smart Contract Integration**

### **TC-015: 5-Contract Architecture Validation**
**Scenario**: Verify all 5 contracts work together
```
Contracts to Test:
1. TIP Token (0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E)
2. Rewards Manager (0xf5aE031bA92295C2aE86a99e88f09989339707E5)
3. Unified Rewards Controller (0x741105d6ee9b25567205f57c0e4f1d293f0d00c5)
4. Chapter Access Controller (0x1bd65ad10b1ca3ed67ae75fcdd3aba256a9918e3)
5. Hybrid Revenue Controller (0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812)

Test Actions:
- TIP token transfers
- Chapter access purchases
- Revenue distribution
- Rewards claiming
- Cross-contract interactions

Expected Results:
✅ All contracts respond correctly
✅ Cross-contract calls work
✅ Gas usage optimized (40% reduction)
✅ No failed transactions
✅ State consistency across contracts
```

### **TC-016: Gas Optimization Testing**
**Scenario**: Verify 40% gas cost reduction claims
```
Steps:
1. Perform chapter purchase transaction
2. Record gas usage
3. Compare with previous architecture (if available)
4. Test batch operations for efficiency

Expected Results:
✅ Gas costs significantly lower than baseline
✅ Batch operations more efficient than individual
✅ Complex operations (licensing) optimized
✅ User experience improved due to lower costs
```

---

## 🚨 **Test Suite 7: Error Handling & Edge Cases**

### **TC-017: Network Interruption Recovery**
**Scenario**: Test behavior during network issues
```
Steps:
1. Start chapter purchase transaction
2. Disconnect internet during transaction
3. Reconnect after 30 seconds
4. Check transaction status and user state

Expected Results:
✅ Graceful handling of network interruption
✅ Clear status messaging to user
✅ No lost payments or corrupted state
✅ Ability to retry failed transactions
✅ Progress preserved where possible
```

### **TC-018: Concurrent User Testing**
**Scenario**: Multiple users accessing same content simultaneously
```
Steps:
1. Have 10+ users purchase same chapter simultaneously
2. Monitor for race conditions or conflicts
3. Verify all transactions process correctly

Expected Results:
✅ All transactions complete successfully
✅ No duplicate charges or failed states
✅ Smart contract handles concurrency
✅ UI remains responsive under load
✅ Accurate revenue accounting
```

---

## 📱 **Test Suite 8: User Experience & Interface**

### **TC-019: Visual Story Map Navigation**
**Scenario**: Test the story map interface from the diagram
```
Steps:
1. Load story map view
2. Click through different chapters and branches
3. Verify visual indicators match actual access
4. Test responsive design on mobile

Expected Results:
✅ Story map loads correctly
✅ Visual indicators accurate (green=free, gray=paid, orange=licensed)
✅ Clicking navigates to correct chapters
✅ Mobile responsive design works
✅ Loading states handled gracefully
```

### **TC-020: Author Attribution Display**
**Scenario**: Verify correct author attribution throughout
```
Steps:
1. Navigate through different story branches
2. Check author names match diagram
3. Verify author profiles accessible
4. Test author revenue tracking display

Expected Results:
✅ Author names displayed correctly
✅ Attribution matches visual story map
✅ Author profiles contain correct information
✅ Revenue dashboards show correct earnings
✅ Clear distinction between original and derivative authors
```

---

## 🎯 **Priority Testing Sequence**

### **Phase 1 (Critical - Test First)**
1. TC-001: Free chapter access
2. TC-004: Paid chapter purchase
3. TC-015: Contract integration
4. TC-007: Story branching

### **Phase 2 (Important - Test Second)**
5. TC-010: License purchase
6. TC-013: Multi-author revenue
7. TC-016: Gas optimization
8. TC-019: Story map navigation

### **Phase 3 (Comprehensive - Test Last)**
9. All remaining test cases
10. Edge cases and error handling
11. Performance and load testing
12. Mobile and cross-browser testing

---

## 📊 **Success Criteria**

**Must Pass (95%+ success rate):**
- All free chapter access (TC-001 to TC-003)
- Basic paid chapter purchases (TC-004, TC-006)
- Smart contract integration (TC-015)
- Story branching navigation (TC-007)

**Should Pass (90%+ success rate):**
- Licensing system (TC-010, TC-011)
- Revenue sharing (TC-012, TC-013)
- Gas optimization (TC-016)
- Error handling (TC-017, TC-018)

**Nice to Have (80%+ success rate):**
- Advanced UX features
- Performance optimizations
- Mobile responsiveness
- Complex edge cases

---

**Ready for QA execution once Vercel deployment is complete! 🚀**