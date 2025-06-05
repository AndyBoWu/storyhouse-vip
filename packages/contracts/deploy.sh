#!/bin/bash

echo "🚀 TIP Token Deployment Script"
echo "================================"

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
echo "🔧 Deploying TIP Token to Story Protocol Aeneid Testnet..."
echo "📡 RPC: https://aeneid.storyrpc.io"
echo "⛽ Gas: 2 Gwei (network shows ~1.5 Gwei, using 2 Gwei for fast confirmation)"
echo "📦 Using legacy transaction format for compatibility"
echo ""

# Run the deployment with 2 gwei gas price and legacy transaction format
forge script script/DeployTIPToken.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy

# Store the exit code
DEPLOY_EXIT_CODE=$?

# Clear the private key from environment
unset PRIVATE_KEY

echo ""
if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "📝 Remember to:"
    echo "   1. Note the contract address from the output above"
    echo "   2. Update your frontend configuration with the new address"
    echo "   3. Verify the contract on the explorer if needed"
else
    echo "❌ Deployment failed with exit code $DEPLOY_EXIT_CODE"
fi

echo ""
echo "🔐 Private key has been cleared from memory" 
