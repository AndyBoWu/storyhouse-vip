import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix';
const CHAPTER_NUMBER = 6;
const BOB_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Bob's address from screenshot
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'; // From deployment

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
    console.log('🔍 DEBUGGING BOB\'S UNLOCK FAILURE');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('👤 Bob\'s Address:', BOB_ADDRESS);
    console.log('📄 Contract:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    console.log('🪙 TIP Token:', TIP_TOKEN_ADDRESS);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('');
    
    // Check 1: Book registration and status
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
    
    // Check 2: Chapter attribution
    console.log('2️⃣ CHECKING CHAPTER ATTRIBUTION...');
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
      return;
    }
    
    console.log('  ✅ Chapter attribution OK');
    console.log('');
    
    // Check 3: Already unlocked?
    console.log('3️⃣ CHECKING IF ALREADY UNLOCKED...');
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
    
    // Check 4: TIP token balance and allowance
    console.log('4️⃣ CHECKING TIP TOKEN REQUIREMENTS...');
    const requiredAmount = unlockPrice;
    
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
      
      console.log('  Required Amount:', requiredAmount.toString(), 'wei =', Number(requiredAmount) / 1e18, 'TIP');
      console.log('  Bob\'s Balance:', balance.toString(), 'wei =', Number(balance) / 1e18, 'TIP');
      console.log('  Allowance:', allowance.toString(), 'wei =', Number(allowance) / 1e18, 'TIP');
      
      const hasEnoughBalance = balance >= requiredAmount;
      const hasEnoughAllowance = allowance >= requiredAmount;
      
      console.log('  Sufficient Balance:', hasEnoughBalance ? '✅ YES' : '❌ NO');
      console.log('  Sufficient Allowance:', hasEnoughAllowance ? '✅ YES' : '❌ NO');
      
      if (!hasEnoughBalance) {
        console.log('  🚨 PROBLEM: Bob does not have enough TIP tokens!');
        console.log('  Shortfall:', Number(requiredAmount - balance) / 1e18, 'TIP');
      }
      
      if (!hasEnoughAllowance) {
        console.log('  🚨 PROBLEM: Bob has not approved enough TIP tokens!');
        console.log('  Additional approval needed:', Number(requiredAmount - allowance) / 1e18, 'TIP');
      }
      
      if (hasEnoughBalance && hasEnoughAllowance) {
        console.log('  ✅ TIP token requirements OK');
      }
      
    } catch (error) {
      console.log('  🚨 PROBLEM: Error checking TIP token status');
      console.log('  Error:', error);
    }
    
    console.log('');
    console.log('🔍 DIAGNOSIS COMPLETE');
    console.log('');
    console.log('🚨 Error 0xfb8f41b2 likely corresponds to one of these require() failures:');
    console.log('   - "HybridRevenueV2: already unlocked"');
    console.log('   - "HybridRevenueV2: invalid chapter"'); 
    console.log('   - "HybridRevenueV2: chapter not configured"');
    console.log('   - "HybridRevenueV2: payment failed"');
    console.log('   - "HybridRevenueV2: book not active"');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main();