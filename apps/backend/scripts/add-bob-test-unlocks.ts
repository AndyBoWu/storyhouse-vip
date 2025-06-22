#!/usr/bin/env ts-node

/**
 * Script to add test unlocks for Bob's account
 * This simulates Bob having purchased chapters 4-10 of Project Phoenix
 * 
 * Usage: cd apps/backend && npx ts-node scripts/add-bob-test-unlocks.ts
 */

import { persistentChapterUnlockStorage } from '../lib/storage/persistentChapterUnlockStorage'

async function addBobTestUnlocks() {
  console.log('🚀 Adding test unlocks for Bob...')
  
  const bobAddress = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70'
  const bookId = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'
  
  // Add unlocks for chapters 4-10
  for (let chapterNum = 4; chapterNum <= 10; chapterNum++) {
    await persistentChapterUnlockStorage.recordUnlock({
      userAddress: bobAddress,
      bookId,
      chapterNumber: chapterNum,
      transactionHash: `0xtest_${chapterNum}_${Date.now()}`,
      isFree: false,
      licenseTokenId: `test_license_${chapterNum}`
    })
    
    console.log(`✅ Added unlock for chapter ${chapterNum}`)
  }
  
  // Display stats
  const stats = persistentChapterUnlockStorage.getStats()
  console.log('\n📊 Storage Stats:', stats)
  
  // Verify Bob's unlocks
  const bobUnlocks = persistentChapterUnlockStorage.getUserUnlocks(bobAddress)
  console.log(`\n🔍 Bob's unlocks (${bobUnlocks.length} total):`)
  bobUnlocks.forEach(unlock => {
    console.log(`  - Chapter ${unlock.chapterNumber}: ${new Date(unlock.unlockedAt).toISOString()}`)
  })
  
  console.log('\n✨ Done! Bob now has access to chapters 4-10 of Project Phoenix')
}

// Run the script
addBobTestUnlocks().catch(console.error)