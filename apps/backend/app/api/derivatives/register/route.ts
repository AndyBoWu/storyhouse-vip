import { NextRequest, NextResponse } from 'next/server'
import { derivativeRegistrationService } from '../../../../lib/services/derivativeRegistrationService'
import { custom } from 'viem'
import type { DerivativeRegistrationData } from '../../../../lib/services/derivativeRegistrationService'

// Enable BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }

export async function POST(request: NextRequest) {
  try {
    console.log('📝 API: Derivative registration request received')
    
    const body = await request.json()
    const {
      parentIpId,
      parentChapterId,
      derivativeContent,
      derivativeType,
      inheritParentLicense = true,
      customLicenseTermsId,
      attributionText,
      creatorNotes,
      walletClient
    } = body

    // Validate required fields
    if (!parentIpId || !parentChapterId || !derivativeContent || !derivativeType) {
      return NextResponse.json({
        error: 'Missing required fields: parentIpId, parentChapterId, derivativeContent, derivativeType'
      }, { status: 400 })
    }

    // Validate derivative type
    const validTypes = ['remix', 'sequel', 'adaptation', 'translation', 'other']
    if (!validTypes.includes(derivativeType)) {
      return NextResponse.json({
        error: `Invalid derivative type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate derivativeContent structure
    if (!derivativeContent.title || !derivativeContent.chapterNumber || !derivativeContent.metadata) {
      return NextResponse.json({
        error: 'Invalid derivativeContent structure. Missing title, chapterNumber, or metadata'
      }, { status: 400 })
    }

    try {
      // Initialize service with wallet client if provided
      if (walletClient) {
        console.log('🔗 Initializing derivative service with wallet client')
        const viemWalletClient = custom(walletClient)
        await derivativeRegistrationService.initialize(viemWalletClient)
      }

      // Prepare registration data
      const registrationData: DerivativeRegistrationData = {
        parentIpId,
        parentChapterId,
        parentLicenseTermsId: body.parentLicenseTermsId,
        derivativeContent,
        derivativeType,
        similarityScore: body.similarityScore,
        aiAnalysisId: body.aiAnalysisId,
        influenceFactors: body.influenceFactors,
        inheritParentLicense,
        customLicenseTermsId,
        attributionText: attributionText || `Derivative work based on original content`,
        creatorNotes
      }

      console.log('📋 Registration data prepared:', {
        parentIpId,
        derivativeType,
        inheritParentLicense,
        title: derivativeContent.title
      })

      // Register the derivative
      const result = await derivativeRegistrationService.registerDerivative(registrationData)

      if (result.success) {
        console.log('✅ Derivative registration successful:', {
          derivativeIpId: result.derivativeIpId,
          transactionHash: result.transactionHash,
          simulationMode: result.simulationMode
        })

        return NextResponse.json({
          success: true,
          derivativeIpId: result.derivativeIpId,
          transactionHash: result.transactionHash,
          parentChildRelationship: result.parentChildRelationship,
          aiSimilarityScore: result.aiSimilarityScore,
          qualityComparison: result.qualityComparison,
          revenueProjection: result.revenueProjection,
          simulationMode: result.simulationMode,
          registrationTime: result.registrationTime,
          message: result.simulationMode 
            ? 'Derivative registered in simulation mode - configure wallet for blockchain operations'
            : 'Derivative successfully registered on Story Protocol blockchain'
        })
      } else {
        console.error('❌ Derivative registration failed:', result.error)
        return NextResponse.json({
          error: result.error || 'Derivative registration failed'
        }, { status: 500 })
      }

    } catch (serviceError) {
      console.error('❌ Derivative service error:', serviceError)
      
      // Enhanced error handling with specific guidance
      let errorMessage = 'Internal service error'
      let statusCode = 500
      
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not initialized')) {
          errorMessage = 'Wallet client not properly configured - initialize service first'
          statusCode = 400
        } else if (serviceError.message.includes('validation failed')) {
          errorMessage = 'Parent IP validation failed - check parent IP ID and permissions'
          statusCode = 400
        } else if (serviceError.message.includes('license')) {
          errorMessage = 'License creation or inheritance failed - check license configuration'
          statusCode = 400
        } else {
          errorMessage = serviceError.message
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        troubleshooting: {
          'Wallet not configured': 'Initialize derivative service with valid wallet client',
          'Parent IP not found': 'Verify parent IP ID exists and is registered',
          'License issues': 'Check parent license allows derivatives or provide custom license',
          'Network issues': 'Verify connection to Story Protocol Aeneid testnet'
        }
      }, { status: statusCode })
    }

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({
      error: 'Failed to process derivative registration request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return service status and capabilities
    const status = derivativeRegistrationService.getServiceStatus()
    
    return NextResponse.json({
      service: 'Story Protocol Derivative Registration',
      status: status.initialized ? 'operational' : 'not initialized',
      capabilities: status.derivativeFeatures,
      sdkVersion: status.sdkVersion,
      connectedWallet: status.connectedWallet,
      endpoints: {
        'POST /api/derivatives/register': 'Register a new derivative work',
        'POST /api/derivatives/auto-register': 'Auto-detect and register derivative',
        'GET /api/derivatives/tree/[ipId]': 'Query derivative family tree',
        'GET /api/derivatives/license-inheritance/[parentIpId]': 'Analyze license inheritance options',
        'POST /api/derivatives/bulk-register': 'Bulk register multiple derivatives'
      },
      documentation: {
        required_fields: ['parentIpId', 'parentChapterId', 'derivativeContent', 'derivativeType'],
        derivative_types: ['remix', 'sequel', 'adaptation', 'translation', 'other'],
        license_options: ['inherit', 'custom', 'auto-suggest']
      }
    })

  } catch (error) {
    console.error('❌ GET status error:', error)
    return NextResponse.json({
      error: 'Failed to get service status'
    }, { status: 500 })
  }
}