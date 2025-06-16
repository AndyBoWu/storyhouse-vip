// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TIPToken.sol";
import "./RewardsManager.sol";

/**
 * @title Chapter Access Controller
 * @dev Manages chapter access control with tiered pricing model
 *
 * Features:
 * - Free access to chapters 1-3 (no payment required)
 * - Paid access to chapters 4+ (0.5 TIP per chapter)
 * - Read-to-earn rewards (0.05-0.1 TIP per completion)
 * - Author revenue distribution
 * - Chapter registration with IP asset integration
 */
contract ChapterAccessController is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STORY_MANAGER_ROLE = keccak256("STORY_MANAGER_ROLE");
    // Events
    event ChapterRegistered(
        bytes32 indexed bookId,
        uint256 chapterNumber,
        address indexed author,
        string ipAssetId,
        bool isFree
    );
    
    event ChapterUnlocked(
        address indexed reader,
        bytes32 indexed bookId,
        uint256 chapterNumber,
        uint256 unlockPrice,
        uint256 timestamp
    );
    
    event ChapterCompleted(
        address indexed reader,
        bytes32 indexed bookId,
        uint256 chapterNumber,
        uint256 rewardAmount,
        uint256 timestamp
    );
    
    event AuthorRevenueDistributed(
        bytes32 indexed bookId,
        uint256 chapterNumber,
        address indexed author,
        uint256 amount
    );

    // State variables
    TIPToken public tipToken;
    RewardsManager public rewardsManager;
    
    // Pricing configuration
    uint256 public constant FREE_CHAPTERS_COUNT = 3; // Chapters 1-3 are free
    uint256 public unlockPrice = 5 * 10**17; // 0.5 TIP tokens
    uint256 public baseReadReward = 5 * 10**16; // 0.05 TIP tokens
    uint256 public authorRevenueShare = 80; // 80% to author, 20% to platform
    
    // Chapter metadata
    struct ChapterInfo {
        address author;
        string ipAssetId;
        uint256 wordCount;
        uint256 createdAt;
        bool isActive;
        bool isFree;
    }
    
    // Storage mappings
    mapping(bytes32 => mapping(uint256 => ChapterInfo)) public chapters;
    mapping(bytes32 => mapping(address => uint256)) public userUnlockedChapters; // bookId => user => latest unlocked chapter
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public hasUnlockedChapter;
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public hasCompletedChapter;
    
    // Revenue tracking
    mapping(bytes32 => uint256) public bookTotalRevenue;
    mapping(address => uint256) public authorTotalEarnings;
    uint256 public platformTotalEarnings;
    
    modifier onlyAuthor(bytes32 bookId, uint256 chapterNumber) {
        require(
            chapters[bookId][chapterNumber].author == msg.sender,
            "ChapterAccess: not chapter author"
        );
        _;
    }
    
    modifier chapterExists(bytes32 bookId, uint256 chapterNumber) {
        require(
            chapters[bookId][chapterNumber].isActive,
            "ChapterAccess: chapter does not exist"
        );
        _;
    }

    constructor(
        address initialAdmin,
        address _tipToken,
        address _rewardsManager
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        
        tipToken = TIPToken(_tipToken);
        rewardsManager = RewardsManager(_rewardsManager);
    }

    /**
     * @dev Register a new chapter with IP asset integration
     * @param bookId Unique book identifier
     * @param chapterNumber Chapter number (1-indexed)
     * @param author Chapter author address
     * @param ipAssetId Story Protocol IP asset ID
     * @param wordCount Number of words in the chapter
     */
    function registerChapter(
        bytes32 bookId,
        uint256 chapterNumber,
        address author,
        string memory ipAssetId,
        uint256 wordCount
    ) external onlyRole(STORY_MANAGER_ROLE) {
        require(author != address(0), "ChapterAccess: invalid author");
        require(chapterNumber > 0, "ChapterAccess: invalid chapter number");
        require(wordCount > 0, "ChapterAccess: invalid word count");
        require(!chapters[bookId][chapterNumber].isActive, "ChapterAccess: chapter already exists");
        
        bool isFree = chapterNumber <= FREE_CHAPTERS_COUNT;
        
        chapters[bookId][chapterNumber] = ChapterInfo({
            author: author,
            ipAssetId: ipAssetId,
            wordCount: wordCount,
            createdAt: block.timestamp,
            isActive: true,
            isFree: isFree
        });
        
        emit ChapterRegistered(bookId, chapterNumber, author, ipAssetId, isFree);
    }

    /**
     * @dev Unlock a chapter for reading (handles both free and paid chapters)
     * @param bookId Book identifier
     * @param chapterNumber Chapter to unlock
     */
    function unlockChapter(
        bytes32 bookId,
        uint256 chapterNumber
    ) external whenNotPaused nonReentrant chapterExists(bookId, chapterNumber) {
        require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "ChapterAccess: already unlocked");
        
        ChapterInfo memory chapter = chapters[bookId][chapterNumber];
        uint256 price = 0;
        
        // Check if payment is required (chapters 4+)
        if (!chapter.isFree) {
            price = unlockPrice;
            
            // Transfer payment from user
            require(
                tipToken.transferFrom(msg.sender, address(this), price),
                "ChapterAccess: payment failed"
            );
            
            // Distribute revenue
            _distributeRevenue(bookId, chapterNumber, price, chapter.author);
        }
        
        // Mark as unlocked
        hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
        
        // Update user's progress
        if (chapterNumber > userUnlockedChapters[bookId][msg.sender]) {
            userUnlockedChapters[bookId][msg.sender] = chapterNumber;
        }
        
        emit ChapterUnlocked(msg.sender, bookId, chapterNumber, price, block.timestamp);
    }

    /**
     * @dev Mark chapter as completed and distribute read rewards
     * @param bookId Book identifier
     * @param chapterNumber Chapter that was completed
     * @param readingTime Time spent reading (for validation)
     */
    function completeChapter(
        bytes32 bookId,
        uint256 chapterNumber,
        uint256 readingTime
    ) external whenNotPaused nonReentrant chapterExists(bookId, chapterNumber) {
        require(hasUnlockedChapter[msg.sender][bookId][chapterNumber], "ChapterAccess: chapter not unlocked");
        require(!hasCompletedChapter[msg.sender][bookId][chapterNumber], "ChapterAccess: already completed");
        require(readingTime >= 30, "ChapterAccess: insufficient reading time"); // Minimum 30 seconds
        
        ChapterInfo memory chapter = chapters[bookId][chapterNumber];
        
        // Calculate read reward based on word count and reading time
        uint256 rewardAmount = _calculateReadReward(chapter.wordCount, readingTime);
        
        // Mark as completed
        hasCompletedChapter[msg.sender][bookId][chapterNumber] = true;
        
        // Distribute read reward through rewards manager
        bytes32 contextId = keccak256(abi.encodePacked(bookId, chapterNumber));
        rewardsManager.distributeReward(msg.sender, rewardAmount, "read", contextId);
        
        emit ChapterCompleted(msg.sender, bookId, chapterNumber, rewardAmount, block.timestamp);
    }

    /**
     * @dev Batch unlock multiple chapters for gas efficiency
     * @param bookId Book identifier
     * @param chapterNumbers Array of chapters to unlock
     */
    function batchUnlockChapters(
        bytes32 bookId,
        uint256[] calldata chapterNumbers
    ) external whenNotPaused nonReentrant {
        require(chapterNumbers.length > 0 && chapterNumbers.length <= 10, "ChapterAccess: invalid batch size");
        
        uint256 totalCost = 0;
        
        // Calculate total cost and validate all chapters
        for (uint256 i = 0; i < chapterNumbers.length; i++) {
            uint256 chapterNumber = chapterNumbers[i];
            require(chapters[bookId][chapterNumber].isActive, "ChapterAccess: chapter does not exist");
            require(!hasUnlockedChapter[msg.sender][bookId][chapterNumber], "ChapterAccess: chapter already unlocked");
            
            if (!chapters[bookId][chapterNumber].isFree) {
                totalCost += unlockPrice;
            }
        }
        
        // Single payment for all paid chapters
        if (totalCost > 0) {
            require(
                tipToken.transferFrom(msg.sender, address(this), totalCost),
                "ChapterAccess: payment failed"
            );
        }
        
        // Process each chapter
        for (uint256 i = 0; i < chapterNumbers.length; i++) {
            uint256 chapterNumber = chapterNumbers[i];
            ChapterInfo memory chapter = chapters[bookId][chapterNumber];
            
            hasUnlockedChapter[msg.sender][bookId][chapterNumber] = true;
            
            if (chapterNumber > userUnlockedChapters[bookId][msg.sender]) {
                userUnlockedChapters[bookId][msg.sender] = chapterNumber;
            }
            
            uint256 chapterPrice = chapter.isFree ? 0 : unlockPrice;
            
            if (chapterPrice > 0) {
                _distributeRevenue(bookId, chapterNumber, chapterPrice, chapter.author);
            }
            
            emit ChapterUnlocked(msg.sender, bookId, chapterNumber, chapterPrice, block.timestamp);
        }
    }

    /**
     * @dev Internal function to distribute revenue between author and platform
     */
    function _distributeRevenue(
        bytes32 bookId,
        uint256 chapterNumber,
        uint256 amount,
        address author
    ) internal {
        uint256 authorShare = (amount * authorRevenueShare) / 100;
        uint256 platformShare = amount - authorShare;
        
        // Transfer to author
        if (authorShare > 0) {
            tipToken.transfer(author, authorShare);
            authorTotalEarnings[author] += authorShare;
        }
        
        // Keep platform share in contract
        if (platformShare > 0) {
            platformTotalEarnings += platformShare;
        }
        
        bookTotalRevenue[bookId] += amount;
        
        emit AuthorRevenueDistributed(bookId, chapterNumber, author, authorShare);
    }

    /**
     * @dev Calculate read reward based on chapter length and reading engagement
     */
    function _calculateReadReward(uint256 wordCount, uint256 readingTime) internal view returns (uint256) {
        // Base reward
        uint256 reward = baseReadReward;
        
        // Bonus for longer chapters (up to 2x for 2000+ words)
        if (wordCount >= 1000) {
            uint256 lengthBonus = (wordCount - 1000) * baseReadReward / 2000;
            reward += lengthBonus;
        }
        
        // Cap at 2x base reward
        if (reward > baseReadReward * 2) {
            reward = baseReadReward * 2;
        }
        
        return reward;
    }

    // View functions

    /**
     * @dev Check if user can access a chapter
     * @param user User address
     * @param bookId Book identifier
     * @param chapterNumber Chapter number
     * @return canAccess Whether user can read this chapter
     * @return price Price to unlock (0 if already unlocked or free)
     */
    function canAccessChapter(
        address user,
        bytes32 bookId,
        uint256 chapterNumber
    ) external view returns (bool canAccess, uint256 price) {
        if (!chapters[bookId][chapterNumber].isActive) {
            return (false, 0);
        }
        
        if (hasUnlockedChapter[user][bookId][chapterNumber]) {
            return (true, 0);
        }
        
        ChapterInfo memory chapter = chapters[bookId][chapterNumber];
        price = chapter.isFree ? 0 : unlockPrice;
        canAccess = true;
        
        return (canAccess, price);
    }

    /**
     * @dev Get chapter information
     */
    function getChapterInfo(
        bytes32 bookId,
        uint256 chapterNumber
    ) external view returns (
        address author,
        string memory ipAssetId,
        uint256 wordCount,
        bool isFree,
        bool isActive
    ) {
        ChapterInfo memory chapter = chapters[bookId][chapterNumber];
        return (
            chapter.author,
            chapter.ipAssetId,
            chapter.wordCount,
            chapter.isFree,
            chapter.isActive
        );
    }

    /**
     * @dev Get user's progress for a book
     */
    function getUserProgress(
        address user,
        bytes32 bookId
    ) external view returns (
        uint256 latestUnlockedChapter,
        uint256 totalUnlocked,
        uint256 totalCompleted
    ) {
        latestUnlockedChapter = userUnlockedChapters[bookId][user];
        
        // Count unlocked and completed chapters
        for (uint256 i = 1; i <= latestUnlockedChapter + 10; i++) { // Check a reasonable range
            if (chapters[bookId][i].isActive) {
                if (hasUnlockedChapter[user][bookId][i]) {
                    totalUnlocked++;
                }
                if (hasCompletedChapter[user][bookId][i]) {
                    totalCompleted++;
                }
            }
        }
        
        return (latestUnlockedChapter, totalUnlocked, totalCompleted);
    }

    // Admin functions

    /**
     * @dev Update pricing configuration
     */
    function updatePricing(uint256 _unlockPrice, uint256 _baseReadReward) external onlyRole(ADMIN_ROLE) {
        require(_unlockPrice > 0, "ChapterAccess: invalid unlock price");
        require(_baseReadReward > 0, "ChapterAccess: invalid read reward");
        
        unlockPrice = _unlockPrice;
        baseReadReward = _baseReadReward;
    }

    /**
     * @dev Update revenue sharing
     */
    function updateRevenueShare(uint256 _authorRevenueShare) external onlyRole(ADMIN_ROLE) {
        require(_authorRevenueShare <= 95, "ChapterAccess: author share too high");
        require(_authorRevenueShare >= 50, "ChapterAccess: author share too low");
        
        authorRevenueShare = _authorRevenueShare;
    }

    /**
     * @dev Withdraw platform earnings
     */
    function withdrawPlatformEarnings(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "ChapterAccess: zero address");
        require(amount <= platformTotalEarnings, "ChapterAccess: insufficient earnings");
        
        platformTotalEarnings -= amount;
        tipToken.transfer(to, amount);
    }

    /**
     * @dev Pause contract (emergency)
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