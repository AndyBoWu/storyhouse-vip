import { NextRequest, NextResponse } from 'next/server'
import { R2Service } from '../../../lib/r2'

/**
 * Simple R2 test endpoint to verify upload functionality
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing R2 upload...')
    
    const testKey = `test/debug-${Date.now()}.json`
    const testContent = {
      message: 'R2 upload test',
      timestamp: new Date().toISOString(),
      test: true
    }
    
    console.log('📝 Test content:', testContent)
    console.log('🔑 Test key:', testKey)
    
    const url = await R2Service.uploadContent(
      testKey,
      JSON.stringify(testContent, null, 2),
      {
        contentType: 'application/json',
        metadata: {
          test: 'true',
          timestamp: new Date().toISOString()
        }
      }
    )
    
    console.log('✅ R2 test upload successful:', url)
    
    return NextResponse.json({
      success: true,
      message: 'R2 upload test successful',
      url,
      testKey,
      testContent
    })
    
  } catch (error) {
    console.error('❌ R2 test upload failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'R2 test endpoint - use POST to test upload'
  })
}