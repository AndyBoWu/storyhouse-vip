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

# Define known TIP Token address
TIP_TOKEN_ADDRESS="0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E"

echo "Step 1: Verifying TIP Token..."
cast call $TIP_TOKEN_ADDRESS "symbol()" --rpc-url https://aeneid.storyrpc.io > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TIP Token already deployed at: $TIP_TOKEN_ADDRESS"
    DEPLOY_TIP=false
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
        # Extract address from output (you'd need to parse this properly)
        TIP_TOKEN_ADDRESS=$(echo "$TIP_RESULT" | grep -o "0x[a-fA-F0-9]\{40\}" | head -1)
        echo "📍 TIP Token Address: $TIP_TOKEN_ADDRESS"
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
forge script script/DeployAccessControlManager.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy
if [ $? -eq 0 ]; then
    echo "✅ Access Control Manager deployed"
else
    echo "❌ Access Control Manager deployment failed"
fi

echo ""
echo "Step 3: Deploying Rewards Manager..."
forge script script/DeployRewardsManager.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy
if [ $? -eq 0 ]; then
    echo "✅ Rewards Manager deployed"
else
    echo "❌ Rewards Manager deployment failed"
fi

echo ""
echo "Step 4: Deploying Creator Rewards Controller..."
forge script script/DeployCreatorRewardsController.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy
if [ $? -eq 0 ]; then
    echo "✅ Creator Rewards Controller deployed"
else
    echo "❌ Creator Rewards Controller deployment failed"
fi

echo ""
echo "Step 5: Deploying Read Rewards Controller..."
forge script script/DeployReadRewardsController.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy
if [ $? -eq 0 ]; then
    echo "✅ Read Rewards Controller deployed"
else
    echo "❌ Read Rewards Controller deployment failed"
fi

echo ""
echo "Step 6: Deploying Remix Licensing Controller..."
forge script script/DeployRemixLicensingController.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy
if [ $? -eq 0 ]; then
    echo "✅ Remix Licensing Controller deployed"
else
    echo "❌ Remix Licensing Controller deployment failed"
fi

# Clear private key
unset PRIVATE_KEY

echo ""
echo "🎉 Deployment sequence completed!"
echo "📝 Next steps:"
echo "   1. Check deployment logs for contract addresses"
echo "   2. Update frontend configurations"
echo "   3. Setup contract permissions and relationships"
echo "   4. Verify contracts on the explorer"
echo ""
echo "🔐 Private key has been cleared from memory" 
