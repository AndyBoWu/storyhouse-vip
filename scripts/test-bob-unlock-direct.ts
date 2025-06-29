import { createPublicClient, createWalletClient, http, custom, parseEther, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// This is a test private key - DO NOT use in production!
const BOB_PRIVATE_KEY = process.env.BOB_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000002';
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const CHAPTER_NUMBER = 5;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// Minimal ABI for testing
const UNLOCK_ABI = [
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
    console.log('🧪 Testing direct unlock call for Bob');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('📄 Contract:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    console.log('');
    
    // First, try to simulate the call to see what error we get
    console.log('🔍 Simulating unlock call to check for errors...');
    
    try {
      const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
      console.log('👤 Simulating as Bob:', BOB_ADDRESS);
      
      const result = await client.simulateContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: UNLOCK_ABI,
        functionName: 'unlockChapter',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
        account: BOB_ADDRESS as `0x${string}`,
      });
      
      console.log('✅ Simulation successful!', result);
      
    } catch (simulateError: any) {
      console.error('❌ Simulation failed with error:');
      console.error('Error message:', simulateError.message);
      
      // Try to extract the specific error
      if (simulateError.message.includes('0xfb8f41b2')) {
        console.log('\n🔴 ERROR SIGNATURE DETECTED: 0xfb8f41b2');
        console.log('This is the "chapter not configured" error from the contract');
        
        // Check the actual error details
        if (simulateError.cause) {
          console.log('\nError cause:', simulateError.cause);
        }
        if (simulateError.data) {
          console.log('\nError data:', simulateError.data);
        }
      }
      
      // Try to parse the revert reason
      const errorStr = simulateError.toString();
      console.log('\nFull error string:', errorStr);
      
      // Look for specific patterns
      if (errorStr.includes('chapter not configured')) {
        console.log('\n💡 CONFIRMED: The chapter attribution is not being recognized by the contract');
        console.log('Even though our script shows it as set, the contract disagrees');
        console.log('This could be due to:');
        console.log('1. Wrong bookId format or calculation');
        console.log('2. Race condition - attribution not yet confirmed on chain');
        console.log('3. Contract looking at different storage than we checked');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

main();