import { NextResponse } from 'next/server';
import { getBookById } from '@/lib/storage/bookStorage';

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
      coverUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-testnet.storyhouse.vip'}/api/books/${bookId}/cover`, // Use absolute URL for cover
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