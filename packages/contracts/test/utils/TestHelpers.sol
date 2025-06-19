// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

contract TestHelpers is Test {
    // Common test addresses
    address constant ZERO_ADDRESS = address(0);
    address constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Time helpers
    uint256 constant ONE_DAY = 86400;
    uint256 constant ONE_WEEK = 604800;
    uint256 constant ONE_MONTH = 2592000;
    
    // Token helpers
    function toWei(uint256 amount) internal pure returns (uint256) {
        return amount * 10**18;
    }
    
    function fromWei(uint256 amount) internal pure returns (uint256) {
        return amount / 10**18;
    }
    
    // Address helpers
    function createUsers(uint256 count) internal returns (address[] memory) {
        address[] memory users = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            users[i] = address(uint160(i + 1));
        }
        return users;
    }
    
    // Assertion helpers
    function assertApproxEq(uint256 a, uint256 b, uint256 tolerance) internal {
        uint256 diff = a > b ? a - b : b - a;
        assertTrue(diff <= tolerance, "Values not approximately equal");
    }
    
    // Event helpers
    modifier expectEmit() {
        vm.expectEmit(true, true, true, true);
        _;
    }
    
    // Balance tracking
    struct BalanceSnapshot {
        address account;
        uint256 balance;
    }
    
    function snapshotBalance(address token, address account) internal view returns (BalanceSnapshot memory) {
        uint256 balance = IERC20(token).balanceOf(account);
        return BalanceSnapshot(account, balance);
    }
    
    function assertBalanceChange(
        address token,
        address account,
        uint256 expectedChange,
        BalanceSnapshot memory snapshot
    ) internal {
        uint256 currentBalance = IERC20(token).balanceOf(account);
        assertEq(currentBalance, snapshot.balance + expectedChange);
    }
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}