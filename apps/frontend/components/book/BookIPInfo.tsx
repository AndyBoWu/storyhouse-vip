'use client'

import { useState, useEffect } from 'react'
// Using div instead of Card to avoid import issues
import { apiClient } from '@/lib/api-client'
import { Copy, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'

interface BookIPInfoProps {
  bookId: string
}

export function BookIPInfo({ bookId }: BookIPInfoProps) {
  const [bookData, setBookData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const response = await apiClient.getBookById(bookId)
        setBookData(response)
      } catch (error) {
        console.error('Error fetching book data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookData()
  }, [bookId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
  }

  if (!bookData) {
    return <div>Book not found</div>
  }

  const hasIPAsset = !!bookData.ipAssetId

  return (
    <div className="bg-gray-50 rounded-lg p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-gray-700">🔗</span>
        Blockchain Registration
        {hasIPAsset ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-600" />
        )}
      </h3>

      <div className="space-y-4">
        {/* IP Asset ID */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">IP Asset ID</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 p-2 bg-white rounded-md border border-gray-200 text-xs font-mono truncate text-gray-700">
              {bookData.ipAssetId || 'Not registered yet'}
            </code>
            {bookData.ipAssetId && (
              <button
                onClick={() => copyToClipboard(bookData.ipAssetId)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy IP Asset ID"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            )}
          </div>
        </div>

        {/* Token ID */}
        {bookData.tokenId && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-white rounded-md border border-gray-200 text-xs font-mono text-gray-700">
                {bookData.tokenId}
              </code>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {bookData.transactionHash && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-white rounded-md border border-gray-200 text-xs font-mono truncate text-gray-700">
                {bookData.transactionHash}
              </code>
              <a
                href={`https://aeneid.storyscan.io/tx/${bookData.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="View on StoryScan"
              >
                <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </a>
            </div>
          </div>
        )}

        {/* Registration Status */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
          <span className={`text-xs font-medium ${
            hasIPAsset 
              ? 'text-green-700' 
              : 'text-amber-700'
          }`}>
            {hasIPAsset ? '✓ Registered on Story Protocol' : '◌ Pending Registration'}
          </span>
        </div>

      </div>
    </div>
  )
}