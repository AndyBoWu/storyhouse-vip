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

// StoryHouse Contract Configuration - Updated with deployed addresses
export const STORYHOUSE_CONTRACT_CONFIG = {
  // TIP Token (ERC-20)
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
      {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function',
      },
    ] as const,
  },
  
  // Rewards Manager
  REWARDS_MANAGER: {
    address: '0xf5ae031ba92295c2ae86a99e88f09989339707e5' as const,
  },
  
  // Creator Rewards Controller
  CREATOR_REWARDS_CONTROLLER: {
    address: '0x8e2d21d1b9c744f772f15a7007de3d5757eea333' as const,
  },
  
  // Read Rewards Controller
  READ_REWARDS_CONTROLLER: {
    address: '0x04553ba8316d407b1c58b99172956d2d5fe100e5' as const,
  },
  
  // Access Control Manager
  ACCESS_CONTROL_MANAGER: {
    address: '0x41e2db0d016e83ddc3c464ffd260d22a6c898341' as const,
  },
  
  // Remix Licensing Controller
  REMIX_LICENSING_CONTROLLER: {
    address: '0x16144746a33d9a172039efc64bc2e12445fbbef2' as const,
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
  deploymentDate: '2025-06-04',
} as const

export default config
