// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/RemixLicensingController.sol";

contract DeployRemixLicensingController is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(
            string.concat("0x", privateKeyStr)
        );
        address deployer = vm.addr(deployerPrivateKey);

        // Get Rewards Manager and TIP Token addresses from environment variables
        address rewardsManagerAddress = vm.envOr(
            "REWARDS_MANAGER_ADDRESS",
            address(0)
        );
        address tipTokenAddress = vm.envOr("TIP_TOKEN_ADDRESS", address(0));

        console.log("Deploying Remix Licensing Controller...");
        console.log("Deployer address:", deployer);
        console.log("Rewards Manager address:", rewardsManagerAddress);
        console.log("TIP Token address:", tipTokenAddress);

        vm.startBroadcast(deployerPrivateKey);

        RemixLicensingController controller = new RemixLicensingController(
            deployer,
            rewardsManagerAddress,
            tipTokenAddress
        );

        vm.stopBroadcast();

        console.log(
            "Remix Licensing Controller deployed at:",
            address(controller)
        );
        console.log("Owner:", deployer);
        console.log("Rewards Manager:", rewardsManagerAddress);
        console.log("TIP Token:", tipTokenAddress);
    }
}
