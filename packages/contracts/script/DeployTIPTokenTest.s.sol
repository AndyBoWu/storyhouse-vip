// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TIPTokenTest.sol";

contract DeployTIPTokenTest is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TIP Token Test...");
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy TIP Token Test
        TIPTokenTest tipTokenTest = new TIPTokenTest(deployer);
        
        console.log("TIP Token Test deployed at:", address(tipTokenTest));
        console.log("Initial supply:", tipTokenTest.balanceOf(deployer));
        console.log("Symbol:", tipTokenTest.symbol());
        console.log("Name:", tipTokenTest.name());
        
        vm.stopBroadcast();
        
        // Print deployment info
        console.log("\n=== Test Deployment Complete ===");
        console.log("Contract Address:", address(tipTokenTest));
        console.log("Owner/Deployer:", deployer);
        console.log("Network:", block.chainid);
        console.log("\nNext steps:");
        console.log("1. Update CONTRACT_ADDRESSES in constants/index.ts");
        console.log("2. Add contract address to TIP_TOKEN_CONFIG");
        console.log("3. This is a TEST token - use for development only");
    }
} 
