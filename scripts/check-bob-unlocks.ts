import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix';
const BOB_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Bob's address from screenshot
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const UNLOCK_STATUS_ABI = [
  {
    name: 'hasUnlockedChapter',
    type: 'function',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'bytes32' },
      { name: '', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  }
] as const;

async function main() {
  try {
    console.log('🔍 CHECKING BOB\'S UNLOCK STATUS FOR ALL CHAPTERS');
    console.log('📘 Book:', BOOK_ID);
    console.log('👤 Bob\'s Address:', BOB_ADDRESS);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('');
    
    // Check chapters 1-7
    for (let chapterNum = 1; chapterNum <= 7; chapterNum++) {
      try {
        const isUnlocked = await client.readContract({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: UNLOCK_STATUS_ABI,
          functionName: 'hasUnlockedChapter',
          args: [BOB_ADDRESS as `0x${string}`, bytes32Id, BigInt(chapterNum)],
        });
        
        const status = isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED';
        const expectation = chapterNum <= 3 ? '(free)' : '(paid - 0.5 TIP)';
        
        console.log(`  Chapter ${chapterNum}: ${status} ${expectation}`);
        
      } catch (error) {
        console.log(`  Chapter ${chapterNum}: ❌ ERROR checking status`);
      }
    }
    
    console.log('');
    console.log('📊 SUMMARY:');
    console.log('  • Chapters 1-3 should be free (no unlock needed)');
    console.log('  • Chapters 4+ require 0.5 TIP payment to unlock');
    console.log('  • Unlocked status persists after payment');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main();