import { NextRequest, NextResponse } from 'next/server'
import { derivativeRegistrationService } from '../../../lib/services/derivativeRegistrationService'
import { custom } from 'viem'

// Enable BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 API: Auto-derivative registration request received')
    
    const body = await request.json()
    const {
      derivativeContent,
      derivativeType,
      options = {},
      walletClient
    } = body

    // Validate required fields
    if (!derivativeContent || !derivativeType) {
      return NextResponse.json({
        error: 'Missing required fields: derivativeContent, derivativeType'
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

    // Validate and set default options
    const autoOptions = {
      minimumSimilarityThreshold: options.minimumSimilarityThreshold || 0.7,
      maxParentCandidates: Math.min(options.maxParentCandidates || 5, 10), // Cap at 10
      requireManualConfirmation: options.requireManualConfirmation || false
    }

    console.log('🔍 Auto-detection options:', autoOptions)

    try {
      // Initialize service with wallet client if provided
      if (walletClient) {
        console.log('🔗 Initializing derivative service with wallet client')
        const viemWalletClient = custom(walletClient)
        await derivativeRegistrationService.initialize(viemWalletClient)
      }

      // Register derivative with auto-detection
      const result = await derivativeRegistrationService.registerDerivativeWithAutoDetection(
        derivativeContent,
        derivativeType,
        autoOptions
      )

      if (result.success) {
        console.log('✅ Auto-derivative registration successful:', {
          derivativeIpId: result.derivativeIpId,
          transactionHash: result.transactionHash,
          aiSimilarityScore: result.aiSimilarityScore,
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
          autoDetection: {
            parentDetected: result.parentChildRelationship?.parentIpId || null,
            similarityScore: result.aiSimilarityScore,
            confidenceLevel: result.aiSimilarityScore && result.aiSimilarityScore > 0.8 ? 'high' : 
                            result.aiSimilarityScore && result.aiSimilarityScore > 0.6 ? 'medium' : 'low'
          },
          message: result.simulationMode 
            ? 'Derivative auto-registered in simulation mode - configure wallet for blockchain operations'
            : 'Derivative automatically detected and registered on Story Protocol blockchain'
        })
      } else {
        console.error('❌ Auto-derivative registration failed:', result.error)
        
        // Provide specific error guidance for auto-detection failures
        let troubleshooting: Record<string, string> = {}
        
        if (result.error?.includes('No suitable parent')) {
          troubleshooting = {
            'No parent found': `Lower similarity threshold (currently ${autoOptions.minimumSimilarityThreshold})`,
            'Increase search scope': `Increase max candidates (currently ${autoOptions.maxParentCandidates})`,
            'Manual registration': 'Use manual derivative registration with specific parent IP'
          }
        } else if (result.error?.includes('similarity')) {
          troubleshooting = {
            'Similarity threshold': 'Content may be too original - lower threshold or register manually',
            'Content analysis': 'AI analysis may need more training data for this content type',
            'Manual review': 'Consider manual parent selection for edge cases'
          }
        }
        
        return NextResponse.json({
          error: result.error || 'Auto-derivative registration failed',
          autoDetectionFailed: true,
          troubleshooting,
          suggestion: 'Try manual derivative registration with specific parent IP'
        }, { status: 400 })
      }

    } catch (serviceError) {
      console.error('❌ Auto-derivative service error:', serviceError)
      
      let errorMessage = 'Auto-detection service error'
      let statusCode = 500
      
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('AI analysis')) {
          errorMessage = 'AI content analysis failed - check content format and try again'
          statusCode = 400
        } else if (serviceError.message.includes('similarity')) {
          errorMessage = 'Similarity analysis failed - content may be too unique for auto-detection'
          statusCode = 400
        } else {
          errorMessage = serviceError.message
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        autoDetectionFailed: true,
        fallbackOptions: {
          'Manual registration': 'Use /api/derivatives/register with specific parent IP',
          'Lower threshold': 'Reduce minimumSimilarityThreshold and retry',
          'Different content': 'Try with content that has clearer derivative relationships'
        }
      }, { status: statusCode })
    }

  } catch (error) {
    console.error('❌ Auto-derivative API error:', error)
    return NextResponse.json({
      error: 'Failed to process auto-derivative registration request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      service: 'Auto-Derivative Registration',
      description: 'Automatically detect parent content and register derivatives using AI analysis',
      features: [
        'AI-powered parent content detection',
        'Similarity score-based matching',
        'Automatic license inheritance',
        'Quality comparison analysis',
        'Revenue projection calculation'
      ],
      parameters: {
        required: ['derivativeContent', 'derivativeType'],
        optional: [
          'options.minimumSimilarityThreshold (0.1-1.0, default: 0.7)',
          'options.maxParentCandidates (1-10, default: 5)',
          'options.requireManualConfirmation (boolean, default: false)'
        ]
      },
      usage: {
        endpoint: 'POST /api/derivatives/auto-register',
        content_types: ['remix', 'sequel', 'adaptation', 'translation', 'other'],
        similarity_thresholds: {
          'high (0.8+)': 'Strong derivative relationship',
          'medium (0.6-0.8)': 'Moderate derivative relationship',
          'low (0.4-0.6)': 'Weak derivative relationship',
          'below 0.4': 'Auto-detection may fail'
        }
      },
      examples: {
        high_similarity: 'Fan fiction based on existing characters',
        medium_similarity: 'Stories inspired by similar themes',
        low_similarity: 'Content with shared genre elements'
      }
    })

  } catch (error) {
    console.error('❌ GET auto-derivative status error:', error)
    return NextResponse.json({
      error: 'Failed to get auto-derivative service information'
    }, { status: 500 })
  }
}