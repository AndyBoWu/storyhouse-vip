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

// Also check which chapters Bob has already unlocked
const UNLOCK_CHECK_ABI = [
  {
    name: 'hasUnlockedChapter',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  }
] as const;

async function main() {
  try {
    console.log('🔍 Checking Bob\'s exact TIP allowance and unlock history');
    console.log('');
    
    // Check allowance
    const allowance = await client.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_ABI,
      functionName: 'allowance',
      args: [
        BOB_ADDRESS as `0x${string}`, 
        HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`
      ],
    });
    
    console.log('💰 TIP Allowance:');
    console.log('   In Wei:', allowance.toString());
    console.log('   In TIP:', formatEther(allowance));
    console.log('   Expected for one unlock:', '500000000000000000 wei (0.5 TIP)');
    console.log('');
    
    // Check which chapters Bob has unlocked
    const { keccak256, toBytes } = await import('viem');
    const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    
    console.log('📚 Bob\'s unlock history for "The Detective\'s Portal":');
    
    for (let chapter = 4; chapter <= 7; chapter++) {
      const hasUnlocked = await client.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: UNLOCK_CHECK_ABI,
        functionName: 'hasUnlockedChapter',
        args: [BOB_ADDRESS as `0x${string}`, bytes32Id, BigInt(chapter)],
      });
      
      console.log(`   Chapter ${chapter}: ${hasUnlocked ? '✅ Unlocked' : '❌ Not unlocked'}`);
    }
    
    console.log('');
    console.log('💡 Analysis:');
    
    if (Number(allowance) === 0) {
      console.log('❌ Bob has NO allowance left!');
      console.log('   He needs to approve more TIP tokens before unlocking another chapter.');
    } else if (Number(allowance) < 500000000000000000) {
      console.log('⚠️  Bob\'s allowance is less than 0.5 TIP!');
      console.log('   He needs to approve at least 0.5 TIP to unlock another chapter.');
    } else {
      console.log('✅ Bob has sufficient allowance for one more unlock.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();