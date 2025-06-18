import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { BookStorageService } from '@/lib/storage/bookStorage'

// V2 is now the only version
const HYBRID_REVENUE_CONTROLLER_V2_ABI = [
  'function registerBook(bytes32 bookId, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, string ipfsMetadataHash)',
  'function setChapterAttribution(bytes32 bookId, uint256 chapterNumber, address originalAuthor, bytes32 sourceBookId, uint256 unlockPrice, bool isOriginalContent)',
  'function books(bytes32) view returns (address curator, bool isDerivative, bytes32 parentBookId, uint256 totalChapters, bool isActive, string ipfsMetadataHash)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function ADMIN_ROLE() view returns (bytes32)'
]

// Helper to convert string to bytes32
function stringToBytes32(text: string): string {
  const hex = Buffer.from(text, 'utf8').toString('hex')
  // Ensure we only take first 64 characters (32 bytes)
  const truncated = hex.substring(0, 64)
  const padded = truncated.padEnd(64, '0')
  return `0x${padded}`
}

/**
 * POST /api/books/register-hybrid - Direct frontend to use HybridRevenueControllerV2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookId, totalChapters } = body

    if (!bookId || !totalChapters) {
      return NextResponse.json(
        { error: 'bookId and totalChapters are required' },
        { status: 400 }
      )
    }

    // V2 is the only version now - authors must register their own books
    const v2Address = process.env.HYBRID_REVENUE_CONTROLLER_V2_ADDRESS
    
    if (!v2Address || v2Address === '0x...') {
      // V2 not deployed yet
      return NextResponse.json({
        success: false,
        error: 'Revenue controller not deployed yet',
        details: 'HybridRevenueControllerV2 needs to be deployed. Books can still be published without revenue sharing.',
        note: 'Run the deployment script to deploy V2'
      }, { status: 503 })
    }
    
    // Always direct to frontend for V2 registration
    return NextResponse.json({
      success: true,
      useV2: true,
      message: 'Please use the frontend to register your book directly with MetaMask',
      v2Address,
      revenueShare: {
        author: '70%',
        curator: '20%',
        platform: '10%'
      }
    })

  } catch (error) {
    console.error('Error in register-hybrid endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      note: 'Book can still be read, but revenue sharing will not work'
    }, { status: 500 })
  }
}