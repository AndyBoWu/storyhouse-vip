'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Book, FileText } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface StoryChapter {
  number: number
  title: string
  wordCount: number
  readingTime: number
  isUnlocked: boolean
  unlockPrice?: number
}

interface StoryDetails {
  id: string
  title: string
  authorAddress: string
  authorName: string
  genre: string
  description: string
  chapters: StoryChapter[]
  totalChapters: number
}

function StoriesContent() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [storySlug, setStorySlug] = useState<string>('')
  const [pageType, setPageType] = useState<string>('') // 'toc', chapter number, etc.
  const [storyDetails, setStoryDetails] = useState<StoryDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Extract route parameters from URL hash for client-side routing
    const hash = window.location.hash.slice(1) // Remove #
    const pathParts = hash.split('/')
    
    if (pathParts.length >= 3) {
      setWalletAddress(pathParts[0])
      setStorySlug(pathParts[1])
      setPageType(pathParts[2]) // 'toc' or chapter number
      
      // Load story details when we have valid parameters
      loadStoryDetails(pathParts[0], pathParts[1])
    }
  }, [])

  const loadStoryDetails = async (address: string, slug: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      // Try to get story details from the API
      const bookId = `${address}-${slug}`
      const [bookResponse, chaptersResponse] = await Promise.all([
        apiClient.get(`/books/${bookId}`),
        apiClient.getBookChapters(bookId)
      ])

      if (bookResponse && chaptersResponse.success) {
        const storyDetails: StoryDetails = {
          id: bookId,
          title: bookResponse.title || slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          authorAddress: address,
          authorName: bookResponse.authorName || address.slice(0, 6) + '...' + address.slice(-4),
          genre: bookResponse.genre || 'Story',
          description: bookResponse.description || 'No description available.',
          totalChapters: chaptersResponse.data?.totalChapters || 0,
          chapters: chaptersResponse.data?.chapters?.map((chapterNum: number) => ({
            number: chapterNum,
            title: `Chapter ${chapterNum}`,
            wordCount: 0, // Will be loaded when viewing individual chapters
            readingTime: 0,
            isUnlocked: chapterNum <= 3, // First 3 chapters are free
            unlockPrice: chapterNum > 3 ? 10 : undefined // 10 TIP for paid chapters
          })) || []
        }
        
        setStoryDetails(storyDetails)
      } else {
        setError('Story not found')
      }
    } catch (err) {
      setError('Failed to load story details')
      console.error('Error loading story:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-testnet.storyhouse.vip'
  }

  // Render Table of Contents
  const renderTableOfContents = () => {
    if (!storyDetails) return null

    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/own" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{storyDetails.title}</h1>
                <p className="text-gray-600">by {storyDetails.authorName}</p>
              </div>
            </div>

            {/* Story Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Story Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Genre:</span> {storyDetails.genre}</p>
                    <p><span className="font-medium">Chapters:</span> {storyDetails.totalChapters}</p>
                    <p><span className="font-medium">Author:</span> {storyDetails.authorName}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 text-sm">{storyDetails.description}</p>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Book className="w-5 h-5" />
                Table of Contents
              </h3>
              
              <div className="space-y-3">
                {storyDetails.chapters.map((chapter) => (
                  <div
                    key={chapter.number}
                    className={`p-4 rounded-lg border transition-all ${
                      chapter.isUnlocked
                        ? 'border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => {
                      if (chapter.isUnlocked) {
                        const chapterUrl = `/stories#${walletAddress}/${storySlug}/${chapter.number}`
                        window.location.href = chapterUrl
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          chapter.isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {chapter.number}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{chapter.title}</h4>
                          <p className="text-xs text-gray-500">
                            {chapter.wordCount} words • {chapter.readingTime} min read
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {chapter.isUnlocked ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Free
                          </span>
                        ) : (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {chapter.unlockPrice} $TIP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Story</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/own" className="text-blue-600 hover:text-blue-800">
            ← Back to My Stories
          </Link>
        </div>
      </div>
    )
  }

  // Show table of contents for 'toc' route
  if (pageType === 'toc' && storyDetails) {
    return renderTableOfContents()
  }

  // Show chapter content for numeric chapter routes
  if (pageType && !isNaN(Number(pageType)) && storyDetails) {
    const chapterNumber = Number(pageType)
    const chapter = storyDetails.chapters.find(c => c.number === chapterNumber)
    
    if (!chapter) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Chapter Not Found</h2>
            <p className="text-gray-600 mb-4">Chapter {chapterNumber} doesn't exist for this story.</p>
            <Link href={`/stories#${walletAddress}/${storySlug}/toc`} className="text-blue-600 hover:text-blue-800">
              ← Back to Table of Contents
            </Link>
          </div>
        </div>
      )
    }

    // Chapter reading view
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href={`/stories#${walletAddress}/${storySlug}/toc`} 
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{chapter.title}</h1>
                <p className="text-gray-600">
                  {storyDetails.title} • Chapter {chapter.number} of {storyDetails.totalChapters}
                </p>
              </div>
            </div>

            {/* Chapter Content */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              {chapter.isUnlocked ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    This is a placeholder for chapter content. In a real implementation, 
                    this would load the actual chapter content from the backend API using 
                    the chapter endpoint.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    The content would be fetched from: 
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {getApiBaseUrl()}/api/chapters/{storyDetails.id}/{chapter.number}
                    </code>
                  </p>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Chapter Locked</h3>
                  <p className="text-gray-600 mb-6">
                    Unlock this chapter for {chapter.unlockPrice} $TIP tokens
                  </p>
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                    Unlock Chapter
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <div>
                {chapterNumber > 1 && (
                  <Link href={`/stories#${walletAddress}/${storySlug}/${chapterNumber - 1}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Previous Chapter
                  </Link>
                )}
              </div>
              <div>
                {chapterNumber < storyDetails.totalChapters && (
                  <Link href={`/stories#${walletAddress}/${storySlug}/${chapterNumber + 1}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors">
                    Next Chapter
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default view when no valid route is detected
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Story Viewer</h2>
        <p className="text-gray-600 mb-6">
          Use the URL format: <code>/stories#[wallet]/[story-slug]/toc</code>
        </p>
        <Link href="/own" className="text-blue-600 hover:text-blue-800">
          ← Back to My Stories
        </Link>
      </div>
    </div>
  )
}

export default function StoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading stories...</p>
      </div>
    </div>}>
      <StoriesContent />
    </Suspense>
  )
}