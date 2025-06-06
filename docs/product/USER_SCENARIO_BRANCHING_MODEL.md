# 📖 StoryHouse.vip User Scenario: Branching & Licensing Model

**Scenario**: Multi-Author Story Branching with Remix Licensing
**Characters**: Andy (Original), Boris (Sci-Fi Remixer), Cecilia (Romance Remixer), Daisy (Alternative Remixer), Emma (Reader)

---

## 👥 **Character Overview**

| Character   | Role            | Specialization    | Strategy                                                       |
| ----------- | --------------- | ----------------- | -------------------------------------------------------------- |
| **Andy**    | Original Author | Fantasy Adventure | Build audience with free chapters, monetize with paid chapters |
| **Boris**   | Remixer         | Hardcore Sci-Fi   | Transform fantasy → sci-fi, build on Andy's foundation         |
| **Cecilia** | Remixer         | Romance Elements  | Add romance to Boris' sci-fi version                           |
| **Daisy**   | Remixer         | Alternative Path  | Create different chapter 9 from Andy's original version        |
| **Emma**    | Reader          | Genre Explorer    | Discover stories, compare different versions                   |

---

## 📚 **Story Branching Model**

**Git-Style Story Development:** Just like software development branches, stories can diverge and create multiple narrative paths.

### **Branch Architecture**

```
🎯 Repository: "Portal Chronicles"
├─ main (Andy): Fantasy adventure baseline
├─ feature/sci-fi (Boris): Cyberpunk transformation
├─ feature/romance (Cecilia): Love elements (from Boris)
└─ feature/dark (Daisy): Alternative ending (from Andy)
```

### **Visual Branch Flow**

```
Ch1 FREE → Ch2 FREE → Ch3 FREE
                        ↓
         ┌─────────────────────────────────────┐
         ↓ (main: Andy)                        ↓ (feature/sci-fi: Boris)
    Ch4 Andy → Ch5 → Ch6 → Ch7 → Ch8 → Ch9 → Ch10
                               ↓
                          Ch9 Daisy
                          (feature/dark)

                        Ch4 Boris → Ch5 → Ch6 → Ch7 → Ch8
                                                      ↓
                                                Ch9 Cecilia
                                                (feature/romance)
```

### **Branch Specifications**

**Main Branch (Andy's Original)**

- **Color**: Gray 🔘
- **Type**: Fantasy Adventure
- **Monetization**: Chapters 4-10 paid (0.5 $TIP each)
- **License**: Available for remixing from Chapter 4+

**Feature/Sci-Fi Branch (Boris)**

- **Color**: Blue 🔵
- **Type**: Cyberpunk Transformation
- **Parent**: Branches from Andy's Chapter 3
- **License Fee**: 2.0 $TIP paid to Andy
- **Monetization**: Own chapters 4-8 paid (0.5 $TIP each)

**Feature/Romance Branch (Cecilia)**

- **Color**: Green 🟢
- **Type**: Romance Elements
- **Parent**: Branches from Boris' Chapter 8
- **License Fee**: 2.0 $TIP paid to Boris
- **Monetization**: Chapter 9 paid (0.5 $TIP)

**Feature/Dark Branch (Daisy)**

- **Color**: Orange 🟠
- **Type**: Dark Alternative
- **Parent**: Branches from Andy's Chapter 8
- **License Fee**: 2.0 $TIP paid to Andy
- **Monetization**: Chapter 9 paid (0.5 $TIP)

---

## 💰 **Licensing & Payment Flow**

### **Step 1: Andy's Original Creation**

```typescript
// Andy publishes original story
{
  author: "Andy",
  chapters: [
    { id: 1, status: "FREE", remixable: false },
    { id: 2, status: "FREE", remixable: false },
    { id: 3, status: "FREE", remixable: false },
    { id: 4, status: "PAID", price: 0.5, remixable: true, licenseFee: 2.0 },
    // ... chapters 5-10 all PAID & remixable
  ]
}
```

### **Step 2: Boris Creates Sci-Fi Remix**

```typescript
// Boris wants to create chapter 4 remix
{
  remixer: "Boris",
  sourceAuthor: "Andy",
  sourceChapters: [1, 2, 3], // Free chapters as foundation
  newChapter: 4,
  licenseFeeRequired: 2.0, // Paid to Andy
  paymentTx: "0x...", // Boris pays Andy 2.0 $TIP

  // Boris' new branch inherits free status for chapters 1-3
  resultingBranch: {
    chapters: [
      { id: 1, status: "FREE", originalAuthor: "Andy" },
      { id: 2, status: "FREE", originalAuthor: "Andy" },
      { id: 3, status: "FREE", originalAuthor: "Andy" },
      { id: 4, status: "PAID", author: "Boris", price: 0.5, licenseFee: 2.0 }
    ]
  }
}
```

### **Step 3: Cecilia Creates Romance Remix**

```typescript
// Cecilia wants to remix Boris' version at chapter 9
{
  remixer: "Cecilia",
  sourceAuthor: "Boris",
  sourceChapters: [1, 2, 3, 4, 5, 6, 7, 8], // Boris' complete story so far
  newChapter: 9,
  licenseFeeRequired: 2.0, // Paid to Boris (not Andy)
  paymentTx: "0x...", // Cecilia pays Boris 2.0 $TIP

  // Cecilia's branch inherits the status structure
  resultingBranch: {
    chapters: [
      { id: 1, status: "FREE", originalAuthor: "Andy" },
      { id: 2, status: "FREE", originalAuthor: "Andy" },
      { id: 3, status: "FREE", originalAuthor: "Andy" },
      { id: 4, status: "PAID", author: "Boris", price: 0.5 },
      // ... chapters 5-8 from Boris
      { id: 9, status: "PAID", author: "Cecilia", price: 0.5, licenseFee: 2.0 }
    ]
  }
}
```

### **Step 4: Daisy Creates Alternative Path**

```typescript
// Daisy creates different chapter 9 from Andy's original
{
  remixer: "Daisy",
  sourceAuthor: "Andy",
  sourceChapters: [1, 2, 3, 4, 5, 6, 7, 8], // Andy's original through chapter 8
  newChapter: 9,
  licenseFeeRequired: 2.0, // Paid to Andy (since using Andy's chapter 8)
  paymentTx: "0x...", // Daisy pays Andy 2.0 $TIP

  resultingBranch: {
    chapters: [
      { id: 1, status: "FREE", originalAuthor: "Andy" },
      { id: 2, status: "FREE", originalAuthor: "Andy" },
      { id: 3, status: "FREE", originalAuthor: "Andy" },
      { id: 4, status: "PAID", author: "Andy", price: 0.5 },
      // ... chapters 5-8 from Andy
      { id: 9, status: "PAID", author: "Daisy", price: 0.5, licenseFee: 2.0 }
    ]
  }
}
```

---

## 📱 **Emma's Reader Experience**

### **Discovery Phase**

```
Emma browses StoryHouse.vip and finds:
├─ "Portal Chronicles" (Original by Andy) ⭐ 4.8/5
├─ "Portal Chronicles: Cyberpunk" (Boris' Sci-Fi) ⭐ 4.6/5
├─ "Portal Chronicles: Love & Circuits" (Cecilia's Romance) ⭐ 4.9/5
└─ "Portal Chronicles: Dark Path" (Daisy's Alternative) ⭐ 4.7/5
```

### **Reading Journey**

1. **Free Reading**: Emma reads chapters 1-3 of ANY version (all free)
2. **Version Comparison**: At chapter 3, Emma sees branching options:
   - Continue with Andy's original chapter 4
   - Try Boris' sci-fi version
   - Skip to Cecilia's romance branch
   - Explore Daisy's dark path
3. **Payment Decision**: Emma chooses which path to unlock with $TIP
4. **Reading Rewards**: Emma earns $TIP for completing paid chapters

### **Emma's Payment Flows**

```typescript
// Emma's chapter unlock decisions
{
  chapter4_choice: "Boris_SciFi", // 0.5 $TIP to Boris
  chapter5_choice: "Boris_SciFi", // 0.5 $TIP to Boris
  chapter9_choice: "Cecilia_Romance", // 0.5 $TIP to Cecilia

  totalSpent: 1.5, // $TIP
  tokensEarned: 0.8, // Read-to-earn rewards
  netCost: 0.7 // $TIP
}
```

---

## ❓ **Key Questions & Answers**

### **Q1: Should Cecilia's and Daisy's first 3 chapters be locked or free?**

**Answer: FREE** ✅

**Reasoning:**

- **Inheritance Principle**: Free content should remain free in derivatives
- **User Experience**: Readers shouldn't pay twice for same content
- **Legal Logic**: Basic chapters (1-3) provide story foundation, shouldn't be monetized by remixers
- **Platform Growth**: Free access to foundational content encourages exploration

**Implementation:**

```typescript
interface ChapterInheritance {
  originalChapter: Chapter;
  inheritedStatus: "FREE" | "PAID";
  rule: "Free content inherits as free, paid content requires license";
}
```

### **Q2: How do license fees flow in multi-level remixes?**

**Answer: Direct Parent Payment** 💰

- Cecilia pays Boris (not Andy) because she's remixing Boris' version
- Daisy pays Andy because she's remixing Andy's version
- No recursive payments up the chain

### **Q3: What happens to reading rewards in derivative works?**

**Answer: Standard read-to-earn applies to all versions** 🎁

- Emma earns $TIP for reading any version
- Authors earn from chapter unlocks in their versions
- Platform fee (5%) applies to all transactions

---

## 🎨 **UI/UX Implications**

### **Chapter Selection Interface**

```
┌─────────────────────────────────────────────┐
│ 📖 Portal Chronicles - Chapter 4            │
│                                            │
│ Choose Your Path:                          │
│                                            │
│ 🔮 Original (Andy)     | 🚀 Sci-Fi (Boris) │
│ Fantasy adventure      | Cyberpunk elements │
│ 💰 0.5 $TIP           | 💰 0.5 $TIP        │
│ [Continue Original]    | [Try Sci-Fi]      │
│                                            │
│ 🌹 Romance (Cecilia)   | ⚡ Dark (Daisy)   │
│ Available at Ch. 9     | Available at Ch. 9 │
│ [Preview Romance]      | [Preview Dark]    │
└─────────────────────────────────────────────┘
```

### **Revenue Dashboard (Multi-Author)**

```typescript
// Andy's dashboard shows:
{
  directRevenue: {
    chapterUnlocks: "15.2 $TIP", // From readers
    originalContent: "Chapters 4-10"
  },
  licensingRevenue: {
    remixFees: "4.0 $TIP", // From Boris (2.0) + Daisy (2.0)
    remixers: ["Boris", "Daisy"]
  },
  royalties: {
    ongoing: "0.5 $TIP/month", // From derivatives' success
    sources: ["Boris' branch", "Daisy' branch"]
  }
}
```

---

## 🌍 **Chinese Version Considerations**

### **Cultural Adaptations Needed:**

1. **Payment Psychology**: Chinese users prefer mobile payments (WeChat/Alipay integration)
2. **Content Discovery**: Chapter previews more important than western markets
3. **Social Features**: Group reading, chapter discussions essential
4. **Localized Content**: Chinese fantasy genres (仙侠, 都市 etc.)

### **Technical Requirements:**

```typescript
interface LocalizationConfig {
  language: "zh-CN" | "zh-TW" | "en-US";
  paymentMethods: ["WeChat", "Alipay", "MetaMask"];
  contentCategories: ["仙侠", "都市", "历史", "科幻"];
  socialFeatures: {
    chapterComments: boolean;
    groupReading: boolean;
    giftSending: boolean;
  };
}
```

---

## 🚀 **Next Steps**

1. **Update DESIGN.md** with visual diagrams
2. **Implement branching logic** in smart contracts
3. **Create prototype** of chapter selection interface
4. **Test user flows** with this scenario
5. **Evaluate Chinese market** requirements

Would you like me to proceed with updating the DESIGN.md file and creating visual diagrams for this branching model?
