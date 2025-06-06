import { Address, Hash } from 'viem'

// Story Protocol Contract Addresses on Aeneid Testnet
export const STORY_PROTOCOL_CONTRACTS = {
  // Real deployed contract addresses on Story Protocol Aeneid testnet
  IP_ASSET_REGISTRY: '0x77319B4031e6eF1250907aa00018B8B1c67a244b' as Address,
  LICENSE_REGISTRY: '0xbe39E1C756e921BD25DF86e7AAa31106d1eb0424' as Address, // Using Registration Workflows
  ROYALTY_MODULE: '0x3456789012345678901234567890123456789012' as Address, // TODO: Find real address
  SPG_NFT: '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as Address, // Test collection from docs
} as const

// Story Protocol ABI fragments for the functions we need
export const IP_ASSET_REGISTRY_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'chainId', type: 'uint256' },
      { name: 'tokenContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'uri', type: 'string' },
      { name: 'registrant', type: 'address' }
    ],
    outputs: [
      { name: 'ipId', type: 'address' }
    ]
  }
] as const

export const LICENSE_REGISTRY_ABI = [
  {
    name: 'registerLicenseTerms',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'terms',
        type: 'tuple',
        components: [
          { name: 'transferable', type: 'bool' },
          { name: 'royaltyPolicy', type: 'address' },
          { name: 'defaultMintingFee', type: 'uint256' },
          { name: 'expiration', type: 'uint256' },
          { name: 'commercialUse', type: 'bool' },
          { name: 'commercialAttribution', type: 'bool' },
          { name: 'derivativesAllowed', type: 'bool' },
          { name: 'derivativesAttribution', type: 'bool' }
        ]
      }
    ],
    outputs: [
      { name: 'licenseTermsId', type: 'uint256' }
    ]
  },
  {
    name: 'attachLicenseTermsToIp',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ipId', type: 'address' },
      { name: 'licenseTermsId', type: 'uint256' }
    ],
    outputs: []
  }
] as const

export const SPG_NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' }
    ],
    outputs: [
      { name: 'tokenId', type: 'uint256' }
    ]
  }
] as const

// Story Protocol chain configuration
export const AENEID_TESTNET = {
  id: 1315,
  name: 'Story Protocol Testnet (Aeneid)',
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
      name: 'StoryScan',
      url: 'https://aeneid.storyscan.xyz',
    },
  },
} as const

// Types for Story Protocol operations
export interface RegisterIPAssetParams {
  tokenContract: Address
  tokenId: bigint
  name: string
  uri: string
  registrant: Address
}

export interface CreateLicenseTermsParams {
  transferable: boolean
  royaltyPolicy: Address
  defaultMintingFee: bigint
  expiration: bigint
  commercialUse: boolean
  commercialAttribution: boolean
  derivativesAllowed: boolean
  derivativesAttribution: boolean
}

export interface PublishResult {
  success: boolean
  data?: {
    transactionHash: Hash
    ipAssetId?: Address
    tokenId?: bigint
    licenseTermsId?: bigint
    ipfsHash?: string
    explorerUrl?: string
  }
  error?: string
}

// Helper functions for Story Protocol operations
export function createMetadataURI(ipfsHash: string, metadata: any): string {
  return JSON.stringify({
    name: metadata.title,
    description: `Story chapter: ${metadata.title}`,
    external_url: `https://ipfs.io/ipfs/${ipfsHash}`,
    attributes: [
      { trait_type: 'Word Count', value: metadata.wordCount },
      { trait_type: 'Reading Time', value: `${metadata.readingTime} minutes` },
      { trait_type: 'Chapter Number', value: metadata.chapterNumber },
      { trait_type: 'Genre', value: metadata.themes[0] || 'General' },
      { trait_type: 'Content Hash', value: ipfsHash }
    ]
  })
}

export function createStoryProtocolURI(ipfsHash: string): string {
  return `ipfs://${ipfsHash}`
}

export function getExplorerUrl(txHash: Hash): string {
  return `https://aeneid.storyscan.xyz/tx/${txHash}`
}

export function getIPAssetUrl(ipAssetId: Address): string {
  return `https://aeneid.storyscan.xyz/address/${ipAssetId}`
}

// Default license terms for Story Protocol
export const DEFAULT_LICENSE_TERMS: CreateLicenseTermsParams = {
  transferable: true,
  royaltyPolicy: '0x0000000000000000000000000000000000000000' as Address, // Will be updated
  defaultMintingFee: BigInt(0),
  expiration: BigInt(0), // No expiration
  commercialUse: true,
  commercialAttribution: true,
  derivativesAllowed: true,
  derivativesAttribution: true
}

// Gas estimation helpers
export const GAS_LIMITS = {
  MINT_NFT: BigInt(200000),
  REGISTER_IP_ASSET: BigInt(300000),
  CREATE_LICENSE_TERMS: BigInt(250000),
  ATTACH_LICENSE: BigInt(150000)
} as const
