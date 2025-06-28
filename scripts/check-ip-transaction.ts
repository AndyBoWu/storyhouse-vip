#!/usr/bin/env npx tsx

/**
 * Check IP Asset registration by transaction hash
 */

import { createPublicClient, http } from 'viem'
import { storyTestnet } from '@story-protocol/core-sdk'

// From your console logs
const TX_HASH = '0xc54d73124b503e7ed1d85cfa4efa218096e98e59c086160a0796bc551c6350c8'
const IP_ASSET_ID = '0x52012D203C9E33ADfd2c3813276c4A5fba409990'
const RPC_URL = 'https://aeneid.storyrpc.io'

async function main() {
  console.log('🔍 Checking IP Asset Registration via Transaction')
  console.log('=' .repeat(60))
  
  const publicClient = createPublicClient({
    chain: storyTestnet,
    transport: http(RPC_URL),
  })
  
  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: TX_HASH as `0x${string}`,
    })
    
    console.log('📝 Transaction Details:')
    console.log(`- Hash: ${receipt.transactionHash}`)
    console.log(`- Status: ${receipt.status === 'success' ? '✅ Success' : '❌ Failed'}`)
    console.log(`- Block Number: ${receipt.blockNumber}`)
    console.log(`- Gas Used: ${receipt.gasUsed}`)
    console.log()
    
    if (receipt.status === 'success') {
      console.log('✅ IP Asset Registration Successful!')
      console.log(`🆔 IP Asset ID: ${IP_ASSET_ID}`)
      console.log()
      console.log('📊 View on Explorer:')
      console.log(`- Transaction: https://aeneid.storyscan.io/tx/${TX_HASH}`)
      console.log(`- IP Asset: https://aeneid.storyscan.io/ipa/${IP_ASSET_ID}`)
      
      // Check if it's a derivative by looking for specific events
      const hasParentEvent = receipt.logs.some(log => 
        log.topics[0] === '0x8daaf060c3306c38e068a75c815bf16aeab43b01c4b92c3a632c0b12b0e6c147'
      )
      
      if (hasParentEvent) {
        console.log()
        console.log('🌿 This appears to be a derivative IP asset')
      }
    } else {
      console.log('❌ Transaction failed!')
    }
    
  } catch (error) {
    console.error('❌ Error checking transaction:', error)
    console.log()
    console.log('💡 The transaction might be too new. Try again in a few seconds.')
  }
}

main().catch(console.error)