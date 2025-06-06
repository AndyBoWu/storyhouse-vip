import { NextRequest, NextResponse } from 'next/server'
import { StoryProtocolService, type ChapterIPData } from '@/lib/storyProtocol'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, chapterData } = body

    // Check if Story Protocol is configured
    if (!StoryProtocolService.isConfigured()) {
      const configStatus = StoryProtocolService.getConfigStatus()
      console.warn('⚠️ Story Protocol not fully configured:', configStatus)

      return NextResponse.json({
        success: false,
        error: 'Story Protocol not configured',
        configStatus
      }, { status: 400 })
    }

    switch (action) {
      case 'register':
        if (!chapterData) {
          return NextResponse.json({
            success: false,
            error: 'Chapter data is required for registration'
          }, { status: 400 })
        }

        console.log('📝 Registering chapter as IP asset:', chapterData.title)
        const result = await StoryProtocolService.registerChapterAsIP(chapterData as ChapterIPData)

        return NextResponse.json(result)

      case 'test':
        console.log('🔧 Testing Story Protocol connection...')
        const testResult = await StoryProtocolService.testConnection()

        return NextResponse.json(testResult)

      case 'config':
        const configStatus = StoryProtocolService.getConfigStatus()

        return NextResponse.json({
          success: true,
          isConfigured: StoryProtocolService.isConfigured(),
          ...configStatus
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: register, test, or config'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Story Protocol API error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
