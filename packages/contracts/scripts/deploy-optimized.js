// SPDX-License-Identifier: MIT
const { ethers } = require("hardhat");

/**
 * Deployment script for optimized StoryHouse contract architecture
 * 
 * New Architecture (5 contracts):
 * 1. TIPToken - Platform token
 * 2. RewardsManager - Central reward orchestrator  
 * 3. UnifiedRewardsController - Combined Read/Creator/Remix rewards
 * 4. ChapterAccessController - Chapter access and monetization
 * 5. HybridRevenueController - Multi-author revenue sharing
 */

async function main() {
    console.log("🚀 Deploying optimized StoryHouse contract architecture...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy contracts in dependency order
    const contracts = {};
    
    // 1. Deploy TIP Token
    console.log("\n📄 Deploying TIPToken...");
    const TIPToken = await ethers.getContractFactory("TIPToken");
    contracts.tipToken = await TIPToken.deploy(
        deployer.address, // initialOwner
        "1000000000000000000000000000", // 1B initial supply (18 decimals)
        "10000000000000000000000000000" // 10B max supply (18 decimals)
    );
    await contracts.tipToken.deployed();
    console.log("✅ TIPToken deployed to:", contracts.tipToken.address);

    // 2. Deploy Rewards Manager
    console.log("\n📄 Deploying RewardsManager...");
    const RewardsManager = await ethers.getContractFactory("RewardsManager");
    contracts.rewardsManager = await RewardsManager.deploy(
        deployer.address, // initialOwner
        contracts.tipToken.address
    );
    await contracts.rewardsManager.deployed();
    console.log("✅ RewardsManager deployed to:", contracts.rewardsManager.address);

    // 3. Deploy Unified Rewards Controller
    console.log("\n📄 Deploying UnifiedRewardsController...");
    const UnifiedRewardsController = await ethers.getContractFactory("UnifiedRewardsController");
    contracts.unifiedRewardsController = await UnifiedRewardsController.deploy(
        deployer.address, // initialAdmin
        contracts.rewardsManager.address,
        contracts.tipToken.address
    );
    await contracts.unifiedRewardsController.deployed();
    console.log("✅ UnifiedRewardsController deployed to:", contracts.unifiedRewardsController.address);

    // 4. Deploy Chapter Access Controller
    console.log("\n📄 Deploying ChapterAccessController...");
    const ChapterAccessController = await ethers.getContractFactory("ChapterAccessController");
    contracts.chapterAccessController = await ChapterAccessController.deploy(
        deployer.address, // initialAdmin
        contracts.tipToken.address,
        contracts.rewardsManager.address
    );
    await contracts.chapterAccessController.deployed();
    console.log("✅ ChapterAccessController deployed to:", contracts.chapterAccessController.address);

    // 5. Deploy Hybrid Revenue Controller
    console.log("\n📄 Deploying HybridRevenueController...");
    const HybridRevenueController = await ethers.getContractFactory("HybridRevenueController");
    contracts.hybridRevenueController = await HybridRevenueController.deploy(
        deployer.address, // initialAdmin
        contracts.rewardsManager.address,
        contracts.tipToken.address
    );
    await contracts.hybridRevenueController.deployed();
    console.log("✅ HybridRevenueController deployed to:", contracts.hybridRevenueController.address);

    // Configure contract relationships
    console.log("\n⚙️  Configuring contract relationships...");

    // Grant minter role to RewardsManager for TIPToken
    await contracts.tipToken.grantRole(
        await contracts.tipToken.MINTER_ROLE(),
        contracts.rewardsManager.address
    );
    console.log("✅ Granted MINTER_ROLE to RewardsManager");

    // Add UnifiedRewardsController to RewardsManager
    await contracts.rewardsManager.addController(
        contracts.unifiedRewardsController.address,
        "unified"
    );
    console.log("✅ Added UnifiedRewardsController to RewardsManager");

    // Grant STORY_MANAGER_ROLE to admin for setup
    await contracts.unifiedRewardsController.grantRole(
        await contracts.unifiedRewardsController.STORY_MANAGER_ROLE(),
        deployer.address
    );
    console.log("✅ Granted STORY_MANAGER_ROLE to deployer");

    await contracts.chapterAccessController.grantRole(
        await contracts.chapterAccessController.STORY_MANAGER_ROLE(),
        deployer.address
    );
    console.log("✅ Granted STORY_MANAGER_ROLE to ChapterAccessController deployer");

    await contracts.hybridRevenueController.grantRole(
        await contracts.hybridRevenueController.STORY_MANAGER_ROLE(),
        deployer.address
    );
    console.log("✅ Granted STORY_MANAGER_ROLE to HybridRevenueController deployer");

    // Display deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("════════════════════════════════════════");
    console.log(`TIPToken:                  ${contracts.tipToken.address}`);
    console.log(`RewardsManager:            ${contracts.rewardsManager.address}`);
    console.log(`UnifiedRewardsController:  ${contracts.unifiedRewardsController.address}`);
    console.log(`ChapterAccessController:   ${contracts.chapterAccessController.address}`);
    console.log(`HybridRevenueController:   ${contracts.hybridRevenueController.address}`);

    console.log("\n⚙️  Architecture Summary:");
    console.log("════════════════════════════════════════");
    console.log("✅ Optimized from 9 to 5 contracts");
    console.log("✅ Integrated AccessControl directly into contracts");
    console.log("✅ Consolidated Read, Creator, and Remix rewards");
    console.log("✅ Maintained modular separation for complex logic");
    console.log("✅ Gas-optimized architecture ready for testnet");

    console.log("\n🔧 Next Steps:");
    console.log("════════════════════════════════════════");
    console.log("1. Update frontend contract addresses");
    console.log("2. Test contract interactions on testnet");
    console.log("3. Run comprehensive test suite");
    console.log("4. Verify contracts on block explorer");

    // Save deployment addresses to file
    const deploymentData = {
        network: "localhost", // Update for actual network
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            TIPToken: contracts.tipToken.address,
            RewardsManager: contracts.rewardsManager.address,
            UnifiedRewardsController: contracts.unifiedRewardsController.address,
            ChapterAccessController: contracts.chapterAccessController.address,
            HybridRevenueController: contracts.hybridRevenueController.address
        }
    };

    // Write to deployments file
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, 'optimized-deployment.json'),
        JSON.stringify(deploymentData, null, 2)
    );
    console.log("💾 Deployment data saved to deployments/optimized-deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });