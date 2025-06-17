/**
 * Chain configuration for Story Protocol
 */

import { defineChain } from 'viem'

// Story Protocol Testnet (Aeneid)
export const storyTestnet = defineChain({
  id: 1315,
  name: 'Story Protocol Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP Token',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Protocol Explorer',
      url: 'https://aeneid.storyscan.io',
    },
  },
  testnet: true,
})

// Story Protocol Mainnet (when available)
export const storyMainnet = defineChain({
  id: 1516, // Placeholder - update when mainnet launches
  name: 'Story Protocol Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Story Token',
    symbol: 'STORY',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.storyrpc.io'], // Placeholder
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Protocol Explorer',
      url: 'https://storyscan.xyz', // Placeholder
    },
  },
  testnet: false,
})