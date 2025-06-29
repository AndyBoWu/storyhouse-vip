import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix';
const CHAPTER_NUMBER = 9;
const BOB_ADDRESS = '0x71b93d154886c297F4B6e6219C47d378F6Ac6a70';
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

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
    console.log('🔍 CHECKING CHAPTER 9 STATUS FOR BOB');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('👤 Bob:', BOB_ADDRESS);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('');
    
    // Check chapter attribution
    console.log('1️⃣ CHECKING CHAPTER ATTRIBUTION...');
    const attributionResult = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: CHAPTER_ATTRIBUTION_ABI,
      functionName: 'chapterAttributions',
      args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = attributionResult;
    const attributionSet = originalAuthor !== '0x0000000000000000000000000000000000000000';
    
    console.log('  Original Author:', originalAuthor);
    console.log('  Unlock Price:', unlockPrice.toString(), 'wei =', Number(unlockPrice) / 1e18, 'TIP');
    console.log('  Attribution Set:', attributionSet ? '✅ YES' : '❌ NO');
    
    if (!attributionSet) {
      console.log('  🚨 PROBLEM: Chapter attribution not set!');
      console.log('  This is why the backend denies access and unlock will fail.');
      return;
    }
    
    console.log('');
    
    // Check if already unlocked
    console.log('2️⃣ CHECKING UNLOCK STATUS...');
    const alreadyUnlocked = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: UNLOCK_STATUS_ABI,
      functionName: 'hasUnlockedChapter',
      args: [BOB_ADDRESS as `0x${string}`, bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    console.log('  Already Unlocked:', alreadyUnlocked ? '✅ YES' : '❌ NO');
    
    if (alreadyUnlocked) {
      console.log('  ℹ️  Bob already has access to this chapter.');
    } else {
      console.log('  ✅ Bob can purchase access for', Number(unlockPrice) / 1e18, 'TIP');
    }
    
    console.log('');
    console.log('📊 SUMMARY:');
    if (attributionSet && !alreadyUnlocked) {
      console.log('  🎯 Chapter 9 is properly configured and ready for unlock!');
    } else if (attributionSet && alreadyUnlocked) {
      console.log('  🎉 Chapter 9 is already unlocked for Bob!');
    } else {
      console.log('  🚨 Chapter 9 needs attribution setup before Bob can unlock it.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();