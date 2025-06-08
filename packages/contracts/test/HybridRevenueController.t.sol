// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/HybridRevenueController.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

contract HybridRevenueControllerTest is Test {
    HybridRevenueController public hybridRevenue;
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    
    address public owner = address(0x1);
    address public curator = address(0x2);
    address public author1 = address(0x3);
    address public author2 = address(0x4);
    address public reader = address(0x5);
    
    bytes32 public constant BOOK_ID = keccak256("test-book-1");
    bytes32 public constant PARENT_BOOK_ID = keccak256("parent-book-1");
    
    uint256 public constant CHAPTER_PRICE = 1 ether; // 1 TIP token
    uint256 public constant INITIAL_BALANCE = 100 ether;

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy TIP token
        tipToken = new TIPToken(owner);
        
        // Deploy rewards manager
        rewardsManager = new RewardsManager(owner, address(tipToken));
        
        // Deploy hybrid revenue controller
        hybridRevenue = new HybridRevenueController(
            owner,
            address(rewardsManager),
            address(tipToken)
        );
        
        // Give reader some tokens
        tipToken.mint(reader, INITIAL_BALANCE);
        
        vm.stopPrank();
        
        // Reader approves spending
        vm.prank(reader);
        tipToken.approve(address(hybridRevenue), type(uint256).max);
    }

    function testRegisterOriginalBook() public {
        vm.prank(owner);
        hybridRevenue.registerBook(
            BOOK_ID,
            curator,
            false, // not derivative
            bytes32(0), // no parent
            5, // 5 chapters
            "QmTestMetadata"
        );
        
        (
            address bookCurator,
            bool isDerivative,
            bytes32 parentBookId,
            uint256 totalChapters,
            bool isActive,
            string memory ipfsHash
        ) = hybridRevenue.getBookInfo(BOOK_ID);
        
        assertEq(bookCurator, curator);
        assertEq(isDerivative, false);
        assertEq(parentBookId, bytes32(0));
        assertEq(totalChapters, 5);
        assertEq(isActive, true);
        assertEq(ipfsHash, "QmTestMetadata");
    }

    function testRegisterDerivativeBook() public {
        vm.prank(owner);
        hybridRevenue.registerBook(
            BOOK_ID,
            curator,
            true, // is derivative
            PARENT_BOOK_ID,
            3, // 3 chapters
            "QmDerivativeMetadata"
        );
        
        (
            address bookCurator,
            bool isDerivative,
            bytes32 parentBookId,
            uint256 totalChapters,
            bool isActive,
            string memory ipfsHash
        ) = hybridRevenue.getBookInfo(BOOK_ID);
        
        assertEq(bookCurator, curator);
        assertEq(isDerivative, true);
        assertEq(parentBookId, PARENT_BOOK_ID);
        assertEq(totalChapters, 3);
        assertEq(isActive, true);
        assertEq(ipfsHash, "QmDerivativeMetadata");
    }

    function testSetChapterAttribution() public {
        // Register book first
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
        
        // Set chapter attribution as curator
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(
            BOOK_ID,
            1, // chapter 1
            author1,
            BOOK_ID, // same book
            CHAPTER_PRICE,
            true // original content
        );
        
        (
            address originalAuthor,
            bytes32 sourceBookId,
            uint256 unlockPrice,
            bool isOriginalContent
        ) = hybridRevenue.getChapterInfo(BOOK_ID, 1);
        
        assertEq(originalAuthor, author1);
        assertEq(sourceBookId, BOOK_ID);
        assertEq(unlockPrice, CHAPTER_PRICE);
        assertEq(isOriginalContent, true);
    }

    function testUnlockChapter() public {
        // Setup book and chapter
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
        
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, BOOK_ID, CHAPTER_PRICE, true);
        
        // Check initial balances
        uint256 readerInitialBalance = tipToken.balanceOf(reader);
        uint256 authorInitialBalance = tipToken.balanceOf(author1);
        uint256 curatorInitialBalance = tipToken.balanceOf(curator);
        
        // Unlock chapter
        vm.prank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 1);
        
        // Check unlock status
        assertTrue(hybridRevenue.hasUserUnlockedChapter(reader, BOOK_ID, 1));
        
        // Check revenue distribution
        uint256 expectedAuthorShare = (CHAPTER_PRICE * 70) / 100; // 70%
        uint256 expectedCuratorShare = (CHAPTER_PRICE * 20) / 100; // 20%
        
        assertEq(tipToken.balanceOf(reader), readerInitialBalance - CHAPTER_PRICE);
        assertEq(tipToken.balanceOf(author1), authorInitialBalance + expectedAuthorShare);
        assertEq(tipToken.balanceOf(curator), curatorInitialBalance + expectedCuratorShare);
        
        // Check contract state
        assertEq(hybridRevenue.bookTotalRevenue(BOOK_ID), CHAPTER_PRICE);
        assertEq(hybridRevenue.authorTotalEarnings(author1), expectedAuthorShare);
        assertEq(hybridRevenue.curatorTotalEarnings(curator), expectedCuratorShare);
    }

    function testBatchUnlockChapters() public {
        // Setup book with multiple chapters
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 3, "QmTestMetadata");
        
        vm.startPrank(curator);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, BOOK_ID, CHAPTER_PRICE, true);
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author2, BOOK_ID, CHAPTER_PRICE, true);
        hybridRevenue.setChapterAttribution(BOOK_ID, 3, author1, BOOK_ID, CHAPTER_PRICE, true);
        vm.stopPrank();
        
        // Batch unlock chapters 1 and 3
        uint256[] memory chaptersToUnlock = new uint256[](2);
        chaptersToUnlock[0] = 1;
        chaptersToUnlock[1] = 3;
        
        uint256 readerInitialBalance = tipToken.balanceOf(reader);
        uint256 author1InitialBalance = tipToken.balanceOf(author1);
        
        vm.prank(reader);
        hybridRevenue.batchUnlockChapters(BOOK_ID, chaptersToUnlock);
        
        // Check unlock status
        assertTrue(hybridRevenue.hasUserUnlockedChapter(reader, BOOK_ID, 1));
        assertFalse(hybridRevenue.hasUserUnlockedChapter(reader, BOOK_ID, 2)); // Not unlocked
        assertTrue(hybridRevenue.hasUserUnlockedChapter(reader, BOOK_ID, 3));
        
        // Check payment
        uint256 totalCost = CHAPTER_PRICE * 2;
        assertEq(tipToken.balanceOf(reader), readerInitialBalance - totalCost);
        
        // Author1 should get payment for 2 chapters (ch1 + ch3)
        uint256 expectedAuthor1Share = ((CHAPTER_PRICE * 70) / 100) * 2;
        assertEq(tipToken.balanceOf(author1), author1InitialBalance + expectedAuthor1Share);
    }

    function testHybridRevenueDerivativeBook() public {
        // Setup parent book
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, author1, false, bytes32(0), 3, "QmParentMetadata");
        
        // Setup derivative book
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, true, PARENT_BOOK_ID, 3, "QmDerivativeMetadata");
        
        vm.startPrank(curator);
        // Ch1-2 from parent book (author1), Ch3 new content (author2)
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        hybridRevenue.setChapterAttribution(BOOK_ID, 3, author2, BOOK_ID, CHAPTER_PRICE, true);
        vm.stopPrank();
        
        uint256 author1InitialBalance = tipToken.balanceOf(author1);
        uint256 author2InitialBalance = tipToken.balanceOf(author2);
        uint256 curatorInitialBalance = tipToken.balanceOf(curator);
        
        // Reader unlocks all chapters
        vm.startPrank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 1); // Original author gets paid
        hybridRevenue.unlockChapter(BOOK_ID, 2); // Original author gets paid
        hybridRevenue.unlockChapter(BOOK_ID, 3); // New author gets paid
        vm.stopPrank();
        
        uint256 expectedAuthorShare = (CHAPTER_PRICE * 70) / 100;
        uint256 expectedCuratorShare = (CHAPTER_PRICE * 20) / 100;
        
        // Author1 should get payment for 2 chapters
        assertEq(tipToken.balanceOf(author1), author1InitialBalance + (expectedAuthorShare * 2));
        
        // Author2 should get payment for 1 chapter
        assertEq(tipToken.balanceOf(author2), author2InitialBalance + expectedAuthorShare);
        
        // Curator should get payment for all 3 chapters
        assertEq(tipToken.balanceOf(curator), curatorInitialBalance + (expectedCuratorShare * 3));
        
        // Check user progress
        (uint256 chaptersUnlocked, uint256 totalSpent, uint256 totalChapters) = 
            hybridRevenue.getUserBookProgress(reader, BOOK_ID);
            
        assertEq(chaptersUnlocked, 3);
        assertEq(totalSpent, CHAPTER_PRICE * 3);
        assertEq(totalChapters, 3);
    }

    function testCannotUnlockSameChapterTwice() public {
        // Setup
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
        
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, BOOK_ID, CHAPTER_PRICE, true);
        
        // First unlock should work
        vm.prank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 1);
        
        // Second unlock should fail
        vm.prank(reader);
        vm.expectRevert("HybridRevenue: already unlocked");
        hybridRevenue.unlockChapter(BOOK_ID, 1);
    }

    function testOnlyOwnerCanRegisterBooks() public {
        vm.prank(curator);
        vm.expectRevert();
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
    }

    function testOnlyCuratorCanSetChapterAttribution() public {
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
        
        vm.prank(author1);
        vm.expectRevert("HybridRevenue: unauthorized curator");
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, BOOK_ID, CHAPTER_PRICE, true);
    }

    function testUpdateRevenueSharing() public {
        vm.prank(owner);
        hybridRevenue.updateRevenueSharing(60, 30, 10); // 60% author, 30% curator, 10% platform
        
        assertEq(hybridRevenue.defaultAuthorShare(), 60);
        assertEq(hybridRevenue.defaultCuratorShare(), 30);
        assertEq(hybridRevenue.defaultPlatformShare(), 10);
    }

    function testCannotSetInvalidRevenueSharing() public {
        vm.prank(owner);
        vm.expectRevert("HybridRevenue: shares must sum to 100");
        hybridRevenue.updateRevenueSharing(60, 30, 20); // Sum = 110
        
        vm.prank(owner);
        vm.expectRevert("HybridRevenue: author share too low");
        hybridRevenue.updateRevenueSharing(40, 40, 20); // Author < 50%
    }

    function testPlatformEarningsWithdrawal() public {
        // Setup and unlock a chapter to generate platform earnings
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
        
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, BOOK_ID, CHAPTER_PRICE, true);
        
        vm.prank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 1);
        
        uint256 expectedPlatformShare = (CHAPTER_PRICE * 10) / 100; // 10%
        assertEq(hybridRevenue.platformTotalEarnings(), expectedPlatformShare);
        
        // Withdraw platform earnings
        address treasury = address(0x999);
        uint256 treasuryInitialBalance = tipToken.balanceOf(treasury);
        
        vm.prank(owner);
        hybridRevenue.withdrawPlatformEarnings(treasury, expectedPlatformShare);
        
        assertEq(tipToken.balanceOf(treasury), treasuryInitialBalance + expectedPlatformShare);
        assertEq(hybridRevenue.platformTotalEarnings(), 0);
    }

    function testDeactivateBook() public {
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator, false, bytes32(0), 5, "QmTestMetadata");
        
        (,,,, bool isActiveBefore,) = hybridRevenue.getBookInfo(BOOK_ID);
        assertTrue(isActiveBefore);
        
        vm.prank(owner);
        hybridRevenue.deactivateBook(BOOK_ID);
        
        (,,,, bool isActiveAfter,) = hybridRevenue.getBookInfo(BOOK_ID);
        assertFalse(isActiveAfter);
    }
}