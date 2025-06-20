import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkContractAndBook() {
  console.log('🔍 Checking Contract and Book Status\n');

  // Configuration
  const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
  const CONTRACT_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';
  const RPC_URL = process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io';

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    // Check if contract exists
    console.log('📡 Checking if contract is deployed...');
    const code = await provider.getCode(CONTRACT_ADDRESS);
    
    if (code === '0x') {
      console.log('❌ No contract deployed at this address!');
      return;
    }
    
    console.log('✅ Contract is deployed');
    console.log(`Contract code length: ${code.length} characters\n`);

    // Convert book ID to bytes32
    const bookIdBytes32 = ethers.id(BOOK_ID);
    console.log(`Book ID: ${BOOK_ID}`);
    console.log(`Book ID (bytes32): ${bookIdBytes32}\n`);

    // Try to call bookCurators to see if book exists
    const bookCuratorsSelector = ethers.id('bookCurators(bytes32)').slice(0, 10);
    const encodedBookId = ethers.AbiCoder.defaultAbiCoder().encode(['bytes32'], [bookIdBytes32]);
    const callData = bookCuratorsSelector + encodedBookId.slice(2);
    
    console.log('📡 Checking if book is registered (bookCurators call)...');
    console.log(`Selector: ${bookCuratorsSelector}`);
    console.log(`Call data: ${callData}`);
    
    try {
      const result = await provider.call({
        to: CONTRACT_ADDRESS,
        data: callData
      });
      
      if (result === '0x' || result === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Book curator is zero address - book might not be registered');
      } else {
        const curator = ethers.AbiCoder.defaultAbiCoder().decode(['address'], result)[0];
        console.log(`✅ Book curator: ${curator}`);
      }
    } catch (e) {
      console.log('❌ Error calling bookCurators - book likely not registered');
      console.log(`Error: ${e.message}`);
    }

    // Let's also check the correct book ID format by trying different variations
    console.log('\n🔍 Trying different book ID formats...\n');
    
    const variations = [
      BOOK_ID,
      BOOK_ID.toLowerCase(),
      'the-detectives-portal',
      `${CONTRACT_ADDRESS}/the-detectives-portal`
    ];
    
    for (const variation of variations) {
      const varBytes32 = ethers.id(variation);
      console.log(`Trying: ${variation}`);
      console.log(`Bytes32: ${varBytes32}`);
      
      const varCallData = bookCuratorsSelector + ethers.AbiCoder.defaultAbiCoder().encode(['bytes32'], [varBytes32]).slice(2);
      
      try {
        const result = await provider.call({
          to: CONTRACT_ADDRESS,
          data: varCallData
        });
        
        if (result !== '0x' && result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          const curator = ethers.AbiCoder.defaultAbiCoder().decode(['address'], result)[0];
          console.log(`✅ FOUND! Book curator: ${curator}`);
        } else {
          console.log(`❌ No book found with this ID`);
        }
      } catch (e) {
        console.log(`❌ Error: ${e.message.split('\n')[0]}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the check
checkContractAndBook()
  .then(() => console.log('\n✅ Check complete'))
  .catch(console.error);