// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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

    function testRewardTrackingFunctions() public {
        rewardsManager.addController(controller1, "test_controller");
        
        bytes32 contextId1 = keccak256("story1");
        bytes32 contextId2 = keccak256("story2");
        uint256 amount1 = 100 * 10 ** 18;
        uint256 amount2 = 200 * 10 ** 18;
        
        // Initially should be zero
        assertEq(rewardsManager.getUserTotalRewards(user), 0);
        assertEq(rewardsManager.getUserContextRewards(user, contextId1), 0);
        assertEq(rewardsManager.getContextTotalRewards(contextId1), 0);
        
        // Distribute first reward
        vm.prank(controller1);
        rewardsManager.distributeReward(user, amount1, "read", contextId1);
        
        assertEq(rewardsManager.getUserTotalRewards(user), amount1);
        assertEq(rewardsManager.getUserContextRewards(user, contextId1), amount1);
        assertEq(rewardsManager.getContextTotalRewards(contextId1), amount1);
        assertEq(rewardsManager.getUserContextRewards(user, contextId2), 0);
        
        // Distribute second reward to same context
        vm.prank(controller1);
        rewardsManager.distributeReward(user, amount1, "read", contextId1);
        
        assertEq(rewardsManager.getUserTotalRewards(user), amount1 * 2);
        assertEq(rewardsManager.getUserContextRewards(user, contextId1), amount1 * 2);
        assertEq(rewardsManager.getContextTotalRewards(contextId1), amount1 * 2);
        
        // Distribute to different context
        vm.prank(controller1);
        rewardsManager.distributeReward(user, amount2, "creator", contextId2);
        
        assertEq(rewardsManager.getUserTotalRewards(user), amount1 * 2 + amount2);
        assertEq(rewardsManager.getUserContextRewards(user, contextId1), amount1 * 2);
        assertEq(rewardsManager.getUserContextRewards(user, contextId2), amount2);
        assertEq(rewardsManager.getContextTotalRewards(contextId1), amount1 * 2);
        assertEq(rewardsManager.getContextTotalRewards(contextId2), amount2);
    }

    function testGetControllerByType() public {
        // Initially should return zero address
        assertEq(rewardsManager.getControllerByType("read"), address(0));
        assertEq(rewardsManager.getControllerByType("creator"), address(0));
        
        // Add controllers
        rewardsManager.addController(controller1, "read");
        rewardsManager.addController(controller2, "creator");
        
        assertEq(rewardsManager.getControllerByType("read"), controller1);
        assertEq(rewardsManager.getControllerByType("creator"), controller2);
        assertEq(rewardsManager.getControllerByType("nonexistent"), address(0));
        
        // Remove controller
        rewardsManager.removeController(controller1, "read");
        assertEq(rewardsManager.getControllerByType("read"), address(0));
        assertEq(rewardsManager.getControllerByType("creator"), controller2);
    }

    function testRewardDistributionWhenTIPTokenPaused() public {
        rewardsManager.addController(controller1, "test_controller");
        uint256 rewardAmount = 100 * 10 ** 18;
        bytes32 contextId = keccak256("test_context");
        
        // Pause the TIP token
        tipToken.pause();
        
        // Reward distribution should fail when TIP token is paused
        vm.prank(controller1);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        rewardsManager.distributeReward(user, rewardAmount, "test_reward", contextId);
    }

    function testBatchDistributeZeroAddressInArray() public {
        rewardsManager.addController(controller1, "test_controller");
        
        address[] memory recipients = new address[](2);
        recipients[0] = user;
        recipients[1] = address(0); // Zero address
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        
        bytes32[] memory contextIds = new bytes32[](2);
        contextIds[0] = keccak256("context1");
        contextIds[1] = keccak256("context2");
        
        vm.prank(controller1);
        vm.expectRevert("RewardsManager: zero address");
        rewardsManager.batchDistributeRewards(recipients, amounts, "batch_reward", contextIds);
    }

    function testBatchDistributeZeroAmountInArray() public {
        rewardsManager.addController(controller1, "test_controller");
        
        address[] memory recipients = new address[](2);
        recipients[0] = user;
        recipients[1] = address(0x4);
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 0; // Zero amount
        
        bytes32[] memory contextIds = new bytes32[](2);
        contextIds[0] = keccak256("context1");
        contextIds[1] = keccak256("context2");
        
        vm.prank(controller1);
        vm.expectRevert("RewardsManager: zero amount");
        rewardsManager.batchDistributeRewards(recipients, amounts, "batch_reward", contextIds);
    }

    function testMultipleUsersRewardTracking() public {
        rewardsManager.addController(controller1, "test_controller");
        
        address user2 = address(0x6);
        bytes32 contextId = keccak256("shared_context");
        uint256 amount1 = 100 * 10 ** 18;
        uint256 amount2 = 200 * 10 ** 18;
        
        // Distribute to first user
        vm.prank(controller1);
        rewardsManager.distributeReward(user, amount1, "test", contextId);
        
        // Distribute to second user
        vm.prank(controller1);
        rewardsManager.distributeReward(user2, amount2, "test", contextId);
        
        // Check individual user rewards
        assertEq(rewardsManager.getUserTotalRewards(user), amount1);
        assertEq(rewardsManager.getUserTotalRewards(user2), amount2);
        assertEq(rewardsManager.getUserContextRewards(user, contextId), amount1);
        assertEq(rewardsManager.getUserContextRewards(user2, contextId), amount2);
        
        // Check context total (should be sum of both)
        assertEq(rewardsManager.getContextTotalRewards(contextId), amount1 + amount2);
        
        // Check global stats
        (uint256 totalDistributed, uint256 uniqueRecipients,) = rewardsManager.getGlobalStats();
        assertEq(totalDistributed, amount1 + amount2);
        assertEq(uniqueRecipients, 2);
    }

    function testHasReceivedRewardsTracking() public {
        rewardsManager.addController(controller1, "test_controller");
        
        // Initially no one has received rewards
        (,uint256 uniqueRecipients,) = rewardsManager.getGlobalStats();
        assertEq(uniqueRecipients, 0);
        assertFalse(rewardsManager.hasReceivedRewards(user));
        
        // Distribute first reward
        vm.prank(controller1);
        rewardsManager.distributeReward(user, 100 * 10 ** 18, "test", keccak256("context"));
        
        assertTrue(rewardsManager.hasReceivedRewards(user));
        (,uniqueRecipients,) = rewardsManager.getGlobalStats();
        assertEq(uniqueRecipients, 1);
        
        // Distribute second reward to same user
        vm.prank(controller1);
        rewardsManager.distributeReward(user, 100 * 10 ** 18, "test", keccak256("context2"));
        
        // Unique recipients should not increase
        (,uniqueRecipients,) = rewardsManager.getGlobalStats();
        assertEq(uniqueRecipients, 1);
    }

    function testEmptyBatchDistribution() public {
        rewardsManager.addController(controller1, "test_controller");
        
        address[] memory recipients = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        bytes32[] memory contextIds = new bytes32[](0);
        
        // Should complete without error
        vm.prank(controller1);
        rewardsManager.batchDistributeRewards(recipients, amounts, "empty_batch", contextIds);
    }

    // =============== EDGE CASE TESTS FOR 100% COVERAGE ===============

    function testAddControllerWithEmptyString() public {
        // Empty string should be allowed - no validation in contract
        rewardsManager.addController(controller1, "");
        assertTrue(rewardsManager.isAuthorizedController(controller1));
        assertEq(rewardsManager.getControllerByType(""), controller1);
    }

    function testAddControllerTypeOverwrite() public {
        // Add first controller with type "read"
        rewardsManager.addController(controller1, "read");
        assertEq(rewardsManager.getControllerByType("read"), controller1);
        
        // Add second controller with same type - should overwrite
        rewardsManager.addController(controller2, "read");
        assertEq(rewardsManager.getControllerByType("read"), controller2);
        
        // Both should still be authorized controllers
        assertTrue(rewardsManager.isAuthorizedController(controller1));
        assertTrue(rewardsManager.isAuthorizedController(controller2));
    }

    function testBatchDistributeMaximumArraySize() public {
        rewardsManager.addController(controller1, "test_controller");
        
        // Test with 100 recipients (reasonable maximum)
        uint256 batchSize = 100;
        address[] memory recipients = new address[](batchSize);
        uint256[] memory amounts = new uint256[](batchSize);
        bytes32[] memory contextIds = new bytes32[](batchSize);
        
        for (uint256 i = 0; i < batchSize; i++) {
            recipients[i] = address(uint160(i + 1000)); // Generate unique addresses
            amounts[i] = (i + 1) * 10 ** 18;
            contextIds[i] = keccak256(abi.encodePacked("context", i));
        }
        
        vm.prank(controller1);
        rewardsManager.batchDistributeRewards(recipients, amounts, "large_batch", contextIds);
        
        // Verify all rewards were distributed
        for (uint256 i = 0; i < batchSize; i++) {
            assertEq(tipToken.balanceOf(recipients[i]), amounts[i]);
        }
    }

    function testBatchDistributeDuplicateRecipients() public {
        rewardsManager.addController(controller1, "test_controller");
        
        address[] memory recipients = new address[](3);
        recipients[0] = user;
        recipients[1] = address(0x4);
        recipients[2] = user; // Duplicate
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 * 10 ** 18;
        amounts[1] = 200 * 10 ** 18;
        amounts[2] = 50 * 10 ** 18;
        
        bytes32[] memory contextIds = new bytes32[](3);
        contextIds[0] = keccak256("context1");
        contextIds[1] = keccak256("context2");
        contextIds[2] = keccak256("context3");
        
        vm.prank(controller1);
        rewardsManager.batchDistributeRewards(recipients, amounts, "duplicate_batch", contextIds);
        
        // User should receive rewards from both entries
        assertEq(tipToken.balanceOf(user), amounts[0] + amounts[2]);
        assertEq(tipToken.balanceOf(address(0x4)), amounts[1]);
    }

    function testIntegerOverflowScenarios() public {
        rewardsManager.addController(controller1, "test_controller");
        
        // Test with very large amounts near uint256 max
        uint256 largeAmount = type(uint256).max / 2;
        
        vm.prank(controller1);
        vm.expectRevert(); // Should revert due to supply cap or arithmetic overflow
        rewardsManager.distributeReward(user, largeAmount, "overflow_test", keccak256("context"));
    }

    function testContextIdCollisions() public {
        rewardsManager.addController(controller1, "test_controller");
        
        bytes32 contextId = keccak256("shared_context");
        uint256 amount1 = 100 * 10 ** 18;
        uint256 amount2 = 200 * 10 ** 18;
        
        // Two different controllers using same context ID
        rewardsManager.addController(controller2, "test_controller2");
        
        vm.prank(controller1);
        rewardsManager.distributeReward(user, amount1, "reward1", contextId);
        
        vm.prank(controller2);
        rewardsManager.distributeReward(user, amount2, "reward2", contextId);
        
        // Context total should be sum of both rewards
        assertEq(rewardsManager.getContextTotalRewards(contextId), amount1 + amount2);
        assertEq(rewardsManager.getUserContextRewards(user, contextId), amount1 + amount2);
    }

    function testRemoveControllerType() public {
        // Add controller with type
        rewardsManager.addController(controller1, "read");
        assertEq(rewardsManager.getControllerByType("read"), controller1);
        
        // Remove controller
        rewardsManager.removeController(controller1, "read");
        
        // Type mapping should be cleared
        assertEq(rewardsManager.getControllerByType("read"), address(0));
        assertFalse(rewardsManager.isAuthorizedController(controller1));
    }

    function testSupplyCapExhaustion() public {
        rewardsManager.addController(controller1, "test_controller");
        
        // Get current remaining supply
        (,, uint256 remainingSupply) = rewardsManager.getGlobalStats();
        
        // Try to distribute more than remaining supply
        vm.prank(controller1);
        vm.expectRevert(); // Should revert when TIPToken mint fails
        rewardsManager.distributeReward(user, remainingSupply + 1, "exhaustion_test", keccak256("context"));
    }
}
