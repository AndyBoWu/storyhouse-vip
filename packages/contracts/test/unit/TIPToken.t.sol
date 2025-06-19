// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../../src/TIPToken.sol";

contract TIPTokenTest is Test {
    TIPToken public token;
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        token = new TIPToken();
        token.initialize("TIP Token", "TIP", owner, 1000000 * 10**18);
    }
    
    function testInitialState() public {
        assertEq(token.name(), "TIP Token");
        assertEq(token.symbol(), "TIP");
        assertEq(token.owner(), owner);
        assertEq(token.supplyCap(), 1000000 * 10**18);
    }
    
    function testMint() public {
        uint256 amount = 100 * 10**18;
        token.mint(user1, amount);
        assertEq(token.balanceOf(user1), amount);
    }
    
    function testMintFailsWhenExceedingCap() public {
        uint256 cap = token.supplyCap();
        vm.expectRevert("TIPToken: Supply cap exceeded");
        token.mint(user1, cap + 1);
    }
    
    function testUpdateSupplyCap() public {
        uint256 newCap = 2000000 * 10**18;
        token.updateSupplyCap(newCap);
        assertEq(token.supplyCap(), newCap);
    }
    
    function testOnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 100 * 10**18);
    }
    
    function testTransfer() public {
        uint256 amount = 100 * 10**18;
        token.mint(user1, amount);
        
        vm.prank(user1);
        token.transfer(user2, amount);
        
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), amount);
    }
}