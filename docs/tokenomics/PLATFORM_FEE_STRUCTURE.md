# 💰 StoryHouse.vip Platform Fee Structure

**Current Implementation** (as of December 2024)

---

## 📊 **Chapter Unlock Fees**

### **Free Chapters (1-3)**
- **Reader Cost**: 0 TIP
- **Platform Fee**: 0%
- **Author Revenue**: N/A
- **Read Reward**: Removed (December 2024)

### **Paid Chapters (4+)**
- **Reader Cost**: 0.5 TIP per chapter
- **Platform Fee**: **10%** (0.05 TIP)
- **Creator Revenue**: **90%** (0.45 TIP)
  - **Author**: 70% (0.35 TIP)
  - **Curator**: 20% (0.1 TIP)
- **Read Reward**: Removed (December 2024)

---

## 🔧 **Technical Implementation**

### **Smart Contract**: `HybridRevenueControllerV2.sol`
```solidity
uint256 public constant AUTHOR_SHARE = 70;   // 70% to author
uint256 public constant CURATOR_SHARE = 20;  // 20% to curator  
uint256 public constant PLATFORM_SHARE = 10; // 10% to platform

function payForChapter(
    uint256 bookId,
    uint256 chapterNumber,
    uint256 amount
) external {
    uint256 authorShare = (amount * AUTHOR_SHARE) / 100;     // 0.35 TIP
    uint256 curatorShare = (amount * CURATOR_SHARE) / 100;   // 0.1 TIP
    uint256 platformShare = (amount * PLATFORM_SHARE) / 100; // 0.05 TIP
    
    // Transfer to stakeholders immediately
    tipToken.transferFrom(msg.sender, bookAuthor[bookId], authorShare);
    tipToken.transferFrom(msg.sender, bookCurator[bookId], curatorShare);
    tipToken.transferFrom(msg.sender, platformAddress, platformShare);
}
```

### **Blockchain Recording**
Every unlock is permanently recorded:
- **Event**: `ChapterUnlocked(reader, bookId, chapterNumber, unlockPrice, timestamp)`
- **Storage**: `hasUnlockedChapter[user][book][chapter] = true`
- **Progress**: `userUnlockedChapters[book][user] = latestChapter`

---

## 💡 **Revenue Flow Example**

**Scenario**: Bob unlocks Chapter 4 of Andy's book "The Detective's Portal"

1. **Payment**: Bob pays 0.5 TIP from his wallet
2. **Smart Contract Split**:
   - Andy receives: 0.4 TIP (80%)
   - Platform keeps: 0.1 TIP (20%)
3. **Recording**: Bob's unlock is stored on-chain permanently
4. **Future Access**: Bob never pays again for this chapter

---

## 📈 **Economic Rationale**

### **20% Platform Fee Justification**
- **Infrastructure Costs**: Blockchain gas fees, AI generation, storage
- **Development**: Ongoing feature development and maintenance
- **Support**: Community support and customer service
- **Marketing**: User acquisition and platform growth

### **80% Author Revenue Benefits**
- **High Creator Share**: Among the highest in Web3 publishing
- **Immediate Payment**: No waiting periods or minimum thresholds
- **Transparent Distribution**: All transactions visible on-chain
- **Scalable Economics**: Revenue grows with content popularity

---

## 🔄 **Historical Changes**

| Date | Platform Fee | Rationale |
|------|-------------|-----------|
| **Dec 2024** | **20%** | **Current Implementation** |
| Prior Docs | 5% | Early planning documentation |

**Note**: Documentation has been updated to reflect the current 20% implementation across all files.

---

## 🎯 **Comparison with Other Platforms**

| Platform | Creator Share | Platform Fee | Notes |
|----------|---------------|--------------|-------|
| **StoryHouse.vip** | **80%** | **20%** | **Blockchain-backed, immediate payment** |
| Amazon KDP | 35-70% | 30-65% | Traditional publishing |
| Medium Partner | ~50% | ~50% | Subscription-based |
| Substack | 90% | 10% | Newsletter platform |
| YouTube | 55% | 45% | Video content |

**StoryHouse.vip offers competitive creator economics with unique Web3 benefits.**

---

## 🚀 **Future Considerations**

### **Potential Optimizations**
- **Volume Discounts**: Lower fees for high-volume authors
- **Quality Bonuses**: Reduced fees for highly-rated content
- **Community Governance**: DAO-based fee structure decisions

### **Revenue Reinvestment**
Platform fees are reinvested in:
- Enhanced AI capabilities
- Improved user experience
- Marketing and user acquisition
- Developer incentives and grants

---

**Questions?** See [TOKENOMICS_WHITEPAPER.md](./TOKENOMICS_WHITEPAPER.md) for complete economic model details.