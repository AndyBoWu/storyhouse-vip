// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title HybridRevenueControllerV2
 * @notice Simplified version for easier deployment - anyone can register their own books
 */
contract HybridRevenueControllerV2 {
    IERC20 public immutable tipToken;
    address public admin;
    
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
    
    // Core storage
    mapping(bytes32 => Book) public books;
    mapping(bytes32 => mapping(uint256 => ChapterAttribution)) public chapterAttributions;
    mapping(bytes32 => mapping(address => bool)) public authorizedCurators;
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public userUnlocks;
    
    // Revenue tracking
    mapping(address => uint256) public authorTotalEarnings;
    mapping(address => uint256) public platformEarnings;
    mapping(bytes32 => uint256) public bookTotalRevenue;
    
    // Revenue split configuration
    uint256 public authorSharePercentage = 70;
    uint256 public curatorSharePercentage = 20;
    uint256 public platformSharePercentage = 10;
    
    // Events
    event BookRegistered(bytes32 indexed bookId, address indexed curator);
    event ChapterAttributionSet(bytes32 indexed bookId, uint256 chapterNumber, address originalAuthor);
    event ChapterUnlocked(bytes32 indexed bookId, uint256 chapterNumber, address indexed reader, uint256 amount);
    event RevenueDistributed(address indexed recipient, uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyBookCurator(bytes32 bookId) {
        require(
            msg.sender == books[bookId].curator || 
            authorizedCurators[bookId][msg.sender],
            "Not authorized"
        );
        _;
    }
    
    constructor(address _tipToken) {
        tipToken = IERC20(_tipToken);
        admin = msg.sender;
    }
    
    /**
     * @notice Register a new book - ANYONE CAN CALL THIS
     * @dev The msg.sender becomes the curator
     */
    function registerBook(
        bytes32 bookId,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        string memory ipfsMetadataHash
    ) external {
        require(!books[bookId].isActive, "Book already registered");
        require(totalChapters > 0 && totalChapters <= 100, "Invalid chapter count");
        
        books[bookId] = Book({
            curator: msg.sender,
            isDerivative: isDerivative,
            parentBookId: parentBookId,
            totalChapters: totalChapters,
            isActive: true,
            ipfsMetadataHash: ipfsMetadataHash
        });
        
        emit BookRegistered(bookId, msg.sender);
    }
    
    /**
     * @notice Set chapter attribution (only book curator)
     */
    function setChapterAttribution(
        bytes32 bookId,
        uint256 chapterNumber,
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent
    ) external onlyBookCurator(bookId) {
        require(books[bookId].isActive, "Book not registered");
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
     * @notice Authorize another address as curator
     */
    function authorizeCurator(bytes32 bookId, address curator) external {
        require(msg.sender == books[bookId].curator, "Only book curator");
        authorizedCurators[bookId][curator] = true;
    }
    
    /**
     * @notice Check if user has unlocked a chapter
     */
    function hasUnlockedChapter(address user, bytes32 bookId, uint256 chapterNumber) external view returns (bool) {
        return userUnlocks[user][bookId][chapterNumber];
    }
    
    /**
     * @notice Unlock a chapter by paying
     */
    function unlockChapter(bytes32 bookId, uint256 chapterNumber) external {
        require(books[bookId].isActive, "Book not registered");
        require(!userUnlocks[msg.sender][bookId][chapterNumber], "Already unlocked");
        
        ChapterAttribution memory attr = chapterAttributions[bookId][chapterNumber];
        require(attr.originalAuthor != address(0), "Chapter not configured");
        
        if (attr.unlockPrice > 0) {
            // Transfer TIP tokens from reader
            require(
                tipToken.transferFrom(msg.sender, address(this), attr.unlockPrice),
                "Payment failed"
            );
            
            // Distribute revenue
            _distributeRevenue(bookId, attr.originalAuthor, attr.unlockPrice);
        }
        
        userUnlocks[msg.sender][bookId][chapterNumber] = true;
        emit ChapterUnlocked(bookId, chapterNumber, msg.sender, attr.unlockPrice);
    }
    
    /**
     * @notice Internal revenue distribution
     */
    function _distributeRevenue(bytes32 bookId, address originalAuthor, uint256 amount) internal {
        uint256 authorAmount = (amount * authorSharePercentage) / 100;
        uint256 curatorAmount = (amount * curatorSharePercentage) / 100;
        uint256 platformAmount = amount - authorAmount - curatorAmount;
        
        // Pay author
        if (authorAmount > 0) {
            tipToken.transfer(originalAuthor, authorAmount);
            authorTotalEarnings[originalAuthor] += authorAmount;
            emit RevenueDistributed(originalAuthor, authorAmount);
        }
        
        // Pay curator (if different)
        address curator = books[bookId].curator;
        if (curatorAmount > 0) {
            if (curator != originalAuthor) {
                tipToken.transfer(curator, curatorAmount);
                authorTotalEarnings[curator] += curatorAmount;
                emit RevenueDistributed(curator, curatorAmount);
            } else {
                // Same person - add to author amount
                tipToken.transfer(originalAuthor, curatorAmount);
                authorTotalEarnings[originalAuthor] += curatorAmount;
            }
        }
        
        // Platform keeps the rest
        platformEarnings[address(this)] += platformAmount;
        bookTotalRevenue[bookId] += amount;
    }
    
    // Admin functions
    function setAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }
    
    function updateRevenueSharing(
        uint256 _authorShare,
        uint256 _curatorShare,
        uint256 _platformShare
    ) external onlyAdmin {
        require(_authorShare + _curatorShare + _platformShare == 100, "Must sum to 100");
        authorSharePercentage = _authorShare;
        curatorSharePercentage = _curatorShare;
        platformSharePercentage = _platformShare;
    }
    
    function withdrawPlatformEarnings() external onlyAdmin {
        uint256 amount = platformEarnings[address(this)];
        require(amount > 0, "No earnings");
        platformEarnings[address(this)] = 0;
        tipToken.transfer(admin, amount);
    }
}