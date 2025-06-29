import { createPublicClient, http } from 'viem';

const BOB_ADDRESS = '0x71b93d154886c297F4B6e6219C47d378F6Ac6a70'; // Bob's actual address
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const TIP_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
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
    console.log('🔍 CHECKING BOB\'S TIP TOKEN STATUS');
    console.log('👤 Bob:', BOB_ADDRESS);
    console.log('📄 HybridRevenueControllerV2:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    console.log('🪙 TIP Token:', TIP_TOKEN_ADDRESS);
    console.log('');
    
    const balance = await client.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [BOB_ADDRESS as `0x${string}`],
    });
    
    const allowance = await client.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_TOKEN_ABI,
      functionName: 'allowance',
      args: [BOB_ADDRESS as `0x${string}`, HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`],
    });
    
    console.log('💰 Bob\'s TIP Balance:', Number(balance) / 1e18, 'TIP');
    console.log('🔓 Current Allowance:', Number(allowance) / 1e18, 'TIP');
    console.log('💸 Required for Chapter 8:', '0.5 TIP');
    console.log('');
    
    const hasEnoughBalance = balance >= 500000000000000000n; // 0.5 TIP
    const hasEnoughAllowance = allowance >= 500000000000000000n; // 0.5 TIP
    
    console.log('📊 STATUS:');
    console.log('  Sufficient Balance:', hasEnoughBalance ? '✅ YES' : '❌ NO');
    console.log('  Sufficient Allowance:', hasEnoughAllowance ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (hasEnoughBalance && hasEnoughAllowance) {
      console.log('🎉 READY TO UNLOCK! Bob can unlock Chapter 8 immediately.');
    } else if (hasEnoughBalance && !hasEnoughAllowance) {
      console.log('⚠️  APPROVAL NEEDED: Bob needs to approve TIP spending first.');
      console.log('    Expected: First transaction will be TIP approval');
    } else {
      console.log('🚨 INSUFFICIENT FUNDS: Bob needs more TIP tokens.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();