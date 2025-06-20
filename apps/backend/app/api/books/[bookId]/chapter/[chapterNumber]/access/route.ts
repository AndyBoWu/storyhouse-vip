import { NextRequest, NextResponse } from 'next/server'
import { chapterAccessService } from '@/lib/services/chapterAccessService'

interface RouteParams {
  params: {
    bookId: string
    chapterNumber: string
  }
}

// GET /api/books/[bookId]/chapter/[chapterNumber]/access
export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams['params']> }
) {
  try {
    const params = await context.params
    const bookId = params.bookId // Next.js already decodes this
    const chapterNumber = parseInt(params.chapterNumber)
    
    // Get user address from query params
    const userAddress = request.nextUrl.searchParams.get('userAddress')
    
    console.log('📖 Checking chapter access:', {
      bookId,
      chapterNumber,
      userAddress,
      timestamp: new Date().toISOString()
    })
    
    // Check the chapter access
    const accessInfo = await chapterAccessService.checkChapterAccess(
      bookId,
      chapterNumber,
      userAddress || undefined
    )
    
    console.log('✅ Access check result:', {
      bookId,
      chapterNumber,
      hasAccess: accessInfo.hasAccess,
      reason: accessInfo.reason
    })
    
    return NextResponse.json({
      success: true,
      canAccess: accessInfo.hasAccess,
      alreadyUnlocked: accessInfo.reason === 'unlocked' || accessInfo.reason === 'blockchain_unlocked',
      isFree: accessInfo.reason === 'free',
      reason: accessInfo.reason,
      error: accessInfo.error
    })
    
  } catch (error) {
    console.error('❌ Error checking chapter access:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check chapter access'
      },
      { status: 500 }
    )
  }
}