// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TIPToken.sol";

contract MintTIPTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT_ADDRESS");
        uint256 amount = vm.envUint("MINT_AMOUNT"); // Amount in wei (e.g., 1000000000000000000000 for 1000 TIP)
        
        console.log("Minting TIP Tokens...");
        console.log("TIP Token Address:", tipTokenAddress);
        console.log("Recipient:", recipient);
        console.log("Amount:", amount);
        
        vm.startBroadcast(deployerPrivateKey);
        
        TIPToken tipToken = TIPToken(tipTokenAddress);
        
        // Check if deployer is a minter
        require(tipToken.isMinter(vm.addr(deployerPrivateKey)), "Deployer is not a minter");
        
        // Mint tokens
        tipToken.mint(recipient, amount);
        
        vm.stopBroadcast();
        
        console.log("\n=== Minting Complete ===");
        console.log("Minted", amount / 1e18, "TIP tokens to", recipient);
        console.log("New balance:", tipToken.balanceOf(recipient) / 1e18);
    }
    
    // Helper function to mint to multiple addresses
    function mintToMultiple() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tipTokenAddress = vm.envAddress("TIP_TOKEN_ADDRESS");
        
        // Test addresses to mint to
        address[] memory recipients = new address[](3);
        recipients[0] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Common test address
        recipients[1] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        recipients[2] = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        
        uint256 amountEach = 1000 * 1e18; // 1000 TIP tokens each
        
        vm.startBroadcast(deployerPrivateKey);
        
        TIPToken tipToken = TIPToken(tipTokenAddress);
        
        for (uint i = 0; i < recipients.length; i++) {
            tipToken.mint(recipients[i], amountEach);
            console.log("Minted 1000 TIP to:", recipients[i]);
        }
        
        vm.stopBroadcast();
        
        console.log("Minted to", recipients.length, "addresses successfully!");
    }
} 
