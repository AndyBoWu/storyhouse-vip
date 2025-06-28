'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'
import { HYBRID_REVENUE_CONTROLLER_V2_ADDRESS } from '@/hooks/useBookRegistration'
import { CheckCircle, XCircle, Loader2, GitBranch } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface ChapterAttributionStatusProps {
  bookId: string
  chapterNumber: number
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

export function ChapterAttributionStatus({ bookId, chapterNumber }: ChapterAttributionStatusProps) {
  const publicClient = usePublicClient()
  const [isChecking, setIsChecking] = useState(true)
  const [attribution, setAttribution] = useState<{
    originalAuthor: string
    unlockPrice: bigint
    isOriginalContent: boolean
    isSet: boolean
    isInherited?: boolean
    sourceBookId?: string
    sourceAuthorName?: string
  } | null>(null)

  useEffect(() => {
    if (!publicClient || !bookId) return

    const checkAttribution = async () => {
      try {
        // First, check if this book is a derivative and if this chapter is inherited
        let isInheritedChapter = false
        let parentBookId: string | undefined
        let parentBookData: any | undefined
        
        try {
          console.log(`🔍 Checking if book ${bookId} is a derivative...`)
          const bookData = await apiClient.getBookById(bookId)
          
          if (bookData && bookData.parentBook && bookData.branchPoint) {
            // This is a derivative book
            const branchChapter = parseInt(bookData.branchPoint.replace('ch', ''))
            
            // Check if current chapter is inherited (before or at branch point)
            if (chapterNumber <= branchChapter) {
              isInheritedChapter = true
              parentBookId = bookData.parentBook
              console.log(`🌿 Chapter ${chapterNumber} is inherited from parent book: ${parentBookId}`)
              
              // Get parent book data for author info
              parentBookData = await apiClient.getBookById(parentBookId)
            }
          }
        } catch (error) {
          console.warn('Failed to check book derivation status:', error)
        }
        
        // Determine which book ID to use for attribution check
        const bookIdToCheck = isInheritedChapter && parentBookId ? parentBookId : bookId
        const { bytes32Id } = parseBookId(bookIdToCheck)
        
        console.log(`📋 Checking attribution for:`, {
          bookIdToCheck,
          chapterNumber,
          isInheritedChapter
        })
        
        const result = await publicClient.readContract({
          address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
          abi: CHAPTER_ATTRIBUTION_ABI,
          functionName: 'chapterAttributions',
          args: [bytes32Id, BigInt(chapterNumber)],
        })
        
        const [originalAuthor, sourceBookId, unlockPrice, isOriginalContent] = result
        const isSet = originalAuthor !== '0x0000000000000000000000000000000000000000'
        
        setAttribution({
          originalAuthor: originalAuthor as string,
          unlockPrice: unlockPrice as bigint,
          isOriginalContent: isOriginalContent as boolean,
          isSet,
          isInherited: isInheritedChapter,
          sourceBookId: isInheritedChapter ? parentBookId : undefined,
          sourceAuthorName: isInheritedChapter && parentBookData ? parentBookData.authorName : undefined
        })
        
        console.log(`📊 Chapter ${chapterNumber} attribution:`, {
          originalAuthor,
          sourceBookId,
          unlockPrice: unlockPrice.toString(),
          unlockPriceTIP: Number(unlockPrice) / 1e18,
          isOriginalContent,
          isSet,
          isInherited: isInheritedChapter,
          sourceBook: parentBookId
        })
      } catch (error) {
        console.error('Failed to check attribution:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkAttribution()
  }, [publicClient, bookId, chapterNumber])

  if (isChecking) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking attribution...
      </div>
    )
  }

  if (!attribution) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-red-600">
        <XCircle className="w-4 h-4" />
        Failed to check attribution
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="font-semibold text-sm mb-2">Chapter {chapterNumber} Attribution Status</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {attribution.isSet ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">Attribution Set</span>
              {attribution.isInherited && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  <GitBranch className="w-3 h-3" />
                  Inherited
                </span>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 font-medium">No Attribution</span>
            </>
          )}
        </div>
        
        {attribution.isSet && (
          <>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <span className="text-gray-500">
                  {attribution.isInherited ? 'Original Author:' : 'Author:'}
                </span>
                <div className="font-mono text-gray-700">
                  {attribution.originalAuthor.slice(0, 6)}...{attribution.originalAuthor.slice(-4)}
                  {attribution.sourceAuthorName && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      ({attribution.sourceAuthorName})
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Unlock Price:</span>
                <div className="font-medium text-gray-700">
                  {Number(attribution.unlockPrice) / 1e18} TIP
                </div>
              </div>
            </div>
            {attribution.isInherited && attribution.sourceBookId && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <span className="text-blue-700">
                  This chapter is inherited from the parent book through branching.
                  Revenue will be shared with the original author.
                </span>
              </div>
            )}
            <div className="mt-2">
              <span className="text-gray-500 text-xs">Type:</span>
              <div className="text-xs text-gray-700">
                {attribution.isOriginalContent ? 'Original Content' : 'Derivative Content'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}