import { createPublicClient, http } from 'viem';
import { parseBookId } from '../apps/frontend/lib/contracts/hybridRevenueController';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const HYBRID_V2_ABI = [
  {
    name: 'books',
    type: 'function',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [
      { name: 'curator', type: 'address' },
      { name: 'totalChapters', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'ipfsMetadataHash', type: 'string' }
    ],
    stateMutability: 'view'
  }
] as const;

async function checkBookRegistration(bookId: string): Promise<boolean> {
  try {
    console.log('📚 Checking book registration for:', bookId);
    
    const { bytes32Id } = parseBookId(bookId);
    console.log('🔗 Parsed bytes32Id:', bytes32Id);
    
    const bookData = await client.readContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: HYBRID_V2_ABI,
      functionName: 'books',
      args: [bytes32Id],
    });
    
    console.log('📊 Book data from contract:', bookData);
    
    // Check if curator address is not zero address (indicates book exists)
    const curator = bookData[0] as string;
    const isActive = bookData[2] as boolean;
    
    console.log('👤 Curator:', curator);
    console.log('✅ Is Active:', isActive);
    
    const isRegistered = curator !== '0x0000000000000000000000000000000000000000' && isActive;
    console.log('🎯 Is Registered:', isRegistered);
    
    return isRegistered;
  } catch (error) {
    console.error('❌ Error checking book registration:', error);
    // If error occurs, assume book is not registered
    return false;
  }
}

async function main() {
  console.log('🔍 Debug: Book Registration Flow');
  console.log('================================');
  console.log('');
  
  const isRegistered = await checkBookRegistration(BOOK_ID);
  
  console.log('');
  console.log('📝 Summary:');
  console.log(`   Book: ${BOOK_ID}`);
  console.log(`   Registered: ${isRegistered ? '✅ YES' : '❌ NO'}`);
  
  if (!isRegistered) {
    console.log('');
    console.log('💡 This explains why Bob cannot unlock Chapter 8!');
    console.log('   The book needs to be registered first.');
  }
}

main().catch(console.error);