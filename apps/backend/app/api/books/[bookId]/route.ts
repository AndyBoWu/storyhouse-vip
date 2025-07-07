import { NextResponse } from 'next/server';
import { getBookById } from '@/lib/storage/bookStorage';
import { r2Client } from '@/lib/r2';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    console.log('📚 Fetching book details for ID:', bookId);
    console.log('📚 Request params:', params);
    console.log('📚 Request URL:', request.url);

    const book = await getBookById(bookId);
    console.log('📚 Book found result:', book ? 'SUCCESS' : 'NOT FOUND');
    if (book) {
      console.log('📚 Book metadata:', { 
        id: book.id, 
        title: book.title, 
        authorAddress: book.authorAddress,
        author: book.author,
        coverUrl: book.coverUrl, 
        coverImageUrl: book.coverImageUrl 
      });
    }
    
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Return all book metadata fields
    const bookDetails = {
      // Basic info
      id: book.id,
      bookId: book.bookId,
      title: book.title,
      description: book.description,
      
      // Author info
      author: book.authorAddress || book.author,
      authorAddress: book.authorAddress || book.author,
      authorName: book.authorName || 'Anonymous',
      
      // Cover - convert relative URLs to absolute API URLs
      coverUrl: (() => {
        const storedUrl = book.coverUrl || book.coverImageUrl
        // Use appropriate base URL for environment
        const isDev = process.env.NODE_ENV === 'development'
        const baseUrl = isDev ? 'http://localhost:3002' : 'https://api-testnet.storyhouse.vip'
        
        if (storedUrl && storedUrl.startsWith('/books/')) {
          // Extract book ID from the cover path (e.g., /books/{authorAddress}/{slug}/cover.jpg)
          const match = storedUrl.match(/\/books\/([^\/]+\/[^\/]+)\/cover\.(jpg|png|webp)/)
          if (match) {
            const coverBookId = match[1]
            // Convert to API endpoint for that specific book
            return `${baseUrl}/api/books/${encodeURIComponent(coverBookId)}/cover`
          }
        } else if (storedUrl && (storedUrl.startsWith('http://') || storedUrl.startsWith('https://'))) {
          // Even if it's an absolute URL, we need to proxy it through our API
          // because the R2 bucket is private
          return `${baseUrl}/api/books/${encodeURIComponent(bookId)}/cover`
        }
        
        // Default: use this book's cover API endpoint
        return `${baseUrl}/api/books/${encodeURIComponent(bookId)}/cover`
      })(),
      
      // Content info
      genres: book.genres || [],
      genre: book.genres?.[0] || book.genre || 'General',
      contentRating: book.contentRating || 'G',
      tags: book.tags || [],
      isRemixable: book.isRemixable !== false,
      
      // Chapter info
      totalChapters: book.totalChapters || book.chapters || 0,
      chapterMap: book.chapterMap || {},
      
      // Branching info
      parentBook: book.parentBook,
      parentBookId: book.parentBookId || book.parentBook,
      branchPoint: book.branchPoint,
      derivativeBooks: book.derivativeBooks || [],
      originalAuthors: book.originalAuthors || {},
      
      // Stats
      totalReads: book.totalReads || 0,
      totalEarnings: book.totalEarnings || 0,
      totalRevenue: book.totalRevenue || 0,
      averageRating: book.averageRating || book.rating || 0,
      rating: book.rating || 0,
      
      // Blockchain info
      ipAssetId: book.ipAssetId,
      licenseTermsId: book.licenseTermsId,
      tokenId: book.tokenId,
      transactionHash: book.transactionHash,
      
      // Timestamps
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      
      // Status
      status: book.status || 'published',
      isPublic: book.isPublic !== false
    };

    return NextResponse.json(bookDetails);
  } catch (error) {
    console.error('❌ Error fetching book details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    console.log('🗑️ Deleting book with ID:', bookId);
    
    // Parse the bookId which is in format: {authorAddress}/{slug}
    const [authorAddress, slug] = bookId.split('/');
    
    if (!authorAddress || !slug) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      );
    }

    // Delete book and all its content from R2
    const r2 = r2Client;
    
    // Delete all files under the book directory
    const bookPrefix = `books/${authorAddress}/${slug}/`;
    console.log('🗑️ Deleting all files with prefix:', bookPrefix);
    
    // List all objects with this prefix
    const listResult = await r2.list({ prefix: bookPrefix });
    console.log(`🗑️ Found ${listResult.objects.length} files to delete`);
    
    // Delete all objects
    if (listResult.objects.length > 0) {
      const deletePromises = listResult.objects.map(obj => {
        console.log('🗑️ Deleting file:', obj.key);
        return r2.delete(obj.key);
      });
      
      await Promise.all(deletePromises);
    }
    
    console.log(`✅ Deleted book: ${bookId} (${listResult.objects.length} files removed)`);

    return NextResponse.json({ 
      success: true, 
      message: `Book ${bookId} deleted successfully`,
      filesDeleted: listResult.objects.length 
    });
  } catch (error) {
    console.error('❌ Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}