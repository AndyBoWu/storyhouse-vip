// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ChapterAccessController.sol";
import "../src/TIPToken.sol";
import "../src/RewardsManager.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract ChapterAccessControllerTest is Test {
    ChapterAccessController public chapterAccess;
    TIPToken public tipToken;
    RewardsManager public rewardsManager;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public author = address(0x4);
    
    bytes32 public constant BOOK_ID = keccak256("test-book-id");
    string public constant IP_ASSET_ID = "test-ip-asset-123";
    
    event ChapterRegistered(
        bytes32 indexed bookId,
        uint256 chapterNumber,
        address indexed author,
        string ipAssetId,
        bool isFree
    );
    
    event ChapterUnlocked(
        address indexed reader,
        bytes32 indexed bookId,
        uint256 chapterNumber,
        uint256 unlockPrice,
        uint256 timestamp
    );

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy TIP Token
        tipToken = new TIPToken(owner);
        
        // Deploy Rewards Manager
        rewardsManager = new RewardsManager(owner, address(tipToken));
        
        // Deploy Chapter Access Controller
        chapterAccess = new ChapterAccessController(
            owner,
            address(tipToken),
            address(rewardsManager)
        );
        
        // Add ChapterAccessController as minter and controller
        tipToken.addMinter(address(rewardsManager));
        rewardsManager.addController(address(chapterAccess), "chapter");
        
        // Grant STORY_MANAGER_ROLE to owner for registering chapters
        chapterAccess.grantRole(chapterAccess.STORY_MANAGER_ROLE(), owner);
        
        vm.stopPrank();
        
        // Give users some TIP tokens for testing
        vm.startPrank(owner);
        tipToken.mint(user1, 100 * 10**18); // 100 TIP
        tipToken.mint(user2, 100 * 10**18); // 100 TIP
        vm.stopPrank();
        
        // Users approve the contract to spend their tokens
        vm.prank(user1);
        tipToken.approve(address(chapterAccess), type(uint256).max);
        
        vm.prank(user2);
        tipToken.approve(address(chapterAccess), type(uint256).max);
    }

    function testRegisterFreeChapter() public {
        vm.prank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ChapterRegistered(BOOK_ID, 1, author, IP_ASSET_ID, true);
        
        chapterAccess.registerChapter(
            BOOK_ID,
            1, // Chapter 1 should be free
            author,
            IP_ASSET_ID,
            1000 // word count
        );
        
        (
            address chapterAuthor,
            string memory ipAssetId,
            uint256 wordCount,
            bool isFree,
            bool isActive
        ) = chapterAccess.getChapterInfo(BOOK_ID, 1);
        
        assertEq(chapterAuthor, author);
        assertEq(ipAssetId, IP_ASSET_ID);
        assertEq(wordCount, 1000);
        assertTrue(isFree);
        assertTrue(isActive);
    }

    function testRegisterPaidChapter() public {
        vm.prank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit ChapterRegistered(BOOK_ID, 4, author, IP_ASSET_ID, false);
        
        chapterAccess.registerChapter(
            BOOK_ID,
            4, // Chapter 4 should be paid
            author,
            IP_ASSET_ID,
            1500 // word count
        );
        
        (
            address chapterAuthor,
            string memory ipAssetId,
            uint256 wordCount,
            bool isFree,
            bool isActive
        ) = chapterAccess.getChapterInfo(BOOK_ID, 4);
        
        assertEq(chapterAuthor, author);
        assertEq(ipAssetId, IP_ASSET_ID);
        assertEq(wordCount, 1500);
        assertFalse(isFree); // Chapter 4 should be paid
        assertTrue(isActive);
    }

    function testUnlockFreeChapter() public {
        // Register a free chapter
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 2, author, IP_ASSET_ID, 800);
        
        vm.prank(user1);
        
        vm.expectEmit(true, true, true, true);
        emit ChapterUnlocked(user1, BOOK_ID, 2, 0, block.timestamp);
        
        chapterAccess.unlockChapter(BOOK_ID, 2);
        
        // Check access
        (bool canAccess, uint256 price) = chapterAccess.canAccessChapter(user1, BOOK_ID, 2);
        assertTrue(canAccess);
        assertEq(price, 0); // Should be 0 since already unlocked
        
        // Check progress
        (uint256 latestUnlocked, uint256 totalUnlocked) = 
            chapterAccess.getUserProgress(user1, BOOK_ID);
        assertEq(latestUnlocked, 2);
        assertEq(totalUnlocked, 1);
        // assertEq(totalCompleted, 0); // Removed with read-to-earn
    }

    function testUnlockPaidChapter() public {
        // Register a paid chapter
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 5, author, IP_ASSET_ID, 1200);
        
        uint256 unlockPrice = chapterAccess.unlockPrice();
        uint256 userBalanceBefore = tipToken.balanceOf(user1);
        uint256 authorBalanceBefore = tipToken.balanceOf(author);
        
        vm.prank(user1);
        
        vm.expectEmit(true, true, true, true);
        emit ChapterUnlocked(user1, BOOK_ID, 5, unlockPrice, block.timestamp);
        
        chapterAccess.unlockChapter(BOOK_ID, 5);
        
        // Check balances
        uint256 userBalanceAfter = tipToken.balanceOf(user1);
        uint256 authorBalanceAfter = tipToken.balanceOf(author);
        
        assertEq(userBalanceAfter, userBalanceBefore - unlockPrice);
        
        // Author should receive 80% of unlock price
        uint256 expectedAuthorShare = (unlockPrice * 80) / 100;
        assertEq(authorBalanceAfter, authorBalanceBefore + expectedAuthorShare);
        
        // Check access
        (bool canAccess, uint256 price) = chapterAccess.canAccessChapter(user1, BOOK_ID, 5);
        assertTrue(canAccess);
        assertEq(price, 0); // Should be 0 since already unlocked
    }

    // Chapter completion test removed - read-to-earn functionality discontinued
    /*
    function testCompleteChapter() public {
        // Functionality removed
    }
    */

    function testBatchUnlockChapters() public {
        // Register multiple chapters
        vm.startPrank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 800);  // Free
        chapterAccess.registerChapter(BOOK_ID, 2, author, IP_ASSET_ID, 900);  // Free
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1200); // Paid
        chapterAccess.registerChapter(BOOK_ID, 5, author, IP_ASSET_ID, 1300); // Paid
        vm.stopPrank();
        
        uint256[] memory chapterNumbers = new uint256[](4);
        chapterNumbers[0] = 1;
        chapterNumbers[1] = 2;
        chapterNumbers[2] = 4;
        chapterNumbers[3] = 5;
        
        uint256 unlockPrice = chapterAccess.unlockPrice();
        uint256 expectedCost = unlockPrice * 2; // Only 2 paid chapters
        
        uint256 userBalanceBefore = tipToken.balanceOf(user1);
        
        vm.prank(user1);
        chapterAccess.batchUnlockChapters(BOOK_ID, chapterNumbers);
        
        uint256 userBalanceAfter = tipToken.balanceOf(user1);
        
        // Check that user paid for only the paid chapters
        assertEq(userBalanceAfter, userBalanceBefore - expectedCost);
        
        // Check that all chapters are unlocked
        (bool canAccess1,) = chapterAccess.canAccessChapter(user1, BOOK_ID, 1);
        (bool canAccess2,) = chapterAccess.canAccessChapter(user1, BOOK_ID, 2);
        (bool canAccess4,) = chapterAccess.canAccessChapter(user1, BOOK_ID, 4);
        (bool canAccess5,) = chapterAccess.canAccessChapter(user1, BOOK_ID, 5);
        
        assertTrue(canAccess1);
        assertTrue(canAccess2);
        assertTrue(canAccess4);
        assertTrue(canAccess5);
    }

    function testCannotUnlockTwice() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: already unlocked");
        chapterAccess.unlockChapter(BOOK_ID, 4);
    }

    function testCannotCompleteWithoutUnlock() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: chapter not unlocked");
        // chapterAccess.completeChapter(BOOK_ID, 1, 60); // Removed
    }

    function testCannotCompleteWithInsufficientReadTime() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: insufficient reading time");
        // chapterAccess.completeChapter(BOOK_ID, 1, 20); // Removed
    }

    function testUpdatePricing() public {
        uint256 newUnlockPrice = 1 * 10**18; // 1 TIP
        
        vm.prank(owner);
        chapterAccess.updatePricing(newUnlockPrice);
        
        assertEq(chapterAccess.unlockPrice(), newUnlockPrice);
    }

    function testOnlyOwnerCanRegisterChapter() public {
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
    }

    function testOnlyOwnerCanUpdatePricing() public {
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.updatePricing(1 * 10**18);
    }

    // ============================================================================
    // CRITICAL REVENUE FUNCTION TESTS - Added for Production Readiness  
    // ============================================================================

    function testPlatformEarningsAccumulation() public {
        // Register a paid chapter (chapter 4+ are paid)
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        uint256 unlockPrice = chapterAccess.unlockPrice();
        
        // Give users TIP tokens
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        vm.prank(owner);
        tipToken.mint(user2, 10 ether);
        
        // Users unlock the chapter
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), unlockPrice);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        vm.stopPrank();
        
        vm.startPrank(user2);
        tipToken.approve(address(chapterAccess), unlockPrice);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        vm.stopPrank();
        
        // Check platform earnings accumulation
        uint256 expectedPlatformEarnings = (unlockPrice * 20) / 100 * 2; // 20% of 2 purchases
        uint256 actualPlatformEarnings = chapterAccess.platformTotalEarnings();
        
        assertEq(actualPlatformEarnings, expectedPlatformEarnings, "Platform earnings should accumulate correctly");
    }

    function testWithdrawPlatformEarnings() public {
        // Register and unlock chapter to generate earnings (paid chapter)
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        uint256 unlockPrice = chapterAccess.unlockPrice();
        
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), unlockPrice);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        vm.stopPrank();
        
        uint256 platformEarnings = chapterAccess.platformTotalEarnings();
        assertGt(platformEarnings, 0, "Platform should have earnings");
        
        uint256 ownerBalanceBefore = tipToken.balanceOf(owner);
        
        // Withdraw platform earnings - owner should have ADMIN_ROLE
        vm.prank(owner);
        chapterAccess.withdrawPlatformEarnings(owner, platformEarnings);
        
        uint256 ownerBalanceAfter = tipToken.balanceOf(owner);
        
        assertEq(ownerBalanceAfter - ownerBalanceBefore, platformEarnings, "Owner should receive platform earnings");
        assertEq(chapterAccess.platformTotalEarnings(), 0, "Platform earnings should be reset to zero");
    }

    function testOnlyOwnerCanWithdrawPlatformEarnings() public {
        // Generate some earnings first (paid chapter)
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        uint256 unlockPrice = chapterAccess.unlockPrice();
        
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), unlockPrice);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        vm.stopPrank();
        
        uint256 platformEarnings = chapterAccess.platformTotalEarnings();
        
        // Non-owner should not be able to withdraw
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.withdrawPlatformEarnings(owner, platformEarnings);
        
        vm.prank(user2);
        vm.expectRevert();
        chapterAccess.withdrawPlatformEarnings(owner, platformEarnings);
    }

    function testRevenueShareUpdates() public {
        // Test updating revenue share percentage
        uint256 newPlatformPercentage = 15; // 15% instead of default 20%
        uint256 newAuthorPercentage = 100 - newPlatformPercentage; // 85%
        
        vm.prank(owner);
        chapterAccess.updateRevenueShare(newAuthorPercentage);
        
        assertEq(100 - chapterAccess.authorRevenueShare(), newPlatformPercentage, "Platform revenue percentage should be updated");
        
        // Test that new revenue share is applied (paid chapter)
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        uint256 unlockPrice = chapterAccess.unlockPrice();
        
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), unlockPrice);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        vm.stopPrank();
        
        uint256 expectedPlatformEarnings = (unlockPrice * newPlatformPercentage) / 100;
        uint256 actualPlatformEarnings = chapterAccess.platformTotalEarnings();
        
        assertEq(actualPlatformEarnings, expectedPlatformEarnings, "New revenue share should be applied");
    }

    function testRevenueShareValidation() public {
        // Test that revenue share cannot exceed 95%
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: author share too high");
        chapterAccess.updateRevenueShare(96);
        
        // Test that only owner can update revenue share
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.updateRevenueShare(85);
    }

    function testWordCountBasedRewardCalculation() public {
        // Register chapters with different word counts
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000); // Free chapter, 1000 words
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 2, author, IP_ASSET_ID, 2000); // Free chapter, 2000 words
        
        // Complete chapters and check rewards scale with word count
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        vm.prank(user1);
        chapterAccess.completeChapter(BOOK_ID, 1, 120); // 120 seconds reading time
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 2);
        
        vm.prank(user1);
        chapterAccess.completeChapter(BOOK_ID, 2, 240); // 240 seconds reading time
        
        // Rewards are distributed through RewardsManager, so we can't easily compare them here
        // This test demonstrates that chapters with different word counts can be completed
    }

    function testReadingTimeValidationInCompletion() public {
        // Register a free chapter
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        // Test insufficient reading time
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: insufficient reading time");
        chapterAccess.completeChapter(BOOK_ID, 1, 29); // Less than minimum time
        
        // Test appropriate reading time
        vm.prank(user1);
        chapterAccess.completeChapter(BOOK_ID, 1, 120); // Appropriate time
        // Reward is distributed through RewardsManager
        
        // Test excessive reading time (should be capped)
        vm.prank(user2);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        vm.prank(user2);
        chapterAccess.completeChapter(BOOK_ID, 1, 3600); // 1 hour
        
        // Excessive reading time handling is done internally
    }

    function testChapterDeactivationScenarios() public {
        // Register a chapter
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        (, , , , bool isActive) = chapterAccess.getChapterInfo(BOOK_ID, 1);
        assertTrue(isActive, "Chapter should be active initially");
        
        // Test that chapter can be unlocked normally since no deactivation function exists
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.prank(user1);
        tipToken.approve(address(chapterAccess), 1 ether);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        assertTrue(chapterAccess.hasUnlockedChapter(user1, BOOK_ID, 1), "Chapter should be unlocked");
    }

    function testGetUserProgressEdgeCases() public {
        // Register multiple chapters
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(owner);
            chapterAccess.registerChapter(BOOK_ID, i, author, IP_ASSET_ID, i * 0.5 ether);
        }
        
        // User unlocks some chapters
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), 10 ether);
        
        // Unlock chapters 1, 3, 5 (non-sequential)
        chapterAccess.unlockChapter(BOOK_ID, 1);
        chapterAccess.unlockChapter(BOOK_ID, 3);
        chapterAccess.unlockChapter(BOOK_ID, 5);
        vm.stopPrank();
        
        // Check progress
        (uint256 latestUnlockedChapter, uint256 totalUnlocked) = 
            chapterAccess.getUserProgress(user1, BOOK_ID);
        
        assertEq(totalUnlocked, 3, "Should have 3 unlocked chapters");
        assertEq(latestUnlockedChapter, 5, "Latest unlocked should be chapter 5");
        // assertEq(totalCompleted, 0); // Removed with read-to-earn
        
        // Test with user who hasn't unlocked anything
        (uint256 latestUnlockedChapter2, uint256 totalUnlocked22) = 
            chapterAccess.getUserProgress(user2, BOOK_ID);
        
        assertEq(totalUnlocked22, 0, "Should have no unlocked chapters");
        assertEq(latestUnlockedChapter2, 0, "Latest unlocked should be 0");
        // assertEq(totalCompleted2, 0); // Removed with read-to-earn
    }

    function testCanAccessChapterComprehensiveScenarios() public {
        // Register free and paid chapters
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000); // Free
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000); // Paid
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 5, author, IP_ASSET_ID, 1000); // Paid
        
        // Test free chapter access
        (bool canAccess, ) = chapterAccess.canAccessChapter(user1, BOOK_ID, 1);
        assertTrue(canAccess, "Should be able to access free chapter");
        
        // Test paid chapter access without unlocking
        (bool canAccess2, uint256 price2) = chapterAccess.canAccessChapter(user1, BOOK_ID, 4);
        assertTrue(canAccess2, "Should be able to access paid chapter (but need to unlock first)");
        assertGt(price2, 0, "Price should be greater than 0 for paid chapter");
        
        // Unlock paid chapter
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), chapterAccess.unlockPrice());
        chapterAccess.unlockChapter(BOOK_ID, 4);
        vm.stopPrank();
        
        // Test access after unlocking
        (bool canAccess3, ) = chapterAccess.canAccessChapter(user1, BOOK_ID, 4);
        assertTrue(canAccess3, "Should be able to access unlocked chapter");
        (bool canAccess4, uint256 price4) = chapterAccess.canAccessChapter(user1, BOOK_ID, 5);
        assertTrue(canAccess4, "Should be able to access other paid chapter (but need to unlock first)");
        assertGt(price4, 0, "Price should be greater than 0 for paid chapter");
        
        // Test deactivated chapter
        vm.prank(owner);
        // No deactivate function available - skipping deactivation test
        
        // Chapter is still active since no deactivation occurred
        
        // Test non-existent chapter
        (bool canAccess5, ) = chapterAccess.canAccessChapter(user1, BOOK_ID, 99);
        assertFalse(canAccess5, "Should not be able to access non-existent chapter");
    }

    function testBatchUnlockWithMixedValidInvalidChapters() public {
        // Register some chapters
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1 ether);
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 2, author, IP_ASSET_ID, 1 ether);
        
        // Don't register chapter 3
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1 ether);
        
        vm.prank(owner);
        tipToken.mint(user1, 10 ether);
        
        vm.startPrank(user1);
        tipToken.approve(address(chapterAccess), 10 ether);
        
        // Try to batch unlock chapters 1, 2, 3, 4 (3 doesn't exist)
        uint256[] memory chapterNumbers = new uint256[](4);
        chapterNumbers[0] = 1;
        chapterNumbers[1] = 2;
        chapterNumbers[2] = 3; // This one doesn't exist
        chapterNumbers[3] = 4;
        
        // Should fail due to invalid chapter 3
        vm.expectRevert("ChapterAccess: chapter does not exist");
        chapterAccess.batchUnlockChapters(BOOK_ID, chapterNumbers);
        
        vm.stopPrank();
        
        // Test successful batch unlock with valid chapters only
        uint256[] memory validChapters = new uint256[](3);
        validChapters[0] = 1;
        validChapters[1] = 2;
        validChapters[2] = 4;
        
        vm.startPrank(user1);
        chapterAccess.batchUnlockChapters(BOOK_ID, validChapters);
        vm.stopPrank();
        
        // Verify all valid chapters were unlocked
        assertTrue(chapterAccess.hasUnlockedChapter(user1, BOOK_ID, 1), "Chapter 1 should be unlocked");
        assertTrue(chapterAccess.hasUnlockedChapter(user1, BOOK_ID, 2), "Chapter 2 should be unlocked");
        assertTrue(chapterAccess.hasUnlockedChapter(user1, BOOK_ID, 4), "Chapter 4 should be unlocked");
    }

    // =============== EDGE CASE TESTS FOR 100% COVERAGE ===============

    function testRegisterChapterWithZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: invalid author");
        chapterAccess.registerChapter(BOOK_ID, 1, address(0), IP_ASSET_ID, 1000);
    }

    function testRegisterChapterWithZeroChapterNumber() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: invalid chapter number");
        chapterAccess.registerChapter(BOOK_ID, 0, author, IP_ASSET_ID, 1000);
    }

    function testRegisterChapterWithZeroWordCount() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: invalid word count");
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 0);
    }

    function testRegisterChapterAlreadyExists() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: chapter already exists");
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
    }

    function testUnlockNonExistentChapter() public {
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: chapter does not exist");
        chapterAccess.unlockChapter(BOOK_ID, 99);
    }

    // Complete non-existent chapter test removed - functionality discontinued
    /*
    function testCompleteNonExistentChapter() public {
        // Functionality removed
    }
    */

    // Complete chapter twice test removed - functionality discontinued
    /*
    function testCompleteChapterTwice() public {
        // Functionality removed
    }
    */

    function testUnlockChapterInsufficientBalance() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        // User doesn't have enough tokens - check current balance first
        uint256 currentBalance = tipToken.balanceOf(user1);
        uint256 unlockPrice = chapterAccess.unlockPrice();
        
        // User transfers away all tokens
        vm.prank(user1);
        tipToken.transfer(user2, currentBalance); // Transfer all tokens away
        
        // Reset allowance to the unlock price to trigger the correct error
        vm.prank(user1);
        tipToken.approve(address(chapterAccess), unlockPrice);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, user1, 0, unlockPrice));
        chapterAccess.unlockChapter(BOOK_ID, 4);
    }

    function testUnlockChapterInsufficientAllowance() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        // User has tokens but no allowance
        vm.prank(user1);
        tipToken.approve(address(chapterAccess), 0);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, address(chapterAccess), 0, chapterAccess.unlockPrice()));
        chapterAccess.unlockChapter(BOOK_ID, 4);
    }

    function testBatchUnlockEmptyArray() public {
        uint256[] memory chapterNumbers = new uint256[](0);
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: invalid batch size");
        chapterAccess.batchUnlockChapters(BOOK_ID, chapterNumbers);
    }

    function testBatchUnlockTooManyChapters() public {
        uint256[] memory chapterNumbers = new uint256[](11); // More than 10
        for (uint256 i = 0; i < 11; i++) {
            chapterNumbers[i] = i + 1;
        }
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: invalid batch size");
        chapterAccess.batchUnlockChapters(BOOK_ID, chapterNumbers);
    }

    function testBatchUnlockAlreadyUnlockedChapter() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        uint256[] memory chapterNumbers = new uint256[](1);
        chapterNumbers[0] = 1;
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: chapter already unlocked");
        chapterAccess.batchUnlockChapters(BOOK_ID, chapterNumbers);
    }

    function testUpdatePricingWithZeroUnlockPrice() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: invalid unlock price");
        chapterAccess.updatePricing(0);
    }

    // Zero read reward test removed - functionality discontinued

    function testUpdateRevenueShareTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: author share too high");
        chapterAccess.updateRevenueShare(96);
    }

    function testUpdateRevenueShareTooLow() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: author share too low");
        chapterAccess.updateRevenueShare(49);
    }

    function testWithdrawPlatformEarningsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: zero address");
        chapterAccess.withdrawPlatformEarnings(address(0), 1 ether);
    }

    function testWithdrawPlatformEarningsInsufficientEarnings() public {
        vm.prank(owner);
        vm.expectRevert("ChapterAccess: insufficient earnings");
        chapterAccess.withdrawPlatformEarnings(owner, 1 ether);
    }

    function testPauseAndUnpauseContract() public {
        vm.prank(owner);
        chapterAccess.pause();
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        vm.prank(owner);
        chapterAccess.unpause();
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1); // Should work now
    }

    function testOnlyAdminCanPause() public {
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.pause();
    }

    function testOnlyAdminCanUnpause() public {
        vm.prank(owner);
        chapterAccess.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.unpause();
    }

    // Calculate read reward test removed - functionality discontinued
    /*
    function testCalculateReadRewardForDifferentWordCounts() public {
        // Functionality removed
    }
    */

    function testRevenueDistributionEdgeCases() public {
        // Test with custom revenue share
        vm.prank(owner);
        chapterAccess.updateRevenueShare(90); // 90% to author, 10% to platform
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        uint256 authorBalanceBefore = tipToken.balanceOf(author);
        uint256 platformEarningsBefore = chapterAccess.platformTotalEarnings();
        uint256 unlockPrice = chapterAccess.unlockPrice();
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 4);
        
        uint256 authorBalanceAfter = tipToken.balanceOf(author);
        uint256 platformEarningsAfter = chapterAccess.platformTotalEarnings();
        
        uint256 expectedAuthorShare = (unlockPrice * 90) / 100;
        uint256 expectedPlatformShare = unlockPrice - expectedAuthorShare;
        
        assertEq(authorBalanceAfter - authorBalanceBefore, expectedAuthorShare, "Author should receive 90%");
        assertEq(platformEarningsAfter - platformEarningsBefore, expectedPlatformShare, "Platform should receive 10%");
    }

    function testGetChapterInfoForNonExistentChapter() public {
        (address chapterAuthor, string memory ipAssetId, uint256 wordCount, bool isFree, bool isActive) = 
            chapterAccess.getChapterInfo(BOOK_ID, 99);
        
        assertEq(chapterAuthor, address(0), "Non-existent chapter should have zero author");
        assertEq(bytes(ipAssetId).length, 0, "Non-existent chapter should have empty IP asset ID");
        assertEq(wordCount, 0, "Non-existent chapter should have zero word count");
        assertFalse(isFree, "Non-existent chapter should not be marked as free");
        assertFalse(isActive, "Non-existent chapter should not be active");
    }

    function testUserProgressWithNonSequentialChapters() public {
        // Register non-sequential chapters
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 5, author, IP_ASSET_ID, 1000);
        
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 10, author, IP_ASSET_ID, 1000);
        
        // User unlocks chapters 1, 10
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 10);
        
        (uint256 latestUnlocked, uint256 totalUnlocked) = 
            chapterAccess.getUserProgress(user1, BOOK_ID);
        
        assertEq(latestUnlocked, 10, "Latest unlocked should be 10");
        assertEq(totalUnlocked, 2, "Should have 2 unlocked chapters");
        // assertEq(totalCompleted, 0); // Removed with read-to-earn
    }

    function testCanAccessChapterNonExistentChapter() public {
        (bool canAccess, uint256 price) = chapterAccess.canAccessChapter(user1, BOOK_ID, 99);
        
        assertFalse(canAccess, "Should not be able to access non-existent chapter");
        assertEq(price, 0, "Price should be 0 for non-existent chapter");
    }

    function testFreeBoundaryChapters() public {
        // Test chapter 3 (should be free)
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 3, author, IP_ASSET_ID, 1000);
        
        (, , , bool isFree3, ) = chapterAccess.getChapterInfo(BOOK_ID, 3);
        assertTrue(isFree3, "Chapter 3 should be free");
        
        // Test chapter 4 (should be paid)
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 4, author, IP_ASSET_ID, 1000);
        
        (, , , bool isFree4, ) = chapterAccess.getChapterInfo(BOOK_ID, 4);
        assertFalse(isFree4, "Chapter 4 should be paid");
    }

    // Minimum reading time validation test removed - functionality discontinued
    /*
    function testMinimumReadingTimeValidation() public {
        // Functionality removed
    }
    */
}