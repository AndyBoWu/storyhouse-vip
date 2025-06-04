// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TIPToken.sol";

contract DeployTIPToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TIP Token...");
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy TIP Token
        TIPToken tipToken = new TIPToken(deployer);
        
        console.log("TIP Token deployed at:", address(tipToken));
        console.log("Initial supply:", tipToken.balanceOf(deployer));
        console.log("Symbol:", tipToken.symbol());
        console.log("Name:", tipToken.name());
        
        vm.stopBroadcast();
        
        // Print deployment info
        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", address(tipToken));
        console.log("Owner/Deployer:", deployer);
        console.log("Network:", block.chainid);
        console.log("\nNext steps:");
        console.log("1. Update CONTRACT_ADDRESSES in constants/index.ts");
        console.log("2. Add contract address to TIP_TOKEN_CONFIG");
        console.log("3. Verify contract on explorer if needed");
    }
} 
