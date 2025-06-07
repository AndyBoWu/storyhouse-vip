'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Home, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface ChapterData {
  title: string
  content: string
  wordCount?: number
  readingTime?: number
  chapterNumber?: number
  storyTitle?: string
  authorName?: string
  authorAddress?: string
  genre?: string
}

interface StoryMetadata {
  id: string
  title: string
  chapters: number
  authorName?: string
  authorAddress?: string
  genre?: string
}

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const [chapterContent, setChapterContent] = useState<ChapterData | null>(null)
  const [storyMetadata, setStoryMetadata] = useState<StoryMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readingProgress, setReadingProgress] = useState(0)

  const walletAddress = params.walletAddress as string
  const storySlug = params.storySlug as string  
  const chapterNumber = params.chapterNumber as string
  const currentChapter = parseInt(chapterNumber)

  useEffect(() => {
    const loadChapterAndStory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, get the story metadata to find the actual story ID
        const storiesResponse = await fetch('/api/stories?cache=false')
        const storiesData = await storiesResponse.json()

        if (!storiesData.success || !storiesData.stories) {
          throw new Error('Failed to load stories')
        }

        // Find the story that matches our URL parameters
        const matchingStory = storiesData.stories.find((story: any) => {
          const slugifiedTitle = story.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50)
          
          const authorMatches = story.authorAddress?.toLowerCase() === walletAddress.toLowerCase()
          const slugMatches = slugifiedTitle === storySlug
          
          return authorMatches && slugMatches
        })

        if (!matchingStory) {
          throw new Error('Story not found')
        }

        setStoryMetadata({
          id: matchingStory.id,
          title: matchingStory.title,
          chapters: matchingStory.chapters,
          authorName: matchingStory.authorName,
          authorAddress: matchingStory.authorAddress,
          genre: matchingStory.genre
        })

        // Now fetch the chapter content using the story ID
        const chapterResponse = await fetch(`/api/chapters/${matchingStory.id}/${chapterNumber}`)
        
        if (!chapterResponse.ok) {
          throw new Error(`Failed to load chapter: ${chapterResponse.status}`)
        }

        const chapterResult = await chapterResponse.json()
        
        if (!chapterResult.success || !chapterResult.data) {
          throw new Error(chapterResult.error || 'Chapter content not available')
        }

        setChapterContent({
          ...chapterResult.data,
          storyTitle: matchingStory.title,
          authorName: matchingStory.authorName,
          authorAddress: matchingStory.authorAddress,
          genre: matchingStory.genre,
          chapterNumber: currentChapter
        })

      } catch (err) {
        console.error('Error loading chapter:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chapter')
      } finally {
        setIsLoading(false)
      }
    }

    loadChapterAndStory()
  }, [walletAddress, storySlug, chapterNumber])

  // Track reading progress
  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
        setReadingProgress(progress)
      }
    }

    // Update progress on scroll
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    
    // Initial progress calculation
    updateReadingProgress()

    return () => {
      window.removeEventListener('scroll', updateReadingProgress)
    }
  }, [chapterContent]) // Re-run when chapter content changes

  const handleNavigateChapter = (direction: 'prev' | 'next') => {
    if (!storyMetadata) return

    const newChapter = direction === 'prev' ? currentChapter - 1 : currentChapter + 1
    
    if (newChapter < 1 || newChapter > storyMetadata.chapters) return

    router.push(`/stories/${walletAddress}/${storySlug}/${newChapter}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chapter...</p>
        </div>
      </div>
    )
  }

  if (error || !chapterContent || !storyMetadata) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="mb-4">
            <p className="text-red-600 text-lg font-semibold mb-2">Chapter not found</p>
            <p className="text-gray-600 text-sm mb-4">
              {error || 'The requested chapter could not be loaded'}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/own">
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                My Stories
              </button>
            </Link>
            <Link href="/">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header with Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back navigation */}
            <div className="flex items-center gap-4">
              <Link href="/own" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-4 h-4" />
                My Stories
              </Link>
              <div className="text-gray-300">•</div>
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </div>
            
            {/* Center: Story info */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{storyMetadata.genre}</span>
              <span>•</span>
              <span>Chapter {currentChapter} of {storyMetadata.chapters}</span>
            </div>

            {/* Right: Chapter navigation */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleNavigateChapter('prev')}
                disabled={currentChapter <= 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleNavigateChapter('next')}
                disabled={currentChapter >= storyMetadata.chapters}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <span>Stories</span>
            <span>/</span>
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            <span>/</span>
            <span className="text-gray-700 font-medium">{storyMetadata.title}</span>
            <span>/</span>
            <span className="text-purple-600 font-medium">Chapter {currentChapter}</span>
          </div>
        </div>
      </header>

      {/* Chapter Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Chapter Header */}
          <header className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {chapterContent.title || storyMetadata.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span>by {chapterContent.authorName || 'Anonymous'}</span>
              <span>•</span>
              <span>{chapterContent.wordCount || 0} words</span>
              <span>•</span>
              <span>{chapterContent.readingTime || 0} min read</span>
            </div>
            
            {/* Chapter Navigation Pills */}
            <div className="flex items-center gap-2">
              {currentChapter > 1 && (
                <button 
                  onClick={() => handleNavigateChapter('prev')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  ← Chapter {currentChapter - 1}
                </button>
              )}
              <span className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                Chapter {currentChapter}
              </span>
              {currentChapter < storyMetadata.chapters && (
                <button 
                  onClick={() => handleNavigateChapter('next')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Chapter {currentChapter + 1} →
                </button>
              )}
            </div>
          </header>

          {/* Chapter Content */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
              {chapterContent.content}
            </div>
          </div>

          {/* Chapter Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Chapter {currentChapter} of {storyMetadata.chapters}
              </div>
              <div className="flex gap-3">
                {currentChapter > 1 && (
                  <button 
                    onClick={() => handleNavigateChapter('prev')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
                {currentChapter < storyMetadata.chapters && (
                  <button 
                    onClick={() => handleNavigateChapter('next')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </footer>
        </motion.article>
      </div>

      {/* Reading Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-900/20 backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 transition-all duration-500 ease-out relative"
            style={{ 
              width: `${readingProgress}%`,
              boxShadow: '0 0 8px rgba(139, 92, 246, 0.8), 0 0 16px rgba(139, 92, 246, 0.6), 0 0 24px rgba(139, 92, 246, 0.4), 0 0 32px rgba(139, 92, 246, 0.2)'
            }}
          >
            {/* Additional neon glow effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 opacity-60 blur-[1px]"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}