'use client'

import Link from 'next/link'
import WalletConnect from '@/components/WalletConnect'
import FeatureCards from '@/components/features/FeatureCards'
import { ReadIcon, WriteIcon, OwnIcon } from '@/components/ui/icons'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-pink-200 to-blue-300">
      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Left side - Logo and Main navigation */}
            <div className="flex items-center gap-8">
              {/* Logo/Brand */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-gray-800 hidden sm:block">StoryHouse</span>
              </Link>
              
              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
              <Link href="/read">
                <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md hover:scale-105">
                  <ReadIcon className="transition-transform group-hover:scale-110" />
                  <span>READ</span>
                </button>
              </Link>

              <Link href="/write">
                <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md hover:scale-105">
                  <WriteIcon className="transition-transform group-hover:scale-110" />
                  <span>WRITE</span>
                </button>
              </Link>

              <Link href="/own">
                <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md hover:scale-105">
                  <OwnIcon className="transition-transform group-hover:scale-110" />
                  <span>OWN</span>
                </button>
              </Link>
              </div>
            </div>

            {/* Right side - Wallet connection */}
            <WalletConnect />
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
                  <button className="group relative rounded-full bg-gradient-to-r from-red-500 to-red-600 px-12 py-5 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 min-w-[240px] overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Start Reading
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -top-2 h-[120%] w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000"></div>
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-orange-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  </button>
                </Link>

                <Link href="/write">
                  <button className="group relative rounded-full bg-white/70 backdrop-blur-sm border-2 border-gray-700/20 px-12 py-5 text-lg font-semibold text-gray-800 transition-all duration-300 hover:bg-white/90 hover:border-gray-700/30 hover:shadow-xl hover:scale-105 min-w-[240px] overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Create Your Story
                    </span>
                    {/* Subtle gradient background on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white to-gray-50 opacity-0 transition-opacity duration-300 group-hover:opacity-50 -z-10"></div>
                  </button>
                </Link>
              </div>
            </div>

            {/* Features Section */}
            <FeatureCards />

            {/* Story Protocol Badge */}
            <div className="mt-20 relative">
              <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-10 shadow-lg border border-white/70 transition-all duration-300 hover:shadow-xl hover:bg-white/70">
                {/* Badge/Logo area */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                
                {/* Text content */}
                <p className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-2">
                  Powered by Next-Generation Technology
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                  Story Protocol
                </h3>
                <p className="text-lg text-gray-700 font-medium mt-1">
                  Layer 1 Blockchain Infrastructure
                </p>
                
                {/* Features/Benefits */}
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Decentralized IP Rights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant Royalty Distribution</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure & Transparent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
