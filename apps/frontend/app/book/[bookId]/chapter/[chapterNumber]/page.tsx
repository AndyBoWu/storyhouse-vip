'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import ChapterAccessControl from '@/components/ui/ChapterAccessControl';
import { useChapterAccess } from '@/hooks/useChapterAccess';
// import ReadingProgressBar from '@/components/ui/ReadingProgressBar';
// import ReadingPreferences from '@/components/ui/ReadingPreferences';


interface ChapterContent {
  bookId: string;
  bookTitle: string;
  chapterNumber: number;
  title: string;
  content: string;
  author: string;
  authorAddress: string;
  wordCount: number;
  readingTime: number;
  createdAt: string;
  nextChapter?: number;
  previousChapter?: number;
  totalChapters: number;
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const bookId = params.bookId as string;
  const chapterNumber = parseInt(params.chapterNumber as string);
  
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [readingProgress, setReadingProgress] = useState(0);
  
  const { getChapterPricing } = useChapterAccess();

  // Helper function to check if current user is the book owner
  const isBookOwner = (chapter: ChapterContent | null): boolean => {
    if (!address || !chapter) return false;
    return address.toLowerCase() === chapter.authorAddress.toLowerCase();
  };

  useEffect(() => {
    if (bookId && chapterNumber) {
      initializeChapter();
    }
  }, [bookId, chapterNumber, address]); // Include address to re-run when wallet connects

  const initializeChapter = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always fetch basic info first to get author address
      const chapterInfo = await apiClient.get(`/books/${bookId}/chapter/${chapterNumber}/info`);
      
      if (chapterInfo) {
        const pricing = getChapterPricing(chapterNumber);
        const userIsOwner = address && address.toLowerCase() === chapterInfo.authorAddress.toLowerCase();
        
        // Determine if user should have access
        if (pricing.isFree || userIsOwner) {
          // Fetch full content
          const fullChapter = await apiClient.get(`/books/${bookId}/chapter/${chapterNumber}`);
          setChapter(fullChapter);
          setHasAccess(true);
        } else {
          // Set info-only chapter (no content)
          setChapter({
            ...chapterInfo,
            content: '' // No content for non-owners of paid chapters
          });
          setHasAccess(false);
        }
      }
    } catch (err) {
      console.error('Failed to load chapter:', err);
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      const progress = (scrolled / (fullHeight - viewportHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAccessGranted = async () => {
    try {
      // When access is granted (e.g., after payment), fetch full content
      const fullChapter = await apiClient.get(`/books/${bookId}/chapter/${chapterNumber}`);
      setChapter(fullChapter);
      setHasAccess(true);
    } catch (err) {
      console.error('Failed to fetch chapter content after unlock:', err);
      setError('Failed to load chapter content');
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'sepia':
        return 'bg-amber-50 text-amber-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-sm leading-relaxed';
      case 'large':
        return 'text-xl leading-loose';
      default:
        return 'text-base leading-relaxed';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading chapter...</div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Chapter not found'}</p>
          <Link href={`/book/${bookId}`} className="text-blue-600 hover:underline">
            Back to Book
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()} transition-colors duration-300`}>
      {/* <ReadingProgressBar progress={readingProgress} /> */}
      
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/book/${bookId}`}
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back to {chapter.bookTitle}
              </Link>
            </div>
            
            {/* <ReadingPreferences
              fontSize={fontSize}
              setFontSize={setFontSize}
              theme={theme}
              setTheme={setTheme}
            /> */}
          </div>
        </div>
      </header>

      {/* Chapter Content */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Show access control if user doesn't have access */}
        {!hasAccess && chapter && (
          <div className="mb-8">
            <ChapterAccessControl
              bookId={bookId}
              chapterNumber={chapterNumber}
              chapterTitle={chapter.title}
              onAccessGranted={handleAccessGranted}
              className="mb-6"
            />
          </div>
        )}

        {/* Show content only if user has access */}
        {hasAccess && chapter && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Chapter {chapter.chapterNumber}: {chapter.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>by {chapter.authorAddress.slice(0, 6)}...{chapter.authorAddress.slice(-4)}</span>
                {isBookOwner(chapter) && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 font-medium">Your Book</span>
                  </>
                )}
                <span>•</span>
                <span>{chapter.wordCount} words</span>
                <span>•</span>
                <span>{chapter.readingTime} min read</span>
              </div>
            </div>

            <div className={`prose prose-gray dark:prose-invert max-w-none ${getFontSizeClass()}`}>
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: chapter.content }}
              />
            </div>
          </>
        )}

        {/* Navigation - only show when user has access */}
        {hasAccess && chapter && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex justify-between items-center">
              {chapter.previousChapter ? (
                <Link
                  href={`/book/${bookId}/chapter/${chapter.previousChapter}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ← Previous Chapter
                </Link>
              ) : (
                <div />
              )}

              <Link
                href={`/book/${bookId}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Table of Contents
              </Link>

              {chapter.nextChapter && chapter.nextChapter <= chapter.totalChapters ? (
                <Link
                  href={`/book/${bookId}/chapter/${chapter.nextChapter}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Next Chapter →
                </Link>
              ) : (
                <button
                  onClick={() => router.push(`/write/chapter?bookId=${bookId}&chapterNumber=${chapter.chapterNumber + 1}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  ✍️ Write Next Chapter
                </button>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}