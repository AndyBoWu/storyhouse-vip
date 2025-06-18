import { NextRequest, NextResponse } from 'next/server'
import { BookStorageService } from '../../../../../../lib/storage/bookStorage'
import type { ChapterMetadata } from '../../../../../../lib/types/book'

interface SaveChapterRequest {
  bookId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  readingTime: number
  authorAddress: string
  authorName?: string
  // Blockchain registration proof
  ipAssetId?: string
  transactionHash?: string
  licenseTermsId?: string
  // Chapter metadata
  unlockPrice?: number
  readReward?: number
  licensePrice?: number
  genre?: string
  mood?: string
  contentRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  tags?: string[]
  generationMethod?: 'ai' | 'human' | 'hybrid'
  aiPrompt?: string
  aiModel?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId: encodedBookId } = await params
    // Decode the bookId in case it was URL encoded
    const bookId = decodeURIComponent(encodedBookId)
    const body: SaveChapterRequest = await request.json()

    console.log('📝 Saving chapter for book:', bookId)
    console.log('📄 Chapter data:', {
      chapterNumber: body.chapterNumber,
      title: body.title,
      wordCount: body.wordCount,
      hasBlockchain: !!body.ipAssetId
    })

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json({
        success: false,
        error: 'Chapter title and content are required'
      }, { status: 400 })
    }

    if (!body.authorAddress) {
      return NextResponse.json({
        success: false,
        error: 'Author address is required'
      }, { status: 400 })
    }

    // Parse book ID - handle both slash and hyphen formats
    let authorAddress: string
    let slug: string
    
    if (bookId.includes('/')) {
      // New format: authorAddress/slug
      const parts = bookId.split('/')
      if (parts.length !== 2) {
        return NextResponse.json({
          success: false,
          error: 'Invalid book ID format - expected authorAddress/slug'
        }, { status: 400 })
      }
      authorAddress = parts[0].toLowerCase()
      slug = parts[1]
    } else {
      // Legacy format: authorAddress-slug-parts
      const bookIdParts = bookId.split('-')
      if (bookIdParts.length < 2) {
        return NextResponse.json({
          success: false,
          error: 'Invalid book ID format'
        }, { status: 400 })
      }
      authorAddress = bookIdParts[0].toLowerCase()
      slug = bookIdParts.slice(1).join('-')
    }

    // Validate author matches
    if (authorAddress !== body.authorAddress.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Author address does not match book owner'
      }, { status: 403 })
    }

    // Create chapter metadata
    const chapterData: ChapterMetadata = {
      chapterId: `${bookId}-ch${body.chapterNumber}`,
      chapterNumber: body.chapterNumber,
      title: body.title,
      summary: body.content.slice(0, 200) + '...', // Generate summary from content
      content: body.content,
      authorAddress: body.authorAddress.toLowerCase(),
      authorName: body.authorName || `${body.authorAddress.slice(-4)}`,
      bookId,

      // IP Registration
      ipAssetId: body.ipAssetId,
      transactionHash: body.transactionHash,
      licenseTermsId: body.licenseTermsId,
      parentIpAssetId: undefined, // TODO: Get from book metadata

      // Economics (based on chapter number and design spec)
      unlockPrice: body.chapterNumber <= 3 ? 0 : (body.unlockPrice || 0.5), // Free for chapters 1-3, 0.5 TIP for 4+
      readReward: body.readReward || (body.chapterNumber <= 3 ? 0.05 : 0.1), // Higher rewards for paid chapters
      licensePrice: body.licensePrice || 2.0, // 2.0 TIP as per design spec

      // Content Metrics
      wordCount: body.wordCount,
      readingTime: body.readingTime,
      qualityScore: 85, // Default AI score
      originalityScore: 90, // Default AI score

      // Generation Details
      generationMethod: body.generationMethod || 'human',
      aiPrompt: body.aiPrompt,
      aiModel: body.aiModel,

      // Engagement
      totalReads: 0,
      averageRating: 0,
      totalRevenue: 0,

      // Classification
      genre: body.genre || 'General',
      mood: body.mood || 'Neutral',
      contentRating: body.contentRating || 'G',
      tags: body.tags || [],

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save chapter to R2 storage
    const chapterPath = `books/${authorAddress}/${slug}/chapters/ch${body.chapterNumber}/content.json`
    
    try {
      const contentUrl = await BookStorageService.storeChapterContent(
        authorAddress,
        slug,
        body.chapterNumber,
        chapterData
      )

      console.log('✅ Chapter saved successfully:', contentUrl)

      // Update book metadata to include this chapter in the chapter map
      try {
        // Get current book metadata
        const bookMetadata = await BookStorageService.getBookMetadata(bookId)
        
        // Update chapter map and count
        bookMetadata.chapterMap[`ch${body.chapterNumber}`] = chapterPath
        bookMetadata.totalChapters = Object.keys(bookMetadata.chapterMap).length
        bookMetadata.updatedAt = new Date().toISOString()
        
        // Save updated metadata
        await BookStorageService.storeBookMetadata(authorAddress, slug, bookMetadata)
        console.log('✅ Book metadata updated with new chapter')
      } catch (metadataError) {
        console.error('⚠️ Failed to update book metadata:', metadataError)
        // Don't fail the whole operation if metadata update fails
        // The chapter is still saved and can be discovered by direct listing
      }
      
      return NextResponse.json({
        success: true,
        data: {
          bookId,
          chapterNumber: body.chapterNumber,
          chapterId: chapterData.chapterId,
          contentUrl,
          ipAssetId: body.ipAssetId,
          transactionHash: body.transactionHash
        },
        message: 'Chapter saved successfully'
      })

    } catch (storageError) {
      console.error('❌ Failed to save chapter:', storageError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save chapter to storage'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Chapter save failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during chapter save'
    }, { status: 500 })
  }
}