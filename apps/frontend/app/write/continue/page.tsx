'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Sparkles, Wand2, AlertCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { apiClient, getApiBaseUrl } from '@/lib/api-client'

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

function ContinueStoryPageContent() {
  const { address: connectedAddress, isConnected } = useAccount()
  const router = useRouter()
  const [existingStories, setExistingStories] = useState<ExistingStory[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [selectedStory, setSelectedStory] = useState<ExistingStory | null>(null)
  const [chapterNumber, setChapterNumber] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering wallet-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load published stories from R2
  useEffect(() => {
    if (isConnected && connectedAddress) {
      const loadStories = async () => {
        setIsLoadingStories(true)
        
        try {
          const data = await apiClient.getStories()

          if (data.success && data.books && Array.isArray(data.books)) {
            // Filter books by connected wallet address
            const filteredStories = data.books.filter((book: any) => 
              book.author?.toLowerCase() === connectedAddress.toLowerCase()
            )
            
            // Convert book format to ExistingStory format
            const convertedStories: ExistingStory[] = filteredStories.map((book: any) => ({
              id: book.id,
              title: book.title,
              genre: book.genres?.[0] || 'Unknown', // Use first genre from array
              chapters: book.chapters,
              lastUpdated: new Date(book.createdAt).toLocaleDateString(), // Format creation date
              earnings: 0, // Not available in book data
              preview: book.description || 'No description available',
              authorAddress: book.author,
              authorName: book.authorName,
              // Enhanced metadata (not available in current book data)
              contentRating: undefined,
              unlockPrice: undefined,
              readReward: undefined,
              licensePrice: undefined,
              isRemixable: undefined,
              totalReads: undefined,
              averageRating: undefined,
              wordCount: undefined,
              readingTime: undefined,
              mood: book.moods?.[0],
              tags: book.genres, // Use genres as tags
              qualityScore: undefined,
              originalityScore: undefined,
              isRemix: undefined,
              generationMethod: undefined
            }))
            
            setExistingStories(convertedStories)
          } else {
            setExistingStories([])
          }
        } catch (error) {
          console.error('Error loading stories:', error)
          setExistingStories([])
        } finally {
          setIsLoadingStories(false)
        }
      }

      loadStories()
    }
  }, [isConnected, connectedAddress])

  const handleSelectStory = (story: ExistingStory) => {
    setSelectedStory(story)
    setChapterNumber(story.chapters + 1)
  }

  const handleContinueStory = async () => {
    if (!selectedStory) return

    // Redirect to chapter writing page to continue with next chapter
    const nextChapter = selectedStory.chapters + 1
    const continueUrl = `/write/chapter?bookId=${encodeURIComponent(selectedStory.id)}&chapterNumber=${nextChapter}&title=${encodeURIComponent(selectedStory.title)}&genre=${encodeURIComponent(selectedStory.genre)}`
    router.push(continueUrl)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/write" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Write Options</span>
            </Link>

            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">➕ Continue Your Story</h2>
            </div>

            {/* Wallet Connection Check */}
            {!isConnected ? (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-6">
                    To continue your stories, please connect your wallet using the "Connect" button in the top navigation.
                  </p>
                  <p className="text-sm text-gray-500">
                    Your stories are linked to your wallet address for ownership verification.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-medium">Continue Failed</h4>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-600 text-sm underline mt-2 hover:text-red-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Story Selection */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Select story to continue:</h3>

                  {isLoadingStories ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your stories...</h3>
                      <p className="text-gray-500">Fetching published stories from storage</p>
                    </div>
                  ) : existingStories.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-8xl mb-6">📚</div>
                      <h3 className="text-2xl font-semibold text-gray-700 mb-4">No stories to continue!</h3>
                      <p className="text-gray-500 mb-4 text-lg">Create your first story to see it here.</p>
                      <p className="text-sm text-gray-400 mb-8">
                        💡 Tip: Books need at least 3 chapters before you can continue or remix them from chapter 4.
                      </p>
                      <Link href="/write/new">
                        <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-lg">
                          <Sparkles className="w-5 h-5" />
                          Create Your First Story
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                      {existingStories.map((story) => (
                        <motion.div
                          key={story.id}
                          whileHover={story.chapters >= 3 ? { scale: 1.02, y: -5 } : {}}
                          onClick={() => story.chapters >= 3 && handleSelectStory(story)}
                          className={`bg-white rounded-lg shadow-lg overflow-hidden border hover:shadow-xl transition-all w-full max-w-xs mx-auto ${
                            story.chapters >= 3 ? 'cursor-pointer' : 'opacity-75'
                          } ${
                            selectedStory?.id === story.id
                              ? 'border-purple-400 ring-2 ring-purple-200'
                              : 'border-gray-200'
                          }`}
                        >
                          {/* Book Cover */}
                          <div className="aspect-[3/4] w-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center relative">
                            {story.id && story.id.includes('/') ? (
                              <img 
                                src={`${getApiBaseUrl()}/api/books/${encodeURIComponent(story.id)}/cover`}
                                alt={`${story.title} cover`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className="hidden w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">{story.title.charAt(0)}</span>
                            </div>
                            
                            {/* Selection Indicator */}
                            {selectedStory?.id === story.id && (
                              <div className="absolute top-2 right-2 bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center">
                                <span className="text-sm">✓</span>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="mb-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-base font-semibold text-gray-800 line-clamp-2 flex-1">
                                  {story.title}
                                </h3>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  {story.genre}
                                </span>
                                <span>•</span>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <span className="mr-1">⏱️</span>
                                  <span>{story.chapters} chapters</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {story.chapters >= 3 ? (
                                <button 
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    selectedStory?.id === story.id
                                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectStory(story);
                                  }}
                                >
                                  {selectedStory?.id === story.id ? '✅ Selected' : '✍️ Continue Writing'}
                                </button>
                              ) : (
                                story.chapters === 0 ? (
                                  <Link 
                                    href={`/write/chapter?bookId=${encodeURIComponent(story.id)}&chapterNumber=1&title=${encodeURIComponent(story.title)}&genre=${encodeURIComponent(story.genre)}`}
                                    className="flex-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all">
                                      📝 Write First Chapter
                                    </button>
                                  </Link>
                                ) : (
                                  <div className="flex-1 px-3 py-2 rounded-lg text-xs text-center bg-gray-100 text-gray-500">
                                    📝 Need {3 - story.chapters} more chapter{3 - story.chapters !== 1 ? 's' : ''} to continue
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Continue Writing Interface */}
                {selectedStory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ✨ Ready to write Chapter {chapterNumber} of "{selectedStory.title}"?
                    </h3>

                    <p className="text-gray-600 mb-6">
                      Continue your story from where you left off. The last chapter ended with: "{selectedStory.preview}"
                    </p>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleContinueStory}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <Wand2 className="w-4 h-4" />
                        Write Chapter {chapterNumber}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function ContinueStoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>}>
      <ContinueStoryPageContent />
    </Suspense>
  )
}