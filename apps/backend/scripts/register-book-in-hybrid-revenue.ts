import { ethers } from 'ethers'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Contract ABIs (minimal interface)
const HYBRID_REVENUE_CONTROLLER_ABI = [
  "function registerBook(bytes32 bookId, address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, string memory ipfsMetadataHash) external",
  "function setChapterAttribution(bytes32 bookId, uint256 chapterNumber, address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent) external",
  "function books(bytes32) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)",
  "function chapterAttributions(bytes32, uint256) view returns (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)",
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function STORY_MANAGER_ROLE() view returns (bytes32)"
]

const HYBRID_REVENUE_CONTROLLER_ADDRESS = '0xd1F7e8c6FD77dADbE946aE3e4141189b39Ef7b08'

// Helper to convert string to bytes32
function stringToBytes32(text: string): string {
  // Convert string to hex
  const hex = Buffer.from(text, 'utf8').toString('hex')
  // Ensure it's exactly 64 characters (32 bytes)
  if (hex.length > 64) {
    // If too long, truncate
    return '0x' + hex.substring(0, 64)
  } else {
    // If too short, pad with zeros
    return '0x' + hex.padEnd(64, '0')
  }
}

async function main() {
  // Setup provider and signer
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://aeneid.storyrpc.io'
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const privateKey = process.env.ADMIN_PRIVATE_KEY || process.env.STORY_PRIVATE_KEY
  
  if (!privateKey) {
    console.log('⚠️ No admin private key found - running in read-only mode')
    console.log('To register the book, add ADMIN_PRIVATE_KEY to your .env.local file')
    console.log('')
    
    // Check if book is already registered (read-only)
    const bookId = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'
    const bookIdBytes32 = stringToBytes32(bookId)
    
    const hybridRevenue = new ethers.Contract(
      HYBRID_REVENUE_CONTROLLER_ADDRESS,
      HYBRID_REVENUE_CONTROLLER_ABI,
      provider
    )
    
    console.log('📚 Checking book registration status...')
    console.log('Book ID:', bookId)
    console.log('Book ID (bytes32):', bookIdBytes32)
    console.log('')
    
    try {
      const bookData = await hybridRevenue.books(bookIdBytes32)
      if (bookData.isActive) {
        console.log('✅ Book is already registered in HybridRevenueController!')
        console.log('Curator:', bookData.curator)
        console.log('Total chapters:', bookData.totalChapters.toString())
        console.log('')
        
        // Check chapter attributions
        console.log('📖 Chapter attributions:')
        for (let i = 1; i <= bookData.totalChapters; i++) {
          const attribution = await hybridRevenue.chapterAttributions(bookIdBytes32, i)
          if (attribution.originalAuthor !== ethers.ZeroAddress) {
            console.log(`Chapter ${i}:`)
            console.log(`  Author: ${attribution.originalAuthor}`)
            console.log(`  Price: ${ethers.formatEther(attribution.unlockPrice)} TIP`)
            console.log(`  Is Original: ${attribution.isOriginalContent}`)
          }
        }
        console.log('')
        console.log('✅ Bob can now unlock chapters through HybridRevenueController!')
      } else {
        console.log('❌ Book is NOT registered in HybridRevenueController')
        console.log('To register it, add ADMIN_PRIVATE_KEY to your .env.local and run this script again')
      }
    } catch (error) {
      console.error('Error checking book status:', error)
    }
    
    return
  }
  
  const signer = new ethers.Wallet(privateKey, provider)
  console.log('Admin address:', signer.address)
  
  // Connect to HybridRevenueController
  const hybridRevenue = new ethers.Contract(
    HYBRID_REVENUE_CONTROLLER_ADDRESS,
    HYBRID_REVENUE_CONTROLLER_ABI,
    signer
  )
  
  // Book details
  const bookId = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'
  const bookIdBytes32 = stringToBytes32(bookId)
  const authorAddress = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2' // Andy's address
  const totalChapters = 4
  
  console.log('Book ID:', bookId)
  console.log('Book ID (bytes32):', bookIdBytes32)
  console.log('Author/Curator:', authorAddress)
  
  try {
    // Check if admin has STORY_MANAGER_ROLE
    const storyManagerRole = await hybridRevenue.STORY_MANAGER_ROLE()
    const hasRole = await hybridRevenue.hasRole(storyManagerRole, signer.address)
    
    if (!hasRole) {
      console.log('Admin does not have STORY_MANAGER_ROLE, attempting to grant...')
      // Note: This will only work if the admin is the contract owner or has admin role
      const adminRole = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))
      const hasAdminRole = await hybridRevenue.hasRole(adminRole, signer.address)
      
      if (!hasAdminRole) {
        throw new Error('Admin does not have permission to grant roles')
      }
      
      const grantTx = await hybridRevenue.grantRole(storyManagerRole, signer.address)
      await grantTx.wait()
      console.log('✅ STORY_MANAGER_ROLE granted to admin')
    }
    
    // Check if book is already registered
    const bookData = await hybridRevenue.books(bookIdBytes32)
    if (bookData.isActive) {
      console.log('Book is already registered!')
      console.log('Curator:', bookData.curator)
      console.log('Total chapters:', bookData.totalChapters.toString())
    } else {
      // Register the book
      console.log('Registering book...')
      const registerTx = await hybridRevenue.registerBook(
        bookIdBytes32,
        authorAddress, // curator is the author for original books
        false, // not derivative
        ethers.ZeroHash, // no parent book
        totalChapters,
        '' // IPFS hash can be empty for now
      )
      await registerTx.wait()
      console.log('✅ Book registered successfully!')
    }
    
    // Set chapter attributions
    console.log('\nSetting chapter attributions...')
    
    // Chapter prices (in TIP)
    const chapterPrices = {
      1: ethers.parseEther('0'), // Free
      2: ethers.parseEther('0'), // Free
      3: ethers.parseEther('0'), // Free
      4: ethers.parseEther('0.5') // 0.5 TIP
    }
    
    for (let i = 1; i <= totalChapters; i++) {
      const attribution = await hybridRevenue.chapterAttributions(bookIdBytes32, i)
      
      if (attribution.originalAuthor === ethers.ZeroAddress) {
        console.log(`Setting attribution for chapter ${i}...`)
        const setAttrTx = await hybridRevenue.setChapterAttribution(
          bookIdBytes32,
          i,
          authorAddress, // original author
          bookIdBytes32, // source book is same as current book
          chapterPrices[i as keyof typeof chapterPrices],
          true // is original content
        )
        await setAttrTx.wait()
        console.log(`✅ Chapter ${i} attribution set (${ethers.formatEther(chapterPrices[i as keyof typeof chapterPrices])} TIP)`)
      } else {
        console.log(`Chapter ${i} already has attribution:`)
        console.log(`  Author: ${attribution.originalAuthor}`)
        console.log(`  Price: ${ethers.formatEther(attribution.unlockPrice)} TIP`)
      }
    }
    
    console.log('\n✅ Book registration and attribution setup complete!')
    console.log('Bob can now unlock chapters through HybridRevenueController')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)