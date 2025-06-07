'use client'

import { PenTool } from 'lucide-react'
import Link from 'next/link'
import WalletConnect from '@/components/WalletConnect'

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
              <h1 className="mb-6 text-4xl font-bold text-gray-900 lg:text-6xl">
                Explore Infinite Worlds,{' '}
                <span className="text-red-600">
                  Create Without Limits
                </span>
              </h1>

              <p className="mb-8 text-xl text-gray-700 lg:text-2xl">
                Discover stories that transport you to new dimensions.
                <br />
                Build worlds that live forever on the Internet.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <button className="rounded-full bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:bg-red-700">
                  Start Reading Free
                </button>

                <Link href="/write">
                  <button className="rounded-full border-2 border-gray-800 px-8 py-4 text-lg font-semibold text-gray-800 transition-all hover:bg-gray-800 hover:text-white">
                    Create Your Story
                  </button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-gray-800 border border-white/50">
                <div className="mb-4 text-4xl">📚</div>
                <h3 className="mb-2 text-xl font-bold">Immerse & Discover</h3>
                <p className="text-gray-600">
                  Dive deep into captivating narratives. Every chapter opens new dimensions of possibility.
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-gray-800 border border-white/50">
                <div className="mb-4 text-4xl">🤖</div>
                <h3 className="mb-2 text-xl font-bold">Dream & Create</h3>
                <p className="text-gray-600">
                  Transform imagination into reality with AI. Your wildest ideas become living stories.
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-gray-800 border border-white/50">
                <div className="mb-4 text-4xl">🔄</div>
                <h3 className="mb-2 text-xl font-bold">Expand & Evolve</h3>
                <p className="text-gray-600">
                  Build upon existing worlds. Create infinite variations that spawn new universes.
                </p>
              </div>
            </div>

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
