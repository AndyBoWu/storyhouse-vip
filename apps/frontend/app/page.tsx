'use client'

import { PenTool } from 'lucide-react'
import Link from 'next/link'
import WalletConnect from '@/components/WalletConnect'
import FeatureCards from '@/components/features/FeatureCards'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-pink-200 to-blue-300">
      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Link href="/read">
                  <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                    📖 READ
                  </button>
                </Link>

                <Link href="/write">
                  <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                    <PenTool className="h-4 w-4" />
                    WRITE
                  </button>
                </Link>

                <Link href="/own">
                  <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                    👑 OWN
                  </button>
                </Link>
              </div>

              <WalletConnect />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="container mx-auto px-6 py-8">
          {/* <NetworkChecker /> */}

          <div className="mx-auto max-w-4xl text-center py-12">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="mb-8 text-5xl font-bold leading-tight tracking-tight lg:text-7xl">
                <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent drop-shadow-sm">
                  Explore Infinite Worlds,
                </span>
                <span className="block bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent animate-pulse-slow drop-shadow-sm">
                  Create Without Limits
                </span>
              </h1>

              <p className="mb-10 text-xl text-gray-600 leading-relaxed lg:text-2xl max-w-3xl mx-auto">
                Discover stories that transport you to new dimensions.
                <br />
                Build worlds that live forever in the Universe.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/read">
                  <button className="rounded-full bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:bg-red-700">
                    Start Reading
                  </button>
                </Link>

                <Link href="/write">
                  <button className="rounded-full border-2 border-gray-800 px-8 py-4 text-lg font-semibold text-gray-800 transition-all hover:bg-gray-800 hover:text-white">
                    Create Your Story
                  </button>
                </Link>
              </div>
            </div>

            {/* Features Section */}
            <FeatureCards />

            {/* Story Protocol Badge */}
            <div className="mt-16">
              <p className="text-gray-600">Proudly built on and powered by</p>
              <div className="mt-2 text-2xl font-bold text-gray-800">
                Story Protocol L1 Blockchain
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
