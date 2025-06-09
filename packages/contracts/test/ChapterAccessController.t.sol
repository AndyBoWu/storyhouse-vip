// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ChapterAccessController.sol";
import "../src/TIPToken.sol";
import "../src/RewardsManager.sol";

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
        (uint256 latestUnlocked, uint256 totalUnlocked, uint256 totalCompleted) = 
            chapterAccess.getUserProgress(user1, BOOK_ID);
        assertEq(latestUnlocked, 2);
        assertEq(totalUnlocked, 1);
        assertEq(totalCompleted, 0);
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

    function testCompleteChapter() public {
        // Register and unlock a chapter
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        uint256 userBalanceBefore = tipToken.balanceOf(user1);
        
        vm.prank(user1);
        chapterAccess.completeChapter(BOOK_ID, 1, 60); // 60 seconds reading time
        
        uint256 userBalanceAfter = tipToken.balanceOf(user1);
        
        // User should receive read reward
        assertTrue(userBalanceAfter > userBalanceBefore);
        
        // Check completion status
        (, , uint256 totalCompleted) = chapterAccess.getUserProgress(user1, BOOK_ID);
        assertEq(totalCompleted, 1);
    }

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
        chapterAccess.completeChapter(BOOK_ID, 1, 60);
    }

    function testCannotCompleteWithInsufficientReadTime() public {
        vm.prank(owner);
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
        
        vm.prank(user1);
        chapterAccess.unlockChapter(BOOK_ID, 1);
        
        vm.prank(user1);
        vm.expectRevert("ChapterAccess: insufficient reading time");
        chapterAccess.completeChapter(BOOK_ID, 1, 20); // Less than 30 seconds
    }

    function testUpdatePricing() public {
        uint256 newUnlockPrice = 1 * 10**18; // 1 TIP
        uint256 newReadReward = 1 * 10**17; // 0.1 TIP
        
        vm.prank(owner);
        chapterAccess.updatePricing(newUnlockPrice, newReadReward);
        
        assertEq(chapterAccess.unlockPrice(), newUnlockPrice);
        assertEq(chapterAccess.baseReadReward(), newReadReward);
    }

    function testOnlyOwnerCanRegisterChapter() public {
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.registerChapter(BOOK_ID, 1, author, IP_ASSET_ID, 1000);
    }

    function testOnlyOwnerCanUpdatePricing() public {
        vm.prank(user1);
        vm.expectRevert();
        chapterAccess.updatePricing(1 * 10**18, 1 * 10**17);
    }
}