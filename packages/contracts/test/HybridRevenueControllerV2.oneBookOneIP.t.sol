// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/HybridRevenueControllerV2.sol";
import "../src/TIPToken.sol";

/**
 * @title HybridRevenueControllerV2 - One Book One IP Tests
 * @dev Tests for the updated architecture where derivative books are not allowed
 */
contract HybridRevenueControllerV2OneBookOneIPTest is Test {
    HybridRevenueControllerV2 public controller;
    TIPToken public tipToken;
    
    address public admin = address(0x1);
    address public originalAuthor = address(0x2);
    address public derivativeAuthor = address(0x3);
    address public reader = address(0x4);
    
    bytes32 public originalBookId = keccak256("original-book");
    bytes32 public derivativeBookId = keccak256("derivative-book");
    
    event BookRegistered(
        bytes32 indexed bookId,
        address indexed curator,
        uint256 totalChapters
    );
    
    event TotalChaptersUpdated(
        bytes32 indexed bookId,
        uint256 oldTotal,
        uint256 newTotal,
        address updatedBy
    );
    
    function setUp() public {
        // Deploy contracts
        tipToken = new TIPToken(admin);
        controller = new HybridRevenueControllerV2(admin, address(tipToken));
        
        // Setup roles and balances
        vm.startPrank(admin);
        tipToken.mint(reader, 10000 * 10**18);
        vm.stopPrank();
        
        // Register original book
        vm.prank(originalAuthor);
        controller.registerBook(
            originalBookId,
            100, // allow up to 100 chapters
            "ipfs://original-book-metadata"
        );
    }
    
    /**
     * @dev Test that derivative book registration is no longer possible
     * (parameter removed from function signature)
     */
    function testOnlyOriginalBookRegistrationAllowed() public {
        bytes32 newBookId = keccak256("another-book");
        
        // Can only register original books now
        vm.prank(derivativeAuthor);
        controller.registerBook(
            newBookId,
            50,
            "ipfs://new-book-metadata"
        );
        
        // Verify it was registered as a regular book
        (address curator, uint256 totalChapters, bool isActive, ) = 
            controller.getBookInfo(newBookId);
            
        assertEq(curator, derivativeAuthor);
        assertEq(totalChapters, 50);
        assertTrue(isActive);
    }
    
    /**
     * @dev Test that original book registration still works
     */
    function testOriginalBookRegistrationSucceeds() public {
        bytes32 newBookId = keccak256("new-original-book");
        
        vm.expectEmit(true, true, false, true);
        emit BookRegistered(newBookId, originalAuthor, 100);
        
        vm.prank(originalAuthor);
        controller.registerBook(
            newBookId,
            100,
            "ipfs://new-book-metadata"
        );
        
        // Verify book was registered correctly
        (address curator, uint256 totalChapters, bool isActive, ) = 
            controller.getBookInfo(newBookId);
            
        assertEq(curator, originalAuthor);
        assertEq(totalChapters, 100);
        assertTrue(isActive);
    }
    
    /**
     * @dev Test updateTotalChapters function - success case
     */
    function testUpdateTotalChaptersSuccess() public {
        // First register a book with limited chapters (simulating Bob's case)
        bytes32 limitedBookId = keccak256("limited-book");
        vm.prank(originalAuthor);
        controller.registerBook(
            limitedBookId,
            3, // Only 3 chapters allowed
            "ipfs://limited-book"
        );
        
        // Admin updates the total chapters
        vm.expectEmit(true, false, false, true);
        emit TotalChaptersUpdated(limitedBookId, 3, 100, admin);
        
        vm.prank(admin);
        controller.updateTotalChapters(limitedBookId, 100);
        
        // Verify the update
        (, uint256 totalChapters, , ) = controller.getBookInfo(limitedBookId);
        assertEq(totalChapters, 100);
    }
    
    /**
     * @dev Test updateTotalChapters requires admin role
     */
    function testUpdateTotalChaptersRequiresAdmin() public {
        vm.prank(originalAuthor);
        vm.expectRevert(); // Should fail due to missing ADMIN_ROLE
        controller.updateTotalChapters(originalBookId, 200);
    }
    
    /**
     * @dev Test updateTotalChapters cannot reduce chapters
     */
    function testUpdateTotalChaptersCannotReduce() public {
        vm.prank(admin);
        vm.expectRevert("HybridRevenueV2: cannot reduce total chapters");
        controller.updateTotalChapters(originalBookId, 50); // Original has 100
    }
    
    /**
     * @dev Test updateTotalChapters for non-existent book
     */
    function testUpdateTotalChaptersNonExistentBook() public {
        bytes32 fakeBookId = keccak256("fake-book");
        
        vm.prank(admin);
        vm.expectRevert("HybridRevenueV2: book not found");
        controller.updateTotalChapters(fakeBookId, 100);
    }
    
    /**
     * @dev Test updateTotalChapters validates chapter count
     */
    function testUpdateTotalChaptersValidation() public {
        // Test zero chapters
        vm.prank(admin);
        vm.expectRevert("HybridRevenueV2: invalid chapter count");
        controller.updateTotalChapters(originalBookId, 0);
        
        // Test too many chapters
        vm.prank(admin);
        vm.expectRevert("HybridRevenueV2: invalid chapter count");
        controller.updateTotalChapters(originalBookId, 1000001);
    }
    
    /**
     * @dev Test that derivative authors can still add chapters to original books
     * This simulates the intended workflow
     */
    function testDerivativeAuthorCanAddChaptersToOriginalBook() public {
        // First, original author must authorize the derivative author
        vm.prank(originalAuthor);
        controller.authorizeCurator(originalBookId, derivativeAuthor);
        
        // Now derivative author can add their chapter to the original book
        vm.prank(derivativeAuthor);
        controller.setChapterAttribution(
            originalBookId, // Using ORIGINAL book ID, not a derivative book
            4, // Chapter 4 (continuing from chapter 3)
            derivativeAuthor,
            originalBookId,
            5 * 10**17, // 0.5 TIP
            false // not original content (it's derivative)
        );
        
        // Verify the chapter was added
        (address chapterAuthor, , uint256 price, bool isOriginal, ) = 
            controller.getChapterInfo(originalBookId, 4);
            
        assertEq(chapterAuthor, derivativeAuthor);
        assertEq(price, 5 * 10**17);
        assertFalse(isOriginal);
    }
    
    /**
     * @dev Integration test: Full workflow for Bob's scenario
     */
    function testBobsScenarioFix() public {
        // Simulate Bob's current situation
        bytes32 bobsBookId = keccak256("bobs-problematic-book");
        address andy = originalAuthor;
        address bob = derivativeAuthor;
        
        // Andy's original book with 3 chapters
        vm.prank(andy);
        controller.registerBook(
            bobsBookId,
            3, // Only 3 chapters (this is the problem)
            "ipfs://andys-book"
        );
        
        // Bob can no longer register derivative books - the option is removed
        // Instead, Bob must work with Andy to add chapters to the original book
        
        // Solution: Admin updates Andy's book to allow more chapters
        vm.prank(admin);
        controller.updateTotalChapters(bobsBookId, 100);
        
        // Andy authorizes Bob as a curator
        vm.prank(andy);
        controller.authorizeCurator(bobsBookId, bob);
        
        // Now Bob can add chapter 4 to Andy's book
        vm.prank(bob);
        controller.setChapterAttribution(
            bobsBookId, // Andy's book ID
            4, // Chapter 4
            bob, // Bob is the author
            bobsBookId,
            5 * 10**17, // 0.5 TIP
            false // derivative content
        );
        
        // Verify Bob's chapter was added successfully
        (address chapterAuthor, , , , ) = controller.getChapterInfo(bobsBookId, 4);
        assertEq(chapterAuthor, bob);
    }
}