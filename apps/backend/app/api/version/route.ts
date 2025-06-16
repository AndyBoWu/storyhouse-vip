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
      appVersion: '6.0.0', // Phase 6.0 - 5-Contract Architecture
      architecture: '5-contract-optimized'
    }

    // Smart contract addresses (5-contract architecture)
    const contractAddresses = {
      network: 'Story Protocol Aeneid Testnet',
      chainId: 1315,
      contracts: {
        tipToken: '0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E',
        rewardsManager: '0xf5aE031bA92295C2aE86a99e88f09989339707E5',
        unifiedRewardsController: '0x741105d6ee9b25567205f57c0e4f1d293f0d00c5',
        chapterAccessController: '0x1bd65ad10b1ca3ed67ae75fcdd3aba256a9918e3',
        hybridRevenueController: '0xd1f7e8c6fd77dadbe946ae3e4141189b39ef7b08',
        spgNftContract: '0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d'
      },
      deploymentDate: '2025-06-16',
      testCoverage: '97.3%',
      totalTests: 182
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
      phase: 'Phase 6.0 Complete - 5-Contract Architecture Deployed'
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