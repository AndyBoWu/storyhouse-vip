// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/ReadRewardsController.sol";

contract DeployReadRewardsController is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(
            string.concat("0x", privateKeyStr)
        );
        address deployer = vm.addr(deployerPrivateKey);

        // Get Rewards Manager address from environment variable (if available)
        address rewardsManagerAddress = vm.envOr(
            "REWARDS_MANAGER_ADDRESS",
            address(0)
        );

        console.log("Deploying Read Rewards Controller...");
        console.log("Deployer address:", deployer);
        console.log("Rewards Manager address:", rewardsManagerAddress);

        vm.startBroadcast(deployerPrivateKey);

        ReadRewardsController controller = new ReadRewardsController(
            deployer,
            rewardsManagerAddress
        );

        vm.stopBroadcast();

        console.log(
            "Read Rewards Controller deployed at:",
            address(controller)
        );
        console.log("Owner:", deployer);
        console.log("Rewards Manager:", rewardsManagerAddress);
    }
}
