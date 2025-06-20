import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const CHAPTER_NUMBER = 7;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// ABI for hasUnlockedChapter function
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
    console.log('🔍 Checking if Bob has already unlocked Chapter 7');
    console.log('👤 Bob:', BOB_ADDRESS);
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    
    const hasUnlocked = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: UNLOCK_CHECK_ABI,
      functionName: 'hasUnlockedChapter',
      args: [BOB_ADDRESS as `0x${string}`, bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    console.log('🔓 Has Bob unlocked this chapter?', hasUnlocked ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (hasUnlocked) {
      console.log('💡 FOUND THE ISSUE:');
      console.log('   Bob has ALREADY unlocked this chapter!');
      console.log('   The contract is rejecting the unlock attempt with error 0xfb8f41b2');
      console.log('   This corresponds to: require(!hasUnlockedChapter[user][bookId][chapter], "already unlocked")');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('   The frontend should check if the chapter is already unlocked');
      console.log('   and show appropriate UI instead of trying to unlock again.');
    } else {
      console.log('🤔 Bob has NOT unlocked this chapter yet.');
      console.log('   The error must be coming from a different require statement.');
      console.log('   Possible causes:');
      console.log('   - Race condition during attribution setting');
      console.log('   - TIP token allowance issue');
      console.log('   - Gas estimation failure');
    }
    
  } catch (error) {
    console.error('❌ Error checking unlock status:', error);
  }
}

main();