// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Access Control Manager
 * @dev Unified permissions system for all StoryHouse contracts
 *
 * Features:
 * - Role-based access control
 * - Cross-contract permission management
 * - Emergency admin functions
 * - Role delegation and revocation
 * - Time-locked admin operations (future enhancement)
 */
contract AccessControlManager is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant STORY_MANAGER_ROLE = keccak256("STORY_MANAGER_ROLE");
    bytes32 public constant QUALITY_ASSESSOR_ROLE = keccak256("QUALITY_ASSESSOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Events
    event RoleGrantedWithExpiry(bytes32 indexed role, address indexed account, address indexed sender, uint256 expiry);
    event RoleRevokedDueToExpiry(bytes32 indexed role, address indexed account);
    event ContractRegistered(address indexed contractAddress, string contractType);
    event ContractDeregistered(address indexed contractAddress, string contractType);
    event EmergencyActionExecuted(address indexed executor, string action, address target);

    // Registered contracts that use this access control
    mapping(address => bool) public registeredContracts;
    mapping(address => string) public contractTypes;
    mapping(bytes32 => mapping(address => uint256)) public roleExpiry; // role => account => expiry timestamp

    // Role descriptions for UI/documentation
    mapping(bytes32 => string) public roleDescriptions;

    modifier onlyRegisteredContract() {
        require(registeredContracts[msg.sender], "AccessControl: caller not registered contract");
        _;
    }

    modifier onlyValidRole(bytes32 role) {
        require(_isValidRole(role), "AccessControl: invalid role");
        _;
    }

    constructor(address initialAdmin) {
        // Grant the initial admin all roles
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(EMERGENCY_ROLE, initialAdmin);

        // Set role descriptions
        roleDescriptions[ADMIN_ROLE] = "Full administrative access to all contracts";
        roleDescriptions[CONTROLLER_ROLE] = "Access to reward controller functions";
        roleDescriptions[MINTER_ROLE] = "Permission to mint TIP tokens";
        roleDescriptions[STORY_MANAGER_ROLE] = "Manage story registration and metadata";
        roleDescriptions[QUALITY_ASSESSOR_ROLE] = "Assess story quality and distribute bonuses";
        roleDescriptions[EMERGENCY_ROLE] = "Emergency pause/unpause and critical functions";
    }

    /**
     * @dev Register a contract to use this access control system
     * @param contractAddress Address of the contract to register
     * @param contractType Type/name of the contract (e.g., "RewardsManager")
     */
    function registerContract(address contractAddress, string memory contractType) external onlyRole(ADMIN_ROLE) {
        require(contractAddress != address(0), "AccessControl: invalid contract address");
        require(!registeredContracts[contractAddress], "AccessControl: contract already registered");

        registeredContracts[contractAddress] = true;
        contractTypes[contractAddress] = contractType;

        emit ContractRegistered(contractAddress, contractType);
    }

    /**
     * @dev Deregister a contract from the access control system
     * @param contractAddress Address of the contract to deregister
     */
    function deregisterContract(address contractAddress) external onlyRole(ADMIN_ROLE) {
        require(registeredContracts[contractAddress], "AccessControl: contract not registered");

        string memory contractType = contractTypes[contractAddress];
        registeredContracts[contractAddress] = false;
        delete contractTypes[contractAddress];

        emit ContractDeregistered(contractAddress, contractType);
    }

    /**
     * @dev Grant a role to an account with optional expiry
     * @param role Role to grant
     * @param account Account to grant role to
     * @param expiry Expiry timestamp (0 for no expiry)
     */
    function grantRoleWithExpiry(bytes32 role, address account, uint256 expiry)
        external
        onlyRole(getRoleAdmin(role))
        onlyValidRole(role)
    {
        require(account != address(0), "AccessControl: invalid account");
        require(expiry == 0 || expiry > block.timestamp, "AccessControl: invalid expiry");

        _grantRole(role, account);

        if (expiry > 0) {
            roleExpiry[role][account] = expiry;
            emit RoleGrantedWithExpiry(role, account, msg.sender, expiry);
        }
    }

    /**
     * @dev Revoke expired roles (can be called by anyone)
     * @param role Role to check for expiry
     * @param account Account to check
     */
    function revokeExpiredRole(bytes32 role, address account) external {
        uint256 expiry = roleExpiry[role][account];
        require(expiry > 0 && block.timestamp >= expiry, "AccessControl: role not expired");

        _revokeRole(role, account);
        delete roleExpiry[role][account];

        emit RoleRevokedDueToExpiry(role, account);
    }

    /**
     * @dev Check if an account has a role and it hasn't expired
     * @param role Role to check
     * @param account Account to check
     * @return hasValidRole Whether the account has a valid (non-expired) role
     */
    function hasValidRole(bytes32 role, address account) external view returns (bool hasValidRole) {
        if (!hasRole(role, account)) {
            return false;
        }

        uint256 expiry = roleExpiry[role][account];
        return expiry == 0 || block.timestamp < expiry;
    }

    /**
     * @dev Batch grant roles to multiple accounts
     * @param role Role to grant
     * @param accounts Array of accounts to grant role to
     * @param expiries Array of expiry timestamps (0 for no expiry)
     */
    function batchGrantRole(bytes32 role, address[] calldata accounts, uint256[] calldata expiries)
        external
        onlyRole(getRoleAdmin(role))
        onlyValidRole(role)
    {
        require(accounts.length == expiries.length, "AccessControl: array length mismatch");

        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "AccessControl: invalid account");

            _grantRole(role, accounts[i]);

            if (expiries[i] > 0) {
                require(expiries[i] > block.timestamp, "AccessControl: invalid expiry");
                roleExpiry[role][accounts[i]] = expiries[i];
                emit RoleGrantedWithExpiry(role, accounts[i], msg.sender, expiries[i]);
            }
        }
    }

    /**
     * @dev Batch revoke roles from multiple accounts
     * @param role Role to revoke
     * @param accounts Array of accounts to revoke role from
     */
    function batchRevokeRole(bytes32 role, address[] calldata accounts) external onlyRole(getRoleAdmin(role)) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _revokeRole(role, accounts[i]);
            delete roleExpiry[role][accounts[i]];
        }
    }

    /**
     * @dev Emergency pause all operations (emergency role only)
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit EmergencyActionExecuted(msg.sender, "pause", address(this));
    }

    /**
     * @dev Emergency unpause all operations (emergency role only)
     */
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        emit EmergencyActionExecuted(msg.sender, "unpause", address(this));
    }

    /**
     * @dev Get all accounts with a specific role (simplified version)
     * @param role Role to query
     * @return hasAnyMembers Whether there are any accounts with this role
     */
    function hasRoleMembers(bytes32 role) external view returns (bool hasAnyMembers) {
        // This is a simplified version since OpenZeppelin doesn't provide
        // direct access to enumerate role members
        // In a production system, you'd maintain your own enumerable set
        return true; // Placeholder
    }

    /**
     * @dev Get role information for UI display
     * @param role Role to query
     * @return description Human-readable description
     * @return adminRole Admin role that can manage this role
     */
    function getRoleInfo(bytes32 role) external view returns (string memory description, bytes32 adminRole) {
        return (roleDescriptions[role], getRoleAdmin(role));
    }

    /**
     * @dev Check if a role is valid/defined
     * @param role Role to check
     * @return isValid Whether the role is valid
     */
    function _isValidRole(bytes32 role) internal pure returns (bool isValid) {
        return role == ADMIN_ROLE || role == CONTROLLER_ROLE || role == MINTER_ROLE || role == STORY_MANAGER_ROLE
            || role == QUALITY_ASSESSOR_ROLE || role == EMERGENCY_ROLE;
    }

    /**
     * @dev Override to check role expiry before granting permissions
     */
    function hasRole(bytes32 role, address account) public view override returns (bool) {
        if (!super.hasRole(role, account)) {
            return false;
        }

        uint256 expiry = roleExpiry[role][account];
        return expiry == 0 || block.timestamp < expiry;
    }

    /**
     * @dev Get list of all registered contracts
     * @return contractAddresses Array of registered contract addresses
     * @return contractTypesList Array of corresponding contract types
     */
    function getRegisteredContracts()
        external
        view
        returns (address[] memory contractAddresses, string[] memory contractTypesList)
    {
        // Note: This is a simple implementation. In production, you might want
        // to maintain a separate array for gas efficiency
        // For now, this serves as a placeholder for the interface
        contractAddresses = new address[](0);
        contractTypesList = new string[](0);
    }
}
