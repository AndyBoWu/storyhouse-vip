import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!

interface ChapterMetadata {
  chapterNumber: number
  title: string
  summary: string
  wordCount: number
  readingTime: number
  unlockPrice: number
  readReward: number
  totalReads: number
  isUnlocked?: boolean
  createdAt: string
  genre?: string
  mood?: string
  contentRating?: string
}

interface StoryMetadata {
  id: string
  title: string
  authorName: string
  authorAddress: string
  genre: string
  totalChapters: number
  totalWords: number
  totalReadingTime: number
  averageRating?: number
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * GET /api/stories/[walletAddress]/[storySlug]/chapters
 * Fetch story metadata and all chapters for a specific story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string; storySlug: string }> }
) {
  try {
    const { walletAddress, storySlug } = await params
    
    console.log(`📖 Fetching chapters for story: ${storySlug} by ${walletAddress}`)

    // First, find the actual story ID by searching through all stories
    const allStoriesCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'stories/',
      Delimiter: '/',
    })

    const allStoriesResponse = await r2Client.send(allStoriesCommand)
    
    if (!allStoriesResponse.CommonPrefixes) {
      return NextResponse.json({
        success: false,
        error: 'No stories found in storage'
      }, { status: 404 })
    }

    // Find the matching story by checking metadata
    let matchingStoryId: string | null = null
    let storyMetadata: StoryMetadata | null = null

    for (const prefix of allStoriesResponse.CommonPrefixes) {
      if (!prefix.Prefix) continue
      
      const storyId = prefix.Prefix.replace('stories/', '').replace('/', '')
      
      try {
        // Check first chapter to get story metadata
        const firstChapterKey = `stories/${storyId}/chapters/1.json`
        const getObjectCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: firstChapterKey,
        })

        const chapterResponse = await r2Client.send(getObjectCommand)
        if (!chapterResponse.Body) continue

        const chapterText = await chapterResponse.Body.transformToString()
        const chapterData = JSON.parse(chapterText)
        
        const authorAddress = chapterData.metadata?.authorAddress?.toLowerCase()
        const storyTitle = chapterData.title || 'Untitled Story'
        
        // Create slug from title for comparison
        const titleSlug = storyTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        // Check if this story matches the requested wallet and slug
        if (authorAddress === walletAddress.toLowerCase() && 
            (titleSlug === storySlug || storyId === storySlug)) {
          matchingStoryId = storyId
          
          // Build story metadata
          const themes = chapterData.themes || []
          let genre = 'Fiction'
          if (themes.includes('mystery') || themes.includes('detective')) genre = 'Mystery'
          else if (themes.includes('science fiction') || themes.includes('sci-fi')) genre = 'Sci-Fi'
          else if (themes.includes('fantasy') || themes.includes('magic')) genre = 'Fantasy'
          else if (themes.includes('romance')) genre = 'Romance'
          else if (themes.includes('horror')) genre = 'Horror'
          else if (themes.includes('adventure')) genre = 'Adventure'

          storyMetadata = {
            id: storyId,
            title: storyTitle,
            authorName: chapterData.metadata?.authorName || 'Unknown Author',
            authorAddress: chapterData.metadata?.authorAddress || walletAddress,
            genre,
            totalChapters: 0, // Will be calculated below
            totalWords: 0, // Will be calculated below
            totalReadingTime: 0, // Will be calculated below
            averageRating: chapterData.metadata?.averageRating,
            description: chapterData.metadata?.description || chapterData.content?.substring(0, 200) + '...',
            tags: chapterData.metadata?.suggestedTags || [],
            createdAt: chapterData.metadata?.generatedAt || new Date().toISOString(),
            updatedAt: chapterData.metadata?.generatedAt || new Date().toISOString(),
          }
          break
        }
      } catch (error) {
        // Skip this story if we can't read its metadata
        continue
      }
    }

    if (!matchingStoryId || !storyMetadata) {
      return NextResponse.json({
        success: false,
        error: 'Story not found'
      }, { status: 404 })
    }

    console.log(`✅ Found matching story: ${matchingStoryId}`)

    // Now fetch all chapters for this story
    const chaptersCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `stories/${matchingStoryId}/chapters/`,
    })

    const chaptersResponse = await r2Client.send(chaptersCommand)
    const chapters: ChapterMetadata[] = []
    let totalWords = 0
    let totalReadingTime = 0

    console.log(`📁 Found ${chaptersResponse.KeyCount || 0} objects in chapters directory`)
    console.log(`📋 Chapter files:`, chaptersResponse.Contents?.map(obj => obj.Key) || [])

    if (chaptersResponse.Contents) {
      // Sort chapters by number
      const sortedChapters = chaptersResponse.Contents
        .filter(obj => obj.Key?.endsWith('.json'))
        .sort((a, b) => {
          const aNum = parseInt(a.Key?.match(/(\d+)\.json$/)?.[1] || '0')
          const bNum = parseInt(b.Key?.match(/(\d+)\.json$/)?.[1] || '0')
          return aNum - bNum
        })

      console.log(`📖 Processing ${sortedChapters.length} chapter files:`, sortedChapters.map(c => c.Key))

      for (const chapterObj of sortedChapters) {
        if (!chapterObj.Key) continue

        try {
          const getChapterCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: chapterObj.Key,
          })

          const chapterResponse = await r2Client.send(getChapterCommand)
          if (!chapterResponse.Body) continue

          const chapterText = await chapterResponse.Body.transformToString()
          const chapterData = JSON.parse(chapterText)

          const chapterNumber = parseInt(chapterObj.Key.match(/(\d+)\.json$/)?.[1] || '0')
          const wordCount = chapterData.wordCount || 0
          const readingTime = chapterData.readingTime || 0

          totalWords += wordCount
          totalReadingTime += readingTime

          const chapter: ChapterMetadata = {
            chapterNumber,
            title: chapterData.title || `Chapter ${chapterNumber}`,
            summary: chapterData.content?.substring(0, 150) + '...' || 'No summary available',
            wordCount,
            readingTime,
            unlockPrice: chapterData.metadata?.unlockPrice || 0.1,
            readReward: chapterData.metadata?.readReward || 0.05,
            totalReads: chapterData.metadata?.totalReads || 0,
            isUnlocked: chapterData.metadata?.isUnlocked || false,
            createdAt: chapterData.metadata?.generatedAt || chapterObj.LastModified?.toISOString() || new Date().toISOString(),
            genre: chapterData.metadata?.genre,
            mood: chapterData.metadata?.mood,
            contentRating: chapterData.metadata?.contentRating || 'PG',
          }

          chapters.push(chapter)
        } catch (error) {
          console.warn(`Failed to parse chapter ${chapterObj.Key}:`, error)
          continue
        }
      }
    }

    // Update story metadata with calculated totals
    storyMetadata.totalChapters = chapters.length
    storyMetadata.totalWords = totalWords
    storyMetadata.totalReadingTime = totalReadingTime

    console.log(`✅ Found ${chapters.length} chapters for story ${storyMetadata.title}`)

    return NextResponse.json({
      success: true,
      story: storyMetadata,
      chapters,
      debug: {
        storyId: matchingStoryId,
        totalChapters: chapters.length,
        totalWords,
        totalReadingTime,
      }
    })

  } catch (error) {
    console.error('❌ Error fetching story chapters:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch story chapters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}