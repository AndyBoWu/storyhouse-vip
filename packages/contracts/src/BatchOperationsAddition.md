# Batch Operations for HybridRevenueControllerV2

## Add these to your existing contract:

### 1. New Struct (add with other structs around line 95)
```solidity
struct ChapterConfig {
    uint256 chapterNumber;
    address originalAuthor;
    bytes32 sourceBookId;
    uint256 unlockPrice;
    bool isOriginalContent;
}
```

### 2. New Mapping for Languages (add with other mappings around line 105)
```solidity
mapping(bytes32 => string) public chapterLanguages; // chapterId => language code
```

### 3. New Event (add with other events around line 65)
```solidity
event ChapterLanguageSet(bytes32 indexed chapterId, string language);
```

### 4. Main Batch Function (add after configureChapter function around line 220)
```solidity
/**
 * @dev Batch configure multiple chapters at once - useful for translations
 * @param bookId Book identifier
 * @param chapterData Array of chapter configurations
 */
function batchConfigureChapters(
    bytes32 bookId,
    ChapterConfig[] calldata chapterData
) external onlyBookCurator(bookId) {
    require(chapterData.length > 0, "HybridRevenueV2: empty chapter data");
    require(chapterData.length <= 50, "HybridRevenueV2: too many chapters");
    
    BookMetadata memory book = books[bookId];
    require(book.isActive, "HybridRevenueV2: book not registered");
    
    for (uint256 i = 0; i < chapterData.length; i++) {
        ChapterConfig memory config = chapterData[i];
        
        // Validate chapter number
        require(
            config.chapterNumber > 0 && config.chapterNumber <= book.totalChapters,
            "HybridRevenueV2: invalid chapter number"
        );
        
        // Validate author address
        require(config.originalAuthor != address(0), "HybridRevenueV2: invalid author");
        
        // Validate price
        require(config.unlockPrice <= 10000 * 10**18, "HybridRevenueV2: price too high");
        
        // Store attribution
        chapterAttributions[bookId][config.chapterNumber] = ChapterAttribution({
            originalAuthor: config.originalAuthor,
            sourceBookId: config.sourceBookId,
            unlockPrice: config.unlockPrice,
            isOriginalContent: config.isOriginalContent
        });
        
        // Update price if needed
        if (config.unlockPrice > 0 && chapterPrices[bookId][config.chapterNumber] == 0) {
            chapterPrices[bookId][config.chapterNumber] = config.unlockPrice;
        }
        
        // Track unique authors
        bool isNewAuthor = true;
        for (uint256 j = 0; j < bookAuthors[bookId].length; j++) {
            if (bookAuthors[bookId][j] == config.originalAuthor) {
                isNewAuthor = false;
                break;
            }
        }
        if (isNewAuthor) {
            bookAuthors[bookId].push(config.originalAuthor);
            authorBooks[config.originalAuthor].push(bookId);
        }
        
        emit ChapterConfigured(
            bookId,
            config.chapterNumber,
            config.originalAuthor,
            config.unlockPrice
        );
    }
}
```

## Usage Example:

```javascript
// Registering a book with translations
const bookId = ethers.utils.id("MyBook-v1");

// 1. Register the book
await contract.registerBook(
    bookId,
    false, // not derivative
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    10, // 10 chapters
    "ipfs://QmXxx..."
);

// 2. Batch configure all language versions
const chapters = [
    // English chapters
    { chapterNumber: 1, originalAuthor: myAddress, sourceBookId: bookId, unlockPrice: parseEther("1"), isOriginalContent: true },
    { chapterNumber: 2, originalAuthor: myAddress, sourceBookId: bookId, unlockPrice: parseEther("1"), isOriginalContent: true },
    // Spanish translations
    { chapterNumber: 3, originalAuthor: myAddress, sourceBookId: bookId, unlockPrice: parseEther("1"), isOriginalContent: true },
    { chapterNumber: 4, originalAuthor: myAddress, sourceBookId: bookId, unlockPrice: parseEther("1"), isOriginalContent: true },
    // Chinese translations
    { chapterNumber: 5, originalAuthor: myAddress, sourceBookId: bookId, unlockPrice: parseEther("1"), isOriginalContent: true },
    { chapterNumber: 6, originalAuthor: myAddress, sourceBookId: bookId, unlockPrice: parseEther("1"), isOriginalContent: true },
];

await contract.batchConfigureChapters(bookId, chapters);
```

## Benefits:

1. **Gas Efficient**: One transaction instead of many
2. **Atomic Operation**: All succeed or all fail
3. **Translation Friendly**: Upload all languages at once
4. **Time Saving**: Faster deployment of multi-language content

## Additional Considerations:

You might also want to add:
- Language tracking per chapter
- Linking chapters across languages
- Batch price updates
- Regional pricing support

These can be added incrementally based on needs.