import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

// Initialize R2 client (same as in r2.ts)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

export interface StoryFromR2 {
  id: string
  title: string
  genre: string
  chapters: number
  lastUpdated: string
  earnings: number
  preview: string
  contentUrl: string
  transactionHash?: string
  ipAssetId?: string
  tokenId?: string
  publishedAt: string
}

/**
 * GET /api/stories - Fetch all published stories from R2
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📖 Fetching stories from R2...')

    // List all objects in the stories/ prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'stories/',
      Delimiter: '/',
    })

    const listResponse = await r2Client.send(listCommand)

    if (!listResponse.CommonPrefixes) {
      return NextResponse.json({
        success: true,
        stories: [],
        message: 'No stories found'
      })
    }

    const stories: StoryFromR2[] = []

    // Process each story directory
    for (const prefix of listResponse.CommonPrefixes) {
      if (!prefix.Prefix) continue

      // Extract story ID from prefix (stories/{storyId}/)
      const storyId = prefix.Prefix.replace('stories/', '').replace('/', '')

      try {
        // List chapters for this story
        const chaptersCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: `stories/${storyId}/chapters/`,
        })

        const chaptersResponse = await r2Client.send(chaptersCommand)
        const chapterCount = chaptersResponse.KeyCount || 0

        if (chapterCount === 0) continue // Skip stories with no chapters

        // Fetch the first chapter to get story info
        const firstChapterKey = `stories/${storyId}/chapters/1.json`

        try {
          const chapterResponse = await fetch(`${PUBLIC_URL}/${firstChapterKey}`)
          if (!chapterResponse.ok) continue

          const chapterData = await chapterResponse.json()

          // Extract preview from content (first 100 characters)
          const content = chapterData.content || ''
          const preview = content.length > 100
            ? content.substring(0, 100).trim() + '...'
            : content

          // Determine genre from themes
          const themes = chapterData.themes || []
          let genre = 'Fiction'
          if (themes.includes('mystery') || themes.includes('detective')) genre = 'Mystery'
          else if (themes.includes('science fiction') || themes.includes('sci-fi')) genre = 'Sci-Fi'
          else if (themes.includes('fantasy') || themes.includes('magic')) genre = 'Fantasy'
          else if (themes.includes('romance')) genre = 'Romance'
          else if (themes.includes('horror')) genre = 'Horror'
          else if (themes.includes('adventure')) genre = 'Adventure'

          // Calculate last updated (use the newest chapter)
          const generatedAt = chapterData.metadata?.generatedAt
          const lastUpdated = generatedAt
            ? getRelativeTime(new Date(generatedAt))
            : 'recently'

          const story: StoryFromR2 = {
            id: storyId,
            title: chapterData.title || 'Untitled Story',
            genre,
            chapters: chapterCount,
            lastUpdated,
            earnings: 0, // TODO: Calculate from blockchain data
            preview,
            contentUrl: `${PUBLIC_URL}/${firstChapterKey}`,
            publishedAt: generatedAt || new Date().toISOString()
          }

          stories.push(story)

        } catch (chapterError) {
          console.warn(`Failed to fetch chapter data for story ${storyId}:`, chapterError)
          continue
        }

      } catch (error) {
        console.warn(`Failed to process story ${storyId}:`, error)
        continue
      }
    }

    // Sort by most recent first
    stories.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    console.log(`✅ Found ${stories.length} stories in R2`)

    return NextResponse.json({
      success: true,
      stories,
      count: stories.length
    })

  } catch (error) {
    console.error('Error fetching stories from R2:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stories from R2',
        stories: []
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to calculate relative time
 */
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}
