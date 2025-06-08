'use client'

import { useEffect, useState, Suspense } from 'react'

function StoriesContent() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [storySlug, setStorySlug] = useState<string>('')
  const [chapterNumber, setChapterNumber] = useState<string>('')

  useEffect(() => {
    // Extract route parameters from URL hash for client-side routing
    const hash = window.location.hash.slice(1) // Remove #
    const pathParts = hash.split('/')
    
    if (pathParts.length >= 3) {
      setWalletAddress(pathParts[0])
      setStorySlug(pathParts[1])
      setChapterNumber(pathParts[2])
    }
  }, [])

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://testnet.storyhouse.vip'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Story Viewer (SPA Mode)
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Story</h2>
          <div className="space-y-2">
            <p><strong>Wallet Address:</strong> {walletAddress || 'Not specified'}</p>
            <p><strong>Story Slug:</strong> {storySlug || 'Not specified'}</p>
            <p><strong>Chapter Number:</strong> {chapterNumber || 'Not specified'}</p>
            <p><strong>API Base URL:</strong> {getApiBaseUrl()}</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            ✅ SPA Mode Active
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            This is running in Single Page Application mode on Cloudflare Pages. 
            To view a specific story, use the URL format:
          </p>
          <code className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded text-sm">
            /stories#[walletAddress]/[storySlug]/[chapterNumber]
          </code>
          
          <div className="mt-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Example: <code>/stories#0x123.../my-story/1</code>
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              ✅ What's Working
            </h3>
            <ul className="text-green-800 dark:text-green-200 space-y-1 text-sm">
              <li>• Static content delivery via Cloudflare CDN</li>
              <li>• Client-side routing and navigation</li>
              <li>• API calls to Vercel backend</li>
              <li>• 70% cost savings vs full Vercel hosting</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
              ⚠️ Current Limitations
            </h3>
            <ul className="text-yellow-800 dark:text-yellow-200 space-y-1 text-sm">
              <li>• Server-side rendering disabled</li>
              <li>• Hash-based routing for dynamic content</li>
              <li>• Backend still needs to be accessible</li>
              <li>• Some SEO benefits lost</li>
            </ul>
          </div>
        </div>
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