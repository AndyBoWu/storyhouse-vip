import { createWalletClient, createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { storyTestnet } from '../apps/frontend/lib/config/chains'
import { HYBRID_REVENUE_CONTROLLER_ADDRESS, HYBRID_REVENUE_CONTROLLER_ABI, parseBookId } from '../apps/frontend/lib/contracts/hybridRevenueController'

// Configuration
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix'
const AUTHOR_ADDRESS = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2'
const TOTAL_CHAPTERS = 4
const CHAPTER_PRICES = {
  1: parseEther('0'), // Free
  2: parseEther('0'), // Free  
  3: parseEther('0'), // Free
  4: parseEther('0.5') // 0.5 TIP
}

async function main() {
  // You'll need to set your private key as an environment variable
  const privateKey = process.env.ADMIN_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('Please set ADMIN_PRIVATE_KEY environment variable')
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  
  // Create clients
  const publicClient = createPublicClient({
    chain: storyTestnet,
    transport: http()
  })
  
  const walletClient = createWalletClient({
    account,
    chain: storyTestnet,
    transport: http()
  })

  console.log('🚀 Registering Project Phoenix in HybridRevenueController...')
  console.log('Admin address:', account.address)
  
  // Parse book ID to get bytes32 format
  const { bytes32Id, authorAddress } = parseBookId(BOOK_ID)
  console.log('Book ID:', BOOK_ID)
  console.log('Bytes32 ID:', bytes32Id)
  console.log('Author address:', authorAddress)
  
  try {
    // Check if book is already registered
    const bookData = await publicClient.readContract({
      address: HYBRID_REVENUE_CONTROLLER_ADDRESS,
      abi: HYBRID_REVENUE_CONTROLLER_ABI,
      functionName: 'books',
      args: [bytes32Id],
    }) as any
    
    if (bookData.isActive) {
      console.log('✅ Book is already registered!')
    } else {
      console.log('📝 Registering book...')
      
      // Register the book
      const registerHash = await walletClient.writeContract({
        address: HYBRID_REVENUE_CONTROLLER_ADDRESS,
        abi: HYBRID_REVENUE_CONTROLLER_ABI,
        functionName: 'registerBook',
        args: [
          bytes32Id,                    // bookId
          AUTHOR_ADDRESS,               // curator (same as author for original books)
          false,                        // isDerivative
          '0x0000000000000000000000000000000000000000000000000000000000000000', // parentBookId (none)
          BigInt(TOTAL_CHAPTERS),       // totalChapters
          ''                           // ipfsMetadataHash
        ],
      })
      
      console.log('Register transaction hash:', registerHash)
      console.log('Waiting for confirmation...')
      
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: registerHash,
      })
      
      if (receipt.status === 'success') {
        console.log('✅ Book registered successfully!')
      } else {
        throw new Error('Book registration failed')
      }
    }
    
    // Set chapter attributions
    console.log('\n📝 Setting chapter attributions...')
    
    for (let chapterNum = 1; chapterNum <= TOTAL_CHAPTERS; chapterNum++) {
      console.log(`\nChapter ${chapterNum}:`)
      
      // Check if attribution already exists
      const attribution = await publicClient.readContract({
        address: HYBRID_REVENUE_CONTROLLER_ADDRESS,
        abi: HYBRID_REVENUE_CONTROLLER_ABI,
        functionName: 'chapterAttributions',
        args: [bytes32Id, BigInt(chapterNum)],
      }) as any
      
      if (attribution.originalAuthor !== '0x0000000000000000000000000000000000000000') {
        console.log(`✅ Attribution already set for chapter ${chapterNum}`)
        continue
      }
      
      console.log(`Setting attribution for chapter ${chapterNum}...`)
      
      const setAttributionHash = await walletClient.writeContract({
        address: HYBRID_REVENUE_CONTROLLER_ADDRESS,
        abi: HYBRID_REVENUE_CONTROLLER_ABI,
        functionName: 'setChapterAttribution',
        args: [
          bytes32Id,                        // bookId
          BigInt(chapterNum),               // chapterNumber
          AUTHOR_ADDRESS,                   // originalAuthor
          bytes32Id,                        // sourceBookId (same as bookId for original)
          CHAPTER_PRICES[chapterNum as keyof typeof CHAPTER_PRICES], // unlockPrice
          true                              // isOriginalContent
        ],
      })
      
      console.log(`Attribution transaction hash: ${setAttributionHash}`)
      console.log('Waiting for confirmation...')
      
      const attributionReceipt = await publicClient.waitForTransactionReceipt({
        hash: setAttributionHash,
      })
      
      if (attributionReceipt.status === 'success') {
        console.log(`✅ Chapter ${chapterNum} attribution set successfully!`)
      } else {
        throw new Error(`Failed to set attribution for chapter ${chapterNum}`)
      }
    }
    
    console.log('\n🎉 Project Phoenix is fully registered and configured!')
    console.log('Revenue distribution: 70% author, 20% curator, 10% platform')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)