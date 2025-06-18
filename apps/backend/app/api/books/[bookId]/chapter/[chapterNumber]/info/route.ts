import { NextRequest, NextResponse } from 'next/server';
import { BookStorageService } from '@/lib/storage/bookStorage';

interface ChapterParams {
  bookId: string;
  chapterNumber: string;
}

/**
 * GET /api/books/[bookId]/chapter/[chapterNumber]/info - Fetch chapter metadata without content
 * Used for paid chapters before unlock to show basic info only
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

    console.log(`📋 Fetching info for chapter ${chapterNumber} of book ${bookId}`);

    try {
      // Parse book ID to get author address and slug
      const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
      
      // Get chapter content using the book storage service
      const chapterData = await BookStorageService.getChapterContent(
        authorAddress,
        slug,
        chapterNum
      );

      // Get book metadata for additional info
      let bookMetadata: any = {};
      try {
        bookMetadata = await BookStorageService.getBookMetadata(bookId as any);
      } catch (err) {
        console.log('Could not fetch book metadata:', err);
      }

      console.log(`✅ Chapter ${chapterNumber} info loaded:`, {
        title: chapterData.title,
        wordCount: chapterData.wordCount,
        hasContent: false // No content in info endpoint
      });

      // Format response for chapter info (without content)
      const formattedResponse = {
        bookId: bookId,
        bookTitle: bookMetadata.title || chapterData.bookTitle || 'Unknown Book',
        chapterNumber: chapterNum,
        title: chapterData.title,
        // content: explicitly omitted for info endpoint
        author: chapterData.authorName || 'Anonymous',
        authorAddress: chapterData.authorAddress || '',
        wordCount: chapterData.wordCount || 0,
        readingTime: chapterData.readingTime || Math.ceil((chapterData.wordCount || 0) / 200),
        createdAt: chapterData.createdAt || new Date().toISOString(),
        nextChapter: chapterNum + 1,
        previousChapter: chapterNum > 1 ? chapterNum - 1 : undefined,
        totalChapters: bookMetadata.totalChapters || 1,
        // Include IP asset information for license minting
        ipAssetId: chapterData.ipAssetId,
        parentIpAssetId: chapterData.parentIpAssetId || bookMetadata.ipAssetId,
        licenseTermsId: chapterData.licenseTermsId || bookMetadata.licenseTermsId // Try chapter first, then book
      };

      return NextResponse.json(formattedResponse);

    } catch (storageError) {
      console.error(`❌ Failed to fetch chapter ${chapterNumber} info for book ${bookId}:`, storageError);
      
      if (storageError instanceof Error && storageError.message.includes('Chapter not found')) {
        return NextResponse.json(
          { error: 'Chapter not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to retrieve chapter information' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Chapter info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}