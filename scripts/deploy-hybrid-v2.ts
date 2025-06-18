import { ethers } from 'ethers'
import { config } from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
config({ path: path.resolve(__dirname, '../apps/backend/.env.local') })

// TIP Token address on testnet
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'

// Contract bytecode (you'll need to compile the contract first)
const HYBRID_V2_BYTECODE = '0x...' // Add compiled bytecode here

async function main() {
  if (!process.env.ADMIN_PRIVATE_KEY) {
    console.error('Please set ADMIN_PRIVATE_KEY in your .env.local')
    process.exit(1)
  }

  const provider = new ethers.JsonRpcProvider(process.env.STORY_RPC_URL || 'https://aeneid.storyrpc.io')
  const deployer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
  
  console.log('🚀 Deploying HybridRevenueControllerV2...')
  console.log('Deployer:', deployer.address)
  console.log('TIP Token:', TIP_TOKEN_ADDRESS)
  
  // Deploy the contract
  const factory = new ethers.ContractFactory(
    HYBRID_V2_ABI,
    HYBRID_V2_BYTECODE,
    deployer
  )
  
  const contract = await factory.deploy(TIP_TOKEN_ADDRESS)
  console.log('Transaction hash:', contract.deploymentTransaction()?.hash)
  
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  
  console.log('✅ HybridRevenueControllerV2 deployed at:', address)
  
  // Save deployment info
  const deployment = {
    address,
    deployer: deployer.address,
    tipToken: TIP_TOKEN_ADDRESS,
    timestamp: new Date().toISOString(),
    network: 'story-testnet'
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'hybrid-v2-deployment.json'),
    JSON.stringify(deployment, null, 2)
  )
  
  console.log('📄 Deployment info saved to hybrid-v2-deployment.json')
}

// Minimal ABI for deployment
const HYBRID_V2_ABI = [
  {
    "inputs": [{"name": "_tipToken", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  }
]

main().catch(console.error)