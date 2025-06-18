import { ethers } from 'ethers'
import { config } from 'dotenv'
import * as path from 'path'

// Load environment variables
config({ path: path.resolve(__dirname, '../apps/backend/.env.local') })

const STORY_RPC_URL = 'https://aeneid.storyrpc.io'
const TIP_TOKEN_ADDRESS = '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E'
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812'

// Test parameters
const TEST_BOOK_ID = 'test-author/sample-book' // Replace with actual book ID
const TEST_CHAPTER_NUMBER = 4 // Chapter 4 (first paid chapter)
const TEST_USER_ADDRESS = '0x742d35Cc6642C4532cEd5bb0407aCF0c6f2c88aF' // Replace with test user address

// ABI for HybridRevenueControllerV2
const HYBRID_V2_ABI = [
  'function books(bytes32) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)',
  'function unlockChapter(bytes32 bookId, uint256 chapterNumber) payable',
  'function hasUnlockedChapter(address user, bytes32 bookId, uint256 chapterNumber) view returns (bool)',
  'function chapterUnlocks(address, bytes32, uint256) view returns (bool)'
]

// TIP Token ABI
const TIP_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)'
]

// Helper to convert string to bytes32
function stringToBytes32(text: string): string {
  const hex = Buffer.from(text, 'utf8').toString('hex')
  const truncated = hex.substring(0, 64)
  const padded = truncated.padEnd(64, '0')
  return `0x${padded}`
}

async function testLicenseTokenUnlock() {
  console.log('🧪 Testing Protected Chapter Unlock via License Token Minting')
  console.log('=' .repeat(70))
  
  const provider = new ethers.JsonRpcProvider(STORY_RPC_URL)
  
  // Convert book ID to bytes32 format
  const bookIdBytes32 = stringToBytes32(TEST_BOOK_ID)
  
  console.log('📋 Test Parameters:')
  console.log('Book ID:', TEST_BOOK_ID)
  console.log('Book ID (bytes32):', bookIdBytes32)
  console.log('Chapter Number:', TEST_CHAPTER_NUMBER)
  console.log('Test User:', TEST_USER_ADDRESS)
  console.log('HybridRevenueControllerV2:', HYBRID_REVENUE_CONTROLLER_V2_ADDRESS)
  console.log('')
  
  // Step 1: Check if book is registered in HybridRevenueControllerV2
  console.log('🔍 Step 1: Checking book registration...')
  try {
    const hybridController = new ethers.Contract(
      HYBRID_REVENUE_CONTROLLER_V2_ADDRESS,
      HYBRID_V2_ABI,
      provider
    )
    
    const bookData = await hybridController.books(bookIdBytes32)
    console.log('Book data:', {
      curator: bookData.curator,
      isDerivative: bookData.isDerivative,
      parentBookId: bookData.parentBookId,
      totalChapters: bookData.totalChapters.toString(),
      isActive: bookData.isActive,
      ipfsMetadataHash: bookData.ipfsMetadataHash
    })
    
    if (!bookData.isActive) {
      console.log('❌ Book is not registered or not active in HybridRevenueControllerV2')
      console.log('💡 The author needs to register their book first using the frontend')
      return
    }
    
    console.log('✅ Book is properly registered and active')
    
    if (TEST_CHAPTER_NUMBER > Number(bookData.totalChapters)) {
      console.log(`❌ Chapter ${TEST_CHAPTER_NUMBER} exceeds total chapters (${bookData.totalChapters})`)
      return
    }
    
  } catch (error) {
    console.error('❌ Failed to check book registration:', error)
    return
  }
  
  // Step 2: Check user's current TIP balance
  console.log('')
  console.log('💰 Step 2: Checking user TIP balance...')
  try {
    const tipToken = new ethers.Contract(TIP_TOKEN_ADDRESS, TIP_TOKEN_ABI, provider)
    const balance = await tipToken.balanceOf(TEST_USER_ADDRESS)
    const balanceFormatted = ethers.formatEther(balance)
    
    console.log(`User TIP balance: ${balanceFormatted} TIP`)
    
    const requiredAmount = ethers.parseEther('0.5') // 0.5 TIP for chapter unlock
    if (balance < requiredAmount) {
      console.log('❌ Insufficient TIP balance for chapter unlock')
      console.log(`Required: 0.5 TIP, Available: ${balanceFormatted} TIP`)
      return
    }
    
    console.log('✅ Sufficient TIP balance for chapter unlock')
    
  } catch (error) {
    console.error('❌ Failed to check TIP balance:', error)
    return
  }
  
  // Step 3: Check if chapter is already unlocked
  console.log('')
  console.log('🔓 Step 3: Checking chapter unlock status...')
  try {
    const hybridController = new ethers.Contract(
      HYBRID_REVENUE_CONTROLLER_V2_ADDRESS,
      HYBRID_V2_ABI,
      provider
    )
    
    const isUnlocked = await hybridController.chapterUnlocks(
      TEST_USER_ADDRESS,
      bookIdBytes32,
      TEST_CHAPTER_NUMBER
    )
    
    console.log(`Chapter ${TEST_CHAPTER_NUMBER} unlock status:`, isUnlocked ? 'UNLOCKED' : 'LOCKED')
    
    if (isUnlocked) {
      console.log('✅ Chapter is already unlocked for this user')
    } else {
      console.log('🔒 Chapter is locked - license token minting required')
    }
    
  } catch (error) {
    console.error('❌ Failed to check chapter unlock status:', error)
    return
  }
  
  // Step 4: Test API endpoints
  console.log('')
  console.log('🌐 Step 4: Testing API endpoints...')
  
  // Test chapter unlock info endpoint
  try {
    console.log('Testing GET /api/books/{bookId}/chapter/{chapterNumber}/unlock...')
    
    const unlockInfoUrl = `http://localhost:3002/api/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/${TEST_CHAPTER_NUMBER}/unlock?userAddress=${TEST_USER_ADDRESS}`
    console.log('Request URL:', unlockInfoUrl)
    
    // Note: This would require the backend to be running
    console.log('💡 To test this endpoint, run: curl "' + unlockInfoUrl + '"')
    
  } catch (error) {
    console.error('❌ API test failed:', error)
  }
  
  // Step 5: Test reading license info endpoint
  try {
    console.log('')
    console.log('Testing GET /api/books/{bookId}/chapter/{chapterNumber}/mint-reading-license...')
    
    const licenseInfoUrl = `http://localhost:3002/api/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/${TEST_CHAPTER_NUMBER}/mint-reading-license?userAddress=${TEST_USER_ADDRESS}`
    console.log('Request URL:', licenseInfoUrl)
    
    console.log('💡 To test this endpoint, run: curl "' + licenseInfoUrl + '"')
    
  } catch (error) {
    console.error('❌ License info test failed:', error)
  }
  
  // Step 6: Show the complete license token minting flow
  console.log('')
  console.log('🎯 Step 6: Complete License Token Minting Flow')
  console.log('-'.repeat(50))
  console.log('')
  console.log('For a complete test, the frontend would perform these steps:')
  console.log('')
  console.log('1. 🔐 APPROVE TIP SPENDING:')
  console.log('   - Contract: TIP Token')
  console.log('   - Spender: HybridRevenueControllerV2')
  console.log('   - Amount: 0.5 TIP (500000000000000000 wei)')
  console.log('')
  console.log('2. 💰 UNLOCK CHAPTER (Payment & Revenue Distribution):')
  console.log('   - Contract: HybridRevenueControllerV2')
  console.log('   - Function: unlockChapter(bytes32 bookId, uint256 chapterNumber)')
  console.log('   - Revenue Split: 70% author, 20% curator, 10% platform')
  console.log('')
  console.log('3. 📜 MINT STORY PROTOCOL LICENSE:')
  console.log('   - SDK: Story Protocol Core SDK')
  console.log('   - Function: client.license.mintLicenseTokens()')
  console.log('   - Result: Non-transferable reading license NFT')
  console.log('')
  console.log('4. ✅ VERIFY ACCESS:')
  console.log('   - Backend checks license token ownership')
  console.log('   - User gains permanent reading access')
  console.log('')
  
  // Step 7: Show manual testing commands
  console.log('🛠️  Manual Testing Commands:')
  console.log('')
  console.log('Start the backend server:')
  console.log('cd apps/backend && npm run dev')
  console.log('')
  console.log('Start the frontend:')
  console.log('cd apps/frontend && npm run dev')
  console.log('')
  console.log('Test chapter access API:')
  console.log(`curl "${unlockInfoUrl}"`)
  console.log('')
  console.log('Test license info API:')
  console.log(`curl "${licenseInfoUrl}"`)
  console.log('')
  console.log('Frontend URL for testing:')
  console.log(`http://localhost:3001/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/${TEST_CHAPTER_NUMBER}`)
  console.log('')
  
  console.log('✅ License token unlock test setup complete!')
  console.log('')
  console.log('💡 Next steps:')
  console.log('1. Start the backend and frontend servers')
  console.log('2. Create a test book with at least 4 chapters')
  console.log('3. Register the book using the frontend')
  console.log('4. Test unlocking chapter 4 with a wallet that has TIP tokens')
  console.log('5. Verify the license token is minted and access is granted')
}

// Run the test
testLicenseTokenUnlock().catch(console.error)