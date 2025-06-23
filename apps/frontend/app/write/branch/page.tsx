'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { ArrowLeft, BookOpen, Users, GitBranch, Upload, AlertCircle, Sparkles, Search, Filter, Clock, Star, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { apiClient } from '@/lib/api-client'
import Fuse from 'fuse.js'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

interface Story {
  id: string
  title: string
  genre: string
  chapters: number
  lastUpdated: string
  preview: string
  authorAddress: string
  authorName: string
  isRemixable: boolean
  totalReads?: number
  averageRating?: number
  contentRating?: string
  tags?: string[]
  coverUrl?: string
}

interface BranchingInfo {
  parentBook: {
    bookId: string
    title: string
    authorName: string
    totalChapters: number
    isRemixable: boolean
    genres: string[]
    contentRating: string
  }
  availableBranchPoints: Array<{
    chapterKey: string
    chapterNumber: number
    chapterPath: string
  }>
  existingDerivatives: number
  derivativeBooks: string[]
}

function BranchStoryPageContent() {
  const { address: connectedAddress, isConnected } = useAccount()
  const router = useRouter()
  const [allStories, setAllStories] = useState<Story[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [branchingInfo, setBranchingInfo] = useState<BranchingInfo | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [contentRating, setContentRating] = useState<'G' | 'PG' | 'PG-13' | 'R'>('PG')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent')
  const [showSuccess, setShowSuccess] = useState(false)

  const availableGenres = ['Fantasy', 'Romance', 'Mystery', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Adventure']
  const filterGenres = ['all', 'Fantasy', 'Romance', 'Mystery', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Adventure']

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load all published stories that allow remixing
  useEffect(() => {
    if (mounted) {
      const loadStories = async () => {
        setIsLoadingStories(true)
        
        try {
          const data = await apiClient.getStories()

          if (data.success && data.stories && Array.isArray(data.stories)) {
            // Filter to only remixable stories from other authors
            const remixableStories: Story[] = data.stories
              .filter((story: any) => 
                story.isRemixable && 
                story.authorAddress?.toLowerCase() !== connectedAddress?.toLowerCase()
              )
              .map((story: any) => ({
                id: story.id,
                title: story.title,
                genre: story.genre,
                chapters: story.chapters,
                lastUpdated: story.lastUpdated,
                preview: story.preview,
                authorAddress: story.authorAddress,
                authorName: story.authorName,
                isRemixable: story.isRemixable,
                totalReads: story.totalReads || 0,
                averageRating: story.averageRating || 0,
                contentRating: story.contentRating,
                tags: story.tags || [],
                coverUrl: story.coverUrl
              }))
            
            setAllStories(remixableStories)
          } else {
            setAllStories([])
          }
        } catch (error) {
          console.error('Error loading stories:', error)
          setAllStories([])
        } finally {
          setIsLoadingStories(false)
        }
      }

      loadStories()
    }
  }, [mounted, connectedAddress])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => new Fuse(allStories, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'authorName', weight: 0.3 },
      { name: 'genre', weight: 0.2 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2
  }), [allStories])

  // Filter and sort stories
  const filteredStories = useMemo(() => {
    let filtered = allStories

    // Apply fuzzy search if there's a search query
    if (searchQuery.trim()) {
      const results = fuse.search(searchQuery)
      filtered = results.map(result => result.item)
    }

    // Apply genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(story => story.genre === selectedGenre)
    }

    // Sort results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.totalReads || 0) - (a.totalReads || 0)
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0)
        case 'recent':
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      }
    })
  }, [allStories, searchQuery, selectedGenre, sortBy, fuse])

  const handleSelectStory = async (story: Story) => {
    setSelectedStory(story)
    setSelectedChapter(null)
    setBranchingInfo(null)
    setNewTitle(`${story.title} - Remix`)
    setNewDescription(`A new take on ${story.title}`)
    setSelectedGenres(story.genre ? [story.genre] : [])
    
    // Load branching information
    try {
      console.log('🔍 Loading branching info for story:', story.id)
      const data = await apiClient.getBranchingInfo(story.id)
      
      console.log('📊 Branching info response:', data)
      
      if (data.success) {
        console.log('✅ Available branch points:', data.availableBranchPoints)
        setBranchingInfo(data)
      } else {
        console.warn('⚠️ Branching info failed:', data.error)
      }
    } catch (error) {
      console.error('❌ Error loading branching info:', error)
    }
  }

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
    }
  }

  const handleCreateBranch = async () => {
    if (!selectedStory || !selectedChapter || !connectedAddress || !newTitle.trim()) return

    setIsCreatingBranch(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('parentBookId', selectedStory.id)
      formData.append('branchPoint', `ch${selectedChapter}`)
      formData.append('newTitle', newTitle)
      formData.append('newDescription', newDescription)
      formData.append('authorAddress', connectedAddress)
      formData.append('authorName', connectedAddress.slice(-4))
      formData.append('genres', JSON.stringify(selectedGenres))
      formData.append('contentRating', contentRating)
      
      if (coverFile) {
        formData.append('newCover', coverFile)
      }

      console.log('🌿 Branching book with data:', {
        parentBookId: selectedStory.id,
        branchPoint: `ch${selectedChapter}`,
        newTitle,
        nextChapterToWrite: (selectedChapter || 0) + 1
      })

      const result = await apiClient.branchBook(formData)
      console.log('📊 Branch API response:', result)

      if (result.success) {
        // Calculate next chapter number (branch point + 1)
        const nextChapterNumber = parseInt(selectedChapter?.toString() || '1') + 1
        
        console.log('✅ Branch successful! New book:', {
          bookId: result.book.bookId,
          coverUrl: result.book.coverUrl,
          inheritedChapters: Object.keys(result.book.chapterMap || {}),
          redirectingToChapter: nextChapterNumber
        })
        
        // Show success message briefly
        // Show success notification
        setShowSuccess(true)
        
        // Auto-redirect after a brief delay to show success
        setTimeout(() => {
          const redirectUrl = `/write/chapter?bookId=${encodeURIComponent(result.book.bookId)}&chapterNumber=${nextChapterNumber}`
          console.log('🚀 Redirecting to:', redirectUrl)
          router.push(redirectUrl)
        }, 2000)
      } else {
        setError(result.error || 'Failed to create branch')
      }
    } catch (error) {
      console.error('Error creating branch:', error)
      setError('Failed to create branch')
    } finally {
      setIsCreatingBranch(false)
    }
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
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                🌿 Branch & Remix Stories
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose a story to branch from and create your own unique continuation. 
                Revenue is automatically shared with original authors.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <GitBranch className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-green-800 font-medium">How Branching Works</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Pick any story and choose a chapter (3+) to continue from that point with your own twist. 
                    Chapters 1-2 are protected to preserve the original story setup. 
                    Revenue is shared between you and the original author(s) based on contribution.
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Connection Check */}
            {!isConnected ? (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-6">
                    To create branched stories, please connect your wallet for ownership verification.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Success Notification */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
                    >
                      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6" />
                        <div>
                          <h3 className="font-semibold">Branch Created Successfully!</h3>
                          <p className="text-sm opacity-90">Redirecting to write your first chapter...</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-medium">Branching Failed</h4>
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

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search books or authors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Genre Filter */}
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {filterGenres.map(genre => (
                        <option key={genre} value={genre}>
                          {genre === 'all' ? 'All Genres' : genre}
                        </option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="popular">Most Popular</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                </div>

                {/* Story Selection with Book Cards */}
                <div className="mb-6">

                  {isLoadingStories ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading remixable stories...</h3>
                    </div>
                  ) : filteredStories.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                      <div className="text-8xl mb-6">🌿</div>
                      <h3 className="text-2xl font-semibold text-gray-700 mb-4">No stories available for branching</h3>
                      <p className="text-gray-500 mb-8 text-lg">Stories must be marked as remixable by their authors.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredStories.map((story) => (
                        <motion.div
                          key={story.id}
                          onClick={() => handleSelectStory(story)}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 hover:shadow-xl transition-all cursor-pointer ${
                            selectedStory?.id === story.id
                              ? 'border-green-400 ring-2 ring-green-200'
                              : 'border-gray-200'
                          }`}
                        >
                          {/* Book Cover */}
                          <div className="aspect-[3/4] w-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center relative">
                            {story.coverUrl && (
                              <img
                                src={story.coverUrl}
                                alt={`${story.title} cover`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-white text-4xl font-bold">${story.title.charAt(0)}</span>`;
                                  }
                                }}
                              />
                            )}
                            {!story.coverUrl && (
                              <span className="text-white text-4xl font-bold">{story.title.charAt(0)}</span>
                            )}
                            {selectedStory?.id === story.id && (
                              <div className="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
                                <div className="bg-white rounded-full p-3">
                                  <GitBranch className="w-8 h-8 text-green-600" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="mb-3">
                              <h3 className="text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                                {story.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                <span className="text-gray-500">by</span> {story.authorName}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  {story.genre}
                                </span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{story.chapters} ch</span>
                                </div>
                                {story.totalReads > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{story.totalReads} reads</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {selectedStory?.id === story.id ? '✅ Selected' : 'Click to select'}
                              </span>
                              {story.averageRating > 0 && (
                                <div className="flex items-center gap-1 text-yellow-500">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span className="text-xs font-medium text-gray-700">{story.averageRating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chapter Selection */}
                {selectedStory && branchingInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-20 h-28 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center shadow-md flex-shrink-0">
                        {selectedStory.coverUrl ? (
                          <img
                            src={selectedStory.coverUrl}
                            alt={selectedStory.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">{selectedStory.title.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedStory.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {selectedStory.authorName}</p>
                        <p className="text-sm text-gray-500">{selectedStory.preview}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      📍 Choose your branching point:
                    </h3>
                    
                    {branchingInfo.availableBranchPoints && branchingInfo.availableBranchPoints.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {branchingInfo.availableBranchPoints.map((point) => (
                            <button
                              key={point.chapterKey}
                              onClick={() => setSelectedChapter(point.chapterNumber)}
                              className={`p-4 text-left rounded-lg border-2 transition-all ${
                                selectedChapter === point.chapterNumber
                                  ? 'border-green-400 bg-green-50 text-green-800'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-2xl">📝</div>
                                <div className="flex-1">
                                  <div className="font-semibold text-lg">Write Chapter {point.chapterNumber + 1}</div>
                                  <div className="text-sm opacity-75 mt-1">
                                    inherit chapters 1-{point.chapterNumber}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <p className="text-sm text-gray-600">
                          💡 Select which chapter you want to write. You'll inherit all previous chapters and continue the story from there.
                        </p>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-4">📖</div>
                        <h4 className="text-lg font-medium text-gray-700 mb-2">No branching points available</h4>
                        <p className="text-sm text-gray-500">
                          This story needs at least 3 chapters to allow branching. Chapters 1-2 are protected.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Branch Details */}
                {selectedStory && selectedChapter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ✨ Create your branched story (Writing Chapter {(selectedChapter || 0) + 1}):
                    </h3>

                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Title</label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Your story's new title..."
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Describe your unique take on this story..."
                        />
                      </div>

                      {/* Genres */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Genres</label>
                        <div className="flex flex-wrap gap-2">
                          {availableGenres.map((genre) => (
                            <button
                              key={genre}
                              onClick={() => handleGenreToggle(genre)}
                              className={`px-3 py-1 rounded-full border transition-all ${
                                selectedGenres.includes(genre)
                                  ? 'bg-green-100 border-green-400 text-green-800'
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Content Rating</label>
                        <div className="flex gap-2">
                          {(['G', 'PG', 'PG-13', 'R'] as const).map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setContentRating(rating)}
                              className={`px-4 py-2 rounded-lg border transition-all ${
                                contentRating === rating
                                  ? 'bg-green-100 border-green-400 text-green-800'
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cover Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Cover (Optional)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            onChange={handleCoverUpload}
                            accept="image/*"
                            className="hidden"
                            id="cover-upload"
                          />
                          <label
                            htmlFor="cover-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-all"
                          >
                            <Upload className="w-4 h-4" />
                            {coverFile ? coverFile.name : 'Choose Image'}
                          </label>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-gray-500">
                          Revenue will be shared with original author(s)
                        </div>
                        <button
                          onClick={handleCreateBranch}
                          disabled={!newTitle.trim() || isCreatingBranch}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                            newTitle.trim() && !isCreatingBranch
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          {isCreatingBranch ? 'Creating Branch...' : 'Create Branched Story'}
                        </button>
                      </div>
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

export default function BranchStoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>}>
      <BranchStoryPageContent />
    </Suspense>
  )
}