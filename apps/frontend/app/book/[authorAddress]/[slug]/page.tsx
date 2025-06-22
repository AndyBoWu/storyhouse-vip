'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, Unlock, BookOpen, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import apiClient, { getApiBaseUrl } from '@/lib/api-client';
import ShareButton from '@/components/ui/ShareButton';
import { BookIPInfo } from '@/components/book';
import { BookRegistrationPrompt } from '@/components/book/BookRegistrationPrompt';
import { ChapterPricingSetup } from '@/components/book/ChapterPricingSetup';
import { getHardcodedGenres, getGenreBadgeClass, type GenreType } from '@/lib/genre-utils';

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
      
      // Check for publishing result in session storage
      if (typeof window !== 'undefined') {
        const publishingResult = sessionStorage.getItem('publishingResult');
        if (publishingResult) {
          const result = JSON.parse(publishingResult);
          // Only show if it's for this book and recent (within 5 minutes)
          if (result.bookId === bookId && Date.now() - result.timestamp < 5 * 60 * 1000) {
            // No alert needed - user can see chapter in the list
            // Clear the session storage
            sessionStorage.removeItem('publishingResult');
          }
        }
      }
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
        // Load actual chapter details and check unlock status
        const chapterPromises = chaptersResponse.data.chapters.map(async (chapterNum: number) => {
          try {
            const chapterResponse = await apiClient.getChapter(bookId, chapterNum);
            
            // Check if user has unlocked this chapter
            let isUnlocked = false;
            
            // TEMPORARY: Simulate Bob having unlocked chapters 4-10 for demonstration
            const isBob = address && address.toLowerCase() === '0x71b93d154886c297f4b6e6219c47d378f6ac6a70';
            if (isBob && chapterNum >= 4 && chapterNum <= 10) {
              console.log(`🎭 DEMO: Simulating Bob has unlocked chapter ${chapterNum}`);
              isUnlocked = true;
            } else if (address && chapterNum >= 4) {
              try {
                console.log(`🔍 Checking access for chapter ${chapterNum} with address:`, address);
                // Use the unlock endpoint to check access status
                const params = new URLSearchParams();
                params.append('userAddress', address);
                
                const accessResponse = await apiClient.get(`/books/${encodeURIComponent(bookId)}/chapter/${chapterNum}/unlock?${params}`);
                console.log(`📊 Chapter ${chapterNum} access check response:`, accessResponse);
                
                if (accessResponse.success && accessResponse.data) {
                  isUnlocked = accessResponse.data.alreadyUnlocked || accessResponse.data.canAccess;
                }
              } catch (accessError) {
                console.log(`Could not check access for chapter ${chapterNum}:`, accessError);
                isUnlocked = false;
              }
            } else if (chapterNum <= 3) {
              isUnlocked = true; // Free chapters are always unlocked
            }
            
            return {
              number: chapterNum,
              title: chapterResponse.title || `Chapter ${chapterNum}`,
              preview: chapterResponse.content ? chapterResponse.content.slice(0, 150) + '...' : 'Chapter content preview loading...',
              reads: 0, // TODO: Get from metadata when available
              earnings: 0, // TODO: Get from metadata when available  
              wordCount: chapterResponse.wordCount || 0,
              status: 'published' as const,
              createdAt: chapterResponse.createdAt || new Date().toISOString(),
              unlocked: isUnlocked
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
    // Show alias for specific wallet addresses
    if (address.toLowerCase() === '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2') {
      return 'andybowu.ip';
    }
    if (address.toLowerCase() === '0x71b93d154886c297f4b6e6219c47d378f6ac6a70') {
      return 'bob.ip';
    }
    if (address.toLowerCase() === '0xd49646149734f829c722a547f6be217571a8355d') {
      return 'royce.ip';
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
      <div className="min-h-screen bg-gradient-to-b from-orange-200 via-pink-200 to-blue-300">
        {/* Navigation Header */}
        <header className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/own"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Library</span>
              </Link>
              
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                  <BookOpen className="w-16 h-16 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  📚 Story Not Found
                </h1>
                <p className="text-xl text-gray-600 mb-2">
                  Oops! The story you're looking for seems to have wandered off into the digital library.
                </p>
                <p className="text-gray-500">
                  It might have been moved, renamed, or is taking a creative break.
                </p>
              </div>
            </div>

            {/* Action Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Search Stories */}
              <div className="glass bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:shadow-xl border border-white/20">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Search Stories</h3>
                <p className="text-gray-600 mb-4">Find the story you're looking for by searching our library</p>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Browse Library
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>

              {/* Popular Stories */}
              <div className="glass bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:shadow-xl border border-white/20">
                <div className="text-3xl mb-4">⭐</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Popular Stories</h3>
                <p className="text-gray-600 mb-4">Discover trending stories from our community</p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  Explore Popular
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>

              {/* Start Writing */}
              <div className="glass bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:shadow-xl border border-white/20">
                <div className="text-3xl mb-4">✍️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your Story</h3>
                <p className="text-gray-600 mb-4">Start your own Web3 storytelling journey</p>
                <Link
                  href="/write"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full hover:from-violet-700 hover:to-purple-700 transition-all"
                >
                  Start Writing
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>

            {/* Platform Features Highlight */}
            <div className="glass bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                🌟 Why StoryHouse.vip?
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Chapter-Level IP Protection</h3>
                      <p className="text-gray-600 text-sm">Register individual chapters as IP assets for $50-500 vs $1000+ for full books</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Automated Royalties</h3>
                      <p className="text-gray-600 text-sm">Smart contracts handle licensing and payments automatically</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">$TIP Token Economy</h3>
                      <p className="text-gray-600 text-sm">Earn TIP tokens through reading and writing quality content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Community Driven</h3>
                      <p className="text-gray-600 text-sm">Connect with readers and writers in our Web3 storytelling community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-gray-700">Can't find what you're looking for?</span>
                <Link
                  href="/own"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-medium"
                >
                  Return to My Library
                </Link>
              </div>
            </div>
          </div>
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
            <div className={`grid gap-4 mb-6 ${book.rating ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{book.totalChapters}</div>
                <div className="text-sm text-gray-600">Chapters</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{book.totalReads || 1247}</div>
                <div className="text-sm text-gray-600">Total Reads</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{book.totalEarnings || 85.6}</div>
                <div className="text-sm text-gray-600">TIP Earnings</div>
              </div>
              {!!book.rating && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {book.rating.toFixed(1)}⭐
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {getHardcodedGenres().map((genre) => (
                  <span
                    key={genre}
                    className={getGenreBadgeClass(genre)}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

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
              // Check if current user is the author
              const isAuthor = address && book.authorAddress && address.toLowerCase() === book.authorAddress.toLowerCase();
              
              const isFree = chapter.number <= 3;
              const isPaid = chapter.number >= 4;
              const isUnlocked = isAuthor || chapter.unlocked || false; // Authors always have access
              const unlockPrice = isPaid ? 0.5 : 0; // Updated to match our pricing
              
              // Enhanced visual design with better unlock indication
              let chapterStyle = '';
              let iconComponent = null;
              let statusBadge = null;
              
              if (isFree) {
                chapterStyle = 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200';
                iconComponent = (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                );
                statusBadge = (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    FREE
                  </span>
                );
              } else if (isPaid && !isUnlocked) {
                chapterStyle = 'border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-l-slate-400 shadow-sm opacity-90 hover:opacity-100 hover:shadow-md transition-all duration-200';
                iconComponent = (
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center shadow-md">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                );
                statusBadge = (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-600 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                    LOCKED
                  </span>
                );
              } else if (isPaid && isUnlocked) {
                chapterStyle = 'border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-l-blue-500 shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200';
                iconComponent = (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                );
                statusBadge = (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isAuthor ? 'AUTHOR' : 'LICENSED'}
                  </span>
                );
              }
              
              return (
                <Link
                  key={chapter.number}
                  href={`/book/${authorAddress}/${slug}/chapter/${chapter.number}`}
                  className="block"
                >
                  <div className={`border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer ${chapterStyle}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          {iconComponent}
                          <div className="flex-1">
                            <h3 className={`text-xl font-semibold ${
                              isFree ? 'text-emerald-800' : 
                              isPaid && isUnlocked ? 'text-blue-800' : 'text-slate-700'
                            }`}>
                              Chapter {chapter.number}: {chapter.title}
                            </h3>
                            {isPaid && isUnlocked && !isAuthor && (
                              <p className="text-sm text-blue-600 mt-1 font-medium">
                                ✨ You own a reading license for this chapter
                              </p>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          isPaid && !isUnlocked ? 'text-slate-500' : 'text-slate-600'
                        }`}>
                          {chapter.preview}
                        </p>
                        {isPaid && !isUnlocked && (
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-amber-700 text-sm font-medium flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Unlock for {unlockPrice} TIP
                            </p>
                          </div>
                        )}
                        {isPaid && isUnlocked && !isAuthor && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-blue-700 text-sm font-semibold">
                                  Premium Access Unlocked
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-blue-600 text-xs flex items-center gap-1">
                                    <span className="inline-block w-4 h-4 text-center">📄</span>
                                    Personal reading license
                                  </p>
                                  <p className="text-blue-600 text-xs flex items-center gap-1">
                                    <span className="inline-block w-4 h-4 text-center">💎</span>
                                    Purchased for 0.5 TIP
                                  </p>
                                  <p className="text-blue-500 text-xs flex items-center gap-1">
                                    <span className="inline-block w-4 h-4 text-center">👤</span>
                                    Original IP by {formatAddress(book.authorAddress || book.author)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-100">
                              <p className="text-blue-600 text-xs font-medium text-center">
                                Click to continue reading →
                              </p>
                            </div>
                          </div>
                        )}
                        {isPaid && isAuthor && (
                          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-purple-700 text-sm font-medium flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Author Access
                            </p>
                            <p className="text-purple-600 text-xs mt-1">
                              You have full access to all chapters as the author
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        {statusBadge}
                        {isPaid && isUnlocked && !isAuthor && (
                          <span className="text-xs text-blue-600 font-medium">
                            ✨ Premium Access
                          </span>
                        )}
                        {isPaid && isAuthor && (
                          <span className="text-xs text-purple-600 font-medium">
                            👑 Author
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