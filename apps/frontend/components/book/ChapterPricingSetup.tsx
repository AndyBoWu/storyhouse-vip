'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useBookRegistration, HYBRID_REVENUE_CONTROLLER_V2_ADDRESS, HYBRID_V2_ABI } from '@/hooks/useBookRegistration'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'
import { Loader2, DollarSign, AlertCircle } from 'lucide-react'

interface ChapterPricingSetupProps {
  bookId: string
  authorAddress: string
  totalChapters: number
  onComplete?: () => void
}

const CHAPTER_ATTRIBUTION_ABI = [
  {
    name: 'chapterAttributions',
    type: 'function',
    inputs: [
      { name: '', type: 'bytes32' },
      { name: '', type: 'uint256' }
    ],
    outputs: [
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' }
    ],
    stateMutability: 'view'
  }
] as const

export function ChapterPricingSetup({ 
  bookId, 
  authorAddress,
  totalChapters,
  onComplete 
}: ChapterPricingSetupProps) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { setChapterAttribution, isLoading, error, attributionState } = useBookRegistration()
  
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [pendingChapters, setPendingChapters] = useState<number[]>([])
  
  // Watch for transaction confirmation
  useEffect(() => {
    if (attributionState?.hash && isSettingUp) {
      console.log('🎉 Transaction confirmed:', attributionState.hash)
    }
  }, [attributionState?.hash, isSettingUp])
  
  // Check if chapters need attribution
  useEffect(() => {
    if (!publicClient || !bookId || totalChapters < 4) {
      setIsChecking(false)
      return
    }
    
    const checkChapterAttributions = async () => {
      try {
        const { bytes32Id } = parseBookId(bookId)
        let needsAttribution = false
        
        // Check chapters 4-10
        for (let i = 4; i <= Math.min(totalChapters, 10); i++) {
          const attribution = await publicClient.readContract({
            address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
            abi: CHAPTER_ATTRIBUTION_ABI,
            functionName: 'chapterAttributions',
            args: [bytes32Id, BigInt(i)],
          })
          
          // If originalAuthor is zero address, attribution is not set
          if (attribution[0] === '0x0000000000000000000000000000000000000000') {
            needsAttribution = true
            break
          }
        }
        
        setShowPrompt(needsAttribution)
      } catch (err) {
        console.error('Error checking chapter attributions:', err)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkChapterAttributions()
  }, [publicClient, bookId, totalChapters])
  
  // Only show for book authors
  if (!address || address.toLowerCase() !== authorAddress.toLowerCase()) {
    return null
  }
  
  const handleSetupChapterPricing = async () => {
    setIsSettingUp(true)
    setPendingChapters([])
    
    try {
      const { bytes32Id } = parseBookId(bookId)
      const chaptersToSet: number[] = []
      
      // First, check which chapters need attribution
      for (let i = 4; i <= Math.min(totalChapters, 10); i++) {
        const attribution = await publicClient?.readContract({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: CHAPTER_ATTRIBUTION_ABI,
          functionName: 'chapterAttributions',
          args: [bytes32Id, BigInt(i)],
        })
        
        if (!attribution || attribution[0] === '0x0000000000000000000000000000000000000000') {
          chaptersToSet.push(i)
        }
      }
      
      if (chaptersToSet.length === 0) {
        console.log('All chapters already have attribution set')
        setShowPrompt(false)
        onComplete?.()
        return
      }
      
      setPendingChapters(chaptersToSet)
      
      // Process chapters one at a time to avoid overwhelming the user
      for (const chapterNum of chaptersToSet) {
        setCurrentChapter(chapterNum)
        
        const result = await setChapterAttribution({
          bookId,
          chapterNumber: chapterNum,
          originalAuthor: authorAddress,
          unlockPrice: '0.5',
          isOriginalContent: true
        })
        
        if (!result?.success && !result?.pending) {
          throw new Error(`Failed to initiate pricing for chapter ${chapterNum}: ${result?.error}`)
        }
        
        // Wait for user to process the transaction in their wallet
        // Give them time between transactions
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Remove from pending list
        setPendingChapters(prev => prev.filter(ch => ch !== chapterNum))
        console.log(`✅ Chapter ${chapterNum} pricing transaction initiated`)
      }
      
      // Wait a bit for the last transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      setShowPrompt(false)
      onComplete?.()
      
    } catch (err) {
      console.error('Failed to set chapter pricing:', err)
    } finally {
      setIsSettingUp(false)
      setCurrentChapter(0)
      setPendingChapters([])
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
          
          {isSettingUp && (
            <div className="bg-white rounded-lg p-3 mb-4">
              {currentChapter > 0 ? (
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    Processing chapter {currentChapter}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {attributionState?.isWritePending 
                      ? 'Waiting for wallet confirmation...' 
                      : attributionState?.hash 
                      ? 'Transaction submitted! Waiting for confirmation...'
                      : 'Please confirm the transaction in your wallet'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  Checking chapters that need pricing...
                </p>
              )}
              {pendingChapters.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Remaining chapters: {pendingChapters.join(', ')}
                </p>
              )}
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