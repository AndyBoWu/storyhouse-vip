import { NextRequest, NextResponse } from 'next/server'
import { 
  BookId,
  AuthorAddress,
  BookMetadata,
  BOOK_SYSTEM_CONSTANTS 
} from '@/lib/types/book'
import { BookStorageService } from '@/lib/storage/bookStorage'

/**
 * GET /api/books/branch?parentBookId=...
 * 
 * Returns information about available branch points for a book
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parentBookId = searchParams.get('parentBookId') as BookId
    
    console.log('🌿 Getting branch info for:', parentBookId)
    
    if (!parentBookId || !BookStorageService.isValidBookId(parentBookId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID format'
      }, { status: 400 })
    }
    
    // Load book metadata
    let book
    try {
      book = await BookStorageService.getBookMetadata(parentBookId)
    } catch (error) {
      console.error('❌ Book not found:', error)
      return NextResponse.json({
        success: false,
        error: 'Book not found'
      }, { status: 404 })
    }
    
    // Check if book allows remixing
    if (!book.isRemixable) {
      return NextResponse.json({
        success: false,
        error: 'This book does not allow branching/remixing'
      }, { status: 403 })
    }
    
    // Get available chapters
    const chapters = Object.keys(book.chapterMap)
      .map(ch => parseInt(ch.replace('ch', '')))
      .sort((a, b) => a - b)
    
    // Branch points are chapters 3 and above
    const availableBranchPoints = chapters
      .filter(ch => ch >= 3)
      .map(ch => ({
        chapterKey: `ch${ch}`,
        chapterNumber: ch
      }))
    
    console.log('✅ Available branch points:', availableBranchPoints)
    
    return NextResponse.json({
      success: true,
      availableBranchPoints,
      book: {
        bookId: book.bookId,
        title: book.title,
        description: book.description,
        coverUrl: book.coverUrl,
        totalChapters: chapters.length
      }
    })
    
  } catch (error) {
    console.error('❌ Error getting branch info:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get branch information'
    }, { status: 500 })
  }
}

/**
 * POST /api/books/branch
 * 
 * Simplified branching endpoint for the new design where all chapters
 * (original and derivative) belong to the same book.
 * 
 * This endpoint now just validates that:
 * 1. The parent book exists
 * 2. The branch point is valid
 * 3. The user can write chapters
 * 
 * It no longer creates a new book - chapters are added directly to the original book.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🌿 Starting book branching validation...')

    // Parse the multipart form data
    const formData = await request.formData()
    
    // Extract branching data
    const parentBookId = formData.get('parentBookId') as BookId
    const branchPoint = formData.get('branchPoint') as string // "ch3"
    const authorAddress = formData.get('authorAddress') as AuthorAddress
    
    console.log('🔀 Branch validation request:', {
      parentBookId,
      branchPoint,
      authorAddress
    })

    // ===== VALIDATION =====
    
    if (!parentBookId || !BookStorageService.isValidBookId(parentBookId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parent book ID format'
      }, { status: 400 })
    }

    if (!branchPoint || !/^ch\d+$/.test(branchPoint)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid branch point format (expected: ch1, ch2, etc.)'
      }, { status: 400 })
    }

    if (!authorAddress || !/^0x[a-fA-F0-9]{40}$/.test(authorAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid author address format'
      }, { status: 400 })
    }

    // ===== LOAD PARENT BOOK =====
    
    let parentBook
    try {
      parentBook = await BookStorageService.getBookMetadata(parentBookId)
      console.log('✅ Parent book found:', parentBook.title)
    } catch (error) {
      console.error('❌ Parent book not found:', error)
      return NextResponse.json({
        success: false,
        error: 'Parent book not found'
      }, { status: 404 })
    }

    // ===== VALIDATE BRANCH POINT =====
    
    const chapterNumber = parseInt(branchPoint.replace('ch', ''))
    
    // Must be chapter 3 or later
    if (chapterNumber < 3) {
      return NextResponse.json({
        success: false,
        error: 'Branching allowed from chapter 3 onwards only (chapters 1-2 are protected)'
      }, { status: 400 })
    }

    // Check if branch point exists
    const maxChapter = Math.max(
      ...Object.keys(parentBook.chapterMap).map(ch => parseInt(ch.replace('ch', ''))),
      0
    )
    
    if (chapterNumber > maxChapter) {
      return NextResponse.json({
        success: false,
        error: `Branch point ch${chapterNumber} does not exist. Book has ${maxChapter} chapters.`
      }, { status: 400 })
    }

    // Check if book allows remixing
    if (!parentBook.isRemixable) {
      return NextResponse.json({
        success: false,
        error: 'This book does not allow branching/remixing'
      }, { status: 403 })
    }

    // Calculate next chapter number (continue from branch point)
    const nextChapterNumber = chapterNumber + 1

    console.log('✅ Branch validation successful')
    console.log(`📝 Creating derivative book for ${authorAddress}`)

    // ===== CREATE DERIVATIVE BOOK =====
    
    // Generate a unique slug for the derivative book
    const timestamp = Date.now()
    const derivativeSlug = `${parentBook.slug}-${authorAddress.slice(-4).toLowerCase()}-${timestamp}`
    const derivativeBookId = `${authorAddress.toLowerCase()}/${derivativeSlug}` as BookId
    
    console.log('📚 Creating derivative book:', {
      derivativeBookId,
      parentBookId,
      branchPoint,
      nextChapterNumber
    })
    
    // Extract additional form data for the derivative book
    const newTitle = formData.get('newTitle') as string || `${parentBook.title} - Remix`
    const newDescription = formData.get('newDescription') as string || parentBook.description
    const genres = JSON.parse(formData.get('genres') as string || '[]')
    const contentRating = formData.get('contentRating') as BookMetadata['contentRating'] || parentBook.contentRating
    
    // Create initial metadata for the derivative book
    const derivativeMetadata = BookStorageService.createInitialBookMetadata(
      authorAddress,
      derivativeSlug,
      newTitle,
      newDescription,
      genres.length > 0 ? genres : parentBook.genres,
      contentRating
    )
    
    // Important: Mark this as a derivative book
    derivativeMetadata.parentBook = parentBookId
    derivativeMetadata.isDerivative = true
    
    // Copy chapter references from parent book up to branch point
    const chaptersToCopy = Object.entries(parentBook.chapterMap)
      .filter(([ch, _]) => {
        const num = parseInt(ch.replace('ch', ''))
        return num <= chapterNumber
      })
    
    // Build the chapter map with inherited chapters
    derivativeMetadata.chapterMap = {}
    chaptersToCopy.forEach(([ch, chapterPath]) => {
      derivativeMetadata.chapterMap[ch] = chapterPath
    })
    
    // Update chapter count
    derivativeMetadata.totalChapters = Object.keys(derivativeMetadata.chapterMap).length
    derivativeMetadata.chapters = derivativeMetadata.totalChapters
    
    // Handle cover image if provided
    const coverFile = formData.get('newCover') as File
    if (coverFile) {
      try {
        console.log('📸 Processing cover image for derivative book')
        
        // Convert file to buffer
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
        
        const coverUrl = await BookStorageService.storeBookCover(
          authorAddress,
          derivativeSlug,
          coverBuffer,
          coverFile.type
        )
        derivativeMetadata.coverUrl = coverUrl
        derivativeMetadata.coverImageUrl = coverUrl // Backward compatibility
      } catch (error) {
        console.error('⚠️ Cover upload failed, continuing without cover:', error)
      }
    } else {
      // Use parent book's cover
      derivativeMetadata.coverUrl = parentBook.coverUrl
      derivativeMetadata.coverImageUrl = parentBook.coverImageUrl
    }
    
    // Store the derivative book metadata
    await BookStorageService.storeBookMetadata(
      authorAddress,
      derivativeSlug,
      derivativeMetadata
    )
    
    console.log('✅ Derivative book created successfully:', derivativeBookId)

    // Return the derivative book info
    return NextResponse.json({
      success: true,
      message: 'Derivative book created successfully',
      book: {
        bookId: derivativeBookId,  // Return derivative book ID
        title: newTitle,
        coverUrl: derivativeMetadata.coverUrl,
        chapterMap: derivativeMetadata.chapterMap,
        nextChapterNumber,
        parentBookId,
        isDerivative: true
      }
    })

  } catch (error) {
    console.error('❌ Branching error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to validate branching'
    }, { status: 500 })
  }
}