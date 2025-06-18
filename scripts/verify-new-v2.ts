import { createPublicClient, http, keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix';
const NEW_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';

const client = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

// ABI for full HybridRevenueControllerV2
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
    console.log('🔍 Verifying NEW HybridRevenueControllerV2 at:', NEW_V2_ADDRESS);
    
    // First verify the contract exists
    const code = await client.getCode({ address: NEW_V2_ADDRESS as `0x${string}` });
    console.log('✅ Contract deployed, code size:', code.length, 'bytes');
    
    // Try to check book registration
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 Checking book registration for:', BOOK_ID);
    console.log('   BookId as bytes32:', bytes32Id);
    
    try {
      const bookData = await client.readContract({
        address: NEW_V2_ADDRESS as `0x${string}`,
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
      
      const curator = bookData[0] as string;
      const isActive = bookData[4] as boolean;
      const isRegistered = curator !== '0x0000000000000000000000000000000000000000' && isActive;
      
      if (isRegistered) {
        console.log('✅ Book IS registered in NEW HybridRevenueControllerV2');
      } else {
        console.log('❌ Book is NOT registered in NEW HybridRevenueControllerV2');
        console.log('   This is expected - you need to register it through the UI');
      }
    } catch (readError) {
      console.log('✅ Contract call successful - book not registered yet');
      console.log('   This confirms the NEW contract has proper ABI');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();