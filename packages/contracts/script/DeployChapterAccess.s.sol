// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ChapterAccessController.sol";
import "../src/TIPToken.sol";
import "../src/RewardsManager.sol";

/**
 * @title Deploy Chapter Access Controller
 * @dev Deployment script for the new chapter access control system
 * 
 * Usage:
 * forge script script/DeployChapterAccess.s.sol:DeployChapterAccessScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
contract DeployChapterAccessScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Chapter Access Controller...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Get existing contract addresses (update these with your deployed addresses)
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");
        address rewardsManagerAddress = vm.envAddress("REWARDS_MANAGER_ADDRESS");

        console.log("TIP Token:", tipTokenAddress);
        console.log("Rewards Manager:", rewardsManagerAddress);

        // Deploy Chapter Access Controller
        ChapterAccessController chapterAccess = new ChapterAccessController(
            deployer,           // initial owner
            tipTokenAddress,    // TIP token
            rewardsManagerAddress // rewards manager
        );

        console.log("ChapterAccessController deployed:", address(chapterAccess));

        // Verify the deployment
        console.log("Verifying deployment...");
        console.log("Has Admin Role:", chapterAccess.hasRole(chapterAccess.DEFAULT_ADMIN_ROLE(), deployer));
        console.log("TIP Token:", address(chapterAccess.tipToken()));
        console.log("Rewards Manager:", address(chapterAccess.rewardsManager()));
        console.log("Unlock Price:", chapterAccess.unlockPrice());
        // console.log("Base Read Reward:", chapterAccess.baseReadReward()); // Removed
        console.log("Free Chapters Count:", chapterAccess.FREE_CHAPTERS_COUNT());

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("ChapterAccessController:", address(chapterAccess));
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Add ChapterAccessController as a minter to TIP Token");
        console.log("2. Add ChapterAccessController as a controller to Rewards Manager");
        console.log("3. Update frontend configuration with new contract address");
        console.log("4. Test the complete unlock workflow");
    }
}