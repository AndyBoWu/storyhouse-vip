import { NextRequest, NextResponse } from 'next/server'
import { BookStorageService } from '@/lib/storage/bookStorage'

/**
 * Debug endpoint to list available books and their IDs
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Listing all available books...')
    
    // Get the books from the main books API logic
    const booksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/books`)
    const booksData = await booksResponse.json()
    
    if (!booksData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch books from main API'
      }, { status: 500 })
    }
    
    const books = booksData.books || []
    console.log(`📚 Found ${books.length} books`)
    
    // Test each book ID
    const bookTests = await Promise.all(
      books.map(async (book: any) => {
        try {
          console.log(`🔍 Testing book ID: ${book.id}`)
          
          // Test validation
          const isValid = BookStorageService.isValidBookId(book.id)
          
          // Test parsing
          let parsed = null
          try {
            parsed = BookStorageService.parseBookId(book.id)
          } catch (parseError) {
            parsed = { error: parseError instanceof Error ? parseError.message : 'Parse failed' }
          }
          
          // Test metadata loading
          let metadataExists = false
          let metadataError = null
          try {
            await BookStorageService.getBookMetadata(book.id)
            metadataExists = true
          } catch (metaError) {
            metadataError = metaError instanceof Error ? metaError.message : 'Metadata load failed'
          }
          
          return {
            id: book.id,
            title: book.title,
            chapters: book.chapters,
            isValid,
            parsed,
            metadataExists,
            metadataError
          }
        } catch (error) {
          return {
            id: book.id,
            title: book.title,
            error: error instanceof Error ? error.message : 'Test failed'
          }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      totalBooks: books.length,
      bookTests
    })
    
  } catch (error) {
    console.error('❌ Debug books error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}