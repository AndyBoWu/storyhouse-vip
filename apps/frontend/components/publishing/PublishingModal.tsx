'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Shield, Coins, Clock, BookOpen, TrendingUp, CheckCircle, AlertCircle, Upload, Link } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useUnifiedPublishStory } from '@/hooks/useUnifiedPublishStory'
import { useEnhancedStoryProtocol } from '@/hooks/useEnhancedStoryProtocol'
import { getExplorerUrl, getIPAssetUrl } from '@/lib/contracts/storyProtocol'

interface GeneratedStory {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
  contentUrl?: string // R2 URL from story generation
}

interface PublishingModalProps {
  isOpen: boolean
  onClose: () => void
  story: GeneratedStory
  chapterNumber: number
  storyTitle?: string
  bookId?: string
  onSuccess?: (result: any) => void
}

type PublishingStep = 'options' | 'wallet' | 'license' | 'pricing' | 'ip-setup' | 'publishing' | 'success'

function PublishingModal({
  isOpen,
  onClose,
  story,
  chapterNumber,
  storyTitle,
  bookId,
  onSuccess
}: PublishingModalProps) {
  const [currentStep, setCurrentStep] = useState<PublishingStep>('options')
  const [publishingOption, setPublishingOption] = useState<'simple' | 'protected' | null>(null)
  const [licenseTier, setLicenseTier] = useState<'free' | 'premium' | 'exclusive'>('premium')
  const [chapterPrice, setChapterPrice] = useState(0.5)
  const [priceInput, setPriceInput] = useState('0.5')
  const [ipRegistration, setIpRegistration] = useState(true) // Default to true for IP protection
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by only rendering after client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  // Unified publishing hook
  const {
    publishStory,
    reset: resetPublishing,
    isPublishing,
    currentStep: publishStep,
    publishResult,
    isUnifiedSupported
  } = useUnifiedPublishStory()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // For premium chapters (4+), skip options and go directly to wallet
      if (chapterNumber > 3) {
        setCurrentStep('wallet')
        setPublishingOption('protected') // Premium chapters always use protected publishing
      } else {
        setCurrentStep('options')
        setPublishingOption(null)
      }
      // Auto-set license tier based on chapter number
      // Chapters 1-3: free, Chapters 4+: premium (no free option for premium chapters)
      setLicenseTier(chapterNumber <= 3 ? 'free' : 'premium')
      // Set chapter price to 0 for chapters 1-3, default 0.5 for premium chapters
      const price = chapterNumber <= 3 ? 0 : 0.5
      setChapterPrice(price)
      setPriceInput(price.toString())
      resetPublishing()
    }
  }, [isOpen, chapterNumber])

  // Debug state changes (removed for cleaner console)

  const handleWalletConnect = async () => {
    try {
      if (!isConnected) {
        await connect({ connector: injected() })
      }

      if (chapterNumber <= 3) {
        // Chapters 1-3 are free, skip license and pricing steps
        setChapterPrice(0) // Set price to 0 for free chapters
        setLicenseTier('free') // Auto-set to free license
        setCurrentStep('publishing') // Skip directly to publishing
      } else {
        setCurrentStep('license') // Show license selection for protected publishing
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  const handlePublish = async () => {
    try {
      console.log('🚀 handlePublish called')
      console.log('📊 Publishing state:', {
        address,
        isConnected,
        publishingOption,
        chapterPrice,
        story,
        chapterNumber,
        bookId
      })
      
      // If wallet is not connected, trigger connection first
      if (!address || !isConnected) {
        console.log('Wallet not connected, triggering connection...')
      try {
        await connect({ connector: injected() })
        // Wait a bit for the connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if connection was successful
        if (!address) {
          console.error('Wallet connection failed')
          alert('Please connect your wallet to publish')
          return
        }
      } catch (error) {
        console.error('Wallet connection failed:', error)
        alert('Failed to connect wallet. Please try again.')
        return
      }
    }

    setCurrentStep('publishing')

    try {
      const options = {
        publishingOption: publishingOption!,
        chapterPrice,
        ipRegistration,
        licenseTier: licenseTier as 'free' | 'reading' | 'premium' | 'exclusive'
      }

      console.log('📞 About to call publishStory with:', {
        story: {
          title: story.title,
          wordCount: story.wordCount,
          chapterNumber,
          hasContent: !!story.content,
          contentLength: story.content?.length
        },
        options,
        bookId
      })
      
      const result = await publishStory({
        title: story.title,
        content: story.content,
        wordCount: story.wordCount,
        readingTime: story.readingTime,
        themes: story.themes,
        chapterNumber,
        contentUrl: story.contentUrl // Pass the R2 URL
      }, options, bookId)

            if (result.success) {
        setCurrentStep('success')

        // Story is automatically saved to R2 during the publishing process
        // The /api/stories endpoint will fetch it from R2 when needed
        console.log('📖 Story published successfully to R2 and blockchain')
        
        // Call the success callback with the result
        if (onSuccess) {
          onSuccess(result)
        }
      } else {
        console.error('Publishing failed:', result.error)
        // Don't reset to options, let the user see the error and try again
        alert(`Publishing failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Publishing error:', error)
      alert(`Publishing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    } catch (outerError) {
      console.error('🔥 handlePublish outer error:', outerError)
      alert(`Critical error: ${outerError instanceof Error ? outerError.message : 'Unknown error'}`)
    }
  }

  const getStepProgress = () => {
    // Chapters 1-3 skip license and pricing steps
    const steps = chapterNumber <= 3
      ? ['options', 'wallet', 'publishing', 'success']
      : ['options', 'wallet', 'license', 'pricing', 'publishing', 'success']
    return (steps.indexOf(currentStep) + 1) / steps.length * 100
  }

  const getPublishingStepDisplay = () => {
    switch (publishStep) {
      case 'checking-unified-support':
        return { text: 'Optimizing transaction flow...', icon: <TrendingUp className="w-5 h-5" /> }
      case 'unified-registration':
        return { 
          text: isUnifiedSupported 
            ? '⚡ Single-transaction registration (Gas Optimized)' 
            : 'Unified IP registration...', 
          icon: <Shield className="w-5 h-5" /> 
        }
      case 'saving-to-storage':
        return { text: 'Saving to storage...', icon: <Upload className="w-5 h-5" /> }
      default:
        return { text: 'Processing...', icon: <CheckCircle className="w-5 h-5" /> }
    }
  }

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🚀 Publish Chapter {chapterNumber}</h2>
                  <p className="text-gray-600 mt-1">{storyTitle || story.title}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getStepProgress()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Publishing Options */}
              {currentStep === 'options' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Chapter 1-3: Free chapters with simplified publishing */}
                  {chapterNumber <= 3 ? (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Publish Free Chapter {chapterNumber}</h3>
                      <p className="text-gray-600">Chapter {chapterNumber} will be free for all readers. No remix rights included until Chapter 4+.</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Publish Premium Chapter {chapterNumber}</h3>
                      <p className="text-gray-600">Premium chapters automatically include full IP protection and royalty distribution - the complete StoryHouse.vip experience for your monetized content.</p>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {/* Chapter 1-3: Simplified Free Publishing */}
                    {chapterNumber <= 3 ? (
                      <motion.button
                        onClick={() => {
                          setPublishingOption('protected') // Always use protected mode since simple publishing is removed
                          setChapterPrice(0) // Ensure free chapters have 0 price
                          setCurrentStep('wallet')
                        }}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 border-2 border-green-500 bg-green-50 rounded-xl text-left transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Coins className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">🆓 Publish Free Chapter</h4>
                            <p className="text-gray-600 mb-3">
                              Chapter {chapterNumber} will be free for all readers. Build your audience with engaging opening chapters!
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="text-green-700">✅ Secure content storage</div>
                              <div className="text-green-700">✅ Register as IP Asset on Story Protocol</div>
                              <div className="text-green-700">✅ Basic IP protection & ownership proof</div>
                              <div className="text-blue-600">🔒 No remix rights (protects your story foundation)</div>
                              <div className="text-gray-500">💰 Monetization starts at Chapter 4</div>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ) : (
                      /* Chapter 4+: Premium chapters get full protection automatically */
                      <motion.button
                        onClick={() => {
                          setPublishingOption('protected')
                          setCurrentStep('wallet')
                        }}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 border-2 border-blue-500 bg-blue-50 rounded-xl text-left transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Shield className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">🛡️ Premium Chapter Publishing</h4>
                            <p className="text-gray-600 mb-3">
                              Your premium content gets the full StoryHouse.vip experience with maximum IP protection and earning potential.
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="text-blue-700">✅ Secure storage + IP Asset registration</div>
                              <div className="text-blue-700">✅ Custom license terms with commercial use</div>
                              <div className="text-blue-700">✅ Derivative work controls</div>
                              <div className="text-blue-700">✅ Automated royalty sharing (25%)</div>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    )}
                  </div>

                  {/* Chapter Stats */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">📊 Chapter Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span>{story.wordCount.toLocaleString()} words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{story.readingTime} min read</span>
                      </div>
                      {chapterNumber <= 3 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span>Chapter is FREE - builds audience</span>
                        </div>
                      )}
                    </div>

                    {/* Chapter 1-3 Special Notice */}
                    {chapterNumber <= 3 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800">
                          💡 <strong>Strategy:</strong> Chapters 1-3 are your story foundation. They build audience and create anticipation for paid chapters starting at Chapter 4, where remix licensing becomes available.
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Wallet Connection */}
              {currentStep === 'wallet' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600">
                      {chapterNumber > 3 
                        ? 'Connect to publish your premium chapter with full IP protection and monetization.'
                        : 'Connect to Aeneid testnet to register your chapter as an IP Asset on Story Protocol.'
                      }
                    </p>
                  </div>

                  {/* Wallet Status */}
                  {isConnected && address ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">Wallet Connected!</div>
                          <div className="text-sm text-green-600 font-mono">{address.slice(-4)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">🔗 Decentralized Publishing</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div>✅ Content on R2 (global CDN)</div>
                        <div>✅ Register on Story Protocol (Aeneid testnet)</div>
                        <div>✅ You control your own transactions</div>
                        <div>✅ Fully decentralized ownership</div>
                      </div>
                    </div>
                  )}

                  {!isConnected ? (
                    <motion.button
                      onClick={handleWalletConnect}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-orange-600 hover:to-yellow-600 transition-all"
                    >
                      🦊 Connect MetaMask
                    </motion.button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          // Always use simple publishing with Story Protocol
                          if (chapterNumber <= 3) {
                            setChapterPrice(0) // Ensure price is 0 for free chapters
                            setLicenseTier('free') // Ensure free license
                            handlePublish() // Go directly to publishing
                          } else {
                            setCurrentStep('license') // Show license selection for paid chapters
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        {chapterNumber <= 3 ? 'Publish with Story Protocol' : 'Continue →'}
                      </button>
                    </div>
                  )}

                  {/* Only show back button for free chapters */}
                  {chapterNumber <= 3 && (
                    <div className="text-center">
                      <button
                        onClick={() => setCurrentStep('options')}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        ← Back to options
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: License Tier Selection */}
              {currentStep === 'license' && chapterNumber > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">🏷️ Choose License Tier</h3>
                    <p className="text-gray-600">
                      Choose your licensing tier for premium content. Both options include commercial rights and revenue sharing.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* PREMIUM License Tier */}
                    <motion.button
                      onClick={() => setLicenseTier('premium')}
                      whileHover={{ scale: 1.02 }}
                      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                        licenseTier === 'premium'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <span className="text-blue-600 font-bold text-lg">PRO</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">💼 Premium License</h4>
                          <p className="text-gray-600 mb-3">
                            Commercial use with royalty sharing. Best balance of access and revenue.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="text-blue-700">✅ Commercial use allowed</div>
                              <div className="text-blue-700">✅ Derivatives allowed</div>
                              <div className="text-blue-700">✅ Multi-channel distribution</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-gray-600"><strong>100 TIP</strong> license fee</div>
                              <div className="text-blue-600"><strong>10%</strong> ongoing royalty</div>
                              <div className="text-green-600">💰 Steady revenue stream</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    {/* EXCLUSIVE License Tier */}
                    <motion.button
                      onClick={() => setLicenseTier('exclusive')}
                      whileHover={{ scale: 1.02 }}
                      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                        licenseTier === 'exclusive'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <span className="text-purple-600 font-bold text-lg">VIP</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">👑 Exclusive License</h4>
                          <p className="text-gray-600 mb-3">
                            Full commercial rights with high royalties. Premium content with maximum revenue.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="text-purple-700">✅ Full commercial rights</div>
                              <div className="text-purple-700">✅ Exclusive licensing</div>
                              <div className="text-purple-700">✅ All channels allowed</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-gray-600"><strong>1000 TIP</strong> license fee</div>
                              <div className="text-purple-600"><strong>25%</strong> ongoing royalty</div>
                              <div className="text-green-600">💎 Maximum revenue</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* License Impact Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">📊 License Impact</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {licenseTier === 'free' && (
                        <>
                          <div className="text-gray-600">• Readers can use your content for non-commercial purposes with attribution</div>
                          <div className="text-gray-600">• Great for building audience and establishing reputation</div>
                          <div className="text-gray-600">• No licensing revenue, but drives readership for paid chapters</div>
                        </>
                      )}
                      {licenseTier === 'premium' && (
                        <>
                          <div className="text-blue-600">• Others pay 100 TIP to license your content for commercial use</div>
                          <div className="text-blue-600">• You earn 10% royalty on all revenue from derivative works</div>
                          <div className="text-blue-600">• Balanced approach: accessible but revenue-generating</div>
                        </>
                      )}
                      {licenseTier === 'exclusive' && (
                        <>
                          <div className="text-purple-600">• High barrier to entry (1000 TIP) attracts serious licensees</div>
                          <div className="text-purple-600">• You earn 25% royalty on all revenue from licensed works</div>
                          <div className="text-purple-600">• Maximum revenue potential for premium content</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep('wallet')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setCurrentStep('pricing')}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      Continue to Pricing →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Pricing Setup */}
              {currentStep === 'pricing' && chapterNumber > 3 && (
                <motion.div
                  onAnimationComplete={() => {
                    console.log('💰 Pricing step rendered. Modal state:', {
                      currentStep,
                      chapterNumber,
                      chapterPrice,
                      isConnected,
                      address,
                      publishingOption
                    })
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">💰 Set Chapter Price</h3>
                    <p className="text-gray-600">
                      Choose how much readers pay to unlock this chapter. <span className="font-medium text-green-600">You keep 100% - zero platform fees!</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Unlock Price
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="1.0"
                          value={priceInput}
                          onChange={(e) => {
                            setPriceInput(e.target.value)
                            setChapterPrice(parseFloat(e.target.value) || 0)
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.50"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">$TIP</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[0.3, 0.5, 0.8].map((price) => (
                        <button
                          key={price}
                          onClick={() => {
                            setChapterPrice(price)
                            setPriceInput(price.toString())
                          }}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            chapterPrice === price
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{price} $TIP</div>
                          <div className="text-xs text-gray-500">
                            {price === 0.3 ? 'Budget' : price === 0.5 ? 'Standard' : 'Premium'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">📈 Revenue Projection</h4>
                    <div className="mb-3 p-2 bg-green-100 rounded-lg">
                      <div className="text-green-800 font-medium text-sm">✅ Zero commission fees - You keep 100% of chapter revenue!</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-green-700">Reader pays: {chapterPrice} $TIP</div>
                        <div className="text-gray-600">No reading rewards for premium chapters</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Your net: {chapterPrice.toFixed(2)} $TIP</div>
                        <div className="text-green-600">Per reader (100% yours!)</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep('license')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('🔘 Publish button clicked! Event:', e)
                        console.log('Button state:', {
                          isConnected,
                          chapterNumber,
                          chapterPrice,
                          disabled: !isConnected || (chapterNumber > 3 && chapterPrice <= 0)
                        })
                        handlePublish()
                      }}
                      disabled={!isConnected || (chapterNumber > 3 && chapterPrice <= 0)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                      type="button"
                    >
                      {(!isConnected || (chapterNumber > 3 && chapterPrice <= 0)) ? 'Publish (Disabled)' : 'Publish'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: IP Setup (for protected publishing) */}
              {currentStep === 'ip-setup' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">🛡️ IP Protection Setup</h3>
                    <p className="text-gray-600">
                      Configure licensing terms and revenue sharing for your IP Asset.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Enable Custom License Terms</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ipRegistration}
                            onChange={(e) => setIpRegistration(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Create custom license terms with commercial use permissions and automated royalty distribution.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">🎯 License Configuration</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div>✅ Commercial use: Allowed</div>
                        <div>✅ Derivative works: Permitted</div>
                        <div>✅ Revenue sharing: 25% to original creator</div>
                        <div>✅ Attribution: Required</div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${isUnifiedSupported ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-start gap-3">
                        {isUnifiedSupported ? (
                          <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        )}
                        <div>
                          <h4 className={`font-medium mb-1 ${isUnifiedSupported ? 'text-green-800' : 'text-yellow-800'}`}>
                            {isUnifiedSupported ? 'Optimized Gas Fees' : 'Transaction Fees'}
                          </h4>
                          <p className={`text-sm ${isUnifiedSupported ? 'text-green-700' : 'text-yellow-700'}`}>
                            {isUnifiedSupported 
                              ? '~40% gas savings with single-transaction IP registration and license creation.'
                              : 'IP Asset registration requires testnet gas fees. License creation is included in the transaction.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep('license')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={!isConnected || (chapterNumber > 3 && chapterPrice <= 0)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                      Publish with IP Protection 🛡️
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Publishing Progress */}
              {currentStep === 'publishing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-3 border-white border-t-transparent rounded-full"
                        />
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">🚀 Publishing Your Chapter</h3>
                        <p className="text-gray-600">
                          {publishingOption === 'protected'
                            ? 'Using R2 storage and registering IP Asset with custom license terms...'
                            : 'Using R2 storage and registering as IP Asset on Story Protocol...'
                          }
                        </p>
                        {isUnifiedSupported && publishingOption === 'protected' && (
                          <div className="mt-2 flex items-center justify-center gap-2 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Gas Optimized: Single-transaction flow enabled</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Dynamic step display based on current publishing step */}
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          {getPublishingStepDisplay().icon}
                          <span className="text-blue-800">{getPublishingStepDisplay().text}</span>
                        </div>

                      </div>
                    </>
                  ) : publishResult && !publishResult.success ? (
                    // Show error state if publishing failed
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">❌ Publication Failed</h3>
                        <p className="text-gray-600 mb-4">
                          {publishResult.error || 'An error occurred during publication'}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentStep('wallet')}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ← Try Again
                        </button>
                        <button
                          onClick={onClose}
                          className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  ) : (
                    // Fallback state - publishing completed but waiting for result
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">⏳ Processing...</h3>
                        <p className="text-gray-600">
                          Finalizing your publication. This should only take a moment.
                        </p>
                        <p className="text-sm text-orange-600 mt-2">
                          Stuck? Check your browser console for errors or wallet for pending transactions.
                        </p>
                        <button
                          onClick={() => {
                            console.log('🔄 Force resetting publishing state...')
                            resetPublishing()
                            setCurrentStep(chapterNumber > 3 ? 'wallet' : 'options')
                          }}
                          className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                        >
                          Force Reset & Try Again
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={onClose}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setCurrentStep(chapterNumber > 3 ? 'wallet' : 'options')}
                          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 7: Success */}
              {currentStep === 'success' && publishResult?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">🎉 Chapter Published Successfully!</h3>
                    <p className="text-gray-600">
                      Your chapter is now on R2 storage and registered as an IP Asset on Story Protocol!
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">📊 Publication Details</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      {publishResult.data?.transactionHash && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction:</span>
                          <span className="font-mono text-blue-600 text-xs">
                            {publishResult.data.transactionHash.slice(0, 8)}...{publishResult.data.transactionHash.slice(-6)}
                          </span>
                        </div>
                      )}
                      {publishResult.data?.contentUrl && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Content URL:</span>
                          <span className="font-mono text-purple-600 text-xs">
                            R2 Storage
                          </span>
                        </div>
                      )}
                      {publishResult.data?.ipAssetId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">IP Asset ID:</span>
                          <span className="font-mono text-green-600 text-xs">
                            {publishResult.data.ipAssetId.slice(0, 8)}...{publishResult.data.ipAssetId.slice(-6)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chapter Price:</span>
                        <span className="font-medium">
                          {chapterNumber <= 3 ? "FREE" : `${chapterPrice} $TIP`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP Protection:</span>
                        <span className="font-medium">{publishingOption === 'protected' ? '✅ Enhanced' : '✅ Basic'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">🟢 Live on Story Protocol</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    {publishResult.data?.explorerUrl && (
                      <button
                        onClick={() => {
                          window.open(publishResult.data!.explorerUrl, '_blank')
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        View Transaction 🔍
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Export both default and named
export default PublishingModal
export { PublishingModal }
