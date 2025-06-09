'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, Book } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { buildChapterUrl } from '@/lib/utils/slugify'
import { apiClient } from '@/lib/api-client'
import dynamic from 'next/dynamic'
import QuickNavigation from '@/components/ui/QuickNavigation'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})


interface RegisteredBook {
  id: string
  title: string
  description: string
  author: string
  authorName: string
  genres: string[]
  moods?: string[]
  emojis?: string[]
  coverUrl?: string
  createdAt: string
  registeredAt?: string
  ipAssetId?: string
  tokenId?: string
  transactionHash?: string
  chapters: number
  slug: string
}

export default function MyStoriesPage() {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()
  const [registeredBooks, setRegisteredBooks] = useState<RegisteredBook[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)
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
    registeredBooksCount: registeredBooks.length,
    isLoadingBooks,
    isRefreshing,
    firstBookTitle: registeredBooks[0]?.title || 'No books'
  })

  // Load registered books from R2
  useEffect(() => {
    console.log('🚀 useEffect triggered - about to load books')
    
    const loadBooks = async () => {
      console.log('📚 Loading registered books from API...')
      console.log('🔗 Connected address:', connectedAddress)
      setIsLoadingBooks(true)
      
      try {
        const data = await apiClient.getBooks(connectedAddress || undefined)
        console.log('📊 Books API Response:', data)
        console.log('📊 Raw response structure:', {
          hasSuccess: 'success' in data,
          hasBooks: 'books' in data,
          successValue: data.success,
          booksType: typeof data.books,
          booksIsArray: Array.isArray(data.books),
          booksLength: data.books?.length || 0
        })

        if (data.success && data.books && Array.isArray(data.books)) {
          console.log('✅ Books loaded from API:', data.books.length, 'books')
          console.log('📖 Books:', data.books.map((b: any) => b.title))
          
          const convertedBooks: RegisteredBook[] = data.books.map((book: any) => ({
            id: book.id,
            title: book.title,
            description: book.description,
            author: book.author,
            authorName: book.authorName,
            genres: book.genres,
            moods: book.moods,
            emojis: book.emojis,
            coverUrl: book.coverUrl,
            createdAt: book.createdAt,
            registeredAt: book.registeredAt,
            ipAssetId: book.ipAssetId,
            tokenId: book.tokenId,
            transactionHash: book.transactionHash,
            chapters: book.chapters,
            slug: book.slug
          }))
          
          console.log('🔄 Setting books state with:', convertedBooks.length, 'books')
          setRegisteredBooks(convertedBooks)
        } else {
          console.warn('❌ Invalid books API response:', data)
          setRegisteredBooks([])
        }
      } catch (error) {
        console.error('❌ Error loading books:', error)
        setRegisteredBooks([])
      } finally {
        setIsLoadingBooks(false)
      }
    }

    loadBooks()
  }, [connectedAddress]) // Reload when wallet connection changes

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    setIsRefreshing(true)
    try {
      // Refresh books
      const booksData = await apiClient.getBooks(connectedAddress || undefined)

      // Handle books
      if (booksData.success && booksData.books && Array.isArray(booksData.books)) {
        console.log('✅ Manual refresh loaded:', booksData.books.length, 'books')
        
        const convertedBooks: RegisteredBook[] = booksData.books.map((book: any) => ({
          id: book.id,
          title: book.title,
          description: book.description,
          author: book.author,
          authorName: book.authorName,
          genres: book.genres,
          moods: book.moods,
          emojis: book.emojis,
          coverUrl: book.coverUrl,
          createdAt: book.createdAt,
          registeredAt: book.registeredAt,
          ipAssetId: book.ipAssetId,
          tokenId: book.tokenId,
          transactionHash: book.transactionHash,
          chapters: book.chapters,
          slug: book.slug
        }))
        setRegisteredBooks(convertedBooks)
      }
    } catch (error) {
      console.error('❌ Error during manual refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }


  const handleStartWriting = async (book: RegisteredBook) => {
    try {
      console.log('📚 Starting writing for book:', book.id)
      
      // Get current chapter information for this book
      const chapterInfo = await apiClient.getBookChapters(book.id)
      
      let nextChapterNumber = 1
      if (chapterInfo.success && chapterInfo.data) {
        nextChapterNumber = chapterInfo.data.nextChapterNumber
        console.log('📄 Next chapter number:', nextChapterNumber)
      } else {
        console.log('📝 No chapters found, starting with chapter 1')
      }

      // Navigate to chapter writing page with proper chapter number
      const writeUrl = `/write/chapter?bookId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}&genre=${encodeURIComponent(book.genres[0] || 'Fiction')}&chapterNumber=${nextChapterNumber}`
      
      console.log('🔗 Navigating to:', writeUrl)
      router.push(writeUrl)
    } catch (error) {
      console.error('❌ Error getting chapter info:', error)
      
      // Fallback to chapter 1 if there's an error
      const writeUrl = `/write/chapter?bookId=${encodeURIComponent(book.id)}&title=${encodeURIComponent(book.title)}&genre=${encodeURIComponent(book.genres[0] || 'Fiction')}&chapterNumber=1`
      router.push(writeUrl)
    }
  }

  const handleViewBook = (book: RegisteredBook) => {
    // Navigate to the new book landing page
    router.push(`/book/${book.id}`)
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
            <div className="flex items-center gap-4">
              <QuickNavigation currentPage="own" />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              👑 My Library
            </h1>
            <p className="text-gray-600 mt-2">Your registered books</p>
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
                  To view your books, please connect your wallet using the "Connect" button in the top navigation.
                </p>
                <p className="text-sm text-gray-500">
                  Your books are linked to your wallet address for ownership verification.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Loading State */}
              {isLoadingBooks && (
                <div className="text-center py-12 mb-6">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your library...</h3>
                  <p className="text-gray-500">Fetching books from R2 storage</p>
                </div>
              )}

              {/* Registered Books Section */}
              {!isLoadingBooks && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">📚 Registered Books</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registeredBooks.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <div className="text-4xl mb-4">📖</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No books registered yet</h3>
                        <p className="text-gray-500 mb-4">Register your first book to start building your library</p>
                        <Link href="/write/new">
                          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                            <Sparkles className="w-4 h-4" />
                            Register Your First Book
                          </button>
                        </Link>
                      </div>
                    ) : (
                      registeredBooks.map((book) => (
                        <div
                          key={book.id}
                          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all"
                        >
                          {/* Book Cover */}
                          {book.coverUrl && (
                            <div className="mb-4">
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/books/${book.id}/cover`}
                                alt={`${book.title} cover`}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  // Hide image if it fails to load
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{book.title}</h3>
                              <div className="mb-3">
                                <p className="text-sm text-gray-600 mb-1">by</p>
                                <p className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded break-all">
                                  {book.author}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  Book
                                </span>
                                {book.genres.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                      {book.genres[0]}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-2">{book.chapters} chapters</p>
                              {book.ipAssetId && (
                                <div className="text-xs text-green-600 mb-2">
                                  ✅ Registered on-chain
                                </div>
                              )}
                            </div>
                          </div>


                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStartWriting(book)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                              ✍️ Start Writing
                            </button>
                            <button 
                              onClick={() => handleViewBook(book)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                            >
                              <Book className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}


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