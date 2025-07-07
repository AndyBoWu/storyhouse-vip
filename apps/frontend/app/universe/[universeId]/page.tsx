'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Clock } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { ensureAbsoluteUrl } from '@/lib/utils/url'

interface PublicStory {
  id: string
  title: string
  author: string
  genre: string
  chapters: number
  lastUpdated: string
  totalReads: number
  rating: number
  preview: string
  coverUrl?: string
  tags: string[]
  authorAddress?: string
  parentBookId?: string
  isDerivative?: boolean
}

interface StoryUniverse {
  id: string
  originalBook: PublicStory
  derivatives: PublicStory[]
  totalPaths: number
  totalChapters: number
  avgRating: number
  combinedReads: number
}

export default function UniversePage() {
  const params = useParams()
  const universeId = decodeURIComponent(params.universeId as string)
  
  const [universe, setUniverse] = useState<StoryUniverse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state for scalable remixes
  const [showAllRemixes, setShowAllRemixes] = useState(false)
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'rating' | 'chapters' | 'recent'>('rating')
  const [filterBy, setFilterBy] = useState<'all' | 'complete' | 'ongoing'>('all')

  useEffect(() => {
    const loadUniverse = async () => {
      setIsLoading(true)
      try {
        // Load all books to reconstruct the universe
        const data = await apiClient.getBooks()

        if (data.success && data.books) {
          // Convert to PublicStory format
          const publicStories: PublicStory[] = data.books.map((book: any) => ({
            id: book.id,
            title: book.title,
            author: book.authorName || book.author?.slice(0, 6) + '...' + book.author?.slice(-4) || 'Unknown',
            authorAddress: book.author,
            genre: book.genres?.[0] || 'Story',
            chapters: book.chapters || 0,
            lastUpdated: book.createdAt,
            totalReads: book.totalReads || 0,
            rating: book.rating || 0,
            preview: book.description || 'No description available.',
            coverUrl: book.coverUrl,
            tags: book.genres?.map((g: string) => g.toLowerCase()) || [],
            parentBookId: book.parentBookId,
            isDerivative: !!book.parentBookId
          }))

          // Find the original book and its derivatives
          const originalBook = publicStories.find(book => book.id === universeId && !book.isDerivative)
          
          if (!originalBook) {
            setError('Universe not found')
            return
          }

          const derivatives = publicStories.filter(book => 
            book.parentBookId === universeId && book.isDerivative
          )

          const allBooks = [originalBook, ...derivatives]
          const totalRating = allBooks.filter(b => b.rating > 0).reduce((sum, b) => sum + b.rating, 0)
          const ratedBooks = allBooks.filter(b => b.rating > 0).length

          const universeData: StoryUniverse = {
            id: universeId,
            originalBook,
            derivatives,
            totalPaths: 1 + derivatives.length,
            totalChapters: Math.max(...allBooks.map(b => b.chapters)),
            avgRating: ratedBooks > 0 ? totalRating / ratedBooks : 0,
            combinedReads: allBooks.reduce((sum, b) => sum + b.totalReads, 0)
          }

          setUniverse(universeData)
        }
      } catch (error) {
        console.error('Error loading universe:', error)
        setError('Failed to load universe')
      } finally {
        setIsLoading(false)
      }
    }

    if (universeId) {
      loadUniverse()
    }
  }, [universeId])

  // Sort and filter remixes
  const getSortedAndFilteredRemixes = () => {
    if (!universe) return []
    
    let filtered = universe.derivatives
    
    // Apply status filter
    if (filterBy === 'complete') {
      filtered = filtered.filter(d => d.chapters >= 7) // Assuming 7+ chapters = complete
    } else if (filterBy === 'ongoing') {
      filtered = filtered.filter(d => d.chapters < 7)
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'chapters':
          return b.chapters - a.chapters
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        default:
          return 0
      }
    })
    
    return sorted
  }

  const sortedRemixes = getSortedAndFilteredRemixes()
  const featuredRemixes = sortedRemixes.slice(0, 3) // Show top 3
  const remainingRemixes = sortedRemixes.slice(3)

  const toggleComparison = (storyId: string) => {
    const newSelected = new Set(selectedForComparison)
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId)
    } else {
      newSelected.add(storyId)
    }
    setSelectedForComparison(newSelected)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading universe...</h3>
          <p className="text-gray-500">Discovering all story paths</p>
        </div>
      </div>
    )
  }

  if (error || !universe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">🌌</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Universe not found</h3>
          <p className="text-gray-500 mb-8">{error || 'The requested story universe could not be found.'}</p>
          <Link href="/read" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            ← Back to Discovery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/read" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Discovery
            </Link>
            <div className="text-sm text-gray-500">
              Explore all story paths in this universe
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Universe Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{universe.originalBook.title}</h1>
            <p className="text-gray-600 mb-4">{universe.originalBook.preview}</p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-6">
              <span className="flex items-center gap-1">
                📖 <strong>{universe.totalPaths}</strong> story paths
              </span>
              <span className="flex items-center gap-1">
                👥 <strong>{1 + universe.derivatives.length}</strong> authors
              </span>
              <span className="flex items-center gap-1">
                📚 <strong>{universe.totalChapters}</strong> chapters
              </span>
              {universe.avgRating > 0 && (
                <span className="flex items-center gap-1">
                  ⭐ <strong>{universe.avgRating.toFixed(1)}</strong> avg rating
                </span>
              )}
            </div>
            
            {/* Shared Foundation Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <span className="text-lg">🤝</span>
                <span className="font-medium">All paths share the opening chapters</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Experience the same beginning, then explore different directions
              </div>
            </div>
          </div>
        </div>

        {/* Story Paths - Hybrid Approach */}
        <div className="space-y-8">
          {/* 1. Prominent Original Book */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">👑</span>
              Original Story
            </h2>
            <Link href={`/book/${universe.originalBook.id}`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-300 transition-all cursor-pointer max-w-2xl"
              >
                <div className="flex items-start gap-6 mb-4">
                  <div className="w-20 h-24 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                    {universe.originalBook.title.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        👑 Original Story
                      </span>
                      {universe.originalBook.rating > 0 && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          ⭐ {universe.originalBook.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{universe.originalBook.title}</h3>
                    <p className="text-gray-600 mb-3">by {universe.originalBook.author}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{universe.originalBook.preview}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-bold text-gray-900 text-lg">{universe.originalBook.chapters}</div>
                    <div className="text-gray-600">Chapters</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-bold text-green-600 text-lg">Complete ✓</div>
                    <div className="text-gray-600">Status</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-bold text-blue-600 text-lg">{universe.originalBook.genre}</div>
                    <div className="text-gray-600">Genre</div>
                  </div>
                </div>

                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg">
                  📖 Read Original Story
                </button>
              </motion.div>
            </Link>
          </div>

          {/* 2. Top Remixes (if any exist) */}
          {universe.derivatives.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  {universe.derivatives.length === 1 ? 'Remix' : 
                   universe.derivatives.length <= 3 ? 'Remixes' : 'Top Remixes'}
                </h2>
                
                {/* Sorting and Filtering Controls */}
                {universe.derivatives.length > 1 && (
                  <div className="flex items-center gap-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="rating">By Rating</option>
                      <option value="chapters">By Length</option>
                      <option value="recent">Most Recent</option>
                    </select>
                    
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="complete">Complete</option>
                      <option value="ongoing">Ongoing</option>
                    </select>
                    
                    {selectedForComparison.size > 0 && (
                      <button
                        onClick={() => {/* TODO: Show comparison */}}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium"
                      >
                        Compare ({selectedForComparison.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Featured Remixes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {featuredRemixes.map((derivative) => (
                  <div key={derivative.id} className="relative">
                    <Link href={`/book/${derivative.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                            {derivative.title.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                ✨ Remix
                              </span>
                              {derivative.rating > 0 && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  ⭐ {derivative.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{derivative.title}</h4>
                            <p className="text-xs text-gray-600">by {derivative.author}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-gray-900">{derivative.chapters}+</div>
                            <div className="text-gray-600">Chapters</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-orange-600">Ongoing</div>
                            <div className="text-gray-600">Status</div>
                          </div>
                        </div>

                        <button className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
                          📖 Read Remix
                        </button>
                      </motion.div>
                    </Link>
                    
                    {/* Comparison Checkbox */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleComparison(derivative.id)
                      }}
                      className={`absolute top-2 right-2 w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedForComparison.has(derivative.id)
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-white border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {selectedForComparison.has(derivative.id) && <span className="text-xs">✓</span>}
                    </button>
                  </div>
                ))}
              </div>

              {/* 3. "View All X Remixes" Expandable Section */}
              {remainingRemixes.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowAllRemixes(!showAllRemixes)}
                    className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{showAllRemixes ? '▼' : '▶'}</span>
                    <span className="font-medium">
                      {showAllRemixes ? 'Hide' : 'View all'} {remainingRemixes.length} more remixes
                    </span>
                  </button>

                  {showAllRemixes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {remainingRemixes.map((derivative) => (
                        <div key={derivative.id} className="relative">
                          <Link href={`/book/${derivative.id}`}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-all cursor-pointer"
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-14 bg-gradient-to-br from-gray-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold">
                                  {derivative.title.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                      ✨ Remix
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{derivative.title}</h4>
                                  <p className="text-xs text-gray-600">by {derivative.author}</p>
                                </div>
                              </div>
                              
                              <div className="text-center p-2 bg-white rounded mb-3">
                                <div className="font-bold text-gray-900 text-sm">{derivative.chapters}+ chapters</div>
                              </div>

                              <button className="w-full py-2 px-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm">
                                📖 Read
                              </button>
                            </motion.div>
                          </Link>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleComparison(derivative.id)
                            }}
                            className={`absolute top-2 right-2 w-5 h-5 rounded border flex items-center justify-center text-xs ${
                              selectedForComparison.has(derivative.id)
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {selectedForComparison.has(derivative.id) && '✓'}
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison Section - Only show when items are selected */}
        {selectedForComparison.size > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Compare Selected Story Paths</h3>
              <button
                onClick={() => setSelectedForComparison(new Set())}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-600 font-medium">Feature</th>
                    <th className="text-center py-3 text-blue-800 font-medium">Original</th>
                    {sortedRemixes
                      .filter(derivative => selectedForComparison.has(derivative.id))
                      .map((derivative) => (
                        <th key={derivative.id} className="text-center py-3 text-purple-800 font-medium">
                          {derivative.author}'s Remix
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Total Chapters</td>
                    <td className="py-3 text-center">{universe.originalBook.chapters} chapters</td>
                    {sortedRemixes
                      .filter(derivative => selectedForComparison.has(derivative.id))
                      .map((derivative) => (
                        <td key={derivative.id} className="py-3 text-center">{derivative.chapters}+ chapters</td>
                      ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Status</td>
                    <td className="py-3 text-center text-green-600">Complete ✓</td>
                    {sortedRemixes
                      .filter(derivative => selectedForComparison.has(derivative.id))
                      .map((derivative) => (
                        <td key={derivative.id} className="py-3 text-center text-yellow-600">
                          {derivative.chapters >= 7 ? 'Complete ✓' : 'Ongoing 🔥'}
                        </td>
                      ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Genre Focus</td>
                    <td className="py-3 text-center">{universe.originalBook.genre}</td>
                    {sortedRemixes
                      .filter(derivative => selectedForComparison.has(derivative.id))
                      .map((derivative) => (
                        <td key={derivative.id} className="py-3 text-center">{derivative.genre}</td>
                      ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-700">Reader Rating</td>
                    <td className="py-3 text-center">
                      {universe.originalBook.rating > 0 ? `⭐ ${universe.originalBook.rating.toFixed(1)}` : '🆕 Too new to rate'}
                    </td>
                    {sortedRemixes
                      .filter(derivative => selectedForComparison.has(derivative.id))
                      .map((derivative) => (
                        <td key={derivative.id} className="py-3 text-center">
                          {derivative.rating > 0 ? `⭐ ${derivative.rating.toFixed(1)}` : '🆕 Too new to rate'}
                        </td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">💡 Comparison Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Complete</strong> stories offer the full narrative arc</li>
                <li>• <strong>Ongoing</strong> stories are actively being written</li>
                <li>• <strong>Higher ratings</strong> indicate reader satisfaction</li>
                <li>• All paths share the same opening chapters</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}