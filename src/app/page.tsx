'use client'

import { PenTool } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import WalletConnect, { NetworkChecker } from '@/components/WalletConnect'
import FaucetHelper from '@/components/FaucetHelper'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-gradient">
      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
                StoryHouse.vip
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <WalletConnect />

              <Link href="/create">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
                >
                  <PenTool className="h-4 w-4" />
                  Write
                </motion.button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="container mx-auto px-6 py-8">
          <NetworkChecker />
          <FaucetHelper />

          <div className="mx-auto max-w-4xl text-center py-12">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <h1 className="mb-6 text-4xl font-bold text-white lg:text-6xl">
                Read Stories, Earn Tokens,{' '}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Create with AI
                </span>
              </h1>

              <p className="mb-8 text-xl text-white/90 lg:text-2xl">
                First 3 chapters FREE. Earn $TIP tokens while reading.
                <br />
                Remix content and earn from your creativity.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-gray-800 shadow-lg transition-all hover:shadow-xl"
                >
                  Start Reading Free
                </motion.button>

                <Link href="/create">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass rounded-full border border-white/30 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
                  >
                    Create Your Story
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid gap-8 md:grid-cols-3"
            >
              <div className="glass rounded-xl p-6 text-white">
                <div className="mb-4 text-4xl">📚</div>
                <h3 className="mb-2 text-xl font-bold">Read & Earn</h3>
                <p className="text-white/80">
                  Earn $TIP tokens for every chapter you read. Your reading pays for itself!
                </p>
              </div>

              <div className="glass rounded-xl p-6 text-white">
                <div className="mb-4 text-4xl">🤖</div>
                <h3 className="mb-2 text-xl font-bold">AI-Powered Writing</h3>
                <p className="text-white/80">
                  Create stories with AI assistance. Multi-modal inputs bring your ideas to life.
                </p>
              </div>

              <div className="glass rounded-xl p-6 text-white">
                <div className="mb-4 text-4xl">🔄</div>
                <h3 className="mb-2 text-xl font-bold">Remix & Earn</h3>
                <p className="text-white/80">
                  Remix existing stories and earn licensing fees. Recursive creativity economy.
                </p>
              </div>
            </motion.div>

            {/* Story Protocol Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16"
            >
              <p className="text-white/60">Built on</p>
              <div className="mt-2 text-2xl font-bold text-white">
                Story Protocol Layer 1
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
