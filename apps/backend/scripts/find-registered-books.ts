import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Contract ABI - only what we need
const HYBRID_REVENUE_CONTROLLER_ABI = [
  'event BookRegistered(bytes32 indexed bookId, address indexed curator, address paymentToken, uint256 chapterPrice)',
  'function bookCurators(bytes32 bookId) view returns (address)',
  'function bookNftContracts(bytes32 bookId) view returns (address)'
];

async function findRegisteredBooks() {
  console.log('🔍 Finding registered books in HybridRevenueControllerV2\n');

  // Configuration
  const CONTRACT_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';
  const RPC_URL = process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io';

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, HYBRID_REVENUE_CONTROLLER_ABI, provider);

  try {
    // Get the contract deployment block (approximate)
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 10000; // Last ~10k blocks
    
    console.log(`📊 Searching from block ${fromBlock} to ${currentBlock}\n`);

    // Query BookRegistered events
    const filter = contract.filters.BookRegistered();
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    console.log(`Found ${events.length} BookRegistered events\n`);

    // Process each event
    for (const event of events) {
      const bookId = event.args[0];
      const curator = event.args[1];
      const paymentToken = event.args[2];
      const chapterPrice = event.args[3];
      
      console.log('📚 Book Registration:');
      console.log(`  Book ID (bytes32): ${bookId}`);
      console.log(`  Curator: ${curator}`);
      console.log(`  Payment Token: ${paymentToken}`);
      console.log(`  Chapter Price: ${ethers.formatEther(chapterPrice)} tokens`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  Tx Hash: ${event.transactionHash}`);
      
      // Try to verify the book still exists
      try {
        const currentCurator = await contract.bookCurators(bookId);
        const nftContract = await contract.bookNftContracts(bookId);
        console.log(`  ✅ Verified - Current curator: ${currentCurator}`);
        console.log(`  NFT Contract: ${nftContract}`);
      } catch (e) {
        console.log(`  ❌ Could not verify book existence`);
      }
      
      console.log('');
    }

    // Also try some common book ID patterns
    console.log('\n🔍 Testing common book ID patterns:\n');
    
    const testPatterns = [
      'the-detectives-portal',
      '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal',
      'test-book',
      'my-book'
    ];
    
    for (const pattern of testPatterns) {
      const bookIdBytes32 = ethers.id(pattern);
      console.log(`Testing: "${pattern}"`);
      console.log(`Bytes32: ${bookIdBytes32}`);
      
      try {
        const curator = await contract.bookCurators(bookIdBytes32);
        if (curator !== ethers.ZeroAddress) {
          console.log(`✅ FOUND! Curator: ${curator}`);
          const nftContract = await contract.bookNftContracts(bookIdBytes32);
          console.log(`NFT Contract: ${nftContract}`);
        } else {
          console.log(`❌ Not registered (zero address)`);
        }
      } catch (e) {
        console.log(`❌ Not registered (reverted)`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the check
findRegisteredBooks()
  .then(() => console.log('\n✅ Search complete'))
  .catch(console.error);