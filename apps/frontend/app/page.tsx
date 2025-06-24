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
                  Explore Infinite Worlds
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

              <div className="flex flex-col gap-6 sm:flex-row sm:justify-center sm:gap-8">
                <Link href="/read">
                  <button className="group relative rounded-full bg-gradient-to-r from-red-500 to-red-600 px-10 py-5 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:from-red-600 hover:to-red-700 hover:animate-none min-w-[200px] animate-subtle-bounce">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Start Reading
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
                  </button>
                </Link>

                <Link href="/write">
                  <button className="group relative rounded-full border-2 border-gray-800 bg-white/80 backdrop-blur-sm px-10 py-5 text-lg font-semibold text-gray-800 transition-all duration-300 hover:bg-gray-800 hover:text-white hover:shadow-xl hover:scale-105 hover:border-gray-900 min-w-[200px]">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Create Your Story
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"></div>
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
