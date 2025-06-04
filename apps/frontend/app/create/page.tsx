'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Sparkles, Image, Smile, Palette, Wand2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Import enhanced components
import IPRegistrationSection from '../../components/creator/IPRegistrationSection'
import CollectionSection from '../../components/creator/CollectionSection'
import IPStatusIndicator from '../../components/creator/IPStatusIndicator'
import type {
  EnhancedGeneratedStory,
  EnhancedStoryCreationParams
} from '@storyhouse/shared'

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

  // Enhanced story creation options
  const [ipOptions, setIPOptions] = useState<Partial<EnhancedStoryCreationParams>>({
    registerAsIP: false,
    licenseType: 'standard',
    commercialRights: true,
    derivativeRights: true
  })

  const [collectionOptions, setCollectionOptions] = useState<Partial<EnhancedStoryCreationParams>>({})

  // Mock enhanced story for demonstration
  const [mockEnhancedStory] = useState({
    id: 'demo-story',
    title: 'Demo Story',
    description: 'A demo story for testing',
    content: 'Demo content',
    author: 'Demo Author',
    authorAddress: '0x123...',
    genre: 'Fantasy',
    mood: 'Epic Adventure',
    emoji: '🌟',
    chapters: [],
    isRemix: false,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    wordCount: 1000,
    readingTime: 5,
    totalRewards: 0,
    isPublished: true,
    ipRegistrationStatus: 'none' as const,
    licenseStatus: 'none' as const,
    availableLicenseTypes: [],
    royaltyEarnings: 0,
    hasClaimableRoyalties: false,
    collections: []
  })

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

  const handleIPOptionsChange = (options: Partial<EnhancedStoryCreationParams>) => {
    setIPOptions(prev => ({ ...prev, ...options }))
  }

  const handleCollectionOptionsChange = (options: Partial<EnhancedStoryCreationParams>) => {
    setCollectionOptions(prev => ({ ...prev, ...options }))
  }

  const handleGenerate = async () => {
    if (!plotDescription.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      // Combine all options for enhanced story creation
      const enhancedParams: EnhancedStoryCreationParams = {
        plotDescription: plotDescription.trim(),
        genre: selectedGenres[0] || 'Adventure',
        mood: selectedMoods[0] || 'Epic Adventure',
        emoji: selectedEmojis[0] || '🌟',
        maxWords: 1000,
        registerAsIP: ipOptions.registerAsIP || false,
        licenseType: ipOptions.licenseType || 'standard',
        commercialRights: ipOptions.commercialRights ?? true,
        derivativeRights: ipOptions.derivativeRights ?? true,
        ...collectionOptions
      }

      console.log('Enhanced story creation params:', enhancedParams)

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
          chapterNumber: 1,
          // Pass enhanced options to API
          ipOptions: enhancedParams.registerAsIP ? enhancedParams : undefined
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

  const handlePublish = async () => {
    if (!generatedStory) return

    try {
      // Enhanced publish with IP options
      const publishData = {
        ...generatedStory,
        genres: selectedGenres,
        moods: selectedMoods,
        emojis: selectedEmojis,
        ipOptions: ipOptions.registerAsIP ? ipOptions : undefined,
        collectionOptions
      }

      console.log('Publishing enhanced story:', publishData)

      // TODO: Implement actual publish API call
      alert('Story published with enhanced features! (Demo mode)')
    } catch (err) {
      console.error('Publish error:', err)
      setError('Failed to publish story. Please try again.')
    }
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
          /* Enhanced Story Creation Interface */
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
              <p className="text-gray-600 text-lg">Let AI help you bring your imagination to life with enhanced IP protection</p>
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

            {/* IP Registration Section */}
            <div className="mb-6">
              <IPRegistrationSection
                onIPOptionsChange={handleIPOptionsChange}
                initialOptions={ipOptions}
                isCollapsed={!plotDescription.trim()}
              />
            </div>

            {/* Collection Section */}
            <div className="mb-6">
              <CollectionSection
                onCollectionOptionsChange={handleCollectionOptionsChange}
                initialOptions={collectionOptions}
                isCollapsed={!plotDescription.trim()}
              />
            </div>

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
                {isGenerating ? 'Generating Enhanced Chapter...' : 'Generate Enhanced Chapter 1'}
              </motion.button>
            </div>

            {/* Enhanced Creation Summary */}
            {(ipOptions.registerAsIP || collectionOptions.addToCollection || collectionOptions.createNewCollection) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
              >
                <h4 className="font-semibold text-blue-800 mb-3">Enhanced Story Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {ipOptions.registerAsIP && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700">
                        IP Protection: {ipOptions.licenseType} license ({ipOptions.licenseType === 'standard' ? '100' : ipOptions.licenseType === 'premium' ? '500' : '2000'} TIP)
                      </span>
                    </div>
                  )}
                  {collectionOptions.addToCollection && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-700">
                        Joining existing collection
                      </span>
                    </div>
                  )}
                  {collectionOptions.createNewCollection && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-700">
                        Creating new collection: {collectionOptions.createNewCollection.name}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

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
                <p className="text-gray-600">Creating your enhanced story chapter...</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>💡 Your plot: "{plotDescription.slice(0, 50)}..."</p>
                  {selectedGenres.length > 0 && <p>🎭 Genres: {selectedGenres.join(', ')}</p>}
                  {selectedMoods.length > 0 && <p>🎨 Mood: {selectedMoods.join(', ')}</p>}
                  {ipOptions.registerAsIP && <p>🛡️ IP Protection: Enabled</p>}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Generated Content Preview with IP Status */
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
                onClick={handlePublish}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                <span>🚀</span>
                Publish Enhanced Story
              </motion.button>
            </div>

            {/* IP Status Indicator */}
            {ipOptions.registerAsIP && (
              <div className="mb-6">
                <IPStatusIndicator
                  story={mockEnhancedStory}
                  compact={true}
                />
              </div>
            )}

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

              {/* Enhanced Story Metadata */}
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

                {/* Enhanced Features Summary */}
                {(ipOptions.registerAsIP || collectionOptions.addToCollection || collectionOptions.createNewCollection) && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Enhanced Features Applied:</h4>
                    <div className="space-y-1 text-sm">
                      {ipOptions.registerAsIP && (
                        <div className="text-blue-700">✓ IP Asset Registration: {ipOptions.licenseType} license</div>
                      )}
                      {collectionOptions.addToCollection && (
                        <div className="text-purple-700">✓ Added to existing collection</div>
                      )}
                      {collectionOptions.createNewCollection && (
                        <div className="text-green-700">✓ New collection created: {collectionOptions.createNewCollection.name}</div>
                      )}
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
