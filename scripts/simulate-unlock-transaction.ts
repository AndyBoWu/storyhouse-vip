import { createPublicClient, http, keccak256, toBytes, formatEther } from 'viem';

// Based on the error logs from the screenshot
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix4';
const CHAPTER_NUMBER = 4;
const BOB_ADDRESS = '0x71b93d154886c297F4B6e6219C47d378F6Ac6a70';
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// Minimal ABI for unlockChapter
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
    console.log('🧪 SIMULATING UNLOCK TRANSACTION');
    console.log('==================================');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('👤 Bob\'s Address:', BOB_ADDRESS);
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    console.log('📄 Contract:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS);
    console.log('');
    
    // First, try to estimate gas
    console.log('⛽ Attempting gas estimation...');
    
    try {
      const gasEstimate = await client.estimateGas({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: UNLOCK_ABI,
        functionName: 'unlockChapter',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
        account: BOB_ADDRESS as `0x${string}`,
      });
      
      console.log('✅ Gas estimation successful!');
      console.log('   Estimated gas:', gasEstimate.toString());
      
    } catch (gasError: any) {
      console.error('❌ Gas estimation failed!');
      console.error('Error:', gasError.message);
      
      // Check for specific error signature
      if (gasError.message.includes('0xfb8f41b2')) {
        console.log('\n🔴 ERROR SIGNATURE DETECTED: 0xfb8f41b2');
        console.log('This is the "chapter not configured" error');
        
        // Extract more details
        if (gasError.shortMessage) {
          console.log('Short message:', gasError.shortMessage);
        }
        if (gasError.metaMessages) {
          console.log('Meta messages:', gasError.metaMessages);
        }
      }
    }
    
    console.log('\n🔍 Now attempting contract simulation...');
    
    try {
      const result = await client.simulateContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: UNLOCK_ABI,
        functionName: 'unlockChapter',
        args: [bytes32Id, BigInt(CHAPTER_NUMBER)],
        account: BOB_ADDRESS as `0x${string}`,
      });
      
      console.log('✅ Simulation successful!');
      console.log('   Result:', result);
      
    } catch (simulateError: any) {
      console.error('❌ Contract simulation failed!');
      console.error('Error message:', simulateError.message);
      
      // Try to extract the exact revert reason
      if (simulateError.cause) {
        console.log('\nError cause:', simulateError.cause?.message || simulateError.cause);
      }
      
      // Check for specific error patterns
      const errorStr = simulateError.toString();
      if (errorStr.includes('chapter not configured')) {
        console.log('\n💡 CONFIRMED: "chapter not configured" error');
        console.log('The contract is reverting at line 239 of HybridRevenueControllerV2.sol');
        console.log('This means attribution.originalAuthor is address(0)');
      } else if (errorStr.includes('already unlocked')) {
        console.log('\n💡 Chapter already unlocked by user');
      } else if (errorStr.includes('invalid chapter')) {
        console.log('\n💡 Invalid chapter number');
      } else if (errorStr.includes('payment failed')) {
        console.log('\n💡 TIP token transfer failed');
      } else if (errorStr.includes('book not active')) {
        console.log('\n💡 Book is not active');
      }
      
      // Try to decode the error data
      if (simulateError.data) {
        console.log('\nError data:', simulateError.data);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('The transaction is failing during gas estimation/simulation.');
    console.log('This suggests the contract state will cause a revert.');
    console.log('');
    console.log('🔧 DEBUGGING STEPS:');
    console.log('1. Check if there\'s a race condition with attribution setting');
    console.log('2. Verify the exact contract state at the moment of transaction');
    console.log('3. Check if there are any pending transactions that might affect state');
    console.log('4. Consider if the contract has been upgraded or changed');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

main();