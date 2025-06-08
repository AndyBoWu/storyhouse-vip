'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, Book } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { buildChapterUrl } from '@/lib/utils/slugify'
import { apiClient } from '@/lib/api-client'
import dynamic from 'next/dynamic'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

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
  const { address: connectedAddress, isConnected } = useAccount()
  const [existingStories, setExistingStories] = useState<ExistingStory[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering wallet-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  console.log('🔍 MyStoriesPage render:', {
    connectedAddress,
    isConnected,
    existingStoriesCount: existingStories.length,
    isLoadingStories,
    isRefreshing,
    firstStoryTitle: existingStories[0]?.title || 'No stories'
  })

  // Load published stories from R2
  useEffect(() => {
    console.log('🚀 useEffect triggered - about to load stories')
    const loadStories = async () => {
      console.log('🔄 Loading stories from API...')
      console.log('🔗 Wallet connected:', isConnected, 'Address:', connectedAddress)
      setIsLoadingStories(true)
      
      try {
        // Use API client instead of direct fetch for proper routing
        console.log('📡 Calling apiClient.getStories()...')
        const data = await apiClient.getStories()
        console.log('📊 API Response data:', data)

        if (data.success && data.stories && Array.isArray(data.stories)) {
          console.log('✅ Stories loaded from API:', data.stories.length, 'stories')
          console.log('📖 Stories:', data.stories.map((s: any) => s.title))
          
          // Filter stories by connected wallet address
          const filteredStories = connectedAddress 
            ? data.stories.filter((story: any) => 
                story.authorAddress?.toLowerCase() === connectedAddress.toLowerCase()
              )
            : [] // If no wallet connected, show no stories
          
          console.log('🔒 Filtered stories for wallet', connectedAddress, ':', filteredStories.length, 'stories')
          
          // Convert R2 story format to ExistingStory format
          const convertedStories: ExistingStory[] = filteredStories.map((story: any) => ({
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
          
          console.log('🔄 Setting stories state with:', convertedStories.length, 'stories')
          setExistingStories(convertedStories)
        } else {
          console.warn('❌ Invalid API response:', data)
          setExistingStories([])
        }
      } catch (error) {
        console.error('❌ Error loading stories:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        
        // For testing: Show a demo story when API fails and wallet is connected
        if (connectedAddress) {
          console.log('🔧 API failed - showing demo story for connected wallet')
          const demoStory: ExistingStory = {
            id: 'demo-story-test',
            title: 'The Portal\'s Secret (Demo)',
            genre: 'Mystery',
            chapters: 4,
            lastUpdated: '2025-06-07',
            earnings: 0,
            preview: 'A mysterious portal appears in the old library, leading to worlds unknown. [This is a demo story shown when the backend API is unavailable]',
            authorAddress: connectedAddress,
            authorName: 'You',
            contentRating: 'PG',
            unlockPrice: 0.1,
            readReward: 0.05,
            licensePrice: 100,
            isRemixable: true,
            totalReads: 0,
            averageRating: 0,
            wordCount: 2500,
            readingTime: 10,
            mood: 'mysterious',
            tags: ['portal', 'mystery', 'demo'],
            qualityScore: 100,
            originalityScore: 80,
            isRemix: false,
            generationMethod: 'Demo'
          }
          setExistingStories([demoStory])
        } else {
          setExistingStories([])
        }
      } finally {
        setIsLoadingStories(false)
      }
    }

    loadStories()
  }, [connectedAddress]) // Reload when wallet connection changes

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    setIsRefreshing(true)
    try {
      // Use API client for manual refresh too
      const data = await apiClient.getStories()

      if (data.success && data.stories && Array.isArray(data.stories)) {
        console.log('✅ Manual refresh loaded:', data.stories.length, 'stories')
        
        // Filter stories by connected wallet address
        const filteredStories = connectedAddress 
          ? data.stories.filter((story: any) => 
              story.authorAddress?.toLowerCase() === connectedAddress.toLowerCase()
            )
          : [] // If no wallet connected, show no stories
        
        console.log('🔒 Manual refresh filtered stories for wallet', connectedAddress, ':', filteredStories.length, 'stories')
        
        const convertedStories: ExistingStory[] = filteredStories.map((story: any) => ({
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
        console.warn('❌ Manual refresh failed:', data)
      }
    } catch (error) {
      console.error('❌ Error during manual refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleReadStory = (story: ExistingStory) => {
    // Navigate to the table of contents page
    if (!story.authorAddress) {
      console.error('No author address for story:', story)
      return
    }
    
    // Create slug from title
    const storySlug = story.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    const tocUrl = `/stories/${story.authorAddress}/${storySlug}/toc`
    router.push(tocUrl)
  }

  const handleContinueStory = (story: ExistingStory) => {
    // Navigate to write page with story context to continue with next chapter
    const nextChapter = story.chapters + 1
    const continueUrl = `/write?continueStory=${encodeURIComponent(story.id)}&nextChapter=${nextChapter}&title=${encodeURIComponent(story.title)}&genre=${encodeURIComponent(story.genre)}`
    router.push(continueUrl)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div></div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              👑 My Stories
            </h1>
          </div>

          {/* Wallet Connection Check - only render after mount to prevent hydration mismatch */}
          {!mounted ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h3>
                <p className="text-gray-600 mb-6">
                  Initializing wallet connection
                </p>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">
                  To view your stories, please connect your wallet using the "Connect" button in the top navigation.
                </p>
                <p className="text-sm text-gray-500">
                  Your stories are linked to your wallet address for ownership verification.
                </p>
              </div>
            </div>
          ) : (
            <>
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
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-lg">
                    <Sparkles className="w-5 h-5" />
                    Create Your First Story
                  </button>
                </Link>
              </div>
            ) : (
              existingStories.map((story) => (
                <div
                  key={story.id}
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
                    <button 
                      onClick={() => handleContinueStory(story)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                    >
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
                </div>
              ))
            )}
          </div>

              </>
            )}

          {/* Quick Actions (always show) */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/write">
                <button className="w-full p-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-semibold">New Story</div>
                  <div className="text-sm opacity-75">Start fresh with AI</div>
                </button>
              </Link>
              
              <Link href="/read">
                <button className="w-full p-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <div className="text-2xl mb-2">🌟</div>
                  <div className="font-semibold">Browse Stories</div>
                  <div className="text-sm opacity-75">Discover others' work</div>
                </button>
              </Link>

              <button
                className="w-full p-4 border-2 border-dashed border-green-300 rounded-xl text-green-600 hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">Analytics</div>
                <div className="text-sm opacity-75">View earnings & stats</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}