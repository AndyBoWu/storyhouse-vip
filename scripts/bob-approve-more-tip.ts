import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { storyTestnet } from '../apps/frontend/lib/config/chains';

// Bob's wallet details (DO NOT commit private keys in production!)
const BOB_PRIVATE_KEY = '0x...' as `0x${string}`; // Replace with Bob's private key
const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';

// Contract addresses
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E';
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

// Create clients
const publicClient = createPublicClient({
  chain: storyTestnet,
  transport: http('https://aeneid.storyrpc.io')
});

const account = privateKeyToAccount(BOB_PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: storyTestnet,
  transport: http('https://aeneid.storyrpc.io')
});

// TIP token ABI (just approve function)
const TIP_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
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
  },
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
    console.log('💰 Bob TIP Token Approval Script');
    console.log('================================');
    console.log('');
    
    // Check current balance
    const balance = await publicClient.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_ABI,
      functionName: 'balanceOf',
      args: [BOB_ADDRESS as `0x${string}`],
    });
    
    console.log('📊 Current Status:');
    console.log(`   Bob's Address: ${BOB_ADDRESS}`);
    console.log(`   TIP Balance: ${formatEther(balance)} TIP`);
    
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_ABI,
      functionName: 'allowance',
      args: [
        BOB_ADDRESS as `0x${string}`, 
        HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`
      ],
    });
    
    console.log(`   Current Allowance: ${formatEther(currentAllowance)} TIP`);
    console.log('');
    
    // Approve 5 TIP tokens (enough for 10 chapter unlocks)
    const approvalAmount = parseEther('5');
    
    console.log('🔐 Approving TIP tokens...');
    console.log(`   Spender: ${HYBRID_REVENUE_CONTROLLER_V2_ADDRESS}`);
    console.log(`   Amount: ${formatEther(approvalAmount)} TIP`);
    console.log('');
    
    const hash = await walletClient.writeContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_ABI,
      functionName: 'approve',
      args: [HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`, approvalAmount],
    });
    
    console.log('📝 Transaction submitted:', hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log('✅ Approval successful!');
      
      // Check new allowance
      const newAllowance = await publicClient.readContract({
        address: TIP_TOKEN_ADDRESS as `0x${string}`,
        abi: TIP_ABI,
        functionName: 'allowance',
        args: [
          BOB_ADDRESS as `0x${string}`, 
          HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`
        ],
      });
      
      console.log(`   New Allowance: ${formatEther(newAllowance)} TIP`);
      console.log('');
      console.log('🎉 Bob can now unlock up to 10 more chapters!');
    } else {
      console.log('❌ Approval failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Note: To run this script, you need Bob's private key
console.log('⚠️  IMPORTANT: This script requires Bob\'s private key.');
console.log('   Replace BOB_PRIVATE_KEY with the actual private key before running.');
console.log('   DO NOT commit private keys to the repository!');
console.log('');
console.log('To run: npx tsx bob-approve-more-tip.ts');