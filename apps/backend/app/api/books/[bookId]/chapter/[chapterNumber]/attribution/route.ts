import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { keccak256, toBytes } from 'viem'

// Simple ABI for chapterAttributions function
const CHAPTER_ATTRIBUTIONS_ABI = [
  "function chapterAttributions(bytes32 bookId, uint256 chapterNumber) view returns (address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)"
]

const CONTRACT_ADDRESS = "0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6"
const RPC_URL = "https://aeneid.storyrpc.io"

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; chapterNumber: string } }
) {
  try {
    const { bookId, chapterNumber } = params
    
    // Convert bookId to bytes32
    const bookIdBytes32 = keccak256(toBytes(bookId))
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CHAPTER_ATTRIBUTIONS_ABI, provider)
    
    // Get attribution from blockchain
    const attribution = await contract.chapterAttributions(bookIdBytes32, parseInt(chapterNumber))
    
    // Check if attribution is set (non-zero author address)
    const isSet = attribution.originalAuthor !== '0x0000000000000000000000000000000000000000'
    
    return NextResponse.json({
      success: true,
      attribution: {
        originalAuthor: attribution.originalAuthor,
        sourceBookId: attribution.sourceBookId,
        unlockPrice: attribution.unlockPrice.toString(), // Convert BigInt to string
        unlockPriceTIP: parseFloat(ethers.formatEther(attribution.unlockPrice)), // Convert to number
        isOriginalContent: attribution.isOriginalContent,
        isSet
      }
    })
    
  } catch (error) {
    console.error('Error checking attribution:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      attribution: null
    })
  }
}