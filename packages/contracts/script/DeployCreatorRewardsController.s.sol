// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/CreatorRewardsController.sol";

contract DeployCreatorRewardsController is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(
            string.concat("0x", privateKeyStr)
        );
        address deployer = vm.addr(deployerPrivateKey);

        // Get Rewards Manager address from environment variable (if available)
        // For now, we'll deploy without it and manually set later
        address rewardsManagerAddress = vm.envOr(
            "REWARDS_MANAGER_ADDRESS",
            address(0)
        );

        console.log("Deploying Creator Rewards Controller...");
        console.log("Deployer address:", deployer);
        console.log("Rewards Manager address:", rewardsManagerAddress);

        vm.startBroadcast(deployerPrivateKey);

        CreatorRewardsController controller = new CreatorRewardsController(
            deployer,
            rewardsManagerAddress
        );

        vm.stopBroadcast();

        console.log(
            "Creator Rewards Controller deployed at:",
            address(controller)
        );
        console.log("Owner:", deployer);
        console.log("Rewards Manager:", rewardsManagerAddress);
    }
}
