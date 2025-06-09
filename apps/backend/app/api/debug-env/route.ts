import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment variables
 */
export async function GET(request: NextRequest) {
  try {
    const envVars = {
      R2_ENDPOINT: {
        exists: !!process.env.R2_ENDPOINT,
        length: (process.env.R2_ENDPOINT || '').length,
        first10: (process.env.R2_ENDPOINT || '').substring(0, 10),
        raw: JSON.stringify((process.env.R2_ENDPOINT || '').substring(0, 50))
      },
      R2_ACCESS_KEY_ID: {
        exists: !!process.env.R2_ACCESS_KEY_ID,
        length: (process.env.R2_ACCESS_KEY_ID || '').length,
        first8: (process.env.R2_ACCESS_KEY_ID || '').substring(0, 8),
        raw: JSON.stringify((process.env.R2_ACCESS_KEY_ID || '').substring(0, 20))
      },
      R2_SECRET_ACCESS_KEY: {
        exists: !!process.env.R2_SECRET_ACCESS_KEY,
        length: (process.env.R2_SECRET_ACCESS_KEY || '').length,
        first8: (process.env.R2_SECRET_ACCESS_KEY || '').substring(0, 8),
        raw: JSON.stringify((process.env.R2_SECRET_ACCESS_KEY || '').substring(0, 20))
      },
      R2_BUCKET_NAME: {
        exists: !!process.env.R2_BUCKET_NAME,
        value: process.env.R2_BUCKET_NAME,
        raw: JSON.stringify(process.env.R2_BUCKET_NAME)
      }
    }

    return NextResponse.json({
      success: true,
      envVars,
      // Check for potential encoding issues
      encodingTest: {
        hasCarriageReturn: !!(process.env.R2_ACCESS_KEY_ID || '').includes('\r'),
        hasNewline: !!(process.env.R2_ACCESS_KEY_ID || '').includes('\n'),
        hasTab: !!(process.env.R2_ACCESS_KEY_ID || '').includes('\t'),
        hasQuotes: !!(process.env.R2_ACCESS_KEY_ID || '').includes('"') || !!(process.env.R2_ACCESS_KEY_ID || '').includes("'"),
        nonAsciiChars: (process.env.R2_ACCESS_KEY_ID || '').match(/[^\x00-\x7F]/g)
      }
    })
    
  } catch (error) {
    console.error('❌ Error in debug-env:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}