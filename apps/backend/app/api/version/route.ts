import { NextRequest, NextResponse } from 'next/server'

/**
 * Version information endpoint
 * Returns deployment details, contract addresses, and build info
 */
export async function GET(request: NextRequest) {
  try {
    // Get deployment info from environment or build time
    const deploymentInfo = {
      // Git information
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || 'unknown',
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || 'main',
      gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'No commit message',
      
      // Vercel deployment info
      vercelUrl: process.env.VERCEL_URL || 'localhost',
      vercelEnv: process.env.VERCEL_ENV || 'development',
      vercelRegion: process.env.VERCEL_REGION || 'local',
      
      // Build time
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      nodeVersion: process.version,
      
      // Environment
      nodeEnv: process.env.NODE_ENV || 'development',
      
      // Application version
      appVersion: '6.3.0', // Phase 6.3 - 2-Contract Architecture
      architecture: '2-contract-minimal'
    }

    // Smart contract addresses (2-contract architecture)
    const contractAddresses = {
      network: 'Story Protocol Aeneid Testnet',
      chainId: 1315,
      contracts: {
        tipToken: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
        hybridRevenueControllerV2: '0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6', // Includes all functionality
        spgNftContract: '0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d'
      },
      deploymentDate: '2025-06-29',
      architecture: '2-contract-minimal',
      notes: 'HybridRevenueControllerV2 includes book registration, chapter unlocking, and revenue distribution'
    }

    // Feature flags
    const features = {
      unifiedRegistrationEnabled: process.env.UNIFIED_REGISTRATION_ENABLED === 'true',
      testnetMode: process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true',
      r2StorageConfigured: !!(process.env.R2_BUCKET_NAME && process.env.R2_ACCESS_KEY_ID),
      openaiConfigured: !!process.env.OPENAI_API_KEY
    }

    // Package version info
    const packageInfo = {
      nextjs: '15.3.3',
      typescript: '5.8.3',
      storyProtocolSdk: '1.3.2',
      viem: '2.30.6',
      wagmi: '2.12.17'
    }

    return NextResponse.json({
      success: true,
      service: 'StoryHouse.vip Backend API',
      deployment: deploymentInfo,
      contracts: contractAddresses,
      features,
      packages: packageInfo,
      timestamp: new Date().toISOString(),
      phase: 'Phase 6.3 Complete - 2-Contract Architecture with Unified Registration'
    })
    
  } catch (error) {
    console.error('❌ Error in version endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'StoryHouse.vip Backend API',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}