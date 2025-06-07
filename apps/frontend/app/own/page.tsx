'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, RefreshCw, Book, X } from 'lucide-react'
import Link from 'next/link'

interface ExistingStory {
  id: string
  title: string
  genre: string
  chapters: number
  lastUpdated: string
  earnings: number
  preview: string
  authorAddress?: string
  authorName?: string
  // Enhanced metadata
  contentRating?: string
  unlockPrice?: number
  readReward?: number
  licensePrice?: number
  isRemixable?: boolean
  totalReads?: number
  averageRating?: number
  wordCount?: number
  readingTime?: number
  mood?: string
  tags?: string[]
  qualityScore?: number
  originalityScore?: number
  isRemix?: boolean
  generationMethod?: string
}

export default function MyStoriesPage() {
  const [existingStories, setExistingStories] = useState<ExistingStory[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedStory, setSelectedStory] = useState<ExistingStory | null>(null)
  const [chapterContent, setChapterContent] = useState<any>(null)
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)

  // Load published stories from R2
  useEffect(() => {
    const loadStoriesFromR2 = async (showLoading = true) => {
      if (showLoading) {
        setIsLoadingStories(true)
      }
      try {
        const response = await fetch('/api/stories?cache=false&t=' + Date.now())
        const data = await response.json()

        if (data.success && data.stories) {
          // Convert R2 story format to ExistingStory format
          const convertedStories: ExistingStory[] = data.stories.map((story: any) => ({
            id: story.id,
            title: story.title,
            genre: story.genre,
            chapters: story.chapters,
            lastUpdated: story.lastUpdated,
            earnings: story.earnings,
            preview: story.preview,
            authorAddress: story.authorAddress,
            authorName: story.authorName,
            // Enhanced metadata
            contentRating: story.contentRating,
            unlockPrice: story.unlockPrice,
            readReward: story.readReward,
            licensePrice: story.licensePrice,
            isRemixable: story.isRemixable,
            totalReads: story.totalReads,
            averageRating: story.averageRating,
            wordCount: story.wordCount,
            readingTime: story.readingTime,
            mood: story.mood,
            tags: story.tags,
            qualityScore: story.qualityScore,
            originalityScore: story.originalityScore,
            isRemix: story.isRemix,
            generationMethod: story.generationMethod
          }))
          setExistingStories(convertedStories)
        } else {
          console.warn('Failed to load stories from R2:', data.error)
          if (showLoading) {
            setExistingStories([])
          }
        }
      } catch (error) {
        console.error('Error loading stories from R2:', error)
        if (showLoading) {
          setExistingStories([])
        }
      } finally {
        if (showLoading) {
          setIsLoadingStories(false)
        }
      }
    }

    // Initial load with loading state
    loadStoriesFromR2(true)

    // Background refresh without loading state - more frequent for new stories
    const interval = setInterval(() => loadStoriesFromR2(false), 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/stories?cache=false&t=' + Date.now())
      const data = await response.json()

      if (data.success && data.stories) {
        const convertedStories: ExistingStory[] = data.stories.map((story: any) => ({
          id: story.id,
          title: story.title,
          genre: story.genre,
          chapters: story.chapters,
          lastUpdated: story.lastUpdated,
          earnings: story.earnings,
          preview: story.preview,
          authorAddress: story.authorAddress,
          authorName: story.authorName,
          // Enhanced metadata
          contentRating: story.contentRating,
          unlockPrice: story.unlockPrice,
          readReward: story.readReward,
          licensePrice: story.licensePrice,
          isRemixable: story.isRemixable,
          totalReads: story.totalReads,
          averageRating: story.averageRating,
          wordCount: story.wordCount,
          readingTime: story.readingTime,
          mood: story.mood,
          tags: story.tags,
          qualityScore: story.qualityScore,
          originalityScore: story.originalityScore,
          isRemix: story.isRemix,
          generationMethod: story.generationMethod
        }))
        setExistingStories(convertedStories)
      }
    } catch (error) {
      console.error('Error refreshing stories:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleReadStory = async (story: ExistingStory) => {
    setSelectedStory(story)
    setIsLoadingChapter(true)
    
    try {
      console.log('📚 Fetching chapter via API for story:', story.id)
      
      // Use our API route to fetch chapter content (avoids CORS issues)
      const response = await fetch(`/api/chapters/${story.id}/1`)
      
      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📚 API Response:', result)
      
      if (result.success && result.data) {
        setChapterContent(result.data)
      } else {
        throw new Error(result.error || 'Failed to load chapter from API')
      }
    } catch (error) {
      console.error('❌ Error loading chapter:', error)
      console.error('📊 Story object:', story)
      setChapterContent({ error: 'Failed to load chapter content', details: error.message })
    } finally {
      setIsLoadingChapter(false)
    }
  }

  const handleCloseReader = () => {
    setSelectedStory(null)
    setChapterContent(null)
  }

  // If a story is selected for reading, show the reader interface
  if (selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
        {/* Reader Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleCloseReader}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Stories
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {selectedStory.genre} • Chapter 1
                </div>
                <button 
                  onClick={handleCloseReader}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Reader Content */}
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {isLoadingChapter ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chapter...</p>
            </div>
          ) : chapterContent ? (
            <motion.article 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              {/* Chapter Header */}
              <header className="mb-8 border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {chapterContent.title || selectedStory.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>by {selectedStory.authorName || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{chapterContent.wordCount || 0} words</span>
                  <span>•</span>
                  <span>{chapterContent.readingTime || 0} min read</span>
                </div>
              </header>

              {/* Chapter Content */}
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {chapterContent.content}
                </div>
              </div>

              {/* Chapter Footer */}
              <footer className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Chapter 1 of {selectedStory.chapters}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleCloseReader}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedStory.chapters > 1 && (
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Next Chapter
                      </button>
                    )}
                  </div>
                </div>
              </footer>
            </motion.article>
          ) : chapterContent?.error ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg p-8">
              <div className="mb-4">
                <p className="text-red-600 text-lg font-semibold mb-2">Failed to load chapter content</p>
                <p className="text-gray-600 text-sm mb-4">
                  {chapterContent.details || 'Unknown error occurred'}
                </p>
                <div className="text-left bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-xs text-gray-500 mb-2">Debug Info:</p>
                  <p className="text-xs text-gray-700 break-all">URL: {selectedStory.contentUrl}</p>
                  <p className="text-xs text-gray-700">Story ID: {selectedStory.id}</p>
                </div>
              </div>
              <button 
                onClick={handleCloseReader}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Stories
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-red-600">No chapter content available</p>
              <button 
                onClick={handleCloseReader}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Stories
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              Back to StoryHouse
            </Link>
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Stories'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/write" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              👑 My Stories
            </h1>
          </div>

          {/* Stories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {isLoadingStories ? (
              <div className="col-span-full text-center py-12">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your stories...</h3>
                <p className="text-gray-500">Fetching published stories from R2 storage</p>
              </div>
            ) : existingStories.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="text-8xl mb-6">📚</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">No stories yet!</h3>
                <p className="text-gray-500 mb-8 text-lg">Start creating your first story to see it here.</p>
                <Link href="/write">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    Create Your First Story
                  </motion.button>
                </Link>
              </div>
            ) : (
              existingStories.map((story) => (
                <motion.div
                  key={story.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{story.title}</h3>
                      {story.authorName && (
                        <p className="text-sm text-gray-500 mb-3">by {story.authorName}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {story.genre}
                        </span>
                        <span>•</span>
                        <span>{story.chapters} chapters</span>
                      </div>
                      <p className="text-sm text-gray-500">Last updated {story.lastUpdated}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                        💰 {story.earnings} $TIP
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 italic line-clamp-3">"{story.preview}"</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2">
                      ✨ Continue
                    </button>
                    <button 
                      onClick={() => handleReadStory(story)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                      <Book className="w-4 h-4" />
                      Read
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/write">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-semibold">New Story</div>
                  <div className="text-sm opacity-75">Start fresh with AI</div>
                </motion.button>
              </Link>
              
              <Link href="/read">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="text-2xl mb-2">🌟</div>
                  <div className="font-semibold">Browse Stories</div>
                  <div className="text-sm opacity-75">Discover others' work</div>
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full p-4 border-2 border-dashed border-green-300 rounded-xl text-green-600 hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">Analytics</div>
                <div className="text-sm opacity-75">View earnings & stats</div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}