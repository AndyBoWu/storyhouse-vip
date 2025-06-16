import { NextRequest, NextResponse } from 'next/server'

/**
 * Frontend version information endpoint
 * Returns deployment details and build info for the frontend
 */
export async function GET(request: NextRequest) {
  try {
    // Get deployment info from environment
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

    // Smart contract configuration
    const contractConfig = {
      network: 'Story Protocol Aeneid Testnet',
      chainId: 1315,
      spgNftContract: process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT || '0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d',
      testnetEnabled: process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true'
    }

    // Feature flags (frontend)
    const features = {
      testnetMode: process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true',
      spgContractConfigured: !!process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'
    }

    // Package version info
    const packageInfo = {
      nextjs: '15.3.3',
      react: '18.2.0',
      typescript: '5.8.3',
      tailwindcss: '3.4.17',
      viem: '2.30.6',
      wagmi: '2.12.17',
      framerMotion: '10.16.0'
    }

    return NextResponse.json({
      success: true,
      service: 'StoryHouse.vip Frontend',
      deployment: deploymentInfo,
      contracts: contractConfig,
      features,
      packages: packageInfo,
      timestamp: new Date().toISOString(),
      phase: 'Phase 6.0 Complete - 5-Contract Architecture Deployed'
    })
    
  } catch (error) {
    console.error('❌ Error in frontend version endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'StoryHouse.vip Frontend',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}