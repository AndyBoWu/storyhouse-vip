// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title HybridRevenueControllerV2
 * @notice Decentralized version that allows authors to register their own books
 * @dev Key change: registerBook() is now permissionless - anyone can register their own book
 */
contract HybridRevenueControllerV2 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    IERC20 public immutable tipToken;
    
    struct Book {
        address curator;
        bool isDerivative;
        bytes32 parentBookId;
        uint256 totalChapters;
        bool isActive;
        string ipfsMetadataHash;
    }
    
    struct ChapterAttribution {
        address originalAuthor;
        bytes32 sourceBookId;
        uint256 unlockPrice;
        bool isOriginalContent;
    }
    
    struct RevenueShare {
        address authorAddress;
        uint256 sharePercentage;
    }
    
    // Core storage
    mapping(bytes32 => Book) public books;
    mapping(bytes32 => mapping(uint256 => ChapterAttribution)) public chapterAttributions;
    mapping(bytes32 => mapping(address => bool)) public authorizedCurators;
    mapping(bytes32 => RevenueShare[]) public bookRevenueShares;
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public userUnlocks;
    
    // Revenue tracking
    mapping(address => uint256) public authorTotalEarnings;
    mapping(address => uint256) public platformEarnings;
    mapping(bytes32 => uint256) public bookTotalRevenue;
    
    // Revenue split configuration (can be updated by admin)
    uint256 public authorSharePercentage = 70;
    uint256 public curatorSharePercentage = 20;
    uint256 public platformSharePercentage = 10;
    
    // Events
    event BookRegistered(bytes32 indexed bookId, address indexed curator);
    event ChapterAttributionSet(bytes32 indexed bookId, uint256 chapterNumber, address originalAuthor);
    event ChapterUnlocked(bytes32 indexed bookId, uint256 chapterNumber, address indexed reader, uint256 amount);
    event RevenueDistributed(address indexed recipient, uint256 amount);
    
    constructor(address _tipToken) {
        tipToken = IERC20(_tipToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Register a new book (PERMISSIONLESS - anyone can register their own book)
     * @dev The msg.sender becomes the curator and can set chapter attributions
     */
    function registerBook(
        bytes32 bookId,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        string memory ipfsMetadataHash
    ) external whenNotPaused {
        require(!books[bookId].isActive, "Book already registered");
        require(totalChapters > 0, "Must have at least one chapter");
        
        books[bookId] = Book({
            curator: msg.sender, // Sender becomes the curator
            isDerivative: isDerivative,
            parentBookId: parentBookId,
            totalChapters: totalChapters,
            isActive: true,
            ipfsMetadataHash: ipfsMetadataHash
        });
        
        emit BookRegistered(bookId, msg.sender);
    }
    
    /**
     * @notice Set chapter attribution (only book curator or authorized curators)
     */
    function setChapterAttribution(
        bytes32 bookId,
        uint256 chapterNumber,
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent
    ) external {
        require(books[bookId].isActive, "Book not registered");
        require(
            msg.sender == books[bookId].curator || 
            authorizedCurators[bookId][msg.sender],
            "Not authorized to set attribution"
        );
        require(chapterNumber > 0 && chapterNumber <= books[bookId].totalChapters, "Invalid chapter");
        
        chapterAttributions[bookId][chapterNumber] = ChapterAttribution({
            originalAuthor: originalAuthor,
            sourceBookId: sourceBookId,
            unlockPrice: unlockPrice,
            isOriginalContent: isOriginalContent
        });
        
        emit ChapterAttributionSet(bookId, chapterNumber, originalAuthor);
    }
    
    /**
     * @notice Authorize another address to manage chapter attributions
     */
    function authorizeCurator(bytes32 bookId, address curator) external {
        require(msg.sender == books[bookId].curator, "Only book curator can authorize");
        authorizedCurators[bookId][curator] = true;
    }
    
    /**
     * @notice Unlock a chapter by paying the unlock price
     */
    function unlockChapter(bytes32 bookId, uint256 chapterNumber) external nonReentrant whenNotPaused {
        require(books[bookId].isActive, "Book not registered");
        require(!userUnlocks[msg.sender][bookId][chapterNumber], "Already unlocked");
        
        ChapterAttribution memory attr = chapterAttributions[bookId][chapterNumber];
        require(attr.originalAuthor != address(0), "Chapter attribution not set");
        
        if (attr.unlockPrice > 0) {
            // Transfer TIP tokens from reader
            require(
                tipToken.transferFrom(msg.sender, address(this), attr.unlockPrice),
                "Transfer failed"
            );
            
            // Distribute revenue
            _distributeRevenue(bookId, attr.originalAuthor, attr.unlockPrice);
        }
        
        userUnlocks[msg.sender][bookId][chapterNumber] = true;
        emit ChapterUnlocked(bookId, chapterNumber, msg.sender, attr.unlockPrice);
    }
    
    /**
     * @notice Internal function to distribute revenue
     */
    function _distributeRevenue(bytes32 bookId, address originalAuthor, uint256 amount) internal {
        uint256 authorAmount = (amount * authorSharePercentage) / 100;
        uint256 curatorAmount = (amount * curatorSharePercentage) / 100;
        uint256 platformAmount = amount - authorAmount - curatorAmount;
        
        // Transfer to original author
        if (authorAmount > 0) {
            tipToken.transfer(originalAuthor, authorAmount);
            authorTotalEarnings[originalAuthor] += authorAmount;
            emit RevenueDistributed(originalAuthor, authorAmount);
        }
        
        // Transfer to curator (if different from author)
        address curator = books[bookId].curator;
        if (curatorAmount > 0 && curator != originalAuthor) {
            tipToken.transfer(curator, curatorAmount);
            authorTotalEarnings[curator] += curatorAmount;
            emit RevenueDistributed(curator, curatorAmount);
        } else if (curatorAmount > 0) {
            // If curator is same as author, add to author's share
            tipToken.transfer(originalAuthor, curatorAmount);
            authorTotalEarnings[originalAuthor] += curatorAmount;
        }
        
        // Platform keeps the rest
        platformEarnings[address(this)] += platformAmount;
        bookTotalRevenue[bookId] += amount;
    }
    
    // Admin functions
    function updateRevenueSharing(
        uint256 _authorShare,
        uint256 _curatorShare,
        uint256 _platformShare
    ) external onlyRole(ADMIN_ROLE) {
        require(_authorShare + _curatorShare + _platformShare == 100, "Must sum to 100");
        authorSharePercentage = _authorShare;
        curatorSharePercentage = _curatorShare;
        platformSharePercentage = _platformShare;
    }
    
    function withdrawPlatformEarnings() external onlyRole(ADMIN_ROLE) {
        uint256 amount = platformEarnings[address(this)];
        require(amount > 0, "No earnings to withdraw");
        platformEarnings[address(this)] = 0;
        tipToken.transfer(msg.sender, amount);
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}