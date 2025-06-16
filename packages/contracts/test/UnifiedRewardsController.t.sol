// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/UnifiedRewardsController.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

contract UnifiedRewardsControllerTest is Test {
    UnifiedRewardsController public unifiedController;
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    
    address public admin = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public creator = address(4);
    
    bytes32 public constant STORY_ID = keccak256("test-story-1");
    bytes32 public constant REMIX_STORY_ID = keccak256("remix-story-1");
    uint256 public constant CHAPTER_NUMBER = 1;

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy contracts
        tipToken = new TIPToken(
            admin,
            1000000000 ether, // 1B initial supply
            10000000000 ether  // 10B max supply
        );
        
        rewardsManager = new RewardsManager(admin, address(tipToken));
        
        unifiedController = new UnifiedRewardsController(
            admin,
            address(rewardsManager),
            address(tipToken)
        );
        
        // Setup permissions
        tipToken.grantRole(tipToken.MINTER_ROLE(), address(rewardsManager));
        rewardsManager.addController(address(unifiedController), "unified");
        unifiedController.grantRole(unifiedController.STORY_MANAGER_ROLE(), admin);
        
        vm.stopPrank();
    }

    function testReadingRewards() public {
        // Register story creator
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // User starts reading
        vm.prank(user1);
        unifiedController.startReading(STORY_ID, CHAPTER_NUMBER);
        
        // Fast forward time
        vm.warp(block.timestamp + 61);
        
        // Claim chapter reward
        vm.prank(user1);
        unifiedController.claimChapterReward(STORY_ID, CHAPTER_NUMBER);
        
        // Check reward was distributed
        uint256 userRewards = rewardsManager.getUserTotalRewards(user1);
        assertGt(userRewards, 0, "User should receive reading rewards");
        
        // Check chapter is marked as claimed
        assertTrue(
            unifiedController.hasClaimedChapter(user1, STORY_ID, CHAPTER_NUMBER),
            "Chapter should be marked as claimed"
        );
    }

    function testCreationRewards() public {
        // Register story creator
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // Creator claims creation reward
        vm.prank(creator);
        unifiedController.claimStoryCreationReward(STORY_ID);
        
        // Check reward was distributed
        uint256 creatorRewards = rewardsManager.getUserTotalRewards(creator);
        assertEq(creatorRewards, 50 ether, "Creator should receive 50 TIP for story creation");
        
        // Check creation reward is marked as claimed
        assertTrue(
            unifiedController.hasClaimedCreationReward(creator, STORY_ID),
            "Creation reward should be marked as claimed"
        );
    }

    function testRemixLicensing() public {
        // Register original story creator
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // Give user TIP tokens for licensing
        vm.prank(admin);
        tipToken.mint(user1, 10 ether);
        
        // User approves and purchases license
        vm.startPrank(user1);
        tipToken.approve(address(unifiedController), 2 ether);
        unifiedController.purchaseRemixLicense(STORY_ID, REMIX_STORY_ID, "standard");
        vm.stopPrank();
        
        // Check license was purchased
        assertTrue(
            unifiedController.hasLicensed(user1, STORY_ID),
            "User should have licensed the story"
        );
        
        // Check remix relationship is established
        assertEq(
            unifiedController.remixToOriginal(REMIX_STORY_ID),
            STORY_ID,
            "Remix should be linked to original story"
        );
        
        // Check creator received payment (80% of 2 TIP = 1.6 TIP)
        uint256 creatorBalance = tipToken.balanceOf(creator);
        assertEq(creatorBalance, 1.6 ether, "Creator should receive 80% of license fee");
    }

    function testQualityScoring() public {
        // Register story creator
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // Admin sets quality score above threshold
        vm.prank(admin);
        unifiedController.grantRole(unifiedController.QUALITY_ASSESSOR_ROLE(), admin);
        
        vm.prank(admin);
        unifiedController.setQualityScore(STORY_ID, 80); // Above 75 threshold
        
        // Check quality bonus was distributed
        uint256 creatorRewards = rewardsManager.getUserTotalRewards(creator);
        assertGt(creatorRewards, 0, "Creator should receive quality bonus");
        
        // Check quality score is stored
        assertEq(
            unifiedController.storyQualityScores(STORY_ID),
            80,
            "Quality score should be stored"
        );
    }

    function testEngagementRewards() public {
        // Register story creator
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // Distribute engagement rewards
        vm.prank(admin);
        unifiedController.distributeEngagementReward(STORY_ID, "read", 10);
        
        // Check engagement rewards were distributed
        uint256 creatorRewards = rewardsManager.getUserTotalRewards(creator);
        assertGt(creatorRewards, 0, "Creator should receive engagement rewards");
    }

    function testReadingStreak() public {
        // Register story creator
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // User reads multiple chapters to build streak
        for (uint256 i = 1; i <= 3; i++) {
            vm.prank(user1);
            unifiedController.startReading(STORY_ID, i);
            
            vm.warp(block.timestamp + 61);
            
            vm.prank(user1);
            unifiedController.claimChapterReward(STORY_ID, i);
            
            // Move to next day for streak
            vm.warp(block.timestamp + 1 days);
        }
        
        // Check streak was built
        uint256 streak = unifiedController.readingStreak(user1);
        assertEq(streak, 3, "User should have 3-day reading streak");
    }

    function testLicenseTermsConfiguration() public {
        // Check default license terms
        (uint256 baseFee, uint256 royaltyPercentage, bool isActive) = 
            unifiedController.getLicenseTerms("standard");
        
        assertEq(baseFee, 2 ether, "Standard license should cost 2 TIP");
        assertEq(royaltyPercentage, 2500, "Standard license should have 25% royalty");
        assertTrue(isActive, "Standard license should be active");
        
        // Admin updates license terms
        vm.prank(admin);
        unifiedController.updateLicenseType("custom", 5 ether, 3000);
        
        (baseFee, royaltyPercentage, isActive) = unifiedController.getLicenseTerms("custom");
        assertEq(baseFee, 5 ether, "Custom license should cost 5 TIP");
        assertEq(royaltyPercentage, 3000, "Custom license should have 30% royalty");
        assertTrue(isActive, "Custom license should be active");
    }

    function testAccessControlIntegration() public {
        // Check admin has admin role
        assertTrue(
            unifiedController.hasRole(unifiedController.ADMIN_ROLE(), admin),
            "Admin should have ADMIN_ROLE"
        );
        
        // Non-admin should not be able to register stories
        vm.prank(user1);
        vm.expectRevert();
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // Non-admin should not be able to update configuration
        vm.prank(user1);
        vm.expectRevert();
        unifiedController.updateReadingRewardConfig(20 ether, 120, 15);
    }

    function testPauseUnpause() public {
        // Admin pauses contract
        vm.prank(admin);
        unifiedController.pause();
        
        assertTrue(unifiedController.paused(), "Contract should be paused");
        
        // User should not be able to start reading when paused
        vm.prank(user1);
        vm.expectRevert("Pausable: paused");
        unifiedController.startReading(STORY_ID, CHAPTER_NUMBER);
        
        // Admin unpauses contract
        vm.prank(admin);
        unifiedController.unpause();
        
        assertFalse(unifiedController.paused(), "Contract should be unpaused");
        
        // User should be able to start reading when unpaused
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        vm.prank(user1);
        unifiedController.startReading(STORY_ID, CHAPTER_NUMBER);
        // Should not revert
    }

    function testBatchOperations() public {
        // Test that multiple operations can be performed efficiently
        vm.prank(admin);
        unifiedController.registerStoryCreator(STORY_ID, creator);
        
        // User performs multiple reading actions
        vm.startPrank(user1);
        for (uint256 i = 1; i <= 5; i++) {
            unifiedController.startReading(STORY_ID, i);
            vm.warp(block.timestamp + 61);
            unifiedController.claimChapterReward(STORY_ID, i);
        }
        vm.stopPrank();
        
        // Check all rewards were distributed
        uint256 userRewards = rewardsManager.getUserTotalRewards(user1);
        assertGt(userRewards, 50 ether, "User should receive rewards for all chapters");
    }
}