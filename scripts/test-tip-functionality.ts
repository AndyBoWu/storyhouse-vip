#!/usr/bin/env npx tsx

/**
 * Test script for the tipping functionality
 * Tests the direct TIP token transfer from one user to another
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem'
import { storyTestnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Contract addresses
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'

// TIP Token ABI (minimal)
const TIP_TOKEN_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const

async function main() {
  try {
    console.log('🧪 Testing TIP token tipping functionality...\n')
    
    // Setup wallet client (using test account)
    const testPrivateKey = process.env.TEST_PRIVATE_KEY
    if (!testPrivateKey) {
      throw new Error('TEST_PRIVATE_KEY not found in environment')
    }
    
    const account = privateKeyToAccount(testPrivateKey as `0x${string}`)
    console.log('📱 Test account:', account.address)
    
    // Create clients
    const publicClient = createPublicClient({
      chain: storyTestnet,
      transport: http(storyTestnet.rpcUrls.default.http[0])
    })
    
    const walletClient = createWalletClient({
      account,
      chain: storyTestnet,
      transport: http(storyTestnet.rpcUrls.default.http[0])
    })
    
    // Test recipient (author address)
    const authorAddress = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2' // andybowu.ip
    
    // Check initial balances
    console.log('\n💰 Checking initial balances...')
    
    const senderBalance = await publicClient.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    
    const recipientBalance = await publicClient.readContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [authorAddress as `0x${string}`]
    })
    
    console.log(`  Sender balance: ${formatUnits(senderBalance, 18)} TIP`)
    console.log(`  Author balance: ${formatUnits(recipientBalance, 18)} TIP`)
    
    // Test tip amount
    const tipAmount = '1' // 1 TIP
    const tipAmountWei = parseUnits(tipAmount, 18)
    
    // Check if sender has enough balance
    if (senderBalance < tipAmountWei) {
      throw new Error(`Insufficient balance. Need ${tipAmount} TIP but have ${formatUnits(senderBalance, 18)} TIP`)
    }
    
    // Send tip
    console.log(`\n💸 Sending ${tipAmount} TIP to author...`)
    
    const hash = await walletClient.writeContract({
      address: TIP_TOKEN_ADDRESS as `0x${string}`,
      abi: TIP_TOKEN_ABI,
      functionName: 'transfer',
      args: [authorAddress as `0x${string}`, tipAmountWei]
    })
    
    console.log('  Transaction hash:', hash)
    console.log('  Waiting for confirmation...')
    
    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'success') {
      console.log('  ✅ Transaction confirmed!')
      console.log(`  Block: ${receipt.blockNumber}`)
      console.log(`  Gas used: ${receipt.gasUsed}`)
      
      // Check final balances
      console.log('\n💰 Checking final balances...')
      
      const finalSenderBalance = await publicClient.readContract({
        address: TIP_TOKEN_ADDRESS as `0x${string}`,
        abi: TIP_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [account.address]
      })
      
      const finalRecipientBalance = await publicClient.readContract({
        address: TIP_TOKEN_ADDRESS as `0x${string}`,
        abi: TIP_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [authorAddress as `0x${string}`]
      })
      
      console.log(`  Sender balance: ${formatUnits(finalSenderBalance, 18)} TIP`)
      console.log(`  Author balance: ${formatUnits(finalRecipientBalance, 18)} TIP`)
      
      // Verify the transfer
      const senderDiff = formatUnits(senderBalance - finalSenderBalance, 18)
      const recipientDiff = formatUnits(finalRecipientBalance - recipientBalance, 18)
      
      console.log('\n📊 Transfer summary:')
      console.log(`  Sender spent: ${senderDiff} TIP`)
      console.log(`  Author received: ${recipientDiff} TIP`)
      
      if (parseFloat(recipientDiff) === parseFloat(tipAmount)) {
        console.log('\n✅ Tip functionality test PASSED!')
      } else {
        console.log('\n❌ Tip functionality test FAILED - amounts don\'t match')
      }
      
    } else {
      console.error('  ❌ Transaction failed!')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
main().catch(console.error)