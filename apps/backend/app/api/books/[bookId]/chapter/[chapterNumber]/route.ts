import { NextRequest, NextResponse } from 'next/server';
import { BookStorageService } from '@/lib/storage/bookStorage';
import { chapterAccessService } from '@/lib/services/chapterAccessService';

interface ChapterParams {
  bookId: string;
  chapterNumber: string;
}

/**
 * GET /api/books/[bookId]/chapter/[chapterNumber] - Fetch a specific book chapter
 * HEAD /api/books/[bookId]/chapter/[chapterNumber] - Check chapter access without content
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<ChapterParams> }
) {
  return handleChapterRequest(request, context, false);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<ChapterParams> }
) {
  return handleChapterRequest(request, context, true);
}

async function handleChapterRequest(
  request: NextRequest,
  context: { params: Promise<ChapterParams> },
  headOnly: boolean = false
) {
  try {
    const params = await context.params;
    const { bookId, chapterNumber } = params;

    if (!bookId || !chapterNumber) {
      return NextResponse.json(
        { error: 'Book ID and chapter number are required' },
        { status: 400 }
      );
    }

    // Validate chapter number is a positive integer
    const chapterNum = parseInt(chapterNumber, 10);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'Chapter number must be a positive integer' },
        { status: 400 }
      );
    }

    console.log(`📖 Fetching chapter ${chapterNumber} of book ${bookId}`);

    // Get user address from request header (set by frontend)
    const userAddress = request.headers.get('x-user-address') || undefined;

    try {
      // Parse book ID to get author address and slug
      const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
      
      // Get book metadata to check if it's a derivative book
      let bookMetadata: any = null;
      let chapterData: any = null;
      
      try {
        bookMetadata = await BookStorageService.getBookMetadata(bookId as any);
        console.log(`📚 Book metadata loaded, isDerivative: ${bookMetadata.isDerivative}, parentBook: ${bookMetadata.parentBook}`);
        
        // Check if the book has a chapterMap for resolving chapter locations
        if (bookMetadata.chapterMap && bookMetadata.chapterMap[`ch${chapterNum}`]) {
          // This is a derivative book with inherited chapters
          const chapterPath = bookMetadata.chapterMap[`ch${chapterNum}`];
          console.log(`🔄 Using chapterMap to resolve chapter ${chapterNum} to: ${chapterPath}`);
          
          // Extract author and slug from the chapter path
          // Format: "0x1234-detective/chapters/ch1" -> extract "0x1234" and "detective"
          const pathMatch = chapterPath.match(/^(0x[a-fA-F0-9]+)[/-]([^/]+)\/chapters\/ch\d+$/);
          if (pathMatch) {
            const [, originalAuthor, originalSlug] = pathMatch;
            console.log(`📖 Fetching inherited chapter from original book: ${originalAuthor}/${originalSlug}`);
            chapterData = await BookStorageService.getChapterContent(
              originalAuthor as any,
              originalSlug,
              chapterNum
            );
          } else {
            throw new Error(`Invalid chapter path format in chapterMap: ${chapterPath}`);
          }
        } else if (bookMetadata.isDerivative && bookMetadata.parentBook) {
          // Legacy support: If no chapterMap but it's a derivative book
          console.log(`🔄 Derivative book without chapterMap, checking parent book: ${bookMetadata.parentBook}`);
          
          // Parse parent book ID
          const { authorAddress: parentAuthor, slug: parentSlug } = BookStorageService.parseBookId(bookMetadata.parentBook as any);
          
          // Try to fetch from parent book first
          try {
            chapterData = await BookStorageService.getChapterContent(
              parentAuthor as any,
              parentSlug,
              chapterNum
            );
            console.log(`✅ Found chapter ${chapterNum} in parent book`);
          } catch (parentError) {
            console.log(`❌ Chapter ${chapterNum} not found in parent book, trying derivative book`);
            // If not in parent, try in derivative book (it might be a new chapter)
            chapterData = await BookStorageService.getChapterContent(
              authorAddress,
              slug,
              chapterNum
            );
          }
        } else {
          // Regular book - fetch from its own path
          chapterData = await BookStorageService.getChapterContent(
            authorAddress,
            slug,
            chapterNum
          );
        }
      } catch (error) {
        console.error(`❌ Error loading book metadata or chapter:`, error);
        // If metadata fails, try direct chapter fetch as fallback
        chapterData = await BookStorageService.getChapterContent(
          authorAddress,
          slug,
          chapterNum
        );
      }

      // Check if chapter data exists
      if (!chapterData) {
        console.error(`❌ No chapter data found for chapter ${chapterNum}`);
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        );
      }

      // Check access permissions
      const accessResult = await chapterAccessService.checkChapterAccess(
        bookId,
        chapterNum,
        userAddress,
        chapterData?.ipAssetId // Add optional chaining in case ipAssetId is undefined
      );

      console.log(`🔐 Access check for chapter ${chapterNum}:`, {
        userAddress,
        hasAccess: accessResult.hasAccess,
        reason: accessResult.reason
      });

      // If no access, return limited metadata only
      if (!accessResult.hasAccess) {
        if (headOnly) {
          // For HEAD requests, just return the status code
          return new NextResponse(null, { status: 403 });
        }
        
        return NextResponse.json({
          bookId: bookId,
          chapterNumber: chapterNum,
          title: chapterData.title,
          author: chapterData.authorName || 'Anonymous',
          authorAddress: chapterData.authorAddress || '',
          wordCount: chapterData.wordCount || 0,
          readingTime: chapterData.readingTime || Math.ceil((chapterData.wordCount || 0) / 200),
          hasAccess: false,
          accessReason: accessResult.reason,
          error: accessResult.error || 'Access denied. Please unlock this chapter to read.',
          // Metadata needed for unlocking
          ipAssetId: chapterData.ipAssetId,
          licenseTermsId: chapterData.licenseTermsId,
          requiresPayment: chapterNum > 3,
          price: chapterNum > 3 ? '0.5' : '0',
          // Include book registration status in error response
          bookRegistrationRequired: accessResult.error?.includes('Book is not registered') || false
        }, { status: 403 });
      }

      // Get book metadata for additional info
      let bookMetadata: any = {};
      try {
        bookMetadata = await BookStorageService.getBookMetadata(bookId as any);
      } catch (err) {
        console.log('Could not fetch book metadata:', err);
      }

      console.log(`✅ Chapter ${chapterNumber} loaded:`, {
        title: chapterData.title,
        wordCount: chapterData.wordCount,
        hasContent: !!chapterData.content
      });

      // For HEAD requests, just return success status
      if (headOnly) {
        return new NextResponse(null, { status: 200 });
      }

      // Format response for chapter reading page
      const formattedResponse = {
        bookId: bookId,
        bookTitle: bookMetadata.title || chapterData.bookTitle || 'Unknown Book',
        chapterNumber: chapterNum,
        title: chapterData.title,
        content: chapterData.content,
        author: chapterData.authorName || 'Anonymous',
        authorAddress: chapterData.authorAddress || '',
        wordCount: chapterData.wordCount || 0,
        readingTime: chapterData.readingTime || Math.ceil((chapterData.wordCount || 0) / 200),
        createdAt: chapterData.createdAt || new Date().toISOString(),
        nextChapter: chapterNum + 1,
        previousChapter: chapterNum > 1 ? chapterNum - 1 : undefined,
        totalChapters: bookMetadata.totalChapters || 1,
        // Include blockchain registration info
        ipAssetId: chapterData.ipAssetId || bookMetadata.ipAssetId,
        transactionHash: chapterData.transactionHash
      };

      return NextResponse.json(formattedResponse);

    } catch (storageError) {
      console.error(`❌ Failed to fetch chapter ${chapterNumber} for book ${bookId}:`, storageError);
      
      if (storageError instanceof Error && storageError.message.includes('Chapter not found')) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        );
      }
      
      // Provide more detailed error information for debugging
      const errorMessage = storageError instanceof Error ? storageError.message : 'Unknown error';
      console.error('Storage error details:', errorMessage);
      
      return NextResponse.json(
        { 
          error: 'Failed to retrieve chapter content',
          details: errorMessage // Add error details for debugging
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Chapter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}