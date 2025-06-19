import { NextRequest, NextResponse } from 'next/server'
import { R2Service } from '../../../../../lib/r2'
import { ethers } from 'ethers'
import { STORYHOUSE_CONTRACTS } from '../../../../../lib/contracts/storyhouse'
import { advancedStoryProtocolService } from '../../../../../lib/services/advancedStoryProtocolService'

interface ChapterParams {
  storyId: string
  chapterNumber: string
}

/**
 * GET /api/chapters/[storyId]/[chapterNumber] - Fetch a specific chapter with access control
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<ChapterParams> }
) {
  try {
    const params = await context.params
    const { storyId, chapterNumber } = params

    if (!storyId || !chapterNumber) {
      return NextResponse.json(
        { error: 'Story ID and chapter number are required' },
        { status: 400 }
      )
    }

    // Validate chapter number is a positive integer
    const chapterNum = parseInt(chapterNumber, 10)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'Chapter number must be a positive integer' },
        { status: 400 }
      )
    }

    console.log(`📖 Fetching chapter ${chapterNumber} of story ${storyId}`)
    
    // Get user address from query params
    const userAddress = request.nextUrl.searchParams.get('userAddress')
    
    // Check access control for paid chapters (4+)
    if (chapterNum > 3) {
      if (!userAddress) {
        return NextResponse.json(
          { 
            error: 'Wallet connection required',
            message: 'Please connect your wallet to access this chapter',
            requiresWallet: true 
          },
          { status: 401 }
        )
      }
      
      try {
        // Check if user has access through HybridRevenueControllerV2
        const hasAccess = await advancedStoryProtocolService.checkChapterAccess(
          storyId,
          chapterNum,
          userAddress
        )
        
        if (!hasAccess) {
          return NextResponse.json(
            { 
              error: 'Chapter locked',
              message: 'You need to unlock this chapter to read it',
              requiresUnlock: true,
              chapterNumber: chapterNum
            },
            { status: 403 }
          )
        }
      } catch (accessError) {
        console.error('Error checking chapter access:', accessError)
        // If access check fails, deny access for security
        return NextResponse.json(
          { 
            error: 'Access verification failed',
            message: 'Unable to verify chapter access. Please try again.'
          },
          { status: 403 }
        )
      }
    }

    try {
      // Check if this is a book ID (contains slash) vs story ID
      const decodedStoryId = decodeURIComponent(storyId)
      const isBookId = decodedStoryId.includes('/')
      let chapterKey: string
      
      if (isBookId) {
        // For books, use the book storage structure
        const slashIndex = decodedStoryId.indexOf('/')
        const authorAddress = decodedStoryId.substring(0, slashIndex)
        const slug = decodedStoryId.substring(slashIndex + 1)
        chapterKey = `books/${authorAddress}/${slug}/chapters/ch${chapterNum}/content.json`
      } else {
        // For stories, use the legacy structure
        chapterKey = R2Service.generateChapterKey(storyId, chapterNum)
      }
      
      // Fetch chapter content from R2
      const chapterContent = await R2Service.getContent(chapterKey)
      
      if (!chapterContent) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        )
      }

      // Parse the chapter data
      const chapterData = JSON.parse(chapterContent)
      
      console.log(`✅ Chapter ${chapterNumber} loaded:`, {
        title: chapterData.title,
        wordCount: chapterData.wordCount,
        hasContent: !!chapterData.content
      })

      // Fetch book metadata to get additional info
      let bookMetadataKey: string;
      let bookMetadata: any = {};
      
      if (isBookId) {
        const slashIndex = decodedStoryId.indexOf('/')
        const authorAddress = decodedStoryId.substring(0, slashIndex)
        const slug = decodedStoryId.substring(slashIndex + 1)
        bookMetadataKey = `books/${authorAddress}/${slug}/metadata.json`
      } else {
        bookMetadataKey = `books/${storyId}/metadata.json`
      }
      
      try {
        const bookMetadataContent = await R2Service.getContent(bookMetadataKey);
        if (bookMetadataContent) {
          bookMetadata = JSON.parse(bookMetadataContent);
        }
      } catch (err) {
        console.log('Could not fetch book metadata:', err);
      }

      // Format response for chapter reading page
      const formattedResponse = {
        bookId: storyId,
        bookTitle: bookMetadata.title || chapterData.bookTitle || 'Unknown Book',
        chapterNumber: chapterNum,
        title: chapterData.title,
        content: chapterData.content,
        author: chapterData.metadata?.authorName || chapterData.author || 'Anonymous',
        authorAddress: chapterData.metadata?.authorAddress || chapterData.authorAddress || '',
        wordCount: chapterData.wordCount || 0,
        readingTime: chapterData.readingTime || Math.ceil((chapterData.wordCount || 0) / 200),
        createdAt: chapterData.createdAt || chapterData.metadata?.createdAt || new Date().toISOString(),
        nextChapter: chapterNum + 1,
        previousChapter: chapterNum > 1 ? chapterNum - 1 : undefined,
        totalChapters: bookMetadata.chapters || chapterData.totalChapters || 1
      };

      return NextResponse.json(formattedResponse)

    } catch (r2Error) {
      console.error(`❌ Failed to fetch chapter ${chapterNumber} for story ${storyId}:`, r2Error)
      
      if (r2Error instanceof Error && r2Error.message.includes('NoSuchKey')) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to retrieve chapter content' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Chapter API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/chapters/[storyId]/[chapterNumber] - Update a specific chapter
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<ChapterParams> }
) {
  try {
    const params = await context.params
    const { storyId, chapterNumber } = params
    const body = await request.json()

    if (!storyId || !chapterNumber) {
      return NextResponse.json(
        { error: 'Story ID and chapter number are required' },
        { status: 400 }
      )
    }

    const chapterNum = parseInt(chapterNumber, 10)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'Chapter number must be a positive integer' },
        { status: 400 }
      )
    }

    if (!body.content && !body.title && !body.metadata) {
      return NextResponse.json(
        { error: 'At least one of content, title, or metadata is required' },
        { status: 400 }
      )
    }

    console.log(`📝 Updating chapter ${chapterNumber} of story ${storyId}`)

    try {
      // First, fetch the existing chapter
      // Check if this is a book ID (contains slash) vs story ID
      const decodedStoryId = decodeURIComponent(storyId)
      const isBookId = decodedStoryId.includes('/')
      let chapterKey: string
      
      if (isBookId) {
        // For books, use the book storage structure
        const slashIndex = decodedStoryId.indexOf('/')
        const authorAddress = decodedStoryId.substring(0, slashIndex)
        const slug = decodedStoryId.substring(slashIndex + 1)
        chapterKey = `books/${authorAddress}/${slug}/chapters/ch${chapterNum}/content.json`
      } else {
        // For stories, use the legacy structure
        chapterKey = R2Service.generateChapterKey(storyId, chapterNum)
      }
      const existingContent = await R2Service.getContent(chapterKey)
      
      if (!existingContent) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        )
      }

      const existingData = JSON.parse(existingContent)
      
      // Merge the updates with existing data
      const updatedData = {
        ...existingData,
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.metadata && { 
          metadata: {
            ...existingData.metadata,
            ...body.metadata,
            lastModified: new Date().toISOString()
          }
        })
      }

      // Update word count and reading time if content changed
      if (body.content) {
        const wordCount = body.content.trim().split(/\s+/).length
        const readingTime = Math.ceil(wordCount / 200) // Assume 200 words per minute
        
        updatedData.wordCount = wordCount
        updatedData.readingTime = readingTime
      }

      // Save back to R2
      const contentUrl = await R2Service.uploadContent(
        chapterKey,
        JSON.stringify(updatedData),
        {
          contentType: 'application/json',
          metadata: {
            storyId,
            chapterNumber: chapterNumber.toString(),
            contentType: 'chapter',
            lastModified: new Date().toISOString(),
            ...(updatedData.metadata?.authorAddress && { authorAddress: updatedData.metadata.authorAddress }),
            ...(updatedData.metadata?.authorName && { authorName: updatedData.metadata.authorName }),
          }
        }
      )

      console.log(`✅ Chapter ${chapterNumber} updated successfully`)

      return NextResponse.json({
        success: true,
        data: updatedData,
        contentUrl,
        message: 'Chapter updated successfully'
      })

    } catch (r2Error) {
      console.error(`❌ Failed to update chapter ${chapterNumber} for story ${storyId}:`, r2Error)
      return NextResponse.json(
        { error: 'Failed to update chapter content' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Chapter update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chapters/[storyId]/[chapterNumber] - Delete a specific chapter
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<ChapterParams> }
) {
  try {
    const params = await context.params
    const { storyId, chapterNumber } = params

    if (!storyId || !chapterNumber) {
      return NextResponse.json(
        { error: 'Story ID and chapter number are required' },
        { status: 400 }
      )
    }

    const chapterNum = parseInt(chapterNumber, 10)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'Chapter number must be a positive integer' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Deleting chapter ${chapterNumber} of story ${storyId}`)

    try {
      // Check if this is a book ID (contains slash) vs story ID
      const decodedStoryId = decodeURIComponent(storyId)
      const isBookId = decodedStoryId.includes('/')
      let chapterKey: string
      
      if (isBookId) {
        // For books, use the book storage structure
        const slashIndex = decodedStoryId.indexOf('/')
        const authorAddress = decodedStoryId.substring(0, slashIndex)
        const slug = decodedStoryId.substring(slashIndex + 1)
        chapterKey = `books/${authorAddress}/${slug}/chapters/ch${chapterNum}/content.json`
      } else {
        // For stories, use the legacy structure
        chapterKey = R2Service.generateChapterKey(storyId, chapterNum)
      }
      
      // Check if chapter exists before attempting deletion
      const existingContent = await R2Service.getContent(chapterKey)
      if (!existingContent) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        )
      }

      // Delete the chapter from R2
      await R2Service.deleteContent(chapterKey)

      console.log(`✅ Chapter ${chapterNumber} deleted successfully`)

      return NextResponse.json({
        success: true,
        message: 'Chapter deleted successfully',
        deletedChapter: {
          storyId,
          chapterNumber: chapterNum,
          deletedAt: new Date().toISOString()
        }
      })

    } catch (r2Error) {
      console.error(`❌ Failed to delete chapter ${chapterNumber} for story ${storyId}:`, r2Error)
      return NextResponse.json(
        { error: 'Failed to delete chapter' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Chapter deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}