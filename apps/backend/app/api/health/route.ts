import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend API is running'
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}