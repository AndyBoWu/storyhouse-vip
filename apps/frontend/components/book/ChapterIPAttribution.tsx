'use client'

import { Shield, BookOpen, User } from 'lucide-react'

interface ChapterIPAttributionProps {
  chapterNumber: number
  isInherited?: boolean
  originalAuthor?: string
  originalBookId?: string
  chapterIPAssetId?: string
  isDerivativeBook?: boolean
}

export function ChapterIPAttribution({
  chapterNumber,
  isInherited,
  originalAuthor,
  originalBookId,
  chapterIPAssetId,
  isDerivativeBook
}: ChapterIPAttributionProps) {
  if (!isDerivativeBook) {
    // For original books, show simple IP indicator if registered
    if (chapterIPAssetId) {
      return (
        <div className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>IP Protected</span>
        </div>
      )
    }
    return null
  }

  // For derivative books, show clear attribution
  if (isInherited) {
    return (
      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-900">Inherited Chapter</p>
          <p className="text-xs text-blue-700">
            From original book by {originalAuthor ? `${originalAuthor.slice(0, 6)}...${originalAuthor.slice(-4)}` : 'unknown'}
          </p>
          {originalBookId && (
            <p className="text-xs text-blue-600 mt-1">
              Original: {originalBookId.split('/')[1]}
            </p>
          )}
        </div>
      </div>
    )
  }

  // New chapter in derivative book
  return (
    <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
      <User className="w-4 h-4 text-green-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-green-900">New Chapter</p>
        {chapterIPAssetId && (
          <p className="text-xs text-green-700">
            IP Asset: {chapterIPAssetId.slice(0, 6)}...{chapterIPAssetId.slice(-4)}
          </p>
        )}
      </div>
    </div>
  )
}

// Helper component for book-level IP warning
export function DerivativeBookIPWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">IP Attribution Notice</h3>
          <p className="text-sm text-amber-800">
            This is a derivative work. Each chapter maintains its original IP ownership:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            <li>• Inherited chapters remain the IP of their original authors</li>
            <li>• Only new chapters are registered as separate IP assets</li>
            <li>• Revenue flows directly to each chapter&apos;s author</li>
          </ul>
        </div>
      </div>
    </div>
  )
}