import { ethers } from 'ethers'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') })

// Contract configuration
const HYBRID_REVENUE_CONTROLLER_ADDRESS = '0xd1F7e8c6FD77dADbE946aE3e4141189b39Ef7b08'
const HYBRID_REVENUE_CONTROLLER_ABI = [
  'function books(bytes32) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)',
  'function chapterAttributions(bytes32, uint256) view returns (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)'
]

// Book configuration
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'

// Helper to convert string to bytes32
function stringToBytes32(text: string): string {
  const hex = Buffer.from(text, 'utf8').toString('hex')
  // Ensure we only take first 64 characters (32 bytes)
  const truncated = hex.substring(0, 64)
  const padded = truncated.padEnd(64, '0')
  return `0x${padded}`
}

async function main() {
  // Create provider
  const provider = new ethers.JsonRpcProvider(process.env.STORY_RPC_URL || 'https://aeneid.storyrpc.io')
  
  // Create contract instance (read-only)
  const contract = new ethers.Contract(
    HYBRID_REVENUE_CONTROLLER_ADDRESS,
    HYBRID_REVENUE_CONTROLLER_ABI,
    provider
  )
  
  // Convert book ID to bytes32
  const bookIdBytes32 = stringToBytes32(BOOK_ID)
  
  console.log('🔍 Checking registration status for Project Phoenix')
  console.log('📚 Book ID:', BOOK_ID)
  console.log('📚 Bytes32:', bookIdBytes32)
  console.log('📍 Contract:', HYBRID_REVENUE_CONTROLLER_ADDRESS)
  console.log('')
  
  try {
    // Check book registration
    const bookData = await contract.books(bookIdBytes32)
    
    console.log('📖 Book Registration:')
    console.log('  - Registered:', bookData.isActive ? '✅ YES' : '❌ NO')
    console.log('  - Curator:', bookData.curator)
    console.log('  - Is Derivative:', bookData.isDerivative)
    console.log('  - Total Chapters:', bookData.totalChapters.toString())
    console.log('')
    
    // Check chapter attributions
    console.log('📝 Chapter Attributions:')
    
    for (let chapterNum = 1; chapterNum <= 4; chapterNum++) {
      const attribution = await contract.chapterAttributions(bookIdBytes32, chapterNum)
      const isSet = attribution.originalAuthor !== ethers.ZeroAddress
      const price = ethers.formatEther(attribution.unlockPrice)
      
      console.log(`  Chapter ${chapterNum}:`)
      console.log(`    - Attribution Set: ${isSet ? '✅ YES' : '❌ NO'}`)
      if (isSet) {
        console.log(`    - Original Author: ${attribution.originalAuthor}`)
        console.log(`    - Unlock Price: ${price} TIP`)
        console.log(`    - Is Original: ${attribution.isOriginalContent}`)
      }
    }
    
    // Overall status
    console.log('\n📊 Overall Status:')
    if (bookData.isActive) {
      console.log('✅ Book is properly registered and ready for HybridRevenueController payments!')
    } else {
      console.log('❌ Book needs to be registered before it can use HybridRevenueController')
      console.log('   Run: npm run register-book')
    }
    
  } catch (error) {
    console.error('❌ Error checking registration:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)