// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TIPToken.sol";
import "../src/RewardsManager.sol";
import "../src/CreatorRewardsController.sol";
import "../src/ReadRewardsController.sol";
import "../src/RemixLicensingController.sol";

/**
 * @title Setup Contract Relationships Script
 * @dev Sets up all the contract relationships and permissions for the StoryHouse ecosystem
 */
contract SetupContractRelationships is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(
            string.concat("0x", privateKeyStr)
        );
        address deployer = vm.addr(deployerPrivateKey);

        // Get contract addresses from environment variables
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");
        address rewardsManagerAddress = vm.envAddress(
            "REWARDS_MANAGER_ADDRESS"
        );
        address creatorControllerAddress = vm.envAddress(
            "CREATOR_CONTROLLER_ADDRESS"
        );
        address readControllerAddress = vm.envAddress(
            "READ_CONTROLLER_ADDRESS"
        );
        address remixControllerAddress = vm.envAddress(
            "REMIX_CONTROLLER_ADDRESS"
        );

        console.log("=== Setting up StoryHouse Contract Relationships ===");
        console.log("Deployer address:", deployer);
        console.log("TIP Token:", tipTokenAddress);
        console.log("Rewards Manager:", rewardsManagerAddress);
        console.log("Creator Controller:", creatorControllerAddress);
        console.log("Read Controller:", readControllerAddress);
        console.log("Remix Controller:", remixControllerAddress);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Initialize contract instances
        TIPToken tipToken = TIPToken(tipTokenAddress);
        RewardsManager rewardsManager = RewardsManager(rewardsManagerAddress);

        // Step 1: Grant RewardsManager minter role on TIP Token
        console.log("Step 1: Setting up TIP Token permissions...");
        try tipToken.addMinter(rewardsManagerAddress) {
            console.log("Added RewardsManager as TIP token minter");
        } catch {
            console.log("RewardsManager already a minter or failed to add");
        }

        // Step 2: Add controllers to RewardsManager
        console.log("Step 2: Adding controllers to RewardsManager...");

        try rewardsManager.addController(creatorControllerAddress, "creator") {
            console.log("Added Creator Rewards Controller");
        } catch {
            console.log("Creator Controller already added or failed");
        }

        try rewardsManager.addController(readControllerAddress, "read") {
            console.log("Added Read Rewards Controller");
        } catch {
            console.log("Read Controller already added or failed");
        }

        try rewardsManager.addController(remixControllerAddress, "remix") {
            console.log("Added Remix Licensing Controller");
        } catch {
            console.log("Remix Controller already added or failed");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== Verification ===");

        // Verify permissions
        console.log("Verifying TIP Token minter status:");
        console.log(
            "  RewardsManager is minter:",
            tipToken.isMinter(rewardsManagerAddress)
        );

        console.log("Verifying RewardsManager controllers:");
        console.log(
            "  Creator Controller authorized:",
            rewardsManager.authorizedControllers(creatorControllerAddress)
        );
        console.log(
            "  Read Controller authorized:",
            rewardsManager.authorizedControllers(readControllerAddress)
        );
        console.log(
            "  Remix Controller authorized:",
            rewardsManager.authorizedControllers(remixControllerAddress)
        );

        console.log("");
        console.log("Contract relationships setup completed!");
        console.log("Summary:");
        console.log("   - RewardsManager can mint TIP tokens");
        console.log(
            "   - All 3 controllers are authorized with RewardsManager"
        );
        console.log("   - Ecosystem ready for reward distribution");
    }
}
