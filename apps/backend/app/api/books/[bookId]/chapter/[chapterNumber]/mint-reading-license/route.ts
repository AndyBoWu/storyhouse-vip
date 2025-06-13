import { NextRequest, NextResponse } from 'next/server'
import { AdvancedStoryProtocolService } from '@/lib/services/advancedStoryProtocolService'

interface MintReadingLicenseRequest {
  userAddress: string
  chapterIpAssetId: string
  readingLicenseTermsId?: string
}

interface MintReadingLicenseResponse {
  success: boolean
  data?: {
    licenseTokenId: string
    transactionHash: string
    licenseTermsId: string
    mintingFee: string
    chapterIpAssetId: string
  }
  error?: string
}

/**
 * POST /api/books/[bookId]/chapter/[chapterNumber]/mint-reading-license
 * 
 * Mint a non-transferable reading license for a paid chapter
 * This grants permanent reading access locked to the user's wallet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string, chapterNumber: string }> }
) {
  try {
    const { bookId, chapterNumber } = await params
    const body: MintReadingLicenseRequest = await request.json()
    
    console.log('📖 Minting reading license request:', {
      bookId,
      chapterNumber: parseInt(chapterNumber),
      userAddress: body.userAddress,
      chapterIpAssetId: body.chapterIpAssetId
    })

    // Validate input
    const chapterNum = parseInt(chapterNumber)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chapter number'
      } as MintReadingLicenseResponse, { status: 400 })
    }

    if (!body.userAddress || !/^0x[a-fA-F0-9]{40}$/.test(body.userAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user address'
      } as MintReadingLicenseResponse, { status: 400 })
    }

    if (!body.chapterIpAssetId || !/^0x[a-fA-F0-9]{40}$/.test(body.chapterIpAssetId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chapter IP asset ID'
      } as MintReadingLicenseResponse, { status: 400 })
    }

    // Check if this is a paid chapter (chapters 4+)
    const isFree = chapterNum <= 3
    if (isFree) {
      return NextResponse.json({
        success: false,
        error: 'Free chapters do not require reading licenses'
      } as MintReadingLicenseResponse, { status: 400 })
    }

    // Initialize Story Protocol service
    const storyService = new AdvancedStoryProtocolService()
    // TODO: Initialize with proper wallet client
    // For now, we'll simulate the license minting

    console.log('🔗 Creating reading license terms if needed...')
    
    // Step 1: Create reading license terms if not provided
    let licenseTermsId = body.readingLicenseTermsId
    if (!licenseTermsId) {
      const licenseResult = await storyService.createChapterLicenseTerms('reading')
      if (!licenseResult.success) {
        throw new Error(licenseResult.error || 'Failed to create reading license terms')
      }
      licenseTermsId = licenseResult.licenseTermsId!
    }

    console.log('🎫 Minting reading license token...', {
      licenseTermsId,
      chapterIpAssetId: body.chapterIpAssetId,
      recipient: body.userAddress
    })

    // Step 2: Mint license token for the user
    // TODO: Use proper SDK license minting
    // For now, we'll simulate successful minting
    
    const licenseTokenId = `license_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const transactionHash = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`
    const mintingFee = (10 * 10**18).toString() // 10 TIP in wei

    console.log('✅ Reading license minted successfully:', {
      licenseTokenId,
      transactionHash,
      mintingFee
    })

    return NextResponse.json({
      success: true,
      data: {
        licenseTokenId,
        transactionHash,
        licenseTermsId,
        mintingFee,
        chapterIpAssetId: body.chapterIpAssetId
      }
    } as MintReadingLicenseResponse)

  } catch (error) {
    console.error('❌ Reading license minting failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during license minting'
    } as MintReadingLicenseResponse, { status: 500 })
  }
}

/**
 * GET /api/books/[bookId]/chapter/[chapterNumber]/mint-reading-license
 * 
 * Get reading license information and pricing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string, chapterNumber: string }> }
) {
  try {
    const { bookId, chapterNumber } = await params
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    
    const chapterNum = parseInt(chapterNumber)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chapter number'
      }, { status: 400 })
    }

    // Check if this is a paid chapter
    const isFree = chapterNum <= 3
    const mintingFee = isFree ? '0' : (10 * 10**18).toString()
    
    return NextResponse.json({
      success: true,
      data: {
        bookId,
        chapterNumber: chapterNum,
        isFree,
        mintingFee,
        currency: 'TIP',
        transferable: false,
        licenseType: 'reading',
        description: 'Personal reading access - non-transferable'
      }
    })

  } catch (error) {
    console.error('❌ Reading license info failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}