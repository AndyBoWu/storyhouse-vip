/**
 * Test PIL Integration Endpoint
 * Demonstrates the new Story Protocol v1.3.2 PIL (Programmable IP License) integration
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Import the enhanced service
    const { AdvancedStoryProtocolService, LICENSE_TIERS } = await import('@storyhouse/shared')
    
    // Test service instantiation
    const service = new AdvancedStoryProtocolService()
    const serviceStatus = service.getServiceStatus()
    
    // Get license tier configurations
    const licenseTiers = service.getLicenseTiers()
    
    // Test license cost calculations
    const freeCosts = service.calculateLicensingCosts('free')
    const premiumCosts = service.calculateLicensingCosts('premium')
    const exclusiveCosts = service.calculateLicensingCosts('exclusive')
    
    const testResults = {
      success: true,
      message: 'PIL Integration Test Successful!',
      data: {
        serviceStatus,
        availableLicenseTiers: Object.keys(licenseTiers),
        licenseTierConfigurations: {
          free: {
            tier: licenseTiers.free,
            costs: freeCosts
          },
          premium: {
            tier: licenseTiers.premium,
            costs: premiumCosts
          },
          exclusive: {
            tier: licenseTiers.exclusive,
            costs: exclusiveCosts
          }
        },
        sdk: {
          version: '1.3.2',
          pilSupport: true,
          features: [
            'registerPILTerms',
            'attachLicenseTerms',
            'mintLicenseTokens',
            'Enhanced metadata support',
            'Royalty policy integration'
          ]
        },
        implementation: {
          phases: {
            'Phase 1': 'Complete - PIL Integration',
            'Phase 2': 'Pending - Royalty Distribution',
            'Phase 3': 'Pending - Derivative System',
            'Phase 4': 'Pending - Group Collections',
            'Phase 5': 'Pending - WIP Token Integration'
          },
          readyForTesting: true
        }
      }
    }

    return NextResponse.json(testResults, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('PIL Integration test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'PIL Integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        commonIssues: [
          'Shared package not built (run: npm run build in packages/shared)',
          'Missing Story Protocol SDK v1.3.2',
          'Import path issues',
          'TypeScript compilation errors'
        ],
        solutions: [
          'Ensure packages/shared is built',
          'Check SDK version in package.json',
          'Verify all exports in packages/shared/src/index.ts',
          'Run type-check on all packages'
        ]
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { licenseTier = 'premium' } = await request.json()
    
    if (!['free', 'premium', 'exclusive'].includes(licenseTier)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid license tier. Must be: free, premium, or exclusive'
      }, { status: 400 })
    }
    
    // Import the enhanced service
    const { AdvancedStoryProtocolService } = await import('@storyhouse/shared')
    const service = new AdvancedStoryProtocolService()
    
    // Get tier configuration
    const tierConfig = service.getLicenseTier(licenseTier)
    const costs = service.calculateLicensingCosts(licenseTier)
    
    if (!tierConfig) {
      return NextResponse.json({
        success: false,
        error: `License tier '${licenseTier}' not found`
      }, { status: 404 })
    }
    
    // Simulate license terms creation (without wallet - for testing)
    const simulationResult = {
      success: true,
      message: `PIL terms simulation for ${licenseTier} tier`,
      data: {
        licenseTier,
        tierConfiguration: tierConfig,
        costs,
        simulatedPILTerms: {
          transferable: tierConfig.transferable,
          commercialUse: tierConfig.commercialUse,
          derivativesAllowed: tierConfig.derivativesAllowed,
          royaltyPercentage: tierConfig.royaltyPercentage,
          defaultMintingFee: tierConfig.defaultMintingFee.toString(),
          tipPrice: tierConfig.tipPrice
        },
        nextSteps: [
          'Connect wallet (MetaMask)',
          'Call useEnhancedStoryProtocol.createLicenseTerms()',
          'Review transaction in Story Protocol explorer',
          'Attach license terms to IP asset'
        ]
      }
    }
    
    return NextResponse.json(simulationResult, { status: 201 })
    
  } catch (error) {
    console.error('PIL creation simulation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'PIL creation simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}