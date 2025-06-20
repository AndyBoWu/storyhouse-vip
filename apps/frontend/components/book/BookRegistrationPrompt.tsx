'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useBookRegistration } from '@/hooks/useBookRegistration'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface BookRegistrationPromptProps {
  bookId: string
  chapterNumber: number
  onRegistrationComplete?: () => void
}

export function BookRegistrationPrompt({ 
  bookId, 
  chapterNumber,
  onRegistrationComplete
}: BookRegistrationPromptProps) {
  const { address } = useAccount()
  const { 
    registerBook, 
    checkBookRegistration,
    isLoading,
    error,
    isSupported
  } = useBookRegistration()
  
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  // Check if book is already registered
  useEffect(() => {
    if (bookId && isSupported) {
      checkBookRegistration(bookId).then(setIsRegistered)
    }
  }, [bookId, isSupported, checkBookRegistration])

  const handleRegisterBook = async () => {
    if (!address || !bookId) return
    
    setIsRegistering(true)
    try {
      const result = await registerBook({
        bookId,
        totalChapters: 100, // Current contract maximum (will be increased when contract is redeployed)
        isDerivative: false,
        parentBookId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        ipfsMetadataHash: ''
      })
      
      if (result?.success) {
        setIsRegistered(true)
        onRegistrationComplete?.()
      }
    } catch (err) {
      console.error('Book registration failed:', err)
    } finally {
      setIsRegistering(false)
    }
  }

  // Debug logging
  console.log('BookRegistrationPrompt render decision:', {
    isSupported,
    isRegistered,
    chapterNumber,
    bookId
  })
  
  // Don't show if not supported, already registered, or no chapters yet
  if (!isSupported || isRegistered === true || chapterNumber < 1) {
    console.log('❌ Not showing prompt:', { isSupported, isRegistered, chapterNumber })
    return null
  }
  
  // Still checking registration status
  if (isRegistered === null) {
    return null
  }
  
  console.log('✅ Rendering BookRegistrationPrompt')

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-purple-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            ⚠️ Book Registration Required for Chapter Unlocking
          </h3>
          
          <p className="text-purple-700 mb-4">
            <strong>Important:</strong> Your book is not registered for revenue sharing. 
            Readers cannot purchase or unlock chapters 4+ until you complete registration. 
            This is a one-time setup that enables automatic payment processing.
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">✨ Benefits of Registration:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Automatic revenue distribution:</strong> 70% to you, 20% to curator, 10% to platform</li>
              <li>• <strong>Chapter monetization:</strong> Readers can unlock chapters 4+ for 0.5 TIP</li>
              <li>• <strong>Permissionless system:</strong> You control your book without platform approval</li>
              <li>• <strong>Blockchain-verified ownership:</strong> Cryptographic proof of your intellectual property</li>
            </ul>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Registration failed:</strong> {error}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleRegisterBook}
              disabled={isRegistering || isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRegistering || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Register Book for Revenue Sharing
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-purple-600 mt-3">
            💡 You can register anytime from your book's page. This is a one-time setup per book.
          </p>
        </div>
      </div>
    </div>
  )
}