#!/bin/bash

echo "🚀 StoryHouse Smart Contract Deployment"
echo "======================================="

# Show help if requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage:"
    echo "  ./deploy.sh v2              Deploy HybridRevenueControllerV2"
    echo "  ./deploy.sh                 Deploy minimal 2-contract architecture"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh v2              Deploy HybridRevenueControllerV2 (permissionless)"
    echo "  ./deploy.sh                 Deploy full architecture"
    exit 0
fi

# Deployment mode selection
if [ "$1" = "v2" ] || [ "$1" = "minimal" ]; then
    echo "Deploying HybridRevenueControllerV2 (Permissionless Version)"
    DEPLOY_MODE="v2"
    SCRIPT_NAME="DeployMinimal.s.sol"
    ARCHITECTURE="2-contract-minimal"
else
    echo "Deploying the minimal 2-contract architecture"
    DEPLOY_MODE="minimal"
    SCRIPT_NAME="DeployMinimal.s.sol"
    ARCHITECTURE="2-contract-minimal"
fi
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "foundry.toml" ]; then
    echo -e "${RED}❌ Error: Run this script from the contracts directory${NC}"
    exit 1
fi

# Check for required tools
if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Error: Foundry is not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is not installed (needed for JSON parsing)${NC}"
    exit 1
fi

# Network configuration
NETWORK="story_testnet"
RPC_URL="https://aeneid.storyrpc.io"
CHAIN_ID=1315
GAS_PRICE="2000000000" # 2 Gwei
EXPLORER="https://aeneid.storyscan.xyz"

echo -e "${BLUE}📡 Network Configuration:${NC}"
echo "   Network: Story Protocol Aeneid Testnet"
echo "   Chain ID: $CHAIN_ID"
echo "   RPC URL: $RPC_URL"
echo "   Gas Price: 2 Gwei"
echo "   Explorer: $EXPLORER"
echo ""

# Prompt for private key
echo -e "${YELLOW}🔐 Please enter your private key (without 0x prefix):${NC}"
read -s PRIVATE_KEY

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: Private key cannot be empty${NC}"
    exit 1
fi

# Add 0x prefix if not present
if [[ ! "$PRIVATE_KEY" =~ ^0x ]]; then
    PRIVATE_KEY="0x$PRIVATE_KEY"
fi

export PRIVATE_KEY

# Get deployer address
DEPLOYER_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Invalid private key${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployer Address: $DEPLOYER_ADDRESS${NC}"

# Check deployer balance
echo -e "${BLUE}💰 Checking deployer balance...${NC}"
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast from-wei $BALANCE)
echo "   Balance: $BALANCE_ETH ETH"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}❌ Error: Deployer has no balance${NC}"
    exit 1
fi

echo ""
if [ "$DEPLOY_MODE" = "v2" ]; then
    echo -e "${YELLOW}⚡ Starting HybridRevenueControllerV2 Deployment...${NC}"
    echo -e "${BLUE}📋 What will be deployed:${NC}"
    echo "   • TIP Token (already deployed)"
    echo "   • HybridRevenueControllerV2 (NEW - permissionless with all features)"
else
    echo -e "${YELLOW}⚡ Starting 2-Contract Architecture Deployment...${NC}"
fi
echo ""

# Run the deployment script
echo -e "${BLUE}🔨 Running deployment script...${NC}"
if [ "$DEPLOY_MODE" = "v2" ] || [ "$DEPLOY_MODE" = "v2-full" ]; then
    # Temporarily rename problematic contracts that depend on removed RewardsManager
    if [ -f "src/HybridRevenueController.sol" ]; then
        mv src/HybridRevenueController.sol src/HybridRevenueController.sol.bak
        V1_RENAMED=true
    fi
    if [ -f "src/HybridRevenueControllerV2.sol" ]; then
        mv src/HybridRevenueControllerV2.sol src/HybridRevenueControllerV2.sol.bak
        V2_ORIG_RENAMED=true
    fi
    
    DEPLOY_OUTPUT=$(PRIVATE_KEY=$PRIVATE_KEY forge script script/$SCRIPT_NAME \
        --rpc-url $NETWORK \
        --broadcast \
        --gas-price $GAS_PRICE \
        --legacy \
        --json 2>&1)
    
    # Restore renamed files
    if [ "$V1_RENAMED" = true ]; then
        mv src/HybridRevenueController.sol.bak src/HybridRevenueController.sol
    fi
    if [ "$V2_ORIG_RENAMED" = true ]; then
        mv src/HybridRevenueControllerV2.sol.bak src/HybridRevenueControllerV2.sol
    fi
else
    DEPLOY_OUTPUT=$(PRIVATE_KEY=$PRIVATE_KEY forge script script/$SCRIPT_NAME \
        --rpc-url $NETWORK \
        --broadcast \
        --gas-price $GAS_PRICE \
        --legacy \
        --json 2>&1)
fi

DEPLOY_EXIT_CODE=$?

# Check if deployment was successful
if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ Deployment script executed successfully${NC}"

# Parse deployment results
echo ""
echo -e "${BLUE}📋 Parsing deployment results...${NC}"

# Try to extract addresses from broadcast file
if [ "$DEPLOY_MODE" = "v2" ]; then
    BROADCAST_FILE="broadcast/DeployMinimal.s.sol/$CHAIN_ID/run-latest.json"
else
    BROADCAST_FILE="broadcast/Deploy.s.sol/$CHAIN_ID/run-latest.json"
fi

if [ -f "$BROADCAST_FILE" ]; then
    # Extract contract addresses from the broadcast file
    echo -e "${GREEN}✅ Found broadcast file${NC}"
    
    # We'll parse the transactions to find deployed contracts
    # This is a simplified approach - you might need to adjust based on actual output
else
    echo -e "${YELLOW}⚠️  Could not find broadcast file, checking logs...${NC}"
fi

# Create deployment summary file
DEPLOYMENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
DEPLOYMENT_BLOCK=$(cast block-number --rpc-url $RPC_URL)

echo ""
echo -e "${BLUE}💾 Creating deployment summary...${NC}"

cat > deployment-result.json << EOF
{
  "deployment": {
    "timestamp": "$DEPLOYMENT_DATE",
    "block": "$DEPLOYMENT_BLOCK",
    "network": "story-protocol-aeneid",
    "chainId": $CHAIN_ID,
    "deployer": "$DEPLOYER_ADDRESS",
    "architecture": "$ARCHITECTURE",
    "status": "completed"
  },
  "contracts": {
    "note": "Check broadcast/Deploy5ContractArchitecture.s.sol/$CHAIN_ID/run-latest.json for addresses"
  },
  "next_steps": [
    "1. Verify contracts on StoryScan explorer",
    "2. Update backend environment variables",
    "3. Update frontend contract configurations",
    "4. Run integration tests",
    "5. Deprecate legacy contracts"
  ]
}
EOF

# Clear sensitive data
unset PRIVATE_KEY

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   Architecture: $ARCHITECTURE"
echo "   Network: Story Protocol Aeneid Testnet"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo "   Block: $DEPLOYMENT_BLOCK"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
if [ "$DEPLOY_MODE" = "v2" ]; then
    echo "   1. Check broadcast file for V2 contract address:"
    echo "      $BROADCAST_FILE"
    echo "   2. Update apps/backend/.env.local with:"
    echo "      HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=<new_address>"
    echo "   3. Update apps/frontend/.env.local with:"
    echo "      NEXT_PUBLIC_HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=<new_address>"
    echo "   4. Restart frontend development server"
    echo "   5. Test permissionless book registration"
    echo "   6. Verify V2 contract on StoryScan"
else
    echo "   1. Check broadcast file for contract addresses:"
    echo "      $BROADCAST_FILE"
    echo "   2. Verify contracts on StoryScan"
    echo "   3. Update application configurations"
    echo "   4. Run integration tests"
fi
echo ""
echo -e "${GREEN}✅ Deployment successful! Check deployment-result.json for details.${NC}"