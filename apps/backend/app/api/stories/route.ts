import { NextRequest, NextResponse } from 'next/server'

// Import R2Service from our improved lib - this has the proven authentication fix
import { R2Service } from '../../../lib/r2'

const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim().replace(/[\r\n]/g, '')

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
  authorAddress?: string
  authorName?: string
  // Enhanced metadata
  contentRating?: string
  unlockPrice?: number
  readReward?: number
  licensePrice?: number
  isRemixable?: boolean
  totalReads?: number
  averageRating?: number
  wordCount?: number
  readingTime?: number
  mood?: string
  tags?: string[]
  qualityScore?: number
  originalityScore?: number
  isRemix?: boolean
  generationMethod?: string
}

/**
 * GET /api/stories - Fetch all published stories from R2
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📖 Fetching stories from R2 using R2Service...')
    console.log('🔧 R2 Configuration:')
    console.log('   PUBLIC_URL:', PUBLIC_URL)

    console.log('🔍 Listing objects with prefix "stories/"...')

    let listResponse
    try {
      // Use R2Service which has the proven authentication fix
      listResponse = await R2Service.listObjects('stories/', '/')
      console.log('✅ R2 connection successful')
      console.log('📊 Response:', {
        KeyCount: listResponse.KeyCount,
        CommonPrefixesCount: listResponse.CommonPrefixes?.length || 0,
        IsTruncated: listResponse.IsTruncated
      })
    } catch (r2Error) {
      console.error('❌ R2 connection failed:', r2Error)
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to R2 storage',
        details: r2Error instanceof Error ? r2Error.message : 'Unknown R2 error',
        stories: []
      }, { status: 500 })
    }

    if (!listResponse.CommonPrefixes || listResponse.CommonPrefixes.length === 0) {
      console.log('📂 No story directories found in R2')
      console.log('🔍 Let me check for individual files...')

      // Also try listing all objects without delimiter to see what's actually there
      try {
        const allObjectsResponse = await R2Service.listObjects('stories/', undefined, 100)
        console.log('📋 All objects in stories/ prefix:')
        allObjectsResponse.Contents?.forEach(obj => {
          console.log(`   - ${obj.Key} (${obj.Size} bytes, ${obj.LastModified})`)
        })

        if (!allObjectsResponse.Contents || allObjectsResponse.Contents.length === 0) {
          return NextResponse.json({
            success: true,
            stories: [],
            message: 'No stories found in R2 storage - the stories/ directory is empty',
            debug: {
              prefix: 'stories/',
              objectCount: 0
            }
          })
        }
      } catch (debugError) {
        console.warn('Failed to list all objects for debugging:', debugError)
      }

      return NextResponse.json({
        success: true,
        stories: [],
        message: 'No story directories found in R2',
        debug: {
          prefix: 'stories/',
          commonPrefixes: 0
        }
      })
    }

    console.log(`📁 Found ${listResponse.CommonPrefixes.length} story directories`)
    const stories: StoryFromR2[] = []

    // Sort story directories by timestamp (newest first) and increase limit
    const sortedPrefixes = listResponse.CommonPrefixes.sort((a, b) => {
      const timestampA = a.Prefix?.match(/(\d{13})/)?.[1] || '0'
      const timestampB = b.Prefix?.match(/(\d{13})/)?.[1] || '0'
      return parseInt(timestampB) - parseInt(timestampA)
    })

    // Process each story directory (increased limit for better coverage)
    const maxStoriesToProcess = 50
    const prefixesToProcess = sortedPrefixes.slice(0, maxStoriesToProcess)
    
    for (let index = 0; index < prefixesToProcess.length; index++) {
      const prefix = prefixesToProcess[index]
      if (!prefix.Prefix) continue

      // Extract story ID from prefix (stories/{storyId}/)
      const storyId = prefix.Prefix.replace('stories/', '').replace('/', '')
      console.log(`📖 Processing story ${index + 1}/${prefixesToProcess.length}: ${storyId}`)

      try {
        // List chapters for this story using R2Service
        const chaptersResponse = await R2Service.listObjects(`stories/${storyId}/chapters/`)
        const chapterCount = chaptersResponse.KeyCount || 0
        console.log(`   📚 Found ${chapterCount} chapters`)

        if (chapterCount === 0) {
          console.log(`   ⚠️ Skipping story ${storyId} - no chapters found`)
          continue
        }

                // Fetch the first chapter to get story info using S3 SDK
        const firstChapterKey = `stories/${storyId}/chapters/1.json`

        console.log(`   📄 Fetching first chapter: ${firstChapterKey}`)

        try {
          // Use R2Service to get chapter content
          const chapterText = await R2Service.getContent(firstChapterKey)
          const chapterData = JSON.parse(chapterText)
          console.log(`   📡 Chapter fetch successful from R2`)
          console.log(`   ✅ Chapter data loaded:`, {
            title: chapterData.title,
            hasContent: !!chapterData.content,
            themes: chapterData.themes,
            hasMetadata: !!chapterData.metadata
          })

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
            publishedAt: generatedAt || new Date().toISOString(),
            authorAddress: chapterData.metadata?.authorAddress,
            authorName: chapterData.metadata?.authorName,
            // Enhanced metadata from chapter data
            contentRating: chapterData.metadata?.contentRating || 'PG',
            unlockPrice: chapterData.metadata?.unlockPrice || 0.1,
            readReward: chapterData.metadata?.readReward || 0.05,
            licensePrice: chapterData.metadata?.licensePrice || 100,
            isRemixable: chapterData.metadata?.isRemixable ?? true,
            totalReads: chapterData.metadata?.totalReads || 0,
            averageRating: chapterData.metadata?.averageRating || 0,
            wordCount: chapterData.wordCount || 0,
            readingTime: chapterData.readingTime || 0,
            mood: chapterData.metadata?.mood,
            tags: chapterData.metadata?.suggestedTags || [],
            qualityScore: chapterData.metadata?.qualityScore,
            originalityScore: chapterData.metadata?.originalityScore,
            isRemix: chapterData.metadata?.isRemix || false,
            generationMethod: chapterData.metadata?.generationMethod || 'unknown'
          }

          console.log(`   ✅ Story processed:`, story.title)
          stories.push(story)

        } catch (chapterError) {
          console.warn(`   ❌ Failed to fetch/parse chapter data for story ${storyId}:`, chapterError)
          continue
        }

      } catch (error) {
        console.warn(`❌ Failed to process story ${storyId}:`, error)
        continue
      }
    }

    // Sort by most recent first
    stories.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    console.log(`✅ Successfully processed ${stories.length} stories`)

    const response = NextResponse.json({
      success: true,
      stories,
      count: stories.length,
      debug: {
        totalDirectories: listResponse.CommonPrefixes.length,
        processedDirectories: prefixesToProcess.length,
        processedStories: stories.length
      }
    })

    // Add cache control headers
    const cacheDisabled = request.nextUrl.searchParams.get('cache') === 'false'
    if (cacheDisabled) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    } else {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
    }

    return response

  } catch (error) {
    console.error('❌ Error fetching stories from R2:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stories from R2',
        details: error instanceof Error ? error.message : 'Unknown error',
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