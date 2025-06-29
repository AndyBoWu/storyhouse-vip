// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../../src/HybridRevenueControllerV2.sol";
import "../../src/TIPToken.sol";

contract RevenueFlowTest is Test {
    HybridRevenueControllerV2 public controller;
    TIPToken public tipToken;
    
    address public platform = address(0x1000);
    address public author1 = address(0x1);
    address public author2 = address(0x2);
    address public curator1 = address(0x3);
    address public curator2 = address(0x4);
    address public reader1 = address(0x5);
    address public reader2 = address(0x6);
    
    bytes32 public book1Id;
    bytes32 public book2Id;
    
    function setUp() public {
        // Deploy contracts
        tipToken = new TIPToken(address(this));
        controller = new HybridRevenueControllerV2(platform, address(tipToken));
        
        // Register books
        book1Id = keccak256("book-one");
        book2Id = keccak256("book-two");
        
        vm.prank(author1);
        controller.registerBook(book1Id, 10, "ipfs://book1metadata");
        
        vm.prank(author2);
        controller.registerBook(book2Id, 10, "ipfs://book2metadata");
        
        // Set up chapter attributions (authors become curators)
        uint256 chapterPrice = 100 * 10**18;
        
        vm.startPrank(author1);
        controller.setChapterAttribution(book1Id, 1, author1, book1Id, chapterPrice, true);
        controller.setChapterAttribution(book1Id, 2, author1, book1Id, chapterPrice, true);
        controller.setChapterAttribution(book1Id, 3, author1, book1Id, chapterPrice, true);
        controller.setChapterAttribution(book1Id, 4, author1, book1Id, chapterPrice, true);
        controller.setChapterAttribution(book1Id, 5, author1, book1Id, chapterPrice, true);
        vm.stopPrank();
        
        vm.startPrank(author2);
        controller.setChapterAttribution(book2Id, 1, author2, book2Id, 75 * 10**18, true);
        controller.setChapterAttribution(book2Id, 2, author2, book2Id, 75 * 10**18, true);
        vm.stopPrank();
        
        // Fund readers
        tipToken.mint(reader1, 10000 * 10**18);
        tipToken.mint(reader2, 10000 * 10**18);
        
        vm.prank(reader1);
        tipToken.approve(address(controller), 10000 * 10**18);
        
        vm.prank(reader2);
        tipToken.approve(address(controller), 10000 * 10**18);
    }
    
    function testMultipleChapterPurchases() public {
        uint256 chapterPrice = 100 * 10**18;
        uint256 initialBalance = tipToken.balanceOf(author1);
        
        // Reader 1 buys multiple chapters from Book 1
        vm.startPrank(reader1);
        controller.unlockChapter(book1Id, 1);
        controller.unlockChapter(book1Id, 2);
        controller.unlockChapter(book1Id, 3);
        vm.stopPrank();
        
        // Check individual balances (author1 is also curator, so gets 90%)
        uint256 expectedEarnings = chapterPrice * 3 * 90 / 100;
        uint256 actualBalance = tipToken.balanceOf(author1);
        assertEq(actualBalance, initialBalance + expectedEarnings);
    }
    
    function testCrossPurchaseBetweenBooks() public {
        uint256 initialBalance1 = tipToken.balanceOf(author1);
        uint256 initialBalance2 = tipToken.balanceOf(author2);
        
        // Reader 1 buys from both books (using chapters 4, 5 for book1 since 1-3 were used in previous test)
        vm.startPrank(reader1);
        controller.unlockChapter(book1Id, 4);
        controller.unlockChapter(book2Id, 1);
        vm.stopPrank();
        
        // Reader 2 buys from both books
        vm.startPrank(reader2);
        controller.unlockChapter(book1Id, 5);
        controller.unlockChapter(book2Id, 2);
        vm.stopPrank();
        
        // Verify revenues are tracked separately (includes previous test's revenue)
        assertEq(controller.bookTotalRevenue(book1Id), 100 * 10**18 * 5); // 3 from testMultipleChapterPurchases + 2 from this
        assertEq(controller.bookTotalRevenue(book2Id), 75 * 10**18 * 2);
        
        // Verify author balances (each gets 90% since they're also curators)
        assertEq(tipToken.balanceOf(author1), initialBalance1 + 100 * 10**18 * 2 * 90 / 100);
        assertEq(tipToken.balanceOf(author2), initialBalance2 + 75 * 10**18 * 2 * 90 / 100);
    }
    
    function testRevenueWithDifferentCurators() public {
        // Create a book where author1 writes but curator1 curates
        bytes32 curatedBookId = keccak256("curated-book");
        
        uint256 initialAuthor1Balance = tipToken.balanceOf(author1);
        uint256 initialCurator1Balance = tipToken.balanceOf(curator1);
        
        vm.prank(curator1);
        controller.registerBook(curatedBookId, 5, "ipfs://curatedbook");
        
        vm.prank(curator1);
        controller.setChapterAttribution(curatedBookId, 1, author1, curatedBookId, 100 * 10**18, true);
        
        // Reader unlocks chapter
        vm.prank(reader1);
        controller.unlockChapter(curatedBookId, 1);
        
        // Verify separate payments: 70% to author, 20% to curator, 10% platform
        assertEq(tipToken.balanceOf(author1), initialAuthor1Balance + 100 * 10**18 * 70 / 100);
        assertEq(tipToken.balanceOf(curator1), initialCurator1Balance + 100 * 10**18 * 20 / 100);
    }
    
    function testLargeScaleRevenue() public {
        // Set up more chapters for book1 with different prices (6-10 since 1-5 used in other tests)
        vm.startPrank(author1);
        for (uint i = 6; i <= 10; i++) {
            controller.setChapterAttribution(book1Id, i, author1, book1Id, 10 * 10**18, true);
        }
        vm.stopPrank();
        
        uint256 chapterPrice = 10 * 10**18;
        uint256 numChapters = 5; // chapters 6-10
        uint256 initialBalance = tipToken.balanceOf(author1);
        
        // Simulate many readers buying many chapters
        for (uint i = 6; i <= 10; i++) {
            vm.prank(reader1);
            controller.unlockChapter(book1Id, i);
            
            vm.prank(reader2);
            controller.unlockChapter(book1Id, i);
        }
        
        uint256 newRevenue = chapterPrice * 2 * numChapters; // 2 readers x 5 chapters
        uint256 expectedTotalRevenue = 100 * 10**18 * 7 + newRevenue; // all previous book1Id chapters + this
        assertEq(controller.bookTotalRevenue(book1Id), expectedTotalRevenue);
        
        // Check that author1 gets 90% (since they're also curator) of new revenue
        uint256 newAuthorEarnings = newRevenue * 90 / 100;
        assertEq(tipToken.balanceOf(author1), initialBalance + newAuthorEarnings);
    }
}