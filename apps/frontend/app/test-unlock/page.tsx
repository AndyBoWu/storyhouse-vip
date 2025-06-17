'use client'

import { useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useChapterAccess } from '@/hooks/useChapterAccess'
import { useReadingLicense } from '@/hooks/useReadingLicense'

export default function TestUnlockPage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { checkChapterAccess } = useChapterAccess()
  const { mintReadingLicense, isLoading, error } = useReadingLicense()
  
  const [bookId, setBookId] = useState('0x1234567890abcdef1234567890abcdef12345678/test-book')
  const [chapterNumber, setChapterNumber] = useState(4)
  const [accessInfo, setAccessInfo] = useState<any>(null)
  const [mintResult, setMintResult] = useState<any>(null)

  const handleCheckAccess = async () => {
    const info = await checkChapterAccess(bookId, chapterNumber)
    setAccessInfo(info)
    console.log('Access info:', info)
  }

  const handleMintLicense = async () => {
    if (!accessInfo?.ipAssetId) {
      alert('No IP asset ID found. Check access first.')
      return
    }

    await mintReadingLicense({
      bookId,
      chapterNumber,
      chapterIpAssetId: accessInfo.ipAssetId,
      onSuccess: (data) => {
        console.log('License minted successfully:', data)
        setMintResult(data)
      },
      onError: (error) => {
        console.error('License minting failed:', error)
      }
    })
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Test Chapter Unlock Flow</h1>
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Chapter Unlock Flow</h1>
      
      <div className="mb-4">
        <p>Connected: {address}</p>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Book ID:</label>
        <input
          type="text"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Chapter Number:</label>
        <input
          type="number"
          value={chapterNumber}
          onChange={(e) => setChapterNumber(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4 space-x-4">
        <button
          onClick={handleCheckAccess}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Check Access
        </button>

        <button
          onClick={handleMintLicense}
          disabled={isLoading || !accessInfo?.ipAssetId}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Minting...' : 'Mint Reading License'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {accessInfo && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Access Info:</h2>
          <pre>{JSON.stringify(accessInfo, null, 2)}</pre>
        </div>
      )}

      {mintResult && (
        <div className="mb-4 p-4 bg-green-100 rounded">
          <h2 className="font-bold mb-2">Mint Result:</h2>
          <pre>{JSON.stringify(mintResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}