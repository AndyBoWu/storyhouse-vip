#!/bin/bash

echo "🔗 Setting Up StoryHouse Contract Relationships"
echo "=============================================="

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
echo "🔧 Setting up contract relationships on Story Protocol Aeneid Testnet..."
echo "📡 RPC: https://aeneid.storyrpc.io"
echo "⛽ Gas: 2 Gwei"
echo "📦 Using legacy transaction format for compatibility"
echo ""

# Run the setup script
forge script script/SetupContractRelationships.s.sol --rpc-url story_testnet --broadcast --gas-price 2000000000 --legacy

# Store the exit code
SETUP_EXIT_CODE=$?

# Clear the private key from environment
unset PRIVATE_KEY

echo ""
if [ $SETUP_EXIT_CODE -eq 0 ]; then
    echo "✅ Contract relationships setup completed successfully!"
    echo "📝 The StoryHouse ecosystem is now fully configured:"
    echo "   • RewardsManager can mint TIP tokens"
    echo "   • All controllers are authorized with RewardsManager"
    echo "   • Ready for reward distribution and licensing"
else
    echo "❌ Setup failed with exit code $SETUP_EXIT_CODE"
fi

echo ""
echo "🔐 Private key has been cleared from memory" 
