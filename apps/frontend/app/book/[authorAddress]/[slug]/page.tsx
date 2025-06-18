'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import apiClient, { getApiBaseUrl } from '@/lib/api-client';
import ShareButton from '@/components/ui/ShareButton';
import { BookIPInfo } from '@/components/book';
import { BookRegistrationPrompt } from '@/components/book/BookRegistrationPrompt';

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
});


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
  unlocked?: boolean; // Whether the current user has unlocked this chapter
}

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const authorAddress = params.authorAddress as string;
  const slug = params.slug as string;
  const bookId = `${authorAddress}/${slug}`;
  const { address } = useAccount();
  
  const [book, setBook] = useState<BookDetails | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [nextChapterNumber, setNextChapterNumber] = useState<number>(1);
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
        apiClient.getBookById(bookId),
        apiClient.getBookChapters(bookId)
      ]);

      if (bookResponse) {
        console.log('📚 Book response:', bookResponse);
        setBook(bookResponse);
      }
      
      if (chaptersResponse.success && chaptersResponse.data) {
        // Load actual chapter details instead of placeholder data
        const chapterPromises = chaptersResponse.data.chapters.map(async (chapterNum: number) => {
          try {
            const chapterResponse = await apiClient.getChapter(bookId, chapterNum);
            return {
              number: chapterNum,
              title: chapterResponse.title || `Chapter ${chapterNum}`,
              preview: chapterResponse.content ? chapterResponse.content.slice(0, 150) + '...' : 'Chapter content preview loading...',
              reads: 0, // TODO: Get from metadata when available
              earnings: 0, // TODO: Get from metadata when available  
              wordCount: chapterResponse.wordCount || 0,
              status: 'published' as const,
              createdAt: chapterResponse.createdAt || new Date().toISOString()
            };
          } catch (error) {
            console.error(`Failed to load chapter ${chapterNum}:`, error);
            // Fallback to placeholder data if chapter fails to load
            return {
              number: chapterNum,
              title: `Chapter ${chapterNum}`,
              preview: 'Chapter content preview loading...',
              reads: 0,
              earnings: 0,
              wordCount: 0,
              status: 'published' as const,
              createdAt: new Date().toISOString()
            };
          }
        });

        const chapterObjects = await Promise.all(chapterPromises);
        setChapters(chapterObjects);
        
        // Set the next chapter number for writing
        setNextChapterNumber(chaptersResponse.data.nextChapterNumber || 1);
        
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
    if (!address) return 'Address not available';
    // Show alias for specific wallet address
    if (address.toLowerCase() === '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2') {
      return 'andybowu.ip';
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/own"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Library</span>
            </Link>
            
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
      {/* Book Details Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Book Cover - Left */}
          <div className="lg:col-span-3">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl.startsWith('/') ? `${getApiBaseUrl()}${book.coverUrl}` : book.coverUrl}
                alt={book.title}
                width={300}
                height={450}
                className="w-full aspect-[2/3] object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
                unoptimized={true}
                onError={() => console.log('Image failed to load:', book.coverUrl)}
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-b from-purple-600 to-blue-600 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {book.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Book Info - Middle */}
          <div className="lg:col-span-5">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <div className="flex items-center text-gray-600 mb-4">
              <span>by</span>
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
{formatAddress(book.authorAddress || book.author)}
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
              {/* Only show Write Chapter button if current user is the author */}
              {address && book.authorAddress && address.toLowerCase() === book.authorAddress.toLowerCase() && (
                <button
                  onClick={() => router.push(`/write/chapter?bookId=${encodeURIComponent(bookId)}&chapterNumber=${nextChapterNumber}`)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  ✍️ Write Chapter {nextChapterNumber}
                </button>
              )}
              <ShareButton
                title={book.title}
                description={book.description}
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/book/${bookId}`}
                imageUrl={book.coverUrl}
              />
            </div>
          </div>

          {/* Blockchain Registration Info - Right */}
          <div className="lg:col-span-4">
            <BookIPInfo bookId={bookId} />
          </div>
        </div>
      </div>

      {/* Book Registration Prompt - shows for authors after publishing chapters */}
      {address && book.authorAddress && address.toLowerCase() === book.authorAddress.toLowerCase() && (
        <BookRegistrationPrompt 
          bookId={bookId}
          chapterNumber={book.totalChapters || 0}
          onRegistrationComplete={() => {
            // Refresh book data after registration
            fetchBookDetails()
          }}
        />
      )}

      {/* Chapters Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
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
            {chapters.map((chapter) => {
              const isFree = chapter.number <= 3;
              const isPaid = chapter.number >= 4;
              const isUnlocked = chapter.unlocked || false; // Assuming we have this data
              const unlockPrice = isPaid ? 0.5 : 0; // Updated to match our pricing
              
              // Determine styling based on chapter state
              let chapterStyle = '';
              if (isFree) {
                chapterStyle = 'border-green-200 bg-green-50 border-l-4 border-l-green-400';
              } else if (isPaid && !isUnlocked) {
                chapterStyle = 'border-gray-200 bg-gray-50 border-l-4 border-l-gray-400';
              } else if (isPaid && isUnlocked) {
                chapterStyle = 'border-purple-200 bg-purple-50 border-l-4 border-l-purple-400';
              }
              
              return (
                <Link
                  key={chapter.number}
                  href={`/book/${authorAddress}/${slug}/chapter/${chapter.number}`}
                  className="block"
                >
                  <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${chapterStyle}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isPaid && !isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                          {isPaid && isUnlocked && <span className="text-purple-600">🔓</span>}
                          <h3 className={`text-lg font-semibold ${
                            isPaid && isUnlocked ? 'text-purple-900' : ''
                          }`}>
                            Chapter {chapter.number}: {chapter.title}
                          </h3>
                        </div>
                        <p className={`text-sm mt-1 line-clamp-2 ${
                          isPaid && !isUnlocked ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {chapter.preview}
                        </p>
                        {isPaid && !isUnlocked && (
                          <p className="text-gray-600 text-sm font-medium mt-2">
                            Unlock for {unlockPrice} TIP
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {isFree && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            FREE
                          </span>
                        )}
                        {isPaid && !isUnlocked && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            LOCKED
                          </span>
                        )}
                        {isPaid && isUnlocked && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            PREMIUM
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                      <span>{chapter.wordCount} words</span>
                      <span>•</span>
                      <span>{chapter.reads} reads</span>
                      <span>•</span>
                      <span>{formatDate(chapter.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}