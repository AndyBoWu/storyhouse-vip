import { ethers } from 'ethers'
import { keccak256, toBytes } from 'viem'

const STORY_RPC_URL = 'https://aeneid.storyrpc.io'
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812'

// The book ID from the URL
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'

// ABI for checking book registration
const HYBRID_V2_ABI = [
  'function books(bytes32) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)'
]

// Generate bytes32 ID the same way as frontend
function parseBookId(bookId: string): { bytes32Id: string } {
  const bytes32Id = keccak256(toBytes(bookId))
  return { bytes32Id }
}

async function checkBookRegistration() {
  console.log('🔍 Checking Book Registration Status')
  console.log('=' .repeat(50))
  console.log('')
  console.log('Book ID:', BOOK_ID)
  console.log('Contract:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS)
  console.log('')

  const provider = new ethers.JsonRpcProvider(STORY_RPC_URL)
  const contract = new ethers.Contract(
    HYBRID_REVENUE_CONTROLLER_V2_ADDRESS,
    HYBRID_V2_ABI,
    provider
  )

  try {
    // Convert book ID to bytes32 using the same method as frontend
    const { bytes32Id } = parseBookId(BOOK_ID)
    console.log('Book ID (bytes32):', bytes32Id)
    console.log('')

    // Check book registration
    const bookData = await contract.books(bytes32Id)
    
    console.log('📚 Book Registration Data:')
    console.log('Curator:', bookData.curator)
    console.log('Is Derivative:', bookData.isDerivative)
    console.log('Parent Book ID:', bookData.parentBookId)
    console.log('Total Chapters:', bookData.totalChapters.toString())
    console.log('Is Active:', bookData.isActive)
    console.log('IPFS Metadata Hash:', bookData.ipfsMetadataHash)
    console.log('')

    if (bookData.isActive) {
      console.log('✅ Book is registered and active!')
      console.log('✅ Chapter unlocking should work')
    } else {
      console.log('❌ Book is NOT registered or not active')
      console.log('')
      console.log('💡 To fix this, Andy needs to:')
      console.log('1. Go to the book management page')
      console.log('2. Click "Register for Revenue Sharing"')
      console.log('3. Use MetaMask to sign the registration transaction')
      console.log('')
      console.log('Or use this direct registration call:')
      console.log(`registerBook(`)
      console.log(`  bookId: "${bytes32Id}",`)
      console.log(`  isDerivative: false,`)
      console.log(`  parentBookId: "0x0000000000000000000000000000000000000000000000000000000000000000",`)
      console.log(`  totalChapters: 10, // Adjust as needed`)
      console.log(`  ipfsMetadataHash: ""`)
      console.log(`)`)
    }

  } catch (error) {
    console.error('❌ Failed to check book registration:', error)
    
    if (error.message.includes('could not decode result data')) {
      console.log('')
      console.log('💡 This error suggests the book is not registered at all.')
      console.log('The book returns empty data, indicating it needs to be registered first.')
    }
  }

  console.log('')
  console.log('🔗 Contract Explorer:')
  console.log(`https://aeneid.storyscan.xyz/address/${HYBRID_REVENUE_CONTROLLER_V2_ADDRESS}`)
}

checkBookRegistration().catch(console.error)