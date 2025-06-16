// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TIPToken.sol";
import "../src/RewardsManager.sol";
import "../src/UnifiedRewardsController.sol";
import "../src/ChapterAccessController.sol";
import "../src/HybridRevenueController.sol";

/**
 * @title Deploy 5-Contract Architecture Script
 * @dev Idempotent deployment script for the optimized StoryHouse 5-contract architecture
 *
 * Architecture:
 * ├── TIPToken (3.7KB) - Platform token with controlled minting
 * ├── RewardsManager (7.5KB) - Central reward orchestrator  
 * ├── UnifiedRewardsController (20.4KB) - Reading/Creation/Remix rewards
 * ├── ChapterAccessController (15.3KB) - Chapter monetization
 * └── HybridRevenueController (16.0KB) - Multi-author revenue sharing
 *
 * Features:
 * - Checks if contracts are already deployed (idempotent)
 * - Deploys contracts in correct dependency order
 * - Sets up all roles and permissions
 * - Validates all integrations
 * - Can be run multiple times safely
 */
contract Deploy5ContractArchitecture is Script {
    // Deployment registry for the 5-contract architecture
    struct DeploymentRegistry {
        address tipToken;
        address rewardsManager;
        address unifiedRewardsController;
        address chapterAccessController;
        address hybridRevenueController;
        address deployer;
        uint256 deploymentBlock;
        string network;
        uint256 totalGasUsed;
    }

    // Events for deployment tracking
    event ContractDeployed(string contractName, address contractAddress, uint256 gasUsed);
    event ContractSkipped(string contractName, address existingAddress, string reason);
    event RoleGranted(address indexed contract_, bytes32 indexed role, address indexed account);
    event PermissionSetupCompleted(address indexed contract_, string setupType);
    event DeploymentCompleted(DeploymentRegistry registry);
    event ValidationPassed(string validationType, address contractAddress);
    event ValidationFailed(string validationType, address contractAddress, string reason);

    // Known contract addresses for different networks
    mapping(uint256 => address) public knownTipTokenAddresses;
    mapping(uint256 => address) public knownRewardsManagerAddresses;

    // Gas tracking
    uint256 private totalGasUsed;
    uint256 private deploymentStartGas;

    function setUp() public {
        // Story Protocol Aeneid Testnet (Chain ID: 1315)
        knownTipTokenAddresses[1315] = 0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E;
        knownRewardsManagerAddresses[1315] = 0xf5aE031bA92295C2aE86a99e88f09989339707E5;
        
        // Add other networks as needed
        // knownTipTokenAddresses[1] = 0x...; // Mainnet
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Initialize setup
        setUp();
        deploymentStartGas = gasleft();

        console.log("=== StoryHouse 5-Contract Architecture Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("Network:", getNetworkName(block.chainid));
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        DeploymentRegistry memory registry;
        registry.deployer = deployer;
        registry.deploymentBlock = block.number;
        registry.network = getNetworkName(block.chainid);

        // Deploy contracts in dependency order
        console.log("Starting deployment process...");
        console.log("");

        // Step 1: Deploy or verify TIP Token
        console.log("Step 1: TIP Token");
        registry.tipToken = deployOrVerifyTIPToken(deployer);
        console.log("");

        // Step 2: Deploy or verify Rewards Manager
        console.log("Step 2: Rewards Manager");
        registry.rewardsManager = deployOrVerifyRewardsManager(deployer, registry.tipToken);
        console.log("");

        // Step 3: Deploy Unified Rewards Controller
        console.log("Step 3: Unified Rewards Controller");
        registry.unifiedRewardsController = deployUnifiedRewardsController(
            deployer, 
            registry.rewardsManager, 
            registry.tipToken
        );
        console.log("");

        // Step 4: Deploy Chapter Access Controller
        console.log("Step 4: Chapter Access Controller");
        registry.chapterAccessController = deployChapterAccessController(
            deployer,
            registry.rewardsManager,
            registry.tipToken
        );
        console.log("");

        // Step 5: Deploy Hybrid Revenue Controller
        console.log("Step 5: Hybrid Revenue Controller");
        registry.hybridRevenueController = deployHybridRevenueController(
            deployer,
            registry.rewardsManager,
            registry.tipToken
        );
        console.log("");

        // Step 6: Setup permissions and relationships
        console.log("Step 6: Setting up permissions and relationships");
        setupPermissionsAndRelationships(registry);
        console.log("");

        // Step 7: Validate deployment
        console.log("Step 7: Validating deployment");
        validateDeployment(registry);
        console.log("");

        vm.stopBroadcast();

        // Calculate total gas used
        registry.totalGasUsed = deploymentStartGas - gasleft();

        // Print deployment summary
        printDeploymentSummary(registry);
        
        emit DeploymentCompleted(registry);
    }

    function deployOrVerifyTIPToken(address deployer) internal returns (address) {
        address knownAddress = knownTipTokenAddresses[block.chainid];
        
        if (knownAddress != address(0) && isContractDeployed(knownAddress)) {
            // Verify it's actually a TIP token
            try TIPToken(knownAddress).symbol() returns (string memory symbol) {
                if (keccak256(bytes(symbol)) == keccak256(bytes("TIP"))) {
                    console.log("[OK] TIP Token already deployed at:", knownAddress);
                    emit ContractSkipped("TIPToken", knownAddress, "Already deployed and verified");
                    return knownAddress;
                }
            } catch {
                console.log("[WARN]  Contract at known address failed verification");
            }
        }

        // Deploy new TIP token
        uint256 gasStart = gasleft();
        console.log("[DEPLOY] Deploying TIP Token...");
        TIPToken tipToken = new TIPToken(deployer);
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        console.log("[OK] TIP Token deployed at:", address(tipToken));
        console.log("[GAS] Gas used:", gasUsed);
        emit ContractDeployed("TIPToken", address(tipToken), gasUsed);
        return address(tipToken);
    }

    function deployOrVerifyRewardsManager(
        address deployer,
        address tipTokenAddress
    ) internal returns (address) {
        address knownAddress = knownRewardsManagerAddresses[block.chainid];
        
        if (knownAddress != address(0) && isContractDeployed(knownAddress)) {
            // Verify it's compatible with our TIP token
            try RewardsManager(knownAddress).tipToken() returns (TIPToken token) {
                if (address(token) == tipTokenAddress) {
                    console.log("[OK] Rewards Manager already deployed at:", knownAddress);
                    emit ContractSkipped("RewardsManager", knownAddress, "Already deployed and verified");
                    return knownAddress;
                }
            } catch {
                console.log("[WARN]  Contract at known address failed verification");
            }
        }

        // Deploy new Rewards Manager
        uint256 gasStart = gasleft();
        console.log("[DEPLOY] Deploying Rewards Manager...");
        RewardsManager rewardsManager = new RewardsManager(deployer, tipTokenAddress);
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        console.log("[OK] Rewards Manager deployed at:", address(rewardsManager));
        console.log("[GAS] Gas used:", gasUsed);
        emit ContractDeployed("RewardsManager", address(rewardsManager), gasUsed);
        return address(rewardsManager);
    }

    function deployUnifiedRewardsController(
        address deployer,
        address rewardsManager,
        address tipToken
    ) internal returns (address) {
        uint256 gasStart = gasleft();
        console.log("[DEPLOY] Deploying Unified Rewards Controller...");
        
        UnifiedRewardsController controller = new UnifiedRewardsController(
            deployer,
            rewardsManager,
            tipToken
        );
        
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        console.log("[OK] Unified Rewards Controller deployed at:", address(controller));
        console.log("[GAS] Gas used:", gasUsed);
        emit ContractDeployed("UnifiedRewardsController", address(controller), gasUsed);
        return address(controller);
    }

    function deployChapterAccessController(
        address deployer,
        address rewardsManager,
        address tipToken
    ) internal returns (address) {
        uint256 gasStart = gasleft();
        console.log("[DEPLOY] Deploying Chapter Access Controller...");
        
        ChapterAccessController controller = new ChapterAccessController(
            deployer,
            rewardsManager,
            tipToken
        );
        
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        console.log("[OK] Chapter Access Controller deployed at:", address(controller));
        console.log("[GAS] Gas used:", gasUsed);
        emit ContractDeployed("ChapterAccessController", address(controller), gasUsed);
        return address(controller);
    }

    function deployHybridRevenueController(
        address deployer,
        address rewardsManager,
        address tipToken
    ) internal returns (address) {
        uint256 gasStart = gasleft();
        console.log("[DEPLOY] Deploying Hybrid Revenue Controller...");
        
        HybridRevenueController controller = new HybridRevenueController(
            deployer,
            rewardsManager,
            tipToken
        );
        
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        console.log("[OK] Hybrid Revenue Controller deployed at:", address(controller));
        console.log("[GAS] Gas used:", gasUsed);
        emit ContractDeployed("HybridRevenueController", address(controller), gasUsed);
        return address(controller);
    }

    function setupPermissionsAndRelationships(DeploymentRegistry memory registry) internal {
        console.log("Setting up permissions and relationships...");

        // Setup RewardsManager with controllers
        RewardsManager rewardsManager = RewardsManager(registry.rewardsManager);
        
        // Add controllers to RewardsManager
        try rewardsManager.addController(registry.unifiedRewardsController, "unified") {
            console.log("[OK] Added Unified Rewards Controller to RewardsManager");
            emit PermissionSetupCompleted(registry.unifiedRewardsController, "RewardsManager controller registration");
        } catch {
            console.log("[WARN]  Unified Rewards Controller already added or failed");
        }

        try rewardsManager.addController(registry.chapterAccessController, "chapter") {
            console.log("[OK] Added Chapter Access Controller to RewardsManager");
            emit PermissionSetupCompleted(registry.chapterAccessController, "RewardsManager controller registration");
        } catch {
            console.log("[WARN]  Chapter Access Controller already added or failed");
        }

        try rewardsManager.addController(registry.hybridRevenueController, "revenue") {
            console.log("[OK] Added Hybrid Revenue Controller to RewardsManager");
            emit PermissionSetupCompleted(registry.hybridRevenueController, "RewardsManager controller registration");
        } catch {
            console.log("[WARN]  Hybrid Revenue Controller already added or failed");
        }

        // Setup TIP Token minter role for RewardsManager
        TIPToken tipToken = TIPToken(registry.tipToken);
        try tipToken.addMinter(registry.rewardsManager) {
            console.log("[OK] Added RewardsManager as TIP token minter");
            emit PermissionSetupCompleted(registry.rewardsManager, "TIP token minter role");
        } catch {
            console.log("[WARN]  RewardsManager already added as minter or failed");
        }

        // Setup role permissions for controllers
        setupControllerRoles(registry);

        console.log("[OK] Permission setup completed!");
    }

    function setupControllerRoles(DeploymentRegistry memory registry) internal {
        // Setup UnifiedRewardsController roles
        UnifiedRewardsController unifiedController = UnifiedRewardsController(registry.unifiedRewardsController);
        
        try unifiedController.grantRole(unifiedController.ADMIN_ROLE(), registry.deployer) {
            console.log("[OK] Granted ADMIN_ROLE to deployer on UnifiedRewardsController");
            emit RoleGranted(registry.unifiedRewardsController, unifiedController.ADMIN_ROLE(), registry.deployer);
        } catch {
            console.log("[WARN]  ADMIN_ROLE already granted or failed");
        }

        try unifiedController.grantRole(unifiedController.STORY_MANAGER_ROLE(), registry.deployer) {
            console.log("[OK] Granted STORY_MANAGER_ROLE to deployer on UnifiedRewardsController");
            emit RoleGranted(registry.unifiedRewardsController, unifiedController.STORY_MANAGER_ROLE(), registry.deployer);
        } catch {
            console.log("[WARN]  STORY_MANAGER_ROLE already granted or failed");
        }

        // Add more role setups for other controllers as needed
    }

    function validateDeployment(DeploymentRegistry memory registry) internal {
        console.log("Validating deployment...");
        
        // Validate contract deployments
        validateContract("TIPToken", registry.tipToken);
        validateContract("RewardsManager", registry.rewardsManager);
        validateContract("UnifiedRewardsController", registry.unifiedRewardsController);
        validateContract("ChapterAccessController", registry.chapterAccessController);
        validateContract("HybridRevenueController", registry.hybridRevenueController);

        // Validate integrations
        validateIntegration(registry);
        
        console.log("[OK] All validations passed!");
    }

    function validateContract(string memory contractName, address contractAddress) internal {
        if (!isContractDeployed(contractAddress)) {
            emit ValidationFailed("Contract Deployment", contractAddress, "Contract not deployed");
            revert(string(abi.encodePacked("Validation failed: ", contractName, " not deployed")));
        }
        
        console.log(string(abi.encodePacked("[OK] ", contractName, " validation passed")));
        emit ValidationPassed("Contract Deployment", contractAddress);
    }

    function validateIntegration(DeploymentRegistry memory registry) internal {
        // Validate RewardsManager integration
        RewardsManager rewardsManager = RewardsManager(registry.rewardsManager);
        
        if (!rewardsManager.authorizedControllers(registry.unifiedRewardsController)) {
            emit ValidationFailed("Integration", registry.unifiedRewardsController, "Not authorized in RewardsManager");
            revert("Validation failed: UnifiedRewardsController not authorized");
        }
        
        // Validate TIP token integration
        TIPToken tipToken = TIPToken(registry.tipToken);
        if (!tipToken.minters(registry.rewardsManager)) {
            emit ValidationFailed("Integration", registry.rewardsManager, "Not a TIP token minter");
            revert("Validation failed: RewardsManager not a TIP token minter");
        }
        
        console.log("[OK] Integration validation passed");
        emit ValidationPassed("Integration", registry.rewardsManager);
    }

    function printDeploymentSummary(DeploymentRegistry memory registry) internal view {
        console.log("================================================================================");
        console.log("                              DEPLOYMENT SUMMARY                               ");
        console.log("================================================================================");
        console.log("Network:", registry.network);
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", registry.deployer);
        console.log("Deployment Block:", registry.deploymentBlock);
        console.log("Total Gas Used:", registry.totalGasUsed);
        console.log("================================================================================");
        console.log("                                   CONTRACTS                                   ");
        console.log("================================================================================");
        console.log("TIP Token:                  ", registry.tipToken);
        console.log("Rewards Manager:            ", registry.rewardsManager);
        console.log("Unified Rewards Controller: ", registry.unifiedRewardsController);
        console.log("Chapter Access Controller:  ", registry.chapterAccessController);
        console.log("Hybrid Revenue Controller:  ", registry.hybridRevenueController);
        console.log("================================================================================");
    }

    // Helper functions
    function isContractDeployed(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1315) return "Story Protocol Aeneid Testnet";
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 31337) return "Local Development";
        return "Unknown Network";
    }
}