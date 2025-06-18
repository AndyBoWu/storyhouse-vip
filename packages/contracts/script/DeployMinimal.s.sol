// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/HybridRevenueControllerV2Standalone.sol";

/**
 * @title Deploy Minimal Architecture Script
 * @dev Deploys only the essential contracts without rewards system
 *
 * Architecture:
 * ├── TIPToken - Platform token (already deployed)
 * ├── ChapterAccessController - Chapter monetization (already deployed)
 * └── HybridRevenueControllerV2 - Permissionless revenue sharing (NEW)
 */
contract DeployMinimal is Script {
    // Known contract addresses on Story Protocol Aeneid Testnet
    address constant TIP_TOKEN = 0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E;
    address constant CHAPTER_ACCESS_CONTROLLER = 0x1BD65ad10B1CA3ED67aE75FCdD3abA256a9918e3;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== StoryHouse Minimal Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Network: Story Protocol Aeneid Testnet");
        console.log("");
        
        console.log("Existing contracts:");
        console.log("TIP Token:", TIP_TOKEN);
        console.log("Chapter Access Controller:", CHAPTER_ACCESS_CONTROLLER);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy HybridRevenueControllerV2
        console.log("Deploying HybridRevenueControllerV2...");
        HybridRevenueControllerV2Standalone hybridV2 = new HybridRevenueControllerV2Standalone(
            deployer,
            TIP_TOKEN
        );
        
        address hybridV2Address = address(hybridV2);
        console.log("[OK] HybridRevenueControllerV2 deployed at:", hybridV2Address);
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("");
        console.log("================================================================================");
        console.log("                              DEPLOYMENT SUMMARY                               ");
        console.log("================================================================================");
        console.log("TIP Token:                      ", TIP_TOKEN);
        console.log("Chapter Access Controller:      ", CHAPTER_ACCESS_CONTROLLER);
        console.log("Hybrid Revenue Controller V2:   ", hybridV2Address);
        console.log("================================================================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update frontend/backend configuration with new V2 address");
        console.log("2. Test book registration through frontend");
        console.log("3. Verify revenue distribution works correctly");
    }
}