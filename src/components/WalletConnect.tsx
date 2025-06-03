'use client'

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useState, useEffect, useCallback } from 'react'
import { Wallet, LogOut, AlertCircle, CheckCircle, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { storyProtocolTestnet, TIP_TOKEN_CONFIG } from '@/lib/web3/config'

export default function WalletConnect() {
  const { address, isConnecting, isConnected } = useAccount()
  const { connect, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isConnectingLocal, setIsConnectingLocal] = useState(false)

  // Get native token balance
  const { data: balance } = useBalance({
    address,
    chainId: storyProtocolTestnet.id,
  })

  // Get TIP token balance (when contract is deployed)
  const { data: tipBalance } = useBalance({
    address,
    token: TIP_TOKEN_CONFIG.address !== '0x0000000000000000000000000000000000000000'
      ? TIP_TOKEN_CONFIG.address
      : undefined,
    chainId: storyProtocolTestnet.id,
  })

  const handleConnect = useCallback(async () => {
    if (isConnecting || isConnectingLocal || isConnected) {
      return // Prevent duplicate connection attempts
    }

    try {
      setIsConnectingLocal(true)
      await connect({ connector: injected() })
    } catch (err) {
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnectingLocal(false)
    }
  }, [connect, isConnecting, isConnectingLocal, isConnected])

  const handleDisconnect = useCallback(() => {
    disconnect()
    setShowDetails(false)
  }, [disconnect])

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (balance: any) => {
    if (!balance) return '0'
    return parseFloat(balance.formatted).toFixed(4)
  }

  // Reset local connecting state when wagmi connecting state changes
  useEffect(() => {
    if (!isConnecting) {
      setIsConnectingLocal(false)
    }
  }, [isConnecting])

  // Show error message if connection fails
  useEffect(() => {
    if (error) {
      console.error('Wallet connection error:', error)
      setIsConnectingLocal(false)
    }
  }, [error])

  if (isConnected && address) {
    return (
      <div className="relative">
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg transition-all border border-green-300"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">{formatAddress(address)}</span>
          {tipBalance && (
            <span className="text-sm bg-green-200 px-2 py-1 rounded">
              {formatBalance(tipBalance)} TIP
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-80 z-50"
            >
              <div className="space-y-4">
                {/* Wallet Address */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Wallet Address
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                    <span className="text-sm font-mono text-gray-800 flex-1">
                      {address}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">
                      {storyProtocolTestnet.nativeCurrency.symbol}
                    </div>
                    <div className="text-lg font-bold text-blue-800">
                      {formatBalance(balance)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">TIP</div>
                    <div className="text-lg font-bold text-purple-800">
                      {formatBalance(tipBalance)}
                    </div>
                  </div>
                </div>

                {/* Network Info */}
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 mb-2">
                    Connected to: <span className="font-medium">{storyProtocolTestnet.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Chain ID: {storyProtocolTestnet.id}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (storyProtocolTestnet.blockExplorers?.default?.url) {
                        window.open(storyProtocolTestnet.blockExplorers.default.url + '/address/' + address, '_blank')
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    View Explorer
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click outside to close */}
        {showDetails && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
        )}
      </div>
    )
  }

  const isCurrentlyConnecting = isConnecting || isConnectingLocal

  return (
    <motion.button
      onClick={handleConnect}
      disabled={isCurrentlyConnecting}
      whileHover={!isCurrentlyConnecting ? { scale: 1.05 } : {}}
      whileTap={!isCurrentlyConnecting ? { scale: 0.95 } : {}}
      className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
        isCurrentlyConnecting
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
      }`}
    >
      {isCurrentlyConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </>
      )}
    </motion.button>
  )
}

// Network Checker Component
export function NetworkChecker() {
  const { chain } = useAccount()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (chain && chain.id !== storyProtocolTestnet.id) {
      setShowError(true)
    } else {
      setShowError(false)
    }
  }, [chain])

  if (!showError) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <h4 className="text-red-800 font-medium">Wrong Network</h4>
          <p className="text-red-700 text-sm">
            Please switch to {storyProtocolTestnet.name} to use StoryHouse.vip
          </p>
        </div>
      </div>
    </motion.div>
  )
}
