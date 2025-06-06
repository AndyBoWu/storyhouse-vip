'use client'

import { useState } from 'react'
import { useStoryProtocol } from '@/hooks/useStoryProtocol'
import { useAccount } from 'wagmi'
import WalletConnect from '@/components/WalletConnect'

interface TestResult {
  success: boolean
  message?: string
  configStatus?: any
}

export default function TestStoryProtocolPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const { isConnected } = useAccount()
  const {
    isReady,
    isWalletConnected,
    walletAddress,
    testConnection,
    getConfigStatus
  } = useStoryProtocol()

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      const result = await testConnection()
      const configStatus = getConfigStatus()

      setTestResult({
        success: result.success,
        message: result.message,
        configStatus
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const configStatus = getConfigStatus()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Story Protocol Integration Test</h1>

      <div className="space-y-6">
        {/* Wallet Connection */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">1. Wallet Connection</h2>
          {!isConnected ? (
            <div>
              <p className="mb-4 text-gray-600">Connect your wallet to test Story Protocol integration:</p>
              <WalletConnect />
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="font-medium">Wallet Connected</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Address: {walletAddress}
              </p>
            </div>
          )}
        </div>

        {/* Configuration Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">2. Configuration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`mr-2 ${isWalletConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isWalletConnected ? '✅' : '❌'}
              </span>
              <span>Wallet Connected: {isWalletConnected ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${configStatus.hasRpcUrl ? 'text-green-500' : 'text-red-500'}`}>
                {configStatus.hasRpcUrl ? '✅' : '❌'}
              </span>
              <span>RPC URL Configured: {configStatus.hasRpcUrl ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${configStatus.hasSpgNftContract ? 'text-green-500' : 'text-red-500'}`}>
                {configStatus.hasSpgNftContract ? '✅' : '❌'}
              </span>
              <span>SPG NFT Contract: {configStatus.hasSpgNftContract ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${isReady ? 'text-green-500' : 'text-yellow-500'}`}>
                {isReady ? '✅' : '⚠️'}
              </span>
              <span>Ready for Story Protocol: {isReady ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Current Configuration:</h3>
            <pre className="text-sm mt-2 overflow-auto">
              {JSON.stringify(configStatus, null, 2)}
            </pre>
          </div>
        </div>

        {/* Connection Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">3. Story Protocol Connection Test</h2>
          <button
            onClick={handleTestConnection}
            disabled={loading || !isWalletConnected}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test Story Protocol Connection'}
          </button>

          {!isWalletConnected && (
            <p className="text-yellow-600 text-sm mt-2">
              ⚠️ Connect your wallet first to test Story Protocol
            </p>
          )}

          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold">Test Result:</h3>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Environment Setup Guide */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">🔧 Environment Setup</h2>
          <p className="mb-4">To enable Story Protocol integration, add these environment variables to your <code>.env.testnet</code>:</p>
          <pre className="bg-gray-800 text-white p-4 rounded text-sm overflow-auto">
{`# Story Protocol Configuration (Wallet-based - no private key needed!)
STORY_RPC_URL=https://aeneid.storyrpc.io
STORY_SPG_NFT_CONTRACT=0x_spg_nft_contract_address

# Enable real testnet operations
NEXT_PUBLIC_ENABLE_TESTNET=true`}
          </pre>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>✨ New Wallet-Based Approach:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>No private keys in environment variables!</strong> 🔒</li>
              <li>Users sign transactions with their own connected wallets</li>
              <li>More secure and decentralized</li>
              <li>Better user experience with MetaMask integration</li>
              <li>You only need to deploy or find an SPG NFT contract address</li>
            </ul>
          </div>
        </div>

        {/* Integration Status */}
        <div className="border rounded-lg p-6 bg-green-50">
          <h2 className="text-xl font-semibold mb-4">📋 Integration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Story Protocol SDK integrated with wallet connection</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>R2 storage integration completed</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Removed dependency on private keys</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Seamless integration with story generation</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>User-controlled transactions via MetaMask</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
