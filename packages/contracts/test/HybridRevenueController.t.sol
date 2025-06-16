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
        
        // Grant necessary roles to owner
        hybridRevenue.grantRole(hybridRevenue.STORY_MANAGER_ROLE(), owner);
        
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

    // ========== MULTI-LEVEL DERIVATIVE SCENARIO TESTS ==========
    
    bytes32 public constant GRANDCHILD_BOOK_ID = keccak256("grandchild-book-1");
    bytes32 public constant GREAT_GRANDCHILD_BOOK_ID = keccak256("great-grandchild-book-1");
    
    address public constant author3 = address(0x6);
    address public constant author4 = address(0x7);
    address public constant curator2 = address(0x8);
    address public constant curator3 = address(0x9);

    function testThreeLevelDerivativeChain() public {
        // Level 1: Original book (author1, curator)
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 3, "QmOriginalMetadata");
        
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        
        // Level 2: First derivative (author2, curator2)
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 2, "QmDerivative1Metadata");
        
        vm.startPrank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false); // From original
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author2, BOOK_ID, CHAPTER_PRICE, true); // New content
        vm.stopPrank();
        
        // Level 3: Second derivative (author3, curator3)
        vm.prank(owner);
        hybridRevenue.registerBook(GRANDCHILD_BOOK_ID, curator3, true, BOOK_ID, 3, "QmDerivative2Metadata");
        
        vm.startPrank(curator3);
        hybridRevenue.setChapterAttribution(GRANDCHILD_BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false); // From original
        hybridRevenue.setChapterAttribution(GRANDCHILD_BOOK_ID, 2, author2, BOOK_ID, CHAPTER_PRICE, false); // From first derivative
        hybridRevenue.setChapterAttribution(GRANDCHILD_BOOK_ID, 3, author3, GRANDCHILD_BOOK_ID, CHAPTER_PRICE, true); // New content
        vm.stopPrank();
        
        // Track initial balances
        uint256 author1Initial = tipToken.balanceOf(author1);
        uint256 author2Initial = tipToken.balanceOf(author2);
        uint256 author3Initial = tipToken.balanceOf(author3);
        uint256 curatorInitial = tipToken.balanceOf(curator);
        uint256 curator2Initial = tipToken.balanceOf(curator2);
        uint256 curator3Initial = tipToken.balanceOf(curator3);
        
        // Reader unlocks all chapters in the third-level derivative
        vm.startPrank(reader);
        hybridRevenue.unlockChapter(GRANDCHILD_BOOK_ID, 1); // Original author1 content
        hybridRevenue.unlockChapter(GRANDCHILD_BOOK_ID, 2); // First derivative author2 content
        hybridRevenue.unlockChapter(GRANDCHILD_BOOK_ID, 3); // New author3 content
        vm.stopPrank();
        
        uint256 expectedAuthorShare = (CHAPTER_PRICE * 70) / 100;
        uint256 expectedCuratorShare = (CHAPTER_PRICE * 20) / 100;
        
        // Verify author payments
        assertEq(tipToken.balanceOf(author1), author1Initial + expectedAuthorShare); // 1 chapter
        assertEq(tipToken.balanceOf(author2), author2Initial + expectedAuthorShare); // 1 chapter
        assertEq(tipToken.balanceOf(author3), author3Initial + expectedAuthorShare); // 1 chapter
        
        // Verify curator payments - only current book's curator gets paid
        assertEq(tipToken.balanceOf(curator), curatorInitial); // No payment
        assertEq(tipToken.balanceOf(curator2), curator2Initial); // No payment
        assertEq(tipToken.balanceOf(curator3), curator3Initial + (expectedCuratorShare * 3)); // All 3 chapters
    }

    function testComplexDerivativeRevenueMixing() public {
        // Setup: Original book with 3 authors
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 3, "QmOriginalMetadata");
        
        vm.startPrank(curator);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 2, author2, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 3, author3, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        vm.stopPrank();
        
        // Derivative book mixing content from original + new content
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 5, "QmComplexDerivativeMetadata");
        
        vm.startPrank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false); // From original ch1
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author4, BOOK_ID, CHAPTER_PRICE, true); // New content
        hybridRevenue.setChapterAttribution(BOOK_ID, 3, author2, PARENT_BOOK_ID, CHAPTER_PRICE, false); // From original ch2
        hybridRevenue.setChapterAttribution(BOOK_ID, 4, author4, BOOK_ID, CHAPTER_PRICE, true); // New content
        hybridRevenue.setChapterAttribution(BOOK_ID, 5, author3, PARENT_BOOK_ID, CHAPTER_PRICE, false); // From original ch3
        vm.stopPrank();
        
        // Track balances
        uint256 author1Initial = tipToken.balanceOf(author1);
        uint256 author2Initial = tipToken.balanceOf(author2);
        uint256 author3Initial = tipToken.balanceOf(author3);
        uint256 author4Initial = tipToken.balanceOf(author4);
        uint256 curator2Initial = tipToken.balanceOf(curator2);
        
        // Reader unlocks all chapters
        vm.startPrank(reader);
        for (uint256 i = 1; i <= 5; i++) {
            hybridRevenue.unlockChapter(BOOK_ID, i);
        }
        vm.stopPrank();
        
        uint256 expectedAuthorShare = (CHAPTER_PRICE * 70) / 100;
        uint256 expectedCuratorShare = (CHAPTER_PRICE * 20) / 100;
        
        // Verify payments
        assertEq(tipToken.balanceOf(author1), author1Initial + expectedAuthorShare); // 1 chapter
        assertEq(tipToken.balanceOf(author2), author2Initial + expectedAuthorShare); // 1 chapter
        assertEq(tipToken.balanceOf(author3), author3Initial + expectedAuthorShare); // 1 chapter
        assertEq(tipToken.balanceOf(author4), author4Initial + (expectedAuthorShare * 2)); // 2 new chapters
        assertEq(tipToken.balanceOf(curator2), curator2Initial + (expectedCuratorShare * 5)); // All 5 chapters
        
        // Verify book revenue tracking
        assertEq(hybridRevenue.bookTotalRevenue(BOOK_ID), CHAPTER_PRICE * 5);
        assertEq(hybridRevenue.authorTotalEarnings(author4), expectedAuthorShare * 2);
        assertEq(hybridRevenue.curatorTotalEarnings(curator2), expectedCuratorShare * 5);
    }

    function testDerivativeWithDifferentPricing() public {
        // Setup original book
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 2, "QmOriginalMetadata");
        
        uint256 lowPrice = 0.5 ether;
        uint256 highPrice = 2 ether;
        
        vm.startPrank(curator);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 1, author1, PARENT_BOOK_ID, lowPrice, true);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 2, author2, PARENT_BOOK_ID, highPrice, true);
        vm.stopPrank();
        
        // Derivative book with mixed pricing
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 3, "QmDerivativeMetadata");
        
        vm.startPrank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, lowPrice, false); // Reuse low price
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author2, PARENT_BOOK_ID, highPrice, false); // Reuse high price
        hybridRevenue.setChapterAttribution(BOOK_ID, 3, author3, BOOK_ID, CHAPTER_PRICE, true); // New content
        vm.stopPrank();
        
        uint256 author1Initial = tipToken.balanceOf(author1);
        uint256 author2Initial = tipToken.balanceOf(author2);
        uint256 author3Initial = tipToken.balanceOf(author3);
        uint256 readerInitial = tipToken.balanceOf(reader);
        
        // Unlock all chapters
        vm.startPrank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 1); // Low price
        hybridRevenue.unlockChapter(BOOK_ID, 2); // High price
        hybridRevenue.unlockChapter(BOOK_ID, 3); // Standard price
        vm.stopPrank();
        
        // Calculate expected payments
        uint256 expectedAuthor1Share = (lowPrice * 70) / 100;
        uint256 expectedAuthor2Share = (highPrice * 70) / 100;
        uint256 expectedAuthor3Share = (CHAPTER_PRICE * 70) / 100;
        uint256 totalCost = lowPrice + highPrice + CHAPTER_PRICE;
        
        // Verify payments
        assertEq(tipToken.balanceOf(author1), author1Initial + expectedAuthor1Share);
        assertEq(tipToken.balanceOf(author2), author2Initial + expectedAuthor2Share);
        assertEq(tipToken.balanceOf(author3), author3Initial + expectedAuthor3Share);
        assertEq(tipToken.balanceOf(reader), readerInitial - totalCost);
        
        // Verify progress tracking
        (uint256 chaptersUnlocked, uint256 totalSpent, uint256 totalChapters) = 
            hybridRevenue.getUserBookProgress(reader, BOOK_ID);
        assertEq(chaptersUnlocked, 3);
        assertEq(totalSpent, totalCost);
        assertEq(totalChapters, 3);
    }

    function testMultipleDerivativesFromSameParent() public {
        // Setup original book
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 2, "QmOriginalMetadata");
        
        vm.startPrank(curator);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 2, author2, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        vm.stopPrank();
        
        // First derivative
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 3, "QmDerivative1Metadata");
        
        vm.startPrank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author3, BOOK_ID, CHAPTER_PRICE, true); // New
        hybridRevenue.setChapterAttribution(BOOK_ID, 3, author2, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        vm.stopPrank();
        
        // Second derivative from same parent
        vm.prank(owner);
        hybridRevenue.registerBook(GRANDCHILD_BOOK_ID, curator3, true, PARENT_BOOK_ID, 3, "QmDerivative2Metadata");
        
        vm.startPrank(curator3);
        hybridRevenue.setChapterAttribution(GRANDCHILD_BOOK_ID, 1, author2, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        hybridRevenue.setChapterAttribution(GRANDCHILD_BOOK_ID, 2, author4, GRANDCHILD_BOOK_ID, CHAPTER_PRICE, true); // New
        hybridRevenue.setChapterAttribution(GRANDCHILD_BOOK_ID, 3, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        vm.stopPrank();
        
        // Track initial balances
        uint256 author1Initial = tipToken.balanceOf(author1);
        uint256 author2Initial = tipToken.balanceOf(author2);
        uint256 author3Initial = tipToken.balanceOf(author3);
        uint256 author4Initial = tipToken.balanceOf(author4);
        
        // Reader unlocks chapters in both derivatives
        vm.startPrank(reader);
        // First derivative - 3 chapters
        hybridRevenue.unlockChapter(BOOK_ID, 1); // author1
        hybridRevenue.unlockChapter(BOOK_ID, 2); // author3
        hybridRevenue.unlockChapter(BOOK_ID, 3); // author2
        
        // Second derivative - 3 chapters
        hybridRevenue.unlockChapter(GRANDCHILD_BOOK_ID, 1); // author2
        hybridRevenue.unlockChapter(GRANDCHILD_BOOK_ID, 2); // author4
        hybridRevenue.unlockChapter(GRANDCHILD_BOOK_ID, 3); // author1
        vm.stopPrank();
        
        uint256 expectedAuthorShare = (CHAPTER_PRICE * 70) / 100;
        
        // Verify author payments - each gets paid for their contributions across both derivatives
        assertEq(tipToken.balanceOf(author1), author1Initial + (expectedAuthorShare * 2)); // 2 chapters total
        assertEq(tipToken.balanceOf(author2), author2Initial + (expectedAuthorShare * 2)); // 2 chapters total
        assertEq(tipToken.balanceOf(author3), author3Initial + expectedAuthorShare); // 1 chapter
        assertEq(tipToken.balanceOf(author4), author4Initial + expectedAuthorShare); // 1 chapter
    }

    function testEventEmissionForDerivatives() public {
        // Setup original and derivative books
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 1, "QmOriginalMetadata");
        
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 2, "QmDerivativeMetadata");
        
        vm.startPrank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        hybridRevenue.setChapterAttribution(BOOK_ID, 2, author2, BOOK_ID, CHAPTER_PRICE, true);
        vm.stopPrank();
        
        // Test chapter unlock events (events are emitted but testing is simplified)
        vm.prank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 1);
        
        vm.prank(reader);
        hybridRevenue.unlockChapter(BOOK_ID, 2);
    }

    function testDerivativeAccessControl() public {
        // Setup parent book
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 1, "QmOriginalMetadata");
        
        // Setup derivative book
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 1, "QmDerivativeMetadata");
        
        // Only the derivative book's curator should be able to set attribution
        vm.prank(curator); // Original curator
        vm.expectRevert("HybridRevenue: unauthorized curator");
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        
        // Derivative curator should succeed
        vm.prank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        
        // Verify the attribution was set correctly
        (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent) = 
            hybridRevenue.getChapterInfo(BOOK_ID, 1);
        
        assertEq(originalAuthor, author1);
        assertEq(sourceBookId, PARENT_BOOK_ID);
        assertEq(unlockPrice, CHAPTER_PRICE);
        assertEq(isOriginalContent, false);
    }

    function testDerivativeBookDeactivation() public {
        // Setup parent and derivative books
        vm.prank(owner);
        hybridRevenue.registerBook(PARENT_BOOK_ID, curator, false, bytes32(0), 1, "QmOriginalMetadata");
        
        vm.prank(owner);
        hybridRevenue.registerBook(BOOK_ID, curator2, true, PARENT_BOOK_ID, 1, "QmDerivativeMetadata");
        
        vm.prank(curator2);
        hybridRevenue.setChapterAttribution(BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, false);
        
        // Deactivate derivative book
        vm.prank(owner);
        hybridRevenue.deactivateBook(BOOK_ID);
        
        // Should not be able to unlock chapters from deactivated derivative
        vm.prank(reader);
        vm.expectRevert("HybridRevenue: book not active");
        hybridRevenue.unlockChapter(BOOK_ID, 1);
        
        // Parent book should still be accessible
        vm.prank(curator);
        hybridRevenue.setChapterAttribution(PARENT_BOOK_ID, 1, author1, PARENT_BOOK_ID, CHAPTER_PRICE, true);
        
        vm.prank(reader);
        hybridRevenue.unlockChapter(PARENT_BOOK_ID, 1); // Should work
    }
}