/**
 * @fileoverview IP Asset Registration API Endpoint
 * Handles registration of stories as IP assets on Story Protocol
 */

import { NextRequest, NextResponse } from 'next/server'
import { createIPService, defaultStoryProtocolConfig } from '@storyhouse/shared'
import type {
  EnhancedApiResponse,
  StoryWithIP
} from '@storyhouse/shared'

interface IPRegistrationRequest {
  storyId: string
  storyTitle: string
  storyContent: string
  authorAddress: string
  licenseType: 'standard' | 'premium' | 'exclusive' | 'custom'
  commercialRights: boolean
  derivativeRights: boolean
  customLicense?: {
    price: number
    royaltyPercentage: number
    terms: {
      commercialUse: boolean
      derivativesAllowed: boolean
      attribution: boolean
      shareAlike: boolean
      exclusivity: boolean
      territories: string[]
      contentRestrictions: string[]
    }
  }
}

// Create new IP asset registration
export async function POST(request: NextRequest) {
  try {
    const body: IPRegistrationRequest = await request.json()

    // Validate required fields
    if (!body.storyId || !body.storyTitle || !body.storyContent || !body.authorAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: storyId, storyTitle, storyContent, authorAddress'
        },
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.authorAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format'
        },
        { status: 400 }
      )
    }

    // Initialize Story Protocol service
    const ipService = createIPService(defaultStoryProtocolConfig)

    // Check if service is available
    if (!ipService.isAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story Protocol service not available'
        },
        { status: 503 }
      )
    }

    // Create story object for IP registration
    const story: StoryWithIP = {
      id: body.storyId,
      title: body.storyTitle,
      content: body.storyContent,
      author: body.authorAddress,
      genre: 'unknown', // Could be extracted from request
      mood: 'neutral',  // Could be extracted from request
      emoji: '📚',     // Default emoji
      createdAt: new Date().toISOString(),

      // IP-specific fields
      ipRegistrationStatus: 'pending',
      licenseStatus: 'none',
      availableLicenseTypes: [],
      isDerivative: false
    }

    // Mock NFT contract and token ID for now
    // In production, this would come from your actual NFT minting process
    const nftContract = '0x1234567890123456789012345678901234567890' as `0x${string}`
    const tokenId = `${Date.now()}` // Simple token ID generation

    // Register the story as an IP Asset
    const registrationResult = await ipService.registerStoryAsIPAsset(
      story,
      nftContract,
      tokenId,
      body.authorAddress as `0x${string}`
    )

    if (!registrationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: registrationResult.error || 'IP registration failed'
        },
        { status: 500 }
      )
    }

    // Create license terms if registration succeeded
    let licenseTermsResult = null
    if (registrationResult.success && registrationResult.ipAsset) {
      const defaultTiers = ipService.getDefaultLicenseTiers()
      const selectedTier = defaultTiers[body.licenseType] || defaultTiers.standard

      const royaltyPolicyAddress = '0x0000000000000000000000000000000000000000' as `0x${string}` // Mock address

      licenseTermsResult = await ipService.createLicenseTermsForTier(
        selectedTier,
        royaltyPolicyAddress,
        body.authorAddress as `0x${string}`
      )
    }

    // Prepare response
    const response: EnhancedApiResponse<any> = {
      success: true,
      data: {
        ipAssetId: registrationResult.ipAsset?.id,
        transactionHash: registrationResult.transactionHash,
        licenseTermsId: licenseTermsResult?.licenseTerms?.id,
        registrationCost: BigInt('1000000000000000000'), // 1 ETH mock cost
        estimatedGas: BigInt('250000'),
        gasUsed: BigInt('200000'),
        blockNumber: BigInt('12345678'),
        licenseTier: {
          name: body.licenseType,
          displayName: body.licenseType.charAt(0).toUpperCase() + body.licenseType.slice(1) + ' License',
          price: BigInt('100000000000000000000'), // Mock price
          royaltyPercentage: body.customLicense?.royaltyPercentage || 5,
          terms: {
            commercialUse: body.commercialRights,
            derivativesAllowed: body.derivativeRights,
            attribution: true,
            shareAlike: false,
            exclusivity: body.licenseType === 'exclusive'
          }
        }
      },
      message: 'IP asset registration initiated successfully',
      ipData: {
        operationId: `reg_${Date.now()}_${body.storyId}`,
        transactionHash: registrationResult.transactionHash,
        ipAssetId: registrationResult.ipAsset?.id,
        gasUsed: BigInt('200000')
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error: any) {
    console.error('IP registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during IP registration'
      },
      { status: 500 }
    )
  }
}

// Get IP registration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operationId = searchParams.get('operationId')
    const storyId = searchParams.get('storyId')

    if (!operationId && !storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either operationId or storyId is required'
        },
        { status: 400 }
      )
    }

    // Mock IP operation status for now
    // In production, this would query your database or Story Protocol
    const mockOperation = {
      id: operationId || `reg_${Date.now()}_${storyId}`,
      storyId: storyId || 'unknown',
      operationType: 'register' as const,
      status: 'success' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAssetId: `ip_${storyId}_${Date.now()}`,
      licenseTokenId: undefined,
      parentIpAssetId: undefined,
      royaltyAmount: undefined,
      collectionId: undefined
    }

    return NextResponse.json({
      success: true,
      data: mockOperation
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error getting IP registration status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to register IP assets.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to register IP assets.' },
    { status: 405 }
  )
}
