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
    [storyProtocolTestnet.id]: http('https://aeneid.storyrpc.io', {
      timeout: 30000, // 30 second timeout
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
})

// StoryHouse Contract Configuration - 2-Contract Minimal Architecture
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
  
  // Hybrid Revenue Controller V2 - Handles everything (book registration, chapter unlocking, revenue sharing)
  HYBRID_REVENUE_CONTROLLER_V2: {
    address: '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6' as const,
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
  architecture: '2-contract-minimal',
} as const

export default config