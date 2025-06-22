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

    // Calculate additional stats
    const bookDetails = {
      id: book.id,
      title: book.title,
      author: book.authorAddress || book.author,
      authorAddress: book.authorAddress || book.author,
      authorName: book.authorName || 'Anonymous',
      description: book.description,
      coverUrl: `/api/books/${encodeURIComponent(bookId)}/cover`, // Use relative URL for cover with proper encoding
      genre: book.genres || [],
      totalChapters: book.chapters || 0,
      totalReads: book.totalReads || 0,
      totalEarnings: book.totalEarnings || 0,
      rating: book.rating,
      createdAt: book.createdAt,
      ipAssetId: book.ipAssetId,
      tokenId: book.tokenId,
      transactionHash: book.transactionHash,
      status: book.status || 'published'
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