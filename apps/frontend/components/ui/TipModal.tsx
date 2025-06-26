'use client'

import { useState, useEffect } from 'react'
import { X, Heart, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { TIP_TOKEN_ABI, STORYHOUSE_CONTRACTS } from '@/lib/contracts/storyhouse'
import { TipSuccessAnimation } from './TipSuccessAnimation'

interface TipModalProps {
  isOpen: boolean
  onClose: () => void
  authorAddress: string
  authorName?: string
  onTip: (amount: string) => Promise<void>
  bookTitle?: string
  chapterTitle?: string
}

const PRESET_AMOUNTS = [
  { value: '1', label: '1 TIP', emoji: '☕' },
  { value: '5', label: '5 TIP', emoji: '🍕' },
  { value: '10', label: '10 TIP', emoji: '🎯' },
  { value: '50', label: '50 TIP', emoji: '🚀' },
]

export function TipModal({
  isOpen,
  onClose,
  authorAddress,
  authorName,
  onTip,
  bookTitle,
  chapterTitle
}: TipModalProps) {
  const { address } = useAccount()
  const [selectedAmount, setSelectedAmount] = useState<string>('')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [sentAmount, setSentAmount] = useState<string>('')
  
  // Get TIP balance
  const { data: tipBalance } = useBalance({
    address: address,
    token: STORYHOUSE_CONTRACTS.TIP_TOKEN as `0x${string}`,
  })
  
  useEffect(() => {
    if (!isOpen) {
      setSelectedAmount('')
      setCustomAmount('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])
  
  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown'
    if (addr.toLowerCase() === '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2') {
      return 'andybowu.ip'
    }
    if (addr.toLowerCase() === '0x71b93d154886c297f4b6e6219c47d378f6ac6a70') {
      return 'bob.ip'
    }
    if (addr.toLowerCase() === '0xd49646149734f829c722a547f6be217571a8355d') {
      return 'royce.ip'
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  const handleTip = async () => {
    const amount = customAmount || selectedAmount
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please select or enter a valid amount')
      return
    }
    
    if (tipBalance) {
      const balance = parseFloat(formatUnits(tipBalance.value, 18))
      if (parseFloat(amount) > balance) {
        setError(`Insufficient balance. You have ${balance.toFixed(2)} TIP`)
        return
      }
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      await onTip(amount)
      setSuccess(true)
      setSentAmount(amount)
      
      // Show success animation
      setShowSuccessAnimation(true)
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Tip failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to send tip')
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Send a Tip</h2>
          <p className="text-gray-600">
            Show your appreciation to {authorName || formatAddress(authorAddress)}
          </p>
          {(bookTitle || chapterTitle) && (
            <p className="text-sm text-gray-500 mt-1">
              {bookTitle && <span className="font-medium">{bookTitle}</span>}
              {bookTitle && chapterTitle && ' • '}
              {chapterTitle && <span>{chapterTitle}</span>}
            </p>
          )}
        </div>
        
        {/* Success State */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tip Sent!</h3>
            <p className="text-gray-600">Thank you for supporting the author</p>
          </div>
        ) : (
          <>
            {/* Amount Selection */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Amount
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setSelectedAmount(preset.value)
                        setCustomAmount('')
                      }}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedAmount === preset.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{preset.emoji}</div>
                      <div className="font-medium">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Amount */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setSelectedAmount('')
                    }}
                    placeholder="0.00"
                    className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    TIP
                  </div>
                </div>
              </div>
              
              {/* Balance Display */}
              {tipBalance && (
                <div className="text-sm text-gray-600 flex items-center justify-between">
                  <span>Your balance:</span>
                  <span className="font-mono font-medium">
                    {parseFloat(formatUnits(tipBalance.value, 18)).toFixed(2)} TIP
                  </span>
                </div>
              )}
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={isProcessing || (!selectedAmount && !customAmount)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" />
                    <span>Send Tip</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Success Animation */}
      <TipSuccessAnimation 
        show={showSuccessAnimation} 
        amount={sentAmount}
        onComplete={() => setShowSuccessAnimation(false)}
      />
    </div>
  )
}