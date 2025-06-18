import { NextRequest, NextResponse } from 'next/server';
import { BookStorageService } from '@/lib/storage/bookStorage';
import { chapterAccessService } from '@/lib/services/chapterAccessService';

interface ChapterParams {
  bookId: string;
  chapterNumber: string;
}

/**
 * GET /api/books/[bookId]/chapter/[chapterNumber] - Fetch a specific book chapter
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<ChapterParams> }
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
      
      // First, get chapter metadata to check if it needs access control
      const chapterData = await BookStorageService.getChapterContent(
        authorAddress,
        slug,
        chapterNum
      );

      // Check access permissions
      const accessResult = await chapterAccessService.checkChapterAccess(
        bookId,
        chapterNum,
        userAddress,
        chapterData.ipAssetId
      );

      console.log(`🔐 Access check for chapter ${chapterNum}:`, {
        userAddress,
        hasAccess: accessResult.hasAccess,
        reason: accessResult.reason
      });

      // If no access, return limited metadata only
      if (!accessResult.hasAccess) {
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
          error: 'Access denied. Please unlock this chapter to read.',
          // Metadata needed for unlocking
          ipAssetId: chapterData.ipAssetId,
          licenseTermsId: chapterData.licenseTermsId,
          requiresPayment: chapterNum > 3,
          price: chapterNum > 3 ? '0.5' : '0'
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
      
      return NextResponse.json(
        { error: 'Failed to retrieve chapter content' },
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