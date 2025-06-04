// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CreatorRewardsController.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

contract CreatorRewardsControllerTest is Test {
    CreatorRewardsController public creatorRewards;
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    address public owner;
    address public creator;
    address public authorizedCaller;

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

    function setUp() public {
        owner = address(this);
        creator = address(0x1);
        authorizedCaller = address(0x2);

        tipToken = new TIPToken(owner);
        rewardsManager = new RewardsManager(owner, address(tipToken));
        creatorRewards = new CreatorRewardsController(owner, address(rewardsManager));

        // Setup proper authorizations
        tipToken.addMinter(address(rewardsManager));
        rewardsManager.addController(address(creatorRewards), "creator_controller");
        rewardsManager.addController(authorizedCaller, "authorized_caller");
    }

    function testInitialState() public {
        assertEq(creatorRewards.storyCreationReward(), 50 * 10 ** 18);
        assertEq(creatorRewards.chapterCreationReward(), 20 * 10 ** 18);
        assertEq(creatorRewards.readEngagementRate(), 1 * 10 ** 15);
        assertEq(creatorRewards.qualityBonusMultiplier(), 2);
        assertEq(creatorRewards.minimumQualityScore(), 75);
        assertFalse(creatorRewards.paused());
    }

    function testClaimStoryCreationReward() public {
        bytes32 storyId = keccak256("test_story");
        uint256 expectedReward = creatorRewards.storyCreationReward();

        uint256 initialBalance = tipToken.balanceOf(creator);

        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit StoryCreationReward(creator, storyId, expectedReward, block.timestamp);

        creatorRewards.claimStoryCreationReward(storyId);

        assertEq(tipToken.balanceOf(creator), initialBalance + expectedReward);
        assertTrue(creatorRewards.hasClaimedCreationReward(creator, storyId));
        assertEq(creatorRewards.totalStoriesCreated(creator), 1);
    }

    function testClaimStoryCreationRewardInvalidStory() public {
        vm.prank(creator);
        vm.expectRevert("CreatorRewards: invalid story ID");
        creatorRewards.claimStoryCreationReward(bytes32(0));
    }

    function testClaimStoryCreationRewardAlreadyClaimed() public {
        bytes32 storyId = keccak256("test_story");

        vm.prank(creator);
        creatorRewards.claimStoryCreationReward(storyId);

        vm.prank(creator);
        vm.expectRevert("CreatorRewards: already claimed");
        creatorRewards.claimStoryCreationReward(storyId);
    }

    function testClaimStoryCreationRewardWhenPaused() public {
        creatorRewards.pause();
        bytes32 storyId = keccak256("test_story");

        vm.prank(creator);
        vm.expectRevert("EnforcedPause");
        creatorRewards.claimStoryCreationReward(storyId);
    }

    function testClaimChapterCreationReward() public {
        bytes32 storyId = keccak256("test_story");
        uint256 chapterNumber = 1;
        uint256 expectedReward = creatorRewards.chapterCreationReward();

        uint256 initialBalance = tipToken.balanceOf(creator);

        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit StoryCreationReward(creator, storyId, expectedReward, block.timestamp);

        creatorRewards.claimChapterCreationReward(storyId, chapterNumber);

        assertEq(tipToken.balanceOf(creator), initialBalance + expectedReward);
        assertEq(creatorRewards.chapterCounts(creator, storyId), 1);
    }

    function testDistributeEngagementReward() public {
        bytes32 storyId = keccak256("test_story");
        uint256 readCount = 100;
        uint256 expectedReward = readCount * creatorRewards.readEngagementRate();

        uint256 initialBalance = tipToken.balanceOf(creator);

        vm.prank(authorizedCaller);
        vm.expectEmit(true, true, false, true);
        emit EngagementReward(creator, storyId, "reads", expectedReward, block.timestamp);

        creatorRewards.distributeEngagementReward(creator, storyId, readCount);

        assertEq(tipToken.balanceOf(creator), initialBalance + expectedReward);
        assertEq(creatorRewards.storyReadCounts(storyId), readCount);
        assertEq(creatorRewards.totalEngagementEarned(creator), expectedReward);
    }

    function testDistributeEngagementRewardUnauthorized() public {
        bytes32 storyId = keccak256("test_story");
        uint256 readCount = 100;

        vm.prank(creator);
        vm.expectRevert("CreatorRewards: unauthorized caller");
        creatorRewards.distributeEngagementReward(creator, storyId, readCount);
    }

    function testDistributeEngagementRewardInvalidCreator() public {
        bytes32 storyId = keccak256("test_story");
        uint256 readCount = 100;

        vm.prank(authorizedCaller);
        vm.expectRevert("CreatorRewards: invalid creator");
        creatorRewards.distributeEngagementReward(address(0), storyId, readCount);
    }

    function testDistributeEngagementRewardInvalidReadCount() public {
        bytes32 storyId = keccak256("test_story");

        vm.prank(authorizedCaller);
        vm.expectRevert("CreatorRewards: invalid read count");
        creatorRewards.distributeEngagementReward(creator, storyId, 0);
    }

    function testSetQualityScore() public {
        bytes32 storyId = keccak256("test_story");
        uint256 qualityScore = 85;

        vm.prank(authorizedCaller);
        creatorRewards.setQualityScore(storyId, qualityScore);

        assertEq(creatorRewards.storyQualityScores(storyId), qualityScore);
    }

    function testSetQualityScoreUnauthorized() public {
        bytes32 storyId = keccak256("test_story");
        uint256 qualityScore = 85;

        vm.prank(creator);
        vm.expectRevert("CreatorRewards: unauthorized caller");
        creatorRewards.setQualityScore(storyId, qualityScore);
    }

    function testSetQualityScoreInvalid() public {
        bytes32 storyId = keccak256("test_story");

        vm.prank(authorizedCaller);
        vm.expectRevert("CreatorRewards: invalid quality score");
        creatorRewards.setQualityScore(storyId, 101);
    }

    function testFirstStoryMilestone() public {
        bytes32 storyId = keccak256("first_story");
        uint256 creationReward = creatorRewards.storyCreationReward();
        uint256 milestoneReward = creatorRewards.milestoneRewards("first_story");

        uint256 initialBalance = tipToken.balanceOf(creator);

        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MilestoneReward(creator, "first_story", milestoneReward);

        creatorRewards.claimStoryCreationReward(storyId);

        uint256 expectedTotal = creationReward + milestoneReward;
        assertEq(tipToken.balanceOf(creator), initialBalance + expectedTotal);
        assertTrue(creatorRewards.milestonesAchieved(creator, "first_story"));
    }

    function testTenStoriesMilestone() public {
        uint256 creationReward = creatorRewards.storyCreationReward();
        uint256 milestoneReward = creatorRewards.milestoneRewards("ten_stories");

        // Create 9 stories first
        for (uint256 i = 1; i < 10; i++) {
            vm.prank(creator);
            creatorRewards.claimStoryCreationReward(keccak256(abi.encodePacked("story", i)));
        }

        assertEq(creatorRewards.totalStoriesCreated(creator), 9);
        assertFalse(creatorRewards.milestonesAchieved(creator, "ten_stories"));

        uint256 initialBalance = tipToken.balanceOf(creator);

        // Create 10th story
        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MilestoneReward(creator, "ten_stories", milestoneReward);

        creatorRewards.claimStoryCreationReward(keccak256("story10"));

        uint256 expectedReward = creationReward + milestoneReward;
        assertEq(tipToken.balanceOf(creator), initialBalance + expectedReward);
        assertTrue(creatorRewards.milestonesAchieved(creator, "ten_stories"));
        assertEq(creatorRewards.totalStoriesCreated(creator), 10);
    }

    function testUpdateRewardConfig() public {
        uint256 newStoryReward = 100 * 10 ** 18;
        uint256 newChapterReward = 30 * 10 ** 18;
        uint256 newEngagementRate = 2 * 10 ** 15;
        uint256 newQualityMultiplier = 3;
        uint256 newMinQuality = 80;

        creatorRewards.updateRewardConfig(
            newStoryReward, newChapterReward, newEngagementRate, newQualityMultiplier, newMinQuality
        );

        assertEq(creatorRewards.storyCreationReward(), newStoryReward);
        assertEq(creatorRewards.chapterCreationReward(), newChapterReward);
        assertEq(creatorRewards.readEngagementRate(), newEngagementRate);
        assertEq(creatorRewards.qualityBonusMultiplier(), newQualityMultiplier);
        assertEq(creatorRewards.minimumQualityScore(), newMinQuality);
    }

    function testUpdateRewardConfigOnlyOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        creatorRewards.updateRewardConfig(100 * 10 ** 18, 30 * 10 ** 18, 2 * 10 ** 15, 3, 80);
    }

    function testUpdateMilestoneReward() public {
        string memory milestone = "custom_milestone";
        uint256 amount = 500 * 10 ** 18;

        creatorRewards.updateMilestoneReward(milestone, amount);
        assertEq(creatorRewards.milestoneRewards(milestone), amount);
    }

    function testUpdateMilestoneRewardOnlyOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        creatorRewards.updateMilestoneReward("custom_milestone", 500 * 10 ** 18);
    }

    function testGetCreatorStats() public {
        bytes32 storyId = keccak256("test_story");

        // Initial stats
        (uint256 storiesCreated, uint256 engagementEarned, bool firstMilestone, bool tenMilestone) =
            creatorRewards.getCreatorStats(creator);

        assertEq(storiesCreated, 0);
        assertEq(engagementEarned, 0);
        assertFalse(firstMilestone);
        assertFalse(tenMilestone);

        // After creating story and engagement
        vm.prank(creator);
        creatorRewards.claimStoryCreationReward(storyId);

        vm.prank(authorizedCaller);
        creatorRewards.distributeEngagementReward(creator, storyId, 50);

        (storiesCreated, engagementEarned, firstMilestone, tenMilestone) = creatorRewards.getCreatorStats(creator);

        assertEq(storiesCreated, 1);
        assertEq(engagementEarned, 50 * creatorRewards.readEngagementRate());
        assertTrue(firstMilestone);
        assertFalse(tenMilestone);
    }

    function testGetStoryMetrics() public {
        bytes32 storyId = keccak256("test_story");
        uint256 qualityScore = 85;
        uint256 readCount = 100;

        // Set quality score
        vm.prank(authorizedCaller);
        creatorRewards.setQualityScore(storyId, qualityScore);

        // Distribute engagement
        vm.prank(authorizedCaller);
        creatorRewards.distributeEngagementReward(creator, storyId, readCount);

        (uint256 returnedQuality, uint256 returnedReads) = creatorRewards.getStoryMetrics(storyId);

        assertEq(returnedQuality, qualityScore);
        assertEq(returnedReads, readCount);
    }

    function testPauseUnpause() public {
        assertFalse(creatorRewards.paused());

        creatorRewards.pause();
        assertTrue(creatorRewards.paused());

        creatorRewards.unpause();
        assertFalse(creatorRewards.paused());
    }

    function testPauseOnlyOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        creatorRewards.pause();
    }

    function testMultipleChapters() public {
        bytes32 storyId = keccak256("multi_chapter_story");
        uint256 numChapters = 5;
        uint256 chapterReward = creatorRewards.chapterCreationReward();

        uint256 initialBalance = tipToken.balanceOf(creator);

        for (uint256 i = 1; i <= numChapters; i++) {
            vm.prank(creator);
            creatorRewards.claimChapterCreationReward(storyId, i);
        }

        assertEq(tipToken.balanceOf(creator), initialBalance + (chapterReward * numChapters));
        assertEq(creatorRewards.chapterCounts(creator, storyId), numChapters);
    }

    function testEngagementAccumulation() public {
        bytes32 storyId = keccak256("popular_story");
        uint256[] memory readCounts = new uint256[](3);
        readCounts[0] = 50;
        readCounts[1] = 75;
        readCounts[2] = 25;

        uint256 totalReads = 0;
        uint256 engagementRate = creatorRewards.readEngagementRate();

        for (uint256 i = 0; i < readCounts.length; i++) {
            vm.prank(authorizedCaller);
            creatorRewards.distributeEngagementReward(creator, storyId, readCounts[i]);
            totalReads += readCounts[i];
        }

        assertEq(creatorRewards.storyReadCounts(storyId), totalReads);
        assertEq(creatorRewards.totalEngagementEarned(creator), totalReads * engagementRate);
    }
}
