// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../../src/HybridRevenueControllerV2.sol";
import "../../src/TIPToken.sol";

contract HybridRevenueControllerV2Test is Test {
    HybridRevenueControllerV2 public controller;
    TIPToken public tipToken;
    
    address public platform;
    address public author;
    address public curator;
    address public reader;
    
    uint256 public bookId;
    
    function setUp() public {
        platform = address(this);
        author = address(0x1);
        curator = address(0x2);
        reader = address(0x3);
        
        // Deploy TIP token
        tipToken = new TIPToken();
        tipToken.initialize("TIP Token", "TIP", platform, 1000000 * 10**18);
        
        // Deploy controller
        controller = new HybridRevenueControllerV2(platform, address(tipToken));
        
        // Register a book
        vm.prank(author);
        bookId = controller.registerBook("Test Book", "test-book", curator);
        
        // Fund reader with TIP tokens
        tipToken.mint(reader, 1000 * 10**18);
        vm.prank(reader);
        tipToken.approve(address(controller), 1000 * 10**18);
    }
    
    function testBookRegistration() public {
        assertEq(controller.getBookAuthor(bookId), author);
        assertEq(controller.getBookCurator(bookId), curator);
        assertEq(controller.getBookTitle(bookId), "Test Book");
    }
    
    function testPermissionlessRegistration() public {
        address newAuthor = address(0x4);
        vm.prank(newAuthor);
        uint256 newBookId = controller.registerBook("New Book", "new-book", newAuthor);
        
        assertEq(controller.getBookAuthor(newBookId), newAuthor);
        assertEq(controller.getBookCurator(newBookId), newAuthor);
    }
    
    function testRevenueDistribution() public {
        uint256 payment = 100 * 10**18;
        
        uint256 platformBalanceBefore = tipToken.balanceOf(platform);
        uint256 authorBalanceBefore = tipToken.balanceOf(author);
        uint256 curatorBalanceBefore = tipToken.balanceOf(curator);
        
        vm.prank(reader);
        controller.payForChapter(bookId, 1, payment);
        
        // Check balances after payment
        assertEq(tipToken.balanceOf(platform), platformBalanceBefore + (payment * 10 / 100));
        assertEq(tipToken.balanceOf(author), authorBalanceBefore + (payment * 70 / 100));
        assertEq(tipToken.balanceOf(curator), curatorBalanceBefore + (payment * 20 / 100));
    }
    
    function testCannotRegisterWithEmptyTitle() public {
        vm.prank(author);
        vm.expectRevert();
        controller.registerBook("", "slug", curator);
    }
    
    function testOnlyAuthorCanUpdateBook() public {
        vm.prank(reader);
        vm.expectRevert("Only book author can update");
        controller.updateBookCurator(bookId, reader);
    }
    
    function testChapterPaymentTracking() public {
        uint256 payment = 50 * 10**18;
        
        vm.prank(reader);
        controller.payForChapter(bookId, 1, payment);
        
        assertEq(controller.getChapterRevenue(bookId, 1), payment);
        assertEq(controller.getTotalBookRevenue(bookId), payment);
    }
}