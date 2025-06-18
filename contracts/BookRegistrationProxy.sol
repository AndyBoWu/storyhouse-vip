// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHybridRevenueController {
    function registerBook(
        bytes32 bookId,
        address curator,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        string memory ipfsMetadataHash
    ) external;
    
    function setChapterAttribution(
        bytes32 bookId,
        uint256 chapterNumber,
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent
    ) external;
}

/**
 * @title BookRegistrationProxy
 * @notice Allows anyone to register their books without needing STORY_MANAGER_ROLE
 * @dev This contract should be granted STORY_MANAGER_ROLE on HybridRevenueController
 */
contract BookRegistrationProxy {
    IHybridRevenueController public immutable hybridController;
    
    mapping(bytes32 => address) public bookOwners;
    
    event BookRegistered(bytes32 indexed bookId, address indexed owner);
    
    constructor(address _hybridController) {
        hybridController = IHybridRevenueController(_hybridController);
    }
    
    /**
     * @notice Register a book on behalf of the sender
     * @dev The sender becomes the curator and owner
     */
    function registerBook(
        bytes32 bookId,
        bool isDerivative,
        bytes32 parentBookId,
        uint256 totalChapters,
        string memory ipfsMetadataHash
    ) external {
        require(bookOwners[bookId] == address(0), "Book already registered");
        
        // Register in HybridRevenueController with sender as curator
        hybridController.registerBook(
            bookId,
            msg.sender, // Sender becomes curator
            isDerivative,
            parentBookId,
            totalChapters,
            ipfsMetadataHash
        );
        
        bookOwners[bookId] = msg.sender;
        emit BookRegistered(bookId, msg.sender);
    }
    
    /**
     * @notice Set chapter attribution (only book owner)
     */
    function setChapterAttribution(
        bytes32 bookId,
        uint256 chapterNumber,
        address originalAuthor,
        bytes32 sourceBookId,
        uint256 unlockPrice,
        bool isOriginalContent
    ) external {
        require(bookOwners[bookId] == msg.sender, "Not book owner");
        
        hybridController.setChapterAttribution(
            bookId,
            chapterNumber,
            originalAuthor,
            sourceBookId,
            unlockPrice,
            isOriginalContent
        );
    }
}