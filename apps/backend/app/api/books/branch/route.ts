import { NextRequest, NextResponse } from 'next/server'
import { 
  BookBranchingRequest, 
  BookBranchingResponse, 
  BookMetadata,
  AuthorAddress,
  BookId,
  BOOK_SYSTEM_CONSTANTS 
} from '@/lib/types/book'
import { BookStorageService } from '@/lib/storage/bookStorage'
import { UnifiedIpService } from '@/lib/services/unifiedIpService'
import type { Address } from 'viem'
import type { StoryWithIP } from '@/lib/types/ip'

/**
 * POST /api/books/branch
 * 
 * Create a derivative book that branches from an existing book at a specific chapter.
 * This is the core of the collaborative storytelling system - allows any author
 * to continue any story from any chapter point.
 * 
 * Key Features:
 * - Creates new book with unique identity (title, cover, author)
 * - Copies original chapter references to chapterMap (no duplication)
 * - Sets up revenue sharing between original and remix authors
 * - Registers as derivative IP asset (when Story Protocol is integrated)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🌿 Starting book branching operation...')

    // Parse the multipart form data
    const formData = await request.formData()
    
    // Extract branching data
    const parentBookId = formData.get('parentBookId') as BookId
    const branchPoint = formData.get('branchPoint') as string // "ch3"
    const newTitle = formData.get('newTitle') as string
    const newDescription = formData.get('newDescription') as string
    const authorAddress = formData.get('authorAddress') as AuthorAddress
    const authorName = formData.get('authorName') as string || `${authorAddress.slice(-4)}`
    const genresJson = formData.get('genres') as string
    const contentRating = formData.get('contentRating') as BookMetadata['contentRating']
    
    // Parse JSON fields
    let genres: string[]
    
    try {
      genres = JSON.parse(genresJson)
    } catch (parseError) {
      console.error('❌ Invalid JSON in request:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format in genres'
      } as BookBranchingResponse, { status: 400 })
    }

    // Get optional new cover file
    const newCover = formData.get('newCover') as File | null
    
    console.log('🔀 Book branching data:', {
      parentBookId,
      branchPoint,
      newTitle,
      authorAddress,
      genres,
      hasCover: !!newCover
    })

    // ===== VALIDATION =====
    
    if (!parentBookId || !BookStorageService.isValidBookId(parentBookId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parent book ID format'
      } as BookBranchingResponse, { status: 400 })
    }

    if (!branchPoint || !/^ch\d+$/.test(branchPoint)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid branch point format (expected: ch1, ch2, etc.)'
      } as BookBranchingResponse, { status: 400 })
    }

    if (!newTitle || newTitle.length < BOOK_SYSTEM_CONSTANTS.MIN_TITLE_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Title must be at least ${BOOK_SYSTEM_CONSTANTS.MIN_TITLE_LENGTH} characters`
      } as BookBranchingResponse, { status: 400 })
    }

    if (!authorAddress || !/^0x[a-fA-F0-9]{40}$/.test(authorAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid author address format'
      } as BookBranchingResponse, { status: 400 })
    }

    // ===== LOAD PARENT BOOK =====
    
    let parentBook: BookMetadata
    try {
      console.log(`🔍 Looking up parent book: ${parentBookId}`)
      parentBook = await BookStorageService.getBookMetadata(parentBookId)
      console.log('📖 Parent book loaded:', parentBook.title)
    } catch (error) {
      console.error('❌ Parent book not found:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({
        success: false,
        error: `Parent book not found: ${parentBookId}. Error: ${errorMessage}`
      } as BookBranchingResponse, { status: 404 })
    }

    // Validate branch point exists in parent book
    if (!parentBook.chapterMap[branchPoint]) {
      return NextResponse.json({
        success: false,
        error: `Branch point ${branchPoint} does not exist in parent book`
      } as BookBranchingResponse, { status: 400 })
    }

    // Validate branch point is chapter 3 or later (business rule)
    const branchChapterNum = parseInt(branchPoint.replace('ch', ''))
    if (branchChapterNum < 3) {
      return NextResponse.json({
        success: false,
        error: 'Branching is only allowed from chapter 3 onwards. Chapters 1-2 are protected.'
      } as BookBranchingResponse, { status: 400 })
    }

    // Check if parent book allows remixing
    if (!parentBook.isRemixable) {
      return NextResponse.json({
        success: false,
        error: 'Parent book does not allow remixing'
      } as BookBranchingResponse, { status: 403 })
    }

    // ===== GENERATE NEW BOOK DETAILS =====
    
    const newSlug = BookStorageService.generateSlug(newTitle)
    const newBookId = `${authorAddress.toLowerCase()}/${newSlug}` as BookId
    
    console.log('🆔 Generated new book ID:', newBookId)

    // Check if new book already exists
    try {
      await BookStorageService.getBookMetadata(newBookId)
      return NextResponse.json({
        success: false,
        error: 'A book with this title already exists for this author'
      } as BookBranchingResponse, { status: 409 })
    } catch (error) {
      // Book doesn't exist - this is good, continue
    }

    // ===== CREATE HYBRID CHAPTER MAP =====
    
    console.log('🗺️ Creating hybrid chapter map...')
    
    // Extract branch point chapter number for chapter map creation
    const branchPointChapterNum = parseInt(branchPoint.replace('ch', ''))
    
    // Create chapter map that references original chapters up to branch point
    const hybridChapterMap: { [chapterNumber: string]: string } = {}
    
    // Copy original chapters up to and including branch point
    for (let i = 1; i <= branchPointChapterNum; i++) {
      const chapterKey = `ch${i}`
      if (parentBook.chapterMap[chapterKey]) {
        hybridChapterMap[chapterKey] = parentBook.chapterMap[chapterKey]
      }
    }
    
    console.log('✅ Hybrid chapter map created:', Object.keys(hybridChapterMap))

    // ===== CALCULATE REVENUE SHARING =====
    
    // Determine how many chapters each author contributes
    const originalChapters = Object.keys(hybridChapterMap)
    const originalAuthorShare = (originalChapters.length / (originalChapters.length + 0)) * 100 // Will be updated as new chapters are added
    
    // Create revenue sharing structure
    const originalAuthors: BookMetadata['originalAuthors'] = {
      // Copy original authors from parent book
      ...parentBook.originalAuthors,
      // Add new author with initial 50% share (will be adjusted as chapters are added)
      [authorAddress]: {
        chapters: [],
        revenueShare: 50
      }
    }
    
    // Adjust original authors' shares to account for new author
    for (const [address, info] of Object.entries(originalAuthors)) {
      if (address !== authorAddress) {
        info.revenueShare = info.revenueShare * 0.5 // Reduce original shares by half for now
      }
    }

    // ===== HANDLE NEW COVER UPLOAD =====
    
    let newCoverUrl: string | undefined
    
    if (newCover) {
      try {
        console.log('🎨 Uploading new book cover...')
        
        // Validate cover file
        if (!BOOK_SYSTEM_CONSTANTS.ALLOWED_COVER_TYPES.includes(newCover.type)) {
          return NextResponse.json({
            success: false,
            error: `Invalid cover type. Allowed: ${BOOK_SYSTEM_CONSTANTS.ALLOWED_COVER_TYPES.join(', ')}`
          } as BookBranchingResponse, { status: 400 })
        }

        const coverSizeMB = newCover.size / (1024 * 1024)
        if (coverSizeMB > BOOK_SYSTEM_CONSTANTS.MAX_COVER_SIZE_MB) {
          return NextResponse.json({
            success: false,
            error: `Cover too large: ${coverSizeMB.toFixed(2)}MB (max ${BOOK_SYSTEM_CONSTANTS.MAX_COVER_SIZE_MB}MB)`
          } as BookBranchingResponse, { status: 400 })
        }

        // Convert file to buffer
        const coverBuffer = Buffer.from(await newCover.arrayBuffer())
        
        // Store new cover
        newCoverUrl = await BookStorageService.storeBookCover(
          authorAddress,
          newSlug,
          coverBuffer,
          newCover.type
        )
        
        console.log('✅ New cover uploaded:', newCoverUrl)
      } catch (coverError) {
        console.error('❌ Cover upload failed:', coverError)
        return NextResponse.json({
          success: false,
          error: 'Failed to upload book cover'
        } as BookBranchingResponse, { status: 500 })
      }
    }

    // ===== CREATE DERIVATIVE BOOK METADATA =====
    
    try {
      console.log('📝 Creating derivative book metadata...')
      
      const derivativeBookMetadata = BookStorageService.createInitialBookMetadata(
        authorAddress,
        newSlug,
        newTitle,
        newDescription,
        genres,
        contentRating,
        undefined, // ipAssetId - will be set when Story Protocol is integrated
        parentBookId, // parentBook
        branchPoint   // branchPoint
      )

      // Override with branching-specific data
      derivativeBookMetadata.chapterMap = hybridChapterMap
      derivativeBookMetadata.originalAuthors = originalAuthors
      derivativeBookMetadata.totalChapters = originalChapters.length // Will be updated as new chapters are added
      derivativeBookMetadata.derivativeBooks = [] // This derivative has no children yet

      // Set cover URL: use new cover if uploaded, otherwise inherit from parent
      if (newCoverUrl) {
        derivativeBookMetadata.coverUrl = newCoverUrl
        console.log('✅ Using new uploaded cover:', newCoverUrl)
      } else if (parentBook.coverUrl) {
        derivativeBookMetadata.coverUrl = parentBook.coverUrl
        console.log('📸 Inheriting parent book cover:', parentBook.coverUrl)
      }

      // ===== STORY PROTOCOL DERIVATIVE REGISTRATION =====
      
      let derivativeIpAssetId: string | undefined
      let derivativeTransactionHash: string | undefined
      
      // Check if parent book has Story Protocol registration
      if (parentBook.ipAssetId && parentBook.licenseTermsId) {
        console.log('🔗 Parent book has Story Protocol registration, registering derivative...')
        console.log('👨‍👧 Parent IP:', parentBook.ipAssetId)
        console.log('📜 Parent License Terms:', parentBook.licenseTermsId)
        
        try {
          // Initialize unified IP service
          const ipService = new UnifiedIpService()
          
          // Prepare derivative story data
          const derivativeStory: StoryWithIP = {
            id: newBookId,
            title: newTitle,
            ipAssetId: undefined,
            licenseTokens: [],
            isRegistered: false
          }
          
          // Register as derivative on Story Protocol
          const ipResult = await ipService.mintAndRegisterDerivative({
            parentIpId: parentBook.ipAssetId as Address,
            parentLicenseTermsId: parentBook.licenseTermsId,
            derivativeStory,
            nftContract: (process.env.STORY_NFT_CONTRACT || '0x8B0a63eb35eD607805E3c09C99281cFAd09d6fD5') as Address,
            account: authorAddress as Address,
            metadataUri: derivativeBookMetadata.coverUrl // Use cover URL as metadata for now
          })
          
          if (ipResult.success && ipResult.ipAsset) {
            console.log('✅ Derivative registered on Story Protocol!')
            console.log('🆔 Derivative IP ID:', ipResult.ipAsset.id)
            console.log('📝 Transaction Hash:', ipResult.transactionHash)
            
            derivativeIpAssetId = ipResult.ipAsset.id
            derivativeTransactionHash = ipResult.transactionHash
            
            // Update metadata with Story Protocol info
            derivativeBookMetadata.ipAssetId = derivativeIpAssetId
            derivativeBookMetadata.transactionHash = derivativeTransactionHash
            derivativeBookMetadata.licenseTermsId = parentBook.licenseTermsId // Inherits parent's license terms
          } else {
            console.warn('⚠️ Derivative registration failed:', ipResult.error)
            console.warn('📝 Continuing without blockchain registration')
          }
        } catch (ipError) {
          console.error('❌ Story Protocol registration error:', ipError)
          console.warn('📝 Continuing without blockchain registration')
        }
      } else {
        console.log('ℹ️ Parent book not registered on Story Protocol, skipping derivative registration')
      }
      
      // ===== HYBRID REVENUE CONTROLLER REGISTRATION =====
      
      // Note: We're not automatically registering on HybridRevenueControllerV2 here
      // because it requires a user transaction. Instead, we'll prompt the user
      // to register when they try to publish their first new chapter.
      console.log('💰 Note: Book will need to be registered on HybridRevenueControllerV2 before publishing paid chapters')
      derivativeBookMetadata.needsRevenueRegistration = true
      
      // Store derivative book metadata (with or without IP registration)
      await BookStorageService.storeBookMetadata(
        authorAddress,
        newSlug,
        derivativeBookMetadata
      )
      
      console.log('✅ Derivative book metadata stored')

      // ===== UPDATE PARENT BOOK =====
      
      console.log('🔄 Updating parent book to reference new derivative...')
      
      try {
        // Add this derivative to parent's derivative list
        const updatedParentDerivatives = [...parentBook.derivativeBooks, newBookId]
        const { authorAddress: parentAuthor, slug: parentSlug } = BookStorageService.parseBookId(parentBookId)
        
        // Update parent book with new derivative
        const updatedParentBook = {
          ...parentBook,
          derivativeBooks: updatedParentDerivatives,
          updatedAt: new Date().toISOString()
        }
        
        await BookStorageService.storeBookMetadata(parentAuthor, parentSlug, updatedParentBook)
        
        console.log('✅ Parent book updated with new derivative reference')
      } catch (parentUpdateError) {
        console.warn('⚠️ Failed to update parent book (continuing):', parentUpdateError)
      }

      // ===== SUCCESS RESPONSE =====
      
      const response: BookBranchingResponse = {
        success: true,
        message: 'Book branching completed successfully',
        book: {
          bookId: newBookId,
          parentBookId,
          ipAssetId: derivativeIpAssetId,
          branchPoint,
          coverUrl: derivativeBookMetadata.coverUrl, // Use the final cover URL (new or inherited)
          chapterMap: hybridChapterMap,
          originalAuthors
        },
        transactionHash: derivativeTransactionHash
      }

      console.log('🎉 Book branching completed successfully:', {
        newBookId,
        parentBookId,
        branchPoint,
        hybridChapters: Object.keys(hybridChapterMap).length,
        inheritedChapters: Object.keys(hybridChapterMap),
        finalCoverUrl: derivativeBookMetadata.coverUrl,
        coverSource: newCoverUrl ? 'uploaded' : 'inherited',
        authorAddress
      })

      return NextResponse.json(response, { status: 201 })

    } catch (storageError) {
      console.error('❌ Failed to create derivative book:', storageError)
      
      // Clean up cover if it was uploaded
      if (newCoverUrl) {
        try {
          await BookStorageService.deleteBookCover(authorAddress, newSlug)
        } catch (cleanupError) {
          console.warn('Failed to cleanup cover after storage error:', cleanupError)
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create derivative book'
      } as BookBranchingResponse, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Book branching failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during book branching'
    } as BookBranchingResponse, { status: 500 })
  }
}

/**
 * GET /api/books/branch
 * 
 * Get information about branching opportunities for a specific book
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🌿 [GET] Branch API called')
    const { searchParams } = new URL(request.url)
    const parentBookId = searchParams.get('parentBookId') as BookId

    console.log(`📥 [GET] Raw parentBookId: ${parentBookId}`)
    console.log(`📥 [GET] Decoded parentBookId: ${decodeURIComponent(parentBookId || '')}`)

    if (!parentBookId) {
      console.error('❌ [GET] Missing parentBookId parameter')
      return NextResponse.json({
        success: false,
        error: 'parentBookId parameter is required'
      }, { status: 400 })
    }

    // Test book ID validation
    try {
      console.log(`🔍 [GET] Testing book ID validation for: ${parentBookId}`)
      const isValid = BookStorageService.isValidBookId(parentBookId)
      console.log(`✅ [GET] Book ID validation result: ${isValid}`)
    } catch (validationError) {
      console.error('❌ [GET] Book ID validation failed:', validationError)
    }

    // Test book ID parsing
    try {
      console.log(`🔍 [GET] Testing book ID parsing for: ${parentBookId}`)
      const parsed = BookStorageService.parseBookId(parentBookId)
      console.log(`✅ [GET] Book ID parsed successfully:`, parsed)
    } catch (parseError) {
      console.error('❌ [GET] Book ID parsing failed:', parseError)
      return NextResponse.json({
        success: false,
        error: `Invalid book ID format: ${parentBookId}. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      }, { status: 400 })
    }

    // Load parent book
    let parentBook: BookMetadata
    try {
      console.log(`🔍 [GET] Looking up parent book: ${parentBookId}`)
      parentBook = await BookStorageService.getBookMetadata(parentBookId)
      console.log(`📖 [GET] Parent book loaded: ${parentBook.title}`)
      console.log(`📊 [GET] Parent book chapters:`, Object.keys(parentBook.chapterMap))
    } catch (error) {
      console.error('❌ [GET] Parent book not found:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : 'No stack trace'
      console.error('❌ [GET] Error stack:', errorStack)
      return NextResponse.json({
        success: false,
        error: `Parent book not found: ${parentBookId}. Error: ${errorMessage}`
      }, { status: 404 })
    }

    // Get branching information
    const branchingInfo = {
      success: true,
      parentBook: {
        bookId: parentBook.bookId,
        title: parentBook.title,
        authorName: parentBook.authorName,
        totalChapters: parentBook.totalChapters,
        isRemixable: parentBook.isRemixable,
        genres: parentBook.genres,
        contentRating: parentBook.contentRating
      },
      availableBranchPoints: Object.keys(parentBook.chapterMap)
        .map(chapterKey => ({
          chapterKey,
          chapterNumber: parseInt(chapterKey.replace('ch', '')),
          chapterPath: parentBook.chapterMap[chapterKey]
        }))
        .filter(point => point.chapterNumber >= 3), // Only allow branching from chapter 3 onwards
      existingDerivatives: parentBook.derivativeBooks.length,
      derivativeBooks: parentBook.derivativeBooks
    }

    console.log(`✅ [GET] Successfully returning branching info with ${branchingInfo.availableBranchPoints.length} branch points`)
    return NextResponse.json(branchingInfo)

  } catch (error) {
    console.error('❌ [GET] Critical error in branch API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    console.error('❌ [GET] Critical error stack:', errorStack)
    return NextResponse.json({
      success: false,
      error: `Failed to get branching information: ${errorMessage}`
    }, { status: 500 })
  }
}