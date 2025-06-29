'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Filter, TrendingUp, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Fuse from 'fuse.js'
import QuickNavigation from '@/components/ui/QuickNavigation'
import { apiClient } from '@/lib/api-client'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

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

export default function ReadPage() {
  const [stories, setStories] = useState<PublicStory[]>([])
  const [storyUniverses, setStoryUniverses] = useState<StoryUniverse[]>([])
  const [standaloneStories, setStandaloneStories] = useState<PublicStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent')
  const [expandedUniverse, setExpandedUniverse] = useState<string | null>(null)

  const genres = ['all', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Horror', 'Comedy', 'Adventure', 'Drama']

  // Consolidate books into story universes
  const consolidateIntoUniverses = (books: PublicStory[]) => {
    const universes: StoryUniverse[] = []
    const standalone: PublicStory[] = []
    const processed = new Set<string>()
    
    // Process original books first to ensure proper universe creation
    const originalBooks = books.filter(book => !book.isDerivative)
    const derivativeBooks = books.filter(book => book.isDerivative)
    
    // First pass: Process all original books and their derivatives
    originalBooks.forEach(book => {
      if (processed.has(book.id)) return
      
      const derivatives = books.filter(b => 
        b.parentBookId === book.id && b.isDerivative && !processed.has(b.id)
      )

      if (derivatives.length > 0) {
          // Create story universe
          const allBooks = [book, ...derivatives]
          const totalRating = allBooks.filter(b => b.rating > 0).reduce((sum, b) => sum + b.rating, 0)
          const ratedBooks = allBooks.filter(b => b.rating > 0).length

          const universe: StoryUniverse = {
            id: book.id,
            originalBook: book,
            derivatives,
            totalPaths: 1 + derivatives.length,
            totalChapters: Math.max(...allBooks.map(b => b.chapters)),
            avgRating: ratedBooks > 0 ? totalRating / ratedBooks : 0,
            combinedReads: allBooks.reduce((sum, b) => sum + b.totalReads, 0)
          }
          
          universes.push(universe)
          
          // Mark all books as processed
          processed.add(book.id)
          derivatives.forEach(d => processed.add(d.id))
        } else {
          // Standalone original book
          standalone.push(book)
          processed.add(book.id)
        }
    })
    
    // Second pass: Process any remaining derivative books (orphaned ones)
    derivativeBooks.forEach(book => {
      if (!processed.has(book.id)) {
        // Orphaned derivative (original not found)
        standalone.push(book)
        processed.add(book.id)
      }
    })


    return { universes, standalone }
  }

  // Load public books
  useEffect(() => {
    const loadPublicBooks = async () => {
      setIsLoading(true)
      try {
        // Load all published books to show in public discovery
        const data = await apiClient.getBooks()

        if (data.success && data.books) {
          // Convert books to PublicStory format for display
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
          
          setStories(publicStories)
          
          // Consolidate into universes
          const { universes, standalone } = consolidateIntoUniverses(publicStories)
          setStoryUniverses(universes)
          setStandaloneStories(standalone)
        }
      } catch (error) {
        console.error('Error loading public books:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicBooks()
  }, [])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => new Fuse(stories, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'author', weight: 0.3 },
      { name: 'genre', weight: 0.2 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.4, // 0 = perfect match, 1 = match anything
    includeScore: true,
    minMatchCharLength: 2
  }), [stories])

  // Filter and sort stories with fuzzy search
  const filteredStories = useMemo(() => {
    let filtered = stories

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
          return b.totalReads - a.totalReads
        case 'rating':
          return b.rating - a.rating
        case 'recent':
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      }
    })
  }, [stories, searchQuery, selectedGenre, sortBy, fuse])

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
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Discover amazing stories from creators worldwide
              </div>
              <QuickNavigation currentPage="read" />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              📚 Discover Books
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore captivating books from talented creators around the world. 
              Support your favorite authors by unlocking their premium chapters.
            </p>
          </div>

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? 'All Genres' : genre}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Stories Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading amazing books...</h3>
              <p className="text-gray-500">Discovering content from creators worldwide</p>
            </div>
          ) : storyUniverses.length === 0 && standaloneStories.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">No books found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {/* Story Universes - Card View */}
              {storyUniverses.map((universe) => (
                <Link key={universe.id} href={`/universe/${encodeURIComponent(universe.id)}`}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all cursor-pointer w-full"
                  >
                    {/* Universe Cover */}
                    <div className="aspect-[3/4] w-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center relative">
                      {universe.originalBook.coverUrl ? (
                        <img
                          src={universe.originalBook.coverUrl}
                          alt={`${universe.originalBook.title} cover`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-white text-4xl font-bold">${universe.originalBook.title.charAt(0)}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-white text-4xl font-bold">{universe.originalBook.title.charAt(0)}</span>
                      )}
                      
                      
                      {/* Story Paths Badge */}
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-black bg-opacity-50 text-white text-xs font-medium rounded-full">
                          📖 {universe.totalPaths} story paths
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-800 line-clamp-2 flex-1">
                            {universe.originalBook.title}
                          </h3>
                          {universe.avgRating > 0 && (
                            <div className="flex items-center gap-1 text-yellow-500 ml-2">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium text-gray-700">{universe.avgRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {universe.originalBook.genre}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{universe.totalChapters} chapters</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span>👥 {1 + universe.derivatives.length} authors</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {universe.originalBook.preview}
                        </p>
                      </div>

                      <button className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                        🌌 Explore Universe
                      </button>
                    </div>
                  </motion.div>
                </Link>
              ))}

              {/* Standalone Stories */}
              {standaloneStories.map((story) => (
                      <Link key={story.id} href={`/book/${story.id}`}>
                        <motion.div
                          whileHover={{ scale: 1.02, y: -5 }}
                          className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                        >
                          {/* Book Cover */}
                          <div className="aspect-[3/4] w-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            {story.coverUrl ? (
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
                            ) : (
                              <span className="text-white text-4xl font-bold">{story.title.charAt(0)}</span>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="mb-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-base font-semibold text-gray-800 line-clamp-2 flex-1">
                                  {story.title}
                                </h3>
                                {story.rating > 0 && (
                                  <div className="flex items-center gap-1 text-yellow-500 ml-2">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-sm font-medium text-gray-700">{story.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  {story.genre}
                                </span>
                                <span>•</span>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>{story.chapters} chapters</span>
                                </div>
                              </div>
                            </div>

                            <button className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                              📖 Read Book
                            </button>
                          </div>
                        </motion.div>
                      </Link>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Have a story to tell?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join our community of creators and share your unique voice with the world.
            </p>
            <Link href="/write">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                ✨ Start Writing
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}