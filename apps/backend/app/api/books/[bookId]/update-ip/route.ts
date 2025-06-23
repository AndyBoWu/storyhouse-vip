import { NextRequest, NextResponse } from 'next/server'
import { BookStorageService } from '@/lib/storage/bookStorage'
import type { BookId } from '@/lib/types/book'

/**
 * POST /api/books/[bookId]/update-ip
 * 
 * Update book's IP registration information after successful blockchain registration.
 * This is called after a derivative book is registered on Story Protocol.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const bookId = decodeURIComponent(params.bookId) as BookId
    console.log('📝 Updating IP registration for book:', bookId)

    // Parse request body
    const body = await request.json()
    const { ipAssetId, transactionHash, licenseTermsId } = body

    if (!ipAssetId || !transactionHash) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ipAssetId and transactionHash'
      }, { status: 400 })
    }

    // Load existing book metadata
    const bookMetadata = await BookStorageService.getBookMetadata(bookId)
    
    // Update with IP registration info
    const updatedMetadata = {
      ...bookMetadata,
      ipAssetId,
      transactionHash,
      licenseTermsId: licenseTermsId || bookMetadata.licenseTermsId,
      updatedAt: new Date().toISOString()
    }

    // Parse book ID to get author and slug
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId)

    // Save updated metadata
    await BookStorageService.storeBookMetadata(
      authorAddress,
      slug,
      updatedMetadata
    )

    console.log('✅ Book IP registration updated successfully:', {
      bookId,
      ipAssetId,
      transactionHash
    })

    return NextResponse.json({
      success: true,
      message: 'Book IP registration updated successfully',
      data: {
        bookId,
        ipAssetId,
        transactionHash,
        licenseTermsId: updatedMetadata.licenseTermsId
      }
    })

  } catch (error) {
    console.error('❌ Failed to update book IP registration:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update book IP registration'
    }, { status: 500 })
  }
}