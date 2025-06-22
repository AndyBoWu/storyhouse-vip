import { NextRequest, NextResponse } from 'next/server'
import { BookStorageService } from '@/lib/storage/bookStorage'
import { chapterAccessService } from '@/lib/services/chapterAccessService'

interface UnlockChapterRequest {
  userAddress: string
  transactionHash?: string
  readingSessionId?: string
  licenseTokenId?: string // Story Protocol license NFT ID
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
    ipAssetId?: string
    parentIpAssetId?: string
    licenseTermsId?: string
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
      await chapterAccessService.recordUnlock(
        body.userAddress,
        bookId,
        chapterNum,
        undefined, // No transaction hash for free chapters
        undefined  // No license token for free chapters
      )
      
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

    // For paid chapters (4+), require blockchain transaction AND license token
    if (!body.transactionHash) {
      return NextResponse.json({
        success: false,
        error: 'Transaction hash required for paid chapters'
      } as UnlockChapterResponse, { status: 400 })
    }

    // Verify the transaction
    console.log('🔗 Verifying blockchain transaction...', {
      transactionHash: body.transactionHash,
      expectedPrice: '0.5 TIP', // Fixed price for chapters 4+
      userAddress: body.userAddress
    })

    try {
      // Verify the transaction is valid
      const isValidTransaction = await chapterAccessService.verifyUnlockTransaction(
        body.transactionHash,
        body.userAddress,
        '500000000000000000', // 0.5 TIP in wei
        bookId,
        chapterNum
      )

      if (!isValidTransaction) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or unconfirmed transaction. Please ensure the transaction is confirmed.'
        } as UnlockChapterResponse, { status: 400 })
      }

      console.log('✅ Transaction verified successfully')
      
      // Record the verified unlock with license token ID
      await chapterAccessService.recordUnlock(
        body.userAddress,
        bookId,
        chapterNum,
        body.transactionHash,
        body.licenseTokenId
      )

      // If license token ID provided, store it for future verification
      if (body.licenseTokenId) {
        console.log('📜 License token ID recorded:', body.licenseTokenId)
        // TODO: Store license token ID for future Story Protocol verification
      }

    } catch (verifyError) {
      console.error('❌ Transaction verification failed:', verifyError)
      return NextResponse.json({
        success: false,
        error: 'Failed to verify transaction. Please try again.'
      } as UnlockChapterResponse, { status: 400 })
    }

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
    let canAccess = false
    
    // Use chapterAccessService to check both local storage AND blockchain
    if (userAddress || isFree) {
      const accessResult = await chapterAccessService.checkChapterAccess(
        bookId,
        chapterNum,
        userAddress
      )
      
      canAccess = accessResult.hasAccess
      // Mark as already unlocked if reason is 'unlocked', 'blockchain_unlocked', or 'licensed'
      alreadyUnlocked = ['unlocked', 'blockchain_unlocked', 'licensed'].includes(accessResult.reason)
      
      console.log('🔍 Access check result:', {
        bookId,
        chapterNumber: chapterNum,
        userAddress,
        hasAccess: accessResult.hasAccess,
        reason: accessResult.reason,
        alreadyUnlocked
      })
    }
    
    // Fetch chapter and book metadata to get IP asset information
    let ipAssetId: string | undefined
    let parentIpAssetId: string | undefined
    let licenseTermsId: string | undefined
    
    try {
      const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any)
      
      // Get chapter metadata for IP asset ID
      const chapterData = await BookStorageService.getChapterContent(
        authorAddress,
        slug,
        chapterNum
      )
      ipAssetId = chapterData.ipAssetId
      parentIpAssetId = chapterData.parentIpAssetId
      licenseTermsId = chapterData.licenseTermsId
      
      // Get book metadata for additional info
      const bookMetadata = await BookStorageService.getBookMetadata(bookId as any)
      
      // If chapter doesn't have parent IP, use book's IP asset ID
      if (!parentIpAssetId && bookMetadata.ipAssetId) {
        parentIpAssetId = bookMetadata.ipAssetId
      }
    } catch (err) {
      console.log('Could not fetch IP asset information:', err)
      // Don't fail the whole request if IP info is missing
    }
    
    console.log('🔍 Chapter access check:', {
      bookId,
      chapterNumber: chapterNum,
      userAddress: userAddress || 'none',
      isFree,
      alreadyUnlocked,
      canAccess,
      ipAssetId,
      licenseTermsId
    })
    
    return NextResponse.json({
      success: true,
      data: {
        bookId,
        chapterNumber: chapterNum,
        unlockPrice,
        isFree,
        canAccess,
        alreadyUnlocked,
        ipAssetId,
        parentIpAssetId,
        licenseTermsId
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