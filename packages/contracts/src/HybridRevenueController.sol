// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RewardsManager.sol";
import "./TIPToken.sol";

/**
 * @title Hybrid Revenue Controller
 * @dev Manages revenue sharing for hybrid branched books where chapters come from multiple authors
 *
 * Core Features:
 * - Multi-author revenue splits for chapter unlocks
 * - Real-time attribution based on chapter source
 * - Configurable revenue sharing percentages
 * - Book curator rewards for curation work
 * - Platform fee collection
 * - Revenue transparency and audit trails
 *
 * Phase 3 Implementation: Revenue Sharing for Collaborative Storytelling
 */
contract HybridRevenueController is Ownable, Pausable, ReentrancyGuard {
    // Events
    event ChapterUnlocked(
        address indexed reader,
        bytes32 indexed bookId,
        uint256 chapterNumber,
        uint256 totalPrice,
        uint256 timestamp
    );
    
    event RevenueDistributed(
        bytes32 indexed bookId,
        uint256 chapterNumber,
        address indexed chapterAuthor,
        address indexed bookCurator,
        uint256 authorShare,
        uint256 curatorShare,
        uint256 platformShare
    );
    
    event BookRegistered(
        bytes32 indexed bookId,
        address indexed curator,
        uint256 totalChapters,
        string bookType // "original" or "derivative"
    );
    
    event RevenueSharingUpdated(
        bytes32 indexed bookId,
        address indexed authorAddress,
        uint256 newRevenueShare,
        string[] chapters
    );

    // State variables
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    
    // Revenue sharing configuration (default percentages)
    uint256 public defaultAuthorShare = 70; // 70% to chapter author
    uint256 public defaultCuratorShare = 20; // 20% to book curator
    uint256 public defaultPlatformShare = 10; // 10% to platform
    
    // Book metadata and revenue structure
    struct BookMetadata {
        address curator; // Who assembled this book
        bool isDerivative; // true for branched books
        bytes32 parentBookId; // for derivative books
        uint256 totalChapters;
        bool isActive;
        string ipfsMetadataHash; // Link to R2 metadata
    }
    
    struct ChapterAttribution {
        address originalAuthor; // Who wrote this chapter
        bytes32 sourceBookId; // Which book this chapter comes from
        uint256 unlockPrice; // Price in TIP tokens (wei)
        bool isOriginalContent; // true if from original book
    }
    
    struct RevenueShare {
        address authorAddress;
        uint256 sharePercentage; // 0-100
        string[] chapters; // ["ch1", "ch2", "ch3"]
    }
    
    // Storage
    mapping(bytes32 => BookMetadata) public books;
    mapping(bytes32 => mapping(uint256 => ChapterAttribution)) public chapterAttributions;
    mapping(bytes32 => RevenueShare[]) public bookRevenueShares;
    mapping(bytes32 => mapping(address => bool)) public authorizedCurators;
    
    // User unlock tracking
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public hasUnlockedChapter;
    mapping(address => mapping(bytes32 => uint256)) public userTotalSpent; // per book
    
    // Revenue tracking
    mapping(bytes32 => uint256) public bookTotalRevenue;
    mapping(address => uint256) public authorTotalEarnings;
    mapping(address => uint256) public curatorTotalEarnings;
    uint256 public platformTotalEarnings;
    
    modifier onlyBookCurator(bytes32 bookId) {
        require(
            books[bookId].curator == msg.sender || authorizedCurators[bookId][msg.sender],
            "HybridRevenue: unauthorized curator"
        );
        _;
    }
    
    modifier onlyActiveBook(bytes32 bookId) {
        require(books[bookId].isActive, "HybridRevenue: book not active");
        _;
    }

    constructor(
        address initialOwner,
        address _rewardsManager,
        address _tipToken
    ) Ownable(initialOwner) {
        rewardsManager = RewardsManager(_rewardsManager);
        tipToken = TIPToken(_tipToken);
    }

    /**
     * @dev Register a new book (original or derivative)
     * @param bookId Unique book identifier from R2 storage
     * @param curator Address of the book curator/assembler
     * @param isDerivative true for branched books
     * @param parentBookId parent book ID (if derivative)
     * @param totalChapters number of chapters in book
     * @param ipfsMetadataHash IPFS hash pointing to R2 metadata
     */
    function registerBook(
        bytes32 bookId,
        address curator,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        string memory ipfsMetadataHash
    ) external onlyOwner {
        require(curator != address(0), "HybridRevenue: zero curator address");
        require(!books[bookId].isActive, "HybridRevenue: book already registered");
        
        books[bookId] = BookMetadata({
            curator: curator,
            isDerivative: isDerivative,
            parentBookId: parentBookId,
            totalChapters: totalChapters,
            isActive: true,
            ipfsMetadataHash: ipfsMetadataHash
        });
        
        emit BookRegistered(
            bookId,
            curator,
            totalChapters,
            isDerivative ? "derivative" : "original"
        );
    }

    /**
     * @dev Set chapter attribution for revenue sharing
     * @param bookId Book identifier
     * @param chapterNumber Chapter number (1-indexed)
     * @param originalAuthor Address of the chapter author
     * @param sourceBookId Book where this chapter originated
     * @param unlockPrice Price to unlock this chapter (in wei)
     * @param isOriginalContent true if this chapter is from the original book
     */
    function setChapterAttribution(
        bytes32 bookId,
        uint256 chapterNumber,
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent
    ) external onlyBookCurator(bookId) onlyActiveBook(bookId) {
        require(originalAuthor != address(0), "HybridRevenue: zero author address");
        require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "HybridRevenue: invalid chapter");
        
        chapterAttributions[bookId][chapterNumber] = ChapterAttribution({
            originalAuthor: originalAuthor,
            sourceBookId: sourceBookId,
            unlockPrice: unlockPrice,
            isOriginalContent: isOriginalContent
        });
    }

    /**
     * @dev Unlock a chapter and distribute revenue
     * @param bookId Book identifier
     * @param chapterNumber Chapter to unlock
     */
    function unlockChapter(
        bytes32 bookId,
        uint256 chapterNumber
    ) external whenNotPaused nonReentrant onlyActiveBook(bookId) {
        require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "HybridRevenue: already unlocked");
        require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "HybridRevenue: invalid chapter");
        
        ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
        require(attribution.originalAuthor != address(0), "HybridRevenue: chapter not configured");
        
        uint256 unlockPrice = attribution.unlockPrice;
        require(unlockPrice > 0, "HybridRevenue: invalid price");
        
        // Transfer payment from user
        require(
            tipToken.transferFrom(msg.sender, address(this), unlockPrice),
            "HybridRevenue: payment failed"
        );
        
        // Mark as unlocked
        hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
        userTotalSpent[msg.sender][bookId] += unlockPrice;
        bookTotalRevenue[bookId] += unlockPrice;
        
        // Distribute revenue
        _distributeRevenue(bookId, chapterNumber, unlockPrice, attribution);
        
        emit ChapterUnlocked(msg.sender, bookId, chapterNumber, unlockPrice, block.timestamp);
    }

    /**
     * @dev Internal function to distribute revenue among stakeholders
     */
    function _distributeRevenue(
        bytes32 bookId,
        uint256 chapterNumber,
        uint256 totalAmount,
        ChapterAttribution memory attribution
    ) internal {
        BookMetadata memory book = books[bookId];
        
        // Calculate shares
        uint256 authorShare = (totalAmount * defaultAuthorShare) / 100;
        uint256 curatorShare = (totalAmount * defaultCuratorShare) / 100;
        uint256 platformShare = totalAmount - authorShare - curatorShare; // Remaining amount
        
        // Distribute to chapter author
        if (authorShare > 0) {
            tipToken.transfer(attribution.originalAuthor, authorShare);
            authorTotalEarnings[attribution.originalAuthor] += authorShare;
        }
        
        // Distribute to book curator
        if (curatorShare > 0) {
            tipToken.transfer(book.curator, curatorShare);
            curatorTotalEarnings[book.curator] += curatorShare;
        }
        
        // Keep platform share in contract (can be withdrawn by owner)
        if (platformShare > 0) {
            platformTotalEarnings += platformShare;
        }
        
        emit RevenueDistributed(
            bookId,
            chapterNumber,
            attribution.originalAuthor,
            book.curator,
            authorShare,
            curatorShare,
            platformShare
        );
    }

    /**
     * @dev Batch unlock multiple chapters for gas efficiency
     */
    function batchUnlockChapters(
        bytes32 bookId,
        uint256[] calldata chapterNumbers
    ) external whenNotPaused nonReentrant onlyActiveBook(bookId) {
        require(chapterNumbers.length > 0, "HybridRevenue: empty array");
        require(chapterNumbers.length <= 10, "HybridRevenue: too many chapters");
        
        uint256 totalCost = 0;
        
        // Calculate total cost and validate
        for (uint256 i = 0; i < chapterNumbers.length; i++) {
            uint256 chapterNumber = chapterNumbers[i];
            require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "HybridRevenue: chapter already unlocked");
            require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "HybridRevenue: invalid chapter");
            
            ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
            require(attribution.originalAuthor != address(0), "HybridRevenue: chapter not configured");
            totalCost += attribution.unlockPrice;
        }
        
        // Single payment for all chapters
        require(
            tipToken.transferFrom(msg.sender, address(this), totalCost),
            "HybridRevenue: payment failed"
        );
        
        // Process each chapter
        for (uint256 i = 0; i < chapterNumbers.length; i++) {
            uint256 chapterNumber = chapterNumbers[i];
            ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
            
            hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
            userTotalSpent[msg.sender][bookId] += attribution.unlockPrice;
            bookTotalRevenue[bookId] += attribution.unlockPrice;
            
            _distributeRevenue(bookId, chapterNumber, attribution.unlockPrice, attribution);
            
            emit ChapterUnlocked(msg.sender, bookId, chapterNumber, attribution.unlockPrice, block.timestamp);
        }
    }

    /**
     * @dev Update revenue sharing percentages (only owner)
     */
    function updateRevenueSharing(
        uint256 _authorShare,
        uint256 _curatorShare,
        uint256 _platformShare
    ) external onlyOwner {
        require(_authorShare + _curatorShare + _platformShare == 100, "HybridRevenue: shares must sum to 100");
        require(_authorShare >= 50, "HybridRevenue: author share too low"); // Authors must get at least 50%
        
        defaultAuthorShare = _authorShare;
        defaultCuratorShare = _curatorShare;
        defaultPlatformShare = _platformShare;
    }

    /**
     * @dev Withdraw platform earnings (only owner)
     */
    function withdrawPlatformEarnings(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "HybridRevenue: zero address");
        require(amount <= platformTotalEarnings, "HybridRevenue: insufficient platform earnings");
        
        platformTotalEarnings -= amount;
        tipToken.transfer(to, amount);
    }

    /**
     * @dev Deactivate a book (emergency only)
     */
    function deactivateBook(bytes32 bookId) external onlyOwner {
        books[bookId].isActive = false;
    }

    // View functions

    /**
     * @dev Check if user has unlocked a specific chapter
     */
    function hasUserUnlockedChapter(
        address user,
        bytes32 bookId,
        uint256 chapterNumber
    ) external view returns (bool) {
        return hasUnlockedChapter[user][bookId][chapterNumber];
    }

    /**
     * @dev Get chapter pricing and attribution info
     */
    function getChapterInfo(
        bytes32 bookId,
        uint256 chapterNumber
    ) external view returns (
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent
    ) {
        ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
        return (
            attribution.originalAuthor,
            attribution.sourceBookId,
            attribution.unlockPrice,
            attribution.isOriginalContent
        );
    }

    /**
     * @dev Get book metadata
     */
    function getBookInfo(bytes32 bookId) external view returns (
        address curator,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        bool isActive,
        string memory ipfsMetadataHash
    ) {
        BookMetadata memory book = books[bookId];
        return (
            book.curator,
            book.isDerivative,
            book.parentBookId,
            book.totalChapters,
            book.isActive,
            book.ipfsMetadataHash
        );
    }

    /**
     * @dev Get revenue statistics
     */
    function getRevenueStats(bytes32 bookId) external view returns (
        uint256 totalRevenue,
        uint256 totalChapters,
        address curator
    ) {
        return (
            bookTotalRevenue[bookId],
            books[bookId].totalChapters,
            books[bookId].curator
        );
    }

    /**
     * @dev Get user's unlock status for a book
     */
    function getUserBookProgress(
        address user,
        bytes32 bookId
    ) external view returns (
        uint256 chaptersUnlocked,
        uint256 totalSpent,
        uint256 totalChapters
    ) {
        BookMetadata memory book = books[bookId];
        uint256 unlockedCount = 0;
        
        for (uint256 i = 1; i <= book.totalChapters; i++) {
            if (hasUnlockedChapter[user][bookId][i]) {
                unlockedCount++;
            }
        }
        
        return (
            unlockedCount,
            userTotalSpent[user][bookId],
            book.totalChapters
        );
    }

    /**
     * @dev Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}