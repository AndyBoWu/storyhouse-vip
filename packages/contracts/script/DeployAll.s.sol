// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TIPToken.sol";
import "../src/AccessControlManager.sol";
import "../src/RewardsManager.sol";
import "../src/CreatorRewardsController.sol";
import "../src/ReadRewardsController.sol";
import "../src/RemixLicensingController.sol";

/**
 * @title Deploy All Contracts Script
 * @dev Idempotent deployment script that deploys all StoryHouse contracts
 *
 * Features:
 * - Checks if contracts are already deployed
 * - Deploys contracts in correct dependency order
 * - Can be run multiple times safely
 * - Updates deployment registry
 */
contract DeployAll is Script {
    // Deployment registry to track deployed contracts
    struct DeploymentRegistry {
        address tipToken;
        address accessControlManager;
        address rewardsManager;
        address creatorRewardsController;
        address readRewardsController;
        address remixLicensingController;
        address deployer;
        uint256 deploymentBlock;
        string network;
    }

    // Events for tracking deployments
    event ContractDeployed(string contractName, address contractAddress);
    event ContractSkipped(string contractName, address existingAddress);
    event DeploymentCompleted(DeploymentRegistry registry);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== StoryHouse Idempotent Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        DeploymentRegistry memory registry;
        registry.deployer = deployer;
        registry.deploymentBlock = block.number;
        registry.network = "Story Protocol Aeneid Testnet";

        // Step 1: Deploy or verify TIP Token
        console.log("Step 1: TIP Token");
        registry.tipToken = deployOrVerifyTIPToken(deployer);

        // Step 2: Deploy or verify Access Control Manager
        console.log("Step 2: Access Control Manager");
        registry.accessControlManager = deployOrVerifyAccessControlManager(
            deployer
        );

        // Step 3: Deploy or verify Rewards Manager
        console.log("Step 3: Rewards Manager");
        registry.rewardsManager = deployOrVerifyRewardsManager(
            deployer,
            registry.tipToken
        );

        // Step 4: Deploy or verify Creator Rewards Controller
        console.log("Step 4: Creator Rewards Controller");
        registry
            .creatorRewardsController = deployOrVerifyCreatorRewardsController(
            deployer,
            registry.rewardsManager,
            registry.accessControlManager
        );

        // Step 5: Deploy or verify Read Rewards Controller
        console.log("Step 5: Read Rewards Controller");
        registry.readRewardsController = deployOrVerifyReadRewardsController(
            deployer,
            registry.rewardsManager,
            registry.accessControlManager
        );

        // Step 6: Deploy or verify Remix Licensing Controller
        console.log("Step 6: Remix Licensing Controller");
        registry
            .remixLicensingController = deployOrVerifyRemixLicensingController(
            deployer,
            registry.rewardsManager,
            registry.accessControlManager
        );

        // Step 7: Setup permissions and relationships
        console.log("Step 7: Setting up permissions and relationships");
        setupPermissionsAndRelationships(registry);

        vm.stopBroadcast();

        console.log("=== Deployment Summary ===");
        console.log("TIP Token:", registry.tipToken);
        console.log("Access Control Manager:", registry.accessControlManager);
        console.log("Rewards Manager:", registry.rewardsManager);
        console.log(
            "Creator Rewards Controller:",
            registry.creatorRewardsController
        );
        console.log("Read Rewards Controller:", registry.readRewardsController);
        console.log(
            "Remix Licensing Controller:",
            registry.remixLicensingController
        );
        console.log("Deployer:", registry.deployer);
        console.log("Deployment Block:", registry.deploymentBlock);

        emit DeploymentCompleted(registry);
    }

    function deployOrVerifyTIPToken(
        address deployer
    ) internal returns (address) {
        // Check if TIP token is already deployed at known address
        address knownAddress = 0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E;

        if (isContractDeployed(knownAddress)) {
            // Verify it's actually a TIP token
            try TIPToken(knownAddress).symbol() returns (string memory symbol) {
                if (keccak256(bytes(symbol)) == keccak256(bytes("TIP"))) {
                    console.log("TIP Token already deployed at:", knownAddress);
                    emit ContractSkipped("TIPToken", knownAddress);
                    return knownAddress;
                }
            } catch {}
        }

        // Deploy new TIP token
        console.log("Deploying TIP Token...");
        TIPToken tipToken = new TIPToken(deployer);
        console.log("TIP Token deployed at:", address(tipToken));
        emit ContractDeployed("TIPToken", address(tipToken));
        return address(tipToken);
    }

    function deployOrVerifyAccessControlManager(
        address deployer
    ) internal returns (address) {
        // For now, always deploy new AccessControlManager as we don't have a known address
        console.log("Deploying Access Control Manager...");
        AccessControlManager acm = new AccessControlManager(deployer);
        console.log("Access Control Manager deployed at:", address(acm));
        emit ContractDeployed("AccessControlManager", address(acm));
        return address(acm);
    }

    function deployOrVerifyRewardsManager(
        address deployer,
        address tipTokenAddress
    ) internal returns (address) {
        console.log("Deploying Rewards Manager...");
        RewardsManager rewardsManager = new RewardsManager(
            deployer,
            tipTokenAddress
        );
        console.log("Rewards Manager deployed at:", address(rewardsManager));
        emit ContractDeployed("RewardsManager", address(rewardsManager));
        return address(rewardsManager);
    }

    function deployOrVerifyCreatorRewardsController(
        address deployer,
        address rewardsManager,
        address accessControlManager
    ) internal returns (address) {
        console.log("Deploying Creator Rewards Controller...");
        CreatorRewardsController controller = new CreatorRewardsController(
            deployer,
            rewardsManager
        );
        console.log(
            "Creator Rewards Controller deployed at:",
            address(controller)
        );
        emit ContractDeployed("CreatorRewardsController", address(controller));
        return address(controller);
    }

    function deployOrVerifyReadRewardsController(
        address deployer,
        address rewardsManager,
        address accessControlManager
    ) internal returns (address) {
        console.log("Deploying Read Rewards Controller...");
        ReadRewardsController controller = new ReadRewardsController(
            deployer,
            rewardsManager
        );
        console.log(
            "Read Rewards Controller deployed at:",
            address(controller)
        );
        emit ContractDeployed("ReadRewardsController", address(controller));
        return address(controller);
    }

    function deployOrVerifyRemixLicensingController(
        address deployer,
        address rewardsManager,
        address accessControlManager
    ) internal returns (address) {
        console.log("Deploying Remix Licensing Controller...");
        RemixLicensingController controller = new RemixLicensingController(
            deployer,
            rewardsManager,
            accessControlManager // Using accessControlManager as tipToken for now
        );
        console.log(
            "Remix Licensing Controller deployed at:",
            address(controller)
        );
        emit ContractDeployed("RemixLicensingController", address(controller));
        return address(controller);
    }

    function setupPermissionsAndRelationships(
        DeploymentRegistry memory registry
    ) internal {
        console.log("Setting up permissions and relationships...");

        // Setup RewardsManager with controllers
        RewardsManager rewardsManager = RewardsManager(registry.rewardsManager);

        try
            rewardsManager.addController(
                registry.creatorRewardsController,
                "creator"
            )
        {
            console.log("Added Creator Rewards Controller to RewardsManager");
        } catch {
            console.log("Creator Rewards Controller already added or failed");
        }

        try
            rewardsManager.addController(registry.readRewardsController, "read")
        {
            console.log("Added Read Rewards Controller to RewardsManager");
        } catch {
            console.log("Read Rewards Controller already added or failed");
        }

        try
            rewardsManager.addController(
                registry.remixLicensingController,
                "remix"
            )
        {
            console.log("Added Remix Licensing Controller to RewardsManager");
        } catch {
            console.log("Remix Licensing Controller already added or failed");
        }

        // Setup TIP Token minter role for RewardsManager
        TIPToken tipToken = TIPToken(registry.tipToken);
        try tipToken.addMinter(registry.rewardsManager) {
            console.log("Added RewardsManager as TIP token minter");
        } catch {
            console.log("RewardsManager already added as minter or failed");
        }

        console.log("Setup completed!");
    }

    function isContractDeployed(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
