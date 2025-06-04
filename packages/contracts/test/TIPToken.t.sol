// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TIPToken.sol";

contract TIPTokenTest is Test {
    TIPToken public token;
    address public owner;
    address public minter;
    address public user;
    address public nonMinter;

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1B tokens
    uint256 public constant SUPPLY_CAP = 10_000_000_000 * 10 ** 18; // 10B tokens

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event SupplyCapUpdated(uint256 oldCap, uint256 newCap);

    function setUp() public {
        owner = address(this);
        minter = address(0x1);
        user = address(0x2);
        nonMinter = address(0x3);

        token = new TIPToken(owner);
    }

    function testInitialState() public {
        assertEq(token.name(), "TIP Token");
        assertEq(token.symbol(), "TIP");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.supplyCap(), SUPPLY_CAP);
        assertTrue(token.isMinter(owner));
        assertFalse(token.paused());
    }

    function testOwnerIsMinter() public {
        assertTrue(token.isMinter(owner));
    }

    function testAddMinter() public {
        assertFalse(token.isMinter(minter));

        vm.expectEmit(true, false, false, false);
        emit MinterAdded(minter);

        token.addMinter(minter);
        assertTrue(token.isMinter(minter));
    }

    function testAddMinterOnlyOwner() public {
        vm.prank(nonMinter);
        vm.expectRevert();
        token.addMinter(minter);
    }

    function testAddMinterZeroAddress() public {
        vm.expectRevert("TIPToken: zero address");
        token.addMinter(address(0));
    }

    function testAddMinterAlreadyMinter() public {
        token.addMinter(minter);

        vm.expectRevert("TIPToken: already a minter");
        token.addMinter(minter);
    }

    function testRemoveMinter() public {
        token.addMinter(minter);
        assertTrue(token.isMinter(minter));

        vm.expectEmit(true, false, false, false);
        emit MinterRemoved(minter);

        token.removeMinter(minter);
        assertFalse(token.isMinter(minter));
    }

    function testRemoveMinterOnlyOwner() public {
        token.addMinter(minter);

        vm.prank(nonMinter);
        vm.expectRevert();
        token.removeMinter(minter);
    }

    function testRemoveMinterNotMinter() public {
        vm.expectRevert("TIPToken: not a minter");
        token.removeMinter(minter);
    }

    function testMint() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 initialBalance = token.balanceOf(user);
        uint256 initialSupply = token.totalSupply();

        token.mint(user, mintAmount);

        assertEq(token.balanceOf(user), initialBalance + mintAmount);
        assertEq(token.totalSupply(), initialSupply + mintAmount);
    }

    function testMintOnlyMinter() public {
        uint256 mintAmount = 1000 * 10 ** 18;

        vm.prank(nonMinter);
        vm.expectRevert("TIPToken: caller is not a minter");
        token.mint(user, mintAmount);
    }

    function testMintExceedsSupplyCap() public {
        // Try to mint more than the remaining supply
        uint256 remainingSupply = token.remainingSupply();
        uint256 excessAmount = remainingSupply + 1;

        vm.expectRevert("TIPToken: supply cap exceeded");
        token.mint(user, excessAmount);
    }

    function testMintWhenPaused() public {
        token.pause();

        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        token.mint(user, 1000 * 10 ** 18);
    }

    function testUpdateSupplyCap() public {
        uint256 newCap = 15_000_000_000 * 10 ** 18; // 15B tokens
        uint256 oldCap = token.supplyCap();

        vm.expectEmit(false, false, false, true);
        emit SupplyCapUpdated(oldCap, newCap);

        token.updateSupplyCap(newCap);
        assertEq(token.supplyCap(), newCap);
    }

    function testUpdateSupplyCapOnlyOwner() public {
        vm.prank(nonMinter);
        vm.expectRevert();
        token.updateSupplyCap(15_000_000_000 * 10 ** 18);
    }

    function testUpdateSupplyCapBelowCurrentSupply() public {
        uint256 currentSupply = token.totalSupply();
        uint256 newCap = currentSupply - 1;

        vm.expectRevert("TIPToken: cap below current supply");
        token.updateSupplyCap(newCap);
    }

    function testPause() public {
        assertFalse(token.paused());

        token.pause();
        assertTrue(token.paused());
    }

    function testPauseOnlyOwner() public {
        vm.prank(nonMinter);
        vm.expectRevert();
        token.pause();
    }

    function testUnpause() public {
        token.pause();
        assertTrue(token.paused());

        token.unpause();
        assertFalse(token.paused());
    }

    function testUnpauseOnlyOwner() public {
        token.pause();

        vm.prank(nonMinter);
        vm.expectRevert();
        token.unpause();
    }

    function testTransferWhenPaused() public {
        uint256 transferAmount = 1000 * 10 ** 18;

        // First, transfer some tokens to user
        token.transfer(user, transferAmount);
        assertEq(token.balanceOf(user), transferAmount);

        // Pause the contract
        token.pause();

        // Try to transfer when paused
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        token.transfer(owner, transferAmount);
    }

    function testBurn() public {
        uint256 burnAmount = 1000 * 10 ** 18;
        uint256 initialBalance = token.balanceOf(owner);
        uint256 initialSupply = token.totalSupply();

        token.burn(burnAmount);

        assertEq(token.balanceOf(owner), initialBalance - burnAmount);
        assertEq(token.totalSupply(), initialSupply - burnAmount);
    }

    function testBurnWhenPaused() public {
        token.pause();

        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        token.burn(1000 * 10 ** 18);
    }

    function testRemainingSupply() public {
        uint256 expectedRemaining = SUPPLY_CAP - INITIAL_SUPPLY;
        assertEq(token.remainingSupply(), expectedRemaining);

        // Mint some tokens and check remaining supply decreases
        uint256 mintAmount = 1000 * 10 ** 18;
        token.mint(user, mintAmount);

        assertEq(token.remainingSupply(), expectedRemaining - mintAmount);
    }

    function testFuzzMint(uint256 amount) public {
        // Bound the amount to be within reasonable limits
        amount = bound(amount, 1, token.remainingSupply());

        uint256 initialSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(user);

        token.mint(user, amount);

        assertEq(token.totalSupply(), initialSupply + amount);
        assertEq(token.balanceOf(user), initialBalance + amount);
        assertGe(token.supplyCap(), token.totalSupply());
    }

    function testFuzzSupplyCapUpdate(uint256 newCap) public {
        // Bound the new cap to be at least the current supply
        newCap = bound(newCap, token.totalSupply(), type(uint256).max);

        token.updateSupplyCap(newCap);
        assertEq(token.supplyCap(), newCap);
        assertGe(token.supplyCap(), token.totalSupply());
    }

    function testMinterManagement() public {
        address minter1 = address(0x10);
        address minter2 = address(0x20);

        // Add multiple minters
        token.addMinter(minter1);
        token.addMinter(minter2);

        assertTrue(token.isMinter(minter1));
        assertTrue(token.isMinter(minter2));

        // Both should be able to mint
        vm.prank(minter1);
        token.mint(user, 100 * 10 ** 18);

        vm.prank(minter2);
        token.mint(user, 200 * 10 ** 18);

        assertEq(token.balanceOf(user), 300 * 10 ** 18);

        // Remove one minter
        token.removeMinter(minter1);
        assertFalse(token.isMinter(minter1));
        assertTrue(token.isMinter(minter2));

        // Removed minter should not be able to mint
        vm.prank(minter1);
        vm.expectRevert("TIPToken: caller is not a minter");
        token.mint(user, 100 * 10 ** 18);

        // Other minter should still work
        vm.prank(minter2);
        token.mint(user, 100 * 10 ** 18);
    }

    function testTransferFunctionality() public {
        uint256 transferAmount = 1000 * 10 ** 18;

        // Transfer from owner to user
        token.transfer(user, transferAmount);
        assertEq(token.balanceOf(user), transferAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - transferAmount);

        // Transfer from user to another address
        address recipient = address(0x99);
        vm.prank(user);
        token.transfer(recipient, transferAmount / 2);

        assertEq(token.balanceOf(recipient), transferAmount / 2);
        assertEq(token.balanceOf(user), transferAmount / 2);
    }
}
