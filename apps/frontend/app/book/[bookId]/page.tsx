'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api-client';


interface BookDetails {
  id: string;
  title: string;
  author: string;
  authorAddress: string;
  description: string;
  coverUrl?: string;
  genre: string[];
  totalChapters: number;
  totalReads: number;
  totalEarnings: number;
  rating?: number;
  createdAt: string;
}

interface Chapter {
  number: number;
  title: string;
  preview: string;
  reads: number;
  earnings: number;
  wordCount: number;
  status: 'published' | 'draft' | 'locked';
  createdAt: string;
}

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  
  const [book, setBook] = useState<BookDetails | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch book details and chapters
      const [bookResponse, chaptersResponse] = await Promise.all([
        apiClient.get(`/books/${bookId}`),
        apiClient.getBookChapters(bookId)
      ]);

      if (bookResponse) {
        console.log('📚 Book response:', bookResponse);
        setBook(bookResponse);
      }
      
      if (chaptersResponse.success && chaptersResponse.data) {
        // Convert chapter numbers to Chapter objects with placeholder data
        const chapterObjects = chaptersResponse.data.chapters.map((chapterNum: number) => ({
          number: chapterNum,
          title: `Chapter ${chapterNum}`,
          preview: 'Chapter content preview loading...',
          reads: 0,
          earnings: 0,
          wordCount: 0,
          status: 'published' as const,
          createdAt: new Date().toISOString()
        }));
        
        setChapters(chapterObjects);
        
        // Update book's totalChapters from the chapters API response
        if (bookResponse && chaptersResponse.data.totalChapters !== undefined) {
          setBook(prevBook => prevBook ? {
            ...prevBook,
            totalChapters: chaptersResponse.data.totalChapters
          } : null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch book details:', err);
      setError('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Book not found'}</p>
          <Link href="/own" className="text-blue-600 hover:underline">
            Back to My Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Book Details Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book Cover */}
          <div className="md:col-span-1">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={300}
                height={400}
                className="w-full rounded-lg shadow-md hover:shadow-xl transition-shadow"
                unoptimized={true}
                onError={() => console.log('Image failed to load:', book.coverUrl)}
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gradient-to-b from-purple-600 to-blue-600 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {book.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <div className="flex items-center text-gray-600 mb-4">
              <span>by</span>
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {formatAddress(book.authorAddress)}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{book.totalChapters}</div>
                <div className="text-sm text-gray-600">Chapters</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{book.totalReads || 0}</div>
                <div className="text-sm text-gray-600">Total Reads</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {book.totalEarnings || 0} TIP
                </div>
                <div className="text-sm text-gray-600">Earnings</div>
              </div>
              {book.rating && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {book.rating.toFixed(1)}⭐
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              )}
            </div>

            {/* Genres */}
            {book.genre && book.genre.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {book.genre.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">About this book</h3>
              <p className="text-gray-600 leading-relaxed">{book.description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {chapters.length > 0 && (
                <Link
                  href={`/book/${bookId}/chapter/1`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Reading
                </Link>
              )}
              <button
                onClick={() => router.push(`/write/branch?bookId=${bookId}`)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ✍️ Start Writing
              </button>
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Chapters</h2>
        
        {(!chapters || chapters.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No chapters available yet.</p>
            <button
              onClick={() => router.push(`/write/branch?bookId=${bookId}`)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Write the First Chapter
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <Link
                key={chapter.number}
                href={`/book/${bookId}/chapter/${chapter.number}`}
                className="block"
              >
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Chapter {chapter.number}: {chapter.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {chapter.preview}
                      </p>
                    </div>
                    {chapter.status === 'locked' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                    <span>{chapter.wordCount} words</span>
                    <span>•</span>
                    <span>{chapter.reads} reads</span>
                    <span>•</span>
                    <span>{chapter.earnings} TIP earned</span>
                    <span>•</span>
                    <span>{formatDate(chapter.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}