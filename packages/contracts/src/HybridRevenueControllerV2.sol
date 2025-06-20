// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// RewardsManager import removed - no longer needed
import "./TIPToken.sol";

/**
 * @title Hybrid Revenue Controller V2
 * @dev PERMISSIONLESS version - Anyone can register their own books
 * 
 * Key Changes from V1:
 * - registerBook() is now permissionless - no STORY_MANAGER_ROLE required
 * - msg.sender automatically becomes the curator when registering
 * - Maintains same revenue distribution model (70/20/10)
 * - Backward compatible with existing interfaces
 *
 * Core Features:
 * - Multi-author revenue splits for chapter unlocks
 * - Real-time attribution based on chapter source
 * - Configurable revenue sharing percentages
 * - Book curator rewards for curation work
 * - Platform fee collection
 * - Revenue transparency and audit trails
 */
contract HybridRevenueControllerV2 is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Events (same as V1 for compatibility)
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
    
    // Financial tracking
    mapping(address => uint256) public authorTotalEarnings;
    mapping(address => uint256) public curatorTotalEarnings;
    mapping(address => uint256) public platformTotalEarnings;
    mapping(bytes32 => uint256) public bookTotalRevenue;
    mapping(address => mapping(bytes32 => uint256)) public userTotalSpent;
    
    // Book discovery
    bytes32[] public allBookIds;
    mapping(address => bytes32[]) public curatorBooks;
    mapping(address => bytes32[]) public authorBooks;

    // Modifiers
    modifier onlyBookCurator(bytes32 bookId) {
        require(
            books[bookId].curator == msg.sender || 
            authorizedCurators[bookId][msg.sender],
            "HybridRevenueV2: not authorized curator"
        );
        _;
    }
    
    modifier onlyActiveBook(bytes32 bookId) {
        require(books[bookId].isActive, "HybridRevenueV2: book not active");
        _;
    }

    constructor(
        address initialAdmin,
        address _tipToken
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        
        tipToken = TIPToken(_tipToken);
    }

    /**
     * @dev Register a book for revenue sharing - PERMISSIONLESS
     * @notice Anyone can register their book. The msg.sender becomes the curator.
     * @param bookId Unique identifier for the book
     * @param isDerivative Whether this book contains chapters from other books
     * @param parentBookId If derivative, the parent book ID
     * @param totalChapters Number of chapters in book
     * @param ipfsMetadataHash IPFS hash pointing to R2 metadata
     */
    function registerBook(
        bytes32 bookId,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        string memory ipfsMetadataHash
    ) external {
        require(!books[bookId].isActive, "HybridRevenueV2: book already registered");
        require(totalChapters > 0 && totalChapters <= 1000000, "HybridRevenueV2: invalid chapter count");
        
        // msg.sender becomes the curator automatically
        books[bookId] = BookMetadata({
            curator: msg.sender,
            isDerivative: isDerivative,
            parentBookId: parentBookId,
            totalChapters: totalChapters,
            isActive: true,
            ipfsMetadataHash: ipfsMetadataHash
        });
        
        // Track for discovery
        allBookIds.push(bookId);
        curatorBooks[msg.sender].push(bookId);
        
        emit BookRegistered(
            bookId,
            msg.sender,
            totalChapters,
            isDerivative ? "derivative" : "original"
        );
    }

    /**
     * @dev Set chapter attribution for revenue sharing
     * @notice Only the book curator or authorized curators can set attributions
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
        require(originalAuthor != address(0), "HybridRevenueV2: zero author address");
        require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "HybridRevenueV2: invalid chapter");
        
        chapterAttributions[bookId][chapterNumber] = ChapterAttribution({
            originalAuthor: originalAuthor,
            sourceBookId: sourceBookId,
            unlockPrice: unlockPrice,
            isOriginalContent: isOriginalContent
        });
        
        // Track author's contribution
        if (!_isAuthorTracked(originalAuthor, bookId)) {
            authorBooks[originalAuthor].push(bookId);
        }
    }

    /**
     * @dev Authorize another address to manage book
     * @param bookId Book identifier
     * @param curator Address to authorize
     */
    function authorizeCurator(bytes32 bookId, address curator) external onlyBookCurator(bookId) {
        authorizedCurators[bookId][curator] = true;
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
        require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "HybridRevenueV2: already unlocked");
        require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "HybridRevenueV2: invalid chapter");
        
        ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
        require(attribution.originalAuthor != address(0), "HybridRevenueV2: chapter not configured");
        
        uint256 unlockPrice = attribution.unlockPrice;
        
        // Handle payment if chapter is not free
        if (unlockPrice > 0) {
            require(
                tipToken.transferFrom(msg.sender, address(this), unlockPrice),
                "HybridRevenueV2: payment failed"
            );
        }
        
        // Mark as unlocked
        hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
        userTotalSpent[msg.sender][bookId] += unlockPrice;
        bookTotalRevenue[bookId] += unlockPrice;
        
        // Distribute revenue if there was a payment
        if (unlockPrice > 0) {
            _distributeRevenue(bookId, chapterNumber, unlockPrice, attribution);
        }
        
        emit ChapterUnlocked(msg.sender, bookId, chapterNumber, unlockPrice, block.timestamp);
    }

    /**
     * @dev Internal function to distribute revenue among stakeholders
     */
    function _distributeRevenue(
        bytes32 bookId,
        uint256 chapterNumber,
        uint256 amount,
        ChapterAttribution memory attribution
    ) internal {
        BookMetadata memory book = books[bookId];
        
        // Calculate shares
        uint256 authorShare = (amount * defaultAuthorShare) / 100;
        uint256 curatorShare = (amount * defaultCuratorShare) / 100;
        uint256 platformShare = amount - authorShare - curatorShare;
        
        // Distribute to original author
        if (authorShare > 0) {
            tipToken.transfer(attribution.originalAuthor, authorShare);
            authorTotalEarnings[attribution.originalAuthor] += authorShare;
        }
        
        // Distribute to curator (if different from author)
        if (curatorShare > 0) {
            if (book.curator != attribution.originalAuthor) {
                tipToken.transfer(book.curator, curatorShare);
                curatorTotalEarnings[book.curator] += curatorShare;
            } else {
                // If curator is also the author, add to author's share
                tipToken.transfer(attribution.originalAuthor, curatorShare);
                authorTotalEarnings[attribution.originalAuthor] += curatorShare;
            }
        }
        
        // Platform share stays in contract
        platformTotalEarnings[address(this)] += platformShare;
        
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
     * @dev Batch unlock multiple chapters
     * @param bookId Book identifier
     * @param chapterNumbers Array of chapter numbers to unlock
     */
    function batchUnlockChapters(
        bytes32 bookId,
        uint256[] calldata chapterNumbers
    ) external whenNotPaused nonReentrant onlyActiveBook(bookId) {
        uint256 totalCost = 0;
        
        // Calculate total cost and validate
        for (uint256 i = 0; i < chapterNumbers.length; i++) {
            uint256 chapterNumber = chapterNumbers[i];
            require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "HybridRevenueV2: chapter already unlocked");
            
            ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
            require(attribution.originalAuthor != address(0), "HybridRevenueV2: chapter not configured");
            
            totalCost += attribution.unlockPrice;
        }
        
        // Transfer total payment
        if (totalCost > 0) {
            require(
                tipToken.transferFrom(msg.sender, address(this), totalCost),
                "HybridRevenueV2: payment failed"
            );
        }
        
        // Unlock each chapter
        for (uint256 i = 0; i < chapterNumbers.length; i++) {
            uint256 chapterNumber = chapterNumbers[i];
            ChapterAttribution memory attribution = chapterAttributions[bookId][chapterNumber];
            
            hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
            userTotalSpent[msg.sender][bookId] += attribution.unlockPrice;
            bookTotalRevenue[bookId] += attribution.unlockPrice;
            
            if (attribution.unlockPrice > 0) {
                _distributeRevenue(bookId, chapterNumber, attribution.unlockPrice, attribution);
            }
            
            emit ChapterUnlocked(msg.sender, bookId, chapterNumber, attribution.unlockPrice, block.timestamp);
        }
    }

    // Admin functions
    function updateRevenueSharing(
        uint256 _authorShare,
        uint256 _curatorShare,
        uint256 _platformShare
    ) external onlyRole(ADMIN_ROLE) {
        require(_authorShare + _curatorShare + _platformShare == 100, "HybridRevenueV2: shares must sum to 100");
        
        defaultAuthorShare = _authorShare;
        defaultCuratorShare = _curatorShare;
        defaultPlatformShare = _platformShare;
    }

    function withdrawPlatformEarnings() external onlyRole(ADMIN_ROLE) {
        uint256 amount = platformTotalEarnings[address(this)];
        require(amount > 0, "HybridRevenueV2: no earnings to withdraw");
        
        platformTotalEarnings[address(this)] = 0;
        tipToken.transfer(msg.sender, amount);
    }

    function deactivateBook(bytes32 bookId) external onlyRole(ADMIN_ROLE) {
        books[bookId].isActive = false;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // View functions
    function getBookInfo(bytes32 bookId) external view returns (
        address curator,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        bool isActive,
        uint256 totalRevenue
    ) {
        BookMetadata memory book = books[bookId];
        return (
            book.curator,
            book.isDerivative,
            book.parentBookId,
            book.totalChapters,
            book.isActive,
            bookTotalRevenue[bookId]
        );
    }

    function getChapterInfo(bytes32 bookId, uint256 chapterNumber) external view returns (
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent,
        bool isUnlockedByUser
    ) {
        ChapterAttribution memory attr = chapterAttributions[bookId][chapterNumber];
        return (
            attr.originalAuthor,
            attr.sourceBookId,
            attr.unlockPrice,
            attr.isOriginalContent,
            hasUnlockedChapter[msg.sender][bookId][chapterNumber]
        );
    }

    function getCuratorBooks(address curator) external view returns (bytes32[] memory) {
        return curatorBooks[curator];
    }

    function getAuthorBooks(address author) external view returns (bytes32[] memory) {
        return authorBooks[author];
    }

    function getUserSpending(address user, bytes32 bookId) external view returns (uint256) {
        return userTotalSpent[user][bookId];
    }

    // Internal helper
    function _isAuthorTracked(address author, bytes32 bookId) internal view returns (bool) {
        bytes32[] memory authorBookList = authorBooks[author];
        for (uint256 i = 0; i < authorBookList.length; i++) {
            if (authorBookList[i] == bookId) {
                return true;
            }
        }
        return false;
    }
}