# Collaborative Storytelling System

## Overview & Vision

StoryHouse.vip implements a revolutionary collaborative storytelling platform using Story Protocol's IP licensing system. Writers can create branching narratives where any reader can purchase remix licenses to continue or diverge from existing stories, creating an infinite multiverse of interconnected tales.

### Core Innovation
- **Chapter-level IP Assets**: Each chapter is a separate IP asset with its own licensing terms
- **Branching Narratives**: Readers can branch from any chapter to create alternate storylines
- **Automatic Royalties**: Parent chapters earn royalties from derivative works through blockchain-native distribution
- **Community-Driven Stories**: Stories evolve through community participation rather than single authorship

## Reading vs Remix Licenses

### Reading Licenses
**Purpose**: Personal consumption access to paid chapters
- **Transferable**: `false` (locked to wallet)
- **Commercial Use**: `false` (personal reading only)
- **Derivatives Allowed**: `false` (cannot create derivative works)
- **Price**: 0.5 TIP tokens for chapters 4+
- **Chapters 1-3**: FREE (no license required)

### Remix Licenses  
**Purpose**: Permission to create derivative chapters based on existing content
- **Transferable**: `true` (can be sold/traded)
- **Commercial Use**: `true` (can monetize derivative works)
- **Derivatives Allowed**: `true` (full creative rights)
- **Price**: Set by original author (suggested: 10+ TIP tokens)
- **Author Control**: Each author decides if their chapters allow remixes

## Chapter Branching Rules

### Eligibility Requirements
To purchase a remix license for Chapter N, the user must:
1. **Target chapter allows remixes** (author setting)
2. **Write the next sequential chapter** (N+1) in the story

### Branching Logic
```typescript
// Example: Bob wants to write Chapter 3 based on Andy's Chapter 2
const canBuyRemixLicense = {
  // Prerequisites (simplified)
  targetChapter: "chapter-2",          // Buying remix license for chapter 2
  willWrite: "chapter-3",              // Can only write chapter 3 (next in sequence)
  parentAllowsRemix: true              // Andy must have enabled remixes for chapter 2
  
  // No longer required:
  // hasRead: ["chapter-1", "chapter-2"] ❌ Removed reading requirement
}
```

### Story Paths Example
```
Andy's Original Story:
Chapter 1 (Andy) → Chapter 2 (Andy) → Chapter 3 (Andy) → Chapter 4 (Andy)

Possible Branches:
├── Branch from Chapter 1: Ch1 (Andy) → Ch2 (Bob) → Ch3 (Bob) → Ch4 (Carol)
├── Branch from Chapter 2: Ch1 (Andy) → Ch2 (Andy) → Ch3 (Diana) → Ch4 (Eve)
└── Branch from Chapter 3: Ch1 (Andy) → Ch2 (Andy) → Ch3 (Andy) → Ch4 (Frank)
```

## Story Genealogy System

### IP Asset Hierarchy
Each chapter is registered as a Story Protocol IP Asset with genealogy tracking:

```typescript
interface ChapterWithGenealogy {
  // Basic Chapter Info
  id: string
  title: string
  content: string
  author: string
  chapterNumber: number
  
  // Story Protocol Integration
  ipAssetId: string              // Unique IP Asset identifier
  parentIpAssetId?: string       // Which chapter this derives from
  licenseTermsId: string         // Associated license terms
  
  // Genealogy Tracking
  storyRoot: string              // Original story ID
  parentChapter?: string         // Direct parent chapter
  branches: string[]             // Child chapters/branches
  generationLevel: number        // Depth in the story tree
  
  // Access Control
  readingLicensePrice: number    // Cost to read (0.5 TIP for ch4+)
  remixLicensePrice: number      // Cost to remix (author-set)
  allowsRemix: boolean           // Author's remix permission
}
```

### Family Tree Visualization
```
🌳 Story Family Tree Example:

"The Magic Kingdom" (Root Story)
├── Ch1 (Andy - Original Author)
│   ├── Ch2 (Andy) → Ch3 (Andy) → Ch4 (Andy) [Original Path]
│   ├── Ch2 (Bob) → Ch3 (Bob) → Ch4 (Carol) [Bob's Alternate Timeline]
│   └── Ch2 (Diana) 
│       ├── Ch3 (Diana) → Ch4 (Eve) [Diana's Path]
│       └── Ch3 (Frank) → Ch4 (Grace) [Frank's Branch from Diana's Ch2]
└── Multiple infinite branching possibilities
```

## UI/UX Flows

### Reader Experience

#### 1. Browsing and Reading
```
📚 Story Discovery
┌─────────────────────────────────────────┐
│ "The Magic Kingdom" by Andy             │
│ ⭐⭐⭐⭐⭐ (4.8/5) • 12 branches        │
│                                         │
│ Chapter 1: "The Beginning" (FREE)       │
│ [📖 Read] [🎨 Write Ch2: 10 TIP]       │
│                                         │
│ Chapter 2: "The Journey" (FREE)         │  
│ [📖 Read] [🎨 Write Ch3: 15 TIP]       │
│                                         │
│ Chapter 3: "The Discovery" (FREE)       │
│ [📖 Read] [🎨 Write Ch4: 20 TIP]       │
│                                         │
│ Chapter 4: "The Revelation"             │
│ [💰 Read: 0.5 TIP] [🎨 Write Ch5: 25 TIP] │
└─────────────────────────────────────────┘

Note: No reading prerequisites required for remix licenses!
Writers can jump in at any chapter that interests them.
```

#### 2. Story Tree Navigation
```
🌳 Explore Story Branches
┌─────────────────────────────────────────┐
│ Current Path: Andy → Andy → Andy → Andy │
│                                         │
│ Alternative Paths:                      │
│ • Andy → Bob → Bob → Carol (4.9⭐)      │
│ • Andy → Andy → Diana → Eve (4.7⭐)     │
│ • Andy → Andy → Andy → Frank (4.2⭐)    │
│                                         │
│ [Switch Path] [Compare Endings]         │
└─────────────────────────────────────────┘
```

### Writer Experience

#### 1. Remix License Purchase
```
🎨 Continue "The Magic Kingdom"
┌─────────────────────────────────────────┐
│ Write your Chapter 4:                   │
│ • Continue from Andy's Chapter 3        │
│ • Remix License: 20 TIP                 │
│ • You'll earn 85% of future revenue     │
│ • Andy earns 10% (parent royalty)      │
│                                         │
│ Your Chapter Settings:                  │
│ ☑️ Allow others to remix my chapter    │
│ 📝 Remix price: [25] TIP               │
│                                         │
│ [💰 Purchase Remix License]             │
└─────────────────────────────────────────┘

Note: No need to read previous chapters first!
Jump right into writing your continuation.
```

#### 2. Chapter Publishing
```
✍️ Publish Chapter 4: "The New Path"
┌─────────────────────────────────────────┐
│ Parent: Chapter 3 "The Discovery" (Andy)│
│ Word Count: 2,847                       │
│ Estimated Reading Time: 12 minutes      │
│                                         │
│ Monetization Settings:                  │
│ • Reading Price: 0.5 TIP (standard)    │
│ • Allow Remixes: ✅ Yes                 │
│ • Remix License Price: 25 TIP          │
│                                         │
│ IP Registration:                        │
│ ☑️ Register as IP Asset                 │
│ ☑️ Attach to parent chapter             │
│ ☑️ Set up royalty distribution          │
│                                         │
│ [🚀 Publish Chapter]                    │
└─────────────────────────────────────────┘
```

## Royalty Distribution

### Revenue Sharing Model
When readers purchase access to derivative chapters, revenue flows up the genealogy chain:

#### Single Generation (Direct Derivative)
```
Bob's Chapter 2 (derived from Andy's Chapter 1)
Reader pays 0.5 TIP for access:
├── Bob (Author): 85% = 0.425 TIP
├── Andy (Parent): 10% = 0.05 TIP  
└── Platform: 5% = 0.025 TIP
```

#### Multi-Generation (Deep Derivative)
```
Eve's Chapter 4 (derived from Diana's Chapter 3 → Andy's Chapter 2 → Andy's Chapter 1)
Reader pays 0.5 TIP for access:
├── Eve (Author): 70% = 0.35 TIP
├── Diana (Parent Ch3): 15% = 0.075 TIP
├── Andy (Grandparent Ch2): 10% = 0.05 TIP
├── Andy (Great-grandparent Ch1): 3% = 0.015 TIP
└── Platform: 2% = 0.01 TIP
```

#### Remix License Sales
```
When someone buys remix license for Bob's Chapter 2 (25 TIP):
├── Bob (Chapter Author): 80% = 20 TIP
├── Andy (Parent): 15% = 3.75 TIP
└── Platform: 5% = 1.25 TIP
```

### Royalty Decay Model
- **Direct derivative**: Parent gets 10-15%
- **Second generation**: Grandparent gets 5-10%  
- **Third generation**: Great-grandparent gets 3-5%
- **Fourth+ generations**: Minimal percentage (1-2%)
- **Maximum ancestors**: Limit to 5 generations to prevent micro-payments

## Technical Implementation

### Story Protocol Integration

#### 1. License Terms Configuration
```typescript
// Reading License (Premium tier customized)
const readingLicenseTerms = {
  transferable: false,              // 🔒 Locked to wallet
  royaltyPolicy: LAP_ROYALTY_POLICY, // Liquid Absolute Percentage
  defaultMintingFee: parseEther('0.5'), // 0.5 TIP tokens
  expiration: 0,                    // Never expires
  commercialUse: false,             // Personal reading only
  commercialAttribution: false,     
  derivativesAllowed: false,        // Cannot create derivatives
  derivativesAttribution: false,
  currency: TIP_TOKEN_ADDRESS,
  uri: 'ipfs://reading-license-metadata'
}

// Remix License (Premium tier standard)
const remixLicenseTerms = {
  transferable: true,               // Can be sold/traded
  royaltyPolicy: LRP_ROYALTY_POLICY, // Liquid Royalty Policy  
  defaultMintingFee: parseEther('10'), // Author-set price
  expiration: 0,                    // Never expires
  commercialUse: true,              // Full commercial rights
  commercialAttribution: true,
  derivativesAllowed: true,         // Can create derivatives
  derivativesAttribution: true,
  currency: TIP_TOKEN_ADDRESS,
  uri: 'ipfs://remix-license-metadata'
}
```

#### 2. IP Asset Registration
```typescript
// Register chapter as IP Asset
const registerChapterAsIP = async (chapterData: ChapterData) => {
  // 1. Upload content to IPFS
  const ipfsHash = await uploadToIPFS(chapterData.content)
  
  // 2. Register IP Asset
  const registration = await storyClient.ipAsset.mintAndRegisterIp({
    spgNftContract: CHAPTER_NFT_CONTRACT,
    ipMetadata: {
      ipMetadataURI: `ipfs://${ipfsHash}`,
      ipMetadataHash: generateHash(chapterData.content),
      nftMetadataURI: `ipfs://${chapterData.coverImageHash}`,
      nftMetadataHash: generateHash(chapterData.coverImage)
    }
  })
  
  // 3. Attach license terms
  await storyClient.license.attachLicenseTerms({
    ipId: registration.ipId,
    licenseTermsId: chapterData.licenseTermsId,
    licenseTemplate: PIL_TEMPLATE_ADDRESS
  })
  
  // 4. Register derivative relationship (if applicable)
  if (chapterData.parentIpAssetId) {
    await storyClient.ipAsset.registerDerivative({
      childIpId: registration.ipId,
      parentIpIds: [chapterData.parentIpAssetId],
      licenseTermsIds: [chapterData.parentLicenseTermsId]
    })
  }
  
  return registration.ipId
}
```

#### 3. License Token Minting
```typescript
// Mint reading license
const mintReadingLicense = async (chapterIpAssetId: string, userAddress: string) => {
  return await storyClient.license.mintLicenseTokens({
    licensorIpId: chapterIpAssetId,
    licenseTermsId: readingLicenseTermsId,
    amount: 1,
    receiver: userAddress,
    royaltyContext: encodeRoyaltyContext({
      targetAncestors: [], // No ancestor royalties for reading
      targetRoyaltyAmount: []
    })
  })
}

// Mint remix license  
const mintRemixLicense = async (chapterIpAssetId: string, userAddress: string) => {
  return await storyClient.license.mintLicenseTokens({
    licensorIpId: chapterIpAssetId,
    licenseTermsId: remixLicenseTermsId,
    amount: 1,
    receiver: userAddress,
    royaltyContext: encodeRoyaltyContext({
      targetAncestors: getAncestorChain(chapterIpAssetId),
      targetRoyaltyAmount: calculateRoyaltyDistribution(chapterIpAssetId)
    })
  })
}
```

### Database Schema

#### Chapter Genealogy Table
```sql
CREATE TABLE chapter_genealogy (
  id UUID PRIMARY KEY,
  chapter_id VARCHAR(66) NOT NULL, -- IP Asset ID
  parent_chapter_id VARCHAR(66), -- Parent IP Asset ID
  story_root_id VARCHAR(66) NOT NULL, -- Root story IP Asset ID
  generation_level INTEGER NOT NULL DEFAULT 0,
  branch_path TEXT[], -- Array of ancestor IDs
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (parent_chapter_id) REFERENCES chapter_genealogy(chapter_id),
  INDEX idx_story_root (story_root_id),
  INDEX idx_parent_chapter (parent_chapter_id),
  INDEX idx_generation_level (generation_level)
);
```

#### License Ownership Tracking
```sql
CREATE TABLE license_tokens (
  id UUID PRIMARY KEY,
  token_id VARCHAR(66) NOT NULL, -- License Token ID
  owner_address VARCHAR(42) NOT NULL,
  chapter_ip_asset_id VARCHAR(66) NOT NULL,
  license_type ENUM('reading', 'remix') NOT NULL,
  license_terms_id VARCHAR(66) NOT NULL,
  minting_fee DECIMAL(36,18) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  minted_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_owner_address (owner_address),
  INDEX idx_chapter_ip_asset (chapter_ip_asset_id),
  INDEX idx_license_type (license_type),
  UNIQUE KEY unique_reading_license (owner_address, chapter_ip_asset_id, license_type)
);
```

### API Endpoints

#### Chapter Access Validation
```typescript
// GET /api/books/{bookId}/chapter/{chapterNumber}/access
interface ChapterAccessResponse {
  canRead: boolean
  hasReadingLicense: boolean
  canRemix: boolean
  hasRemixLicense: boolean
  readingLicensePrice: string
  remixLicensePrice: string
  parentChapter?: string
  // requiredReading: string[] // ❌ Removed - no reading prerequisites for remix
}
```

#### License Minting
```typescript
// POST /api/books/{bookId}/chapter/{chapterNumber}/mint-license
interface MintLicenseRequest {
  userAddress: string
  licenseType: 'reading' | 'remix'
  chapterIpAssetId: string
}

interface MintLicenseResponse {
  success: boolean
  licenseTokenId?: string
  transactionHash?: string
  error?: string
}
```

#### Story Tree Query
```typescript
// GET /api/stories/{storyRootId}/tree
interface StoryTreeResponse {
  storyRoot: ChapterNode
  branches: ChapterNode[]
  totalChapters: number
  totalAuthors: number
  maxGeneration: number
}

interface ChapterNode {
  chapterIpAssetId: string
  chapterNumber: number
  title: string
  author: string
  parentChapterId?: string
  children: ChapterNode[]
  generationLevel: number
  stats: {
    totalReads: number
    totalRevenue: string
    rating: number
  }
}
```

## Examples & Use Cases

### Use Case 1: Fantasy Epic with Multiple Endings
**"The Dragon's Quest" by Sarah**
- Sarah writes chapters 1-5 of an epic fantasy
- Chapter 3 introduces a major choice: "Save the village or pursue the dragon?"
- Reader Alex buys remix license for Chapter 3, writes Chapter 4a: "The Village Hero"
- Reader Maya buys remix license for Chapter 3, writes Chapter 4b: "The Dragon Hunter"  
- Both paths continue to grow with community contributions
- Sarah earns royalties from all derivative chapters

### Use Case 2: Mystery Novel with Reader Detectives
**"The Locked Room" by Detective_Mike**
- Mike writes chapters 1-3 setting up an impossible murder mystery
- Writers can jump in to solve the case (no need to read all previous chapters):
  - Chapter 4a: "The Butler's Secret" by CrimeFan99
  - Chapter 4b: "The Hidden Passage" by MysteryMom
  - Chapter 4c: "The Time Paradox" by SciFiSarah
- Community votes on their favorite solution
- Most popular branch gets featured as "Community Canon"

### Use Case 3: Educational Choose-Your-Own-Adventure
**"History Adventures: Ancient Rome" by Professor_Jones**
- Educational content with historical scenarios
- Students can jump into any historical period to explore "What if" scenarios:
  - "What if Caesar crossed the Rubicon differently?"
  - "What if Cleopatra allied with different Romans?"
- No need to read entire historical sequence first
- Each branch teaches different historical lessons
- Professor earns ongoing royalties while students learn through creative writing

### Use Case 4: Collaborative World-Building
**"New Metropolis 2157" by Cyberpunk_Collective**
- Original authors create the world and first few chapters
- Community members buy remix licenses to explore different districts:
  - "The Underground Markets" 
  - "Corporate Towers Mystery"
  - "Rebel Hideout Chronicles"
- Shared universe grows organically
- Cross-references between branches create rich interconnected lore

## Future Enhancements

### Phase 1: Core System (Current)
- ✅ Chapter-level IP assets
- ✅ Reading vs Remix licenses  
- ✅ Basic genealogy tracking
- ✅ Simple royalty distribution

### Phase 2: Enhanced Discovery
- 🔄 Story tree visualization UI
- 🔄 Branch comparison tools
- 🔄 Community voting on favorite paths
- 🔄 Curated collections by theme/genre

### Phase 3: Advanced Features
- 📋 Cross-chapter references and callbacks
- 📋 Collaborative world-building tools
- 📋 Time-limited writing contests
- 📋 Reader prediction markets

### Phase 4: AI Integration
- 📋 AI-assisted story consistency checking
- 📋 Automatic genre and theme tagging
- 📋 Personalized reading path recommendations
- 📋 AI co-writing tools for remix authors

### Phase 5: Advanced Economics
- 📋 Dynamic pricing based on demand
- 📋 Seasonal/event-based license sales
- 📋 Bundle deals for story collections
- 📋 Secondary market for remix licenses

### Phase 6: Social Features
- 📋 Author collaboration tools
- 📋 Reader discussion forums per chapter
- 📋 Live writing events and challenges
- 📋 Author/reader mentorship programs

## Technical Considerations

### Performance Optimization
- **Caching Strategy**: Cache license ownership checks for frequently accessed chapters
- **Pagination**: Large story trees need efficient querying and display
- **IPFS Optimization**: Pin popular content for faster loading

### Security Measures
- **License Verification**: Always verify blockchain state for access control
- **Sybil Protection**: Prevent fake accounts from manipulating story ratings
- **Content Moderation**: Automated and manual review for inappropriate derivatives

### Scalability Planning
- **Database Sharding**: Partition by story root for large-scale deployment
- **CDN Integration**: Distribute content globally for reading performance
- **Async Processing**: Handle royalty distributions asynchronously

---

*This document serves as the comprehensive specification for StoryHouse.vip's collaborative storytelling system. It should be updated as new features are implemented and user feedback is incorporated.*