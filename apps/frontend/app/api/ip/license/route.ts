/**
 * @fileoverview IP Licensing API Endpoint
 * Handles creation and management of IP licenses
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  EnhancedApiResponse
} from '@storyhouse/shared'
import type { Hash } from 'viem'

interface CreateLicenseRequest {
  ipAssetId: string
  licenseType: 'standard' | 'premium' | 'exclusive' | 'custom'
  price: number
  royaltyPercentage: number
  terms: {
    commercialUse: boolean
    derivativesAllowed: boolean
    attribution: boolean
    shareAlike: boolean
    exclusivity: boolean
    territories?: string[]
    contentRestrictions?: string[]
  }
  authorAddress: string
}

interface PurchaseLicenseRequest {
  ipAssetId: string
  licenseTermsId: string
  buyerAddress: string
  licenseType: string
}

interface LicenseResponse {
  licenseTokenId: string
  ipAssetId: string
  licenseTermsId: string
  price: bigint
  royaltyPercentage: number
  terms: any
  status: 'active' | 'expired' | 'revoked'
  purchaser?: string
  transactionHash?: string
  blockNumber?: bigint
  createdAt: string
  expiresAt?: string
}

// Create license terms for an IP asset
export async function POST(request: NextRequest) {
  try {
    const body: CreateLicenseRequest = await request.json()

    // Validate required fields
    if (!body.ipAssetId || !body.licenseType || !body.authorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: ipAssetId, licenseType, authorAddress' },
        { status: 400 }
      )
    }

    // Validate pricing
    if (body.price < 0 || body.royaltyPercentage < 0 || body.royaltyPercentage > 100) {
      return NextResponse.json(
        { error: 'Invalid pricing: price must be >= 0, royalty must be 0-100%' },
        { status: 400 }
      )
    }

    // Generate license terms ID
    const licenseTermsId = `license-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log('Creating license terms:', {
      licenseTermsId,
      ipAssetId: body.ipAssetId,
      licenseType: body.licenseType,
      price: body.price,
      royalty: body.royaltyPercentage
    })

    // TODO: Integrate with Story Protocol SDK to create license terms
    const licenseResult = await simulateLicenseCreation(body, licenseTermsId)

    const response: EnhancedApiResponse<LicenseResponse> = {
      success: true,
      data: licenseResult,
      message: 'License terms created successfully',
      ipData: {
        operationId: licenseTermsId,
        transactionHash: licenseResult.transactionHash as Hash,
        ipAssetId: body.ipAssetId,
        gasUsed: BigInt(120000)
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('License creation API error:', error)
    return NextResponse.json(
      { error: 'Failed to create license terms. Please try again.' },
      { status: 500 }
    )
  }
}

// Purchase a license
export async function PUT(request: NextRequest) {
  try {
    const body: PurchaseLicenseRequest = await request.json()

    if (!body.ipAssetId || !body.licenseTermsId || !body.buyerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: ipAssetId, licenseTermsId, buyerAddress' },
        { status: 400 }
      )
    }

    // TODO: Verify license exists and is available
    const licenseExists = await verifyLicenseExists(body.licenseTermsId)
    if (!licenseExists) {
      return NextResponse.json(
        { error: 'License terms not found' },
        { status: 404 }
      )
    }

    // Generate license token ID
    const licenseTokenId = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log('Purchasing license:', {
      licenseTokenId,
      ipAssetId: body.ipAssetId,
      buyer: body.buyerAddress
    })

    // TODO: Integrate with Story Protocol SDK to mint license token
    const purchaseResult = await simulateLicensePurchase(body, licenseTokenId)

    const response: EnhancedApiResponse<LicenseResponse> = {
      success: true,
      data: purchaseResult,
      message: 'License purchased successfully',
      ipData: {
        operationId: licenseTokenId,
        transactionHash: purchaseResult.transactionHash as Hash,
        ipAssetId: body.ipAssetId,
        gasUsed: BigInt(180000)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('License purchase API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          { error: 'Insufficient funds to purchase license' },
          { status: 402 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to purchase license. Please try again.' },
      { status: 500 }
    )
  }
}

// Get license information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ipAssetId = searchParams.get('ipAssetId')
    const licenseTokenId = searchParams.get('licenseTokenId')
    const ownerAddress = searchParams.get('owner')

    if (!ipAssetId && !licenseTokenId) {
      return NextResponse.json(
        { error: 'Either ipAssetId or licenseTokenId is required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual database/blockchain lookup
    const licenses = await getLicenses({
      ipAssetId: ipAssetId || undefined,
      licenseTokenId: licenseTokenId || undefined,
      ownerAddress: ownerAddress || undefined
    })

    return NextResponse.json({
      success: true,
      data: licenses
    })

  } catch (error) {
    console.error('License fetch API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch license information' },
      { status: 500 }
    )
  }
}

// Helper functions
async function simulateLicenseCreation(
  request: CreateLicenseRequest,
  licenseTermsId: string
): Promise<LicenseResponse> {
  // Simulate license creation
  await new Promise(resolve => setTimeout(resolve, 500))

  return {
    licenseTokenId: licenseTermsId,
    ipAssetId: request.ipAssetId,
    licenseTermsId,
    price: BigInt(request.price * 1e18), // Convert to wei
    royaltyPercentage: request.royaltyPercentage,
    terms: request.terms,
    status: 'active',
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 1000000),
    createdAt: new Date().toISOString()
  }
}

async function simulateLicensePurchase(
  request: PurchaseLicenseRequest,
  licenseTokenId: string
): Promise<LicenseResponse> {
  // Simulate license purchase
  await new Promise(resolve => setTimeout(resolve, 800))

  return {
    licenseTokenId,
    ipAssetId: request.ipAssetId,
    licenseTermsId: request.licenseTermsId,
    price: BigInt(100 * 1e18), // Mock price
    royaltyPercentage: 10, // Mock royalty
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false
    },
    status: 'active',
    purchaser: request.buyerAddress,
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 1000000),
    createdAt: new Date().toISOString()
  }
}

async function verifyLicenseExists(licenseTermsId: string): Promise<boolean> {
  // TODO: Implement actual verification
  console.log('Verifying license exists:', licenseTermsId)
  return true // Mock verification
}

async function getLicenses(filters: {
  ipAssetId?: string
  licenseTokenId?: string
  ownerAddress?: string
}): Promise<LicenseResponse[]> {
  // TODO: Implement actual database query
  console.log('Fetching licenses with filters:', filters)

  // Mock license data
  return [
    {
      licenseTokenId: 'token-123',
      ipAssetId: filters.ipAssetId || 'ip-123',
      licenseTermsId: 'license-123',
      price: BigInt(100 * 1e18),
      royaltyPercentage: 10,
      terms: {
        commercialUse: true,
        derivativesAllowed: true,
        attribution: true,
        shareAlike: false,
        exclusivity: false
      },
      status: 'active',
      purchaser: filters.ownerAddress,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: BigInt(1000000),
      createdAt: new Date().toISOString()
    }
  ]
}

// Handle unsupported methods
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create licenses, PUT to purchase.' },
    { status: 405 }
  )
}
