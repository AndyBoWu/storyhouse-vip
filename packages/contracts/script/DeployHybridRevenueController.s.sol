// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HybridRevenueController.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

/**
 * @title Deploy Hybrid Revenue Controller
 * @dev Deployment script for Phase 3: Revenue Sharing System
 */
contract DeployHybridRevenueController is Script {
    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying HybridRevenueController with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Load existing contract addresses from deployments.json
        // For now, we'll use placeholder addresses - in real deployment these would be loaded
        address tipTokenAddress = vm.envOr("TIP_TOKEN_ADDRESS", address(0));
        address rewardsManagerAddress = vm.envOr("REWARDS_MANAGER_ADDRESS", address(0));
        
        require(tipTokenAddress != address(0), "TIP_TOKEN_ADDRESS not set");
        require(rewardsManagerAddress != address(0), "REWARDS_MANAGER_ADDRESS not set");
        
        console.log("Using TIP Token at:", tipTokenAddress);
        console.log("Using RewardsManager at:", rewardsManagerAddress);
        
        // Deploy HybridRevenueController
        HybridRevenueController hybridRevenue = new HybridRevenueController(
            deployer, // initial owner
            rewardsManagerAddress,
            tipTokenAddress
        );
        
        console.log("HybridRevenueController deployed at:", address(hybridRevenue));
        
        // Add HybridRevenueController as authorized controller to RewardsManager
        RewardsManager rewardsManager = RewardsManager(rewardsManagerAddress);
        
        try rewardsManager.addController(address(hybridRevenue), "hybrid") {
            console.log("Added HybridRevenueController as authorized controller");
        } catch {
            console.log("Could not add controller - may need manual addition by RewardsManager owner");
        }
        
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("HybridRevenueController:", address(hybridRevenue));
        console.log("Owner:", deployer);
        console.log("RewardsManager:", rewardsManagerAddress);
        console.log("TIPToken:", tipTokenAddress);
        console.log("Default Revenue Shares:");
        console.log("  Author: 70%");
        console.log("  Curator: 20%");
        console.log("  Platform: 10%");
        
        // Save deployment info to file (in practice this would update deployments.json)
        string memory deploymentInfo = string(abi.encodePacked(
            "HybridRevenueController=", vm.toString(address(hybridRevenue)), "\n",
            "TIPToken=", vm.toString(tipTokenAddress), "\n",
            "RewardsManager=", vm.toString(rewardsManagerAddress), "\n"
        ));
        
        vm.writeFile("deployments-hybrid.txt", deploymentInfo);
        console.log("Deployment info saved to deployments-hybrid.txt");
    }
    
    /**
     * @dev Deploy complete system for testing (when other contracts not deployed)
     */
    function deployComplete() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying complete system with deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy TIP Token
        TIPToken tipToken = new TIPToken(deployer);
        console.log("TIP Token deployed at:", address(tipToken));
        
        // Deploy RewardsManager
        RewardsManager rewardsManager = new RewardsManager(deployer, address(tipToken));
        console.log("RewardsManager deployed at:", address(rewardsManager));
        
        // Deploy HybridRevenueController
        HybridRevenueController hybridRevenue = new HybridRevenueController(
            deployer,
            address(rewardsManager),
            address(tipToken)
        );
        console.log("HybridRevenueController deployed at:", address(hybridRevenue));
        
        // Setup permissions
        rewardsManager.addController(address(hybridRevenue), "hybrid");
        console.log("Added HybridRevenueController as authorized controller");
        
        vm.stopBroadcast();
        
        console.log("\n=== COMPLETE SYSTEM DEPLOYED ===");
        console.log("TIPToken:", address(tipToken));
        console.log("RewardsManager:", address(rewardsManager));
        console.log("HybridRevenueController:", address(hybridRevenue));
    }
}