'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Settings, X, Type, Minus, Plus } from 'lucide-react';
import apiClient from '@/lib/api-client';
import ChapterAccessControl from '@/components/ui/ChapterAccessControl';
import { useChapterAccess } from '@/hooks/useChapterAccess';
import ReadingProgressBar from '@/components/ui/ReadingProgressBar';
import ReadingPreferences from '@/components/ui/ReadingPreferences';


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
  ipAssetId?: string;
  transactionHash?: string;
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const authorAddress = params.authorAddress as string;
  const slug = params.slug as string;
  const bookId = `${authorAddress}/${slug}`;
  const chapterNumber = parseInt(params.chapterNumber as string);
  
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [readingProgress, setReadingProgress] = useState(0);
  
  // Reading settings state
  const [showSettings, setShowSettings] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [focusMode, setFocusMode] = useState(false);
  
  const { getChapterPricing } = useChapterAccess();

  // Handle reading preferences change
  const handlePreferencesChange = (preferences: { fontSize: 'small' | 'medium' | 'large' | 'extra-large', fontFamily: 'inter' | 'georgia' | 'merriweather' }) => {
    setFontSize(preferences.fontSize === 'extra-large' ? 'large' : preferences.fontSize);
    setFontFamily(preferences.fontFamily === 'inter' ? 'sans' : preferences.fontFamily === 'georgia' ? 'serif' : 'serif');
  };

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
      
      console.log(`🔍 Loading chapter info for: ${bookId}/chapter/${chapterNumber}`);
      
      // Always fetch basic info first to get author address
      const chapterInfo = await apiClient.get(`/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}/info`);
      
      console.log('📋 Chapter info loaded:', chapterInfo);
      
      if (chapterInfo) {
        const pricing = getChapterPricing(chapterNumber);
        const userIsOwner = address && address.toLowerCase() === chapterInfo.authorAddress.toLowerCase();
        
        console.log('💰 Chapter pricing:', { pricing, userIsOwner, address, authorAddress: chapterInfo.authorAddress });
        
        // Determine if user should have access
        if (pricing.isFree || userIsOwner) {
          // Fetch full content
          console.log('🔓 User has access, fetching full content...');
          const fullChapter = await apiClient.get(`/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}`);
          console.log('📖 Full chapter loaded:', { title: fullChapter.title, hasContent: !!fullChapter.content });
          setChapter(fullChapter);
          setHasAccess(true);
        } else {
          // Set info-only chapter (no content)
          console.log('🔒 User needs to unlock, showing info only');
          setChapter({
            ...chapterInfo,
            content: '' // No content for non-owners of paid chapters
          });
          setHasAccess(false);
        }
      }
    } catch (err) {
      console.error('❌ Failed to load chapter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter';
      setError(errorMessage);
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

  // Load reading preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('readingPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      if (prefs.fontSize) setFontSize(prefs.fontSize);
      if (prefs.theme) setTheme(prefs.theme);
      if (prefs.fontFamily) setFontFamily(prefs.fontFamily);
      if (prefs.lineHeight) setLineHeight(prefs.lineHeight);
      if (prefs.focusMode !== undefined) setFocusMode(prefs.focusMode);
    }
  }, []);

  // Save reading preferences to localStorage
  useEffect(() => {
    const prefs = { fontSize, theme, fontFamily, lineHeight, focusMode };
    localStorage.setItem('readingPreferences', JSON.stringify(prefs));
  }, [fontSize, theme, fontFamily, lineHeight, focusMode]);

  const handleAccessGranted = async () => {
    try {
      // When access is granted (e.g., after payment), fetch full content
      const fullChapter = await apiClient.get(`/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}`);
      setChapter(fullChapter);
      setHasAccess(true);
    } catch (err) {
      console.error('Failed to fetch chapter content after unlock:', err);
      setError('Failed to load chapter content');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    // Show alias for specific wallet address
    if (address.toLowerCase() === '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2') {
      return 'andybowu.ip';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        return 'text-sm md:text-base';
      case 'large':
        return 'text-lg md:text-xl lg:text-2xl';
      default:
        return 'text-base md:text-lg';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'sans':
        return 'font-sans';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-serif';
    }
  };

  const getLineHeightClass = () => {
    switch (lineHeight) {
      case 'normal':
        return 'leading-normal';
      case 'loose':
        return 'leading-loose';
      default:
        return 'leading-relaxed';
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
          <Link href={`/book/${authorAddress}/${slug}`} className="text-blue-600 hover:underline">
            Back to Book
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()} transition-colors duration-300`}>
      <ReadingProgressBar />
      
      {/* Header */}
      <header className={`sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b z-40 transition-all duration-300 ${focusMode ? 'opacity-0 hover:opacity-100' : ''}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/book/${authorAddress}/${slug}`}
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back to {chapter.bookTitle}
              </Link>
            </div>
            
            <ReadingPreferences
              onPreferencesChange={handlePreferencesChange}
            />
          </div>
        </div>
      </header>

      {/* Chapter Content */}
      <article className={`container mx-auto px-4 py-8 ${focusMode ? 'max-w-2xl' : 'max-w-4xl'} transition-all duration-300`}>
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
                <span>by {formatAddress(chapter.authorAddress)}</span>
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
              
              {/* Wallet Address Display */}
              {address && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Reading as:</span>
                  <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </code>
                </div>
              )}
              
              {/* IP Asset Registration Info */}
              {chapter.ipAssetId && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">🔗 IP Asset ID:</span>
                    <code className="font-mono text-gray-700 dark:text-gray-300">{chapter.ipAssetId.slice(0, 10)}...{chapter.ipAssetId.slice(-8)}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(chapter.ipAssetId!)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy IP Asset ID"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <a
                      href={chapter.transactionHash 
                        ? `https://aeneid.storyscan.io/tx/${chapter.transactionHash}`
                        : `https://aeneid.storyscan.io/ipa/${chapter.ipAssetId}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="View on StoryScan"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className={`prose prose-gray dark:prose-invert max-w-none ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}>
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
                  href={`/book/${authorAddress}/${slug}/chapter/${chapter.previousChapter}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ← Previous Chapter
                </Link>
              ) : (
                <div />
              )}

              <Link
                href={`/book/${authorAddress}/${slug}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Table of Contents
              </Link>

              {chapter.nextChapter && chapter.nextChapter <= chapter.totalChapters ? (
                <Link
                  href={`/book/${authorAddress}/${slug}/chapter/${chapter.nextChapter}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Next Chapter →
                </Link>
              ) : (
                <button
                  onClick={() => router.push(`/write/chapter?bookId=${encodeURIComponent(bookId)}&chapterNumber=${chapter.chapterNumber + 1}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  ✍️ Write Next Chapter
                </button>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Floating Settings Button */}
      <button
        onClick={() => {
          console.log('Settings button clicked, current state:', showSettings);
          setShowSettings(!showSettings);
        }}
        className={`fixed ${showSettings ? 'right-80' : 'right-6'} bottom-20 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-300 z-40`}
        aria-label="Reading Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Settings Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 z-50 ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          // Debug: Force visibility to test if panel is working
          // transform: showSettings ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Reading Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'sepia'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all capitalize ${
                    theme === t 
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (fontSize === 'medium') setFontSize('small');
                  else if (fontSize === 'large') setFontSize('medium');
                }}
                disabled={fontSize === 'small'}
                className={`p-2 rounded-lg transition-all ${fontSize === 'small' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center font-medium">
                {fontSize === 'small' ? 'Small' : fontSize === 'large' ? 'Large' : 'Medium'}
              </div>
              <button
                onClick={() => {
                  if (fontSize === 'small') setFontSize('medium');
                  else if (fontSize === 'medium') setFontSize('large');
                }}
                disabled={fontSize === 'large'}
                className={`p-2 rounded-lg transition-all ${fontSize === 'large' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Font Family</label>
            <div className="space-y-2">
              {[
                { value: 'serif' as const, label: 'Serif', sample: 'Aa' },
                { value: 'sans' as const, label: 'Sans-serif', sample: 'Aa' },
                { value: 'mono' as const, label: 'Monospace', sample: 'Aa' }
              ].map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFontFamily(font.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex justify-between items-center ${
                    fontFamily === font.value
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{font.label}</span>
                  <span className={`text-lg ${font.value === 'serif' ? 'font-serif' : font.value === 'sans' ? 'font-sans' : 'font-mono'}`}>
                    {font.sample}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Line Height</label>
            <div className="space-y-2">
              {[
                { value: 'normal' as const, label: 'Compact' },
                { value: 'relaxed' as const, label: 'Default' },
                { value: 'loose' as const, label: 'Spacious' }
              ].map((height) => (
                <button
                  key={height.value}
                  onClick={() => setLineHeight(height.value)}
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-all ${
                    lineHeight === height.value
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {height.label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Mode */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Focus Mode</label>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                focusMode
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              {focusMode ? 'Enabled' : 'Disabled'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Narrows content width for easier reading
            </p>
          </div>
        </div>
      </div>
      
      {/* Fixed Reading Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-900/20 backdrop-blur-sm z-50">
        <div 
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${readingProgress}%`,
            background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(236, 72, 153, 0.6), 0 0 60px rgba(245, 158, 11, 0.4)',
          }}
        >
          <div className="h-full bg-white opacity-30 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}