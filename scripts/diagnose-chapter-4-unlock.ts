import { createPublicClient, http, keccak256, toBytes, formatEther } from 'viem';

// Based on the error logs from the screenshot
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix4';
const CHAPTER_NUMBER = 4;
const BOB_ADDRESS = '0x71b93d154886c297F4B6e6219C47d378F6Ac6a70'; // Bob's address from logs
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// Contract ABIs
const BOOK_ABI = [
  {
    name: 'books',
    type: 'function',
    inputs: [{ name: 'bookId', type: 'bytes32' }],
    outputs: [
      { name: 'curator', type: 'address' },
      { name: 'isDerivative', type: 'bool' },
      { name: 'parentBookId', type: 'bytes32' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'ipfsMetadataHash', type: 'string' }
    ],
    stateMutability: 'view'
  }
] as const;

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
  },
  {
    name: 'getChapterInfo',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' }
    ],
    outputs: [
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' },
      { name: 'isUnlockedByUser', type: 'bool' }
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

const TIP_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
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

async function main() {
  try {
    console.log('🔍 DIAGNOSING CHAPTER 4 UNLOCK FAILURE');
    console.log('=======================================');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('👤 Bob\'s Address:', BOB_ADDRESS);
    console.log('📄 Contract:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('   (This should match: 0xf96670e7a0056d36af8aa0c1d5ab1e7e65e071a759b65df656ae98b2494b96d2)');
    console.log('');
    
    // Check 1: Book registration
    console.log('1️⃣ CHECKING BOOK REGISTRATION...');
    try {
      const bookData = await client.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: BOOK_ABI,
        functionName: 'books',
        args: [bytes32Id],
      });
      
      const [curator, isDerivative, parentBookId, totalChapters, isActive, ipfsHash] = bookData;
      console.log('  Curator:', curator);
      console.log('  Total Chapters:', totalChapters.toString());
      console.log('  Is Active:', isActive ? '✅ YES' : '❌ NO');
      
      if (!isActive) {
        console.log('  🚨 PROBLEM: Book is not active!');
        return;
      }
      
      if (CHAPTER_NUMBER > Number(totalChapters)) {
        console.log('  🚨 PROBLEM: Chapter number exceeds total chapters!');
        return;
      }
      
      console.log('  ✅ Book registration OK');
    } catch (error) {
      console.log('  🚨 PROBLEM: Book not found or error reading book data');
      console.log('  Error:', error);
      return;
    }
    
    console.log('');
    
    // Check 2: Chapter attribution using direct mapping read
    console.log('2️⃣ CHECKING CHAPTER ATTRIBUTION (Direct Mapping)...');
    try {
      const attributionResult = await client.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: CHAPTER_ATTRIBUTION_ABI,
        functionName: 'chapterAttributions',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
      });
      
      const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = attributionResult;
      const attributionSet = originalAuthor !== '0x0000000000000000000000000000000000000000';
      
      console.log('  Original Author:', originalAuthor);
      console.log('  Source Book ID:', sourceBookId);
      console.log('  Unlock Price:', unlockPrice.toString(), 'wei =', Number(unlockPrice) / 1e18, 'TIP');
      console.log('  Is Original Content:', isOriginalContent);
      console.log('  Attribution Set:', attributionSet ? '✅ YES' : '❌ NO');
      
      if (!attributionSet) {
        console.log('  🚨 PROBLEM: Chapter attribution not set!');
      } else {
        console.log('  ✅ Chapter attribution OK');
      }
    } catch (error) {
      console.log('  🚨 Error reading chapter attribution:', error);
    }
    
    console.log('');
    
    // Check 3: Using getChapterInfo function (includes msg.sender context)
    console.log('3️⃣ CHECKING CHAPTER INFO (getChapterInfo function)...');
    try {
      const chapterInfo = await client.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: CHAPTER_ATTRIBUTION_ABI,
        functionName: 'getChapterInfo',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
        account: BOB_ADDRESS as `0x${string}`,
      });
      
      const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent, isUnlockedByUser] = chapterInfo;
      
      console.log('  Original Author:', originalAuthor);
      console.log('  Unlock Price:', Number(unlockPrice) / 1e18, 'TIP');
      console.log('  Already Unlocked by Bob:', isUnlockedByUser ? '❌ YES' : '✅ NO');
      
      if (isUnlockedByUser) {
        console.log('  🚨 PROBLEM: Bob has already unlocked this chapter!');
      }
    } catch (error) {
      console.log('  🚨 Error calling getChapterInfo:', error);
    }
    
    console.log('');
    
    // Check 4: Already unlocked?
    console.log('4️⃣ CHECKING UNLOCK STATUS...');
    const alreadyUnlocked = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: UNLOCK_STATUS_ABI,
      functionName: 'hasUnlockedChapter',
      args: [BOB_ADDRESS as `0x${string}`, bytes32Id, BigInt(CHAPTER_NUMBER)],
    });
    
    console.log('  Already Unlocked:', alreadyUnlocked ? '❌ YES (would fail)' : '✅ NO');
    
    if (alreadyUnlocked) {
      console.log('  🚨 PROBLEM: Bob has already unlocked this chapter!');
      return;
    }
    
    console.log('');
    
    // Check 5: TIP token balance and allowance
    console.log('5️⃣ CHECKING TIP TOKEN STATUS...');
    try {
      const balance = await client.readContract({
        address: TIP_TOKEN_ADDRESS as `0x${string}`,
        abi: TIP_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [BOB_ADDRESS as `0x${string}`],
      });
      
      const allowance = await client.readContract({
        address: TIP_TOKEN_ADDRESS as `0x${string}`,
        abi: TIP_TOKEN_ABI,
        functionName: 'allowance',
        args: [BOB_ADDRESS as `0x${string}`, HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`],
      });
      
      console.log('  Bob\'s Balance:', formatEther(balance), 'TIP');
      console.log('  Allowance:', formatEther(allowance), 'TIP');
      console.log('  Required: 0.5 TIP');
      
      const hasEnoughBalance = balance >= 500000000000000000n;
      const hasEnoughAllowance = allowance >= 500000000000000000n;
      
      console.log('  Sufficient Balance:', hasEnoughBalance ? '✅ YES' : '❌ NO');
      console.log('  Sufficient Allowance:', hasEnoughAllowance ? '✅ YES' : '❌ NO');
      
      if (!hasEnoughBalance) {
        console.log('  🚨 PROBLEM: Bob does not have enough TIP tokens!');
      }
      
      if (!hasEnoughAllowance) {
        console.log('  🚨 PROBLEM: Bob has not approved enough TIP tokens!');
      }
    } catch (error) {
      console.log('  🚨 Error checking TIP token status:', error);
    }
    
    console.log('');
    console.log('🔍 DIAGNOSIS COMPLETE');
    console.log('');
    console.log('💡 ROOT CAUSE ANALYSIS:');
    console.log('The error 0xfb8f41b2 is the signature for "chapter not configured" error.');
    console.log('This occurs when the chapter attribution originalAuthor is address(0).');
    console.log('');
    console.log('If attribution shows as set above but unlock still fails, possible causes:');
    console.log('1. Race condition - attribution transaction not yet confirmed');
    console.log('2. Wrong chapter number in the unlock call');
    console.log('3. Different bookId calculation between frontend and contract');
    console.log('4. Contract state changed between read and unlock attempt');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main();