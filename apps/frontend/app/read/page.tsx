'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Filter, TrendingUp, Clock, Star } from 'lucide-react'
import Link from 'next/link'

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
  coverImage?: string
  tags: string[]
}

export default function ReadPage() {
  const [stories, setStories] = useState<PublicStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent')

  const genres = ['all', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Horror', 'Comedy', 'Adventure', 'Drama']

  // Load public stories
  useEffect(() => {
    const loadPublicStories = async () => {
      setIsLoading(true)
      try {
        // For now, we'll use the same API but filter to show "public" stories
        // In a real implementation, you'd have a separate endpoint for public stories
        const response = await fetch('/api/stories')
        const data = await response.json()

        if (data.success && data.stories) {
          // Convert to PublicStory format and add mock data for demo
          const publicStories: PublicStory[] = data.stories.map((story: any, index: number) => ({
            id: story.id,
            title: story.title,
            author: `Author ${index + 1}`, // Mock author data
            genre: story.genre,
            chapters: story.chapters,
            lastUpdated: story.lastUpdated,
            totalReads: Math.floor(Math.random() * 1000) + 50, // Mock read count
            rating: Math.floor(Math.random() * 20 + 80) / 20, // Mock rating 4.0-5.0
            preview: story.preview,
            tags: [story.genre.toLowerCase(), 'featured'] // Mock tags
          }))
          setStories(publicStories)
        }
      } catch (error) {
        console.error('Error loading public stories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicStories()
  }, [])

  // Filter and sort stories
  const filteredStories = stories
    .filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           story.author.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre
      return matchesSearch && matchesGenre
    })
    .sort((a, b) => {
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
            <div className="text-sm text-gray-500">
              Discover amazing stories from creators worldwide
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
              📖 Discover Stories
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore captivating stories from talented creators around the world. 
              Earn $TIP tokens while reading and support your favorite authors.
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
                  placeholder="Search stories or authors..."
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
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading amazing stories...</h3>
              <p className="text-gray-500">Discovering content from creators worldwide</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">No stories found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-1 text-yellow-500 ml-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{story.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-medium">by {story.author}</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {story.genre}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{story.chapters} chapters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{story.totalReads.toLocaleString()} reads</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 italic line-clamp-3">"{story.preview}"</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                      📖 Start Reading
                    </button>
                    <button className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-all">
                      💝
                    </button>
                  </div>
                </motion.div>
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