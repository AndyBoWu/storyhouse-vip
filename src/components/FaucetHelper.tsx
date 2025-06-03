'use client'

import { useAccount } from 'wagmi'
import { ExternalLink, Droplets, Copy, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { FAUCET_URLS } from '@/lib/web3/config'

export default function FaucetHelper() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isConnected || !address) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Testnet IP Tokens?
          </h3>

          <p className="text-blue-700 mb-4">
            Get free IP tokens from the Story Protocol testnet faucet to test transactions and interactions.
          </p>

          {/* Address Copy Section */}
          <div className="bg-white rounded-lg p-3 mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Your Wallet Address:
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded border">
                {address}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Faucet Links */}
          <div className="space-y-3">
            <a
              href={FAUCET_URLS.gcp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 transition-colors group"
            >
              <div>
                <div className="font-medium text-gray-900">Google Cloud Faucet</div>
                <div className="text-sm text-gray-600">Official Google Cloud Web3 faucet</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </a>

            <a
              href={FAUCET_URLS.internal}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 transition-colors group"
            >
              <div>
                <div className="font-medium text-gray-900">Story Foundation Faucet</div>
                <div className="text-sm text-gray-600">Internal Story Protocol faucet</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </a>
          </div>

          <div className="mt-4 text-xs text-blue-600">
            💡 Copy your wallet address above and paste it into the faucet to receive testnet IP tokens
          </div>
        </div>
      </div>
    </motion.div>
  )
}
