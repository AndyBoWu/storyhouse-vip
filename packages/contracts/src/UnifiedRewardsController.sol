// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RewardsManager.sol";
import "./TIPToken.sol";

/**
 * @title Unified Rewards Controller
 * @dev Consolidated controller handling remix licensing and quality-based rewards only
 * 
 * This contract combines functionality from:
 * - RemixLicensingController: Remix fees, royalties, and derivative licensing
 * - Quality-based rewards: Human-reviewed quality bonuses and curated content
 * 
 * NOTE: Automatic creation rewards have been removed to prevent AI farming attacks.
 * Authors earn through actual reader purchases and remix licensing only.
 */
contract UnifiedRewardsController is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STORY_MANAGER_ROLE = keccak256("STORY_MANAGER_ROLE");
    bytes32 public constant QUALITY_ASSESSOR_ROLE = keccak256("QUALITY_ASSESSOR_ROLE");

    // Events - Reading (Removed)

    // Events - Creation
    // StoryCreationReward event removed with automatic rewards
    event EngagementReward(
        address indexed creator, 
        bytes32 indexed storyId, 
        string engagementType, 
        uint256 rewardAmount, 
        uint256 timestamp
    );
    event QualityBonusReward(
        address indexed creator, 
        bytes32 indexed storyId, 
        uint256 qualityScore, 
        uint256 bonusAmount
    );
    event MilestoneReward(address indexed creator, string milestone, uint256 rewardAmount);
    // Note: "first_story" and "ten_stories" milestones have been removed

    // Events - Remix
    event RemixLicensePurchased(
        address indexed remixer,
        bytes32 indexed originalStoryId,
        bytes32 indexed remixStoryId,
        uint256 licenseFee,
        string licenseType
    );
    event RoyaltyDistributed(
        address indexed creator, 
        bytes32 indexed storyId, 
        uint256 royaltyAmount, 
        address indexed remixer
    );

    // State variables
    RewardsManager public rewardsManager;
    TIPToken public tipToken;

    // ========== READING REWARDS REMOVED ==========
    // Read-to-earn functionality has been removed to prevent farming attacks

    // ========== CREATION REWARDS CONFIGURATION ==========
    // Automatic creation rewards removed to prevent AI farming
    // uint256 public storyCreationReward = 0; // REMOVED - was 50 TIP per story
    // uint256 public chapterCreationReward = 0; // REMOVED - was 20 TIP per chapter
    uint256 public engagementRate = 1 * 10**15; // 0.001 TIP per engagement (kept for genuine engagement)
    uint256 public qualityBonusMultiplier = 2; // 2x bonus for high quality (human-reviewed only)
    uint256 public minimumQualityScore = 75; // Out of 100

    // Creation tracking
    mapping(address => mapping(bytes32 => bool)) public hasClaimedCreationReward;
    mapping(address => mapping(bytes32 => uint256)) public chapterCounts;
    mapping(address => uint256) public totalStoriesCreated;
    mapping(address => uint256) public totalEngagementEarned;
    mapping(bytes32 => uint256) public storyQualityScores;
    mapping(bytes32 => uint256) public storyReadCounts;
    mapping(bytes32 => address) public storyCreators;
    mapping(address => mapping(string => bool)) public milestonesAchieved;
    mapping(string => uint256) public milestoneRewards;

    // ========== REMIX LICENSING CONFIGURATION ==========
    struct LicenseTerms {
        uint256 baseFee;
        uint256 royaltyPercentage; // basis points
        bool isActive;
    }

    mapping(string => LicenseTerms) public licenseTypes;
    mapping(bytes32 => string) public storyLicenseTypes;
    mapping(bytes32 => bytes32) public remixToOriginal;
    mapping(bytes32 => bytes32[]) public originalToRemixes;
    mapping(bytes32 => uint256) public storyTotalRevenue;
    mapping(address => uint256) public creatorTotalRoyalties;
    mapping(bytes32 => mapping(address => uint256)) public storyRemixerFees;
    mapping(address => mapping(bytes32 => bool)) public hasLicensed;
    mapping(bytes32 => uint256) public totalLicensesSold;

    constructor(
        address initialAdmin,
        address _rewardsManager,
        address _tipToken
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        
        rewardsManager = RewardsManager(_rewardsManager);
        tipToken = TIPToken(_tipToken);

        // Initialize milestone rewards
        // Story creation milestones removed to prevent farming
        // milestoneRewards["first_story"] = 0; // REMOVED - was 100 TIP
        // milestoneRewards["ten_stories"] = 0; // REMOVED - was 500 TIP
        
        // Reader engagement milestones kept (harder to fake)
        milestoneRewards["hundred_readers"] = 200 * 10**18;
        milestoneRewards["thousand_readers"] = 1000 * 10**18;

        // Initialize license types
        licenseTypes["standard"] = LicenseTerms({
            baseFee: 2 * 10**18, // 2.0 TIP
            royaltyPercentage: 2500, // 25%
            isActive: true
        });

        licenseTypes["premium"] = LicenseTerms({
            baseFee: 20 * 10**18, // 20 TIP
            royaltyPercentage: 4000, // 40%
            isActive: true
        });

        licenseTypes["exclusive"] = LicenseTerms({
            baseFee: 100 * 10**18, // 100 TIP
            royaltyPercentage: 5000, // 50%
            isActive: true
        });
    }

    // ========== READING REWARDS REMOVED ==========

    // ========== CREATION REWARDS FUNCTIONS ==========

    /**
     * @dev Claim reward for creating a new story - REMOVED
     * @notice This function has been disabled to prevent AI content farming.
     * Authors earn through reader purchases and remix licensing instead.
     */
    function claimStoryCreationReward(bytes32) 
        external 
        view
    {
        revert("Unified: story creation rewards disabled");
    }

    /**
     * @dev Register a story creator (called by authorized contracts)
     */
    function registerStoryCreator(bytes32 storyId, address creator) 
        external 
        onlyRole(STORY_MANAGER_ROLE) 
    {
        require(storyId != bytes32(0), "Unified: invalid story ID");
        require(creator != address(0), "Unified: invalid creator");
        require(storyCreators[storyId] == address(0), "Unified: already registered");
        
        storyCreators[storyId] = creator;
    }

    /**
     * @dev Distribute engagement rewards (called by authorized contracts)
     */
    function distributeEngagementReward(
        bytes32 storyId,
        string memory engagementType,
        uint256 count
    ) external onlyRole(STORY_MANAGER_ROLE) whenNotPaused {
        address creator = storyCreators[storyId];
        require(creator != address(0), "Unified: story not found");

        uint256 reward = engagementRate * count;
        if (reward > 0) {
            totalEngagementEarned[creator] += reward;
            rewardsManager.distributeReward(creator, reward, "engagement", storyId);
            emit EngagementReward(creator, storyId, engagementType, reward, block.timestamp);
        }

        // Update read counts for milestones
        if (keccak256(bytes(engagementType)) == keccak256(bytes("read"))) {
            storyReadCounts[storyId] += count;
            uint256 totalReads = _getTotalReadsForCreator(creator);
            
            if (totalReads >= 100 && !milestonesAchieved[creator]["hundred_readers"]) {
                _claimMilestone(creator, "hundred_readers");
            } else if (totalReads >= 1000 && !milestonesAchieved[creator]["thousand_readers"]) {
                _claimMilestone(creator, "thousand_readers");
            }
        }
    }

    /**
     * @dev Set quality score and distribute bonus if applicable
     */
    function setQualityScore(bytes32 storyId, uint256 score) 
        external 
        onlyRole(QUALITY_ASSESSOR_ROLE) 
    {
        require(score <= 100, "Unified: invalid score");
        storyQualityScores[storyId] = score;

        if (score >= minimumQualityScore) {
            address creator = storyCreators[storyId];
            require(creator != address(0), "Unified: story not found");

            // Quality bonus now based on a fixed base amount (e.g., 100 TIP) instead of story creation reward
            uint256 baseQualityReward = 100 * 10**18; // 100 TIP base for quality content
            uint256 bonus = (baseQualityReward * qualityBonusMultiplier * score) / 100;
            rewardsManager.distributeReward(creator, bonus, "quality", storyId);
            emit QualityBonusReward(creator, storyId, score, bonus);
        }
    }

    // ========== REMIX LICENSING FUNCTIONS ==========

    /**
     * @dev Purchase a remix license for a story
     */
    function purchaseRemixLicense(
        bytes32 originalStoryId,
        bytes32 remixStoryId,
        string memory licenseType
    ) external whenNotPaused nonReentrant {
        require(originalStoryId != bytes32(0), "Unified: invalid original story");
        require(remixStoryId != bytes32(0), "Unified: invalid remix story");
        require(!hasLicensed[msg.sender][originalStoryId], "Unified: already licensed");
        
        LicenseTerms memory terms = licenseTypes[licenseType];
        require(terms.isActive, "Unified: invalid license type");

        address originalCreator = storyCreators[originalStoryId];
        require(originalCreator != address(0), "Unified: original story not found");
        require(originalCreator != msg.sender, "Unified: cannot remix own story");

        // Transfer license fee from remixer
        require(tipToken.transferFrom(msg.sender, address(this), terms.baseFee), "Unified: transfer failed");

        // Distribute fee: 80% to original creator, 20% to platform (burned)
        uint256 creatorShare = (terms.baseFee * 80) / 100;
        uint256 platformShare = terms.baseFee - creatorShare;

        tipToken.transfer(originalCreator, creatorShare);
        tipToken.burn(platformShare);

        // Update tracking
        hasLicensed[msg.sender][originalStoryId] = true;
        remixToOriginal[remixStoryId] = originalStoryId;
        originalToRemixes[originalStoryId].push(remixStoryId);
        storyLicenseTypes[remixStoryId] = licenseType;
        totalLicensesSold[originalStoryId]++;
        storyRemixerFees[originalStoryId][msg.sender] = terms.baseFee;

        emit RemixLicensePurchased(msg.sender, originalStoryId, remixStoryId, terms.baseFee, licenseType);
    }

    /**
     * @dev Distribute royalties from remix revenue
     */
    function distributeRemixRoyalty(bytes32 remixStoryId, uint256 revenue) 
        external 
        onlyRole(STORY_MANAGER_ROLE) 
        whenNotPaused 
    {
        bytes32 originalStoryId = remixToOriginal[remixStoryId];
        require(originalStoryId != bytes32(0), "Unified: not a remix");

        address originalCreator = storyCreators[originalStoryId];
        string memory licenseType = storyLicenseTypes[remixStoryId];
        LicenseTerms memory terms = licenseTypes[licenseType];

        uint256 royalty = (revenue * terms.royaltyPercentage) / 10000;
        if (royalty > 0) {
            creatorTotalRoyalties[originalCreator] += royalty;
            storyTotalRevenue[originalStoryId] += royalty;

            // Transfer royalty (assuming revenue is already in this contract)
            tipToken.transfer(originalCreator, royalty);
            emit RoyaltyDistributed(originalCreator, originalStoryId, royalty, msg.sender);
        }
    }

    // ========== ADMIN FUNCTIONS ==========

    // Reading reward configuration removed

    /**
     * @dev Update creation reward configuration
     * @notice Story and chapter rewards have been removed. Only engagement rate can be updated.
     */
    function updateCreationRewardConfig(
        uint256, // _storyReward - deprecated
        uint256, // _chapterReward - deprecated  
        uint256 _engagementRate
    ) external onlyRole(ADMIN_ROLE) {
        // storyCreationReward = _storyReward; // REMOVED
        // chapterCreationReward = _chapterReward; // REMOVED
        engagementRate = _engagementRate;
    }

    /**
     * @dev Update or add a license type
     */
    function updateLicenseType(
        string memory licenseType,
        uint256 baseFee,
        uint256 royaltyPercentage
    ) external onlyRole(ADMIN_ROLE) {
        require(royaltyPercentage <= 10000, "Unified: invalid royalty percentage");
        licenseTypes[licenseType] = LicenseTerms({
            baseFee: baseFee,
            royaltyPercentage: royaltyPercentage,
            isActive: true
        });
    }

    // Chapter metadata function removed

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

    // ========== INTERNAL FUNCTIONS ==========

    function _claimMilestone(address user, string memory milestone) internal {
        milestonesAchieved[user][milestone] = true;
        uint256 reward = milestoneRewards[milestone];
        
        // Only distribute if reward > 0 (some milestones have been disabled)
        if (reward > 0) {
            bytes32 contextId = keccak256(abi.encodePacked("milestone", milestone));
            rewardsManager.distributeReward(user, reward, "milestone", contextId);
            emit MilestoneReward(user, milestone, reward);
        }
    }

    function _getTotalReadsForCreator(address creator) internal view returns (uint256) {
        // This is a simplified version - in production, you'd track this more efficiently
        uint256 totalReads = 0;
        // Would need to iterate through creator's stories or maintain a separate counter
        return totalReads;
    }

    // ========== VIEW FUNCTIONS ==========

    // getUserReadingStats removed with read-to-earn functionality

    /**
     * @dev Get story statistics
     */
    function getStoryStats(bytes32 storyId) 
        external 
        view 
        returns (
            address creator,
            uint256 qualityScore,
            uint256 readCount,
            uint256 remixCount,
            uint256 totalRevenue
        ) 
    {
        return (
            storyCreators[storyId],
            storyQualityScores[storyId],
            storyReadCounts[storyId],
            originalToRemixes[storyId].length,
            storyTotalRevenue[storyId]
        );
    }

    /**
     * @dev Get license terms
     */
    function getLicenseTerms(string memory licenseType) 
        external 
        view 
        returns (
            uint256 baseFee,
            uint256 royaltyPercentage,
            bool isActive
        ) 
    {
        LicenseTerms memory terms = licenseTypes[licenseType];
        return (terms.baseFee, terms.royaltyPercentage, terms.isActive);
    }
}