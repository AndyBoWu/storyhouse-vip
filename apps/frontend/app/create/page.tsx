'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Sparkles, Image, Smile, Palette, Wand2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface GeneratedStory {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
}

export default function CreateStoryPage() {
  const [plotDescription, setPlotDescription] = useState('')
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)
  const [showMultiModal, setShowMultiModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const genres = ['Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Horror', 'Comedy', 'Adventure', 'Drama']
  const moods = ['Dark & Gritty', 'Light & Whimsical', 'Epic Adventure', 'Romantic', 'Suspenseful', 'Humorous']
  const emojiOptions = ['😊', '😢', '😱', '😍', '🔥', '⚡', '🌟', '💀', '🦸', '👑', '🎭', '🎪', '🌙', '⭐', '💎', '🚀']

  const toggleSelection = (item: string, currentSelection: string[], setSelection: (items: string[]) => void) => {
    if (currentSelection.includes(item)) {
      setSelection(currentSelection.filter(i => i !== item))
    } else {
      setSelection([...currentSelection, item])
    }
  }

  const handleGenerate = async () => {
    if (!plotDescription.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plotDescription: plotDescription.trim(),
          genres: selectedGenres,
          moods: selectedMoods,
          emojis: selectedEmojis,
          chapterNumber: 1
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate story')
      }

      if (result.success && result.data) {
        setGeneratedStory(result.data)
      } else {
        throw new Error('Invalid response from AI service')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate story. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setGeneratedStory(null)
    handleGenerate()
  }

  const handleEdit = () => {
    setGeneratedStory(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to StoryHouse</span>
            </Link>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!generatedStory ? (
          /* Story Creation Interface */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 text-3xl font-bold text-gray-800 mb-4"
              >
                <Sparkles className="w-8 h-8 text-purple-600" />
                Create Your Story
              </motion.div>
              <p className="text-gray-600 text-lg">Let AI help you bring your imagination to life</p>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
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
              </motion.div>
            )}

            {/* Plot Description */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                📝 Describe your story plot:
              </label>
              <textarea
                value={plotDescription}
                onChange={(e) => setPlotDescription(e.target.value)}
                placeholder="A young detective discovers a hidden portal in their grandmother's attic that leads to..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">{plotDescription.length}/500 characters</span>
                <button
                  onClick={() => setShowMultiModal(!showMultiModal)}
                  className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Add Inspiration
                </button>
              </div>
            </div>

            {/* Multi-Modal Input Panel */}
            <AnimatePresence>
              {showMultiModal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-lg p-8 mb-6"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Add Creative Elements</h3>

                  {/* Image Upload */}
                  <div className="mb-6">
                    <label className="block text-md font-medium text-gray-700 mb-3">
                      📷 Upload Images (Coming Soon)
                    </label>
                    <div className="flex gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">Coming Soon</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emoji Selection */}
                  <div className="mb-6">
                    <label className="block text-md font-medium text-gray-700 mb-3">
                      😀 Choose Emojis
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => toggleSelection(emoji, selectedEmojis, setSelectedEmojis)}
                          className={`p-2 text-2xl rounded-lg transition-all ${
                            selectedEmojis.includes(emoji)
                              ? 'bg-purple-100 border-2 border-purple-400 scale-110'
                              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre Selection */}
                  <div className="mb-6">
                    <label className="block text-md font-medium text-gray-700 mb-3">
                      🎭 Select Genre
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => toggleSelection(genre, selectedGenres, setSelectedGenres)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedGenres.includes(genre)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Selection */}
                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-3">
                      🎨 Style Preferences
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {moods.map((mood) => (
                        <button
                          key={mood}
                          onClick={() => toggleSelection(mood, selectedMoods, setSelectedMoods)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedMoods.includes(mood)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <div className="text-center">
              <motion.button
                onClick={handleGenerate}
                disabled={!plotDescription.trim() || isGenerating}
                whileHover={plotDescription.trim() && !isGenerating ? { scale: 1.05 } : {}}
                whileTap={plotDescription.trim() && !isGenerating ? { scale: 0.95 } : {}}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                  plotDescription.trim() && !isGenerating
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Wand2 className="w-5 h-5" />
                {isGenerating ? 'Generating Chapter 1...' : 'Generate Chapter 1'}
              </motion.button>
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-white rounded-xl shadow-lg p-8 text-center"
              >
                <div className="text-2xl mb-4">🤖 AI Writing...</div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 15, ease: "easeInOut" }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full"
                  />
                </div>
                <p className="text-gray-600">Creating your story chapter...</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>💡 Your plot: "{plotDescription.slice(0, 50)}..."</p>
                  {selectedGenres.length > 0 && <p>🎭 Genres: {selectedGenres.join(', ')}</p>}
                  {selectedMoods.length > 0 && <p>🎨 Mood: {selectedMoods.join(', ')}</p>}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Generated Content Preview */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Input
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                <span>🚀</span>
                Publish
              </motion.button>
            </div>

            {/* Generated Chapter */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
                {generatedStory.title}
              </h1>

              <div className="prose prose-lg max-w-none">
                {generatedStory.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Story Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Word count: {generatedStory.wordCount.toLocaleString()}</span>
                  <span>Estimated reading time: {generatedStory.readingTime} min</span>
                </div>

                {/* Themes */}
                {generatedStory.themes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Story themes:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedStory.themes.map((theme) => (
                        <span
                          key={theme}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    🔄 Regenerate
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    ✏️ Edit
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors">
                    ➕ Continue Story
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    📊 Analytics
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
