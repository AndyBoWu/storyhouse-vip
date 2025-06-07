import { NextRequest, NextResponse } from 'next/server'
import { R2Service } from '@/lib/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string; chapterNumber: string } }
) {
  try {
    const { storyId, chapterNumber } = params
    
    // Generate the R2 key for the chapter
    const chapterKey = R2Service.generateChapterKey(storyId, parseInt(chapterNumber))
    
    console.log(`📚 Fetching chapter: ${chapterKey}`)
    
    // Fetch chapter content from R2
    const chapterContent = await R2Service.getContent(chapterKey)
    
    // Parse the JSON content
    const chapterData = JSON.parse(chapterContent)
    
    return NextResponse.json({
      success: true,
      data: chapterData
    })
  } catch (error) {
    console.error('❌ Error fetching chapter:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chapter content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}