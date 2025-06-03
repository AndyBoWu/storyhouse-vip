'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/web3/config'
import { ReactNode, useState } from 'react'

interface Web3ProviderProps {
  children: ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
