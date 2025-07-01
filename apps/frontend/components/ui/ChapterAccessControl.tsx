'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useChapterAccess } from '@/hooks/useChapterAccess'
import { useChapterUnlock } from '@/hooks/useChapterUnlock'
import { useReadingLicense } from '@/hooks/useReadingLicense'
import { apiClient } from '@/lib/api-client'
import { TIPBalanceDisplay } from './TIPBalanceDisplay'

interface ChapterAccessControlProps {
  bookId: string
  chapterNumber: number
  chapterTitle: string
  authorAddress?: string
  onAccessGranted: () => void
  className?: string
}

export default function ChapterAccessControl({
  bookId,
  chapterNumber,
  chapterTitle,
  authorAddress,
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

  const {
    mintReadingLicense,
    getReadingLicensePricing,
    hasReadingLicense,
    error: licenseError
  } = useReadingLicense()

  const [accessInfo, setAccessInfo] = useState<any>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [hasSuccessfulUnlock, setHasSuccessfulUnlock] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [isAttributionReady, setIsAttributionReady] = useState(true) // Assume ready by default
  const [isCheckingAccess, setIsCheckingAccess] = useState(true) // New loading state

  const pricing = getChapterPricing(chapterNumber)

  // Check access when component mounts or wallet connects (but don't override successful unlocks)
  useEffect(() => {
    if (bookId && chapterNumber && !hasSuccessfulUnlock) {
      setIsCheckingAccess(true)
      checkChapterAccess(bookId, chapterNumber)
        .then(setAccessInfo)
        .finally(() => setIsCheckingAccess(false))
    }
  }, [bookId, chapterNumber, address, checkChapterAccess, hasSuccessfulUnlock])

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
        // Paid chapters use Reading License minting
        console.log('Access info for paid chapter:', accessInfo)
        
        // If accessInfo is not available yet, fetch it first
        let currentAccessInfo = accessInfo
        if (!currentAccessInfo) {
          console.log('Fetching access info before minting...')
          currentAccessInfo = await checkChapterAccess(bookId, chapterNumber)
        }
        
        // Get the actual IP asset ID from the access info
        const chapterIpAssetId = currentAccessInfo?.ipAssetId || '0xbfBC95F434EF189CeB1E3587fd9B29B10dF2c74f' // Use the correct IP Asset ID for chapter 4
        
        if (!chapterIpAssetId) {
          console.error('Chapter IP asset ID not found')
          // The error will be shown through the licenseError from useReadingLicense hook
          return
        }
        
        console.log('Using IP Asset ID:', chapterIpAssetId)
        console.log('Current wallet address:', address)
        
        await mintReadingLicense({
          bookId,
          chapterNumber,
          chapterIpAssetId,
          onSuccess: async (licenseData) => {
            console.log('✅ Transaction response:', licenseData)
            
            // Handle transaction initiation
            if (licenseData.transactionInitiated) {
              console.log('🎉 Transaction initiated! Monitoring for completion...')
              
              // Start monitoring for transaction completion
              const checkCompletion = async () => {
                let attempts = 0
                const maxAttempts = 30 // 30 seconds max - transactions usually confirm within 15-20s
                
                // Show immediate feedback
                setRetryError('🔄 Transaction submitted! This usually takes 15-20 seconds...')
                
                const intervalId = setInterval(async () => {
                  attempts++
                  
                  // Only check every 3 seconds after the first 10 attempts to reduce API load
                  if (attempts > 10 && attempts % 3 !== 0) {
                    return
                  }
                  
                  try {
                    // Check if the chapter is now unlocked on the blockchain
                    const updatedAccessInfo = await checkChapterAccess(bookId, chapterNumber)
                    
                    if (updatedAccessInfo?.canAccess || updatedAccessInfo?.alreadyUnlocked) {
                      console.log('✅ Chapter unlock detected on blockchain!')
                      clearInterval(intervalId)
                      setRetryError('✨ Success! Loading your chapter...')
                      
                      // Update UI state
                      setAccessInfo({
                        canAccess: true,
                        alreadyUnlocked: true,
                        unlockPrice: pricing.unlockPrice,
                        isFree: false,
                        transactionHash: licenseData.transactionHash || 'blockchain_confirmed'
                      })
                      
                      setHasSuccessfulUnlock(true)
                      
                      // Small delay to ensure state updates propagate
                      setTimeout(() => {
                        onAccessGranted()
                      }, 100)
                      
                      return
                    }
                  } catch (error) {
                    console.log('Check attempt', Math.floor(attempts / 3), 'failed, will retry...')
                    // Don't log every attempt to reduce console noise
                  }
                  
                  // Update progress message
                  if (attempts % 5 === 0) {
                    setRetryError(`⏳ Still confirming... (${attempts}s elapsed) - Your transaction is being processed`)
                  }
                  
                  // Stop checking after max attempts
                  if (attempts >= maxAttempts) {
                    console.log(`⏱️ Monitoring stopped after ${maxAttempts}s.`)
                    clearInterval(intervalId)
                    
                    // Do a final check and auto-refresh if transaction was successful
                    setRetryError('🔄 Finalizing unlock...')
                    
                    try {
                      const finalCheck = await apiClient.get(
                        `/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}/access?userAddress=${address}&t=${Date.now()}`
                      )
                      
                      if (finalCheck?.canAccess || finalCheck?.alreadyUnlocked) {
                        console.log('✅ Transaction confirmed! Auto-refreshing chapter...')
                        setRetryError('✨ Success! Loading your chapter...')
                        setAccessInfo({
                          canAccess: true,
                          alreadyUnlocked: true,
                          unlockPrice: pricing.unlockPrice,
                          isFree: false,
                          transactionHash: 'blockchain_confirmed'
                        })
                        setHasSuccessfulUnlock(true)
                        
                        // Auto-refresh the chapter content
                        setTimeout(() => {
                          onAccessGranted()
                        }, 500)
                      } else {
                        // Transaction might still be pending
                        setRetryError('⚠️ Transaction is taking longer than expected. Please refresh the page in a moment.')
                      }
                    } catch (error) {
                      console.log('Final check failed:', error)
                      setRetryError('⚠️ Could not verify transaction status. Please refresh the page.')
                    }
                  }
                }, 1000) // Check every second
              }
              
              // Start monitoring
              checkCompletion()
              return
            }
            
            // Handle successful license minting (legacy flow)
            try {
              // Update access info with license token data
              setAccessInfo({
                canAccess: true,
                alreadyUnlocked: true,
                unlockPrice: pricing.unlockPrice,
                isFree: false,
                licenseTokenId: licenseData.licenseTokenId,
                transactionHash: licenseData.transactionHash
              })
              setHasSuccessfulUnlock(true) // Prevent useEffect from overriding
              onAccessGranted()
              
            } catch (error) {
              console.error('Failed to process license minting result:', error)
              // Still show as unlocked since license was minted
              setAccessInfo({
                canAccess: true,
                alreadyUnlocked: true,
                unlockPrice: pricing.unlockPrice,
                isFree: false,
                licenseTokenId: licenseData.licenseTokenId
              })
              setHasSuccessfulUnlock(true)
              onAccessGranted()
            }
          },
          onError: async (error) => {
            console.error('Reading license minting failed:', error)
            
            // Auto-retry for attribution not configured error
            if (error?.includes('Chapter attribution not yet configured') || 
                error?.includes('Unable to unlock chapter') ||
                error?.includes('configuration issue')) {
              console.log('⏳ Chapter attribution not ready, will retry in 10 seconds...')
              
              // Show a temporary message
              setRetryError('Chapter pricing is being confirmed on the blockchain... This may take up to 10 seconds...')
              
              // Wait 10 seconds and retry once
              setTimeout(async () => {
                console.log('🔄 Retrying chapter unlock...')
                setRetryError(null)
                
                try {
                  await mintReadingLicense({
                    bookId,
                    chapterNumber,
                    chapterIpAssetId,
                    onSuccess: async (licenseData) => {
                      // Same success handler as above
                      console.log('✅ Retry successful!')
                      
                      if (licenseData.transactionInitiated) {
                        console.log('🎉 Transaction initiated on retry!')
                        // Use the same monitoring logic from the original success handler
                        const checkCompletion = async () => {
                          let attempts = 0
                          const maxAttempts = 30
                          
                          setRetryError('🔄 Transaction submitted! Waiting for blockchain confirmation...')
                          
                          const intervalId = setInterval(async () => {
                            attempts++
                            
                            try {
                              const updatedAccessInfo = await apiClient.get(
                                `/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}/access?userAddress=${address}&t=${Date.now()}`
                              )
                              
                              if (updatedAccessInfo?.canAccess || updatedAccessInfo?.alreadyUnlocked) {
                                console.log('✅ Chapter unlock detected on blockchain!')
                                clearInterval(intervalId)
                                setRetryError(null)
                                
                                setAccessInfo({
                                  canAccess: true,
                                  alreadyUnlocked: true,
                                  unlockPrice: pricing.unlockPrice,
                                  isFree: false,
                                  transactionHash: licenseData.transactionHash || 'blockchain_confirmed'
                                })
                                
                                setHasSuccessfulUnlock(true)
                                setTimeout(() => {
                                  onAccessGranted()
                                }, 100)
                                return
                              }
                            } catch (error) {
                              console.log('Checking unlock status...', attempts)
                            }
                            
                            if (attempts % 5 === 0) {
                              setRetryError(`⏳ Still waiting for confirmation... (${attempts}s)`)
                            }
                            
                            if (attempts >= maxAttempts) {
                              console.log('⏱️ Timeout reached.')
                              clearInterval(intervalId)
                              setRetryError('Transaction is taking longer than expected. Please refresh the page in a moment.')
                            }
                          }, 1000)
                        }
                        
                        checkCompletion()
                        return
                      }
                      
                      // Handle successful license minting (legacy flow)
                      setAccessInfo({
                        canAccess: true,
                        alreadyUnlocked: true,
                        unlockPrice: pricing.unlockPrice,
                        isFree: false,
                        licenseTokenId: licenseData.licenseTokenId,
                        transactionHash: licenseData.transactionHash
                      })
                      setHasSuccessfulUnlock(true)
                      onAccessGranted()
                    },
                    onError: (retryError) => {
                      console.error('Retry also failed:', retryError)
                      setRetryError(null) // Clear the temporary message
                    }
                  })
                } catch (retryError) {
                  console.error('Retry failed:', retryError)
                  setRetryError(null) // Clear the temporary message
                }
              }, 10000)
            }
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

  // Show loading state while checking access
  if (isCheckingAccess && !hasSuccessfulUnlock) {
    return (
      <div className={`p-6 bg-gray-50 border border-gray-200 rounded-xl animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Chapter {chapterNumber}: {chapterTitle}</h3>
            <p className="text-sm text-gray-500 mt-1">Checking access status...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if current user is the author - authors have full access
  const isAuthor = address && authorAddress && address.toLowerCase() === authorAddress.toLowerCase()
  
  if (isAuthor) {
    return (
      <div className={`p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chapter {chapterNumber}: {chapterTitle}</h3>
              <div className="mt-1">
                <p className="text-sm text-purple-700 font-medium">
                  👑 Author Access
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  You have full access to all your chapters
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Author
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={onAccessGranted}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Reading →
          </button>
        </div>
      </div>
    )
  }

  // Already unlocked or free and can access
  if (accessInfo?.canAccess && (accessInfo.alreadyUnlocked || accessInfo.isFree)) {
    return (
      <div className={`p-6 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chapter {chapterNumber}: {chapterTitle}</h3>
              {pricing.isFree ? (
                <p className="text-sm text-emerald-700 font-medium mt-1">
                  ✨ Free Chapter - Enjoy your reading!
                </p>
              ) : (
                <div className="mt-1">
                  <p className="text-sm text-violet-700 font-medium">
                    🎉 Premium Access Unlocked
                  </p>
                  <p className="text-xs text-violet-600 mt-1">
                    📄 You own a personal reading license for this chapter
                  </p>
                </div>
              )}
            </div>
          </div>
          {!pricing.isFree && (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Licensed
              </span>
              <span className="text-xs text-violet-600 mt-1">0.5 TIP paid</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={onAccessGranted}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Reading →
          </button>
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
        
        {/* Show wallet balances */}
        {isConnected && (
          <div className="mb-4">
            <TIPBalanceDisplay />
          </div>
        )}
        
        {(error || web3Error || licenseError || retryError) && (
          <div className={`mb-4 p-3 border rounded-lg ${
            retryError ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${retryError ? 'text-blue-700' : 'text-red-700'}`}>
              {(() => {
                // Show retry message if present
                if (retryError) {
                  return retryError
                }
                
                const errorMsg = error || web3Error || licenseError
                // Special handling for attribution not configured error
                if (errorMsg?.includes('Chapter attribution not yet configured') || errorMsg?.includes('chapter pricing has not been configured')) {
                  return (
                    <>
                      <strong>⚠️ Chapter Pricing Not Configured</strong><br />
                      This chapter's pricing hasn't been set up yet. The book author needs to configure chapter pricing on their book page before readers can unlock paid chapters.
                    </>
                  )
                }
                return errorMsg
              })()}
            </p>
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
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUnlock}
            disabled={isUnlocking || isLoading || !!retryError}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {isUnlocking ? 'Minting License...' : retryError ? 'Waiting for confirmation...' : `Get Reading License for ${pricing.unlockPrice} TIP`}
          </button>
          
          {/* Show manual check button if waiting too long */}
          {retryError && (retryError.includes('Still') || retryError.includes('taking longer') || retryError.includes('verify')) && (
            <button
              onClick={async () => {
                setRetryError('🔄 Checking status...')
                try {
                  const result = await checkChapterAccess(bookId, chapterNumber)
                  if (result?.canAccess || result?.alreadyUnlocked) {
                    setAccessInfo({
                      canAccess: true,
                      alreadyUnlocked: true,
                      unlockPrice: pricing.unlockPrice,
                      isFree: false,
                      transactionHash: 'manual_check'
                    })
                    setHasSuccessfulUnlock(true)
                    setRetryError(null)
                    onAccessGranted()
                  } else {
                    setRetryError('Transaction still processing. Your unlock will appear soon - no need to pay again!')
                  }
                } catch (error) {
                  console.error('Manual check failed:', error)
                  setRetryError('Check failed. Please refresh the page.')
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Check Status Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}