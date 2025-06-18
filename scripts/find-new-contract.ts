import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider('https://aeneid.storyrpc.io')
const deployer = '0xD9b6d1bd7D8A90915B905EB801c55bA5De1d4476'

async function findNewContract() {
  // Get the most recent block
  const latestBlock = await provider.getBlockNumber()
  console.log('Latest block:', latestBlock)
  
  // Search recent blocks for deployment from our deployer
  const blocksToSearch = 100
  const startBlock = Math.max(latestBlock - blocksToSearch, 5711500) // Start from around deployment block
  
  console.log(`Searching blocks ${startBlock} to ${latestBlock} for deployments from ${deployer}`)
  
  for (let blockNum = latestBlock; blockNum >= startBlock; blockNum--) {
    const block = await provider.getBlock(blockNum, true)
    if (!block || !block.transactions) continue
    
    for (const tx of block.transactions) {
      if (typeof tx === 'string') continue
      
      if (tx.from?.toLowerCase() === deployer.toLowerCase() && !tx.to) {
        // This is a contract creation transaction
        const receipt = await provider.getTransactionReceipt(tx.hash)
        if (receipt && receipt.contractAddress) {
          console.log(`\nFound contract deployment!`)
          console.log(`Block: ${blockNum}`)
          console.log(`Transaction: ${tx.hash}`)
          console.log(`Contract Address: ${receipt.contractAddress}`)
          console.log(`Gas Used: ${receipt.gasUsed.toString()}`)
          
          // Try to verify it's HybridRevenueControllerV2 by checking code size
          const code = await provider.getCode(receipt.contractAddress)
          console.log(`Contract code size: ${code.length} bytes`)
          
          return receipt.contractAddress
        }
      }
    }
  }
  
  console.log('No new contract deployment found in recent blocks')
  
  // Alternative: Calculate expected address based on nonce
  const nonce = await provider.getTransactionCount(deployer)
  console.log(`\nCurrent nonce for deployer: ${nonce}`)
  
  // The deployment used nonce 43 (0x2b), so if current is 44, the contract was deployed
  if (nonce === 44) {
    const expectedAddress = ethers.getCreateAddress({ from: deployer, nonce: 43 })
    console.log(`Expected contract address (nonce 43): ${expectedAddress}`)
    
    // Verify it exists
    const code = await provider.getCode(expectedAddress)
    if (code !== '0x') {
      console.log(`Contract confirmed at: ${expectedAddress}`)
      console.log(`Contract code size: ${code.length} bytes`)
      return expectedAddress
    }
  }
}

findNewContract().catch(console.error)