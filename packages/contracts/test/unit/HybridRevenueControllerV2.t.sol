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
    
    bytes32 public bookId;
    
    function setUp() public {
        platform = address(this);
        author = address(0x1);
        curator = address(0x2);
        reader = address(0x3);
        
        // Deploy TIP token
        tipToken = new TIPToken(platform);
        
        // Deploy controller
        controller = new HybridRevenueControllerV2(platform, address(tipToken));
        
        // Register a book
        bookId = keccak256("test-book");
        vm.prank(author);
        controller.registerBook(bookId, 5, "ipfs://testbook");
        
        // Fund reader with TIP tokens
        tipToken.mint(reader, 1000 * 10**18);
        vm.prank(reader);
        tipToken.approve(address(controller), 1000 * 10**18);
    }
    
    function testBookRegistration() public {
        (address bookCurator,,,) = controller.getBookInfo(bookId);
        assertEq(bookCurator, author); // author becomes curator in this version
    }
    
    function testPermissionlessRegistration() public {
        address newAuthor = address(0x4);
        bytes32 newBookId = keccak256("new-book");
        
        vm.prank(newAuthor);
        controller.registerBook(newBookId, 3, "ipfs://newbook");
        
        (address bookCurator,,,) = controller.getBookInfo(newBookId);
        assertEq(bookCurator, newAuthor); // author becomes curator
    }
    
    function testRevenueDistribution() public {
        uint256 payment = 100 * 10**18;
        
        // Set up chapter attribution first
        vm.prank(author);
        controller.setChapterAttribution(bookId, 1, author, bookId, payment, true);
        
        uint256 authorBalanceBefore = tipToken.balanceOf(author);
        
        vm.prank(reader);
        controller.unlockChapter(bookId, 1);
        
        // Author gets 90% since they're also the curator
        assertEq(tipToken.balanceOf(author), authorBalanceBefore + (payment * 90 / 100));
    }
    
    function testCannotRegisterZeroChapters() public {
        bytes32 invalidBookId = keccak256("invalid");
        vm.prank(author);
        vm.expectRevert("HybridRevenueV2: invalid chapter count");
        controller.registerBook(invalidBookId, 0, "ipfs://invalid");
    }
    
    function testOnlyCuratorCanSetAttribution() public {
        vm.prank(reader);
        vm.expectRevert("HybridRevenueV2: not authorized curator");
        controller.setChapterAttribution(bookId, 1, author, bookId, 100 * 10**18, true);
    }
    
    function testChapterUnlockTracking() public {
        uint256 payment = 50 * 10**18;
        
        // Set up chapter attribution first
        vm.prank(author);
        controller.setChapterAttribution(bookId, 1, author, bookId, payment, true);
        
        vm.prank(reader);
        controller.unlockChapter(bookId, 1);
        
        assertEq(controller.bookTotalRevenue(bookId), payment);
        assertEq(controller.hasUnlockedChapter(reader, bookId, 1), true);
    }
}