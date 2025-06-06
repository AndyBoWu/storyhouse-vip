'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Shield, Coins, Clock, BookOpen, TrendingUp, CheckCircle, AlertCircle, Upload, Link } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { usePublishStory } from '@/hooks/usePublishStory'
import { getExplorerUrl, getIPAssetUrl } from '@/lib/contracts/storyProtocol'

interface GeneratedStory {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
}

interface PublishingModalProps {
  isOpen: boolean
  onClose: () => void
  story: GeneratedStory
  chapterNumber: number
  storyTitle?: string
}

type PublishingStep = 'options' | 'wallet' | 'pricing' | 'ip-setup' | 'publishing' | 'success'

export default function PublishingModal({
  isOpen,
  onClose,
  story,
  chapterNumber,
  storyTitle
}: PublishingModalProps) {
  const [currentStep, setCurrentStep] = useState<PublishingStep>('options')
  const [publishingOption, setPublishingOption] = useState<'simple' | 'protected' | null>(null)
  const [chapterPrice, setChapterPrice] = useState(0.1)
  const [ipRegistration, setIpRegistration] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by only rendering after client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  // Publishing hook
  const {
    publishStory,
    reset: resetPublishing,
    isPublishing,
    currentStep: publishStep,
    publishResult,
    ipfsHash,
    contractError
  } = usePublishStory()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('options')
      setPublishingOption(null)
      // Set chapter price to 0 for chapters 1-3, default 0.1 for others
      setChapterPrice(chapterNumber <= 3 ? 0 : 0.1)
      resetPublishing()
    }
  }, [isOpen, chapterNumber])

  // Debug state changes (removed for cleaner console)

  const handleWalletConnect = async () => {
    try {
      if (!isConnected) {
        await connect({ connector: injected() })
      }

      if (publishingOption === 'simple') {
        // Chapters 1-3 are free, skip pricing step
        if (chapterNumber <= 3) {
          setChapterPrice(0) // Set price to 0 for free chapters
          setCurrentStep('publishing') // Skip directly to publishing
        } else {
          setCurrentStep('pricing') // Show pricing for paid chapters
        }
      } else {
        setCurrentStep('ip-setup')
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  const handlePublish = async () => {
    if (!address) {
      console.error('No wallet connected')
      return
    }

    setCurrentStep('publishing')

    try {
      const options = {
        publishingOption: publishingOption!,
        chapterPrice,
        ...(publishingOption === 'protected' && {
          ipRegistration,
          licenseTerms: {
            commercialUse: true,
            derivativesAllowed: true,
            commercialRevShare: 25, // 25% royalty to creator
          }
        })
      }

      const result = await publishStory({
        title: story.title,
        content: story.content,
        wordCount: story.wordCount,
        readingTime: story.readingTime,
        themes: story.themes,
        chapterNumber
      }, options)

      if (result.success) {
        setCurrentStep('success')
      } else {
        console.error('Publishing failed:', result.error)
        // The hook will set its own error state, but we need to reset our step
        setCurrentStep('options')
      }
    } catch (error) {
      console.error('Publishing error:', error)
      setCurrentStep('options')
    }
  }

  const getStepProgress = () => {
    // Chapters 1-3 skip pricing step
    const steps = chapterNumber <= 3
      ? ['options', 'wallet', 'publishing', 'success']
      : ['options', 'wallet', 'pricing', 'publishing', 'success']
    return (steps.indexOf(currentStep) + 1) / steps.length * 100
  }

  const getPublishingStepDisplay = () => {
    switch (publishStep) {
      case 'uploading-ipfs':
        return { text: 'Uploading content to IPFS...', icon: <Upload className="w-5 h-5" /> }
      case 'minting-nft':
        return { text: 'Minting NFT...', icon: <Coins className="w-5 h-5" /> }
      case 'registering-ip':
        return { text: 'Registering IP Asset...', icon: <Shield className="w-5 h-5" /> }
      case 'creating-license':
        return { text: 'Creating license terms...', icon: <BookOpen className="w-5 h-5" /> }
      case 'attaching-license':
        return { text: 'Attaching license terms...', icon: <Link className="w-5 h-5" /> }
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Publishing Option</h3>
                      <p className="text-gray-600">Select how you want to publish your chapter and start earning.</p>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {/* Chapter 1-3: Simplified Free Publishing */}
                    {chapterNumber <= 3 ? (
                      <motion.button
                        onClick={() => {
                          setPublishingOption('simple')
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
                              <div className="text-green-700">✅ Upload to IPFS (decentralized storage)</div>
                              <div className="text-green-700">✅ Register as IP Asset on Story Protocol</div>
                              <div className="text-green-700">✅ Basic IP protection & ownership proof</div>
                              <div className="text-blue-600">🔒 No remix rights (protects your story foundation)</div>
                              <div className="text-gray-500">💰 Monetization starts at Chapter 4</div>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ) : (
                      /* Chapter 4+: Full licensing options */
                      <>
                        {/* Simple Publishing */}
                        <motion.button
                          onClick={() => {
                            setPublishingOption('simple')
                            setCurrentStep('wallet')
                          }}
                          whileHover={{ scale: 1.02 }}
                          className={`p-6 border-2 rounded-xl text-left transition-all ${
                            publishingOption === 'simple'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                              <Coins className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">✨ Simple Publish</h4>
                              <p className="text-gray-600 mb-3">
                                Start earning immediately! Perfect for getting your content live quickly.
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className="text-green-700">✅ Upload to IPFS (decentralized storage)</div>
                                <div className="text-green-700">✅ Register as IP Asset on Story Protocol</div>
                                <div className="text-green-700">✅ Basic IP protection & ownership proof</div>
                                <div className="text-gray-500">➡️ Add custom licenses later</div>
                              </div>
                            </div>
                          </div>
                        </motion.button>

                        {/* Protected Publishing */}
                        <motion.button
                          onClick={() => {
                            setPublishingOption('protected')
                            setCurrentStep('wallet')
                          }}
                          whileHover={{ scale: 1.02 }}
                          className={`p-6 border-2 rounded-xl text-left transition-all ${
                            publishingOption === 'protected'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">🛡️ Protected Publish</h4>
                              <p className="text-gray-600 mb-3">
                                Full IP protection with custom licensing and automated royalty distribution.
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className="text-blue-700">✅ Upload to IPFS + IP Asset registration</div>
                                <div className="text-blue-700">✅ Custom license terms with commercial use</div>
                                <div className="text-blue-700">✅ Derivative work controls</div>
                                <div className="text-blue-700">✅ Automated royalty sharing (25%)</div>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      </>
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
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span>
                          {chapterNumber <= 3
                            ? "Chapter is FREE - builds audience"
                            : "Estimated: 0.5-2.0 $TIP/day"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span>IPFS: Decentralized storage</span>
                      </div>
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
                      Connect to Aeneid testnet to register your chapter as an IP Asset on Story Protocol.
                    </p>
                  </div>

                  {/* Wallet Status */}
                  {isConnected && address ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">Wallet Connected!</div>
                          <div className="text-sm text-green-600 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">🔗 Decentralized Publishing</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div>✅ Upload to IPFS (no servers needed)</div>
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
                        onClick={() => setCurrentStep('options')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => {
                          if (publishingOption === 'simple') {
                            // Chapters 1-3 are free, skip pricing step
                            if (chapterNumber <= 3) {
                              setChapterPrice(0) // Ensure price is 0 for free chapters
                              handlePublish() // Go directly to publishing
                            } else {
                              setCurrentStep('pricing') // Show pricing for paid chapters
                            }
                          } else {
                            setCurrentStep('ip-setup')
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        {chapterNumber <= 3 ? 'Publish' : 'Continue →'}
                      </button>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep('options')}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      ← Back to options
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Pricing Setup */}
              {currentStep === 'pricing' && chapterNumber > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">💰 Set Chapter Price</h3>
                    <p className="text-gray-600">
                      Choose how much readers pay to unlock this chapter. They earn tokens back while reading!
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
                          value={chapterPrice}
                          onChange={(e) => setChapterPrice(parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.10"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">$TIP</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[0.05, 0.1, 0.2].map((price) => (
                        <button
                          key={price}
                          onClick={() => setChapterPrice(price)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            chapterPrice === price
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{price} $TIP</div>
                          <div className="text-xs text-gray-500">
                            {price === 0.05 ? 'Budget' : price === 0.1 ? 'Standard' : 'Premium'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">📈 Revenue Projection</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-green-700">Reader pays: {chapterPrice} $TIP</div>
                        <div className="text-green-700">Reader earns back: ~0.05 $TIP</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Your net: {(chapterPrice - 0.05).toFixed(2)} $TIP</div>
                        <div className="text-green-600">Per reader</div>
                      </div>
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
                      onClick={handlePublish}
                      disabled={!isConnected}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                    >
                                                Publish
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: IP Setup (for protected publishing) */}
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

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-1">Transaction Fees</h4>
                          <p className="text-sm text-yellow-700">
                            IP Asset registration requires testnet gas fees. License creation is included in the transaction.
                          </p>
                        </div>
                      </div>
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
                      onClick={handlePublish}
                      disabled={!isConnected}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                      Publish with IP Protection 🛡️
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Publishing Progress */}
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
                            ? 'Publishing to IPFS and registering IP Asset with custom license terms...'
                            : 'Publishing to IPFS and registering as IP Asset on Story Protocol...'
                          }
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Dynamic step display based on current publishing step */}
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          {getPublishingStepDisplay().icon}
                          <span className="text-blue-800">{getPublishingStepDisplay().text}</span>
                        </div>

                        {ipfsHash && (
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-800">Content uploaded to IPFS: {ipfsHash.slice(0, 12)}...</span>
                          </div>
                        )}
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
                        {contractError && (
                          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">
                            Contract Error: {contractError.message}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentStep(chapterNumber <= 3 ? 'wallet' : (publishingOption === 'simple' ? 'pricing' : 'ip-setup'))}
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
                      </div>

                      <button
                        onClick={onClose}
                        className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 6: Success */}
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
                      Your chapter is now on IPFS and registered as an IP Asset on Story Protocol!
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
                      {publishResult.data?.ipfsHash && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">IPFS Hash:</span>
                          <span className="font-mono text-purple-600 text-xs">
                            {publishResult.data.ipfsHash.slice(0, 8)}...{publishResult.data.ipfsHash.slice(-6)}
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
