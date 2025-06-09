import { NextRequest, NextResponse } from 'next/server'
import { R2Service } from '@/lib/r2'

interface SaveStoryRequest {
  storyId: string
  chapterNumber: number
  content: string
  title: string
  themes: string[]
  wordCount: number
  readingTime: number
  metadata: any
  // Blockchain registration proof
  ipAssetId: string
  transactionHash: string
  walletAddress: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveStoryRequest = await request.json()

    // Validate required fields
    if (!body.ipAssetId || !body.transactionHash || !body.walletAddress) {
      return NextResponse.json(
        { error: 'Blockchain registration proof required (ipAssetId, transactionHash, walletAddress)' },
        { status: 400 }
      )
    }

    if (!body.storyId || !body.content || !body.title) {
      return NextResponse.json(
        { error: 'Missing required story data' },
        { status: 400 }
      )
    }

    // Prepare chapter data with blockchain registration info
    const chapterData = {
      storyId: body.storyId,
      chapterNumber: body.chapterNumber,
      content: body.content,
      title: body.title,
      themes: body.themes,
      wordCount: body.wordCount,
      readingTime: body.readingTime,
      // Add blockchain registration proof
      blockchain: {
        ipAssetId: body.ipAssetId,
        transactionHash: body.transactionHash,
        walletAddress: body.walletAddress.toLowerCase(),
        registeredAt: new Date().toISOString()
      },
      metadata: {
        ...body.metadata,
        // Update status to published after blockchain registration
        status: 'published',
        visibility: 'public',
        publishedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        // Initialize engagement metrics
        totalReads: 0,
        totalEarned: 0,
        totalRevenue: 0,
        averageRating: 0,
        remixCount: 0,
        streakBonus: 0,
      }
    }

    // Now save to R2 storage
    const contentUrl = await R2Service.uploadContent(
      R2Service.generateChapterKey(body.storyId, body.chapterNumber),
      JSON.stringify(chapterData),
      {
        contentType: 'application/json',
        metadata: {
          storyId: body.storyId,
          chapterNumber: body.chapterNumber.toString(),
          contentType: 'chapter',
          // Blockchain proof
          ipAssetId: body.ipAssetId,
          transactionHash: body.transactionHash,
          walletAddress: body.walletAddress.toLowerCase(),
          // Author info
          authorAddress: body.metadata.authorAddress?.toLowerCase() || body.walletAddress.toLowerCase(),
          authorName: body.metadata.authorName || '',
          // Business Critical Fields
          contentRating: body.metadata.contentRating || 'PG',
          genre: (body.metadata.genre || []).join(','),
          unlockPrice: body.metadata.unlockPrice?.toString() || '0.1',
          readReward: body.metadata.readReward?.toString() || '0.05',
          licensePrice: body.metadata.licensePrice?.toString() || '100',
          isRemixable: 'true',
          status: 'published',
          visibility: 'public',
          publishedAt: new Date().toISOString(),
        }
      }
    )

    console.log(`✅ Chapter ${body.chapterNumber} saved to R2 after blockchain registration:`, contentUrl)
    console.log(`🔗 IP Asset ID: ${body.ipAssetId}`)
    console.log(`📝 Transaction: ${body.transactionHash}`)

    return NextResponse.json({
      success: true,
      data: {
        contentUrl,
        storyId: body.storyId,
        chapterNumber: body.chapterNumber,
        ipAssetId: body.ipAssetId,
        transactionHash: body.transactionHash
      },
      message: 'Story successfully saved to storage after blockchain registration'
    })

  } catch (error) {
    console.error('Failed to save story after blockchain registration:', error)
    return NextResponse.json(
      { error: 'Failed to save story. Please try again.' },
      { status: 500 }
    )
  }
}

// Only POST is allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to save stories.' },
    { status: 405 }
  )
}