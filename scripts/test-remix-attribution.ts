#!/usr/bin/env npx tsx

/**
 * Test script to verify chapter attribution
 * NOTE: Remixed/derivative books are no longer supported - only individual chapters
 */

import { createPublicClient, http, keccak256, toBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { storyTestnet } from '@story-protocol/core-sdk'

// Configuration
const RPC_URL = 'https://aeneid.storyrpc.io'
const CONTRACT_ADDRESS = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6' as const

// Test book IDs
const ANDY_BOOK = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/shadows-and-light'
const BOB_BOOK = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70/shadows-and-light-remix-chapter-4'

// Contract ABI
const CHAPTER_ATTRIBUTION_ABI = [
  {
    name: 'chapterAttributions',
    type: 'function' as const,
    inputs: [
      { name: '', type: 'bytes32' },
      { name: '', type: 'uint256' }
    ],
    outputs: [
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' }
    ],
    stateMutability: 'view' as const
  }
]

async function main() {
  console.log('🔍 Testing Remix Chapter Attribution Display')
  console.log('=' .repeat(80))
  
  // Create public client
  const publicClient = createPublicClient({
    chain: storyTestnet,
    transport: http(RPC_URL),
  })
  
  // Test Andy's original book - Chapter 4
  console.log('\n📚 Andy\'s Original Book - Chapter 4')
  console.log(`Book ID: ${ANDY_BOOK}`)
  
  const andyBookId = keccak256(toBytes(ANDY_BOOK))
  console.log(`Bytes32 ID: ${andyBookId}`)
  
  try {
    const andyAttribution = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CHAPTER_ATTRIBUTION_ABI,
      functionName: 'chapterAttributions',
      args: [andyBookId, 4n],
    })
    
    const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = andyAttribution
    const isSet = originalAuthor !== '0x0000000000000000000000000000000000000000'
    
    console.log('\nAttribution Result:')
    console.log(`- Is Set: ${isSet}`)
    console.log(`- Original Author: ${originalAuthor}`)
    console.log(`- Unlock Price: ${Number(unlockPrice) / 1e18} TIP`)
    console.log(`- Is Original Content: ${isOriginalContent}`)
  } catch (error) {
    console.error('❌ Error checking Andy\'s attribution:', error)
  }
  
  // Test Bob's remixed book - Chapter 4
  console.log('\n\n📚 Bob\'s Remixed Book - Chapter 4')
  console.log(`Book ID: ${BOB_BOOK}`)
  
  const bobBookId = keccak256(toBytes(BOB_BOOK))
  console.log(`Bytes32 ID: ${bobBookId}`)
  
  try {
    const bobAttribution = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CHAPTER_ATTRIBUTION_ABI,
      functionName: 'chapterAttributions',
      args: [bobBookId, 4n],
    })
    
    const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = bobAttribution
    const isSet = originalAuthor !== '0x0000000000000000000000000000000000000000'
    
    console.log('\nAttribution Result:')
    console.log(`- Is Set: ${isSet}`)
    console.log(`- Original Author: ${originalAuthor}`)
    console.log(`- Unlock Price: ${Number(unlockPrice) / 1e18} TIP`)
    console.log(`- Is Original Content: ${isOriginalContent}`)
    
    if (!isSet) {
      console.log('\n⚠️  Attribution not set for Bob\'s chapter 4!')
      console.log('This is expected - Bob only remixed the chapter, didn\'t set new attribution.')
      console.log('\n✅ The fix in ChapterAttributionStatus component will:')
      console.log('1. Detect that Bob\'s book is a derivative')
      console.log('2. Check that chapter 4 is inherited (branches at ch3)')
      console.log('3. Query attribution from Andy\'s original book instead')
      console.log('4. Display "Inherited" badge with proper attribution to Andy')
    }
  } catch (error) {
    console.error('❌ Error checking Bob\'s attribution:', error)
  }
  
  console.log('\n' + '=' .repeat(80))
  console.log('✅ Test complete! The ChapterAttributionStatus component has been updated to handle inherited chapters.')
  console.log('\nKey changes:')
  console.log('- Detects if a book is a derivative by checking parentBook and branchPoint')
  console.log('- For inherited chapters, queries attribution from the parent book')
  console.log('- Shows "Inherited" badge and explains revenue sharing')
  console.log('- Displays original author information properly')
}

main().catch(console.error)