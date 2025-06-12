'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useChapterAccess } from '@/hooks/useChapterAccess'
import { useChapterUnlock } from '@/hooks/useChapterUnlock'

interface ChapterAccessControlProps {
  bookId: string
  chapterNumber: number
  chapterTitle: string
  onAccessGranted: () => void
  className?: string
}

export default function ChapterAccessControl({
  bookId,
  chapterNumber,
  chapterTitle,
  onAccessGranted,
  className = ''
}: ChapterAccessControlProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { 
    checkChapterAccess, 
    unlockChapter, 
    getChapterPricing,
    isLoading, 
    error 
  } = useChapterAccess()
  
  const {
    unlockPaidChapter,
    getTransactionStatus,
    error: web3Error
  } = useChapterUnlock()

  const [accessInfo, setAccessInfo] = useState<any>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const pricing = getChapterPricing(chapterNumber)

  // Check access when component mounts or wallet connects
  useEffect(() => {
    if (bookId && chapterNumber) {
      checkChapterAccess(bookId, chapterNumber).then(setAccessInfo)
    }
  }, [bookId, chapterNumber, address, checkChapterAccess])

  const handleUnlock = async () => {
    setIsUnlocking(true)
    
    try {
      if (pricing.isFree) {
        // Free chapters use API unlock
        await unlockChapter({
          bookId,
          chapterNumber,
          onSuccess: (data) => {
            setAccessInfo(data)
            onAccessGranted()
          },
          onError: (error) => {
            console.error('Free chapter unlock failed:', error)
          }
        })
      } else {
        // Paid chapters use Web3 unlock
        await unlockPaidChapter({
          bookId,
          chapterNumber,
          onSuccess: (txHash) => {
            console.log('✅ Chapter unlocked via blockchain:', txHash)
            setAccessInfo({
              canAccess: true,
              alreadyUnlocked: true,
              unlockPrice: pricing.unlockPrice,
              isFree: false,
              transactionHash: txHash
            })
            onAccessGranted()
          },
          onError: (error) => {
            console.error('Paid chapter unlock failed:', error)
          }
        })
      }
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleConnectWallet = () => {
    const metamaskConnector = connectors.find(c => c.name.toLowerCase().includes('metamask'))
    if (metamaskConnector) {
      connect({ connector: metamaskConnector })
    }
  }

  // Already unlocked or free and can access
  if (accessInfo?.canAccess && (accessInfo.alreadyUnlocked || accessInfo.isFree)) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-green-900">Chapter {chapterNumber}: {chapterTitle}</h3>
            <p className="text-sm text-green-700">
              {pricing.isFree ? 'Free to read!' : 'Unlocked - Ready to read'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Need to connect wallet for chapters 4+
  if (!isConnected && chapterNumber > 3) {
    return (
      <div className={`p-6 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Chapter {chapterNumber}: {chapterTitle}
          </h3>
          <p className="text-blue-700 mb-4">
            Connect your wallet to unlock this chapter for {pricing.unlockPrice} TIP tokens
          </p>
          <button
            onClick={handleConnectWallet}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
          {pricing.readReward > 0 && (
            <p className="text-xs text-blue-600 mt-2">
              You'll earn {pricing.readReward} TIP tokens for completing this chapter
            </p>
          )}
        </div>
      </div>
    )
  }

  // Free chapter - can unlock immediately
  if (pricing.isFree) {
    return (
      <div className={`p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Chapter {chapterNumber}: {chapterTitle}
          </h3>
          <p className="text-green-700 mb-4">
            This chapter is FREE to read! No payment required.
          </p>
          <button
            onClick={handleUnlock}
            disabled={isUnlocking || isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isUnlocking ? 'Starting...' : 'Start Reading'}
          </button>
          <p className="text-xs text-green-600 mt-2">
            You'll earn {pricing.readReward} TIP tokens for completing this chapter
          </p>
        </div>
      </div>
    )
  }

  // Paid chapter - needs TIP payment
  return (
    <div className={`p-6 bg-orange-50 border border-orange-200 rounded-lg ${className}`}>
      <div className="text-center">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-orange-900 mb-2">
          Chapter {chapterNumber}: {chapterTitle}
        </h3>
        <p className="text-orange-700 mb-4">
          Unlock this chapter for <span className="font-semibold">{pricing.unlockPrice} TIP tokens</span>
        </p>
        
        {(error || web3Error) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error || web3Error}</p>
          </div>
        )}
        
        {/* Show transaction status for paid chapters */}
        {!pricing.isFree && (() => {
          const txStatus = getTransactionStatus()
          if (txStatus.isApproving) {
            return (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  🔐 Approving TIP token spending... Please confirm in your wallet.
                </p>
              </div>
            )
          }
          if (txStatus.isUnlocking) {
            return (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ⏳ Unlocking chapter on blockchain... Please wait for confirmation.
                </p>
              </div>
            )
          }
          return null
        })()}
        
        <button
          onClick={handleUnlock}
          disabled={isUnlocking || isLoading}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {isUnlocking ? 'Processing...' : `Unlock for ${pricing.unlockPrice} TIP`}
        </button>
        
        {pricing.readReward > 0 && (
          <div className="mt-4 text-sm text-orange-600">
            <p>✨ You'll earn {pricing.readReward} TIP tokens for completing this chapter</p>
            <p className="mt-1">💡 Reading rewards often exceed unlock costs!</p>
          </div>
        )}
      </div>
    </div>
  )
}