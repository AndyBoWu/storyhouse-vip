import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix';
const CHAPTER_NUMBER = 6;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// ABI for chapterAttributions function
const CHAPTER_ATTRIBUTION_ABI = [
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
    console.log('🔍 Checking Chapter 6 attribution status for Project Phoenix');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    
    const result = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: CHAPTER_ATTRIBUTION_ABI,
      functionName: 'chapterAttributions',
      args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = result;
    const isSet = originalAuthor !== '0x0000000000000000000000000000000000000000';
    
    console.log('📊 Chapter 6 Attribution Status:');
    console.log('  Original Author:', originalAuthor);
    console.log('  Source Book ID:', sourceBookId);
    console.log('  Unlock Price:', unlockPrice.toString(), 'wei');
    console.log('  Unlock Price TIP:', Number(unlockPrice) / 1e18, 'TIP');
    console.log('  Is Original Content:', isOriginalContent);
    console.log('  Attribution Set:', isSet ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (!isSet) {
      console.log('🚨 PROBLEM IDENTIFIED:');
      console.log('   Chapter 6 has NO ATTRIBUTION set (originalAuthor is zero address)');
      console.log('   This is why Bob\'s unlock transaction is failing with error 0xfb8f41b2');
      console.log('   The contract requires: attribution.originalAuthor != address(0)');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('   The chapter author needs to set the attribution using setChapterAttribution()');
      console.log('   OR the auto-attribution system needs to be triggered for this chapter');
    } else {
      console.log('✅ Attribution is properly set - the unlock should work');
      console.log('   If unlock is still failing, there may be another issue (insufficient TIP balance, etc.)');
    }
    
  } catch (error) {
    console.error('❌ Error checking attribution:', error);
  }
}

main();