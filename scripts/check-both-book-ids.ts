import { createPublicClient, http, keccak256, toBytes } from 'viem';

const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';
const CHAPTER_NUMBER = 4;

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

async function checkAttribution(bookId: string) {
  const bytes32Id = keccak256(toBytes(bookId));
  console.log(`\n📘 Checking: ${bookId}`);
  console.log(`📝 Bytes32: ${bytes32Id}`);
  
  try {
    const attribution = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: CHAPTER_ATTRIBUTION_ABI,
      functionName: 'chapterAttributions',
      args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = attribution;
    const isConfigured = originalAuthor !== '0x0000000000000000000000000000000000000000';
    
    console.log(`✅ Configured: ${isConfigured ? 'YES' : 'NO'}`);
    if (isConfigured) {
      console.log(`👤 Author: ${originalAuthor}`);
      console.log(`💰 Price: ${Number(unlockPrice) / 1e18} TIP`);
    }
  } catch (error) {
    console.log('❌ Error reading attribution');
  }
}

async function main() {
  console.log('🔍 CHECKING CHAPTER 4 ATTRIBUTION FOR BOTH BOOK IDS');
  console.log('==================================================');
  
  await checkAttribution('0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix');
  await checkAttribution('0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix4');
  
  console.log('\n💡 SUMMARY:');
  console.log('If one shows configured and the other does not, that\'s the issue!');
  console.log('Make sure the frontend is using the correct book ID consistently.');
}

main();