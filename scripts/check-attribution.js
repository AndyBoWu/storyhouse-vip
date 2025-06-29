const { ethers } = require('ethers');
const { keccak256, toBytes } = require('viem');

// HybridRevenueControllerV2 ABI (only the parts we need)
const ABI = [
  "function chapterAttributions(bytes32 bookId, uint256 chapterNumber) view returns (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)",
  "function books(bytes32 bookId) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)"
];

// Contract address on Story testnet
const CONTRACT_ADDRESS = "0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6"; // HybridRevenueControllerV2

async function checkAttribution(bookId, chapterNumber) {
  // Connect to Story testnet
  const provider = new ethers.JsonRpcProvider('https://aeneid.storyrpc.io');
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  try {
    // Convert bookId to bytes32 using keccak256 (same as contract)
    const bookIdBytes32 = keccak256(toBytes(bookId));
    
    console.log('Checking attribution for:');
    console.log('- Book ID (string):', bookId);
    console.log('- Book ID (bytes32):', bookIdBytes32);
    console.log('- Chapter:', chapterNumber);
    console.log('');
    
    // Get book metadata
    const bookData = await contract.books(bookIdBytes32);
    console.log('Book Metadata:');
    console.log('- Curator:', bookData.curator);
    console.log('- Is Active:', bookData.isActive);
    console.log('- Total Chapters:', bookData.totalChapters.toString());
    console.log('- Is Derivative:', bookData.isDerivative);
    console.log('');
    
    // Get chapter attribution
    const attribution = await contract.chapterAttributions(bookIdBytes32, chapterNumber);
    console.log('Chapter Attribution:');
    console.log('- Original Author:', attribution.originalAuthor);
    console.log('- Source Book ID:', attribution.sourceBookId);
    console.log('- Unlock Price (wei):', attribution.unlockPrice.toString());
    console.log('- Unlock Price (TIP):', ethers.formatEther(attribution.unlockPrice));
    console.log('- Is Original Content:', attribution.isOriginalContent);
    
    // Check if attribution is set
    if (attribution.originalAuthor === '0x0000000000000000000000000000000000000000') {
      console.log('\n⚠️  Attribution not set for this chapter!');
    } else {
      console.log('\n✅ Attribution is properly set!');
    }
    
  } catch (error) {
    console.error('Error reading attribution:', error.message);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node check-attribution.js <bookId> <chapterNumber>');
  console.log('Example: node check-attribution.js "my-awesome-book" 4');
  process.exit(1);
}

const bookId = args[0];
const chapterNumber = parseInt(args[1]);

checkAttribution(bookId, chapterNumber);