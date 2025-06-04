// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RewardsManager.sol";

/**
 * @title Creator Rewards Controller
 * @dev Handles reward distribution for story creation and creator engagement
 *
 * Features:
 * - Story creation rewards
 * - Engagement-based rewards (views, likes, chapters read)
 * - Quality-based bonus rewards
 * - Creator milestone achievements
 * - Community voting rewards
 */
contract CreatorRewardsController is Ownable, Pausable, ReentrancyGuard {
    // Events
    event StoryCreationReward(
        address indexed creator, bytes32 indexed storyId, uint256 rewardAmount, uint256 timestamp
    );
    event EngagementReward(
        address indexed creator, bytes32 indexed storyId, string engagementType, uint256 rewardAmount, uint256 timestamp
    );
    event QualityBonusReward(
        address indexed creator, bytes32 indexed storyId, uint256 qualityScore, uint256 bonusAmount
    );
    event MilestoneReward(address indexed creator, string milestone, uint256 rewardAmount);

    // State variables
    RewardsManager public rewardsManager;

    // Reward configuration
    uint256 public storyCreationReward = 50 * 10 ** 18; // 50 TIP per story
    uint256 public chapterCreationReward = 20 * 10 ** 18; // 20 TIP per chapter
    uint256 public readEngagementRate = 1 * 10 ** 15; // 0.001 TIP per read
    uint256 public qualityBonusMultiplier = 2; // 2x bonus for high quality
    uint256 public minimumQualityScore = 75; // Out of 100

    // Tracking
    mapping(address => mapping(bytes32 => bool)) public hasClaimedCreationReward;
    mapping(address => mapping(bytes32 => uint256)) public chapterCounts;
    mapping(address => uint256) public totalStoriesCreated;
    mapping(address => uint256) public totalEngagementEarned;
    mapping(bytes32 => uint256) public storyQualityScores;
    mapping(bytes32 => uint256) public storyReadCounts;
    mapping(bytes32 => address) public storyCreators; // Track story creators

    // Milestones
    mapping(address => mapping(string => bool)) public milestonesAchieved;
    mapping(string => uint256) public milestoneRewards;

    modifier onlyAuthorizedCallers() {
        require(
            msg.sender == owner() || rewardsManager.isAuthorizedController(msg.sender),
            "CreatorRewards: unauthorized caller"
        );
        _;
    }

    constructor(address initialOwner, address _rewardsManager) Ownable(initialOwner) {
        rewardsManager = RewardsManager(_rewardsManager);

        // Initialize milestone rewards
        milestoneRewards["first_story"] = 100 * 10 ** 18; // 100 TIP
        milestoneRewards["ten_stories"] = 500 * 10 ** 18; // 500 TIP
        milestoneRewards["hundred_readers"] = 200 * 10 ** 18; // 200 TIP
        milestoneRewards["thousand_readers"] = 1000 * 10 ** 18; // 1000 TIP
    }

    /**
     * @dev Claim reward for creating a new story
     * @param storyId Unique identifier for the story
     */
    function claimStoryCreationReward(bytes32 storyId) external whenNotPaused nonReentrant {
        require(storyId != bytes32(0), "CreatorRewards: invalid story ID");
        require(!hasClaimedCreationReward[msg.sender][storyId], "CreatorRewards: already claimed");

        // Mark as claimed and track story creator
        hasClaimedCreationReward[msg.sender][storyId] = true;
        storyCreators[storyId] = msg.sender;
        totalStoriesCreated[msg.sender]++;

        // Distribute reward
        rewardsManager.distributeReward(msg.sender, storyCreationReward, "creation", storyId);

        emit StoryCreationReward(msg.sender, storyId, storyCreationReward, block.timestamp);

        // Check for milestones
        _checkMilestones(msg.sender);
    }

    /**
     * @dev Claim reward for creating a new chapter
     * @param storyId Story identifier
     * @param chapterNumber Chapter number
     */
    function claimChapterCreationReward(bytes32 storyId, uint256 chapterNumber) external whenNotPaused nonReentrant {
        require(storyId != bytes32(0), "CreatorRewards: invalid story ID");

        // Increment chapter count
        chapterCounts[msg.sender][storyId]++;

        // Distribute reward
        bytes32 contextId = keccak256(abi.encodePacked(storyId, chapterNumber));
        rewardsManager.distributeReward(msg.sender, chapterCreationReward, "chapter_creation", contextId);

        emit StoryCreationReward(msg.sender, storyId, chapterCreationReward, block.timestamp);
    }

    /**
     * @dev Distribute engagement rewards based on story metrics
     * @param creator Story creator address
     * @param storyId Story identifier
     * @param readCount Number of new reads
     */
    function distributeEngagementReward(address creator, bytes32 storyId, uint256 readCount)
        external
        onlyAuthorizedCallers
        whenNotPaused
    {
        require(creator != address(0), "CreatorRewards: invalid creator");
        require(readCount > 0, "CreatorRewards: invalid read count");

        // Update tracking
        storyReadCounts[storyId] += readCount;

        // Calculate engagement reward
        uint256 engagementReward = readCount * readEngagementRate;
        totalEngagementEarned[creator] += engagementReward;

        // Distribute reward
        rewardsManager.distributeReward(creator, engagementReward, "engagement", storyId);

        emit EngagementReward(creator, storyId, "reads", engagementReward, block.timestamp);

        // Check for reader milestones
        _checkReaderMilestones(creator, storyId);
    }

    /**
     * @dev Set quality score for a story and distribute bonus if applicable
     * @param storyId Story identifier
     * @param qualityScore Quality score (0-100)
     */
    function setQualityScore(bytes32 storyId, uint256 qualityScore) external onlyAuthorizedCallers whenNotPaused {
        require(qualityScore <= 100, "CreatorRewards: invalid quality score");

        storyQualityScores[storyId] = qualityScore;

        // Distribute quality bonus if score is high enough
        if (qualityScore >= minimumQualityScore) {
            address creator = _getStoryCreator(storyId); // This would need to be implemented
            uint256 bonusAmount = (storyCreationReward * qualityBonusMultiplier * qualityScore) / 100;

            rewardsManager.distributeReward(creator, bonusAmount, "quality_bonus", storyId);

            emit QualityBonusReward(creator, storyId, qualityScore, bonusAmount);
        }
    }

    /**
     * @dev Check and award milestones for a creator
     */
    function _checkMilestones(address creator) internal {
        uint256 storyCount = totalStoriesCreated[creator];

        // First story milestone
        if (storyCount == 1 && !milestonesAchieved[creator]["first_story"]) {
            milestonesAchieved[creator]["first_story"] = true;
            rewardsManager.distributeReward(
                creator, milestoneRewards["first_story"], "milestone", keccak256("first_story")
            );
            emit MilestoneReward(creator, "first_story", milestoneRewards["first_story"]);
        }

        // Ten stories milestone
        if (storyCount == 10 && !milestonesAchieved[creator]["ten_stories"]) {
            milestonesAchieved[creator]["ten_stories"] = true;
            rewardsManager.distributeReward(
                creator, milestoneRewards["ten_stories"], "milestone", keccak256("ten_stories")
            );
            emit MilestoneReward(creator, "ten_stories", milestoneRewards["ten_stories"]);
        }
    }

    /**
     * @dev Check reader count milestones
     */
    function _checkReaderMilestones(address creator, bytes32 storyId) internal {
        uint256 readCount = storyReadCounts[storyId];

        // 100 readers milestone
        if (readCount >= 100 && !milestonesAchieved[creator]["hundred_readers"]) {
            milestonesAchieved[creator]["hundred_readers"] = true;
            rewardsManager.distributeReward(
                creator, milestoneRewards["hundred_readers"], "milestone", keccak256("hundred_readers")
            );
            emit MilestoneReward(creator, "hundred_readers", milestoneRewards["hundred_readers"]);
        }

        // 1000 readers milestone
        if (readCount >= 1000 && !milestonesAchieved[creator]["thousand_readers"]) {
            milestonesAchieved[creator]["thousand_readers"] = true;
            rewardsManager.distributeReward(
                creator, milestoneRewards["thousand_readers"], "milestone", keccak256("thousand_readers")
            );
            emit MilestoneReward(creator, "thousand_readers", milestoneRewards["thousand_readers"]);
        }
    }

    /**
     * @dev Get story creator
     */
    function _getStoryCreator(bytes32 storyId) internal view returns (address) {
        return storyCreators[storyId];
    }

    // Admin functions

    /**
     * @dev Update reward configuration
     */
    function updateRewardConfig(
        uint256 newStoryReward,
        uint256 newChapterReward,
        uint256 newEngagementRate,
        uint256 newQualityMultiplier,
        uint256 newMinQuality
    ) external onlyOwner {
        storyCreationReward = newStoryReward;
        chapterCreationReward = newChapterReward;
        readEngagementRate = newEngagementRate;
        qualityBonusMultiplier = newQualityMultiplier;
        minimumQualityScore = newMinQuality;
    }

    /**
     * @dev Update milestone reward
     */
    function updateMilestoneReward(string memory milestone, uint256 amount) external onlyOwner {
        milestoneRewards[milestone] = amount;
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

    // View functions

    /**
     * @dev Get creator statistics
     */
    function getCreatorStats(address creator)
        external
        view
        returns (uint256 storiesCreated, uint256 engagementEarned, bool firstStoryMilestone, bool tenStoriesMilestone)
    {
        return (
            totalStoriesCreated[creator],
            totalEngagementEarned[creator],
            milestonesAchieved[creator]["first_story"],
            milestonesAchieved[creator]["ten_stories"]
        );
    }

    /**
     * @dev Get story metrics
     */
    function getStoryMetrics(bytes32 storyId) external view returns (uint256 qualityScore, uint256 readCount) {
        return (storyQualityScores[storyId], storyReadCounts[storyId]);
    }
}
