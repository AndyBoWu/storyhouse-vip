'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import WhitepaperContent from '@/components/ui/WhitepaperContent'

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold">📚 StoryHouse.vip</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              StoryHouse.vip Tokenomics Whitepaper
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Comprehensive overview of our revolutionary Web3 storytelling platform, 
              tokenomics, and the future of content creation.
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="text-3xl font-bold text-blue-600 mb-2">10B</div>
              <div className="text-gray-600">TIP Token Supply</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="text-3xl font-bold text-green-600 mb-2">$637B</div>
              <div className="text-gray-600">Total Addressable Market</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="text-3xl font-bold text-purple-600 mb-2">3-Tier</div>
              <div className="text-gray-600">Licensing System</div>
            </div>
          </div>

          {/* Whitepaper Content */}
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <WhitepaperContent />
          </div>

          {/* Related Resources */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                href="/docs" 
                className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">📋</div>
                  <h3 className="text-lg font-semibold">Technical Documentation</h3>
                </div>
                <p className="text-gray-600">
                  Complete technical architecture, API reference, and development guides.
                </p>
              </Link>
              
              <Link 
                href="/roadmap" 
                className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">🗺️</div>
                  <h3 className="text-lg font-semibold">Product Roadmap</h3>
                </div>
                <p className="text-gray-600">
                  Future development phases and platform evolution strategy.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}