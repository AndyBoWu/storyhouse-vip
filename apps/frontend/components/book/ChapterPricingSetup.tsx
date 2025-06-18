'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useBookRegistration } from '@/hooks/useBookRegistration'
import { Loader2, DollarSign, AlertCircle } from 'lucide-react'

interface ChapterPricingSetupProps {
  bookId: string
  authorAddress: string
  totalChapters: number
  onComplete?: () => void
}

export function ChapterPricingSetup({ 
  bookId, 
  authorAddress,
  totalChapters,
  onComplete 
}: ChapterPricingSetupProps) {
  const { address } = useAccount()
  const { setChapterAttribution, isLoading, error } = useBookRegistration()
  
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [showPrompt, setShowPrompt] = useState(true)
  
  // Only show for book authors
  if (!address || address.toLowerCase() !== authorAddress.toLowerCase()) {
    return null
  }
  
  const handleSetupChapterPricing = async () => {
    setIsSettingUp(true)
    
    try {
      // Set attribution for chapters 4-10 (0.5 TIP each)
      for (let i = 4; i <= Math.min(totalChapters, 10); i++) {
        setCurrentChapter(i)
        
        const result = await setChapterAttribution({
          bookId,
          chapterNumber: i,
          originalAuthor: authorAddress,
          unlockPrice: '0.5',
          isOriginalContent: true
        })
        
        if (!result?.success) {
          throw new Error(`Failed to set pricing for chapter ${i}`)
        }
        
        console.log(`✅ Chapter ${i} pricing set to 0.5 TIP`)
      }
      
      setShowPrompt(false)
      onComplete?.()
      
    } catch (err) {
      console.error('Failed to set chapter pricing:', err)
    } finally {
      setIsSettingUp(false)
      setCurrentChapter(0)
    }
  }
  
  if (!showPrompt) {
    return null
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Chapter Pricing Not Set
          </h3>
          
          <p className="text-yellow-700 mb-4">
            Your chapters need pricing configured before readers can unlock them. 
            Chapters 1-3 are free, and chapters 4+ are 0.5 TIP each.
          </p>
          
          {isSettingUp && currentChapter > 0 && (
            <div className="bg-white rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                Setting up chapter {currentChapter} of {Math.min(totalChapters, 10)}...
              </p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleSetupChapterPricing}
            disabled={isSettingUp || isLoading}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSettingUp || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up pricing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Set Chapter Pricing
              </>
            )}
          </button>
          
          <p className="text-xs text-yellow-600 mt-3">
            💡 This is a one-time setup. You can adjust pricing later if needed.
          </p>
        </div>
      </div>
    </div>
  )
}