'use client'

import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Wallet, LogOut, AlertCircle, CheckCircle, Copy } from 'lucide-react'
import { storyProtocolTestnet, TIP_TOKEN_CONFIG } from '@/lib/web3/config'

// Global connection state to prevent duplicate requests across all instances
let globalConnectionInProgress = false

// Type declaration for MetaMask ethereum object
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isConnectingLocal, setIsConnectingLocal] = useState(false)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get native token balance
  const { data: balance } = useBalance({
    address,
    chainId: storyProtocolTestnet.id,
  })

  // Get TIP token balance (when contract is deployed)
  const { data: tipBalance } = useBalance({
    address,
    token: TIP_TOKEN_CONFIG.address,
    chainId: storyProtocolTestnet.id,
  })

  const handleConnect = useCallback(async () => {
    // Multiple layers of duplicate prevention
    if (isConnectingLocal || isConnected || globalConnectionInProgress) {
      console.log('Connection already in progress or connected, skipping...')
      return
    }

    // Check if MetaMask is available
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to connect your wallet')
      return
    }

    try {
      console.log('Starting direct MetaMask connection...')
      globalConnectionInProgress = true
      setIsConnectingLocal(true)

      // Clear any existing timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }

      // Set a timeout to reset the connection state
      connectionTimeoutRef.current = setTimeout(() => {
        globalConnectionInProgress = false
        setIsConnectingLocal(false)
        console.log('Connection timeout, resetting state')
      }, 30000) // 30 second timeout

      // Direct MetaMask connection request
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts && accounts.length > 0) {
        console.log('Wallet connected successfully:', accounts[0])

        // Check and switch to correct network if needed
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${storyProtocolTestnet.id.toString(16)}` }],
          })
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${storyProtocolTestnet.id.toString(16)}`,
                chainName: storyProtocolTestnet.name,
                nativeCurrency: storyProtocolTestnet.nativeCurrency,
                rpcUrls: [storyProtocolTestnet.rpcUrls.default.http[0]],
                blockExplorerUrls: [storyProtocolTestnet.blockExplorers?.default?.url],
              }],
            })
          }
        }
      }

    } catch (err: any) {
      console.error('Wallet connection error:', err)

      // Don't show error for user rejection
      if (err.code !== 4001) {
        alert('Failed to connect wallet. Please try again.')
      }
    } finally {
      globalConnectionInProgress = false
      setIsConnectingLocal(false)

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
    }
  }, [isConnectingLocal, isConnected])

  const handleDisconnect = useCallback(() => {
    disconnect()
    setShowDetails(false)
  }, [disconnect])

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address.toLowerCase())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    // Show only last 4 characters: abcd
    return addr.slice(-4)
  }

  const formatBalance = (balance: any) => {
    if (!balance) return '0'
    return parseFloat(balance.formatted).toFixed(4)
  }

  // Handle successful connection
  useEffect(() => {
    if (isConnected) {
      globalConnectionInProgress = false
      setIsConnectingLocal(false)
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
    }
  }, [isConnected])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
    }
  }, [])

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 text-gray-800 px-6 py-3 rounded-full transition-all border border-white/50 text-sm font-semibold"
        >
          💳
          <span>{formatAddress(address.toLowerCase())}</span>
        </button>

        {showDetails && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-80 z-50"
            >
              <div className="space-y-4">
                {/* Wallet Address */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Wallet Address
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                    <span className="text-sm font-mono text-gray-800 flex-1">
                      {address.toLowerCase()}
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
                        window.open(storyProtocolTestnet.blockExplorers.default.url + '/address/' + address.toLowerCase(), '_blank')
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
            </div>
          )}

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

  const isCurrentlyConnecting = isConnectingLocal || globalConnectionInProgress

  return (
    <button
      onClick={handleConnect}
      disabled={isCurrentlyConnecting}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
        isCurrentlyConnecting
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 text-gray-800 border border-white/50'
      }`}
    >
      {isCurrentlyConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          Connect
        </>
      )}
    </button>
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
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <h4 className="text-red-800 font-medium">Wrong Network</h4>
          <p className="text-red-700 text-sm">
            Please switch to {storyProtocolTestnet.name} to use StoryHouse.vip
          </p>
        </div>
      </div>
    </div>
  )
}
