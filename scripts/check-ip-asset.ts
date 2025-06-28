#!/usr/bin/env npx tsx

/**
 * Check if an IP Asset is registered on Story Protocol
 */

import { createPublicClient, http } from 'viem'
import { storyTestnet } from '@story-protocol/core-sdk'

// Configuration
const IP_ASSET_ID = '0x52012D203C9E33ADfd2c3813276c4A5fba409990'
const RPC_URL = 'https://aeneid.storyrpc.io'

// Story Protocol IP Asset Registry contract
const IP_ASSET_REGISTRY = '0x292639452A975630802C17c9267169D93BD5a793' as const

// Minimal ABI for checking IP registration
const IP_ASSET_REGISTRY_ABI = [
  {
    name: 'isRegistered',
    type: 'function',
    inputs: [{ name: 'ipId', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    name: 'ipAssetOwner',
    type: 'function',
    inputs: [{ name: 'ipId', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  }
] as const

async function main() {
  console.log('🔍 Checking IP Asset Registration')
  console.log('=' .repeat(60))
  console.log(`IP Asset ID: ${IP_ASSET_ID}`)
  console.log()
  
  // Create public client
  const publicClient = createPublicClient({
    chain: storyTestnet,
    transport: http(RPC_URL),
  })
  
  try {
    // Check if IP is registered
    const isRegistered = await publicClient.readContract({
      address: IP_ASSET_REGISTRY,
      abi: IP_ASSET_REGISTRY_ABI,
      functionName: 'isRegistered',
      args: [IP_ASSET_ID as `0x${string}`],
    })
    
    console.log(`✅ Is Registered: ${isRegistered}`)
    
    if (isRegistered) {
      // Get IP owner
      try {
        const owner = await publicClient.readContract({
          address: IP_ASSET_REGISTRY,
          abi: IP_ASSET_REGISTRY_ABI,
          functionName: 'ipAssetOwner',
          args: [IP_ASSET_ID as `0x${string}`],
        })
        
        console.log(`👤 IP Owner: ${owner}`)
      } catch (error) {
        console.log('⚠️  Could not fetch IP owner')
      }
    }
    
    // Additional info
    console.log()
    console.log('📊 Additional Information:')
    console.log(`- Explorer URL: https://aeneid.storyscan.io/ipa/${IP_ASSET_ID}`)
    console.log(`- This appears to be Bob's remixed chapter 4`)
    console.log(`- Parent should be Andy's original book`)
    
  } catch (error) {
    console.error('❌ Error checking IP registration:', error)
  }
}

main().catch(console.error)