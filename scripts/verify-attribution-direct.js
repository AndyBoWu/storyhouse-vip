const { ethers } = require('ethers');

// Direct RPC call to read storage
async function verifyAttributionDirect() {
  const provider = new ethers.JsonRpcProvider('https://aeneid.storyrpc.io');
  
  // Contract address
  const contractAddress = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';
  
  // Function selector for chapterAttributions(bytes32,uint256)
  const functionSelector = '0x8c5d0d7e'; // First 4 bytes of keccak256("chapterAttributions(bytes32,uint256)")
  
  // Parameters
  const bookId = '0x5c4c2cd807018b9c81ab786a4a19a7d0d74f061c750756924bead3757b0eeb8b';
  const chapterNumber = 9;
  
  // Encode parameters
  const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256'],
    [bookId, chapterNumber]
  );
  
  // Full calldata
  const calldata = functionSelector + encodedParams.slice(2);
  
  try {
    // Make the call
    const result = await provider.call({
      to: contractAddress,
      data: calldata
    });
    
    console.log('Raw result:', result);
    
    // Decode the result
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ['address', 'bytes32', 'uint256', 'bool'],
      result
    );
    
    console.log('\nDecoded Attribution:');
    console.log('- Original Author:', decoded[0]);
    console.log('- Source Book ID:', decoded[1]);
    console.log('- Unlock Price (wei):', decoded[2].toString());
    console.log('- Unlock Price (TIP):', ethers.formatEther(decoded[2]));
    console.log('- Is Original Content:', decoded[3]);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyAttributionDirect();