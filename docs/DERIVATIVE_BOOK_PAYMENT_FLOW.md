# Derivative Book Payment Flow 💰

## 📚 Scenario Overview

**Setup:**
- **Andy** creates an original book with chapters 1-4
- **Bob** creates a derivative book that inherits Andy's chapters 1-4 and adds his own chapter 5
- **Cecilia** wants to read Bob's derivative book

## 💵 Payment Breakdown

When Cecilia reads **Bob's derivative book**, here's exactly who gets paid:

### Bob's Derivative Book Structure:
```
📖 "Bob's Galactic Adventure" (derivative book)
├── Chapter 1: Andy's content → FREE (inherited from Andy)
├── Chapter 2: Andy's content → FREE (inherited from Andy)  
├── Chapter 3: Andy's content → FREE (inherited from Andy)
├── Chapter 4: Andy's content → 💰 CECILIA PAYS ANDY (10 TIP)
└── Chapter 5: Bob's content → 💰 CECILIA PAYS BOB (10 TIP)
```

### 🎯 **Key Point: Revenue Attribution**

Even though Cecilia is reading Bob's book, **the revenue for each chapter goes to its original author**:

| Chapter | Author | Reader Experience | Payment |
|---------|--------|------------------|---------|
| **Ch 1-3** | Andy | **Free to read** | No payment needed |
| **Ch 4** | Andy | **Locked - requires payment** | Cecilia pays **Andy** 10 TIP |
| **Ch 5** | Bob | **Locked - requires payment** | Cecilia pays **Bob** 10 TIP |

## 🔒 Access Control Flow

1. **Cecilia opens Bob's book** → Sees chapters 1-3 for free
2. **Cecilia wants chapter 4** → System prompts: "Pay Andy 10 TIP to unlock"
3. **Cecilia pays Andy** → Chapter 4 unlocked in Bob's book
4. **Cecilia wants chapter 5** → System prompts: "Pay Bob 10 TIP to unlock"
5. **Cecilia pays Bob** → Chapter 5 unlocked

## 🏗️ Technical Implementation

### Revenue Controller Logic:
```solidity
// In Bob's derivative book:
chapters[4].originalAuthor = Andy's address
chapters[5].originalAuthor = Bob's address

// When Cecilia unlocks chapter 4:
payment.recipient = Andy's address  // Revenue goes to Andy
payment.amount = 10 TIP

// When Cecilia unlocks chapter 5:
payment.recipient = Bob's address   // Revenue goes to Bob
payment.amount = 10 TIP
```

### Chapter Attribution Tracking:
```typescript
// Bob's book metadata
{
  bookId: "bob-address/galactic-adventure",
  parentBook: "andy-address/original-story",
  isDerivative: true,
  chapterMap: {
    "ch1": "andy-address/original-story/chapters/ch1", // Points to Andy's content
    "ch2": "andy-address/original-story/chapters/ch2", // Points to Andy's content
    "ch3": "andy-address/original-story/chapters/ch3", // Points to Andy's content
    "ch4": "andy-address/original-story/chapters/ch4", // Points to Andy's content - PAID
    "ch5": "bob-address/galactic-adventure/chapters/ch5" // Bob's new content - PAID
  },
  originalAuthors: {
    "andy-address": {
      chapters: ["1", "2", "3", "4"],
      revenueShare: 80 // 4 out of 5 chapters
    },
    "bob-address": {
      chapters: ["5"],
      revenueShare: 20 // 1 out of 5 chapters
    }
  }
}
```

## 🎨 Derivative Book Features

### ✅ **Custom Title & Cover**
Bob can completely rebrand his derivative book:
- **Custom Title**: "Bob's Galactic Adventure" (not just "Andy's Story - Remix")
- **Custom Cover**: Upload his own cover art
- **Custom Description**: Write his own book description
- **Custom Genres**: Tag as sci-fi, adventure, etc.

### ✅ **Unique Book Identity**
- **Separate Discovery**: Bob's book appears as its own entity in the book marketplace
- **Independent Reviews**: Readers rate Bob's book separately from Andy's
- **Distinct Analytics**: Bob gets his own reader stats and engagement metrics

## 🚀 Benefits for All Parties

### 👨‍💻 **For Andy (Original Author):**
- Continues earning from chapters 1-4 across all derivative books
- No extra work required - passive income
- Attribution maintained across the multiverse

### 👨‍🎨 **For Bob (Derivative Author):**
- Creates his own branded book with custom title/cover
- Earns revenue from his new chapters (ch5+)
- Builds his own readership and reputation
- Can create multiple derivative books from the same source

### 👩‍🦱 **For Cecilia (Reader):**
- Clear pricing - knows exactly who she's paying for what
- Access to expanded story universe with multiple creative directions
- Can discover new authors through derivative works
- Single reading experience across inherited and new content

## 🌍 **Real-World Example**

Think of it like **Marvel Comics multiverse**:
- **Andy's book** = Earth-616 (main universe)
- **Bob's book** = Earth-1610 (Ultimate universe - same origin, different direction)
- **Readers** can enjoy both universes but pay each creator for their contributions

This creates a **fair IP economy** where original creators are always compensated while enabling creative expansion and new storytelling opportunities! 🎭✨