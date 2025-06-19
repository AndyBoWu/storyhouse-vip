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
    
    uint256 public book1Id;
    uint256 public book2Id;
    
    function setUp() public {
        // Deploy contracts
        tipToken = new TIPToken();
        tipToken.initialize("TIP Token", "TIP", address(this), 10000000 * 10**18);
        controller = new HybridRevenueControllerV2(platform, address(tipToken));
        
        // Register books
        vm.prank(author1);
        book1Id = controller.registerBook("Book One", "book-one", curator1);
        
        vm.prank(author2);
        book2Id = controller.registerBook("Book Two", "book-two", curator2);
        
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
        
        // Reader 1 buys multiple chapters from Book 1
        vm.startPrank(reader1);
        controller.payForChapter(book1Id, 1, chapterPrice);
        controller.payForChapter(book1Id, 2, chapterPrice);
        controller.payForChapter(book1Id, 3, chapterPrice);
        vm.stopPrank();
        
        // Check total revenue
        assertEq(controller.getTotalBookRevenue(book1Id), chapterPrice * 3);
        
        // Check individual balances
        assertEq(tipToken.balanceOf(platform), chapterPrice * 3 * 10 / 100);
        assertEq(tipToken.balanceOf(author1), chapterPrice * 3 * 70 / 100);
        assertEq(tipToken.balanceOf(curator1), chapterPrice * 3 * 20 / 100);
    }
    
    function testCrossPurchaseBetweenBooks() public {
        uint256 price1 = 50 * 10**18;
        uint256 price2 = 75 * 10**18;
        
        // Reader 1 buys from both books
        vm.startPrank(reader1);
        controller.payForChapter(book1Id, 1, price1);
        controller.payForChapter(book2Id, 1, price2);
        vm.stopPrank();
        
        // Reader 2 buys from both books
        vm.startPrank(reader2);
        controller.payForChapter(book1Id, 2, price1);
        controller.payForChapter(book2Id, 2, price2);
        vm.stopPrank();
        
        // Verify revenues are tracked separately
        assertEq(controller.getTotalBookRevenue(book1Id), price1 * 2);
        assertEq(controller.getTotalBookRevenue(book2Id), price2 * 2);
        
        // Verify author balances
        assertEq(tipToken.balanceOf(author1), price1 * 2 * 70 / 100);
        assertEq(tipToken.balanceOf(author2), price2 * 2 * 70 / 100);
    }
    
    function testRevenueWithCuratorChange() public {
        uint256 payment = 100 * 10**18;
        address newCurator = address(0x7);
        
        // First payment to original curator
        vm.prank(reader1);
        controller.payForChapter(book1Id, 1, payment);
        
        uint256 originalCuratorBalance = tipToken.balanceOf(curator1);
        assertEq(originalCuratorBalance, payment * 20 / 100);
        
        // Author changes curator
        vm.prank(author1);
        controller.updateBookCurator(book1Id, newCurator);
        
        // Second payment to new curator
        vm.prank(reader1);
        controller.payForChapter(book1Id, 2, payment);
        
        // Verify payments went to correct curators
        assertEq(tipToken.balanceOf(curator1), originalCuratorBalance); // No change
        assertEq(tipToken.balanceOf(newCurator), payment * 20 / 100);
    }
    
    function testLargeScaleRevenue() public {
        uint256 basePrice = 10 * 10**18;
        uint256 numChapters = 50;
        
        // Simulate many readers buying many chapters
        for (uint i = 0; i < numChapters; i++) {
            vm.prank(reader1);
            controller.payForChapter(book1Id, i + 1, basePrice);
            
            vm.prank(reader2);
            controller.payForChapter(book1Id, i + 1, basePrice * 2);
        }
        
        uint256 totalRevenue = basePrice * 3 * numChapters;
        assertEq(controller.getTotalBookRevenue(book1Id), totalRevenue);
        
        // Verify distribution
        assertEq(tipToken.balanceOf(platform), totalRevenue * 10 / 100);
        assertEq(tipToken.balanceOf(author1), totalRevenue * 70 / 100);
        assertEq(tipToken.balanceOf(curator1), totalRevenue * 20 / 100);
    }
}