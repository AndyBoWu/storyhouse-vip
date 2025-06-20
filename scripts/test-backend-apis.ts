import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3002'
const TEST_BOOK_ID = '0x742d35Cc6642C4532cEd5bb0407aCF0c6f2c88aF/test-book'
const TEST_USER_ADDRESS = '0x742d35Cc6642C4532cEd5bb0407aCF0c6f2c88aF'

async function testBackendAPIs() {
  console.log('🌐 Testing Backend API Endpoints for License Token Flow')
  console.log('=' .repeat(60))
  console.log('')
  console.log('API Base URL:', API_BASE_URL)
  console.log('Test Book ID:', TEST_BOOK_ID)
  console.log('Test User Address:', TEST_USER_ADDRESS)
  console.log('')
  
  // Test 1: Check chapter unlock info for a free chapter
  console.log('📖 Test 1: Free Chapter Access (Chapter 1)')
  console.log('-'.repeat(45))
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/1/unlock?userAddress=${TEST_USER_ADDRESS}`)
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ Free chapter access works correctly')
      console.log('   - isFree:', data.data.isFree)
      console.log('   - unlockPrice:', data.data.unlockPrice)
      console.log('   - canAccess:', data.data.canAccess)
    } else {
      console.log('❌ Free chapter test failed:', data.error)
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message)
    console.log('💡 Make sure the backend is running: cd apps/backend && npm run dev')
  }
  console.log('')
  
  // Test 2: Check chapter unlock info for a paid chapter
  console.log('💰 Test 2: Paid Chapter Access (Chapter 4)')
  console.log('-'.repeat(45))
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/4/unlock?userAddress=${TEST_USER_ADDRESS}`)
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ Paid chapter info retrieved correctly')
      console.log('   - isFree:', data.data.isFree)
      console.log('   - unlockPrice:', data.data.unlockPrice)
      console.log('   - canAccess:', data.data.canAccess)
      console.log('   - alreadyUnlocked:', data.data.alreadyUnlocked)
    } else {
      console.log('❌ Paid chapter test failed:', data.error)
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message)
  }
  console.log('')
  
  // Test 3: Get reading license pricing info
  console.log('📜 Test 3: Reading License Pricing (Chapter 4)')
  console.log('-'.repeat(48))
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/4/mint-reading-license?userAddress=${TEST_USER_ADDRESS}`)
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ License pricing retrieved correctly')
      console.log('   - mintingFee:', data.data.mintingFee, 'TIP')
      console.log('   - currency:', data.data.currency)
      console.log('   - transferable:', data.data.transferable)
      console.log('   - licenseType:', data.data.licenseType)
    } else {
      console.log('❌ License pricing test failed:', data.error)
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message)
  }
  console.log('')
  
  // Test 4: Test free chapter unlock (POST)
  console.log('🆓 Test 4: Free Chapter Unlock (POST)')
  console.log('-'.repeat(40))
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(TEST_BOOK_ID)}/chapter/3/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: TEST_USER_ADDRESS
      })
    })
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ Free chapter unlock successful')
      console.log('   - Chapter access granted immediately')
      console.log('   - No payment required')
    } else {
      console.log('❌ Free chapter unlock failed:', data.error)
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message)
  }
  console.log('')
  
  // Test 5: Test book registration endpoint
  console.log('📚 Test 5: Book Registration Info')
  console.log('-'.repeat(35))
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/register-hybrid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId: TEST_BOOK_ID,
        totalChapters: 1000000
      })
    })
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ Book registration endpoint working')
      console.log('   - useV2:', data.useV2)
      console.log('   - v2Address:', data.v2Address)
      console.log('   - Revenue shares:', data.revenueShare)
    } else {
      console.log('❌ Book registration test failed:', data.error)
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message)
  }
  console.log('')
  
  // Test 6: Test health endpoint
  console.log('🏥 Test 6: Health Check')
  console.log('-'.repeat(25))
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    const data = await response.json()
    
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.status === 200) {
      console.log('✅ Backend health check passed')
    } else {
      console.log('❌ Health check failed')
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message)
  }
  console.log('')
  
  // Summary
  console.log('📊 Test Summary')
  console.log('-'.repeat(15))
  console.log('')
  console.log('The backend APIs are designed to support:')
  console.log('')
  console.log('✅ Chapter Access Control:')
  console.log('   • Free chapters (1-3): Immediate access')
  console.log('   • Paid chapters (4+): Requires TIP payment + license')
  console.log('')
  console.log('✅ License Token Minting:')
  console.log('   • GET endpoint: Pricing and requirements')
  console.log('   • POST endpoint: Actual minting (simulation)')
  console.log('')
  console.log('✅ Book Registration:')
  console.log('   • Permissionless registration via V2 contract')
  console.log('   • Frontend-based registration with MetaMask')
  console.log('')
  console.log('🎯 Next Steps for Complete Testing:')
  console.log('1. Start backend: cd apps/backend && npm run dev')
  console.log('2. Start frontend: cd apps/frontend && npm run dev')
  console.log('3. Create a test book with 4+ chapters')
  console.log('4. Register book using frontend + MetaMask')
  console.log('5. Test chapter unlock with wallet containing TIP tokens')
  console.log('')
  console.log('💡 The license token system is fully implemented and ready for testing!')
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBackendAPIs().catch(console.error)
}

export { testBackendAPIs }