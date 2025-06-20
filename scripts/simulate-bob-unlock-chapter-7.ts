import { createPublicClient, http, keccak256, toBytes, decodeErrorResult } from 'viem';

const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const CHAPTER_NUMBER = 7;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// Full ABI with all functions and errors
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
  },
  {
    name: 'books',
    type: 'function',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [
      { name: 'curator', type: 'address' },
      { name: 'isDerivative', type: 'bool' },
      { name: 'parentBookId', type: 'bytes32' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'ipfsMetadataHash', type: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'chapterAttributions',
    type: 'function',
    inputs: [
      { name: '', type: 'bytes32' },
      { name: '', type: 'uint256' }
    ],
    outputs: [
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' }
    ],
    stateMutability: 'view'
  }
] as const;

async function main() {
  try {
    console.log('🧪 Simulating Bob\'s unlock attempt for Chapter 7');
    console.log('👤 Bob:', BOB_ADDRESS);
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('');
    
    // First, let's check the book registration
    console.log('🔍 Checking book registration...');
    const bookData = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: FULL_ABI,
      functionName: 'books',
      args: [bytes32Id],
    });
    
    console.log('📚 Book data:');
    console.log('   Curator:', bookData[0]);
    console.log('   Is Derivative:', bookData[1]);
    console.log('   Total Chapters:', bookData[3].toString());
    console.log('   Is Active:', bookData[4]);
    console.log('');
    
    // Check chapter attribution
    console.log('🔍 Checking chapter attribution...');
    const attribution = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: FULL_ABI,
      functionName: 'chapterAttributions',
      args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    console.log('📝 Chapter attribution:');
    console.log('   Original Author:', attribution[0]);
    console.log('   Unlock Price:', attribution[2].toString(), 'wei');
    console.log('   Is Original:', attribution[3]);
    console.log('');
    
    // Now simulate the unlock
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
      
      // Check specific conditions
      console.log('');
      console.log('🔍 Debugging possible causes:');
      
      // Check if chapter number is valid
      if (BigInt(CHAPTER_NUMBER) > bookData[3]) {
        console.log('❌ Chapter number exceeds total chapters!');
        console.log(`   Chapter ${CHAPTER_NUMBER} > Total ${bookData[3]}`);
      }
      
      // Check if book is active
      if (!bookData[4]) {
        console.log('❌ Book is not active!');
      }
      
      // Check if attribution is set
      if (attribution[0] === '0x0000000000000000000000000000000000000000') {
        console.log('❌ Chapter attribution not set!');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

main();