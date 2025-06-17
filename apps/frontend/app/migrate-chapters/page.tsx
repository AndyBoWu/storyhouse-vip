'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { apiClient } from '@/lib/api-client'
import { StoryProtocolService } from '@/lib/services/storyProtocolService'
import { useConnectWallet } from '@/hooks/useConnectWallet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWalletClient } from 'wagmi'

interface Chapter {
  bookId: string
  chapterNumber: number
  title: string
  content: string
  ipAssetId?: string
}

export default function MigrateChaptersPage() {
  const { address } = useAccount()
  const { connectWallet } = useConnectWallet()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [bookId, setBookId] = useState('')
  const [results, setResults] = useState<any[]>([])

  const migrateChapters = async () => {
    if (!address || !walletClient) {
      await connectWallet()
      return
    }

    if (!bookId) {
      setStatus('Please enter a book ID')
      return
    }

    setIsLoading(true)
    setStatus('Loading book chapters...')
    setResults([])

    try {
      // Get book info
      const bookResponse = await apiClient.getBook(bookId)
      if (!bookResponse.book) {
        throw new Error('Book not found')
      }

      const book = bookResponse.book
      setStatus(`Found book: ${book.title} with ${book.chapters} chapters`)

      // Process each chapter
      const migrationResults = []
      for (let i = 1; i <= book.chapters; i++) {
        try {
          setStatus(`Processing chapter ${i}...`)
          
          // Get chapter content
          const chapterResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/api/books/${encodeURIComponent(bookId)}/chapter/${i}/content`
          )
          
          if (!chapterResponse.ok) {
            migrationResults.push({
              chapterNumber: i,
              success: false,
              error: 'Chapter not found'
            })
            continue
          }

          const chapterData = await chapterResponse.json()
          
          // Check if already has IP asset ID
          if (chapterData.ipAssetId) {
            migrationResults.push({
              chapterNumber: i,
              title: chapterData.title,
              success: true,
              ipAssetId: chapterData.ipAssetId,
              status: 'Already registered'
            })
            continue
          }

          // Register as IP asset
          setStatus(`Registering chapter ${i} as IP asset...`)
          
          const ipResult = await StoryProtocolService.registerChapterAsIP({
            storyId: `${bookId}-ch${i}`,
            chapterNumber: i,
            title: chapterData.title,
            content: chapterData.content,
            contentUrl: `${bookId}/chapter/${i}`,
            metadata: {
              suggestedTags: book.genres || [],
              suggestedGenre: book.genres?.[0] || 'Story',
              contentRating: 'G',
              language: 'en',
              qualityScore: 85,
              originalityScore: 90,
              commercialViability: 80
            }
          }, walletClient)

          if (!ipResult.success) {
            throw new Error(ipResult.error || 'IP registration failed')
          }

          // Update chapter with IP asset ID
          const updateResult = await apiClient.saveBookChapter(bookId, {
            ...chapterData,
            ipAssetId: ipResult.ipAssetId,
            transactionHash: ipResult.transactionHash
          })

          migrationResults.push({
            chapterNumber: i,
            title: chapterData.title,
            success: true,
            ipAssetId: ipResult.ipAssetId,
            transactionHash: ipResult.transactionHash,
            status: 'Newly registered'
          })

        } catch (error) {
          console.error(`Error processing chapter ${i}:`, error)
          migrationResults.push({
            chapterNumber: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      setResults(migrationResults)
      setStatus('Migration complete!')

    } catch (error) {
      console.error('Migration error:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Migrate Chapters to IP Assets</h1>
      
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Migration Tool</h2>
        <p className="text-gray-600 mb-4">
          This tool registers existing book chapters as independent IP assets on Story Protocol.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Book ID</label>
            <input
              type="text"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              placeholder="e.g., 0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
              className="w-full px-3 py-2 border rounded-lg"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={migrateChapters}
            disabled={isLoading || !bookId}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Migrate Chapters'}
          </Button>

          {status && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm">{status}</p>
            </div>
          )}
        </div>
      </Card>

      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Migration Results</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Chapter {result.chapterNumber}: {result.title || 'Unknown'}
                  </span>
                  <span className={`text-sm ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.status || result.error}
                  </span>
                </div>
                {result.ipAssetId && (
                  <p className="text-xs text-gray-500 mt-1">
                    IP Asset: {result.ipAssetId}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}