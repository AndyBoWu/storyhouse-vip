import { ethers } from 'ethers'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Contract addresses from deployment
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'

// TIP Token ABI (only the functions we need)
const TIP_ABI = [
  'function mint(address to, uint256 amount) public',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
  'function hasRole(bytes32 role, address account) public view returns (bool)',
  'function MINTER_ROLE() public view returns (bytes32)'
]

async function main() {
  // Get arguments
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error('Usage: npm run mint-tip <recipient_address> <amount>')
    console.error('Example: npm run mint-tip 0x1234...5678 100')
    process.exit(1)
  }

  const recipientAddress = args[0]
  const amount = args[1]

  // Validate address
  if (!ethers.isAddress(recipientAddress)) {
    console.error('Invalid recipient address:', recipientAddress)
    process.exit(1)
  }

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.STORY_RPC_URL || 'http://localhost:8545')
  const privateKey = process.env.PRIVATE_KEY
  
  if (!privateKey) {
    console.error('PRIVATE_KEY not found in environment variables')
    process.exit(1)
  }

  const wallet = new ethers.Wallet(privateKey, provider)
  console.log('🔑 Minting from address:', wallet.address)

  // Connect to TIP token contract
  const tipToken = new ethers.Contract(TIP_TOKEN_ADDRESS, TIP_ABI, wallet)

  try {
    // Check if we have minter role
    const MINTER_ROLE = await tipToken.MINTER_ROLE()
    const hasMinterRole = await tipToken.hasRole(MINTER_ROLE, wallet.address)
    
    if (!hasMinterRole) {
      console.error('❌ Error: Your address does not have the MINTER_ROLE')
      console.error('Only addresses with MINTER_ROLE can mint TIP tokens')
      process.exit(1)
    }

    // Get token info
    const symbol = await tipToken.symbol()
    const decimals = await tipToken.decimals()
    
    // Check current balance
    const currentBalance = await tipToken.balanceOf(recipientAddress)
    console.log(`📊 Current ${symbol} balance:`, ethers.formatUnits(currentBalance, decimals))

    // Mint tokens
    const amountWei = ethers.parseUnits(amount, decimals)
    console.log(`🪙 Minting ${amount} ${symbol} tokens to ${recipientAddress}...`)
    
    const tx = await tipToken.mint(recipientAddress, amountWei)
    console.log('📝 Transaction hash:', tx.hash)
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...')
    const receipt = await tx.wait()
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

    // Check new balance
    const newBalance = await tipToken.balanceOf(recipientAddress)
    console.log(`📊 New ${symbol} balance:`, ethers.formatUnits(newBalance, decimals))
    console.log(`✨ Successfully minted ${amount} ${symbol} tokens!`)

  } catch (error) {
    console.error('❌ Error minting tokens:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})