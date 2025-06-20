import { createPublicClient, http, formatEther } from 'viem';

const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const TIP_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

async function main() {
  try {
    const balance = await client.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_ABI,
      functionName: 'balanceOf',
      args: [BOB_ADDRESS as `0x${string}`],
    });
    
    console.log('👤 Bob\'s wallet:', BOB_ADDRESS);
    console.log('💰 TIP Balance:', formatEther(balance), 'TIP');
    console.log('');
    
    if (Number(formatEther(balance)) < 0.5) {
      console.log('❌ INSUFFICIENT BALANCE! Bob needs at least 0.5 TIP to unlock the chapter');
    } else {
      console.log('✅ Sufficient balance for unlocking (needs 0.5 TIP)');
    }
    
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

main();