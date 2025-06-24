'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Sparkles, Image, Smile, Palette, Wand2, AlertCircle, BookOpen, Plus, List, ChevronRight, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { apiClient } from '@/lib/api-client'
import { useStoryProtocol } from '@/hooks/useStoryProtocol'
import { useBookRegistration } from '@/hooks/useBookRegistration'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

// Import enhanced components (only used in advanced mode)
import IPRegistrationSection from '../../../components/creator/IPRegistrationSection'
import LicenseSelector from '../../../components/licensing/LicenseSelector'
import type { LicenseTemplate } from '../../../components/licensing/LicenseSelector'
import CollectionSection from '../../../components/creator/CollectionSection'
import IPStatusIndicator from '../../../components/creator/IPStatusIndicator'
import StoryContentDisplay from '../../../components/ui/StoryContentDisplay'
import PublishingModal from '../../../components/publishing/PublishingModal'
import QuickNavigation from '../../../components/ui/QuickNavigation'
import type {
  EnhancedGeneratedStory,
  EnhancedStoryCreationParams
} from '@/lib/types/shared'

interface GeneratedStory {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
}

function NewStoryPageContent() {
  const { address: userAddress } = useAccount()
  const router = useRouter()
  const { registerChapterAsIP, isReady, isWalletConnected } = useStoryProtocol()
  const { registerBook: registerBookForRevenue, isSupported: isRevenueSupported } = useBookRegistration()
  const [plotDescription, setPlotDescription] = useState('')
  const [storyTitle, setStoryTitle] = useState('')

  // Existing state for multimodal inputs
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)
  const [showMultiModal, setShowMultiModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Book cover state
  const [bookCover, setBookCover] = useState<File | null>(null)
  const [bookCoverPreview, setBookCoverPreview] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  // Publishing modal state
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false)
  
  // Book registration state
  const [isRegistering, setIsRegistering] = useState(false)

  // Advanced options (hidden by default)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [ipOptions, setIPOptions] = useState<Partial<EnhancedStoryCreationParams>>({
    registerAsIP: false,
    licenseType: 'standard',
    commercialRights: true,
    derivativeRights: true
  })
  const [collectionOptions, setCollectionOptions] = useState<Partial<EnhancedStoryCreationParams>>({})
  const [selectedLicenseTemplate, setSelectedLicenseTemplate] = useState<LicenseTemplate | null>(null)

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

  const handleLicenseSelect = (licenseId: string, template: LicenseTemplate) => {
    setSelectedLicenseTemplate(template)
    setIPOptions({
      ...ipOptions,
      licenseType: licenseId as 'standard' | 'premium' | 'exclusive',
      commercialRights: template.terms.commercialUse,
      derivativeRights: template.terms.derivativesAllowed
    })
  }

  // Book cover upload functions
  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, WebP)')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      setBookCover(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setBookCoverPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverRemove = () => {
    setBookCover(null)
    setBookCoverPreview(null)
  }

  const handleCoverDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      // Create a proper FileList-like object
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => index === 0 ? file : null,
        [Symbol.iterator]: function* () { yield file }
      } as FileList
      
      const fakeEvent = {
        target: { files: fileList }
      } as React.ChangeEvent<HTMLInputElement>
      
      handleCoverUpload(fakeEvent)
    }
  }

  const handleCoverDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleRegisterBook = async () => {
    if (!plotDescription.trim() || !isWalletConnected) {
      setError(isWalletConnected ? 'Please provide a story plot' : 'Please connect your wallet to register a book')
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      // Step 1: Upload book cover to R2 if provided
      let bookCoverUrl: string | undefined
      if (bookCover) {
        try {
          setIsUploadingCover(true)
          const formData = new FormData()
          formData.append('file', bookCover)
          formData.append('type', 'cover')
          formData.append('storyTitle', storyTitle.trim() || 'Untitled Story')
          
          const uploadData = await apiClient.uploadContent(formData)
          
          if (uploadData.success && uploadData.url) {
            bookCoverUrl = uploadData.url
            console.log('📚 Book cover uploaded:', bookCoverUrl)
          } else {
            console.warn('Cover upload failed, continuing without cover')
          }
        } catch (coverError) {
          console.warn('Cover upload error:', coverError)
          // Continue without cover if upload fails
        } finally {
          setIsUploadingCover(false)
        }
      }

      // Step 2: Register book as IP Asset on blockchain
      const bookMetadata = {
        title: storyTitle.trim() || 'Untitled Story',
        description: plotDescription.trim(),
        author: userAddress || 'Unknown',
        genres: selectedGenres,
        moods: selectedMoods,
        emojis: selectedEmojis,
        coverUrl: bookCoverUrl,
        createdAt: new Date().toISOString()
      }

      console.log('📝 Registering book on blockchain...', {
        title: bookMetadata.title,
        hasDescription: !!bookMetadata.description,
        hasCover: !!bookCoverUrl,
        author: bookMetadata.author
      })

      // Create initial chapter data for registration
      const chapterData = {
        storyId: `book-${Date.now()}`,
        chapterNumber: 0, // Use 0 for book registration
        title: bookMetadata.title,
        content: `Book: ${bookMetadata.title}\n\nDescription: ${bookMetadata.description}`,
        contentUrl: bookCoverUrl || '',
        metadata: {
          suggestedTags: [...selectedGenres, ...selectedMoods],
          suggestedGenre: selectedGenres[0] || 'General',
          contentRating: 'G',
          language: 'en',
          qualityScore: 85,
          originalityScore: 90,
          commercialViability: 80,
          bookMetadata: bookMetadata
        }
      }

      // Register with MetaMask signature
      const registrationResult = await registerChapterAsIP(chapterData)

      if (!registrationResult.success) {
        throw new Error(registrationResult.error || 'Book registration failed')
      }

      console.log('✅ Book registration successful!', registrationResult)

      // Step 3: Register book for revenue sharing (HybridRevenueControllerV2)
      let revenueRegistrationSuccess = false
      if (isRevenueSupported && userAddress) {
        try {
          console.log('💰 Registering book for revenue sharing...')
          
          // Create bookId in the proper format: authorAddress/slug
          const slug = bookMetadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const revenueBookId = `${userAddress.toLowerCase()}/${slug}`
          
          const revenueResult = await registerBookForRevenue({
            bookId: revenueBookId,
            totalChapters: 100, // Current contract maximum (will be increased when contract is redeployed)
            isDerivative: false,
            ipfsMetadataHash: '' // We don't have IPFS metadata for this flow
          })
          
          if (revenueResult?.success) {
            console.log('✅ Revenue sharing registration successful!')
            revenueRegistrationSuccess = true
          } else {
            console.warn('⚠️ Revenue sharing registration failed:', revenueResult?.error || 'Unknown error')
            // Don't fail the entire process - just log the warning
          }
        } catch (revenueError) {
          console.warn('⚠️ Revenue sharing registration error:', revenueError)
          // Don't fail the entire process - revenue sharing is optional
        }
      } else {
        console.log('ℹ️ Revenue sharing not available (controller not deployed or wallet not connected)')
      }

      // Step 4: Upload book metadata to R2 using existing book registration endpoint
      try {
        console.log('📝 Preparing book registration form data...')
        const formData = new FormData()
        formData.append('title', bookMetadata.title)
        formData.append('description', bookMetadata.description)
        formData.append('authorAddress', bookMetadata.author)
        formData.append('authorName', bookMetadata.author.slice(-4)) // Short name from address
        formData.append('genres', JSON.stringify(bookMetadata.genres))
        formData.append('contentRating', 'G') // Default rating
        // Use selected license configuration
        const licenseConfig = {
          commercialUse: ipOptions.licenseType !== 'standard',
          derivativesAllowed: true,
          commercialRevShare: ipOptions.licenseType === 'exclusive' ? 25 : 
                              ipOptions.licenseType === 'premium' ? 10 : 0,
          licenseType: ipOptions.licenseType,
          licensePrice: ipOptions.licenseType === 'exclusive' ? 1000 :
                       ipOptions.licenseType === 'premium' ? 100 : 0
        }
        formData.append('licenseTerms', JSON.stringify(licenseConfig))
        
        // Add IP Asset ID and transaction hash from blockchain registration
        if (registrationResult.ipAssetId) {
          formData.append('ipAssetId', registrationResult.ipAssetId)
          console.log('📝 IP Asset ID:', registrationResult.ipAssetId)
        }
        if (registrationResult.transactionHash) {
          formData.append('transactionHash', registrationResult.transactionHash)
          console.log('🔗 Transaction hash:', registrationResult.transactionHash)
        }

        // Add cover file if available
        if (bookCover) {
          formData.append('coverFile', bookCover)
          console.log('📷 Book cover added to form data')
        }

        console.log('🚀 Calling book registration API...')
        console.log('📊 Form data contents:', {
          title: bookMetadata.title,
          author: bookMetadata.author,
          genres: bookMetadata.genres,
          hasCover: !!bookCover
        })

        const result = await apiClient.registerBook(formData)
        console.log('📋 Book registration API response:', result)

        if (!result.success) {
          console.error('❌ Book metadata registration failed:', result)
          setError(`Book registration failed: ${result.error || 'Unknown error'}`)
        } else {
          console.log('✅ Book metadata saved to R2 successfully:', result)
          console.log('📚 Book ID:', result.book?.bookId)
          console.log('🔗 IP Asset ID:', result.book?.ipAssetId)
        }
      } catch (metadataError) {
        console.error('❌ Book metadata registration error:', metadataError)
        setError(`Book registration failed: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`)
        // Don't continue to redirect if there's an error
        return
      }

      // Step 5: Redirect to /own page
      router.push('/own')

    } catch (err) {
      console.error('❌ Book registration failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to register book. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/write" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Write Options</span>
            </Link>

            <div className="flex items-center gap-4">
              <QuickNavigation currentPage="write" />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              📝 Register Your New Book
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
                <h4 className="text-red-800 font-medium">Registration Failed</h4>
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

          {/* Story Title */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              📖 Story Title:
            </label>
            <input
              type="text"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Enter your story title"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Book Cover Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              🎨 Book Cover:
            </label>
            
            {bookCoverPreview ? (
              // Cover Preview
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    <img
                      src={bookCoverPreview}
                      alt="Book cover preview"
                      className="w-32 h-48 object-cover rounded-lg shadow-md border border-gray-200"
                    />
                    <button
                      onClick={handleCoverRemove}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Cover uploaded!</strong> This will represent your book across the platform.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>File: {bookCover?.name}</p>
                      <p>Size: {bookCover ? (bookCover.size / 1024 / 1024).toFixed(2) : 0}MB</p>
                    </div>
                    <button
                      onClick={handleCoverRemove}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Remove cover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Upload Area
              <div
                onDrop={handleCoverDrop}
                onDragOver={handleCoverDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Drop your book cover here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, WebP up to 5MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Image
                    </button>
                  </div>
                </label>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500">
              💡 A good cover helps readers discover your story. You can always add or change it later.
            </div>
          </div>

          {/* Plot Description */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              📝 Describe your story plot:
            </label>
            <textarea
              value={plotDescription}
              onChange={(e) => setPlotDescription(e.target.value)}
              placeholder="Describe your story plot..."
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

          {/* Register Button */}
          <div className="text-center mb-6">
            <motion.button
              onClick={handleRegisterBook}
              disabled={!plotDescription.trim() || !isWalletConnected || isRegistering || isUploadingCover}
              whileHover={plotDescription.trim() && isWalletConnected && !isRegistering && !isUploadingCover ? { scale: 1.05 } : {}}
              whileTap={plotDescription.trim() && isWalletConnected && !isRegistering && !isUploadingCover ? { scale: 0.95 } : {}}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                plotDescription.trim() && isWalletConnected && !isRegistering && !isUploadingCover
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Wand2 className="w-5 h-5" />
              {isUploadingCover ? `Uploading cover...` : isRegistering ? `Registering book...` : !isWalletConnected ? `Connect Wallet First` : `📚 Register My Book`}
            </motion.button>

            {plotDescription.trim() && isWalletConnected && (
              <div className="space-y-1 mt-2">
                <p className="text-sm text-gray-500">
                  💡 This will register your book on-chain and take you to your library
                </p>
                {isRevenueSupported && (
                  <p className="text-sm text-green-600">
                    💰 Revenue sharing will be automatically enabled
                  </p>
                )}
                {!isRevenueSupported && (
                  <p className="text-sm text-yellow-600">
                    ⚠️ Revenue sharing not available (controller not deployed)
                  </p>
                )}
              </div>
            )}
            {plotDescription.trim() && !isWalletConnected && (
              <p className="text-sm text-red-500 mt-2">
                🔒 Please connect your wallet to register books on the blockchain
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
                {/* Enhanced PIL License Selection */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <LicenseSelector
                    selectedLicense={ipOptions.licenseType || 'standard'}
                    onLicenseSelect={handleLicenseSelect}
                    onCustomLicense={() => {
                      // TODO: Implement custom license modal
                      console.log('Custom license creation - coming soon!')
                    }}
                  />
                  
                  {selectedLicenseTemplate && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-800 mb-2">Selected License Summary</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <span className="ml-2 font-medium">{selectedLicenseTemplate.price} {selectedLicenseTemplate.currency}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Commercial Use:</span>
                          <span className={`ml-2 font-medium ${selectedLicenseTemplate.terms.commercialUse ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedLicenseTemplate.terms.commercialUse ? 'Allowed' : 'Not Allowed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Derivatives:</span>
                          <span className={`ml-2 font-medium ${selectedLicenseTemplate.terms.derivativesAllowed ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedLicenseTemplate.terms.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue Share:</span>
                          <span className="ml-2 font-medium text-purple-600">
                            {selectedLicenseTemplate.terms.commercialRevShare}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📚 What are Story Collections?</h4>
                  <p className="text-sm text-blue-700">Group stories together for shared themes and revenue. Perfect for series or related content.</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">🛡️ What is IP Protection?</h4>
                  <p className="text-sm text-purple-700">Register your story on the blockchain for enhanced copyright protection and licensing control. You can add this later!</p>
                </div>
                {isRevenueSupported && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">💰 Automatic Revenue Sharing</h4>
                    <p className="text-sm text-green-700">Your book will be automatically registered for revenue sharing: 70% to you as author, 20% to curators, 10% platform fee. No additional setup required!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default function NewStoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>}>
      <NewStoryPageContent />
    </Suspense>
  )
}