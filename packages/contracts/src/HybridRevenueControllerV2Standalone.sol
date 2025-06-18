// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TIPToken.sol";

/**
 * @title Hybrid Revenue Controller V2 Standalone
 * @dev PERMISSIONLESS version without RewardsManager dependency
 * 
 * Key Features:
 * - Anyone can register their own books
 * - msg.sender automatically becomes the curator when registering
 * - Maintains same revenue distribution model (70/20/10)
 * - No dependency on RewardsManager
 */
contract HybridRevenueControllerV2Standalone is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
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
        bool isDerivative,
        bytes32 parentBookId
    );
    
    event ChapterAttributionSet(
        bytes32 indexed bookId,
        uint256 chapterNumber,
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
        mapping(uint256 => address) chapterAuthors; // chapter number => original author
        mapping(uint256 => uint256) chapterAuthorShares; // custom revenue splits
        bool isActive;
    }
    
    mapping(bytes32 => BookMetadata) public books;
    mapping(address => bytes32[]) public curatorBooks;
    
    // Revenue tracking
    mapping(address => uint256) public totalEarnings;
    mapping(bytes32 => uint256) public bookRevenue;
    
    // Chapter unlock tracking
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public hasUnlockedChapter;
    
    // Platform treasury
    address public platformTreasury;
    uint256 public platformRevenue;
    
    // Pricing
    uint256 public constant CHAPTER_PRICE = 5 * 10**17; // 0.5 TIP

    modifier bookExists(bytes32 bookId) {
        require(books[bookId].isActive, "Book does not exist");
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
     * @param parentBookId If derivative, the original book ID (use bytes32(0) if not)
     */
    function registerBook(
        bytes32 bookId,
        bool isDerivative,
        bytes32 parentBookId
    ) external whenNotPaused {
        require(!books[bookId].isActive, "Book already registered");
        
        BookMetadata storage book = books[bookId];
        book.curator = msg.sender; // Permissionless: sender becomes curator
        book.isDerivative = isDerivative;
        book.parentBookId = parentBookId;
        book.isActive = true;
        
        curatorBooks[msg.sender].push(bookId);
        
        emit BookRegistered(bookId, msg.sender, isDerivative, parentBookId);
    }

    /**
     * @dev Set chapter attribution and custom revenue shares
     * @param bookId The book identifier
     * @param chapterNumber Chapter number (1-indexed)
     * @param originalAuthor Address of the chapter's original author
     */
    function setChapterAttribution(
        bytes32 bookId,
        uint256 chapterNumber,
        address originalAuthor
    ) external bookExists(bookId) {
        require(msg.sender == books[bookId].curator, "Only curator can set attribution");
        require(chapterNumber > 0, "Invalid chapter number");
        require(originalAuthor != address(0), "Invalid author address");
        
        books[bookId].chapterAuthors[chapterNumber] = originalAuthor;
        
        if (books[bookId].totalChapters < chapterNumber) {
            books[bookId].totalChapters = chapterNumber;
        }
        
        emit ChapterAttributionSet(
            bookId,
            chapterNumber,
            originalAuthor,
            defaultAuthorShare,
            new string[](0)
        );
    }

    /**
     * @dev Unlock a chapter by paying TIP tokens
     * @param bookId The book identifier
     * @param chapterNumber Chapter to unlock (1-indexed)
     */
    function unlockChapter(
        bytes32 bookId,
        uint256 chapterNumber
    ) external nonReentrant whenNotPaused bookExists(bookId) {
        require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "Invalid chapter");
        require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "Already unlocked");
        
        // Process payment
        require(tipToken.transferFrom(msg.sender, address(this), CHAPTER_PRICE), "Payment failed");
        
        // Mark as unlocked
        hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
        
        // Distribute revenue
        _distributeRevenue(bookId, chapterNumber, CHAPTER_PRICE);
        
        emit ChapterUnlocked(msg.sender, bookId, chapterNumber, CHAPTER_PRICE, block.timestamp);
    }

    /**
     * @dev Internal function to distribute revenue according to the hybrid model
     */
    function _distributeRevenue(
        bytes32 bookId,
        uint256 chapterNumber,
        uint256 amount
    ) internal {
        BookMetadata storage book = books[bookId];
        address chapterAuthor = book.chapterAuthors[chapterNumber];
        
        // If no specific author set, curator gets author share too
        if (chapterAuthor == address(0)) {
            chapterAuthor = book.curator;
        }
        
        // Calculate shares
        uint256 authorShare = (amount * defaultAuthorShare) / 100;
        uint256 curatorShare = (amount * defaultCuratorShare) / 100;
        uint256 platformShare = amount - authorShare - curatorShare;
        
        // Transfer shares
        if (chapterAuthor == book.curator) {
            // If curator is also author, they get both shares
            uint256 combinedShare = authorShare + curatorShare;
            require(tipToken.transfer(chapterAuthor, combinedShare), "Author payment failed");
            totalEarnings[chapterAuthor] += combinedShare;
        } else {
            // Separate transfers for author and curator
            require(tipToken.transfer(chapterAuthor, authorShare), "Author payment failed");
            require(tipToken.transfer(book.curator, curatorShare), "Curator payment failed");
            totalEarnings[chapterAuthor] += authorShare;
            totalEarnings[book.curator] += curatorShare;
        }
        
        // Platform share stays in contract
        platformRevenue += platformShare;
        bookRevenue[bookId] += amount;
        
        emit RevenueDistributed(
            bookId,
            chapterNumber,
            chapterAuthor,
            book.curator,
            authorShare,
            curatorShare,
            platformShare
        );
    }

    /**
     * @dev Check if a user has unlocked a specific chapter
     */
    function hasUnlocked(
        address user,
        bytes32 bookId,
        uint256 chapterNumber
    ) external view returns (bool) {
        return hasUnlockedChapter[user][bookId][chapterNumber];
    }

    /**
     * @dev Get book information
     */
    function getBookInfo(bytes32 bookId) 
        external 
        view 
        returns (
            bool exists,
            address curator,
            bool isDerivative,
            bytes32 parentBookId,
            bool isActive
        ) 
    {
        BookMetadata storage book = books[bookId];
        return (
            book.isActive,
            book.curator,
            book.isDerivative,
            book.parentBookId,
            book.isActive
        );
    }

    /**
     * @dev Get chapter author for a specific chapter
     */
    function getChapterAuthor(bytes32 bookId, uint256 chapterNumber) 
        external 
        view 
        returns (address) 
    {
        return books[bookId].chapterAuthors[chapterNumber];
    }

    /**
     * @dev Update platform treasury address
     */
    function setPlatformTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        platformTreasury = _treasury;
    }

    /**
     * @dev Withdraw platform revenue
     */
    function withdrawPlatformRevenue() external onlyRole(ADMIN_ROLE) {
        require(platformTreasury != address(0), "Treasury not set");
        uint256 amount = platformRevenue;
        platformRevenue = 0;
        require(tipToken.transfer(platformTreasury, amount), "Withdrawal failed");
    }

    /**
     * @dev Update revenue sharing percentages
     */
    function updateRevenueShares(
        uint256 _authorShare,
        uint256 _curatorShare,
        uint256 _platformShare
    ) external onlyRole(ADMIN_ROLE) {
        require(_authorShare + _curatorShare + _platformShare == 100, "Shares must total 100");
        defaultAuthorShare = _authorShare;
        defaultCuratorShare = _curatorShare;
        defaultPlatformShare = _platformShare;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}