import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const CHAPTER_NUMBER = 8;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const FULL_ABI = [
  {
    name: 'unlockChapter',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const;

async function main() {
  try {
    console.log('🧪 Simulating Bob\'s unlock attempt for Chapter 8');
    console.log('👤 Bob:', BOB_ADDRESS);
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('');
    
    // Simulate the unlock
    console.log('🔓 Simulating unlock transaction...');
    
    try {
      const result = await client.simulateContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: FULL_ABI,
        functionName: 'unlockChapter',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
        account: BOB_ADDRESS as `0x${string}`,
      });
      
      console.log('✅ Simulation successful!', result);
      console.log('');
      console.log('💡 This means Bob CAN unlock Chapter 8!');
      console.log('   The issue must be in the frontend, not the smart contract.');
      
    } catch (error: any) {
      console.error('❌ Simulation failed!');
      console.error('');
      
      // Try to extract more details
      if (error.cause?.data) {
        console.log('📊 Error data:', error.cause.data);
      }
      
      if (error.message) {
        console.log('📝 Error message:', error.message);
      }
      
      console.log('');
      console.log('🔍 This suggests the issue is a real contract error, not frontend.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

main();