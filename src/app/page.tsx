'use client'

import { PenTool } from 'lucide-react'
import { motion } from 'framer-motion'

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

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 lg:text-base"
            >
              <PenTool size={20} />
              Write
            </motion.button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white lg:text-6xl">
              <span className="block">Read Stories,</span>
              <span className="block">Earn Tokens,</span>
              <span className="block">Create with AI</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 text-lg text-white/90 lg:text-xl"
          >
            First 3 chapters FREE. Earn $TIP tokens while reading.
            <br className="hidden sm:block" />
            Remix content and earn from your creativity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-brand-accent px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:bg-amber-600 hover:shadow-2xl"
            >
              Start Reading Free
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass rounded-full px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/20"
            >
              Create Your Story
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm text-white/80 lg:text-base"
          >
            No wallet needed to start • Powered by Story Protocol
          </motion.p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-sm text-white/70">
            © 2025 StoryHouse.vip - Built on Story Protocol
          </p>
        </div>
      </footer>
    </div>
  )
}
