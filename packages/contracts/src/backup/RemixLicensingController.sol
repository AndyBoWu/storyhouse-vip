// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RewardsManager.sol";
import "./TIPToken.sol";

/**
 * @title Remix Licensing Controller
 * @dev Handles remix fees, royalties, and derivative content licensing
 *
 * Features:
 * - Remix licensing fee collection
 * - Recursive royalty distribution
 * - Revenue sharing through remix chains
 * - License type management
 * - Automatic creator royalty payments
 */
contract RemixLicensingController is Ownable, Pausable, ReentrancyGuard {
    // Events
    event RemixLicensePurchased(
        address indexed remixer,
        bytes32 indexed originalStoryId,
        bytes32 indexed remixStoryId,
        uint256 licenseFee,
        string licenseType
    );
    event RoyaltyDistributed(
        address indexed creator, bytes32 indexed storyId, uint256 royaltyAmount, address indexed remixer
    );
    event LicenseTypeUpdated(string licenseType, uint256 baseFee, uint256 royaltyPercentage);

    // State variables
    RewardsManager public rewardsManager;
    TIPToken public tipToken;

    // License types and their terms
    struct LicenseTerms {
        uint256 baseFee; // Base licensing fee in TIP tokens
        uint256 royaltyPercentage; // Percentage of remix revenue to original creator (basis points)
        bool isActive; // Whether this license type is active
    }

    mapping(string => LicenseTerms) public licenseTypes;

    // Story licensing info
    mapping(bytes32 => address) public storyCreators;
    mapping(bytes32 => string) public storyLicenseTypes;
    mapping(bytes32 => bytes32) public remixToOriginal; // remix storyId => original storyId
    mapping(bytes32 => bytes32[]) public originalToRemixes; // original storyId => remix storyIds

    // Revenue tracking
    mapping(bytes32 => uint256) public storyTotalRevenue;
    mapping(address => uint256) public creatorTotalRoyalties;
    mapping(bytes32 => mapping(address => uint256)) public storyRemixerFees;

    // Licensing tracking
    mapping(address => mapping(bytes32 => bool)) public hasLicensed;
    mapping(bytes32 => uint256) public totalLicensesSold;

    modifier onlyAuthorizedCallers() {
        require(
            msg.sender == owner() || rewardsManager.isAuthorizedController(msg.sender),
            "RemixLicensing: unauthorized caller"
        );
        _;
    }

    constructor(address initialOwner, address _rewardsManager, address _tipToken) Ownable(initialOwner) {
        rewardsManager = RewardsManager(_rewardsManager);
        tipToken = TIPToken(_tipToken);

        // Initialize default license types (aligned with design spec)
        licenseTypes["standard"] = LicenseTerms({
            baseFee: 2 * 10 ** 18, // 2.0 TIP (as per design spec)
            royaltyPercentage: 2500, // 25% (2500 basis points)
            isActive: true
        });

        licenseTypes["premium"] = LicenseTerms({
            baseFee: 20 * 10 ** 18, // 20 TIP
            royaltyPercentage: 3000, // 30% (3000 basis points)
            isActive: true
        });

        licenseTypes["exclusive"] = LicenseTerms({
            baseFee: 100 * 10 ** 18, // 100 TIP
            royaltyPercentage: 5000, // 50% (5000 basis points)
            isActive: true
        });
    }

    /**
     * @dev Register a story for licensing
     * @param storyId Unique story identifier
     * @param creator Story creator address
     * @param licenseType Type of license for this story
     */
    function registerStory(bytes32 storyId, address creator, string memory licenseType)
        external
        onlyAuthorizedCallers
    {
        require(storyId != bytes32(0), "RemixLicensing: invalid story ID");
        require(creator != address(0), "RemixLicensing: invalid creator");
        require(licenseTypes[licenseType].isActive, "RemixLicensing: invalid license type");

        storyCreators[storyId] = creator;
        storyLicenseTypes[storyId] = licenseType;
    }

    /**
     * @dev Purchase a remix license for a story
     * @param originalStoryId Original story to remix
     * @param remixStoryId New remix story identifier
     */
    function purchaseRemixLicense(bytes32 originalStoryId, bytes32 remixStoryId) external whenNotPaused nonReentrant {
        require(originalStoryId != bytes32(0), "RemixLicensing: invalid original story ID");
        require(remixStoryId != bytes32(0), "RemixLicensing: invalid remix story ID");
        require(!hasLicensed[msg.sender][originalStoryId], "RemixLicensing: already licensed");

        address originalCreator = storyCreators[originalStoryId];
        require(originalCreator != address(0), "RemixLicensing: story not registered");
        require(originalCreator != msg.sender, "RemixLicensing: cannot remix own story");

        string memory licenseType = storyLicenseTypes[originalStoryId];
        LicenseTerms memory terms = licenseTypes[licenseType];

        // Transfer license fee from remixer to contract
        require(
            tipToken.transferFrom(msg.sender, address(this), terms.baseFee),
            "RemixLicensing: license fee transfer failed"
        );

        // Mark as licensed
        hasLicensed[msg.sender][originalStoryId] = true;
        remixToOriginal[remixStoryId] = originalStoryId;
        originalToRemixes[originalStoryId].push(remixStoryId);
        totalLicensesSold[originalStoryId]++;

        // Register remix story
        storyCreators[remixStoryId] = msg.sender;
        storyLicenseTypes[remixStoryId] = licenseType; // Inherit license type

        // Distribute licensing fee as royalty to original creator
        _distributeRoyalty(originalCreator, originalStoryId, terms.baseFee, msg.sender);

        emit RemixLicensePurchased(msg.sender, originalStoryId, remixStoryId, terms.baseFee, licenseType);
    }

    /**
     * @dev Distribute royalties when a remix generates revenue
     * @param remixStoryId Remix story that generated revenue
     * @param revenue Amount of revenue generated
     */
    function distributeRemixRoyalties(bytes32 remixStoryId, uint256 revenue)
        external
        onlyAuthorizedCallers
        whenNotPaused
    {
        bytes32 originalStoryId = remixToOriginal[remixStoryId];

        if (originalStoryId != bytes32(0)) {
            address originalCreator = storyCreators[originalStoryId];
            string memory licenseType = storyLicenseTypes[originalStoryId];
            LicenseTerms memory terms = licenseTypes[licenseType];

            // Calculate royalty
            uint256 royalty = (revenue * terms.royaltyPercentage) / 10000;

            if (royalty > 0) {
                _distributeRoyalty(originalCreator, originalStoryId, royalty, storyCreators[remixStoryId]);
            }
        }
    }

    /**
     * @dev Internal function to distribute royalty payments
     */
    function _distributeRoyalty(address creator, bytes32 storyId, uint256 amount, address remixer) internal {
        // Update tracking
        storyTotalRevenue[storyId] += amount;
        creatorTotalRoyalties[creator] += amount;
        storyRemixerFees[storyId][remixer] += amount;

        // Transfer TIP tokens to creator (or distribute through rewards manager)
        rewardsManager.distributeReward(creator, amount, "royalty", storyId);

        emit RoyaltyDistributed(creator, storyId, amount, remixer);
    }

    /**
     * @dev Get license fee for a story
     * @param storyId Story identifier
     * @return licenseFee Fee amount in TIP tokens
     * @return licenseType Type of license
     */
    function getLicenseFee(bytes32 storyId) external view returns (uint256 licenseFee, string memory licenseType) {
        licenseType = storyLicenseTypes[storyId];
        licenseFee = licenseTypes[licenseType].baseFee;
    }

    /**
     * @dev Check if user has licensed a story for remixing
     * @param user User address
     * @param storyId Original story identifier
     * @return hasPermission Whether user can remix this story
     */
    function canRemixStory(address user, bytes32 storyId) external view returns (bool hasPermission) {
        return hasLicensed[user][storyId] || storyCreators[storyId] == user;
    }

    /**
     * @dev Get remix chain for a story
     * @param storyId Story identifier
     * @return remixes Array of remix story IDs
     */
    function getRemixChain(bytes32 storyId) external view returns (bytes32[] memory remixes) {
        return originalToRemixes[storyId];
    }

    /**
     * @dev Get story revenue and licensing stats
     * @param storyId Story identifier
     * @return creator Story creator
     * @return totalRevenue Total revenue generated
     * @return licensesSold Number of licenses sold
     * @return remixCount Number of remixes created
     */
    function getStoryStats(bytes32 storyId)
        external
        view
        returns (address creator, uint256 totalRevenue, uint256 licensesSold, uint256 remixCount)
    {
        return (
            storyCreators[storyId],
            storyTotalRevenue[storyId],
            totalLicensesSold[storyId],
            originalToRemixes[storyId].length
        );
    }

    /**
     * @dev Get creator's total royalty earnings
     * @param creator Creator address
     * @return totalRoyalties Total royalties earned
     */
    function getCreatorRoyalties(address creator) external view returns (uint256 totalRoyalties) {
        return creatorTotalRoyalties[creator];
    }

    // Admin functions

    /**
     * @dev Add or update a license type
     * @param licenseType Name of the license type
     * @param baseFee Base licensing fee in TIP tokens
     * @param royaltyPercentage Royalty percentage in basis points (100 = 1%)
     */
    function updateLicenseType(string memory licenseType, uint256 baseFee, uint256 royaltyPercentage)
        external
        onlyOwner
    {
        require(royaltyPercentage <= 5000, "RemixLicensing: royalty too high"); // Max 50%

        licenseTypes[licenseType] =
            LicenseTerms({baseFee: baseFee, royaltyPercentage: royaltyPercentage, isActive: true});

        emit LicenseTypeUpdated(licenseType, baseFee, royaltyPercentage);
    }

    /**
     * @dev Deactivate a license type
     * @param licenseType Name of the license type to deactivate
     */
    function deactivateLicenseType(string memory licenseType) external onlyOwner {
        licenseTypes[licenseType].isActive = false;
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

    /**
     * @dev Emergency withdrawal of TIP tokens (only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(tipToken.transfer(owner(), amount), "RemixLicensing: withdrawal failed");
    }
}
