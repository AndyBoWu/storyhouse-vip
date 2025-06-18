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

// StoryHouse Contract Configuration - 5-Contract Optimized Architecture
export const STORYHOUSE_CONTRACT_CONFIG = {
  // TIP Token (ERC-20) - Core platform token
  TIP_TOKEN: {
    address: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as const,
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
        constant: false,
        inputs: [
          { name: '_spender', type: 'address' },
          { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          { name: '_owner', type: 'address' },
          { name: '_spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function',
      },
    ] as const,
  },
  
  // Chapter Access Controller - Chapter monetization (0.5 TIP per chapter 4+)
  CHAPTER_ACCESS_CONTROLLER: {
    address: '0x1bd65ad10b1ca3ed67ae75fcdd3aba256a9918e3' as const,
  },
  
  // Hybrid Revenue Controller - Multi-author revenue sharing
  HYBRID_REVENUE_CONTROLLER: {
    address: '0xd1f7e8c6fd77dadbe946ae3e4141189b39ef7b08' as const,
  },
} as const

// Backward compatibility - keeping existing TIP_TOKEN_CONFIG
export const TIP_TOKEN_CONFIG = STORYHOUSE_CONTRACT_CONFIG.TIP_TOKEN

// Faucet URLs for easy access
export const FAUCET_URLS = {
  gcp: 'https://cloud.google.com/application/web3/faucet/story/aeneid',
  internal: 'https://aeneid.faucet.story.foundation/',
} as const

// Network information
export const NETWORK_INFO = {
  chainId: 1315,
  name: 'Story Protocol Aeneid Testnet',
  rpcUrl: 'https://aeneid.storyrpc.io',
  explorerUrl: 'https://aeneid.storyscan.xyz',
  faucetUrl: 'https://aeneid.faucet.story.foundation/',
  deployer: '0xD9b6d1bd7D8A90915B905EB801c55bA5De1d4476',
  deploymentDate: '2025-06-16',
  architecture: '3-contract-optimized',
} as const

export default config