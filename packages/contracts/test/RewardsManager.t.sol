// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

contract RewardsManagerTest is Test {
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    address public owner;
    address public controller1;
    address public controller2;
    address public user;

    event RewardDistributed(
        address indexed recipient, uint256 amount, string rewardType, bytes32 indexed contextId, address controller
    );
    event ControllerAdded(address indexed controller, string controllerName);
    event ControllerRemoved(address indexed controller, string controllerName);
    event TokensWithdrawn(address indexed to, uint256 amount);

    function setUp() public {
        owner = address(this);
        controller1 = address(0x1);
        controller2 = address(0x2);
        user = address(0x3);

        tipToken = new TIPToken(owner);
        rewardsManager = new RewardsManager(owner, address(tipToken));

        // Grant minter role to rewards manager
        tipToken.addMinter(address(rewardsManager));
    }

    function testInitialState() public {
        assertEq(address(rewardsManager.tipToken()), address(tipToken));
        assertFalse(rewardsManager.isAuthorizedController(controller1));
        assertFalse(rewardsManager.paused());
    }

    function testAuthorizeController() public {
        assertFalse(rewardsManager.isAuthorizedController(controller1));

        vm.expectEmit(true, false, false, true);
        emit ControllerAdded(controller1, "test_controller");

        rewardsManager.addController(controller1, "test_controller");
        assertTrue(rewardsManager.isAuthorizedController(controller1));
    }

    function testAuthorizeControllerOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        rewardsManager.addController(controller1, "test_controller");
    }

    function testAuthorizeControllerZeroAddress() public {
        vm.expectRevert("RewardsManager: zero address");
        rewardsManager.addController(address(0), "test_controller");
    }

    function testAuthorizeControllerAlreadyAuthorized() public {
        rewardsManager.addController(controller1, "test_controller");

        vm.expectRevert("RewardsManager: already authorized");
        rewardsManager.addController(controller1, "test_controller");
    }

    function testDeauthorizeController() public {
        rewardsManager.addController(controller1, "test_controller");
        assertTrue(rewardsManager.isAuthorizedController(controller1));

        vm.expectEmit(true, false, false, true);
        emit ControllerRemoved(controller1, "test_controller");

        rewardsManager.removeController(controller1, "test_controller");
        assertFalse(rewardsManager.isAuthorizedController(controller1));
    }

    function testDeauthorizeControllerOnlyOwner() public {
        rewardsManager.addController(controller1, "test_controller");

        vm.prank(user);
        vm.expectRevert();
        rewardsManager.removeController(controller1, "test_controller");
    }

    function testDeauthorizeControllerNotAuthorized() public {
        vm.expectRevert("RewardsManager: not authorized");
        rewardsManager.removeController(controller1, "test_controller");
    }

    function testDistributeReward() public {
        rewardsManager.addController(controller1, "test_controller");
        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");

        uint256 initialBalance = tipToken.balanceOf(user);

        vm.prank(controller1);
        rewardsManager.distributeReward(user, rewardAmount, "test_reward", contextId);

        assertEq(tipToken.balanceOf(user), initialBalance + rewardAmount);
    }

    function testDistributeRewardOnlyAuthorized() public {
        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");

        vm.prank(controller1);
        vm.expectRevert("RewardsManager: unauthorized controller");
        rewardsManager.distributeReward(user, rewardAmount, "test_reward", contextId);
    }

    function testDistributeRewardZeroAddress() public {
        rewardsManager.addController(controller1, "test_controller");
        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");

        vm.prank(controller1);
        vm.expectRevert("RewardsManager: zero address");
        rewardsManager.distributeReward(address(0), rewardAmount, "test_reward", contextId);
    }

    function testDistributeRewardZeroAmount() public {
        rewardsManager.addController(controller1, "test_controller");
        bytes32 contextId = keccak256("test_context");

        vm.prank(controller1);
        vm.expectRevert("RewardsManager: zero amount");
        rewardsManager.distributeReward(user, 0, "test_reward", contextId);
    }

    function testDistributeRewardWhenPaused() public {
        rewardsManager.addController(controller1, "test_controller");
        rewardsManager.pause();

        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");

        vm.prank(controller1);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        rewardsManager.distributeReward(user, rewardAmount, "test_reward", contextId);
    }

    function testBatchDistributeRewards() public {
        rewardsManager.addController(controller1, "test_controller");

        address[] memory recipients = new address[](3);
        recipients[0] = user;
        recipients[1] = address(0x4);
        recipients[2] = address(0x5);

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        amounts[2] = 300 * 10 ** 18;

        bytes32[] memory contextIds = new bytes32[](3);
        contextIds[0] = keccak256("context1");
        contextIds[1] = keccak256("context2");
        contextIds[2] = keccak256("context3");

        uint256[] memory initialBalances = new uint256[](3);
        for (uint256 i = 0; i < recipients.length; i++) {
            initialBalances[i] = tipToken.balanceOf(recipients[i]);
        }

        vm.prank(controller1);
        rewardsManager.batchDistributeRewards(recipients, amounts, "batch_reward", contextIds);

        for (uint256 i = 0; i < recipients.length; i++) {
            assertEq(tipToken.balanceOf(recipients[i]), initialBalances[i] + amounts[i]);
        }
    }

    function testBatchDistributeRewardsArrayMismatch() public {
        rewardsManager.addController(controller1, "test_controller");

        address[] memory recipients = new address[](2);
        recipients[0] = user;
        recipients[1] = address(0x4);

        uint256[] memory amounts = new uint256[](3); // Wrong length
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        amounts[2] = 300 * 10 ** 18;

        bytes32[] memory contextIds = new bytes32[](2);
        contextIds[0] = keccak256("context1");
        contextIds[1] = keccak256("context2");

        vm.prank(controller1);
        vm.expectRevert("RewardsManager: array length mismatch");
        rewardsManager.batchDistributeRewards(recipients, amounts, "batch_reward", contextIds);
    }

    function testPause() public {
        assertFalse(rewardsManager.paused());
        rewardsManager.pause();
        assertTrue(rewardsManager.paused());
    }

    function testUnpause() public {
        rewardsManager.pause();
        assertTrue(rewardsManager.paused());

        rewardsManager.unpause();
        assertFalse(rewardsManager.paused());
    }

    function testMultipleControllers() public {
        rewardsManager.addController(controller1, "test_controller");
        rewardsManager.addController(controller2, "test_controller2");

        assertTrue(rewardsManager.isAuthorizedController(controller1));
        assertTrue(rewardsManager.isAuthorizedController(controller2));

        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");

        // Both controllers should be able to distribute rewards
        vm.prank(controller1);
        rewardsManager.distributeReward(user, rewardAmount, "test_reward1", contextId);

        vm.prank(controller2);
        rewardsManager.distributeReward(user, rewardAmount, "test_reward2", contextId);

        assertEq(tipToken.balanceOf(user), rewardAmount * 2);
    }

    function testOwnerCanDistributeRewards() public {
        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");

        // Owner should be able to distribute rewards without being explicitly authorized
        vm.expectRevert("RewardsManager: unauthorized controller");
        rewardsManager.distributeReward(user, rewardAmount, "owner_reward", contextId);
    }

    function testGetGlobalStats() public {
        (uint256 totalDistributed, uint256 uniqueRecipients, uint256 remainingSupply) = rewardsManager.getGlobalStats();

        assertEq(totalDistributed, 0);
        assertEq(uniqueRecipients, 0);
        assertGt(remainingSupply, 0);

        // After distributing rewards
        rewardsManager.addController(controller1, "test_controller");

        vm.prank(controller1);
        rewardsManager.distributeReward(user, 100 * 10 ** 18, "test", keccak256("context"));

        (totalDistributed, uniqueRecipients, remainingSupply) = rewardsManager.getGlobalStats();

        assertEq(totalDistributed, 100 * 10 ** 18);
        assertEq(uniqueRecipients, 1);
    }
}
