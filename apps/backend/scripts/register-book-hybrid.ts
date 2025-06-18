import { ethers } from 'ethers'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') })

// Contract configuration
const HYBRID_REVENUE_CONTROLLER_ADDRESS = '0xd1F7e8c6FD77dADbE946aE3e4141189b39Ef7b08'
const HYBRID_REVENUE_CONTROLLER_ABI = [
  'function registerBook(bytes32 bookId, address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, string ipfsMetadataHash)',
  'function setChapterAttribution(bytes32 bookId, uint256 chapterNumber, address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)',
  'function books(bytes32) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)',
  'function chapterAttributions(bytes32, uint256) view returns (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function STORY_MANAGER_ROLE() view returns (bytes32)',
  'function grantRole(bytes32 role, address account)'
]

// Book configuration
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'
const AUTHOR_ADDRESS = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2'
const TOTAL_CHAPTERS = 4

// Helper to convert string to bytes32
function stringToBytes32(text: string): string {
  const hex = Buffer.from(text, 'utf8').toString('hex')
  // Ensure we only take first 64 characters (32 bytes)
  const truncated = hex.substring(0, 64)
  const padded = truncated.padEnd(64, '0')
  return `0x${padded}`
}

async function main() {
  // Check if we have a private key
  if (!process.env.ADMIN_PRIVATE_KEY) {
    console.error('❌ Please set ADMIN_PRIVATE_KEY in your .env.local file')
    console.log('This should be the private key of an account with STORY_MANAGER_ROLE')
    process.exit(1)
  }

  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.STORY_RPC_URL || 'https://aeneid.storyrpc.io')
  const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
  
  console.log('🔑 Using admin address:', signer.address)
  
  // Create contract instance
  const contract = new ethers.Contract(
    HYBRID_REVENUE_CONTROLLER_ADDRESS,
    HYBRID_REVENUE_CONTROLLER_ABI,
    signer
  )
  
  // Convert book ID to bytes32
  const bookIdBytes32 = stringToBytes32(BOOK_ID)
  console.log('📚 Book ID:', BOOK_ID)
  console.log('📚 Bytes32:', bookIdBytes32)
  
  try {
    // Check if the signer has STORY_MANAGER_ROLE
    const STORY_MANAGER_ROLE = await contract.STORY_MANAGER_ROLE()
    const hasRole = await contract.hasRole(STORY_MANAGER_ROLE, signer.address)
    
    if (!hasRole) {
      console.error('❌ Admin account does not have STORY_MANAGER_ROLE')
      console.log('Please grant the role to:', signer.address)
      console.log('Role hash:', STORY_MANAGER_ROLE)
      process.exit(1)
    }
    
    // Check if book is already registered
    const bookData = await contract.books(bookIdBytes32)
    console.log('📖 Book registration status:', bookData.isActive ? 'Already registered' : 'Not registered')
    
    if (!bookData.isActive) {
      console.log('📝 Registering book...')
      
      const tx = await contract.registerBook(
        bookIdBytes32,                    // bookId
        AUTHOR_ADDRESS,                   // curator (same as author for original)
        false,                            // isDerivative
        ethers.ZeroHash,                  // parentBookId (none)
        TOTAL_CHAPTERS,                   // totalChapters
        ''                               // ipfsMetadataHash
      )
      
      console.log('Transaction hash:', tx.hash)
      const receipt = await tx.wait()
      console.log('✅ Book registered in block:', receipt.blockNumber)
    }
    
    // Set chapter attributions
    console.log('\n📝 Setting chapter attributions...')
    
    for (let chapterNum = 1; chapterNum <= TOTAL_CHAPTERS; chapterNum++) {
      // Check if attribution already exists
      const attribution = await contract.chapterAttributions(bookIdBytes32, chapterNum)
      
      if (attribution.originalAuthor !== ethers.ZeroAddress) {
        console.log(`✅ Chapter ${chapterNum} attribution already set`)
        continue
      }
      
      // Set price based on chapter number
      const unlockPrice = chapterNum <= 3 ? '0' : ethers.parseEther('0.5')
      
      console.log(`📝 Setting chapter ${chapterNum} attribution (price: ${chapterNum <= 3 ? 'FREE' : '0.5 TIP'})...`)
      
      const tx = await contract.setChapterAttribution(
        bookIdBytes32,                    // bookId
        chapterNum,                       // chapterNumber
        AUTHOR_ADDRESS,                   // originalAuthor
        bookIdBytes32,                    // sourceBookId (same for original)
        unlockPrice,                      // unlockPrice
        true                             // isOriginalContent
      )
      
      console.log(`Transaction hash: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`✅ Chapter ${chapterNum} attribution set in block: ${receipt.blockNumber}`)
    }
    
    console.log('\n🎉 Project Phoenix is fully registered!')
    console.log('✅ Book registered in HybridRevenueController')
    console.log('✅ All chapter attributions set')
    console.log('✅ Revenue split: 70% author, 20% curator, 10% platform')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)