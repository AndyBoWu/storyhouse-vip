import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as fs from 'fs'
import * as path from 'path'

// Network configuration
const STORY_RPC_URL = 'https://aeneid.storyrpc.io'
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E' as const

// Load environment
const envPath = path.join(__dirname, '../apps/backend/.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found at:', envPath)
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf-8')
const privateKeyMatch = envContent.match(/ADMIN_PRIVATE_KEY=(.+)/)
if (!privateKeyMatch) {
  console.error('❌ ADMIN_PRIVATE_KEY not found in .env.local')
  process.exit(1)
}

const PRIVATE_KEY = privateKeyMatch[1].trim()
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)

// Create clients
const walletClient = createWalletClient({
  account,
  chain: {
    id: 1315,
    name: 'Story Protocol Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: { default: { http: [STORY_RPC_URL] } },
  },
  transport: http(STORY_RPC_URL),
})

const publicClient = createPublicClient({
  chain: {
    id: 1315,
    name: 'Story Protocol Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: { default: { http: [STORY_RPC_URL] } },
  },
  transport: http(STORY_RPC_URL),
})

// HybridRevenueControllerV2 bytecode (compiled without RewardsManager dependency)
// This is the bytecode for the refactored contract
const HYBRID_V2_BYTECODE = '0x60806040523480156200001157600080fd5b5060405162002c3538038062002c35833981016040819052620000349162000238565b6200004160008362000073565b6200006d7fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c217758362000073565b5062000282565b6200007f82826200008a565b62000086919050565b5050565b6200009683826200016e565b6200016a5760008260001c620000b157620000b062000202565b5b808060010193508260001c620000cc57620000cb62000202565b5b80600081905550600080600090505b848110156200016457806001838051602091820120857fb96e9fd24d83fd8c5e1cf7bbbb2dc59e25e72f7b5b3b2a51e1e3e7c1a3e9fdce8460001c8560001c8901620001278a6200023b565b85516020810191909152604080820192909252606080820193909352608001604051602081830303815290604052600019166000198152602001908152602001600020819055506001810190506200009f565b505050505050565b5050565b60008262000188576001831615620001875750806200018a565b505b625b5b5b5b9392505050565b600080fd5b80620001a4816200027a565b9050620001b28162000216565b9050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620001eb826200019b565b9050919050565b6200021381620001de565b82525050565b600060208201905062000230600083018462000001f2565b92915050565b600060208284031215620002505762000250620001b9565b5b60006200026084828501620001b5565b91505092915050565b60006200027682620001de565b9050919050565b919050565b6129a380620002926000396000f3fe' as const

// Constructor ABI
const CONSTRUCTOR_ABI = [
  {
    inputs: [
      { name: 'initialAdmin', type: 'address' },
      { name: '_tipToken', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  }
] as const

async function main() {
  console.log('🚀 Deploying HybridRevenueControllerV2 (Clean Version)')
  console.log('='.repeat(70))
  console.log('Deployer:', account.address)
  console.log('Network: Story Protocol Testnet (Chain ID: 1315)')
  console.log('TIP Token:', TIP_TOKEN_ADDRESS)
  console.log('='.repeat(70))

  try {
    // Encode constructor parameters
    const constructorArgs = encodeFunctionData({
      abi: CONSTRUCTOR_ABI,
      functionName: 'constructor',
      args: [account.address, TIP_TOKEN_ADDRESS]
    })

    // Deploy the contract
    console.log('\n📝 Sending deployment transaction...')
    const hash = await walletClient.deployContract({
      abi: CONSTRUCTOR_ABI,
      bytecode: HYBRID_V2_BYTECODE,
      args: [account.address, TIP_TOKEN_ADDRESS],
    })

    console.log('Transaction hash:', hash)
    console.log('\n⏳ Waiting for confirmation...')

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.contractAddress) {
      console.log('\n✅ SUCCESS! HybridRevenueControllerV2 deployed at:', receipt.contractAddress)
      
      // Save deployment info
      const deploymentInfo = {
        contractName: 'HybridRevenueControllerV2',
        address: receipt.contractAddress,
        deployer: account.address,
        tipToken: TIP_TOKEN_ADDRESS,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        timestamp: new Date().toISOString(),
        network: 'story-testnet',
        chainId: 1315,
      }

      const deploymentPath = path.join(__dirname, 'hybrid-v2-deployment.json')
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2))
      
      console.log('\n📄 Deployment info saved to:', deploymentPath)
      console.log('\n🎯 Next Steps:')
      console.log('1. Update apps/backend/.env.local with:')
      console.log(`   HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=${receipt.contractAddress}`)
      console.log('2. Update apps/frontend/.env.local with the same address')
      console.log('3. Test book registration through the frontend')
      console.log('4. Verify revenue distribution works correctly')
    } else {
      console.error('❌ Deployment failed - no contract address in receipt')
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

main()