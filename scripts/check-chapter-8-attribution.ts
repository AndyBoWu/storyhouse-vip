import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const CHAPTER_NUMBER = 8;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const HYBRID_V2_ABI = [
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
  },
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
    console.log('🔍 Checking Chapter 8 Attribution');
    console.log('==================================');
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📘 Book ID:', BOOK_ID);
    console.log('🔗 Bytes32 ID:', bytes32Id);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('');
    
    // Check chapter attribution
    try {
      const attribution = await client.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: HYBRID_V2_ABI,
        functionName: 'chapterAttributions',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
      });
      
      console.log('📝 Chapter 8 Attribution:');
      console.log('   Original Author:', attribution[0]);
      console.log('   Source Book ID:', attribution[1]);
      console.log('   Unlock Price:', attribution[2].toString(), 'wei');
      console.log('   Is Original Content:', attribution[3]);
      console.log('');
      
      if (attribution[0] === '0x0000000000000000000000000000000000000000') {
        console.log('❌ FOUND THE ISSUE: Chapter 8 attribution is NOT set!');
        console.log('   The original author is zero address, meaning the chapter is not configured.');
        console.log('');
        console.log('🔧 SOLUTION: The author needs to set attribution for Chapter 8');
        console.log('   This requires calling setChapterAttribution() on the contract');
      } else {
        console.log('✅ Chapter 8 attribution is properly set');
        
        // Also check if Bob has already unlocked it
        const BOB_ADDRESS = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
        const hasUnlocked = await client.readContract({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: HYBRID_V2_ABI,
          functionName: 'hasUnlockedChapter',
          args: [BOB_ADDRESS as `0x${string}`, bytes32Id, BigInt(CHAPTER_NUMBER)],
        });
        
        console.log('🔓 Bob has unlocked Chapter 8:', hasUnlocked ? '✅ YES' : '❌ NO');
      }
      
    } catch (error) {
      console.error('❌ Error checking chapter attribution:', error);
      console.log('');
      console.log('💡 This likely means Chapter 8 attribution is not set.');
    }
    
    // Let's also check chapters 7 and 6 for comparison
    console.log('');
    console.log('🔍 Comparison with working chapters:');
    
    for (const chapterNum of [6, 7]) {
      try {
        const attribution = await client.readContract({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: HYBRID_V2_ABI,
          functionName: 'chapterAttributions',
          args: [bytes32Id, BigInt(chapterNum)],
        });
        
        console.log(`   Chapter ${chapterNum}: Author ${attribution[0].slice(0, 10)}..., Price ${attribution[2]} wei`);
      } catch (error) {
        console.log(`   Chapter ${chapterNum}: ❌ Not set`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();