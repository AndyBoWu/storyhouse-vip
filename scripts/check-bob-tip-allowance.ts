import { createPublicClient, http, formatEther } from 'viem';

const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E';
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const TIP_ABI = [
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

async function main() {
  try {
    console.log('🔍 Checking Bob\'s TIP token allowance for HybridRevenueControllerV2');
    console.log('👤 Bob:', BOB_ADDRESS);
    console.log('💰 TIP Token:', TIP_TOKEN_ADDRESS);
    console.log('📄 Spender (HybridRevenueControllerV2):', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    console.log('');
    
    const allowance = await client.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_ABI,
      functionName: 'allowance',
      args: [
        BOB_ADDRESS as `0x${string}`, 
        HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`
      ],
    });
    
    console.log('✅ Current Allowance:', formatEther(allowance), 'TIP');
    console.log('📝 Required for unlock:', '0.5 TIP');
    console.log('');
    
    if (Number(formatEther(allowance)) < 0.5) {
      console.log('❌ INSUFFICIENT ALLOWANCE!');
      console.log('   Bob needs to approve at least 0.5 TIP for the contract to spend');
      console.log('   This could be why the unlock is failing');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('   The frontend should check and request approval before attempting unlock');
    } else {
      console.log('✅ Allowance is sufficient for unlocking');
      console.log('   The error must be from a different cause');
    }
    
    // Also check if the addresses are checksummed correctly
    console.log('\n📋 Address Checksum Verification:');
    console.log('   TIP Token checksummed:', TIP_TOKEN_ADDRESS);
    console.log('   Contract checksummed:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    
  } catch (error) {
    console.error('❌ Error checking allowance:', error);
  }
}

main();