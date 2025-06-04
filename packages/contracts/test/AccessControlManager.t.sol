// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AccessControlManager.sol";

contract AccessControlManagerTest is Test {
    AccessControlManager public accessControl;
    address public admin;
    address public user1;
    address public user2;
    address public testContract;

    event RoleGrantedWithExpiry(bytes32 indexed role, address indexed account, address indexed sender, uint256 expiry);
    event RoleRevokedDueToExpiry(bytes32 indexed role, address indexed account);
    event ContractRegistered(address indexed contractAddress, string contractType);
    event ContractDeregistered(address indexed contractAddress, string contractType);
    event EmergencyActionExecuted(address indexed executor, string action, address target);

    function setUp() public {
        admin = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        testContract = address(0x999);

        accessControl = new AccessControlManager(admin);
    }

    function testInitialState() public {
        assertTrue(accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(accessControl.hasRole(accessControl.ADMIN_ROLE(), admin));
        assertTrue(accessControl.hasRole(accessControl.EMERGENCY_ROLE(), admin));
        assertFalse(accessControl.paused());
    }

    function testRoleConstants() public {
        assertEq(accessControl.ADMIN_ROLE(), keccak256("ADMIN_ROLE"));
        assertEq(accessControl.CONTROLLER_ROLE(), keccak256("CONTROLLER_ROLE"));
        assertEq(accessControl.MINTER_ROLE(), keccak256("MINTER_ROLE"));
        assertEq(accessControl.STORY_MANAGER_ROLE(), keccak256("STORY_MANAGER_ROLE"));
        assertEq(accessControl.QUALITY_ASSESSOR_ROLE(), keccak256("QUALITY_ASSESSOR_ROLE"));
        assertEq(accessControl.EMERGENCY_ROLE(), keccak256("EMERGENCY_ROLE"));
    }

    function testGrantRole() public {
        bytes32 role = accessControl.MINTER_ROLE();

        assertFalse(accessControl.hasRole(role, user1));

        accessControl.grantRole(role, user1);
        assertTrue(accessControl.hasRole(role, user1));
    }

    function testGrantRoleWithExpiry() public {
        bytes32 role = accessControl.MINTER_ROLE();
        uint256 expiry = block.timestamp + 3600; // 1 hour from now

        vm.expectEmit(true, true, true, true);
        emit RoleGrantedWithExpiry(role, user1, admin, expiry);

        accessControl.grantRoleWithExpiry(role, user1, expiry);
        assertTrue(accessControl.hasValidRole(role, user1));
    }

    function testRoleExpiry() public {
        bytes32 role = accessControl.MINTER_ROLE();
        uint256 expiry = block.timestamp + 3600;

        accessControl.grantRoleWithExpiry(role, user1, expiry);
        assertTrue(accessControl.hasValidRole(role, user1));

        // Fast forward past expiry
        vm.warp(expiry + 1);
        assertFalse(accessControl.hasValidRole(role, user1));

        // Anyone can revoke expired role
        vm.prank(user2);
        vm.expectEmit(true, true, false, false);
        emit RoleRevokedDueToExpiry(role, user1);

        accessControl.revokeExpiredRole(role, user1);
        // After revocation, hasValidRole should return false (which is the important check)
        assertFalse(accessControl.hasValidRole(role, user1));
    }

    function testBatchGrantRole() public {
        bytes32 role = accessControl.CONTROLLER_ROLE();
        address[] memory accounts = new address[](2);
        accounts[0] = user1;
        accounts[1] = user2;

        uint256[] memory expiries = new uint256[](2);
        expiries[0] = 0; // No expiry
        expiries[1] = block.timestamp + 3600; // 1 hour

        accessControl.batchGrantRole(role, accounts, expiries);

        assertTrue(accessControl.hasRole(role, user1));
        assertTrue(accessControl.hasRole(role, user2));
        assertTrue(accessControl.hasValidRole(role, user1));
        assertTrue(accessControl.hasValidRole(role, user2));
    }

    function testBatchRevokeRole() public {
        bytes32 role = accessControl.CONTROLLER_ROLE();
        address[] memory accounts = new address[](2);
        accounts[0] = user1;
        accounts[1] = user2;

        uint256[] memory expiries = new uint256[](2);
        expiries[0] = 0;
        expiries[1] = 0;

        // Grant roles first
        accessControl.batchGrantRole(role, accounts, expiries);
        assertTrue(accessControl.hasRole(role, user1));
        assertTrue(accessControl.hasRole(role, user2));

        // Revoke roles
        accessControl.batchRevokeRole(role, accounts);
        assertFalse(accessControl.hasRole(role, user1));
        assertFalse(accessControl.hasRole(role, user2));
    }

    function testRegisterContract() public {
        string memory contractType = "TestContract";

        assertFalse(accessControl.registeredContracts(testContract));

        vm.expectEmit(true, false, false, true);
        emit ContractRegistered(testContract, contractType);

        accessControl.registerContract(testContract, contractType);

        assertTrue(accessControl.registeredContracts(testContract));
        assertEq(accessControl.contractTypes(testContract), contractType);
    }

    function testDeregisterContract() public {
        string memory contractType = "TestContract";

        // Register first
        accessControl.registerContract(testContract, contractType);
        assertTrue(accessControl.registeredContracts(testContract));

        vm.expectEmit(true, false, false, true);
        emit ContractDeregistered(testContract, contractType);

        accessControl.deregisterContract(testContract);

        assertFalse(accessControl.registeredContracts(testContract));
        assertEq(accessControl.contractTypes(testContract), "");
    }

    function testRegisterContractOnlyAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        accessControl.registerContract(testContract, "TestContract");
    }

    function testRegisterContractZeroAddress() public {
        vm.expectRevert("AccessControl: invalid contract address");
        accessControl.registerContract(address(0), "TestContract");
    }

    function testRegisterContractAlreadyRegistered() public {
        accessControl.registerContract(testContract, "TestContract");

        vm.expectRevert("AccessControl: contract already registered");
        accessControl.registerContract(testContract, "TestContract");
    }

    function testEmergencyPause() public {
        assertFalse(accessControl.paused());

        vm.expectEmit(true, false, false, true);
        emit EmergencyActionExecuted(admin, "pause", address(accessControl));

        accessControl.emergencyPause();
        assertTrue(accessControl.paused());
    }

    function testEmergencyUnpause() public {
        accessControl.emergencyPause();
        assertTrue(accessControl.paused());

        vm.expectEmit(true, false, false, true);
        emit EmergencyActionExecuted(admin, "unpause", address(accessControl));

        accessControl.emergencyUnpause();
        assertFalse(accessControl.paused());
    }

    function testEmergencyPauseOnlyEmergencyRole() public {
        vm.prank(user1);
        vm.expectRevert();
        accessControl.emergencyPause();
    }

    function testGetRoleInfo() public {
        bytes32 role = accessControl.ADMIN_ROLE();
        (string memory description, bytes32 adminRole) = accessControl.getRoleInfo(role);

        assertEq(description, "Full administrative access to all contracts");
        assertEq(adminRole, accessControl.DEFAULT_ADMIN_ROLE());
    }

    function testInvalidRoleValidation() public {
        bytes32 invalidRole = keccak256("INVALID_ROLE");

        vm.expectRevert("AccessControl: invalid role");
        accessControl.grantRoleWithExpiry(invalidRole, user1, 0);
    }

    function testGrantRoleWithInvalidExpiry() public {
        bytes32 role = accessControl.MINTER_ROLE();
        uint256 pastExpiry = 100; // Very early timestamp

        vm.expectRevert("AccessControl: invalid expiry");
        accessControl.grantRoleWithExpiry(role, user1, pastExpiry);
    }

    function testBatchGrantRoleArrayMismatch() public {
        bytes32 role = accessControl.CONTROLLER_ROLE();
        address[] memory accounts = new address[](2);
        accounts[0] = user1;
        accounts[1] = user2;

        uint256[] memory expiries = new uint256[](1); // Wrong length
        expiries[0] = 0;

        vm.expectRevert("AccessControl: array length mismatch");
        accessControl.batchGrantRole(role, accounts, expiries);
    }

    function testCannotRevokeNonExpiredRole() public {
        bytes32 role = accessControl.MINTER_ROLE();
        uint256 expiry = block.timestamp + 1000;

        accessControl.grantRoleWithExpiry(role, user1, expiry);

        vm.expectRevert("AccessControl: role not expired");
        accessControl.revokeExpiredRole(role, user1);
    }
}
