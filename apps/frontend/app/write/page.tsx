'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Sparkles, Image, Smile, Palette, Wand2, AlertCircle, BookOpen, Plus, List, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

// Import enhanced components (only used in advanced mode)
import IPRegistrationSection from '../../components/creator/IPRegistrationSection'
import CollectionSection from '../../components/creator/CollectionSection'
import IPStatusIndicator from '../../components/creator/IPStatusIndicator'
import StoryContentDisplay from '../../components/ui/StoryContentDisplay'
import PublishingModal from '../../components/publishing/PublishingModal'
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

interface ExistingStory {
  id: string
  title: string
  genre: string
  chapters: number
  lastUpdated: string
  earnings: number
  preview: string
}

type CreationMode = 'select' | 'new' | 'continue'

function CreateStoryPageContent() {
  const { address: userAddress } = useAccount()
  const searchParams = useSearchParams()
  const [creationMode, setCreationMode] = useState<CreationMode>('select')
  const [plotDescription, setPlotDescription] = useState('A young detective discovers a hidden portal in their grandmother\'s attic that leads to different time periods. Each time they step through, they must solve a historical mystery to return home, but each journey reveals more about a family secret that spans centuries.')
  const [storyTitle, setStoryTitle] = useState('The Detective\'s Portal')
  const [selectedStory, setSelectedStory] = useState<ExistingStory | null>(null)
  const [chapterNumber, setChapterNumber] = useState(1)
  const [continueStoryId, setContinueStoryId] = useState<string | null>(null)

  // Existing state for multimodal inputs
  const [selectedMoods, setSelectedMoods] = useState<string[]>(['Suspenseful'])
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(['🔍', '⏰', '🏛️'])
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Mystery'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)
  const [showMultiModal, setShowMultiModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Publishing modal state
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false)

  // Advanced options (hidden by default)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [ipOptions, setIPOptions] = useState<Partial<EnhancedStoryCreationParams>>({
    registerAsIP: false,
    licenseType: 'standard',
    commercialRights: true,
    derivativeRights: true
  })
  const [collectionOptions, setCollectionOptions] = useState<Partial<EnhancedStoryCreationParams>>({})

    // Load existing stories for continue mode
  const [existingStories, setExistingStories] = useState<ExistingStory[]>([])

  // Load stories when continue mode is selected
  useEffect(() => {
    if (creationMode === 'continue') {
      const loadStoriesFromR2 = async () => {
        try {
          const response = await fetch('/api/stories')
          const data = await response.json()

          if (data.success && data.stories) {
            const convertedStories: ExistingStory[] = data.stories.map((story: any) => ({
              id: story.id,
              title: story.title,
              genre: story.genre,
              chapters: story.chapters,
              lastUpdated: story.lastUpdated,
              earnings: story.earnings,
              preview: story.preview
            }))
            setExistingStories(convertedStories)
          }
        } catch (error) {
          console.error('Error loading stories:', error)
        }
      }

      loadStoriesFromR2()
    }
  }, [creationMode])

  // Handle URL parameters for continuing stories
  useEffect(() => {
    const continueStory = searchParams.get('continueStory')
    const nextChapter = searchParams.get('nextChapter')
    const title = searchParams.get('title')
    const genre = searchParams.get('genre')

    if (continueStory && nextChapter && title) {
      console.log('🔄 Continuing story:', { continueStory, nextChapter, title, genre })
      
      // Set up the page for continuing an existing story
      setCreationMode('new') // Use new mode but with continuation context
      setContinueStoryId(continueStory)
      setChapterNumber(parseInt(nextChapter))
      setStoryTitle(decodeURIComponent(title))
      
      if (genre) {
        setSelectedGenres([decodeURIComponent(genre)])
      }
      
      // Update plot description to indicate this is a continuation
      setPlotDescription(`Continue the story "${decodeURIComponent(title)}" - Chapter ${nextChapter}. Build upon the previous chapters while maintaining the established tone, characters, and plot threads.`)
    }
  }, [searchParams])

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

  const handleSelectStory = (story: ExistingStory) => {
    setSelectedStory(story)
    setChapterNumber(story.chapters + 1)
    setCreationMode('continue')
    // Pre-fill with continuation context
    setPlotDescription(`Continue the story where ${story.preview}`)
  }

  const handleGenerate = async () => {
    if (!plotDescription.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      // If we're continuing a story, fetch previous chapters for context
      let previousContent = ''
      const isContinuation = continueStoryId !== null || (creationMode === 'continue' && selectedStory)
      const storyIdForContext = continueStoryId || selectedStory?.id

      if (isContinuation && storyIdForContext && chapterNumber > 1) {
        try {
          console.log(`🔄 Fetching previous chapters for story ${storyIdForContext}`)
          const contextResponse = await fetch(`/api/chapters/${storyIdForContext}/${chapterNumber - 1}`)
          
          if (contextResponse.ok) {
            const contextData = await contextResponse.json()
            if (contextData.success && contextData.chapter) {
              previousContent = contextData.chapter.content
              console.log(`✅ Loaded previous chapter context (${previousContent.length} chars)`)
            }
          }
        } catch (contextErr) {
          console.warn('Failed to fetch previous chapter context:', contextErr)
          // Continue without context if fetch fails
        }
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plotDescription: plotDescription.trim(),
          storyTitle: storyTitle.trim(),
          genres: selectedGenres,
          moods: selectedMoods,
          emojis: selectedEmojis,
          chapterNumber,
          isNewStory: !isContinuation,
          isContinuation,
          storyId: storyIdForContext, // Use storyId (not existingStoryId) for continuation
          existingStoryId: storyIdForContext, // Keep this for backward compatibility
          previousContent, // Include previous chapter content for better continuity
          // Include author information
          authorAddress: userAddress?.toLowerCase(),
          authorName: userAddress ? userAddress.slice(-4) : undefined
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

  const renderModeSelector = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-3xl font-bold text-gray-800 mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
          Create Your Story
        </div>
        <p className="text-gray-600 text-lg">Let AI help you bring imagination to life</p>
      </div>

      {/* Scenario Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setCreationMode('new')}
          className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">New Story</h3>
          <p className="text-gray-600 mb-4">Start fresh with AI help</p>
          <div className="inline-flex items-center gap-2 text-purple-600 font-medium">
            <span>Start Writing</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => setCreationMode('continue')}
          className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200"
        >
          <div className="text-4xl mb-4">➕</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Continue Existing Story</h3>
          <p className="text-gray-600 mb-4">Add next chapter</p>
          <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
            <span>Add Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <Link href="/own">
          <button className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-green-200">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">My Stories</h3>
            <p className="text-gray-600 mb-4">View all drafts & published</p>
            <div className="inline-flex items-center gap-2 text-green-600 font-medium">
              <span>Browse All</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </Link>
      </div>

      {/* Help Text */}
      <div className="text-center bg-purple-50 rounded-lg p-4">
        <p className="text-purple-800">
          💡 Don't worry about blockchain stuff yet - just focus on creating great content!
          We'll handle IP protection later.
        </p>
      </div>
    </div>
  )

  const renderContinueStoryMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setCreationMode('select')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800">➕ Continue Your Story</h2>
      </div>

      {/* Story Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Select story to continue:</h3>

        <div className="space-y-3">
          {existingStories.map((story) => (
            <motion.button
              key={story.id}
              onClick={() => handleSelectStory(story)}
              whileHover={{ scale: 1.01 }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedStory?.id === story.id
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedStory?.id === story.id ? 'bg-purple-600' : 'bg-gray-300'
                    }`} />
                    <h4 className="font-semibold text-gray-800">{story.title}</h4>
                    <span className="text-sm text-gray-500">📊 {story.chapters} chap</span>
                    <span className="text-sm text-green-600">💰 {story.earnings} $TIP</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{story.genre} • Last updated {story.lastUpdated}</p>
                  <p className="text-sm text-gray-500 italic">"{story.preview}"</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Continue Writing Interface */}
      {selectedStory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ✨ What happens next in "{selectedStory.title}"?
          </h3>

          <textarea
            value={plotDescription}
            onChange={(e) => setPlotDescription(e.target.value)}
            placeholder={`Continue from: "${selectedStory.preview}"\n\nDescribe what happens in Chapter ${chapterNumber}...`}
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
            maxLength={500}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{plotDescription.length}/500 characters</span>
            <button
              onClick={handleGenerate}
              disabled={!plotDescription.trim() || isGenerating}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                plotDescription.trim() && !isGenerating
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              {isGenerating ? 'Generating...' : `Generate Chapter ${chapterNumber} with AI`}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )

  const renderNewStoryMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setCreationMode('select')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {continueStoryId ? `➕ Continue Your Story: ${storyTitle}` : '📝 Start Your New Story'}
        </h2>
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

      {/* Story Continuation Info */}
      {continueStoryId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-blue-800 font-medium">Continuing Story</h4>
              <p className="text-blue-700 text-sm mt-1">
                You're writing Chapter {chapterNumber} of "{storyTitle}". 
                The AI will use the previous chapter context to maintain story continuity.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                <span className="px-2 py-1 bg-blue-100 rounded">
                  {selectedGenres[0] || 'Fiction'}
                </span>
                <span>•</span>
                <span>Chapter {chapterNumber}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Story Title */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <label className="block text-lg font-semibold text-gray-800 mb-4">
          📖 Story Title (optional):
        </label>
        <input
          type="text"
          value={storyTitle}
          onChange={(e) => setStoryTitle(e.target.value)}
          placeholder="The Detective's Portal"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          maxLength={100}
        />
      </div>

      {/* Plot Description */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-6">🎨 Add inspiration (optional):</h3>

            {/* Emoji Selection */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-3">
                😀 Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.slice(0, 8).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleSelection(emoji, selectedEmojis, setSelectedEmojis)}
                    className={`p-2 text-xl rounded-lg transition-all ${
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
                🎭 Genre
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleSelection(genre, selectedGenres, setSelectedGenres)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
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

            {/* Style Selection */}
            <div>
              <label className="block text-md font-medium text-gray-700 mb-3">
                🎨 Style
              </label>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => toggleSelection(mood, selectedMoods, setSelectedMoods)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
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
      <div className="text-center mb-6">
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
          {isGenerating ? `Generating Chapter ${chapterNumber}...` : `✨ Generate Chapter ${chapterNumber} with AI`}
        </motion.button>

        {plotDescription.trim() && (
          <p className="text-sm text-gray-500 mt-2">
            💡 This will be Chapter {chapterNumber} of your {continueStoryId ? 'continued' : 'new'} story
          </p>
        )}
      </div>

      {/* Advanced Options Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          🤔 Questions? Advanced Options?
        </button>
      </div>

      {/* Advanced Options (Collapsed by default) */}
      <AnimatePresence>
        {showAdvancedOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📚 What are Story Collections?</h4>
              <p className="text-sm text-blue-700">Group stories together for shared themes and revenue. Perfect for series or related content.</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">🛡️ What is IP Protection?</h4>
              <p className="text-sm text-purple-700">Register your story on the blockchain for enhanced copyright protection and licensing control. You can add this later!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )


  const renderGeneratedContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Input
        </button>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleRegenerate}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            🔄 Regenerate
          </motion.button>

          <motion.button
            onClick={() => setIsPublishingModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            <span>🎉</span>
            Publish Chapter
          </motion.button>
        </div>
      </div>

      {/* Enhanced Story Display with Reading Preferences */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <StoryContentDisplay
          title={generatedStory?.title || `Chapter ${chapterNumber}${selectedStory ? `: ${selectedStory.title}` : ''}`}
          content={generatedStory?.content || ''}
          wordCount={generatedStory?.wordCount || 0}
          readingTime={generatedStory?.readingTime || 0}
          themes={generatedStory?.themes || []}
          contentRating="PG-13"
          showHeader={true}
          showToolbar={true}
          className="p-8"
        />

        {/* Publishing Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {/* Publishing Options Preview */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">🚀 Ready to publish?</h4>
            <p className="text-sm text-green-700 mb-3">
              You can publish immediately or add IP protection later. Both options earn $TIP tokens!
            </p>
            <div className="space-y-2 text-sm">
              <div className="text-green-700">✅ Simple Publish: Start earning immediately</div>
              <div className="text-blue-700">🛡️ IP Protection: Enhanced licensing (add later)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              🔄 Regenerate
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              ✏️ Edit Content
            </button>
            <button
              onClick={() => {
                if (selectedStory) {
                  setCreationMode('continue')
                  setPlotDescription('')
                  setChapterNumber(chapterNumber + 1)
                } else {
                  setCreationMode('new')
                  setPlotDescription('')
                }
                setGeneratedStory(null)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              ➕ Continue Story
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to StoryHouse</span>
            </Link>

            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!generatedStory ? (
          <>
            {creationMode === 'select' && renderModeSelector()}
            {creationMode === 'continue' && renderContinueStoryMode()}
            {creationMode === 'new' && renderNewStoryMode()}
          </>
        ) : (
          renderGeneratedContent()
        )}
      </div>

      {/* Publishing Modal */}
      {generatedStory && (
        <PublishingModal
          isOpen={isPublishingModalOpen}
          onClose={() => setIsPublishingModalOpen(false)}
          story={generatedStory}
          chapterNumber={chapterNumber}
          storyTitle={selectedStory ? selectedStory.title : storyTitle}
        />
      )}
    </div>
  )
}

export default function CreateStoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>}>
      <CreateStoryPageContent />
    </Suspense>
  )
}
