import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { getBlockchainConfig } from '@/lib/config/blockchain'

const HYBRID_REVENUE_CONTROLLER = '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const bookId = params.bookId
    console.log('🔍 Checking registration status for:', bookId)

    // Convert bookId to bytes32
    const bytes32BookId = ethers.id(bookId)
    
    // Connect to blockchain
    const config = getBlockchainConfig()
    const provider = new ethers.JsonRpcProvider(config.rpcUrl)
    
    // Check HybridRevenueController V2 registration
    const abi = [{
      inputs: [{ name: "bookId", type: "bytes32" }],
      name: "books",
      outputs: [
        { name: "curator", type: "address" },
        { name: "totalChapters", type: "uint256" },
        { name: "isActive", type: "bool" },
        { name: "ipfsMetadataHash", type: "string" }
      ],
      stateMutability: "view",
      type: "function"
    }]
    
    const contract = new ethers.Contract(HYBRID_REVENUE_CONTROLLER, abi, provider)
    const bookData = await contract.books(bytes32BookId)
    
    const isRegistered = bookData.curator !== ethers.ZeroAddress
    
    return NextResponse.json({
      success: true,
      data: {
        bookId,
        bytes32BookId,
        isRegistered,
        curator: bookData.curator,
        isActive: bookData.isActive,
        totalChapters: bookData.totalChapters.toString(),
        requiresRegistration: !isRegistered
      }
    })
    
  } catch (error) {
    console.error('Error checking registration:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check registration status'
    }, { status: 500 })
  }
}