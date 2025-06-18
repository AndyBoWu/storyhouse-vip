// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TIPToken.sol";
import "./HybridRevenueController.sol";

/**
 * @title Atomic License Purchase
 * @dev Handles atomic TIP payment and Story Protocol license minting in a single transaction
 *
 * This contract solves the non-atomic operation issue by:
 * 1. Accepting TIP payment from the user
 * 2. Minting the Story Protocol license on behalf of the user
 * 3. Distributing revenue according to HybridRevenueController rules
 * 4. All in a single atomic transaction
 */
contract AtomicLicensePurchase is Ownable, Pausable, ReentrancyGuard {
    // Events
    event LicensePurchased(
        address indexed buyer,
        bytes32 indexed bookId,
        uint256 chapterNumber,
        address ipAsset,
        uint256 licenseTokenId,
        uint256 price
    );
    
    event RevenueDistributed(
        bytes32 indexed bookId,
        uint256 amount,
        address author,
        address curator,
        uint256 authorShare,
        uint256 curatorShare,
        uint256 platformShare
    );
    
    // State variables
    TIPToken public immutable tipToken;
    HybridRevenueController public immutable revenueController;
    address public immutable storyProtocolLicensing;
    
    // Story Protocol interface for minting licenses
    interface ILicensingModule {
        function mintLicenseTokens(
            address licensorIpId,
            address licenseTemplate,
            uint256 licenseTermsId,
            uint256 amount,
            address receiver,
            bytes calldata royaltyContext
        ) external returns (uint256[] memory licenseTokenIds);
    }
    
    constructor(
        address _tipToken,
        address _revenueController,
        address _storyProtocolLicensing,
        address initialOwner
    ) Ownable(initialOwner) {
        tipToken = TIPToken(_tipToken);
        revenueController = HybridRevenueController(_revenueController);
        storyProtocolLicensing = _storyProtocolLicensing;
    }
    
    /**
     * @dev Purchase a reading license atomically
     * @param bookId The book identifier
     * @param chapterNumber The chapter number
     * @param ipAssetId The Story Protocol IP asset address
     * @param licenseTemplate The license template address
     * @param licenseTermsId The license terms ID
     * @param price The price in TIP tokens
     */
    function purchaseReadingLicense(
        bytes32 bookId,
        uint256 chapterNumber,
        address ipAssetId,
        address licenseTemplate,
        uint256 licenseTermsId,
        uint256 price
    ) external whenNotPaused nonReentrant {
        require(price > 0, "Invalid price");
        require(ipAssetId != address(0), "Invalid IP asset");
        
        // 1. Transfer TIP tokens from buyer to this contract
        require(
            tipToken.transferFrom(msg.sender, address(this), price),
            "TIP transfer failed"
        );
        
        // 2. Check if book is registered in HybridRevenueController
        (address curator, bool isActive,,,) = revenueController.getBookInfo(bookId);
        
        if (isActive) {
            // 3A. If registered, use HybridRevenueController for distribution
            // First approve the revenue controller to spend our TIP tokens
            tipToken.approve(address(revenueController), price);
            
            // This will handle the 70/20/10 distribution
            revenueController.unlockChapter(bookId, chapterNumber);
        } else {
            // 3B. If not registered, send directly to author
            // Parse book ID to get author address (first part before /)
            address author = address(uint160(uint256(bookId) >> 96));
            tipToken.transfer(author, price);
            
            emit RevenueDistributed(
                bookId,
                price,
                author,
                address(0),
                price,
                0,
                0
            );
        }
        
        // 4. Mint the Story Protocol license token
        // Since our license terms use zero address currency, this should be free
        uint256[] memory licenseTokenIds = ILicensingModule(storyProtocolLicensing).mintLicenseTokens(
            ipAssetId,
            licenseTemplate,
            licenseTermsId,
            1, // Amount of licenses to mint
            msg.sender, // Receiver is the buyer
            "" // Empty royalty context
        );
        
        require(licenseTokenIds.length > 0, "License minting failed");
        
        emit LicensePurchased(
            msg.sender,
            bookId,
            chapterNumber,
            ipAssetId,
            licenseTokenIds[0],
            price
        );
    }
    
    /**
     * @dev Emergency withdrawal of stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    /**
     * @dev Pause the contract
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

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}