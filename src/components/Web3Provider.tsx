'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/web3/config'
import { ReactNode, useMemo } from 'react'

import '@rainbow-me/rainbowkit/styles.css'

// Create a singleton query client to prevent multiple instances
let queryClientInstance: QueryClient | null = null

function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 3,
          staleTime: 30 * 1000, // 30 seconds
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return queryClientInstance
}

export default function Web3Provider({ children }: { children: ReactNode }) {
  // Use memoized query client to ensure singleton behavior
  const queryClient = useMemo(() => getQueryClient(), [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          showRecentTransactions={true}
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
