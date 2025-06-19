# StoryHouse V2 Royalty Flow Example

## Chapter-Level IP Hierarchy with Real Numbers

### Scenario: Popular Fantasy Novel Chapter

```
📚 Book: "The Dragon's Quest" by Alice (0x123...)
  └── 📄 Chapter 1: "The Beginning" (English) - Original IP
      ├── 🌍 Spanish Translation by Carlos (0x456...)
      │   └── 🎧 Spanish Audio by Maria (0x789...)
      ├── 🌍 Chinese Translation by Wei (0xabc...)
      └── 🌍 Japanese Translation by Yuki (0xdef...)
```

### Revenue & Royalty Calculations

#### Month 1 Earnings:
- **English Original**: 100 readers × 1 TIP = 100 TIP
- **Spanish Translation**: 500 readers × 1 TIP = 500 TIP
  - Carlos keeps: 375 TIP (75%)
  - Alice receives: 125 TIP (25%)
- **Spanish Audio**: 200 listeners × 2 TIP = 400 TIP
  - Maria keeps: 320 TIP (80%)
  - Carlos receives: 80 TIP (20%)
  - Alice receives: 20 TIP (5% cascading)
- **Chinese Translation**: 1000 readers × 1 TIP = 1000 TIP
  - Wei keeps: 750 TIP (75%)
  - Alice receives: 250 TIP (25%)
- **Japanese Translation**: 300 readers × 1 TIP = 300 TIP
  - Yuki keeps: 225 TIP (75%)
  - Alice receives: 75 TIP (25%)

#### Total Earnings:
- **Alice (Original Author)**: 100 + 125 + 20 + 250 + 75 = **570 TIP**
- **Carlos (Spanish Translator)**: 375 + 80 = **455 TIP**
- **Wei (Chinese Translator)**: **750 TIP**
- **Yuki (Japanese Translator)**: **225 TIP**
- **Maria (Spanish Audio)**: **320 TIP**

### Key Benefits:

1. **Original Author Wins**: Alice earns 5.7x more due to translations
2. **Translators Prosper**: Carlos earns almost as much as the original
3. **Market Expansion**: Chapter reaches 2100 readers vs 100 English-only
4. **Derivative Innovation**: Audio version creates new revenue stream
5. **Automatic Distribution**: Story Protocol handles all royalty splits

### Implementation with Story Protocol:

```typescript
// 1. Original chapter registration
const originalChapter = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
  ipMetadata: {
    title: "Chapter 1: The Beginning",
    language: "en",
    author: "0x123..."
  },
  licenseTermsData: [{
    commercialUse: true,
    derivativesAllowed: true,
    derivativesReciprocal: true,
    commercialRevShare: 25, // 25% royalty from derivatives
    currency: TIP_TOKEN_ADDRESS
  }]
})

// 2. Spanish translation registration
const spanishTranslation = await storyClient.ipAsset.registerDerivativeWithLicenseTokens({
  parentIpIds: [originalChapter.ipId],
  licenseTokenIds: [translatorLicense.tokenId],
  ipMetadata: {
    title: "Capítulo 1: El Comienzo",
    language: "es",
    translator: "0x456..."
  }
})

// 3. Automatic royalty flow
// When reader pays 1 TIP for Spanish chapter:
// - 0.75 TIP → Carlos (translator)
// - 0.25 TIP → Alice (original author)
// Handled entirely by Story Protocol!
```

### Translation Licensing Model:

1. **Preview License** (Free)
   - Read original to prepare translation
   - Cannot publish or monetize

2. **Translator License** (10 TIP)
   - Create and monetize translation
   - 25% royalty to original
   - Non-exclusive

3. **Exclusive Language License** (1000 TIP)
   - Sole translation rights for language
   - 25% royalty to original
   - 1-year exclusivity

This creates a vibrant ecosystem where everyone benefits from the success of quality translations!