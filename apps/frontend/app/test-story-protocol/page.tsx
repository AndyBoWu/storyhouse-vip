'use client'

import { useState } from 'react'

interface ConfigStatus {
  isConfigured: boolean
  hasPrivateKey: boolean
  hasRpcUrl: boolean
  hasSpgNftContract: boolean
  chainId: string
  rpcUrl: string
  account: string
}

interface TestResult {
  success: boolean
  message?: string
  configStatus?: ConfigStatus
}

export default function TestStoryProtocolPage() {
  const [configResult, setConfigResult] = useState<TestResult | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/story-protocol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'config' }),
      })

      const result = await response.json()
      setConfigResult(result)
    } catch (error) {
      setConfigResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/story-protocol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test' }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Story Protocol Integration Test</h1>

      <div className="space-y-6">
        {/* Configuration Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <button
            onClick={testConfig}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Configuration'}
          </button>

          {configResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold">Configuration Result:</h3>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(configResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Connection Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold">Connection Result:</h3>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Environment Setup Guide */}
        <div className="border rounded-lg p-6 bg-yellow-50">
          <h2 className="text-xl font-semibold mb-4">🔧 Environment Setup</h2>
          <p className="mb-4">To enable Story Protocol integration, add these environment variables to your <code>.env.local</code>:</p>
          <pre className="bg-gray-800 text-white p-4 rounded text-sm overflow-auto">
{`# Story Protocol Configuration
STORY_PRIVATE_KEY=0x_your_private_key_here
STORY_RPC_URL=https://testnet.storyrpc.io
STORY_SPG_NFT_CONTRACT=0x_spg_nft_contract_address`}
          </pre>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Note:</strong> You'll need to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Create a wallet and fund it with Aeneid testnet tokens</li>
              <li>Deploy or use an existing SPG NFT contract on Story Protocol</li>
              <li>Replace the placeholder values with your actual contract addresses</li>
            </ul>
          </div>
        </div>

        {/* Integration Status */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">📋 Integration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Story Protocol SDK installed and configured</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>R2 storage integration completed</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>API endpoints created for IP registration</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Seamless integration with story generation</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">⚠️</span>
              <span>Environment configuration needed for full functionality</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
