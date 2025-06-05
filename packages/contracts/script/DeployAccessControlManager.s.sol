// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AccessControlManager.sol";

contract DeployAccessControlManager is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(
            string.concat("0x", privateKeyStr)
        );
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Access Control Manager...");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        AccessControlManager acm = new AccessControlManager(deployer);

        vm.stopBroadcast();

        console.log("Access Control Manager deployed at:", address(acm));
        console.log("Initial admin:", deployer);
        console.log("Symbol: AccessControlManager");
        console.log("Name: Access Control Manager");
    }
}
