// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TIPToken.sol";

contract DeployTIPToken is Script {
    function run() external {
        // Read private key as string
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");

        // Convert to uint256 - vm.parseUint will handle both formats
        uint256 deployerPrivateKey;

        // Try parsing as-is first (in case it has 0x prefix)
        if (bytes(privateKeyStr).length == 66) {
            // Likely has 0x prefix
            deployerPrivateKey = vm.parseUint(privateKeyStr);
        } else if (bytes(privateKeyStr).length == 64) {
            // No 0x prefix, add it manually for parseUint
            deployerPrivateKey = vm.parseUint(
                string.concat("0x", privateKeyStr)
            );
        } else {
            revert(
                "Invalid private key length. Expected 64 characters (no 0x) or 66 characters (with 0x)"
            );
        }

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
