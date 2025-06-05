// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/RewardsManager.sol";

contract DeployRewardsManager is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(
            string.concat("0x", privateKeyStr)
        );
        address deployer = vm.addr(deployerPrivateKey);

        // Get TIP Token address from environment variable
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");

        console.log("Deploying Rewards Manager...");
        console.log("Deployer address:", deployer);
        console.log("TIP Token address:", tipTokenAddress);

        vm.startBroadcast(deployerPrivateKey);

        RewardsManager rewardsManager = new RewardsManager(
            deployer,
            tipTokenAddress
        );

        vm.stopBroadcast();

        console.log("Rewards Manager deployed at:", address(rewardsManager));
        console.log("Owner:", deployer);
        console.log("TIP Token:", tipTokenAddress);
    }
}
