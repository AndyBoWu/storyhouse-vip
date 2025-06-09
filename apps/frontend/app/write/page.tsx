'use client'

import { Suspense, useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, ChevronRight, Wand2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { apiClient } from '@/lib/api-client'
import StoryGenerationInterface from '@/components/writing/StoryGenerationInterface'
import QuickNavigation from '@/components/ui/QuickNavigation'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

function WritePageContent() {
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const [generatedStory, setGeneratedStory] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [drafts, setDrafts] = useState([])
  
  // Check if we have URL parameters for story generation
  const continueStory = searchParams?.get('continueStory')
  const nextChapter = searchParams?.get('nextChapter')
  const storyTitle = searchParams?.get('title')
  const storyGenre = searchParams?.get('genre')
  const plotDescription = searchParams?.get('plot')
  const chapterNumber = searchParams?.get('chapterNumber')
  const coverUrl = searchParams?.get('coverUrl')
  
  // Auto-generate story if URL parameters are present
  useEffect(() => {
    if (plotDescription && (continueStory || chapterNumber)) {
      handleGenerateStory({
        plotDescription: decodeURIComponent(plotDescription),
        storyId: continueStory || undefined,
        chapterNumber: parseInt(nextChapter || chapterNumber || '1'),
        title: storyTitle ? decodeURIComponent(storyTitle) : undefined,
        genre: storyGenre ? decodeURIComponent(storyGenre) : undefined,
        coverUrl: coverUrl ? decodeURIComponent(coverUrl) : undefined
      })
    }
  }, [continueStory, nextChapter, plotDescription, chapterNumber])
  
  const handleGenerateStory = async (params) => {
    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet first')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await apiClient.generateStory({
        plotDescription: params.plotDescription,
        genres: params.genre ? [params.genre] : ['Adventure'],
        moods: ['engaging'],
        emojis: ['✨'],
        chapterNumber: params.chapterNumber || 1,
        storyId: params.storyId,
        authorAddress: connectedAddress,
        authorName: connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4),
        ipOptions: {
          registerAsIP: true
        }
      })
      
      if (response.success && response.data) {
        setGeneratedStory(response.data)
      } else {
        setError('Failed to generate story. Please try again.')
      }
    } catch (err) {
      console.error('Story generation error:', err)
      setError('Failed to generate story. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handlePublishSuccess = async (publishData) => {
    try {
      // Save the story to R2 after successful blockchain registration
      await apiClient.apiRequest('/api/stories/save', {
        method: 'POST',
        body: JSON.stringify({
          ...generatedStory,
          ipAssetId: publishData.ipAssetId,
          transactionHash: publishData.transactionHash,
          walletAddress: connectedAddress
        })
      })
      
      // Redirect to success page or stories list
      window.location.href = '/own'
    } catch (error) {
      console.error('Failed to save story after blockchain registration:', error)
      setError('Story was registered on blockchain but failed to save. Please try again.')
    }
  }
  
  const handleSaveDraft = (storyData) => {
    // Save to localStorage as draft
    const existingDrafts = JSON.parse(localStorage.getItem('storyDrafts') || '[]')
    const newDraft = {
      ...storyData,
      draftId: Date.now().toString(),
      savedAt: new Date().toISOString()
    }
    existingDrafts.push(newDraft)
    localStorage.setItem('storyDrafts', JSON.stringify(existingDrafts))
    setDrafts(existingDrafts)
  }
  
  const handleStartOver = () => {
    setGeneratedStory(null)
    setError(null)
    // Clear URL parameters
    window.history.replaceState({}, '', '/write')
  }
  
  // If we have a generated story, show the generation interface
  if (generatedStory) {
    return (
      <StoryGenerationInterface
        generatedStory={generatedStory}
        onPublishSuccess={handlePublishSuccess}
        onSaveDraft={handleSaveDraft}
        onStartOver={handleStartOver}
      />
    )
  }
  
  // If we're generating, show loading
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🎨 Creating Your Story...</h2>
          <p className="text-gray-600 mb-4">Our AI is crafting something amazing for you</p>
          <div className="max-w-md mx-auto bg-white rounded-lg p-4 shadow-lg">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Analyzing your plot...</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Generating creative content...</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                <span>Preparing for blockchain...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const renderModeSelector = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-3xl font-bold text-gray-800 mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
          Create Your Story
        </div>
        <p className="text-gray-600 text-lg">Let AI help you bring imagination to life</p>
      </div>

      {/* Scenario Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
        <Link href="/write/new">
          <button className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">New Story</h3>
            <p className="text-gray-600 mb-4">Start fresh with AI help</p>
            <div className="inline-flex items-center gap-2 text-purple-600 font-medium">
              <span>Start Writing</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </Link>

        <Link href="/write/continue">
          <button className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200">
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Ongoing Story</h3>
            <p className="text-gray-600 mb-4">Add next chapter</p>
            <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
              <span>Add Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </Link>

        <Link href="/write/branch">
          <button className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-green-200">
            <div className="text-4xl mb-4">🌿</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Branch & Remix</h3>
            <p className="text-gray-600 mb-4">Continue any story from any chapter</p>
            <div className="inline-flex items-center gap-2 text-green-600 font-medium">
              <span>Browse Stories</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </Link>
      </div>

      {/* Help Text */}
      <div className="text-center bg-purple-50 rounded-lg p-4">
        <p className="text-purple-800">
          💡 Don't worry about blockchain stuff yet - just focus on creating great content!
          We'll handle IP protection later.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to StoryHouse</span>
            </Link>

            <div className="flex items-center gap-4">
              <QuickNavigation currentPage="write" />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 max-w-4xl mx-auto">
            <div className="text-red-500">⚠️</div>
            <div>
              <h4 className="text-red-800 font-medium">Generation Failed</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {renderModeSelector()}
      </div>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>}>
      <WritePageContent />
    </Suspense>
  )
}