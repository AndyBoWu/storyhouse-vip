import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Backend API is working!',
    environment: {
      hasR2BucketName: !!process.env.R2_BUCKET_NAME,
      hasR2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasR2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasR2Endpoint: !!process.env.R2_ENDPOINT,
      nodeEnv: process.env.NODE_ENV,
    }
  })
}