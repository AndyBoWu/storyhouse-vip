// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Add this function to HybridRevenueControllerV2.sol after the configureChapter function

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

// Add this struct definition near the top with other structs
struct ChapterConfig {
    uint256 chapterNumber;
    address originalAuthor;
    bytes32 sourceBookId;
    uint256 unlockPrice;
    bool isOriginalContent;
}

// Additional helper function for batch operations with language support
/**
 * @dev Batch configure chapters with language metadata
 * @param bookId Book identifier  
 * @param chapterData Array of chapter configurations
 * @param languages Array of language codes (must match chapterData length)
 */
function batchConfigureChaptersWithLanguage(
    bytes32 bookId,
    ChapterConfig[] calldata chapterData,
    string[] calldata languages
) external onlyBookCurator(bookId) {
    require(chapterData.length == languages.length, "HybridRevenueV2: length mismatch");
    
    // First do the batch configuration
    batchConfigureChapters(bookId, chapterData);
    
    // Then set languages (assuming chapterLanguages mapping exists)
    for (uint256 i = 0; i < chapterData.length; i++) {
        bytes32 chapterId = keccak256(abi.encodePacked(bookId, chapterData[i].chapterNumber));
        chapterLanguages[chapterId] = languages[i];
        
        emit ChapterLanguageSet(chapterId, languages[i]);
    }
}

// Add this event for language tracking
event ChapterLanguageSet(bytes32 indexed chapterId, string language);