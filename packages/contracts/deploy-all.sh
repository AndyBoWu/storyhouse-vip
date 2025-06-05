#!/bin/bash

echo "🚀 StoryHouse Complete Deployment Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "foundry.toml" ]; then
    echo "❌ Error: Run this script from the contracts directory"
    exit 1
fi

# Prompt for private key securely
echo "Please enter your private key (without 0x prefix):"
read -s PRIVATE_KEY

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: Private key cannot be empty"
    exit 1
fi

export PRIVATE_KEY

echo ""
echo "🔧 Deploying all StoryHouse contracts to Story Protocol Aeneid Testnet..."
echo "📡 RPC: https://aeneid.storyrpc.io"
echo "⛽ Gas: 2 Gwei"
echo "📦 Using legacy transaction format for compatibility"
echo ""

# Initialize deployment tracking
DEPLOYMENT_SUMMARY="🎉 STORYHOUSE DEPLOYMENT COMPLETE 🎉\n"
DEPLOYMENT_SUMMARY+="\n📊 Contract Addresses Summary:\n"
DEPLOYMENT_SUMMARY+="═══════════════════════════════════════════════════════════════\n"

# Define known TIP Token address
TIP_TOKEN_ADDRESS="0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E"

echo "Step 1: Verifying TIP Token..."
cast call $TIP_TOKEN_ADDRESS "symbol()" --rpc-url https://aeneid.storyrpc.io > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TIP Token already deployed at: $TIP_TOKEN_ADDRESS"
    DEPLOY_TIP=false
    DEPLOYMENT_SUMMARY+="🪙 TIP Token:                    $TIP_TOKEN_ADDRESS\n"
else
    echo "🚀 TIP Token needs deployment"
    DEPLOY_TIP=true
fi

# Step 1: Deploy TIP Token (if needed)
if [ "$DEPLOY_TIP" = true ]; then
    echo ""
    echo "🚀 Deploying TIP Token..."
    TIP_RESULT=$(forge script script/DeployTIPToken.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ TIP Token deployment completed"
        # Extract address from output
        TIP_TOKEN_ADDRESS=$(echo "$TIP_RESULT" | grep -o "0x[a-fA-F0-9]\{40\}" | head -1)
        echo "📍 TIP Token Address: $TIP_TOKEN_ADDRESS"
        DEPLOYMENT_SUMMARY+="🪙 TIP Token:                    $TIP_TOKEN_ADDRESS\n"
    else
        echo "❌ TIP Token deployment failed"
        echo "$TIP_RESULT"
        exit 1
    fi
fi

# Export for use in other deployments
export TIP_TOKEN_ADDRESS

echo ""
echo "Step 2: Deploying Access Control Manager..."
ACM_RESULT=$(forge script script/DeployAccessControlManager.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Access Control Manager deployed"
    ACCESS_CONTROL_ADDRESS=$(echo "$ACM_RESULT" | grep "Contract Address:" | grep -o "0x[a-fA-F0-9]\{40\}")
    DEPLOYMENT_SUMMARY+="🛡️  Access Control Manager:      $ACCESS_CONTROL_ADDRESS\n"
    export ACCESS_CONTROL_ADDRESS
else
    echo "❌ Access Control Manager deployment failed"
    echo "$ACM_RESULT"
    exit 1
fi

echo ""
echo "Step 3: Deploying Rewards Manager..."
RM_RESULT=$(forge script script/DeployRewardsManager.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Rewards Manager deployed"
    REWARDS_MANAGER_ADDRESS=$(echo "$RM_RESULT" | grep "Contract Address:" | grep -o "0x[a-fA-F0-9]\{40\}")
    DEPLOYMENT_SUMMARY+="🎯 Rewards Manager:              $REWARDS_MANAGER_ADDRESS\n"
    export REWARDS_MANAGER_ADDRESS
else
    echo "❌ Rewards Manager deployment failed"
    echo "$RM_RESULT"
    exit 1
fi

echo ""
echo "Step 4: Deploying Creator Rewards Controller..."
CRC_RESULT=$(forge script script/DeployCreatorRewardsController.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Creator Rewards Controller deployed"
    CREATOR_CONTROLLER_ADDRESS=$(echo "$CRC_RESULT" | grep "Contract Address:" | grep -o "0x[a-fA-F0-9]\{40\}")
    DEPLOYMENT_SUMMARY+="👨‍💼 Creator Rewards Controller:    $CREATOR_CONTROLLER_ADDRESS\n"
    export CREATOR_CONTROLLER_ADDRESS
else
    echo "❌ Creator Rewards Controller deployment failed"
    echo "$CRC_RESULT"
    exit 1
fi

echo ""
echo "Step 5: Deploying Read Rewards Controller..."
RRC_RESULT=$(forge script script/DeployReadRewardsController.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Read Rewards Controller deployed"
    READ_CONTROLLER_ADDRESS=$(echo "$RRC_RESULT" | grep "Contract Address:" | grep -o "0x[a-fA-F0-9]\{40\}")
    DEPLOYMENT_SUMMARY+="📖 Read Rewards Controller:      $READ_CONTROLLER_ADDRESS\n"
    export READ_CONTROLLER_ADDRESS
else
    echo "❌ Read Rewards Controller deployment failed"
    echo "$RRC_RESULT"
    exit 1
fi

echo ""
echo "Step 6: Deploying Remix Licensing Controller..."
RLC_RESULT=$(forge script script/DeployRemixLicensingController.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Remix Licensing Controller deployed"
    REMIX_CONTROLLER_ADDRESS=$(echo "$RLC_RESULT" | grep "Contract Address:" | grep -o "0x[a-fA-F0-9]\{40\}")
    DEPLOYMENT_SUMMARY+="🎭 Remix Licensing Controller:   $REMIX_CONTROLLER_ADDRESS\n"
    export REMIX_CONTROLLER_ADDRESS
else
    echo "❌ Remix Licensing Controller deployment failed"
    echo "$RLC_RESULT"
    exit 1
fi

# Save deployment info to JSON file
echo ""
echo "💾 Saving deployment information..."
DEPLOYMENT_DATE=$(date +"%Y-%m-%d")
DEPLOYER_ADDRESS="0xD9b6d1bd7D8A90915B905EB801c55bA5De1d4476"

cat > deployments.json << EOF
{
  "networks": {
    "story-protocol-aeneid": {
      "chainId": 1315,
      "rpcUrl": "https://aeneid.storyrpc.io",
      "explorer": "https://aeneid.storyscan.xyz",
      "deployer": "$DEPLOYER_ADDRESS",
      "deploymentDate": "$DEPLOYMENT_DATE",
      "contracts": {
        "TIPToken": {
          "address": "$TIP_TOKEN_ADDRESS",
          "status": "deployed"
        },
        "AccessControlManager": {
          "address": "$ACCESS_CONTROL_ADDRESS",
          "status": "deployed"
        },
        "RewardsManager": {
          "address": "$REWARDS_MANAGER_ADDRESS",
          "status": "deployed",
          "dependencies": {
            "tipToken": "$TIP_TOKEN_ADDRESS"
          }
        },
        "CreatorRewardsController": {
          "address": "$CREATOR_CONTROLLER_ADDRESS",
          "status": "deployed",
          "needsConfiguration": true,
          "dependencies": {
            "rewardsManager": "$REWARDS_MANAGER_ADDRESS"
          }
        },
        "ReadRewardsController": {
          "address": "$READ_CONTROLLER_ADDRESS",
          "status": "deployed",
          "needsConfiguration": true,
          "dependencies": {
            "rewardsManager": "$REWARDS_MANAGER_ADDRESS"
          }
        },
        "RemixLicensingController": {
          "address": "$REMIX_CONTROLLER_ADDRESS",
          "status": "deployed",
          "needsConfiguration": true,
          "dependencies": {
            "rewardsManager": "$REWARDS_MANAGER_ADDRESS",
            "tipToken": "$TIP_TOKEN_ADDRESS"
          }
        }
      },
      "summary": {
        "totalContracts": 6,
        "allDeployed": true,
        "needsConfiguration": true
      }
    }
  }
}
EOF

# Create .env file for easy access
echo ""
echo "📝 Creating .env file with addresses..."
cat > .env.deployed << EOF
# StoryHouse Contract Addresses - Story Protocol Aeneid Testnet
# Generated on $DEPLOYMENT_DATE

# Core Token
TIP_TOKEN_ADDRESS=$TIP_TOKEN_ADDRESS

# Access Control
ACCESS_CONTROL_MANAGER_ADDRESS=$ACCESS_CONTROL_ADDRESS

# Rewards System
REWARDS_MANAGER_ADDRESS=$REWARDS_MANAGER_ADDRESS
CREATOR_REWARDS_CONTROLLER_ADDRESS=$CREATOR_CONTROLLER_ADDRESS
READ_REWARDS_CONTROLLER_ADDRESS=$READ_CONTROLLER_ADDRESS
REMIX_LICENSING_CONTROLLER_ADDRESS=$REMIX_CONTROLLER_ADDRESS

# Network Configuration
STORY_PROTOCOL_RPC_URL=https://aeneid.storyrpc.io
STORY_PROTOCOL_CHAIN_ID=1315
STORY_PROTOCOL_EXPLORER=https://aeneid.storyscan.xyz

# Deployer
DEPLOYER_ADDRESS=$DEPLOYER_ADDRESS
EOF

# Clear private key
unset PRIVATE_KEY

# Final summary
echo ""
DEPLOYMENT_SUMMARY+="═══════════════════════════════════════════════════════════════\n"
DEPLOYMENT_SUMMARY+="📋 Network: Story Protocol Aeneid Testnet (Chain ID: 1315)\n"
DEPLOYMENT_SUMMARY+="👤 Deployer: $DEPLOYER_ADDRESS\n"
DEPLOYMENT_SUMMARY+="📅 Date: $DEPLOYMENT_DATE\n"
DEPLOYMENT_SUMMARY+="\n📁 Files Generated:\n"
DEPLOYMENT_SUMMARY+="   • deployments.json - Complete deployment registry\n"
DEPLOYMENT_SUMMARY+="   • .env.deployed - Environment variables\n"
DEPLOYMENT_SUMMARY+="\n⚠️  NEXT STEPS REQUIRED:\n"
DEPLOYMENT_SUMMARY+="   1. Run setup script to configure contract relationships\n"
DEPLOYMENT_SUMMARY+="   2. Update frontend configurations\n"
DEPLOYMENT_SUMMARY+="   3. Verify contracts on the explorer\n"
DEPLOYMENT_SUMMARY+="   4. Commit deployment files to GitHub\n"

echo -e "$DEPLOYMENT_SUMMARY"
echo ""
echo "🔐 Private key has been cleared from memory" 
