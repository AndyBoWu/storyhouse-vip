import { createWalletClient, http, createPublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.testnet
config({ path: resolve(__dirname, '../.env.testnet') })

// Aeneid testnet chain config
const aeneid = {
  id: 1315,
  name: 'Story Aeneid Testnet',
  network: 'aeneid',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
    public: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
  blockExplorers: {
    default: { name: 'StoryScan', url: 'https://aeneid.storyscan.io' },
  },
} as const

// Contract ABI for RegistrationWorkflows.createCollection
const REGISTRATION_WORKFLOWS_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"name": "name", "type": "string"},
          {"name": "symbol", "type": "string"},
          {"name": "baseURI", "type": "string"},
          {"name": "contractURI", "type": "string"},
          {"name": "maxSupply", "type": "uint32"},
          {"name": "mintFee", "type": "uint256"},
          {"name": "mintFeeToken", "type": "address"},
          {"name": "mintFeeRecipient", "type": "address"},
          {"name": "owner", "type": "address"},
          {"name": "mintOpen", "type": "bool"},
          {"name": "isPublicMinting", "type": "bool"}
        ],
        "name": "initParams",
        "type": "tuple"
      }
    ],
    "name": "createCollection",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

const REGISTRATION_WORKFLOWS_ADDRESS = '0xbe39E1C756e921BD25DF86e7AAa31106d1eb0424'

async function deploySPGContract() {
  // Get private key from environment
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ Please set DEPLOYER_PRIVATE_KEY environment variable in .env.testnet file')
    console.error('💡 Add this line to your .env.testnet file:')
    console.error('   DEPLOYER_PRIVATE_KEY=0x_your_64_character_hex_private_key_here')
    process.exit(1)
  }

  // Validate private key format
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    console.error('❌ Invalid private key format')
    console.error('💡 Private key should be 64 hex characters prefixed with 0x (total length: 66)')
    console.error('   Example: 0x1234567890abcdef...')
    process.exit(1)
  }

  // Create account and clients
  const account = privateKeyToAccount(privateKey as `0x${string}`)

  const publicClient = createPublicClient({
    chain: aeneid,
    transport: http('https://aeneid.storyrpc.io')
  })

  const walletClient = createWalletClient({
    chain: aeneid,
    transport: http('https://aeneid.storyrpc.io'),
    account
  })

  console.log('🚀 Deploying SPG NFT Contract...')
  console.log('📍 Deployer Address:', account.address)
  console.log('🌐 Network: Aeneid Testnet')

  try {
    // Prepare transaction
    const { request } = await publicClient.simulateContract({
      address: REGISTRATION_WORKFLOWS_ADDRESS,
      abi: REGISTRATION_WORKFLOWS_ABI,
      functionName: 'createCollection',
      args: [{
        name: 'StoryHouse VIP Stories',
        symbol: 'SHVS',
        baseURI: '',
        contractURI: '',
        maxSupply: 4294967200,
        mintFee: BigInt(0),
        mintFeeToken: '0x0000000000000000000000000000000000000000',
        mintFeeRecipient: account.address,
        owner: account.address,
        mintOpen: true,
        isPublicMinting: true
      }],
      account
    })

    // Execute transaction
    const hash = await walletClient.writeContract(request)
    console.log('📝 Transaction Hash:', hash)

    // Wait for confirmation
    console.log('⏳ Waiting for transaction confirmation...')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      // Get the contract address from logs
      const spgContractAddress = receipt.logs[0]?.address

      console.log('✅ SPG NFT Contract deployed successfully!')
      console.log('📍 Contract Address:', spgContractAddress)
      console.log('🔗 Explorer:', `https://aeneid.storyscan.io/address/${spgContractAddress}`)
      console.log('')
      console.log('🎯 Add this to your .env.testnet file:')
      console.log(`STORY_SPG_NFT_CONTRACT=${spgContractAddress}`)

      return spgContractAddress
    } else {
      console.error('❌ Transaction failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error deploying SPG contract:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  deploySPGContract()
}

export { deploySPGContract }
