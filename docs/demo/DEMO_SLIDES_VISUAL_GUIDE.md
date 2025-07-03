# StoryHouse Demo - Visual Slides Guide

## Slide Design Requirements

### **Title Slide**
**StoryHouse.vip - The Most Native Story Protocol L1 Platform**

**Visuals Needed:**
- StoryHouse logo with gradient effect
- Story Protocol logo integration
- Tagline: "Building the TIP Protocol - Token for Intellectual Property"
- Background: Subtle animated gradient (pink → purple → blue)

---

### **Slide 1: Deep Integration Architecture**

**Visual Diagram:**
```
┌─────────────────────────────────────────────────────────┐
│                   StoryHouse.vip                        │
├─────────────────────────────────────────────────────────┤
│  Advanced Story Protocol Service Layer (SDK 1.3.2+)     │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │ IP Registry │ │ License Mgmt │ │ Royalty Engine  │ │
│  └─────────────┘ └──────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Story Protocol Core SDK                     │
└─────────────────────────────────────────────────────────┘
                           ↓
                  Story Protocol L1 Blockchain
```

**Key Numbers to Highlight:**
- 19+ files with SDK integration
- 40% gas savings
- 100% on-chain

---

### **Slide 2: Smart Contract Architecture**

**Visual Flow Diagram:**
```
     User Wallet
          ↓
    MetaMask Sign
          ↓
┌──────────────────────┐
│ HybridRevenueController │
│      V2 Contract        │
└──────────────────────┘
          ↓
    Revenue Split:
  ┌────┬────┬────┐
  │70% │20% │10% │
  │Author│Curator│Platform│
  └────┴────┴────┘
```

**Contract Address Display:**
`0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6`

---

### **Slide 3: Visual Royalty Graph**

**Screenshot Requirements:**
1. Full BookFamilyTree component expanded
2. Highlight the color-coding:
   - 🔴 High Similarity (>70%)
   - 🟡 Medium Similarity (40-70%)
   - 🟢 Low Similarity (<40%)
3. Show tooltip with AI analysis breakdown
4. Display stats: "5 Derivatives • 3 Authors • 25 Chapters"

**Annotation:** "First platform to visualize multi-author IP relationships"

---

### **Slide 4: TIP Token Economy**

**Visual Infographic:**
```
        TIP Protocol Ecosystem
              
    Chapter Unlocks     Direct Tipping
         0.5 TIP          1-1000 TIP
            ↓                 ↓
    ┌─────────────────────────────┐
    │      Author Wallet          │
    │         (70%)               │
    └─────────────────────────────┘
    
    Free Chapters: 1-3
    Paid Chapters: 4+ (0.5 TIP each)
```

**Show:** Animated TIP token logo with gradient effect

---

### **Slide 5: Code Integration Example**

**Clean Code Display:**
```typescript
// One Transaction - Complete IP Setup
const result = await storyClient.ipAsset
  .mintAndRegisterIpAssetWithPilTerms({
    spgNftContract: SPG_CONTRACT,
    licenseTermsData: [licenseTerms],
    ipMetadata: {
      ipMetadataURI: metadataUrl,
      ipMetadataHash: sha256Hash
    },
    recipient: authorWallet
  });

// Gas Savings: 40% vs Legacy Flow ✅
```

**Visual:** Side-by-side comparison of old (3 transactions) vs new (1 transaction)

---

### **Slide 6: Creator Analytics Dashboard**

**4-Panel Screenshot Grid:**
1. **Top Left:** Derivative Influence Chart (bar graph)
2. **Top Right:** Revenue Tracking (line graph)
3. **Bottom Left:** Quality Score Display (circular progress)
4. **Bottom Right:** AI Insights Panel

**Caption:** "Comprehensive analytics powered by AI and blockchain data"

---

### **Slide 7: Platform Metrics**

**Impact Numbers (Large, Bold):**
```
⚡ 66% Faster Publishing
💰 95% Lower Entry Cost  
📈 70% Creator Revenue
🔒 100% IP Protection
```

**Comparison Table:**
| Traditional | StoryHouse |
|------------|------------|
| $1000+ entry | $50 entry |
| 10-15% royalty | 70% royalty |
| Gatekeepers | Permissionless |
| Opaque | Transparent |

---

### **Demo Screenshots Needed**

1. **Publishing Flow:**
   - Editor in focus mode
   - MetaMask transaction popup
   - Success confirmation with gas savings

2. **Reading Experience:**
   - Chapter with customization panel open
   - Unlock modal with TIP payment
   - Reading preferences (dark/light/sepia)

3. **Family Tree:**
   - Expanded tree with 3+ generations
   - Hover state showing similarity scores
   - Navigation between branches

4. **Analytics:**
   - Royalty dashboard overview
   - Influence propagation chart
   - Revenue distribution diagram

---

### **Branding Elements**

**Color Palette:**
- Primary: Pink-Purple-Blue gradient
- Success: Green (#10B981)
- TIP Token: Gold gradient
- Background: Light gradients on white

**Typography:**
- Headers: Bold, modern sans-serif
- Body: Clean, readable font
- Code: Monospace for technical sections

**Icons:**
- Use Lucide React icons consistently
- Custom wallet and TIP token icons
- Story Protocol logo placement

---

### **Animation Suggestions**

1. **Title Slide:** Subtle gradient shift animation
2. **Architecture Diagram:** Build-up animation showing layers
3. **Revenue Split:** Animated percentage fill
4. **TIP Token:** Rotating 3D effect or pulse
5. **Metrics:** Count-up animation for numbers

---

### **Speaker Notes Focus**

Each slide should emphasize:
1. **Technical depth** - We're not just using Story Protocol, we've mastered it
2. **User simplicity** - Complex blockchain, simple UX
3. **Economic innovation** - 70% creator revenue is revolutionary
4. **Visual proof** - Show, don't just tell
5. **Future vision** - Position as infrastructure, not just an app

---

### **Closing Slide**

**Visual:** StoryHouse logo morphing into "TIP Protocol"

**Text:** 
"The Future of Decentralized Storytelling"
"Built on Story Protocol • Powered by Innovation"

**Call to Action:**
"Let's discuss how StoryHouse becomes the standard for Web3 publishing"

---

*Visual guide prepared for creating professional demo slides that showcase technical excellence*