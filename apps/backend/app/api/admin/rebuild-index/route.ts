import { NextRequest, NextResponse } from 'next/server'
import { bookIndexService } from '@/lib/services/bookIndexService'

/**
 * POST /api/admin/rebuild-index - Manually trigger a book index rebuild
 * GET /api/admin/rebuild-index - Check index status
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual index rebuild requested...')
    
    // Optional: Add authentication check here
    // const authHeader = request.headers.get('authorization')
    // if (!authHeader || !isValidAdminToken(authHeader)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const startTime = Date.now()
    
    // Force rebuild the index
    await bookIndexService.updateBookIndex()
    
    const duration = Date.now() - startTime
    
    // Get the updated index info
    const index = await bookIndexService.getBookIndex()
    
    return NextResponse.json({
      success: true,
      message: 'Book index rebuilt successfully',
      stats: {
        duration: `${duration}ms`,
        totalBooks: index?.totalBooks || 0,
        lastUpdated: index?.lastUpdated || null,
        version: index?.version || null
      }
    })
    
  } catch (error) {
    console.error('❌ Error rebuilding book index:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rebuild book index',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/rebuild-index - Check current index status
 */
export async function GET(request: NextRequest) {
  try {
    const index = await bookIndexService.getBookIndex()
    
    if (!index) {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'No book index found. Use POST to create one.'
      })
    }
    
    const isStale = bookIndexService.isIndexStale(index)
    
    return NextResponse.json({
      success: true,
      exists: true,
      isStale,
      stats: {
        totalBooks: index.totalBooks,
        lastUpdated: index.lastUpdated,
        version: index.version,
        age: `${Math.floor((Date.now() - new Date(index.lastUpdated).getTime()) / 1000 / 60)} minutes`
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking book index:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check book index',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}