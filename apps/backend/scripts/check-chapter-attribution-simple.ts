import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkChapterAttribution() {
  console.log('🔍 Checking Chapter 8 Attribution Status\n');

  // Configuration
  const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
  const CONTRACT_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6';
  const RPC_URL = process.env.STORY_RPC_URL || 'https://testnet.storyrpc.io';

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    // Convert book ID to bytes32
    const bookIdBytes32 = ethers.id(BOOK_ID);
    console.log(`Book ID: ${BOOK_ID}`);
    console.log(`Book ID (bytes32): ${bookIdBytes32}\n`);

    // Direct contract call to check chapter attribution
    // Function signature: chapterAttributions(bytes32,uint256)
    const functionSig = '0x3c9da689'; // First 4 bytes of keccak256("chapterAttributions(bytes32,uint256)")
    
    // Encode parameters: bookIdBytes32 and chapterIndex (7 for chapter 8)
    const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256'],
      [bookIdBytes32, 7]
    );
    
    const callData = functionSig + encodedParams.slice(2);
    
    console.log('📡 Making direct contract call...');
    console.log(`Contract: ${CONTRACT_ADDRESS}`);
    console.log(`Call data: ${callData}\n`);

    // Make the call
    const result = await provider.call({
      to: CONTRACT_ADDRESS,
      data: callData
    });

    console.log(`Raw result: ${result}\n`);

    if (result === '0x') {
      console.log('❌ Empty result - contract might not be deployed or book not registered');
    } else {
      // Decode the result
      try {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address', 'bytes32', 'uint256', 'bool'],
          result
        );
        
        console.log('📊 Chapter 8 Attribution:');
        console.log(`Original Author: ${decoded[0]}`);
        console.log(`Source Book ID: ${decoded[1]}`);
        console.log(`Unlock Price: ${ethers.formatEther(decoded[2])} tokens`);
        console.log(`Is Original Content: ${decoded[3]}`);
        console.log(`\nIs Set: ${decoded[0] !== ethers.ZeroAddress ? '✅ YES' : '❌ NO'}`);
        
        if (decoded[0] === ethers.ZeroAddress) {
          console.log('\n⚠️  This explains the 0xfb8f41b2 error - Chapter 8 attribution is not set!');
        }
      } catch (e) {
        console.log('❌ Error decoding result:', e.message);
      }
    }

    // Also check chapter 7 for comparison
    console.log('\n\n📡 Checking Chapter 7 for comparison...');
    const encodedParams7 = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256'],
      [bookIdBytes32, 6] // Chapter 7 is index 6
    );
    
    const callData7 = functionSig + encodedParams7.slice(2);
    const result7 = await provider.call({
      to: CONTRACT_ADDRESS,
      data: callData7
    });

    if (result7 !== '0x') {
      const decoded7 = ethers.AbiCoder.defaultAbiCoder().decode(
        ['address', 'bytes32', 'uint256', 'bool'],
        result7
      );
      
      console.log('📊 Chapter 7 Attribution:');
      console.log(`Original Author: ${decoded7[0]}`);
      console.log(`Is Set: ${decoded7[0] !== ethers.ZeroAddress ? '✅ YES' : '❌ NO'}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the check
checkChapterAttribution()
  .then(() => console.log('\n✅ Check complete'))
  .catch(console.error);