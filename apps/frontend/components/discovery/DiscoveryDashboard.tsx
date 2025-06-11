'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  GitBranch, 
  Users, 
  TrendingUp, 
  BookOpen, 
  Filter,
  ChevronRight,
  Star,
  Eye,
  DollarSign,
  Sparkles,
  Award,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

interface BookSummary {
  bookId: string
  title: string
  authorName: string
  authorAddress: string
  coverUrl?: string
  totalChapters: number
  genres: string[]
  averageRating: number
  totalReads: number
  isRemixable: boolean
  createdAt: string
  parentBook?: string
  branchPoint?: string
  derivativeBooks?: string[]
  // AI Quality Metrics
  qualityScore?: number
  similarityScore?: number
  influenceScore?: number
  aiRecommended?: boolean
  qualityTrend?: 'rising' | 'stable' | 'falling'
}

interface DiscoverySection {
  title: string
  description: string
  icon: React.ReactNode
  books: BookSummary[]
  loading: boolean
  error: string | null
}

export default function DiscoveryDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [qualityFilter, setQualityFilter] = useState<'all' | 'high' | 'rising'>('all')
  const [similarityFilter, setSimilarityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [sections, setSections] = useState<{
    trending: DiscoverySection
    mostRemixed: DiscoverySection
    collaborative: DiscoverySection
    newReleases: DiscoverySection
    aiRecommended: DiscoverySection
  }>({
    trending: {
      title: 'Trending Stories',
      description: 'Most read and engaged stories this week',
      icon: <TrendingUp className="w-5 h-5" />,
      books: [],
      loading: true,
      error: null
    },
    mostRemixed: {
      title: 'Most Remixed',
      description: 'Stories inspiring the most derivatives',
      icon: <GitBranch className="w-5 h-5" />,
      books: [],
      loading: true,
      error: null
    },
    collaborative: {
      title: 'Collaborative Network',
      description: 'Stories with multiple contributing authors',
      icon: <Users className="w-5 h-5" />,
      books: [],
      loading: true,
      error: null
    },
    newReleases: {
      title: 'New Releases',
      description: 'Recently published original stories',
      icon: <BookOpen className="w-5 h-5" />,
      books: [],
      loading: true,
      error: null
    },
    aiRecommended: {
      title: 'AI Recommended Derivatives',
      description: 'High-quality derivatives suggested by AI analysis',
      icon: <Sparkles className="w-5 h-5" />,
      books: [],
      loading: true,
      error: null
    }
  })

  const availableGenres = [
    'All Genres', 'Fantasy', 'Romance', 'Mystery', 'Sci-Fi', 
    'Horror', 'Comedy', 'Drama', 'Adventure', 'Thriller'
  ]

  useEffect(() => {
    loadDiscoverySections()
  }, [])

  const loadDiscoverySections = async () => {
    // Load trending stories
    loadSection('trending', {
      type: 'recommendations',
      limit: 8,
      includeMetrics: true
    })

    // Load most remixed stories
    loadSection('mostRemixed', {
      type: 'recommendations', 
      limit: 6,
      includeMetrics: true
    })

    // Load collaborative stories  
    loadSection('collaborative', {
      type: 'recommendations',
      limit: 6,
      includeRevenue: true
    })

    // Load new releases
    loadSection('newReleases', {
      type: 'recommendations',
      limit: 8,
      includeMetrics: true
    })

    // Load AI recommended derivatives
    loadSection('aiRecommended', {
      type: 'quality-assessment',
      limit: 6,
      minQualityScore: 8,
      includeMetrics: true
    })
  }

  const loadSection = async (sectionKey: keyof typeof sections, params: any) => {
    try {
      const queryParams = new URLSearchParams(params).toString()
      const data = await apiClient.get(`/discovery?${queryParams}`)

      if (data.success) {
        setSections(prev => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            books: data.books,
            loading: false,
            error: null
          }
        }))
      } else {
        setSections(prev => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            books: [],
            loading: false,
            error: data.error || 'Failed to load'
          }
        }))
      }
    } catch (error) {
      console.error(`Error loading ${sectionKey}:`, error)
      setSections(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          books: [],
          loading: false,
          error: 'Failed to load'
        }
      }))
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    // Implement search functionality
    console.log('Search for:', searchQuery, 'Genre:', selectedGenre)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderBookCard = (book: BookSummary, size: 'small' | 'medium' | 'large' = 'medium') => {
    const cardSizes = {
      small: 'p-3',
      medium: 'p-4',
      large: 'p-6'
    }

    return (
      <motion.div
        key={book.bookId}
        whileHover={{ scale: 1.02 }}
        className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all ${cardSizes[size]}`}
      >
        <Link href={`/stories?bookId=${book.bookId}`}>
          <div className="cursor-pointer">
            {/* Cover Image */}
            {book.coverUrl ? (
              <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <img 
                  src={book.coverUrl} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Title and Author */}
            <h4 className="font-medium text-gray-800 mb-1 line-clamp-2">{book.title}</h4>
            <p className="text-sm text-gray-600 mb-2">by {book.authorName}</p>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-3">
              {book.genres.slice(0, 2).map((genre) => (
                <span 
                  key={genre}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>{book.averageRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{book.totalReads.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{book.totalChapters}ch</span>
              </div>
            </div>

            {/* Special badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {book.parentBook && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  Remix
                </span>
              )}
              {book.derivativeBooks && book.derivativeBooks.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {book.derivativeBooks.length} derivatives
                </span>
              )}
              {book.isRemixable && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Remixable
                </span>
              )}
              {book.qualityScore && book.qualityScore >= 8 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  High Quality
                </span>
              )}
              {book.aiRecommended && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Pick
                </span>
              )}
              {book.qualityTrend === 'rising' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Rising
                </span>
              )}
            </div>

            {/* Creation date */}
            <div className="text-xs text-gray-500">
              {formatDate(book.createdAt)}
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  const renderSection = (sectionKey: keyof typeof sections) => {
    const section = sections[sectionKey]
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">{section.icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
          </div>
          <Link href={`/discovery/${sectionKey}`}>
            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {section.loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg aspect-[3/5] animate-pulse"></div>
            ))}
          </div>
        ) : section.error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 text-sm">{section.error}</p>
          </div>
        ) : section.books.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-2">{section.icon}</div>
            <p className="text-gray-600">No books found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {section.books.map((book) => renderBookCard(book, 'small'))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Discover Stories</h1>
        <p className="text-gray-600">
          Explore original stories, remixes, and collaborative works in the StoryHouse ecosystem
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories by title, author, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableGenres.map((genre) => (
                <option key={genre} value={genre === 'All Genres' ? '' : genre}>
                  {genre}
                </option>
              ))}
            </select>
            
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Quality</option>
              <option value="high">High Quality</option>
              <option value="rising">Rising Stars</option>
            </select>
            
            <select
              value={similarityFilter}
              onChange={(e) => setSimilarityFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Similarity</option>
              <option value="low">Low (&lt;40%)</option>
              <option value="medium">Medium (40-70%)</option>
              <option value="high">High (&gt;70%)</option>
            </select>
            
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Discovery Sections */}
      {renderSection('trending')}
      {renderSection('aiRecommended')}
      {renderSection('mostRemixed')}
      {renderSection('collaborative')}
      {renderSection('newReleases')}

      {/* Similar Content You Might Like */}
      <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Similar Content You Might Like
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Based on your reading history and preferences, our AI suggests these stories
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mock similar content recommendations */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-1">The Quantum Echo</h4>
            <p className="text-sm text-gray-600 mb-2">87% match to your interests</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Sci-Fi</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                4.8
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-1">Chronicles of Tomorrow</h4>
            <p className="text-sm text-gray-600 mb-2">92% match to your interests</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Adventure</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                4.9
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-1">Digital Dreams</h4>
            <p className="text-sm text-gray-600 mb-2">84% match to your interests</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Cyberpunk</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                4.7
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
          Ready to Create Your Own Story?
        </h3>
        <p className="text-gray-600 mb-6">
          Start from scratch, continue an existing story, or branch from any chapter to create your unique narrative.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/write/new">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Create New Story
            </button>
          </Link>
          <Link href="/write/branch">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Branch Existing Story
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}