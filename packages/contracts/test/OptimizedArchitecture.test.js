const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Optimized StoryHouse Architecture", function () {
    let deployer, user1, user2;
    let tipToken, rewardsManager, unifiedRewardsController, chapterAccessController, hybridRevenueController;

    beforeEach(async function () {
        [deployer, user1, user2] = await ethers.getSigners();

        // Deploy TIP Token
        const TIPToken = await ethers.getContractFactory("TIPToken");
        tipToken = await TIPToken.deploy(
            deployer.address,
            ethers.utils.parseEther("1000000000"), // 1B initial supply
            ethers.utils.parseEther("10000000000") // 10B max supply
        );

        // Deploy Rewards Manager
        const RewardsManager = await ethers.getContractFactory("RewardsManager");
        rewardsManager = await RewardsManager.deploy(
            deployer.address,
            tipToken.address
        );

        // Deploy Unified Rewards Controller
        const UnifiedRewardsController = await ethers.getContractFactory("UnifiedRewardsController");
        unifiedRewardsController = await UnifiedRewardsController.deploy(
            deployer.address,
            rewardsManager.address,
            tipToken.address
        );

        // Deploy Chapter Access Controller
        const ChapterAccessController = await ethers.getContractFactory("ChapterAccessController");
        chapterAccessController = await ChapterAccessController.deploy(
            deployer.address,
            tipToken.address,
            rewardsManager.address
        );

        // Deploy Hybrid Revenue Controller
        const HybridRevenueController = await ethers.getContractFactory("HybridRevenueController");
        hybridRevenueController = await HybridRevenueController.deploy(
            deployer.address,
            rewardsManager.address,
            tipToken.address
        );

        // Setup permissions
        await tipToken.grantRole(await tipToken.MINTER_ROLE(), rewardsManager.address);
        await rewardsManager.addController(unifiedRewardsController.address, "unified");
        await unifiedRewardsController.grantRole(
            await unifiedRewardsController.STORY_MANAGER_ROLE(),
            deployer.address
        );
    });

    describe("Architecture Validation", function () {
        it("Should have correct contract count (5 contracts)", async function () {
            expect(tipToken.address).to.not.equal(ethers.constants.AddressZero);
            expect(rewardsManager.address).to.not.equal(ethers.constants.AddressZero);
            expect(unifiedRewardsController.address).to.not.equal(ethers.constants.AddressZero);
            expect(chapterAccessController.address).to.not.equal(ethers.constants.AddressZero);
            expect(hybridRevenueController.address).to.not.equal(ethers.constants.AddressZero);
        });

        it("Should have proper access control integration", async function () {
            // Check that AccessControl is directly integrated
            expect(await unifiedRewardsController.hasRole(
                await unifiedRewardsController.ADMIN_ROLE(),
                deployer.address
            )).to.be.true;

            expect(await chapterAccessController.hasRole(
                await chapterAccessController.ADMIN_ROLE(),
                deployer.address
            )).to.be.true;

            expect(await hybridRevenueController.hasRole(
                await hybridRevenueController.ADMIN_ROLE(),
                deployer.address
            )).to.be.true;
        });

        it("Should have unified rewards controller registered", async function () {
            expect(await rewardsManager.isAuthorizedController(unifiedRewardsController.address)).to.be.true;
            expect(await rewardsManager.getControllerByType("unified")).to.equal(unifiedRewardsController.address);
        });
    });

    describe("Unified Rewards Controller", function () {
        const storyId = ethers.utils.formatBytes32String("test-story-1");
        const chapterNumber = 1;

        beforeEach(async function () {
            // Register story creator
            await unifiedRewardsController.registerStoryCreator(storyId, user1.address);
        });

        it("Should handle reading rewards", async function () {
            // Start reading session
            await unifiedRewardsController.connect(user2).startReading(storyId, chapterNumber);

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds

            // Claim chapter reward
            await unifiedRewardsController.connect(user2).claimChapterReward(storyId, chapterNumber);

            // Check reward was distributed
            const userRewards = await rewardsManager.getUserTotalRewards(user2.address);
            expect(userRewards).to.be.gt(0);
        });

        it("Should handle creation rewards", async function () {
            // Claim story creation reward
            await unifiedRewardsController.connect(user1).claimStoryCreationReward(storyId);

            // Check reward was distributed
            const userRewards = await rewardsManager.getUserTotalRewards(user1.address);
            expect(userRewards).to.equal(ethers.utils.parseEther("50")); // 50 TIP creation reward
        });

        it("Should handle remix licensing", async function () {
            const remixStoryId = ethers.utils.formatBytes32String("remix-story-1");
            const licenseFee = ethers.utils.parseEther("2"); // Standard license

            // Give user2 some TIP tokens for licensing
            await tipToken.mint(user2.address, licenseFee);
            await tipToken.connect(user2).approve(unifiedRewardsController.address, licenseFee);

            // Purchase remix license
            await unifiedRewardsController.connect(user2).purchaseRemixLicense(
                storyId,
                remixStoryId,
                "standard"
            );

            // Check license was purchased
            expect(await unifiedRewardsController.hasLicensed(user2.address, storyId)).to.be.true;
            expect(await unifiedRewardsController.remixToOriginal(remixStoryId)).to.equal(storyId);
        });
    });

    describe("Gas Optimization Benefits", function () {
        it("Should demonstrate gas savings vs old architecture", async function () {
            // This test would compare gas usage between old and new architecture
            // In practice, you'd deploy both architectures and compare transaction costs

            const storyId = ethers.utils.formatBytes32String("gas-test-story");
            
            // Register story and start reading (unified flow)
            await unifiedRewardsController.registerStoryCreator(storyId, user1.address);
            
            const tx1 = await unifiedRewardsController.connect(user2).startReading(storyId, 1);
            const receipt1 = await tx1.wait();
            
            await ethers.provider.send("evm_increaseTime", [61]);
            
            const tx2 = await unifiedRewardsController.connect(user2).claimChapterReward(storyId, 1);
            const receipt2 = await tx2.wait();

            console.log(`Gas used for reading flow: ${receipt1.gasUsed.add(receipt2.gasUsed)} gas`);
            
            // In the old architecture, this would require 3 separate contracts and more gas
            expect(receipt1.gasUsed.add(receipt2.gasUsed)).to.be.lt(500000); // Reasonable gas limit
        });
    });

    describe("Integration Tests", function () {
        it("Should support full story lifecycle", async function () {
            const storyId = ethers.utils.formatBytes32String("lifecycle-story");
            
            // 1. Register story creator
            await unifiedRewardsController.registerStoryCreator(storyId, user1.address);
            
            // 2. Creator claims creation reward
            await unifiedRewardsController.connect(user1).claimStoryCreationReward(storyId);
            
            // 3. Register chapter in access controller
            await chapterAccessController.registerChapter(
                storyId,
                1,
                user1.address,
                "ipfs-hash",
                1000 // word count
            );
            
            // 4. Reader unlocks and reads chapter
            await chapterAccessController.connect(user2).unlockChapter(storyId, 1);
            
            // 5. Reader claims reading reward through unified controller
            await unifiedRewardsController.connect(user2).startReading(storyId, 1);
            await ethers.provider.send("evm_increaseTime", [61]);
            await unifiedRewardsController.connect(user2).claimChapterReward(storyId, 1);
            
            // Verify both users received appropriate rewards
            const creatorRewards = await rewardsManager.getUserTotalRewards(user1.address);
            const readerRewards = await rewardsManager.getUserTotalRewards(user2.address);
            
            expect(creatorRewards).to.be.gt(0);
            expect(readerRewards).to.be.gt(0);
        });
    });
});