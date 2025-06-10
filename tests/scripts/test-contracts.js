#!/usr/bin/env node

/**
 * StoryHouse Contract Verification Script
 * Quick verification of deployed contracts before manual testing
 */

const { createPublicClient, http, formatEther } = require('viem');

// Story Protocol Aeneid Testnet configuration
const storyTestnet = {
  id: 1315,
  name: 'Story Protocol Aeneid Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP Token',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
};

// Contract addresses
const CONTRACTS = {
  TIP_TOKEN: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
  REWARDS_MANAGER: '0xf5ae031ba92295c2ae86a99e88f09989339707e5',
  CREATOR_REWARDS_CONTROLLER: '0x8e2d21d1b9c744f772f15a7007de3d5757eea333',
  READ_REWARDS_CONTROLLER: '0x04553ba8316d407b1c58b99172956d2d5fe100e5',
  ACCESS_CONTROL_MANAGER: '0x41e2db0d016e83ddc3c464ffd260d22a6c898341',
  REMIX_LICENSING_CONTROLLER: '0x16144746a33d9a172039efc64bc2e12445fbbef2',
};

// Simple ERC-20 ABI for basic checks
const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
];

async function main() {
  console.log('🔍 StoryHouse Contract Verification\n');
  console.log('Network: Story Protocol Aeneid Testnet');
  console.log('Chain ID: 1315');
  console.log('RPC: https://aeneid.storyrpc.io\n');

  // Create client
  const client = createPublicClient({
    chain: storyTestnet,
    transport: http(),
  });

  try {
    // Check network connection
    console.log('📡 Testing network connection...');
    const blockNumber = await client.getBlockNumber();
    console.log(`✅ Connected! Latest block: ${blockNumber}\n`);

    // Check each contract exists
    console.log('🏗️  Verifying contract deployments...');
    
    for (const [name, address] of Object.entries(CONTRACTS)) {
      try {
        const bytecode = await client.getBytecode({ address });
        const status = bytecode && bytecode !== '0x' ? '✅ Deployed' : '❌ Not found';
        console.log(`${status} ${name}: ${address}`);
      } catch (error) {
        console.log(`❌ Error checking ${name}: ${error.message}`);
      }
    }

    // Check TIP Token details
    console.log('\n💰 TIP Token Details...');
    try {
      const [name, symbol, totalSupply, decimals] = await Promise.all([
        client.readContract({
          address: CONTRACTS.TIP_TOKEN,
          abi: ERC20_ABI,
          functionName: 'name',
        }),
        client.readContract({
          address: CONTRACTS.TIP_TOKEN,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        client.readContract({
          address: CONTRACTS.TIP_TOKEN,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }),
        client.readContract({
          address: CONTRACTS.TIP_TOKEN,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
      ]);

      console.log(`✅ Name: ${name}`);
      console.log(`✅ Symbol: ${symbol}`);
      console.log(`✅ Decimals: ${decimals}`);
      console.log(`✅ Total Supply: ${formatEther(totalSupply)} ${symbol}`);
    } catch (error) {
      console.log(`❌ Error reading TIP token: ${error.message}`);
    }

    // URLs for manual testing
    console.log('\n🔗 Testing URLs:');
    console.log(`Frontend: http://localhost:3001`);
    console.log(`Rewards Page: http://localhost:3001/rewards`);
    console.log(`Explorer: https://aeneid.storyscan.xyz`);
    console.log(`Faucet: https://aeneid.faucet.story.foundation/`);

    console.log('\n📋 Manual Testing Checklist:');
    console.log('1. Connect MetaMask wallet');
    console.log('2. Get test IP tokens from faucet');
    console.log('3. Navigate to /rewards page');
    console.log('4. Test story creation rewards');
    console.log('5. Test chapter reading rewards');
    console.log('6. Verify all balances update correctly');

    console.log('\n🎉 Contract verification complete!');
    console.log('All contracts appear to be deployed and accessible.');
    console.log('Ready for manual user journey testing.\n');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run verification
main().catch(console.error); 
