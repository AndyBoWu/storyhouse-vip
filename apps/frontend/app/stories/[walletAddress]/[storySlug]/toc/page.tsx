'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Book, Clock, Lock, Unlock, Sparkles } from 'lucide-react'
import { buildChapterUrl } from '@/lib/utils/slugify'

interface ChapterMetadata {
  chapterNumber: number
  title: string
  summary: string
  wordCount: number
  readingTime: number
  unlockPrice: number
  readReward: number
  totalReads: number
  isUnlocked?: boolean
  createdAt: string
  genre?: string
  mood?: string
  contentRating?: string
}

interface StoryMetadata {
  id: string
  title: string
  authorName: string
  authorAddress: string
  genre: string
  totalChapters: number
  totalWords: number
  totalReadingTime: number
  averageRating?: number
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export default function TableOfContentsPage() {
  const params = useParams()
  const router = useRouter()
  const walletAddress = params.walletAddress as string
  const storySlug = params.storySlug as string
  
  const [storyMetadata, setStoryMetadata] = useState<StoryMetadata | null>(null)
  const [chapters, setChapters] = useState<ChapterMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStoryData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch story metadata and chapters
        const response = await fetch(`/api/stories/${walletAddress}/${storySlug}/chapters`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch story data')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setStoryMetadata(data.story)
          setChapters(data.chapters)
        } else {
          throw new Error(data.error || 'Failed to load story')
        }
      } catch (err) {
        console.error('Error loading story:', err)
        setError(err instanceof Error ? err.message : 'Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoryData()
  }, [walletAddress, storySlug])

  const handleChapterClick = (chapterNumber: number) => {
    const chapterUrl = buildChapterUrl(walletAddress, storyMetadata?.title || '', storyMetadata?.id || storySlug, chapterNumber)
    router.push(chapterUrl)
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min'
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading story...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Story Not Found</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/read">
                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
                  Browse Other Stories
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Link href="/own" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            Back to My Stories
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Story Header */}
          {storyMetadata && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{storyMetadata.title}</h1>
              <p className="text-lg text-gray-600 mb-4">by {storyMetadata.authorName}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {storyMetadata.genre}
                </span>
                <span className="text-gray-600 flex items-center gap-1">
                  <Book className="w-4 h-4" />
                  {storyMetadata.totalChapters} chapters
                </span>
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatReadingTime(storyMetadata.totalReadingTime)}
                </span>
              </div>

              {storyMetadata.description && (
                <p className="text-gray-700 leading-relaxed">{storyMetadata.description}</p>
              )}
            </div>
          )}

          {/* Chapters List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Chapters</h2>
            
            {chapters.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-600">No chapters published yet.</p>
              </div>
            ) : (
              chapters.map((chapter) => {
                const isFreeChapter = chapter.chapterNumber <= 3
                return (
                  <div
                    key={chapter.chapterNumber}
                    onClick={() => handleChapterClick(chapter.chapterNumber)}
                    className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border ${
                      isFreeChapter 
                        ? 'border-green-100' 
                        : 'border-gray-200'
                    }`}
                    style={isFreeChapter ? { backgroundColor: '#fafffe' } : {}}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-purple-600">
                            Chapter {chapter.chapterNumber}
                          </span>
                          {isFreeChapter ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              FREE
                            </span>
                          ) : chapter.isUnlocked ? (
                            <Unlock className="w-4 h-4 text-green-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {chapter.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {chapter.summary}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatReadingTime(chapter.readingTime)}
                          </span>
                          <span>{chapter.wordCount.toLocaleString()} words</span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            {chapter.readReward} $TIP reward
                          </span>
                          <span>{chapter.totalReads} reads</span>
                        </div>
                      </div>
                      
                      {!isFreeChapter && (
                        <div className="ml-4 text-right">
                          <div className="text-lg font-semibold text-gray-800 mb-1">
                            {chapter.unlockPrice} $TIP
                          </div>
                          <span className="text-sm text-gray-500">to unlock</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Back to Reading */}
          <div className="mt-8 text-center">
            <Link href="/read">
              <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all">
                Browse More Stories
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}