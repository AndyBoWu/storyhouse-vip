/**
 * @fileoverview IP Asset Registration API Endpoint
 * Handles registration of stories as IP assets on Story Protocol
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  EnhancedApiResponse,
  RegisterIPAssetResponse,
  IPOperation
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

export async function POST(request: NextRequest) {
  try {
    const body: IPRegistrationRequest = await request.json()

    // Validate required fields
    if (!body.storyId || !body.storyTitle || !body.storyContent || !body.authorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: storyId, storyTitle, storyContent, authorAddress' },
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    if (!isValidEthereumAddress(body.authorAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      )
    }

    // Validate license type
    const validLicenseTypes = ['standard', 'premium', 'exclusive', 'custom']
    if (!validLicenseTypes.includes(body.licenseType)) {
      return NextResponse.json(
        { error: 'Invalid license type. Must be one of: standard, premium, exclusive, custom' },
        { status: 400 }
      )
    }

    // For custom licenses, validate custom license terms
    if (body.licenseType === 'custom' && !body.customLicense) {
      return NextResponse.json(
        { error: 'Custom license terms required for custom license type' },
        { status: 400 }
      )
    }

    // Generate operation ID for tracking
    const operationId = `ip-reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create IP operation record
    const ipOperation: IPOperation = {
      id: operationId,
      storyId: body.storyId,
      operationType: 'register',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAssetId: undefined,
      licenseTokenId: undefined,
      parentIpAssetId: undefined,
      royaltyAmount: undefined,
      collectionId: undefined
    }

    console.log('IP Registration Request:', {
      operationId,
      storyId: body.storyId,
      authorAddress: body.authorAddress,
      licenseType: body.licenseType
    })

    // TODO: Integrate with actual Story Protocol SDK
    // For now, simulate the registration process
    const mockRegistrationResult = await simulateIPRegistration(body, operationId)

    // Prepare response
    const response: EnhancedApiResponse<RegisterIPAssetResponse> = {
      success: true,
      data: mockRegistrationResult,
      message: 'IP asset registration initiated successfully',
      ipData: {
        operationId,
        transactionHash: mockRegistrationResult.transactionHash,
        ipAssetId: mockRegistrationResult.ipAssetId,
        gasUsed: mockRegistrationResult.gasUsed
      }
    }

    // Store IP operation in database (TODO: implement actual database storage)
    await storeIPOperation(ipOperation)

    return NextResponse.json(response, { status: 202 }) // 202 Accepted for async operation

  } catch (error) {
    console.error('IP Registration API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          { error: 'Insufficient funds for IP registration. Please check your wallet balance.' },
          { status: 402 }
        )
      }

      if (error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Network error. Please check your connection and try again.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to initiate IP asset registration. Please try again.' },
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
        { error: 'Either operationId or storyId is required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual database lookup
    const ipOperation = await getIPOperation(operationId || storyId)

    if (!ipOperation) {
      return NextResponse.json(
        { error: 'IP operation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: ipOperation
    })

  } catch (error) {
    console.error('IP Status API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IP operation status' },
      { status: 500 }
    )
  }
}

// Helper functions
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

async function simulateIPRegistration(
  request: IPRegistrationRequest,
  operationId: string
): Promise<RegisterIPAssetResponse> {
  // Simulate async registration process
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Get license tier pricing
  const licensePricing = {
    standard: { price: 100, royalty: 5 },
    premium: { price: 500, royalty: 10 },
    exclusive: { price: 2000, royalty: 20 },
    custom: {
      price: request.customLicense?.price || 100,
      royalty: request.customLicense?.royaltyPercentage || 5
    }
  }

  const tier = licensePricing[request.licenseType]

  // Generate mock blockchain data
  const mockResponse: RegisterIPAssetResponse = {
    success: true,
    ipAssetId: `0x${Math.random().toString(16).substr(2, 40)}`,
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}` as any,
    licenseTermsId: `license-${operationId}`,
    registrationCost: BigInt(tier.price * 1e18), // Convert to wei
    estimatedGas: BigInt(150000),
    gasUsed: BigInt(142350),
    blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 1000000),
    licenseTier: {
      name: request.licenseType,
      displayName: `${request.licenseType.charAt(0).toUpperCase() + request.licenseType.slice(1)} License`,
      price: BigInt(tier.price * 1e18),
      royaltyPercentage: tier.royalty,
      terms: {
        commercialUse: request.commercialRights,
        derivativesAllowed: request.derivativeRights,
        attribution: true,
        shareAlike: false,
        exclusivity: request.licenseType === 'exclusive'
      }
    }
  }

  return mockResponse
}

async function storeIPOperation(operation: IPOperation): Promise<void> {
  // TODO: Implement actual database storage
  console.log('Storing IP operation:', operation.id)

  // For now, store in memory or mock database
  // In production, this would save to your database
}

async function getIPOperation(identifier: string): Promise<IPOperation | null> {
  // TODO: Implement actual database lookup
  console.log('Fetching IP operation:', identifier)

  // Mock response for demo
  return {
    id: identifier,
    storyId: 'mock-story-id',
    operationType: 'register',
    status: 'success',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ipAssetId: `0x${Math.random().toString(16).substr(2, 40)}`,
    licenseTokenId: undefined,
    parentIpAssetId: undefined,
    royaltyAmount: undefined,
    collectionId: undefined
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
