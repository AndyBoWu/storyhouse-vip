import { NextRequest, NextResponse } from 'next/server'
import { persistentChapterUnlockStorage } from '@/lib/storage/persistentChapterUnlockStorage'

/**
 * Test endpoint to add Bob's unlocks for chapters 4-10 of Project Phoenix
 * GET /api/test/add-bob-unlocks
 */
export async function GET(request: NextRequest) {
  try {
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
    console.log('📊 Storage Stats:', stats)
    
    // Verify Bob's unlocks
    const bobUnlocks = persistentChapterUnlockStorage.getUserUnlocks(bobAddress)
    
    return NextResponse.json({
      success: true,
      message: 'Bob test unlocks added successfully',
      stats,
      bobUnlocks: bobUnlocks.map(u => ({
        chapterNumber: u.chapterNumber,
        unlockedAt: new Date(u.unlockedAt).toISOString()
      }))
    })
  } catch (error) {
    console.error('Failed to add Bob test unlocks:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}