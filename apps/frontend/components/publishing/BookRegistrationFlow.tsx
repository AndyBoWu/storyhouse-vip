'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, BookOpen, DollarSign, Users } from 'lucide-react'

interface BookRegistrationFlowProps {
  bookId: string
  chapterNumber: number
  chapterPrice: string
  onProceed: () => void
  onCancel: () => void
}

export function BookRegistrationFlow({
  bookId,
  chapterNumber,
  chapterPrice,
  onProceed,
  onCancel
}: BookRegistrationFlowProps) {
  const [understood, setUnderstood] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">First-Time Book Setup Required</h2>
              <p className="text-amber-100 mt-1">
                Your book needs registration
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Why is this needed?</p>
                <p>
                  Your book needs to be registered on the blockchain to enable paid chapters and revenue sharing.
                </p>
              </div>
            </div>
          </div>

          {/* What will happen */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">What will happen:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Book Registration</p>
                  <p className="text-sm text-gray-600">
                    Register your book on HybridRevenueControllerV2
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This enables revenue sharing and chapter monetization
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Chapter Pricing</p>
                  <p className="text-sm text-gray-600">
                    Set the unlock price for Chapter {chapterNumber} ({chapterPrice} TIP)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Readers will pay this amount to unlock and read the chapter
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Benefits of Registration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Automatic Payments</p>
                  <p className="text-xs text-gray-600">70% author, 20% curator, 10% platform</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Chapter Monetization</p>
                  <p className="text-xs text-gray-600">Readers unlock chapters with TIP tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Attribution Tracking</p>
                  <p className="text-xs text-gray-600">
                    Your contributions tracked
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gas fees notice */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">⛽ Gas Fees:</span> You'll need ETH in your wallet for 2 blockchain transactions.
              This is a one-time setup for your book.
            </p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">
              I understand that I'll need to approve 2 transactions: one for book registration and one for chapter pricing
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="border-t p-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onProceed}
            disabled={!understood}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg 
                     hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Proceed with Setup
          </button>
        </div>
      </div>
    </div>
  )
}