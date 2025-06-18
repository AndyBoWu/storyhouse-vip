'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'
import { HYBRID_REVENUE_CONTROLLER_V2_ADDRESS } from '@/hooks/useBookRegistration'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

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
  } | null>(null)

  useEffect(() => {
    if (!publicClient || !bookId) return

    const checkAttribution = async () => {
      try {
        const { bytes32Id } = parseBookId(bookId)
        
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
          isSet
        })
        
        console.log(`📊 Chapter ${chapterNumber} attribution:`, {
          originalAuthor,
          sourceBookId,
          unlockPrice: unlockPrice.toString(),
          unlockPriceTIP: Number(unlockPrice) / 1e18,
          isOriginalContent,
          isSet
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
                <span className="text-gray-500">Author:</span>
                <div className="font-mono text-gray-700">
                  {attribution.originalAuthor.slice(0, 6)}...{attribution.originalAuthor.slice(-4)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Unlock Price:</span>
                <div className="font-medium text-gray-700">
                  {Number(attribution.unlockPrice) / 1e18} TIP
                </div>
              </div>
            </div>
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