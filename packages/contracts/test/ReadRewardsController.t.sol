// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReadRewardsController.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

contract ReadRewardsControllerTest is Test {
    ReadRewardsController public readRewards;
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    address public owner;
    address public reader;
    address public author;

    event ChapterRewardClaimed(
        address indexed reader, bytes32 indexed storyId, uint256 chapterNumber, uint256 rewardAmount, uint256 timestamp
    );
    event ReadingStreakBonus(address indexed reader, uint256 streakDays, uint256 bonusAmount);
    event RewardConfigUpdated(
        uint256 oldBaseReward, uint256 newBaseReward, uint256 oldMinReadTime, uint256 newMinReadTime
    );

    function setUp() public {
        owner = address(this);
        reader = address(0x1);
        author = address(0x2);

        tipToken = new TIPToken(owner);
        rewardsManager = new RewardsManager(owner, address(tipToken));
        readRewards = new ReadRewardsController(owner, address(rewardsManager));

        // Setup proper authorizations
        tipToken.addMinter(address(rewardsManager));
        rewardsManager.addController(address(readRewards), "read_controller");
    }

    function testInitialState() public {
        assertEq(readRewards.baseRewardPerChapter(), 10 * 10 ** 18); // 10 TIP per chapter
        assertEq(readRewards.minReadTimePerChapter(), 60); // 60 seconds
        assertEq(readRewards.minWordsPerChapter(), 500); // 500 words
        assertEq(readRewards.maxDailyChapters(), 20); // 20 chapters max per day
        assertEq(readRewards.streakBonusPercentage(), 10); // 10% bonus
        assertEq(readRewards.maxStreakBonus(), 100); // Max 100% bonus
        assertFalse(readRewards.paused());
    }

    function testClaimChapterReward() public {
        bytes32 storyId = keccak256("test_story");
        uint256 chapterNumber = 1;
        uint256 expectedReward = readRewards.baseRewardPerChapter();

        // Set chapter metadata first
        vm.prank(owner);
        readRewards.setChapterMetadata(storyId, chapterNumber, 1000); // 1000 words

        uint256 initialBalance = tipToken.balanceOf(reader);

        // Start reading session
        vm.prank(reader);
        readRewards.startReading(storyId, chapterNumber);

        // Fast forward to meet minimum read time
        vm.warp(block.timestamp + 300); // 5 minutes

        vm.prank(reader);
        vm.expectEmit(true, true, false, true);
        emit ChapterRewardClaimed(reader, storyId, chapterNumber, expectedReward, block.timestamp);

        readRewards.claimChapterReward(storyId, chapterNumber);

        assertEq(tipToken.balanceOf(reader), initialBalance + expectedReward);
        assertTrue(readRewards.hasClaimedChapter(reader, storyId, chapterNumber));
        assertEq(readRewards.userChaptersRead(reader, storyId), 1);
    }

    function testStartReadingInvalidStory() public {
        vm.prank(reader);
        vm.expectRevert("ReadRewards: invalid story ID");
        readRewards.startReading(bytes32(0), 1);
    }

    function testStartReadingWhenPaused() public {
        readRewards.pause();
        bytes32 storyId = keccak256("test_story");

        vm.prank(reader);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        readRewards.startReading(storyId, 1);
    }

    function testDailyChapterLimit() public {
        bytes32 storyId = keccak256("test_story");
        uint256 cap = readRewards.maxDailyChapters();

        // Read up to the cap
        for (uint256 i = 1; i <= cap; i++) {
            vm.prank(owner);
            readRewards.setChapterMetadata(storyId, i, 1000);

            vm.prank(reader);
            readRewards.startReading(storyId, i);

            vm.warp(block.timestamp + 300); // Wait 5 minutes

            vm.prank(reader);
            readRewards.claimChapterReward(storyId, i);

            vm.warp(block.timestamp + 1); // Small time increment
        }

        // Next read should be rejected
        vm.prank(owner);
        readRewards.setChapterMetadata(storyId, cap + 1, 1000);

        vm.prank(reader);
        readRewards.startReading(storyId, cap + 1);

        vm.warp(block.timestamp + 300);

        vm.prank(reader);
        vm.expectRevert("ReadRewards: daily limit exceeded");
        readRewards.claimChapterReward(storyId, cap + 1);
    }

    function testReadingStreak() public {
        bytes32 storyId = keccak256("test_story");
        uint256 baseReward = readRewards.baseRewardPerChapter();

        // Start from a base timestamp
        uint256 baseTime = 1000000; // arbitrary starting point

        // Read for consecutive days to build up streak
        for (uint256 day = 0; day < 3; day++) {
            // Set timestamp to consecutive days
            vm.warp(baseTime + day * 1 days);

            vm.prank(owner);
            readRewards.setChapterMetadata(storyId, day + 1, 1000);

            vm.prank(reader);
            readRewards.startReading(storyId, day + 1);

            // Add time for reading
            vm.warp(baseTime + day * 1 days + 300);

            vm.prank(reader);
            readRewards.claimChapterReward(storyId, day + 1);
        }

        assertEq(readRewards.readingStreak(reader), 3);
    }

    function testInsufficientReadTime() public {
        bytes32 storyId = keccak256("test_story");
        uint256 chapterNumber = 1;

        vm.prank(owner);
        readRewards.setChapterMetadata(storyId, chapterNumber, 1000);

        vm.prank(reader);
        readRewards.startReading(storyId, chapterNumber);

        // Try to claim without waiting enough time
        vm.warp(block.timestamp + 30); // Only 30 seconds

        vm.prank(reader);
        vm.expectRevert("ReadRewards: insufficient read time");
        readRewards.claimChapterReward(storyId, chapterNumber);
    }

    function testUpdateRewardConfig() public {
        uint256 newBaseReward = 20 * 10 ** 18;
        uint256 newMinReadTime = 120;
        uint256 newMinWords = 1000;
        uint256 newDailyLimit = 30;

        vm.expectEmit(false, false, false, true);
        emit RewardConfigUpdated(
            readRewards.baseRewardPerChapter(), newBaseReward, readRewards.minReadTimePerChapter(), newMinReadTime
        );

        readRewards.updateRewardConfig(newBaseReward, newMinReadTime, newMinWords, newDailyLimit);

        assertEq(readRewards.baseRewardPerChapter(), newBaseReward);
        assertEq(readRewards.minReadTimePerChapter(), newMinReadTime);
        assertEq(readRewards.minWordsPerChapter(), newMinWords);
        assertEq(readRewards.maxDailyChapters(), newDailyLimit);
    }

    function testUpdateStreakConfig() public {
        uint256 newStreakBonus = 20;
        uint256 newMaxBonus = 150;

        readRewards.updateStreakConfig(newStreakBonus, newMaxBonus);

        assertEq(readRewards.streakBonusPercentage(), newStreakBonus);
        assertEq(readRewards.maxStreakBonus(), newMaxBonus);
    }

    function testSetChapterMetadata() public {
        bytes32 storyId = keccak256("test_story");
        uint256 chapterNumber = 1;
        uint256 wordCount = 1500;

        vm.prank(owner);
        readRewards.setChapterMetadata(storyId, chapterNumber, wordCount);

        assertEq(readRewards.chapterWordCount(storyId, chapterNumber), wordCount);
        // Min read time should be calculated based on 200 WPM
        assertEq(readRewards.chapterMinReadTime(storyId, chapterNumber), (wordCount * 60) / 200);
    }

    function testSetChapterMetadataInsufficientWords() public {
        bytes32 storyId = keccak256("test_story");
        uint256 chapterNumber = 1;
        uint256 wordCount = 300; // Below minimum

        vm.prank(owner);
        vm.expectRevert("ReadRewards: insufficient word count");
        readRewards.setChapterMetadata(storyId, chapterNumber, wordCount);
    }

    function testPauseUnpause() public {
        assertFalse(readRewards.paused());

        readRewards.pause();
        assertTrue(readRewards.paused());

        readRewards.unpause();
        assertFalse(readRewards.paused());
    }

    function testOnlyOwnerFunctions() public {
        vm.prank(reader);
        vm.expectRevert();
        readRewards.pause();

        vm.prank(reader);
        vm.expectRevert();
        readRewards.updateRewardConfig(10 * 10 ** 18, 60, 500, 20);

        vm.prank(reader);
        vm.expectRevert();
        readRewards.updateStreakConfig(10, 100);
    }
}
