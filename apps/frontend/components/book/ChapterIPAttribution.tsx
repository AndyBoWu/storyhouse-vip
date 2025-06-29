'use client'

import { Shield, BookOpen, User } from 'lucide-react'

interface ChapterIPAttributionProps {
  chapterNumber: number
  isInherited?: boolean
  originalAuthor?: string
  originalBookId?: string
  chapterIPAssetId?: string
  currentBookAuthor?: string
}

export function ChapterIPAttribution({
  chapterNumber,
  isInherited,
  originalAuthor,
  originalBookId,
  chapterIPAssetId,
  currentBookAuthor
}: ChapterIPAttributionProps) {
  // Format author address for display
  const formatAuthor = (address: string | undefined) => {
    if (!address) return 'unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Check if this chapter is by a different author than the book author
  const isContributedChapter = originalAuthor && currentBookAuthor && 
    originalAuthor.toLowerCase() !== currentBookAuthor.toLowerCase()

  // For inherited chapters (from parent book)
  if (isInherited && originalAuthor) {
    return (
      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-900">Chapter by {formatAuthor(originalAuthor)}</p>
          {originalBookId && (
            <p className="text-xs text-blue-600 mt-0.5">
              From: {originalBookId.split('/')[1]}
            </p>
          )}
          {chapterIPAssetId && (
            <div className="flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">IP Protected</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // For contributed chapters (different author but same book)
  if (isContributedChapter) {
    return (
      <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
        <User className="w-4 h-4 text-purple-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-purple-900">
            Contributed by {formatAuthor(originalAuthor)}
          </p>
          {chapterIPAssetId && (
            <div className="flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600">IP Protected</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // For chapters by the book's primary author - show IP status only
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

// Helper component for book-level IP warning
export function DerivativeBookIPWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">Multi-Author Attribution</h3>
          <p className="text-sm text-amber-800">
            This book contains chapters from multiple authors. Each chapter maintains its own IP ownership:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            <li>• Each chapter shows its contributing author</li>
            <li>• Chapter IP assets belong to their respective authors</li>
            <li>• Revenue flows directly to each chapter&apos;s author</li>
          </ul>
        </div>
      </div>
    </div>
  )
}