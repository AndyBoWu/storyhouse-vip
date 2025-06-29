import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = process.argv[2] || '0xb60e0fa96bf6aadc5db0a82b24046b2d9301dd48/project-phoenix';
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// ABI for full HybridRevenueControllerV2 (not Standalone)
const ABI = [
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

async function main() {
  try {
    console.log('🔍 Checking HybridRevenueControllerV2 registration for:', BOOK_ID);
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    
    try {
      const bookData = await client.readContract({
        address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: 'books',
        args: [bytes32Id],
      });
      
      console.log('📊 Registration result:');
      console.log('  Curator:', bookData[0]);
      console.log('  Is Derivative:', bookData[1]);
      console.log('  Parent Book ID:', bookData[2]);
      console.log('  Total Chapters:', bookData[3].toString());
      console.log('  Is Active:', bookData[4]);
      console.log('  IPFS Metadata Hash:', bookData[5]);
      
      // Check if curator address is not zero address (indicates book exists)
      const curator = bookData[0] as string;
      const isActive = bookData[4] as boolean;
      const isRegistered = curator !== '0x0000000000000000000000000000000000000000' && isActive;
      
      if (isRegistered) {
        console.log('✅ Book IS registered in HybridRevenueControllerV2');
      } else {
        console.log('❌ Book is NOT registered in HybridRevenueControllerV2 (exists but not active)');
      }
    } catch (readError) {
      // This is expected when book doesn't exist yet
      console.log('❌ Book is NOT registered in HybridRevenueControllerV2 (book not found)');
      console.log('   This is normal for new books that haven\'t been registered yet.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main();