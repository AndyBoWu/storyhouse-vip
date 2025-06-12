import { NextRequest, NextResponse } from 'next/server'
import { chapterUnlockStorage } from '@/lib/storage/chapterUnlockStorage'

/**
 * GET /api/unlock-stats
 * 
 * Get chapter unlock statistics for debugging
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    const bookId = searchParams.get('bookId')

    const stats = chapterUnlockStorage.getStats()
    
    let userUnlocks = []
    let bookUnlocks = []

    if (userAddress) {
      userUnlocks = chapterUnlockStorage.getUserUnlocks(userAddress)
    }

    if (bookId) {
      bookUnlocks = chapterUnlockStorage.getBookUnlocks(bookId)
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        userUnlocks: userAddress ? userUnlocks : undefined,
        bookUnlocks: bookId ? bookUnlocks : undefined
      }
    })

  } catch (error) {
    console.error('❌ Unlock stats failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}