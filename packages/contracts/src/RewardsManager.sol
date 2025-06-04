// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TIPToken.sol";

/**
 * @title Rewards Manager
 * @dev Central hub for managing all types of rewards in the StoryHouse ecosystem
 *
 * This contract:
 * - Orchestrates reward distribution between different controllers
 * - Maintains reward history and statistics
 * - Prevents double-claiming across different reward types
 * - Provides unified reward querying interface
 */
contract RewardsManager is Ownable, Pausable, ReentrancyGuard {
    // Events
    event ControllerAdded(address indexed controller, string controllerType);
    event ControllerRemoved(address indexed controller, string controllerType);
    event RewardDistributed(
        address indexed recipient,
        uint256 amount,
        string rewardType,
        bytes32 indexed contextId,
        address indexed controller
    );

    // State variables
    TIPToken public tipToken;

    // Authorized reward controllers
    mapping(address => bool) public authorizedControllers;
    mapping(string => address) public controllersByType; // "read", "creator", "remix"

    // Reward tracking
    mapping(address => uint256) public totalRewardsEarned;
    mapping(bytes32 => uint256) public contextTotalRewards; // story/chapter/remix total rewards
    mapping(address => mapping(bytes32 => uint256)) public userContextRewards;

    // Global statistics
    uint256 public totalRewardsDistributed;
    uint256 public totalUniqueRecipients;
    mapping(address => bool) public hasReceivedRewards;

    modifier onlyAuthorizedController() {
        require(authorizedControllers[msg.sender], "RewardsManager: unauthorized controller");
        _;
    }

    constructor(address initialOwner, address _tipToken) Ownable(initialOwner) {
        tipToken = TIPToken(_tipToken);
    }

    /**
     * @dev Add an authorized reward controller
     * @param controller Address of the controller contract
     * @param controllerType Type identifier ("read", "creator", "remix")
     */
    function addController(address controller, string memory controllerType) external onlyOwner {
        require(controller != address(0), "RewardsManager: zero address");
        require(!authorizedControllers[controller], "RewardsManager: already authorized");

        authorizedControllers[controller] = true;
        controllersByType[controllerType] = controller;

        emit ControllerAdded(controller, controllerType);
    }

    /**
     * @dev Remove an authorized reward controller
     * @param controller Address of the controller contract
     * @param controllerType Type identifier
     */
    function removeController(address controller, string memory controllerType) external onlyOwner {
        require(authorizedControllers[controller], "RewardsManager: not authorized");

        authorizedControllers[controller] = false;
        delete controllersByType[controllerType];

        emit ControllerRemoved(controller, controllerType);
    }

    /**
     * @dev Distribute rewards (called by authorized controllers)
     * @param recipient Address to receive rewards
     * @param amount Amount of TIP tokens to mint
     * @param rewardType Type of reward ("read", "creator", "remix")
     * @param contextId Unique identifier for the context (story/chapter/remix ID)
     */
    function distributeReward(address recipient, uint256 amount, string memory rewardType, bytes32 contextId)
        external
        onlyAuthorizedController
        whenNotPaused
        nonReentrant
    {
        require(recipient != address(0), "RewardsManager: zero address");
        require(amount > 0, "RewardsManager: zero amount");

        // Update tracking
        if (!hasReceivedRewards[recipient]) {
            hasReceivedRewards[recipient] = true;
            totalUniqueRecipients++;
        }

        totalRewardsEarned[recipient] += amount;
        contextTotalRewards[contextId] += amount;
        userContextRewards[recipient][contextId] += amount;
        totalRewardsDistributed += amount;

        // Mint tokens through TIP token contract
        tipToken.mint(recipient, amount);

        emit RewardDistributed(recipient, amount, rewardType, contextId, msg.sender);
    }

    /**
     * @dev Batch distribute rewards for gas efficiency
     */
    function batchDistributeRewards(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string memory rewardType,
        bytes32[] calldata contextIds
    ) external onlyAuthorizedController whenNotPaused nonReentrant {
        require(
            recipients.length == amounts.length && amounts.length == contextIds.length,
            "RewardsManager: array length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "RewardsManager: zero address");
            require(amounts[i] > 0, "RewardsManager: zero amount");

            // Update tracking
            if (!hasReceivedRewards[recipients[i]]) {
                hasReceivedRewards[recipients[i]] = true;
                totalUniqueRecipients++;
            }

            totalRewardsEarned[recipients[i]] += amounts[i];
            contextTotalRewards[contextIds[i]] += amounts[i];
            userContextRewards[recipients[i]][contextIds[i]] += amounts[i];
            totalRewardsDistributed += amounts[i];

            // Mint tokens
            tipToken.mint(recipients[i], amounts[i]);

            emit RewardDistributed(recipients[i], amounts[i], rewardType, contextIds[i], msg.sender);
        }
    }

    /**
     * @dev Pause reward distribution (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause reward distribution (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions for querying rewards

    /**
     * @dev Get total rewards earned by a user
     */
    function getUserTotalRewards(address user) external view returns (uint256) {
        return totalRewardsEarned[user];
    }

    /**
     * @dev Get user's rewards for a specific context (story/chapter/remix)
     */
    function getUserContextRewards(address user, bytes32 contextId) external view returns (uint256) {
        return userContextRewards[user][contextId];
    }

    /**
     * @dev Get total rewards distributed for a context
     */
    function getContextTotalRewards(bytes32 contextId) external view returns (uint256) {
        return contextTotalRewards[contextId];
    }

    /**
     * @dev Get global reward statistics
     */
    function getGlobalStats()
        external
        view
        returns (uint256 totalDistributed, uint256 uniqueRecipients, uint256 remainingSupply)
    {
        return (totalRewardsDistributed, totalUniqueRecipients, tipToken.remainingSupply());
    }

    /**
     * @dev Check if a controller is authorized
     */
    function isAuthorizedController(address controller) external view returns (bool) {
        return authorizedControllers[controller];
    }

    /**
     * @dev Get controller address by type
     */
    function getControllerByType(string memory controllerType) external view returns (address) {
        return controllersByType[controllerType];
    }
}
