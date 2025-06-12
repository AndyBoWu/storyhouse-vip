'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo, Suspense } from 'react'
import { ArrowLeft, Save, Eye, Maximize2, Minimize2, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Quote, Rocket, Shield, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { apiClient } from '@/lib/api-client'
import dynamic from 'next/dynamic'
import QuickNavigation from '@/components/ui/QuickNavigation'
import IPRegistrationSection from '@/components/creator/IPRegistrationSection'
import PublishingModal from '@/components/publishing/PublishingModal'
import { usePublishBookChapter } from '@/hooks/usePublishBookChapter'
import type { EnhancedStoryCreationParams } from '@/lib/types/shared'

// Dynamically import WalletConnect to avoid hydration issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

interface ChapterData {
  title: string
  subtitle?: string
  content: string
  wordCount?: number
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
    content: ''
  })
  
  // UI state
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Publishing workflow state
  const [showPublishingModal, setShowPublishingModal] = useState(false)
  
  // Rich text editor state
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Inter')
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const chapterDataRef = useRef(chapterData)
  
  // Update ref when chapterData changes
  useEffect(() => {
    chapterDataRef.current = chapterData
  }, [chapterData])

  // Calculate word count with useMemo to prevent re-renders
  const wordCount = useMemo(() => {
    return chapterData.content.trim().split(/\s+/).filter(word => word.length > 0).length
  }, [chapterData.content])
  
  // Handle input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChapterData(prev => ({ ...prev, title: e.target.value }))
  }
  
  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChapterData(prev => ({ ...prev, subtitle: e.target.value }))
  }
  
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChapterData(prev => ({ ...prev, content: e.target.value }))
  }, [])
  
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
  const handleSaveDraft = useCallback(async () => {
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
  }, [chapterData, bookId, chapterNumber])
  
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
      const currentData = chapterDataRef.current
      if (currentData.content.length > 0 || currentData.title.length > 0) {
        handleSaveDraft()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [handleSaveDraft])
  
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
    // Skip license selection, go directly to publishing modal
    setShowPublishingModal(true)
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
    wordCount: wordCount,
    readingTime: Math.ceil(wordCount / 200),
    themes: genre ? [decodeURIComponent(genre)] : [], // Use genre from URL
    contentUrl: `chapter-${bookId}-${chapterNumber}` // Generate a temporary identifier
  })
  
  // Memoized style object to prevent re-creation
  const textareaStyle = useMemo(() => ({
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    lineHeight: 1.7
  }), [fontSize, fontFamily])

  // Memoized callback functions for FocusMode
  const handleExitFocus = useCallback(() => setIsFocusMode(false), [])
  const handleToggleDarkMode = useCallback(() => setIsDarkMode(!isDarkMode), [isDarkMode])
  
  if (isFocusMode) {
    return (
      <FocusMode
        content={chapterData.content}
        onContentChange={handleContentChange}
        onExitFocus={handleExitFocus}
        onToggleDarkMode={handleToggleDarkMode}
        isDarkMode={isDarkMode}
        chapterNumber={chapterNumber}
        chapterTitle={chapterData.title}
        textareaStyle={textareaStyle}
      />
    )
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
                      Your chapter looks great! Publish it to Story Protocol blockchain for IP protection.
                    </p>
                    <button
                      onClick={handleChooseLicense}
                      disabled={!chapterData.title.trim() || !chapterData.content.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Rocket className="w-4 h-4" />
                      Publish to Story Protocol →
                    </button>
                  </div>
                )}

                <h3 className="font-semibold text-gray-800 mb-4">Chapter Stats</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Characters:</span>
                    <span className="font-medium">{chapterData.content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading time:</span>
                    <span className="font-medium">{Math.ceil(wordCount / 200)} min</span>
                  </div>
                </div>

                {/* Chapter Pricing Information */}
                <div className="mb-6 p-4 rounded-lg border-2 border-dashed border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">💰 Chapter Pricing</h4>
                  {chapterNumber <= 3 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎉</span>
                        <span className="font-semibold text-green-600">FREE Chapter</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Chapters 1-3 are free for all readers to help them discover your story.
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>• Unlock price: Free</div>
                        <div>• Read reward: 0.05 TIP</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💎</span>
                        <span className="font-semibold text-blue-600">Premium Chapter</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        This chapter requires TIP tokens to unlock and offers higher reading rewards.
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>• Unlock price: 0.5 TIP</div>
                        <div>• Read reward: 0.1 TIP</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      isPreviewMode 
                        ? 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {isPreviewMode ? 'Edit' : 'Publish'}
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

      {/* Publishing Modal */}
      {showPublishingModal && (
        <PublishingModal
          isOpen={showPublishingModal}
          onClose={() => setShowPublishingModal(false)}
          story={getStoryForPublishing()}
          chapterNumber={chapterNumber}
          storyTitle={bookId ? `${bookId.split('-').slice(1, -1).join(' ')}` : 'Untitled Story'}
          bookId={bookId || undefined}
          onSuccess={handlePublishingSuccess}
        />
      )}
    </div>
  )
}

// Memoized Focus Mode Component
const FocusMode = memo(({ 
  content, 
  onContentChange, 
  onExitFocus,
  onToggleDarkMode,
  isDarkMode,
  chapterNumber,
  chapterTitle,
  textareaStyle
}: {
  content: string
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onExitFocus: () => void
  onToggleDarkMode: () => void
  isDarkMode: boolean
  chapterNumber: number
  chapterTitle: string
  textareaStyle: React.CSSProperties
}) => {
  const focusTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-focus when entering focus mode
  useEffect(() => {
    if (focusTextareaRef.current) {
      focusTextareaRef.current.focus()
    }
  }, [])
  
  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Focus mode header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onExitFocus}
            className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Minimize2 className="w-4 h-4" />
            Exit Focus
          </button>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Chapter {chapterNumber}: {chapterTitle || 'Untitled'}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Press Esc to exit
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'}`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Auto-save enabled
          </div>
        </div>
      </div>
      
      {/* Focus mode content */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <textarea
          ref={focusTextareaRef}
          value={content}
          onChange={onContentChange}
          placeholder="Start writing your chapter..."
          className={`w-full h-full resize-none border-none outline-none text-lg leading-relaxed ${isDarkMode ? 'bg-gray-900 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
          style={textareaStyle}
          autoFocus
        />
      </div>
    </div>
  )
})

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