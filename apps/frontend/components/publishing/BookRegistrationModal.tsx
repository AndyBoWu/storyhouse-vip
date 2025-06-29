'use client'

import { useState } from 'react'
import { X, BookOpen, DollarSign, AlertCircle } from 'lucide-react'
import { useBookRegistration } from '@/hooks/useBookRegistration'

interface BookRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: string
  bookTitle: string
  totalChapters: number
  onSuccess: () => void
}

export function BookRegistrationModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  totalChapters,
  onSuccess
}: BookRegistrationModalProps) {
  const { registerBook, isLoading } = useBookRegistration()
  const [error, setError] = useState<string | null>(null)
  
  if (!isOpen) return null

  const handleRegistration = async () => {
    try {
      setError(null)
      console.log('📚 Registering book for revenue sharing...')
      
      await registerBook({
        bookId,
        totalChapters
      })
      
      console.log('✅ Book registered successfully!')
      onSuccess()
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Enable Revenue Sharing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">One-Time Setup Required</h3>
                <p className="text-sm text-blue-800">
                  To enable revenue sharing for "{bookTitle}", we need to register it on the blockchain. 
                  This is a one-time process that enables:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• 70% revenue to chapter authors</li>
                  <li>• 20% to you as the book curator</li>
                  <li>• 10% platform fee</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Gas Fee Required</h3>
                <p className="text-sm text-amber-800">
                  This transaction requires a small gas fee (typically under $1 on testnet).
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Registration Failed</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleRegistration}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Register Book</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}