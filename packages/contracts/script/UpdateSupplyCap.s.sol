// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TIPToken.sol";

contract UpdateSupplyCap is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");
        uint256 newCap = vm.envUint("NEW_SUPPLY_CAP"); // e.g., 100000000000000000000000000000 for 100B tokens
        
        console.log("Updating TIP Token Supply Cap...");
        console.log("TIP Token Address:", tipTokenAddress);
        console.log("New Cap:", newCap);
        
        vm.startBroadcast(deployerPrivateKey);
        
        TIPToken tipToken = TIPToken(tipTokenAddress);
        
        // Check current cap and total supply
        uint256 currentCap = tipToken.supplyCap();
        uint256 totalSupply = tipToken.totalSupply();
        
        console.log("Current Cap:", currentCap);
        console.log("Total Supply:", totalSupply);
        console.log("Current Remaining:", currentCap - totalSupply);
        
        // Update the cap
        tipToken.updateSupplyCap(newCap);
        
        vm.stopBroadcast();
        
        console.log("\n=== Supply Cap Updated ===");
        console.log("Old Cap:", currentCap / 1e18, "TIP");
        console.log("New Cap:", newCap / 1e18, "TIP");
        console.log("New Remaining:", (newCap - totalSupply) / 1e18, "TIP");
    }
    
    // Quick function to set cap to 100B tokens
    function setTestingCap() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");
        uint256 newCap = 100_000_000_000 * 1e18; // 100B tokens
        
        vm.startBroadcast(deployerPrivateKey);
        
        TIPToken tipToken = TIPToken(tipTokenAddress);
        tipToken.updateSupplyCap(newCap);
        
        vm.stopBroadcast();
        
        console.log("Supply cap updated to 100B TIP tokens for testing!");
    }
} 
