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
import { parseBlockchainError } from '@shared/utils/blockchainErrors'

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
    const ipService = createIPService()

    // Check if service is available
    if (!ipService.isAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story Protocol blockchain not available. Please check configuration.'
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

    // **REAL BLOCKCHAIN INTEGRATION** - Replace mock with actual calls
    try {
      // Register the story as an IP Asset on Story Protocol
      const registrationResult = await ipService.registerStoryAsIPAsset(
        story,
        '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as Address, // Public SPG contract
        '1',
        body.authorAddress as Address
      )

      if (!registrationResult.success) {
        return NextResponse.json({
          success: false,
          error: registrationResult.error || 'IP Asset registration failed'
        }, { status: 400 })
      }

      // Create license terms for the specified tier
      const defaultLicenseTiers = ipService.getDefaultLicenseTiers()
      const selectedTier = defaultLicenseTiers[body.licenseType] || defaultLicenseTiers.standard

      const licenseResult = await ipService.createLicenseTermsForTier(
        selectedTier,
        '0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E' as Address, // RoyaltyPolicyLAP
        body.authorAddress as Address
      )

      if (!licenseResult.success) {
        console.warn('⚠️ License creation failed, IP registered without license:', licenseResult.error)
      }

      // Attach license to IP Asset if license creation succeeded
      let licenseAttachResult = null
      if (licenseResult.success && licenseResult.licenseTerms) {
        licenseAttachResult = await ipService.attachLicenseToIPAsset(
          registrationResult.ipAsset!.id,
          licenseResult.licenseTerms.id,
          body.authorAddress as Address
        )
      }

      return NextResponse.json({
        success: true,
        ipAsset: registrationResult.ipAsset,
        licenseTerms: licenseResult.licenseTerms,
        transactionHashes: {
          ipRegistration: registrationResult.transactionHash,
          licenseCreation: licenseResult.transactionHash,
          licenseAttachment: licenseAttachResult?.transactionHash
        },
        blockchainStatus: {
          connected: true,
          network: ipService.getConfig().network || 'aeneid'
        }
      })

    } catch (error: any) {
      const blockchainError = parseBlockchainError(error)
      console.error('❌ Blockchain operation failed:', blockchainError)

      return NextResponse.json({
        success: false,
        error: blockchainError.userMessage,
        blockchainStatus: {
          connected: false,
          error: blockchainError.type
        }
      }, { status: 500 })
    }

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
