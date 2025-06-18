'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useBookRegistration } from '@/hooks/useBookRegistration'

interface BookRegistrationModalProps {
  bookId: string
  totalChapters: number
  chapterPrices?: { [key: number]: string }
  onClose: () => void
  onSuccess?: () => void
}

export default function BookRegistrationModal({
  bookId,
  totalChapters,
  chapterPrices = {},
  onClose,
  onSuccess
}: BookRegistrationModalProps) {
  const { address } = useAccount()
  const { registerBook, setChapterAttribution, checkBookRegistration, isLoading, error } = useBookRegistration()
  
  const [step, setStep] = useState<'check' | 'register' | 'chapters' | 'complete'>('check')
  const [registeredChapters, setRegisteredChapters] = useState<number[]>([])
  const [isRegistered, setIsRegistered] = useState(false)
  
  useEffect(() => {
    checkRegistrationStatus()
  }, [bookId])
  
  const checkRegistrationStatus = async () => {
    const registered = await checkBookRegistration(bookId)
    setIsRegistered(registered)
    setStep(registered ? 'chapters' : 'register')
  }
  
  const handleRegisterBook = async () => {
    const result = await registerBook({
      bookId,
      totalChapters
    })
    
    if (result.success) {
      setIsRegistered(true)
      setStep('chapters')
    }
  }
  
  const handleSetChapterAttribution = async (chapterNumber: number) => {
    if (!address) return
    
    const price = chapterPrices[chapterNumber] || (chapterNumber <= 3 ? '0' : '0.5')
    
    const result = await setChapterAttribution({
      bookId,
      chapterNumber,
      originalAuthor: address,
      unlockPrice: price
    })
    
    if (result.success) {
      setRegisteredChapters([...registeredChapters, chapterNumber])
    }
  }
  
  const handleRegisterAllChapters = async () => {
    if (!address) return
    
    for (let i = 1; i <= totalChapters; i++) {
      if (!registeredChapters.includes(i)) {
        await handleSetChapterAttribution(i)
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    setStep('complete')
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 2000)
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">Register Book for Revenue Sharing</h2>
        
        {step === 'check' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking registration status...</p>
          </div>
        )}
        
        {step === 'register' && (
          <div>
            <p className="text-gray-700 mb-6">
              Your book needs to be registered in the HybridRevenueController to enable automatic revenue sharing:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>70% of payments go to you (the author)</li>
              <li>20% for curators of derivative works</li>
              <li>10% platform fee</li>
            </ul>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterBook}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Registering...' : 'Register Book'}
              </button>
            </div>
          </div>
        )}
        
        {step === 'chapters' && (
          <div>
            <p className="text-gray-700 mb-6">
              Now set the unlock prices for each chapter:
            </p>
            
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {Array.from({ length: totalChapters }, (_, i) => i + 1).map(chapterNum => {
                const isSet = registeredChapters.includes(chapterNum)
                const price = chapterPrices[chapterNum] || (chapterNum <= 3 ? '0' : '0.5')
                
                return (
                  <div key={chapterNum} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Chapter {chapterNum}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({price === '0' ? 'FREE' : `${price} TIP`})
                      </span>
                    </div>
                    {isSet ? (
                      <span className="text-green-600">✓ Set</span>
                    ) : (
                      <button
                        onClick={() => handleSetChapterAttribution(chapterNum)}
                        disabled={isLoading}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Set Price
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleRegisterAllChapters}
                disabled={isLoading || registeredChapters.length === totalChapters}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Setting...' : 'Set All Remaining'}
              </button>
            </div>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Registration Complete!</h3>
            <p className="text-gray-600">Your book is now set up for automatic revenue sharing.</p>
          </div>
        )}
      </div>
    </div>
  )
}