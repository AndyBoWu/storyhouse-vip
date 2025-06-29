import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Contract ABI for HybridRevenueControllerV2
const HYBRID_REVENUE_CONTROLLER_ABI = [
  'function chapterAttributions(bytes32 bookId, uint256 chapterIndex) view returns (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)',
  'function isUnlocked(bytes32 bookId, uint256 chapterIndex, address user) view returns (bool)',
  'function bookCurators(bytes32 bookId) view returns (address)',
  'function bookPaymentTokens(bytes32 bookId) view returns (address)',
  'function chapterPrices(bytes32 bookId, uint256 chapterIndex) view returns (uint256)',
  'function platformFeePercentage() view returns (uint256)',
  'function bookNftContracts(bytes32 bookId) view returns (address)'
];

async function checkChapterAttribution() {
  console.log('🔍 Checking Chapter Attribution Status\n');

  // Configuration
  const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
  const CONTRACT_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';
  const RPC_URL = process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io';

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, HYBRID_REVENUE_CONTROLLER_ABI, provider);

  try {
    // Convert book ID to bytes32
    const bookIdBytes32 = ethers.id(BOOK_ID);
    console.log(`Book ID: ${BOOK_ID}`);
    console.log(`Book ID (bytes32): ${bookIdBytes32}\n`);

    // Check book configuration
    console.log('📚 Book Configuration:');
    const bookCurator = await contract.bookCurators(bookIdBytes32);
    console.log(`Book Curator: ${bookCurator}`);
    
    const paymentToken = await contract.bookPaymentTokens(bookIdBytes32);
    console.log(`Payment Token: ${paymentToken}`);
    
    const bookNftContract = await contract.bookNftContracts(bookIdBytes32);
    console.log(`Book NFT Contract: ${bookNftContract}`);
    
    const platformFee = await contract.platformFeePercentage();
    console.log(`Platform Fee: ${platformFee}%\n`);

    // Check Chapter 7 (working)
    console.log('✅ Chapter 7 (Working):');
    const chapter7Index = 6; // Zero-indexed
    const chapter7Attribution = await contract.chapterAttributions(bookIdBytes32, chapter7Index);
    console.log(`Original Author: ${chapter7Attribution.originalAuthor}`);
    console.log(`Source Book ID: ${chapter7Attribution.sourceBookId}`);
    console.log(`Unlock Price: ${ethers.formatEther(chapter7Attribution.unlockPrice)} tokens`);
    console.log(`Is Original Content: ${chapter7Attribution.isOriginalContent}`);
    console.log(`Is Set: ${chapter7Attribution.originalAuthor !== ethers.ZeroAddress}`);

    // Check chapter price
    try {
      const chapter7Price = await contract.chapterPrices(bookIdBytes32, chapter7Index);
      console.log(`Chapter Price: ${ethers.formatEther(chapter7Price)} tokens`);
    } catch (e) {
      console.log(`Chapter price error: ${e.message}`);
    }

    // Check Chapter 8 (problematic)
    console.log('\n❌ Chapter 8 (Problematic):');
    const chapter8Index = 7; // Zero-indexed
    const chapter8Attribution = await contract.chapterAttributions(bookIdBytes32, chapter8Index);
    console.log(`Original Author: ${chapter8Attribution.originalAuthor}`);
    console.log(`Source Book ID: ${chapter8Attribution.sourceBookId}`);
    console.log(`Unlock Price: ${ethers.formatEther(chapter8Attribution.unlockPrice)} tokens`);
    console.log(`Is Original Content: ${chapter8Attribution.isOriginalContent}`);
    console.log(`Is Set: ${chapter8Attribution.originalAuthor !== ethers.ZeroAddress}`);

    // Check chapter price
    try {
      const chapter8Price = await contract.chapterPrices(bookIdBytes32, chapter8Index);
      console.log(`Chapter Price: ${ethers.formatEther(chapter8Price)} tokens`);
    } catch (e) {
      console.log(`Chapter price error: ${e.message}`);
    }

    // Check unlock status for a test address
    const testAddress = '0x1234567890123456789012345678901234567890';
    console.log('\n🔓 Unlock Status Check:');
    
    try {
      const chapter7Unlocked = await contract.isUnlocked(bookIdBytes32, chapter7Index, testAddress);
      console.log(`Chapter 7 unlocked for test address: ${chapter7Unlocked}`);
    } catch (e) {
      console.log(`Chapter 7 unlock check error: ${e.message}`);
    }

    try {
      const chapter8Unlocked = await contract.isUnlocked(bookIdBytes32, chapter8Index, testAddress);
      console.log(`Chapter 8 unlocked for test address: ${chapter8Unlocked}`);
    } catch (e) {
      console.log(`Chapter 8 unlock check error: ${e.message}`);
    }

    // Summary
    console.log('\n📊 Summary:');
    if (chapter8Attribution.originalAuthor === ethers.ZeroAddress) {
      console.log('❌ Chapter 8 attribution is NOT set (zero address)');
      console.log('This explains the 0xfb8f41b2 error - the chapter needs attribution set');
    } else {
      console.log('✅ Chapter 8 attribution is set');
      console.log('The error might be due to a different issue');
    }

    // Check more chapters for pattern
    console.log('\n📈 All Chapter Attributions:');
    for (let i = 0; i < 10; i++) {
      try {
        const attribution = await contract.chapterAttributions(bookIdBytes32, i);
        const isSet = attribution.originalAuthor !== ethers.ZeroAddress;
        console.log(`Chapter ${i + 1} (index ${i}): ${isSet ? '✅ Set' : '❌ Not Set'} - Author: ${attribution.originalAuthor}`);
      } catch (e) {
        console.log(`Chapter ${i + 1} (index ${i}): Error - ${e.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

// Run the check
checkChapterAttribution()
  .then(() => console.log('\n✅ Check complete'))
  .catch(console.error);