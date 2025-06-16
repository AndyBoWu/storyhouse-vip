// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RewardsManager.sol";
import "./TIPToken.sol";

/**
 * @title Unified Rewards Controller
 * @dev Consolidated controller handling all reward types: reading, creation, and remix licensing
 * 
 * This contract combines functionality from:
 * - ReadRewardsController: Chapter-based reading rewards with anti-gaming mechanisms
 * - CreatorRewardsController: Story/chapter creation rewards and engagement bonuses
 * - RemixLicensingController: Remix fees, royalties, and derivative licensing
 */
contract UnifiedRewardsController is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STORY_MANAGER_ROLE = keccak256("STORY_MANAGER_ROLE");
    bytes32 public constant QUALITY_ASSESSOR_ROLE = keccak256("QUALITY_ASSESSOR_ROLE");

    // Events - Reading
    event ChapterRewardClaimed(
        address indexed reader, 
        bytes32 indexed storyId, 
        uint256 chapterNumber, 
        uint256 rewardAmount, 
        uint256 timestamp
    );
    event ReadingStreakBonus(address indexed reader, uint256 streakDays, uint256 bonusAmount);

    // Events - Creation
    event StoryCreationReward(
        address indexed creator, 
        bytes32 indexed storyId, 
        uint256 rewardAmount, 
        uint256 timestamp
    );
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

    // ========== READING REWARDS CONFIGURATION ==========
    uint256 public baseRewardPerChapter = 10 * 10**18; // 10 TIP per chapter
    uint256 public minReadTimePerChapter = 60; // 60 seconds minimum
    uint256 public minWordsPerChapter = 500; // 500 words minimum
    uint256 public maxDailyChapters = 20; // Anti-farming limit
    uint256 public streakBonusPercentage = 10; // 10% bonus per streak day
    uint256 public maxStreakBonus = 100; // Max 100% bonus

    // Reading tracking
    mapping(address => mapping(bytes32 => mapping(uint256 => bool))) public hasClaimedChapter;
    mapping(address => mapping(bytes32 => uint256)) public userChaptersRead;
    mapping(address => mapping(uint256 => uint256)) public dailyChaptersRead; // user => day => count
    mapping(address => uint256) public lastReadDay;
    mapping(address => uint256) public readingStreak;
    mapping(bytes32 => mapping(uint256 => uint256)) public chapterWordCount;
    mapping(bytes32 => mapping(uint256 => uint256)) public chapterMinReadTime;
    mapping(address => mapping(bytes32 => mapping(uint256 => uint256))) public readStartTime;

    // ========== CREATION REWARDS CONFIGURATION ==========
    uint256 public storyCreationReward = 50 * 10**18; // 50 TIP per story
    uint256 public chapterCreationReward = 20 * 10**18; // 20 TIP per chapter
    uint256 public readEngagementRate = 1 * 10**15; // 0.001 TIP per read
    uint256 public qualityBonusMultiplier = 2; // 2x bonus for high quality
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
        milestoneRewards["first_story"] = 100 * 10**18;
        milestoneRewards["ten_stories"] = 500 * 10**18;
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

    // ========== READING REWARDS FUNCTIONS ==========

    /**
     * @dev Start a reading session for a chapter
     */
    function startReading(bytes32 storyId, uint256 chapterNumber) external whenNotPaused {
        require(storyId != bytes32(0), "Unified: invalid story ID");
        require(!hasClaimedChapter[msg.sender][storyId][chapterNumber], "Unified: already claimed");
        
        readStartTime[msg.sender][storyId][chapterNumber] = block.timestamp;
    }

    /**
     * @dev Claim reading reward for completing a chapter
     */
    function claimChapterReward(bytes32 storyId, uint256 chapterNumber) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(storyId != bytes32(0), "Unified: invalid story ID");
        require(!hasClaimedChapter[msg.sender][storyId][chapterNumber], "Unified: already claimed");

        uint256 startTime = readStartTime[msg.sender][storyId][chapterNumber];
        require(startTime > 0, "Unified: reading session not started");

        // Check minimum read time
        uint256 readTime = block.timestamp - startTime;
        uint256 requiredTime = chapterMinReadTime[storyId][chapterNumber];
        if (requiredTime == 0) requiredTime = minReadTimePerChapter;
        require(readTime >= requiredTime, "Unified: insufficient read time");

        // Check daily reading limit
        uint256 today = block.timestamp / 86400;
        require(dailyChaptersRead[msg.sender][today] < maxDailyChapters, "Unified: daily limit exceeded");

        // Update reading streak
        if (today > 0 && lastReadDay[msg.sender] == today - 1) {
            readingStreak[msg.sender]++;
        } else if (lastReadDay[msg.sender] != today) {
            readingStreak[msg.sender] = 1;
        }
        lastReadDay[msg.sender] = today;

        // Calculate reward with streak bonus
        uint256 baseReward = baseRewardPerChapter;
        uint256 streakBonus = (baseReward * readingStreak[msg.sender] * streakBonusPercentage) / 100;
        if (streakBonus > (baseReward * maxStreakBonus) / 100) {
            streakBonus = (baseReward * maxStreakBonus) / 100;
        }
        uint256 totalReward = baseReward + streakBonus;

        // Update tracking
        hasClaimedChapter[msg.sender][storyId][chapterNumber] = true;
        userChaptersRead[msg.sender][storyId]++;
        dailyChaptersRead[msg.sender][today]++;
        delete readStartTime[msg.sender][storyId][chapterNumber];

        // Distribute reward
        bytes32 contextId = keccak256(abi.encodePacked(storyId, chapterNumber));
        rewardsManager.distributeReward(msg.sender, totalReward, "read", contextId);

        emit ChapterRewardClaimed(msg.sender, storyId, chapterNumber, totalReward, block.timestamp);
        if (streakBonus > 0) {
            emit ReadingStreakBonus(msg.sender, readingStreak[msg.sender], streakBonus);
        }
    }

    // ========== CREATION REWARDS FUNCTIONS ==========

    /**
     * @dev Claim reward for creating a new story
     */
    function claimStoryCreationReward(bytes32 storyId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(storyId != bytes32(0), "Unified: invalid story ID");
        require(!hasClaimedCreationReward[msg.sender][storyId], "Unified: already claimed");
        require(storyCreators[storyId] == msg.sender, "Unified: not story creator");

        hasClaimedCreationReward[msg.sender][storyId] = true;
        totalStoriesCreated[msg.sender]++;

        // Distribute base creation reward
        rewardsManager.distributeReward(msg.sender, storyCreationReward, "creator", storyId);
        emit StoryCreationReward(msg.sender, storyId, storyCreationReward, block.timestamp);

        // Check for milestones
        if (totalStoriesCreated[msg.sender] == 1 && !milestonesAchieved[msg.sender]["first_story"]) {
            _claimMilestone(msg.sender, "first_story");
        } else if (totalStoriesCreated[msg.sender] == 10 && !milestonesAchieved[msg.sender]["ten_stories"]) {
            _claimMilestone(msg.sender, "ten_stories");
        }
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

        uint256 reward = readEngagementRate * count;
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

            uint256 bonus = (storyCreationReward * qualityBonusMultiplier * score) / 100;
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

    /**
     * @dev Update reading reward configuration
     */
    function updateReadingRewardConfig(
        uint256 _baseReward,
        uint256 _minReadTime,
        uint256 _maxDailyChapters
    ) external onlyRole(ADMIN_ROLE) {
        baseRewardPerChapter = _baseReward;
        minReadTimePerChapter = _minReadTime;
        maxDailyChapters = _maxDailyChapters;
    }

    /**
     * @dev Update creation reward configuration
     */
    function updateCreationRewardConfig(
        uint256 _storyReward,
        uint256 _chapterReward,
        uint256 _engagementRate
    ) external onlyRole(ADMIN_ROLE) {
        storyCreationReward = _storyReward;
        chapterCreationReward = _chapterReward;
        readEngagementRate = _engagementRate;
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

    /**
     * @dev Set chapter metadata for reading validation
     */
    function setChapterMetadata(
        bytes32 storyId,
        uint256 chapterNumber,
        uint256 wordCount,
        uint256 minReadTime
    ) external onlyRole(STORY_MANAGER_ROLE) {
        chapterWordCount[storyId][chapterNumber] = wordCount;
        chapterMinReadTime[storyId][chapterNumber] = minReadTime;
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

    // ========== INTERNAL FUNCTIONS ==========

    function _claimMilestone(address user, string memory milestone) internal {
        milestonesAchieved[user][milestone] = true;
        uint256 reward = milestoneRewards[milestone];
        
        bytes32 contextId = keccak256(abi.encodePacked("milestone", milestone));
        rewardsManager.distributeReward(user, reward, "milestone", contextId);
        emit MilestoneReward(user, milestone, reward);
    }

    function _getTotalReadsForCreator(address creator) internal view returns (uint256) {
        // This is a simplified version - in production, you'd track this more efficiently
        uint256 totalReads = 0;
        // Would need to iterate through creator's stories or maintain a separate counter
        return totalReads;
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Get user's reading statistics
     */
    function getUserReadingStats(address user) 
        external 
        view 
        returns (
            uint256 streak,
            uint256 todayChapters,
            uint256 totalChapters
        ) 
    {
        uint256 today = block.timestamp / 86400;
        return (
            readingStreak[user],
            dailyChaptersRead[user][today],
            0 // Would need to track total chapters read
        );
    }

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