// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/HybridRevenueControllerV2.sol";

/**
 * @title Deploy HybridRevenueControllerV2 at NEW Address
 * @dev Forces deployment to a new address by deploying a dummy contract first
 */
contract DeployMinimalV2New is Script {
    // Known contract addresses on Story Protocol Aeneid Testnet
    address constant TIP_TOKEN = 0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E;
    address constant CHAPTER_ACCESS_CONTROLLER = 0x1BD65ad10B1CA3ED67aE75FCdD3abA256a9918e3;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== StoryHouse NEW HybridRevenueControllerV2 Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Network: Story Protocol Aeneid Testnet");
        console.log("");
        
        console.log("Existing contracts:");
        console.log("TIP Token:", TIP_TOKEN);
        console.log("Chapter Access Controller:", CHAPTER_ACCESS_CONTROLLER);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy a dummy contract first to increment nonce
        console.log("Deploying dummy contract to increment nonce...");
        new DummyContract();
        console.log("[OK] Nonce incremented");
        
        // Now deploy HybridRevenueControllerV2 at a new address
        console.log("Deploying HybridRevenueControllerV2 (Full Version)...");
        HybridRevenueControllerV2 hybridV2 = new HybridRevenueControllerV2(
            deployer,
            TIP_TOKEN
        );
        
        address hybridV2Address = address(hybridV2);
        console.log("[OK] HybridRevenueControllerV2 deployed at:", hybridV2Address);
        console.log("     This is a NEW address, different from the Standalone version");
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("");
        console.log("================================================================================");
        console.log("                              DEPLOYMENT SUMMARY                               ");
        console.log("================================================================================");
        console.log("OLD Standalone Address:         ", "0x9c6a3c50e5d77f99d805d8d7c935acb23208fd9f");
        console.log("NEW V2 Full Address:            ", hybridV2Address);
        console.log("TIP Token:                      ", TIP_TOKEN);
        console.log("Chapter Access Controller:      ", CHAPTER_ACCESS_CONTROLLER);
        console.log("================================================================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update frontend/backend configuration with NEW V2 address");
        console.log("2. Test book registration through frontend");
        console.log("3. Verify revenue distribution works correctly");
    }
}

// Dummy contract just to increment nonce
contract DummyContract {
    uint256 public value = 1;
}