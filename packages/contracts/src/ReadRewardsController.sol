// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RewardsManager.sol";

/**
 * @title Read Rewards Controller
 * @dev Handles reward distribution for reading chapters
 *
 * Features:
 * - Chapter-based reward distribution
 * - Anti-gaming mechanisms (time limits, word count requirements)
 * - Configurable reward amounts per chapter
 * - Reading streak bonuses
 * - Daily/weekly reading caps
 */
contract ReadRewardsController is Ownable, Pausable, ReentrancyGuard {
    // Events
    event ChapterRewardClaimed(
        address indexed reader, bytes32 indexed storyId, uint256 chapterNumber, uint256 rewardAmount, uint256 timestamp
    );
    event ReadingStreakBonus(address indexed reader, uint256 streakDays, uint256 bonusAmount);
    event RewardConfigUpdated(
        uint256 oldBaseReward, uint256 newBaseReward, uint256 oldMinReadTime, uint256 newMinReadTime
    );

    // State variables
    RewardsManager public rewardsManager;

    // Reward configuration
    uint256 public baseRewardPerChapter = 10 * 10 ** 18; // 10 TIP per chapter
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

    // Chapter metadata
    mapping(bytes32 => mapping(uint256 => uint256)) public chapterWordCount;
    mapping(bytes32 => mapping(uint256 => uint256)) public chapterMinReadTime;

    // Reading sessions (anti-gaming)
    mapping(address => mapping(bytes32 => mapping(uint256 => uint256))) public readStartTime;

    modifier onlyAuthorizedCallers() {
        require(
            msg.sender == owner() || rewardsManager.isAuthorizedController(msg.sender),
            "ReadRewards: unauthorized caller"
        );
        _;
    }

    constructor(address initialOwner, address _rewardsManager) Ownable(initialOwner) {
        rewardsManager = RewardsManager(_rewardsManager);
    }

    /**
     * @dev Start a reading session for a chapter
     * @param storyId Unique identifier for the story
     * @param chapterNumber Chapter number within the story
     */
    function startReading(bytes32 storyId, uint256 chapterNumber) external whenNotPaused {
        require(storyId != bytes32(0), "ReadRewards: invalid story ID");
        require(!hasClaimedChapter[msg.sender][storyId][chapterNumber], "ReadRewards: already claimed");

        readStartTime[msg.sender][storyId][chapterNumber] = block.timestamp;
    }

    /**
     * @dev Claim reading reward for completing a chapter
     * @param storyId Unique identifier for the story
     * @param chapterNumber Chapter number within the story
     */
    function claimChapterReward(bytes32 storyId, uint256 chapterNumber) external whenNotPaused nonReentrant {
        require(storyId != bytes32(0), "ReadRewards: invalid story ID");
        require(!hasClaimedChapter[msg.sender][storyId][chapterNumber], "ReadRewards: already claimed");

        uint256 startTime = readStartTime[msg.sender][storyId][chapterNumber];
        require(startTime > 0, "ReadRewards: reading session not started");

        // Check minimum read time
        uint256 readTime = block.timestamp - startTime;
        uint256 requiredTime = chapterMinReadTime[storyId][chapterNumber];
        if (requiredTime == 0) requiredTime = minReadTimePerChapter;
        require(readTime >= requiredTime, "ReadRewards: insufficient read time");

        // Check daily reading limit
        uint256 today = block.timestamp / 86400; // days since epoch
        require(dailyChaptersRead[msg.sender][today] < maxDailyChapters, "ReadRewards: daily limit exceeded");

        // Mark as claimed
        hasClaimedChapter[msg.sender][storyId][chapterNumber] = true;
        userChaptersRead[msg.sender][storyId]++;
        dailyChaptersRead[msg.sender][today]++;

        // Update reading streak
        _updateReadingStreak(msg.sender, today);

        // Calculate reward amount (base + streak bonus)
        uint256 rewardAmount = _calculateRewardAmount(msg.sender);

        // Generate unique context ID for this chapter
        bytes32 contextId = keccak256(abi.encodePacked(storyId, chapterNumber));

        // Distribute reward through manager
        rewardsManager.distributeReward(msg.sender, rewardAmount, "read", contextId);

        emit ChapterRewardClaimed(msg.sender, storyId, chapterNumber, rewardAmount, block.timestamp);

        // Check for streak bonus
        if (readingStreak[msg.sender] > 1) {
            uint256 bonusAmount = (rewardAmount * streakBonusPercentage * (readingStreak[msg.sender] - 1)) / 100;
            if (bonusAmount > (rewardAmount * maxStreakBonus) / 100) {
                bonusAmount = (rewardAmount * maxStreakBonus) / 100;
            }

            if (bonusAmount > 0) {
                rewardsManager.distributeReward(msg.sender, bonusAmount, "read_streak", contextId);
                emit ReadingStreakBonus(msg.sender, readingStreak[msg.sender], bonusAmount);
            }
        }
    }

    /**
     * @dev Set chapter metadata (word count, min read time)
     * @param storyId Story identifier
     * @param chapterNumber Chapter number
     * @param wordCount Number of words in chapter
     */
    function setChapterMetadata(bytes32 storyId, uint256 chapterNumber, uint256 wordCount)
        external
        onlyAuthorizedCallers
    {
        require(wordCount >= minWordsPerChapter, "ReadRewards: insufficient word count");

        chapterWordCount[storyId][chapterNumber] = wordCount;
        // Calculate minimum read time based on 200 WPM reading speed
        chapterMinReadTime[storyId][chapterNumber] = (wordCount * 60) / 200;
    }

    /**
     * @dev Update reading streak for a user
     */
    function _updateReadingStreak(address user, uint256 today) internal {
        uint256 lastDay = lastReadDay[user];

        if (lastDay == 0) {
            // First time reading
            readingStreak[user] = 1;
        } else if (today == lastDay + 1) {
            // Consecutive day
            readingStreak[user]++;
        } else if (today == lastDay) {
            // Same day, no change to streak
            return;
        } else {
            // Streak broken
            readingStreak[user] = 1;
        }

        lastReadDay[user] = today;
    }

    /**
     * @dev Calculate reward amount including streak bonus
     */
    function _calculateRewardAmount(address user) internal view returns (uint256) {
        uint256 baseAmount = baseRewardPerChapter;
        uint256 streak = readingStreak[user];

        if (streak <= 1) return baseAmount;

        uint256 bonusPercentage = streakBonusPercentage * (streak - 1);
        if (bonusPercentage > maxStreakBonus) {
            bonusPercentage = maxStreakBonus;
        }

        return baseAmount + (baseAmount * bonusPercentage) / 100;
    }

    // Admin functions

    /**
     * @dev Update reward configuration
     */
    function updateRewardConfig(
        uint256 newBaseReward,
        uint256 newMinReadTime,
        uint256 newMinWords,
        uint256 newDailyLimit
    ) external onlyOwner {
        uint256 oldBaseReward = baseRewardPerChapter;
        uint256 oldMinReadTime = minReadTimePerChapter;

        baseRewardPerChapter = newBaseReward;
        minReadTimePerChapter = newMinReadTime;
        minWordsPerChapter = newMinWords;
        maxDailyChapters = newDailyLimit;

        emit RewardConfigUpdated(oldBaseReward, newBaseReward, oldMinReadTime, newMinReadTime);
    }

    /**
     * @dev Update streak bonus configuration
     */
    function updateStreakConfig(uint256 newStreakBonus, uint256 newMaxBonus) external onlyOwner {
        require(newStreakBonus <= 100, "ReadRewards: bonus too high");
        require(newMaxBonus <= 200, "ReadRewards: max bonus too high");

        streakBonusPercentage = newStreakBonus;
        maxStreakBonus = newMaxBonus;
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
     * @dev Check if user has claimed reward for a chapter
     */
    function hasUserClaimedChapter(address user, bytes32 storyId, uint256 chapterNumber) external view returns (bool) {
        return hasClaimedChapter[user][storyId][chapterNumber];
    }

    /**
     * @dev Get user's reading statistics
     */
    function getUserReadingStats(address user)
        external
        view
        returns (uint256 currentStreak, uint256 todayChapters, uint256 remainingDaily)
    {
        uint256 today = block.timestamp / 86400;
        uint256 todayCount = dailyChaptersRead[user][today];

        return (readingStreak[user], todayCount, todayCount >= maxDailyChapters ? 0 : maxDailyChapters - todayCount);
    }

    /**
     * @dev Calculate potential reward for user
     */
    function calculatePotentialReward(address user) external view returns (uint256) {
        return _calculateRewardAmount(user);
    }
}
