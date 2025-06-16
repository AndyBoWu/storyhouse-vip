// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RemixLicensingController.sol";
import "../src/RewardsManager.sol";
import "../src/TIPToken.sol";

contract RemixLicensingControllerTest is Test {
    RemixLicensingController public remixLicensing;
    RewardsManager public rewardsManager;
    TIPToken public tipToken;
    address public owner;
    address public creator;
    address public remixer;
    address public authorizedCaller;

    event RemixLicensePurchased(
        address indexed remixer,
        bytes32 indexed originalStoryId,
        bytes32 indexed remixStoryId,
        uint256 licenseFee,
        string licenseType
    );
    event RoyaltyDistributed(
        address indexed creator, bytes32 indexed storyId, uint256 royaltyAmount, address indexed remixer
    );
    event LicenseTypeUpdated(string licenseType, uint256 baseFee, uint256 royaltyPercentage);

    function setUp() public {
        owner = address(this);
        creator = address(0x1);
        remixer = address(0x2);
        authorizedCaller = address(0x3);

        tipToken = new TIPToken(owner);
        rewardsManager = new RewardsManager(owner, address(tipToken));
        remixLicensing = new RemixLicensingController(owner, address(rewardsManager), address(tipToken));

        // Setup proper authorizations
        tipToken.addMinter(address(rewardsManager));
        rewardsManager.addController(address(remixLicensing), "remix_controller");
        rewardsManager.addController(authorizedCaller, "authorized_caller");

        // Give remixer some tokens to purchase licenses
        tipToken.mint(remixer, 10000 * 10 ** 18);
    }

    function testInitialState() public {
        // Check default license types
        (uint256 baseFee, uint256 royaltyPercentage, bool isActive) = remixLicensing.licenseTypes("standard");
        assertEq(baseFee, 100 * 10 ** 18);
        assertEq(royaltyPercentage, 500); // 5%
        assertTrue(isActive);

        (baseFee, royaltyPercentage, isActive) = remixLicensing.licenseTypes("premium");
        assertEq(baseFee, 500 * 10 ** 18);
        assertEq(royaltyPercentage, 1000); // 10%
        assertTrue(isActive);

        (baseFee, royaltyPercentage, isActive) = remixLicensing.licenseTypes("exclusive");
        assertEq(baseFee, 2000 * 10 ** 18);
        assertEq(royaltyPercentage, 2000); // 20%
        assertTrue(isActive);

        assertFalse(remixLicensing.paused());
    }

    function testRegisterStory() public {
        bytes32 storyId = keccak256("test_story");
        string memory licenseType = "standard";

        vm.prank(authorizedCaller);
        remixLicensing.registerStory(storyId, creator, licenseType);

        assertEq(remixLicensing.storyCreators(storyId), creator);
        assertEq(remixLicensing.storyLicenseTypes(storyId), licenseType);
    }

    function testRegisterStoryUnauthorized() public {
        bytes32 storyId = keccak256("test_story");

        vm.prank(creator);
        vm.expectRevert("RemixLicensing: unauthorized caller");
        remixLicensing.registerStory(storyId, creator, "standard");
    }

    function testRegisterStoryInvalidInputs() public {
        vm.startPrank(authorizedCaller);

        // Invalid story ID
        vm.expectRevert("RemixLicensing: invalid story ID");
        remixLicensing.registerStory(bytes32(0), creator, "standard");

        // Invalid creator
        vm.expectRevert("RemixLicensing: invalid creator");
        remixLicensing.registerStory(keccak256("test_story"), address(0), "standard");

        // Invalid license type
        vm.expectRevert("RemixLicensing: invalid license type");
        remixLicensing.registerStory(keccak256("test_story"), creator, "invalid");

        vm.stopPrank();
    }

    function testPurchaseRemixLicense() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32 remixStoryId = keccak256("remix_story");
        string memory licenseType = "standard";

        // Register original story
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(originalStoryId, creator, licenseType);

        uint256 licenseFee = 100 * 10 ** 18;
        uint256 initialCreatorBalance = tipToken.balanceOf(creator);
        uint256 initialRemixerBalance = tipToken.balanceOf(remixer);

        // Approve spending
        vm.prank(remixer);
        tipToken.approve(address(remixLicensing), licenseFee);

        vm.prank(remixer);
        vm.expectEmit(true, true, true, true);
        emit RemixLicensePurchased(remixer, originalStoryId, remixStoryId, licenseFee, licenseType);

        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId);

        // Check balances and state
        assertEq(tipToken.balanceOf(remixer), initialRemixerBalance - licenseFee);
        assertEq(tipToken.balanceOf(creator), initialCreatorBalance + licenseFee);
        assertTrue(remixLicensing.hasLicensed(remixer, originalStoryId));
        assertEq(remixLicensing.remixToOriginal(remixStoryId), originalStoryId);
        assertEq(remixLicensing.storyCreators(remixStoryId), remixer);
        assertEq(remixLicensing.totalLicensesSold(originalStoryId), 1);
    }

    function testPurchaseRemixLicenseInvalidInputs() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32 remixStoryId = keccak256("remix_story");

        vm.startPrank(remixer);

        // Invalid original story ID
        vm.expectRevert("RemixLicensing: invalid original story ID");
        remixLicensing.purchaseRemixLicense(bytes32(0), remixStoryId);

        // Invalid remix story ID
        vm.expectRevert("RemixLicensing: invalid remix story ID");
        remixLicensing.purchaseRemixLicense(originalStoryId, bytes32(0));

        // Story not registered
        vm.expectRevert("RemixLicensing: story not registered");
        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId);

        vm.stopPrank();
    }

    function testPurchaseRemixLicenseOwnStory() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32 remixStoryId = keccak256("remix_story");

        // Register story with creator as owner
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(originalStoryId, creator, "standard");

        vm.prank(creator);
        vm.expectRevert("RemixLicensing: cannot remix own story");
        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId);
    }

    function testPurchaseRemixLicenseAlreadyLicensed() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32 remixStoryId1 = keccak256("remix_story_1");
        bytes32 remixStoryId2 = keccak256("remix_story_2");

        // Register story and purchase first license
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(originalStoryId, creator, "standard");

        vm.prank(remixer);
        tipToken.approve(address(remixLicensing), 200 * 10 ** 18);

        vm.prank(remixer);
        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId1);

        // Try to purchase again
        vm.prank(remixer);
        vm.expectRevert("RemixLicensing: already licensed");
        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId2);
    }

    function testDistributeRemixRoyalties() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32 remixStoryId = keccak256("remix_story");
        string memory licenseType = "standard";

        // Setup remix
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(originalStoryId, creator, licenseType);

        vm.prank(remixer);
        tipToken.approve(address(remixLicensing), 100 * 10 ** 18);

        vm.prank(remixer);
        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId);

        // Distribute royalties
        uint256 revenue = 1000 * 10 ** 18;
        uint256 expectedRoyalty = (revenue * 500) / 10000; // 5% of revenue
        uint256 licenseFee = 100 * 10 ** 18; // Previous license fee
        uint256 totalExpectedRevenue = licenseFee + expectedRoyalty;
        uint256 totalExpectedCreatorRoyalties = licenseFee + expectedRoyalty;

        uint256 initialCreatorBalance = tipToken.balanceOf(creator);

        vm.prank(authorizedCaller);
        vm.expectEmit(true, true, false, true);
        emit RoyaltyDistributed(creator, originalStoryId, expectedRoyalty, remixer);

        remixLicensing.distributeRemixRoyalties(remixStoryId, revenue);

        assertEq(tipToken.balanceOf(creator), initialCreatorBalance + expectedRoyalty);
        assertEq(remixLicensing.storyTotalRevenue(originalStoryId), totalExpectedRevenue);
        assertEq(remixLicensing.creatorTotalRoyalties(creator), totalExpectedCreatorRoyalties);
    }

    function testDistributeRemixRoyaltiesUnauthorized() public {
        bytes32 remixStoryId = keccak256("remix_story");
        uint256 revenue = 1000 * 10 ** 18;

        vm.prank(creator);
        vm.expectRevert("RemixLicensing: unauthorized caller");
        remixLicensing.distributeRemixRoyalties(remixStoryId, revenue);
    }

    function testGetLicenseFee() public {
        bytes32 storyId = keccak256("test_story");
        string memory licenseType = "premium";

        vm.prank(authorizedCaller);
        remixLicensing.registerStory(storyId, creator, licenseType);

        (uint256 licenseFee, string memory returnedLicenseType) = remixLicensing.getLicenseFee(storyId);

        assertEq(licenseFee, 500 * 10 ** 18);
        assertEq(returnedLicenseType, licenseType);
    }

    function testCanRemixStory() public {
        bytes32 storyId = keccak256("test_story");

        // Register story
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(storyId, creator, "standard");

        // Creator can always remix own story
        assertTrue(remixLicensing.canRemixStory(creator, storyId));

        // Others cannot initially
        assertFalse(remixLicensing.canRemixStory(remixer, storyId));

        // After purchasing license
        vm.prank(remixer);
        tipToken.approve(address(remixLicensing), 100 * 10 ** 18);

        vm.prank(remixer);
        remixLicensing.purchaseRemixLicense(storyId, keccak256("remix"));

        assertTrue(remixLicensing.canRemixStory(remixer, storyId));
    }

    function testGetRemixChain() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32[] memory remixIds = new bytes32[](3);
        remixIds[0] = keccak256("remix_1");
        remixIds[1] = keccak256("remix_2");
        remixIds[2] = keccak256("remix_3");

        // Register original story
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(originalStoryId, creator, "standard");

        // Create multiple remixes
        address[] memory remixers = new address[](3);
        remixers[0] = address(0x10);
        remixers[1] = address(0x11);
        remixers[2] = address(0x12);

        for (uint256 i = 0; i < 3; i++) {
            tipToken.mint(remixers[i], 1000 * 10 ** 18);

            vm.prank(remixers[i]);
            tipToken.approve(address(remixLicensing), 100 * 10 ** 18);

            vm.prank(remixers[i]);
            remixLicensing.purchaseRemixLicense(originalStoryId, remixIds[i]);
        }

        bytes32[] memory remixChain = remixLicensing.getRemixChain(originalStoryId);
        assertEq(remixChain.length, 3);

        for (uint256 i = 0; i < 3; i++) {
            assertEq(remixChain[i], remixIds[i]);
        }
    }

    function testGetStoryStats() public {
        bytes32 storyId = keccak256("test_story");

        vm.prank(authorizedCaller);
        remixLicensing.registerStory(storyId, creator, "standard");

        (address returnedCreator, uint256 totalRevenue, uint256 licensesSold, uint256 remixCount) =
            remixLicensing.getStoryStats(storyId);

        assertEq(returnedCreator, creator);
        assertEq(totalRevenue, 0);
        assertEq(licensesSold, 0);
        assertEq(remixCount, 0);

        // Purchase a license
        vm.prank(remixer);
        tipToken.approve(address(remixLicensing), 100 * 10 ** 18);

        vm.prank(remixer);
        remixLicensing.purchaseRemixLicense(storyId, keccak256("remix"));

        (returnedCreator, totalRevenue, licensesSold, remixCount) = remixLicensing.getStoryStats(storyId);

        assertEq(returnedCreator, creator);
        assertEq(totalRevenue, 100 * 10 ** 18); // License fee counted as revenue
        assertEq(licensesSold, 1);
        assertEq(remixCount, 1);
    }

    function testGetCreatorRoyalties() public {
        assertEq(remixLicensing.getCreatorRoyalties(creator), 0);

        // Setup and purchase license (generates royalty)
        bytes32 storyId = keccak256("test_story");
        vm.prank(authorizedCaller);
        remixLicensing.registerStory(storyId, creator, "standard");

        vm.prank(remixer);
        tipToken.approve(address(remixLicensing), 100 * 10 ** 18);

        vm.prank(remixer);
        remixLicensing.purchaseRemixLicense(storyId, keccak256("remix"));

        assertEq(remixLicensing.getCreatorRoyalties(creator), 100 * 10 ** 18);
    }

    function testUpdateLicenseType() public {
        string memory licenseType = "custom";
        uint256 baseFee = 300 * 10 ** 18;
        uint256 royaltyPercentage = 750; // 7.5%

        vm.expectEmit(false, false, false, true);
        emit LicenseTypeUpdated(licenseType, baseFee, royaltyPercentage);

        remixLicensing.updateLicenseType(licenseType, baseFee, royaltyPercentage);

        (uint256 fee, uint256 royalty, bool isActive) = remixLicensing.licenseTypes(licenseType);
        assertEq(fee, baseFee);
        assertEq(royalty, royaltyPercentage);
        assertTrue(isActive);
    }

    function testUpdateLicenseTypeOnlyOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        remixLicensing.updateLicenseType("custom", 300 * 10 ** 18, 750);
    }

    function testUpdateLicenseTypeInvalidRoyalty() public {
        vm.expectRevert("RemixLicensing: royalty too high");
        remixLicensing.updateLicenseType("custom", 300 * 10 ** 18, 5001); // Over 50%
    }

    function testDeactivateLicenseType() public {
        string memory licenseType = "standard";

        // Initially active
        (,, bool isActive) = remixLicensing.licenseTypes(licenseType);
        assertTrue(isActive);

        remixLicensing.deactivateLicenseType(licenseType);

        (,, isActive) = remixLicensing.licenseTypes(licenseType);
        assertFalse(isActive);
    }

    function testPauseUnpause() public {
        assertFalse(remixLicensing.paused());

        remixLicensing.pause();
        assertTrue(remixLicensing.paused());

        remixLicensing.unpause();
        assertFalse(remixLicensing.paused());
    }

    function testPauseOnlyOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        remixLicensing.pause();
    }

    function testEmergencyWithdraw() public {
        uint256 amount = 500 * 10 ** 18;

        // First, get some tokens into the contract
        tipToken.mint(address(remixLicensing), amount);

        uint256 initialOwnerBalance = tipToken.balanceOf(owner);

        remixLicensing.emergencyWithdraw(amount);

        assertEq(tipToken.balanceOf(owner), initialOwnerBalance + amount);
        assertEq(tipToken.balanceOf(address(remixLicensing)), 0);
    }

    function testEmergencyWithdrawOnlyOwner() public {
        vm.prank(creator);
        vm.expectRevert();
        remixLicensing.emergencyWithdraw(100 * 10 ** 18);
    }

    function testPurchaseRemixLicenseWhenPaused() public {
        bytes32 originalStoryId = keccak256("original_story");
        bytes32 remixStoryId = keccak256("remix_story");

        vm.prank(authorizedCaller);
        remixLicensing.registerStory(originalStoryId, creator, "standard");

        remixLicensing.pause();

        vm.prank(remixer);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        remixLicensing.purchaseRemixLicense(originalStoryId, remixStoryId);
    }

    function testMultipleLicenseTypes() public {
        bytes32[] memory storyIds = new bytes32[](3);
        storyIds[0] = keccak256("standard_story");
        storyIds[1] = keccak256("premium_story");
        storyIds[2] = keccak256("exclusive_story");

        string[] memory licenseTypes = new string[](3);
        licenseTypes[0] = "standard";
        licenseTypes[1] = "premium";
        licenseTypes[2] = "exclusive";

        uint256[] memory expectedFees = new uint256[](3);
        expectedFees[0] = 100 * 10 ** 18;
        expectedFees[1] = 500 * 10 ** 18;
        expectedFees[2] = 2000 * 10 ** 18;

        // Register stories with different license types
        vm.startPrank(authorizedCaller);
        for (uint256 i = 0; i < 3; i++) {
            remixLicensing.registerStory(storyIds[i], creator, licenseTypes[i]);
        }
        vm.stopPrank();

        // Test license fees
        for (uint256 i = 0; i < 3; i++) {
            (uint256 fee, string memory licenseType) = remixLicensing.getLicenseFee(storyIds[i]);
            assertEq(fee, expectedFees[i]);
            assertEq(licenseType, licenseTypes[i]);
        }
    }
}
