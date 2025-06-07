'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, RefreshCw, Book } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buildChapterUrl } from '@/lib/utils/slugify'

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
  const router = useRouter()
  const [existingStories, setExistingStories] = useState<ExistingStory[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleReadStory = (story: ExistingStory) => {
    // Navigate to the dedicated chapter URL
    if (!story.authorAddress) {
      console.error('No author address for story:', story)
      return
    }
    
    const chapterUrl = buildChapterUrl(story.authorAddress, story.title, story.id, 1)
    router.push(chapterUrl)
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