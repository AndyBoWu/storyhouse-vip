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
      
      // Get book metadata to check if it's a derivative book
      let bookMetadata: any = {};
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
          // Format: "books/0x1234/detective/chapters/ch1/content.json" -> extract "0x1234" and "detective"
          const pathMatch = chapterPath.match(/^(?:books\/)?(0x[a-fA-F0-9]+)\/([^/]+)\/chapters\/ch\d+(?:\/content\.json)?$/);
          if (pathMatch) {
            const [, originalAuthor, originalSlug] = pathMatch;
            console.log(`📖 Fetching inherited chapter info from original book: ${originalAuthor}/${originalSlug}`);
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
            console.log(`✅ Found chapter ${chapterNum} info in parent book`);
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
        console.error(`❌ Error loading book metadata:`, error);
        // If metadata fails, try direct chapter fetch as fallback
        chapterData = await BookStorageService.getChapterContent(
          authorAddress,
          slug,
          chapterNum
        );
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