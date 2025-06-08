'use client'

import { Suspense } from 'react'
import { ArrowLeft, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

function WritePageContent() {
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

            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
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