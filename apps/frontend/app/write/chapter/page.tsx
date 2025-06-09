'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { ArrowLeft, Save, Eye, Maximize2, Minimize2, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Quote, Rocket, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { apiClient } from '@/lib/api-client'
import dynamic from 'next/dynamic'
import QuickNavigation from '@/components/ui/QuickNavigation'
import IPRegistrationSection from '@/components/creator/IPRegistrationSection'
import PublishingModal from '@/components/publishing/PublishingModal'
import { usePublishBookChapter } from '@/hooks/usePublishBookChapter'
import type { EnhancedStoryCreationParams } from '@storyhouse/shared'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

interface ChapterData {
  title: string
  subtitle?: string
  content: string
  wordCount: number
}

function ChapterWritingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const { publishBookChapter, isPublishing, currentStep, publishResult, reset } = usePublishBookChapter()
  
  // URL parameters
  const bookId = searchParams?.get('bookId')
  const bookTitle = searchParams?.get('title')
  const chapterNumber = parseInt(searchParams?.get('chapterNumber') || '1')
  const genre = searchParams?.get('genre')
  
  // Chapter writing state
  const [chapterData, setChapterData] = useState<ChapterData>({
    title: '',
    subtitle: '',
    content: '',
    wordCount: 0
  })
  
  // UI state
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Publishing workflow state
  const [showLicenseSelection, setShowLicenseSelection] = useState(false)
  const [showPublishingModal, setShowPublishingModal] = useState(false)
  const [licenseOptions, setLicenseOptions] = useState<Partial<EnhancedStoryCreationParams>>({
    registerAsIP: false,
    licenseType: 'standard',
    commercialRights: true,
    derivativeRights: true
  })
  
  // Rich text editor state
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Inter')
  const contentRef = useRef<HTMLTextAreaElement>(null)
  
  // Calculate word count
  useEffect(() => {
    const words = chapterData.content.trim().split(/\s+/).filter(word => word.length > 0)
    setChapterData(prev => ({ ...prev, wordCount: words.length }))
  }, [chapterData.content])
  
  // Handle input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChapterData(prev => ({ ...prev, title: e.target.value }))
  }
  
  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChapterData(prev => ({ ...prev, subtitle: e.target.value }))
  }
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChapterData(prev => ({ ...prev, content: e.target.value }))
  }
  
  // Format text functions
  const formatText = (command: string, value?: string) => {
    if (contentRef.current) {
      const textarea = contentRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)
      
      let formattedText = selectedText
      
      switch (command) {
        case 'bold':
          formattedText = `**${selectedText}**`
          break
        case 'italic':
          formattedText = `*${selectedText}*`
          break
        case 'quote':
          formattedText = `> ${selectedText}`
          break
      }
      
      const newContent = 
        textarea.value.substring(0, start) + 
        formattedText + 
        textarea.value.substring(end)
      
      setChapterData(prev => ({ ...prev, content: newContent }))
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
      }, 0)
    }
  }
  
  // Save draft
  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage for now
      const draftKey = `chapter-draft-${bookId}-${chapterNumber}`
      localStorage.setItem(draftKey, JSON.stringify({
        ...chapterData,
        bookId,
        chapterNumber,
        savedAt: new Date().toISOString()
      }))
      
      setTimeout(() => setIsSaving(false), 1000)
    } catch (error) {
      console.error('Error saving draft:', error)
      setIsSaving(false)
    }
  }
  
  // Load draft on mount
  useEffect(() => {
    if (bookId && chapterNumber) {
      const draftKey = `chapter-draft-${bookId}-${chapterNumber}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          setChapterData({
            title: draft.title || '',
            subtitle: draft.subtitle || '',
            content: draft.content || '',
            wordCount: draft.wordCount || 0
          })
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
  }, [bookId, chapterNumber])
  
  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (chapterData.content.length > 0 || chapterData.title.length > 0) {
        handleSaveDraft()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [chapterData])
  
  // Handle Esc key to exit Focus mode
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false)
      }
    }
    
    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [isFocusMode])
  
  // Publishing workflow handlers
  const handleChooseLicense = () => {
    if (!chapterData.title.trim()) {
      setError('Chapter title is required')
      return
    }
    
    if (!chapterData.content.trim()) {
      setError('Chapter content is required')
      return
    }
    
    setError(null)
    setShowLicenseSelection(true)
  }
  
  const handleLicenseSelected = async (options: Partial<EnhancedStoryCreationParams>) => {
    setLicenseOptions(options)
    setShowLicenseSelection(false)
    
    if (!connectedAddress || !bookId) {
      setError('Missing required information for publishing')
      return
    }

    // Prepare chapter data for book chapter publishing
    const bookChapterData = {
      bookId,
      chapterNumber,
      title: chapterData.title,
      content: chapterData.content,
      wordCount: chapterData.wordCount,
      readingTime: Math.ceil(chapterData.wordCount / 200),
      authorAddress: connectedAddress,
      authorName: `${connectedAddress.slice(-4)}`,
      genre: genre ? decodeURIComponent(genre) : 'General',
      contentRating: 'G' as const,
      tags: genre ? [decodeURIComponent(genre)] : []
    }

    // Prepare publishing options
    const publishingOptions = {
      publishingOption: options.registerAsIP ? 'protected' : 'simple',
      chapterPrice: 100, // Default chapter price
      ipRegistration: options.registerAsIP,
      licenseTerms: options.registerAsIP ? {
        commercialUse: options.commercialRights || true,
        derivativesAllowed: options.derivativeRights || true,
        commercialRevShare: 2500 // 25%
      } : undefined
    } as const

    try {
      console.log('🚀 Starting book chapter publishing...')
      const result = await publishBookChapter(bookChapterData, publishingOptions)
      
      if (result.success) {
        console.log('✅ Chapter published successfully:', result)
        router.push('/own')
      } else {
        setError(result.error || 'Publishing failed')
      }
    } catch (error) {
      console.error('❌ Publishing error:', error)
      setError(error instanceof Error ? error.message : 'Publishing failed')
    }
  }
  
  const handlePublishingSuccess = (result: any) => {
    console.log('Chapter published successfully:', result)
    setShowPublishingModal(false)
    router.push('/own')
  }
  
  // Convert chapter data to the format expected by PublishingModal
  const getStoryForPublishing = () => ({
    title: chapterData.title,
    content: chapterData.content,
    wordCount: chapterData.wordCount,
    readingTime: Math.ceil(chapterData.wordCount / 200),
    themes: genre ? [decodeURIComponent(genre)] : [], // Use genre from URL
    contentUrl: `chapter-${bookId}-${chapterNumber}` // Generate a temporary identifier
  })
  
  // Focus mode component
  const FocusMode = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Focus mode header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFocusMode(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Minimize2 className="w-4 h-4" />
            Exit Focus
          </button>
          <div className="text-sm text-gray-500">
            Chapter {chapterNumber}: {chapterData.title || 'Untitled'}
          </div>
          <div className="text-xs text-gray-400">
            Press Esc to exit
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {chapterData.wordCount} words
          </div>
          <div className="text-xs text-gray-400">
            Auto-save enabled
          </div>
        </div>
      </div>
      
      {/* Focus mode content */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <textarea
          value={chapterData.content}
          onChange={handleContentChange}
          placeholder="Start writing your chapter..."
          className="w-full h-full resize-none border-none outline-none text-lg leading-relaxed"
          style={{ 
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            lineHeight: 1.7
          }}
        />
      </div>
    </div>
  )
  
  if (isFocusMode) {
    return <FocusMode />
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/own" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
            <div className="flex items-center gap-4">
              <QuickNavigation currentPage="write" />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-800">
                Write Chapter {chapterNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                {bookTitle ? decodeURIComponent(bookTitle) : 'Untitled Book'}
                {genre && <span className="text-gray-400"> • {decodeURIComponent(genre)}</span>}
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Writing Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-8">
                {!isPreviewMode ? (
                  <>
                    {/* Chapter Title */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Title *
                      </label>
                      <input
                        type="text"
                        value={chapterData.title}
                        onChange={handleTitleChange}
                        placeholder={`Chapter ${chapterNumber}: Enter your title here`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                      />
                    </div>

                    {/* Chapter Subtitle/Quote */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle or Quote (Optional)
                      </label>
                      <input
                        type="text"
                        value={chapterData.subtitle || ''}
                        onChange={handleSubtitleChange}
                        placeholder="A memorable quote or subtitle for this chapter..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent italic text-gray-600"
                      />
                    </div>

                    {/* Text Formatting Toolbar */}
                    <div className="mb-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value))}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value={14}>14px</option>
                          <option value={16}>16px</option>
                          <option value={18}>18px</option>
                          <option value={20}>20px</option>
                        </select>
                        
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Times New Roman">Times</option>
                          <option value="Arial">Arial</option>
                        </select>
                      </div>
                      
                      <div className="w-px h-6 bg-gray-300"></div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => formatText('bold')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('italic')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => formatText('quote')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Quote"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Chapter Content */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Content *
                      </label>
                      <textarea
                        ref={contentRef}
                        value={chapterData.content}
                        onChange={handleContentChange}
                        placeholder="Start writing your chapter here..."
                        rows={20}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        style={{ 
                          fontSize: `${fontSize}px`,
                          fontFamily: fontFamily,
                          lineHeight: 1.6
                        }}
                      />
                    </div>
                  </>
                ) : (
                  // Preview Mode
                  <div className="prose prose-lg max-w-none">
                    <h1 className="text-3xl font-bold mb-2">{chapterData.title || `Chapter ${chapterNumber}: Untitled`}</h1>
                    {chapterData.subtitle && (
                      <p className="text-xl text-gray-600 italic mb-6">"{chapterData.subtitle}"</p>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {chapterData.content || 'No content written yet...'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                {/* Ready to Publish section - only show in Preview mode */}
                {isPreviewMode && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Ready to Publish?</h3>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                      Your chapter looks great! Choose a license and publish to Story Protocol.
                    </p>
                    <button
                      onClick={handleChooseLicense}
                      disabled={!chapterData.title.trim() || !chapterData.content.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      Choose License →
                    </button>
                  </div>
                )}

                <h3 className="font-semibold text-gray-800 mb-4">Chapter Stats</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-medium">{chapterData.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Characters:</span>
                    <span className="font-medium">{chapterData.content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading time:</span>
                    <span className="font-medium">{Math.ceil(chapterData.wordCount / 200)} min</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                    {isPreviewMode ? 'Edit' : 'Preview'}
                  </button>
                  
                  <button
                    onClick={() => setIsFocusMode(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Focus
                  </button>
                </div>


                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">💡 Writing Tips</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Aim for 800-1500 words per chapter</li>
                    <li>• End with a hook or cliffhanger</li>
                    <li>• Use Focus Mode for distraction-free writing</li>
                    <li>• Auto-save keeps your work safe</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* License Selection Modal */}
      {showLicenseSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🛡️ Choose License for Chapter {chapterNumber}</h2>
                  <p className="text-gray-600 mt-1">{chapterData.title}</p>
                </div>
                <button
                  onClick={() => setShowLicenseSelection(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <IPRegistrationSection
                onIPOptionsChange={handleLicenseSelected}
                initialOptions={licenseOptions}
                isCollapsed={false}
              />
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLicenseSelection(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Get the current license options from the IP registration component
                    setShowLicenseSelection(false)
                    setShowPublishingModal(true)
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  Continue to Publish →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publishing Progress */}
      {isPublishing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Publishing Chapter</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {currentStep === 'validating' ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <span className="text-gray-700">Validating chapter data</span>
              </div>
              
              <div className="flex items-center gap-3">
                {currentStep === 'minting-nft' || currentStep === 'registering-ip' || currentStep === 'creating-license' || currentStep === 'attaching-license' ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : currentStep === 'saving-to-storage' || currentStep === 'success' ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                )}
                <span className="text-gray-700">Blockchain registration</span>
              </div>
              
              <div className="flex items-center gap-3">
                {currentStep === 'saving-to-storage' ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : currentStep === 'success' ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                )}
                <span className="text-gray-700">Saving to storage</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {currentStep === 'validating' && 'Checking chapter data...'}
                {(currentStep === 'minting-nft' || currentStep === 'registering-ip') && 'Registering on blockchain...'}
                {(currentStep === 'creating-license' || currentStep === 'attaching-license') && 'Setting up licensing...'}
                {currentStep === 'saving-to-storage' && 'Uploading to storage...'}
                {currentStep === 'success' && 'Chapter published successfully!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChapterWritingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-orange-100 via-pink-100 to-blue-200 flex items-center justify-center">
        <div className="text-lg">Loading chapter editor...</div>
      </div>
    }>
      <ChapterWritingPageContent />
    </Suspense>
  )
}