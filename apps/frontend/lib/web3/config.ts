import { http, createConfig } from 'wagmi'
import { Chain } from 'viem'

// Story Protocol Testnet Configuration (Aeneid)
export const storyProtocolTestnet: Chain = {
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
      url: 'https://aeneid.storyscan.xyz',
    },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [storyProtocolTestnet],
  transports: {
    [storyProtocolTestnet.id]: http(),
  },
})

// TIP Token Contract Configuration
export const TIP_TOKEN_CONFIG = {
  address: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as const, // Successfully deployed TIP token contract
  abi: [
    // Standard ERC-20 ABI
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', type: 'string' }],
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'name',
      outputs: [{ name: '', type: 'string' }],
      type: 'function',
    },
  ] as const,
} as const

// Faucet URLs for easy access
export const FAUCET_URLS = {
  gcp: 'https://cloud.google.com/application/web3/faucet/story/aeneid',
  internal: 'https://aeneid.faucet.story.foundation/',
} as const

export default config
