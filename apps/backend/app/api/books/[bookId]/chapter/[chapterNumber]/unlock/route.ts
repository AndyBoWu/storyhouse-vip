import { NextRequest, NextResponse } from 'next/server'
import { chapterUnlockStorage } from '@/lib/storage/chapterUnlockStorage'

interface UnlockChapterRequest {
  userAddress: string
  transactionHash?: string
  readingSessionId?: string
}

interface UnlockChapterResponse {
  success: boolean
  data?: {
    bookId: string
    chapterNumber: number
    unlockPrice: number
    isFree: boolean
    canAccess: boolean
    alreadyUnlocked: boolean
    chapterContent?: string
    transactionHash?: string
  }
  error?: string
}

/**
 * POST /api/books/[bookId]/chapter/[chapterNumber]/unlock
 * 
 * Unlock a chapter for reading with tiered pricing:
 * - Chapters 1-3: FREE (no payment required)
 * - Chapters 4+: 0.5 TIP tokens
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string, chapterNumber: string }> }
) {
  try {
    const { bookId, chapterNumber } = await params
    const body: UnlockChapterRequest = await request.json()
    
    console.log('🔓 Chapter unlock request:', {
      bookId,
      chapterNumber: parseInt(chapterNumber),
      userAddress: body.userAddress
    })

    // Validate input
    const chapterNum = parseInt(chapterNumber)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chapter number'
      } as UnlockChapterResponse, { status: 400 })
    }

    if (!body.userAddress || !/^0x[a-fA-F0-9]{40}$/.test(body.userAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user address'
      } as UnlockChapterResponse, { status: 400 })
    }

    // Determine if chapter is free (chapters 1-3)
    const isFree = chapterNum <= 3
    const unlockPrice = isFree ? 0 : 10 // 10 TIP for chapters 4+
    
    console.log('💰 Chapter pricing:', {
      chapterNumber: chapterNum,
      isFree,
      unlockPrice
    })

    // For free chapters, grant immediate access
    if (isFree) {
      // Record the free unlock
      chapterUnlockStorage.recordUnlock({
        userAddress: body.userAddress,
        bookId,
        chapterNumber: chapterNum,
        isFree: true,
        transactionHash: undefined
      })
      
      return NextResponse.json({
        success: true,
        data: {
          bookId,
          chapterNumber: chapterNum,
          unlockPrice: 0,
          isFree: true,
          canAccess: true,
          alreadyUnlocked: false,
          chapterContent: undefined // Will be fetched separately
        }
      } as UnlockChapterResponse)
    }

    // For paid chapters (4+), require blockchain transaction
    if (!body.transactionHash) {
      return NextResponse.json({
        success: false,
        error: 'Transaction hash required for paid chapters'
      } as UnlockChapterResponse, { status: 400 })
    }

    // TODO: Validate blockchain transaction
    // - Check if transaction exists and is confirmed
    // - Verify transaction calls TIP token transfer
    // - Confirm user paid the correct amount (0.5 TIP)

    console.log('🔗 Blockchain transaction validation needed:', {
      transactionHash: body.transactionHash,
      expectedPrice: unlockPrice,
      userAddress: body.userAddress
    })

    // Record the paid unlock (validation will be implemented later)
    chapterUnlockStorage.recordUnlock({
      userAddress: body.userAddress,
      bookId,
      chapterNumber: chapterNum,
      isFree: false,
      transactionHash: body.transactionHash
    })

    return NextResponse.json({
      success: true,
      data: {
        bookId,
        chapterNumber: chapterNum,
        unlockPrice,
        isFree: false,
        canAccess: true,
        alreadyUnlocked: true, // Now properly marked as unlocked
        transactionHash: body.transactionHash
      }
    } as UnlockChapterResponse)

  } catch (error) {
    console.error('❌ Chapter unlock failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during chapter unlock'
    } as UnlockChapterResponse, { status: 500 })
  }
}

/**
 * GET /api/books/[bookId]/chapter/[chapterNumber]/unlock
 * 
 * Check unlock status and pricing for a chapter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string, chapterNumber: string }> }
) {
  try {
    const { bookId, chapterNumber } = await params
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    
    const chapterNum = parseInt(chapterNumber)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chapter number'
      } as UnlockChapterResponse, { status: 400 })
    }

    // Determine pricing
    const isFree = chapterNum <= 3
    const unlockPrice = isFree ? 0 : 0.5
    
    // Check if user has already unlocked this chapter
    let alreadyUnlocked = false
    if (userAddress) {
      alreadyUnlocked = chapterUnlockStorage.hasUnlocked(userAddress, bookId, chapterNum)
    }
    
    // For free chapters, always allow access
    // For paid chapters, only allow if unlocked or if it's actually free
    const canAccess = isFree || alreadyUnlocked
    
    console.log('🔍 Chapter access check:', {
      bookId,
      chapterNumber: chapterNum,
      userAddress: userAddress || 'none',
      isFree,
      alreadyUnlocked,
      canAccess
    })
    
    return NextResponse.json({
      success: true,
      data: {
        bookId,
        chapterNumber: chapterNum,
        unlockPrice,
        isFree,
        canAccess,
        alreadyUnlocked
      }
    } as UnlockChapterResponse)

  } catch (error) {
    console.error('❌ Chapter unlock check failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error checking chapter unlock'
    } as UnlockChapterResponse, { status: 500 })
  }
}