import { NextResponse } from 'next/server';
import { getBookById } from '@/lib/storage/bookStorage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    console.log('📚 Fetching book details for ID:', bookId);

    const book = await getBookById(bookId);
    
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Calculate additional stats
    const bookDetails = {
      id: bookId,
      title: book.title,
      author: book.authorAddress,
      authorAddress: book.authorAddress,
      authorName: book.authorName || 'Anonymous',
      description: book.description,
      coverUrl: book.coverUrl,
      genre: book.genres || [],
      totalChapters: book.totalChapters || 0,
      totalReads: book.totalReads || 0,
      totalEarnings: book.totalRevenue || 0,
      rating: book.averageRating,
      createdAt: book.createdAt,
      ipAssetId: book.ipAssetId,
      tokenId: undefined,
      transactionHash: undefined,
      status: 'published'
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