// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TIPTokenTestnet.sol";

contract TIPTokenTestnetTest is Test {
    TIPTokenTestnet public token;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public minter = address(4);

    function setUp() public {
        vm.prank(owner);
        token = new TIPTokenTestnet(owner);
    }

    function testInitialState() public {
        assertEq(token.name(), "TIP Token Testnet");
        assertEq(token.symbol(), "TIPT");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 1_000_000_000 ether); // 1B initial supply
        assertEq(token.supplyCap(), 10_000_000_000 ether); // 10B max supply
        assertEq(token.balanceOf(owner), 1_000_000_000 ether);
        assertTrue(token.isMinter(owner));
    }

    function testMinterManagement() public {
        // Only owner can add minters
        vm.prank(owner);
        token.addMinter(minter);
        assertTrue(token.isMinter(minter));

        // Non-owner cannot add minters
        vm.prank(user1);
        vm.expectRevert();
        token.addMinter(user2);

        // Only owner can remove minters
        vm.prank(owner);
        token.removeMinter(minter);
        assertFalse(token.isMinter(minter));

        // Non-owner cannot remove minters
        vm.prank(user1);
        vm.expectRevert();
        token.removeMinter(owner);
    }

    function testMinting() public {
        // Add minter
        vm.prank(owner);
        token.addMinter(minter);

        // Minter can mint tokens
        vm.prank(minter);
        token.mint(user1, 1000 ether);
        assertEq(token.balanceOf(user1), 1000 ether);

        // Non-minter cannot mint
        vm.prank(user2);
        vm.expectRevert("TIPTokenTestnet: caller is not a minter");
        token.mint(user1, 1000 ether);
    }

    function testSupplyCap() public {
        // Cannot mint beyond supply cap
        vm.prank(owner);
        vm.expectRevert("TIPTokenTestnet: supply cap exceeded");
        token.mint(user1, 9_000_000_001 ether); // Would exceed 10B cap

        // Can mint up to cap
        vm.prank(owner);
        token.mint(user1, 9_000_000_000 ether); // Exactly at cap
        assertEq(token.totalSupply(), 10_000_000_000 ether);
        assertEq(token.remainingSupply(), 0);
    }

    function testSupplyCapUpdate() public {
        // Only owner can update supply cap
        vm.prank(owner);
        token.updateSupplyCap(15_000_000_000 ether);
        assertEq(token.supplyCap(), 15_000_000_000 ether);

        // Cannot set cap below current supply
        vm.prank(owner);
        vm.expectRevert("TIPTokenTestnet: cap below current supply");
        token.updateSupplyCap(500_000_000 ether); // Below current 1B supply

        // Non-owner cannot update cap
        vm.prank(user1);
        vm.expectRevert();
        token.updateSupplyCap(20_000_000_000 ether);
    }

    function testBurning() public {
        // Owner can burn their tokens
        vm.prank(owner);
        token.burn(100_000_000 ether);
        assertEq(token.balanceOf(owner), 900_000_000 ether);
        assertEq(token.totalSupply(), 900_000_000 ether);

        // User can burn tokens they own
        vm.prank(owner);
        token.transfer(user1, 1000 ether);
        
        vm.prank(user1);
        token.burn(500 ether);
        assertEq(token.balanceOf(user1), 500 ether);
    }

    function testPauseUnpause() public {
        // Only owner can pause
        vm.prank(owner);
        token.pause();
        assertTrue(token.paused());

        // Transfers should fail when paused
        vm.prank(owner);
        vm.expectRevert("Pausable: paused");
        token.transfer(user1, 1000 ether);

        // Minting should fail when paused
        vm.prank(owner);
        vm.expectRevert("Pausable: paused");
        token.mint(user1, 1000 ether);

        // Only owner can unpause
        vm.prank(owner);
        token.unpause();
        assertFalse(token.paused());

        // Transfers should work after unpause
        vm.prank(owner);
        token.transfer(user1, 1000 ether);
        assertEq(token.balanceOf(user1), 1000 ether);

        // Non-owner cannot pause/unpause
        vm.prank(user1);
        vm.expectRevert();
        token.pause();
    }

    function testTransfers() public {
        // Basic transfer
        vm.prank(owner);
        token.transfer(user1, 1000 ether);
        assertEq(token.balanceOf(user1), 1000 ether);
        assertEq(token.balanceOf(owner), 999_999_000 ether);

        // Transfer with allowance
        vm.prank(user1);
        token.approve(user2, 500 ether);
        
        vm.prank(user2);
        token.transferFrom(user1, user2, 300 ether);
        assertEq(token.balanceOf(user2), 300 ether);
        assertEq(token.balanceOf(user1), 700 ether);
        assertEq(token.allowance(user1, user2), 200 ether);
    }

    function testRemainingSupply() public {
        uint256 initialRemaining = token.remainingSupply();
        assertEq(initialRemaining, 9_000_000_000 ether); // 10B cap - 1B supply

        // Mint some tokens
        vm.prank(owner);
        token.mint(user1, 1_000_000 ether);
        
        assertEq(token.remainingSupply(), 9_000_000_000 ether - 1_000_000 ether);
    }

    function testEventEmission() public {
        // Test MinterAdded event
        vm.expectEmit(true, false, false, false);
        emit TIPTokenTestnet.MinterAdded(minter);
        vm.prank(owner);
        token.addMinter(minter);

        // Test MinterRemoved event
        vm.expectEmit(true, false, false, false);
        emit TIPTokenTestnet.MinterRemoved(minter);
        vm.prank(owner);
        token.removeMinter(minter);

        // Test SupplyCapUpdated event
        vm.expectEmit(false, false, false, true);
        emit TIPTokenTestnet.SupplyCapUpdated(10_000_000_000 ether, 15_000_000_000 ether);
        vm.prank(owner);
        token.updateSupplyCap(15_000_000_000 ether);
    }

    function testEdgeCases() public {
        // Cannot add zero address as minter
        vm.prank(owner);
        vm.expectRevert("TIPTokenTestnet: zero address");
        token.addMinter(address(0));

        // Cannot add same minter twice
        vm.prank(owner);
        token.addMinter(minter);
        
        vm.prank(owner);
        vm.expectRevert("TIPTokenTestnet: already a minter");
        token.addMinter(minter);

        // Cannot remove non-minter
        vm.prank(owner);
        vm.expectRevert("TIPTokenTestnet: not a minter");
        token.removeMinter(user1);
    }

    function testFuzzMinting(uint256 amount) public {
        // Bound amount to reasonable range
        amount = bound(amount, 1, 9_000_000_000 ether);
        
        vm.prank(owner);
        token.mint(user1, amount);
        
        assertEq(token.balanceOf(user1), amount);
        assertLe(token.totalSupply(), token.supplyCap());
    }

    function testFuzzSupplyCapUpdate(uint256 newCap) public {
        // Bound to reasonable range above current supply
        newCap = bound(newCap, token.totalSupply(), type(uint128).max);
        
        vm.prank(owner);
        token.updateSupplyCap(newCap);
        
        assertEq(token.supplyCap(), newCap);
        assertGe(token.supplyCap(), token.totalSupply());
    }
}