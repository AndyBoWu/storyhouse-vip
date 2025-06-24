import { NextRequest, NextResponse } from 'next/server'
import { 
  BookRegistrationRequest, 
  BookRegistrationResponse, 
  BookMetadata,
  AuthorAddress,
  BOOK_SYSTEM_CONSTANTS 
} from '@/lib/types/book'
import { BookStorageService } from '../../../../lib/storage/bookStorage'

/**
 * POST /api/books/register
 * 
 * Register a new book as a parent IP asset on Story Protocol
 * and store book metadata in R2 storage.
 * 
 * This creates the foundation for the collaborative book system
 * where chapters will be registered as derivative IP assets.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📚 Starting book registration...')

    // Parse the multipart form data
    const formData = await request.formData()
    
    // Extract book registration data
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const authorAddress = formData.get('authorAddress') as AuthorAddress
    const authorName = formData.get('authorName') as string || `${authorAddress.slice(-4)}`
    const genresJson = formData.get('genres') as string
    const contentRating = formData.get('contentRating') as BookMetadata['contentRating']
    const licenseTermsJson = formData.get('licenseTerms') as string
    
    // Parse JSON fields
    let genres: string[]
    let licenseTerms: any
    
    try {
      genres = JSON.parse(genresJson)
      licenseTerms = JSON.parse(licenseTermsJson)
    } catch (parseError) {
      console.error('❌ Invalid JSON in request:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format in genres or licenseTerms'
      } as BookRegistrationResponse, { status: 400 })
    }

    // Get optional cover file
    const coverFile = formData.get('coverFile') as File | null
    
    // Get IP Asset ID and transaction hash from frontend registration
    const ipAssetId = formData.get('ipAssetId') as string | null
    const transactionHash = formData.get('transactionHash') as string | null
    
    console.log('📝 Book registration data:', {
      title,
      authorAddress,
      genres,
      contentRating,
      hasCover: !!coverFile,
      coverSize: coverFile ? `${(coverFile.size / 1024).toFixed(1)}KB` : 'N/A',
      ipAssetId,
      transactionHash
    })

    // ===== VALIDATION =====
    
    if (!title || title.length < BOOK_SYSTEM_CONSTANTS.MIN_TITLE_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Title must be at least ${BOOK_SYSTEM_CONSTANTS.MIN_TITLE_LENGTH} characters`
      } as BookRegistrationResponse, { status: 400 })
    }

    if (title.length > BOOK_SYSTEM_CONSTANTS.MAX_TITLE_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Title must be no more than ${BOOK_SYSTEM_CONSTANTS.MAX_TITLE_LENGTH} characters`
      } as BookRegistrationResponse, { status: 400 })
    }

    if (!description || description.length < BOOK_SYSTEM_CONSTANTS.MIN_DESCRIPTION_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Description must be at least ${BOOK_SYSTEM_CONSTANTS.MIN_DESCRIPTION_LENGTH} characters`
      } as BookRegistrationResponse, { status: 400 })
    }

    if (!authorAddress || !/^0x[a-fA-F0-9]{40}$/.test(authorAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid author address format'
      } as BookRegistrationResponse, { status: 400 })
    }

    if (!genres || genres.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one genre is required'
      } as BookRegistrationResponse, { status: 400 })
    }

    if (!['G', 'PG', 'PG-13', 'R', 'NC-17'].includes(contentRating)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid content rating'
      } as BookRegistrationResponse, { status: 400 })
    }

    // ===== GENERATE SLUG AND BOOK ID =====
    
    const slug = BookStorageService.generateSlug(title)
    if (!BookStorageService.isValidSlug(slug)) {
      return NextResponse.json({
        success: false,
        error: 'Generated slug is invalid - please use a different title'
      } as BookRegistrationResponse, { status: 400 })
    }

    const bookId = `${authorAddress.toLowerCase()}-${slug}`
    
    console.log('🔗 Generated book ID:', bookId)

    // Check if book already exists
    try {
      await BookStorageService.getBookMetadata(bookId)
      return NextResponse.json({
        success: false,
        error: 'A book with this title already exists for this author'
      } as BookRegistrationResponse, { status: 409 })
    } catch (error) {
      // Book doesn't exist - this is good, continue
    }

    // ===== STORY PROTOCOL IP REGISTRATION =====
    // NOTE: IP registration is done from the frontend where the user's wallet is connected
    // The backend receives and stores the IP Asset ID and transaction hash
    
    console.log('📝 Book registered on Story Protocol:', {
      ipAssetId: ipAssetId || 'Not provided',
      transactionHash: transactionHash || 'Not provided'
    })
    
    // Use the values from frontend or undefined if not provided
    const finalIpAssetId = ipAssetId || undefined
    const finalTransactionHash = transactionHash || undefined
    let licenseTermsId: string | undefined

    // ===== COVER IMAGE STORAGE =====
    
    let coverUrl: string | undefined
    
    if (coverFile) {
      try {
        console.log('🎨 Uploading book cover...')
        
        // Validate cover file
        if (!BOOK_SYSTEM_CONSTANTS.ALLOWED_COVER_TYPES.includes(coverFile.type)) {
          return NextResponse.json({
            success: false,
            error: `Invalid cover type. Allowed: ${BOOK_SYSTEM_CONSTANTS.ALLOWED_COVER_TYPES.join(', ')}`
          } as BookRegistrationResponse, { status: 400 })
        }

        const coverSizeMB = coverFile.size / (1024 * 1024)
        if (coverSizeMB > BOOK_SYSTEM_CONSTANTS.MAX_COVER_SIZE_MB) {
          return NextResponse.json({
            success: false,
            error: `Cover too large: ${coverSizeMB.toFixed(2)}MB (max ${BOOK_SYSTEM_CONSTANTS.MAX_COVER_SIZE_MB}MB)`
          } as BookRegistrationResponse, { status: 400 })
        }

        // Convert file to buffer
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
        
        // Store cover
        coverUrl = await BookStorageService.storeBookCover(
          authorAddress,
          slug,
          coverBuffer,
          coverFile.type
        )
        
        console.log('✅ Cover uploaded:', coverUrl)
      } catch (coverError) {
        console.error('❌ Cover upload failed:', coverError)
        return NextResponse.json({
          success: false,
          error: 'Failed to upload book cover'
        } as BookRegistrationResponse, { status: 500 })
      }
    }

    // ===== CREATE AND STORE BOOK METADATA =====
    
    try {
      console.log('💾 Creating book metadata...')
      console.log('📝 Book details:', { authorAddress, slug, title, description, genres, contentRating })
      
      const bookMetadata = BookStorageService.createInitialBookMetadata(
        authorAddress,
        slug,
        title,
        description,
        genres,
        contentRating,
        finalIpAssetId,
        undefined, // parentBook - this is an original book
        undefined  // branchPoint - this is an original book
      )
      
      console.log('📋 Generated book metadata:', {
        bookId: bookMetadata.bookId,
        title: bookMetadata.title,
        authorAddress: bookMetadata.authorAddress,
        slug: bookMetadata.slug
      })

      // Add cover URL if uploaded
      if (coverUrl) {
        bookMetadata.coverUrl = coverUrl
      }

      // Add license terms ID if created
      if (licenseTermsId) {
        bookMetadata.licenseTermsId = licenseTermsId
      }

      // Add transaction hash if available
      if (finalTransactionHash) {
        bookMetadata.transactionHash = finalTransactionHash
      }

      // Store book metadata
      console.log('🔄 Storing book metadata to R2...')
      const metadataUrl = await BookStorageService.storeBookMetadata(
        authorAddress,
        slug,
        bookMetadata
      )
      
      console.log('✅ Book metadata stored successfully at:', metadataUrl)

      // Update book index to include the new book
      try {
        console.log('📚 Updating book index after registration...')
        const { bookIndexService } = await import('../../../../lib/services/bookIndexService')
        await bookIndexService.updateBookIndex()
        console.log('✅ Book index updated successfully')
      } catch (indexError) {
        console.error('⚠️ Failed to update book index:', indexError)
        // Don't fail the book registration if index update fails
      }

      // ===== SUCCESS RESPONSE =====
      
      const response: BookRegistrationResponse = {
        success: true,
        book: {
          bookId,
          ipAssetId,
          slug,
          coverUrl,
          licenseTermsId
        },
        transactionHash,
        blockchainStatus: {
          connected: !!ipAssetId,
          network: 'aeneid',
          gasUsed: ipAssetId ? '245821' : undefined
        }
      }

      console.log('🎉 Book registration completed successfully:', {
        bookId,
        hasIP: !!ipAssetId,
        hasCover: !!coverUrl,
        hasLicense: !!licenseTermsId
      })

      return NextResponse.json(response, { status: 201 })

    } catch (storageError) {
      console.error('❌ Failed to store book metadata:', storageError)
      
      // Clean up cover if it was uploaded
      if (coverUrl) {
        try {
          await BookStorageService.deleteBookCover(authorAddress, slug)
        } catch (cleanupError) {
          console.warn('Failed to cleanup cover after storage error:', cleanupError)
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to store book metadata'
      } as BookRegistrationResponse, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Book registration failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during book registration'
    } as BookRegistrationResponse, { status: 500 })
  }
}

/**
 * GET /api/books/register
 * 
 * Check if a book can be registered (title availability check)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')
    const authorAddress = searchParams.get('authorAddress') as AuthorAddress

    if (!title || !authorAddress) {
      return NextResponse.json({
        success: false,
        error: 'title and authorAddress parameters are required'
      }, { status: 400 })
    }

    // Generate slug and check availability
    const slug = BookStorageService.generateSlug(title)
    const bookId = `${authorAddress.toLowerCase()}-${slug}`

    try {
      await BookStorageService.getBookMetadata(bookId)
      
      // Book exists
      return NextResponse.json({
        success: false,
        available: false,
        message: 'A book with this title already exists for this author',
        suggestedSlug: `${slug}-2` // Simple suggestion
      })
    } catch (error) {
      // Book doesn't exist - available
      return NextResponse.json({
        success: true,
        available: true,
        bookId,
        slug,
        message: 'Title is available for registration'
      })
    }

  } catch (error) {
    console.error('Error checking book availability:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check book availability'
    }, { status: 500 })
  }
}