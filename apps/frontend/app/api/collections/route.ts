/**
 * @fileoverview Story Collections API Endpoint
 * Handles creation and management of story collections
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  StoryCollection,
  EnhancedApiResponse
} from '@storyhouse/shared'

interface CreateCollectionRequest {
  name: string
  description: string
  creatorAddress: string
  isPublic: boolean
  allowContributions: boolean
  requireApproval: boolean
  revenueShare: {
    creator: number
    collection: number
    platform: number
  }
  genre?: string
  theme?: string
  tags?: string[]
}

interface AddToCollectionRequest {
  collectionId: string
  storyId: string
  authorAddress: string
}

// Create new collection
export async function POST(request: NextRequest) {
  try {
    const body: CreateCollectionRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.creatorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, creatorAddress' },
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    if (!isValidEthereumAddress(body.creatorAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      )
    }

    // Validate revenue share totals to 100%
    const totalRevenue = body.revenueShare.creator + body.revenueShare.collection + body.revenueShare.platform
    if (totalRevenue !== 100) {
      return NextResponse.json(
        { error: 'Revenue share percentages must total 100%' },
        { status: 400 }
      )
    }

    // Generate collection ID
    const collectionId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create collection object
    const newCollection: StoryCollection = {
      id: collectionId,
      name: body.name,
      description: body.description,
      creatorAddress: body.creatorAddress,
      isPublic: body.isPublic,
      allowContributions: body.allowContributions,
      requireApproval: body.requireApproval,
      revenueShare: body.revenueShare,
      creators: [body.creatorAddress],
      stories: [],
      ipAssets: [],
      genre: body.genre,
      theme: body.theme,
      tags: body.tags || [],
      totalEarnings: 0,
      memberCount: 1,
      storyCount: 0,
      totalReads: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating collection:', {
      id: collectionId,
      name: body.name,
      creator: body.creatorAddress
    })

    // TODO: Store in database
    await storeCollection(newCollection)

    const response: EnhancedApiResponse<StoryCollection> = {
      success: true,
      data: newCollection,
      message: 'Collection created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Collection creation API error:', error)
    return NextResponse.json(
      { error: 'Failed to create collection. Please try again.' },
      { status: 500 }
    )
  }
}

// Get collections (list/search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creator')
    const isPublic = searchParams.get('public')
    const search = searchParams.get('search')
    const genre = searchParams.get('genre')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // TODO: Implement actual database query with filters
    const collections = await getCollections({
      creatorAddress: creatorAddress || undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      search: search || undefined,
      genre: genre || undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: collections,
      pagination: {
        limit,
        offset,
        total: collections.length,
        hasMore: collections.length === limit
      }
    })

  } catch (error) {
    console.error('Collections fetch API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

// Add story to collection
export async function PUT(request: NextRequest) {
  try {
    const body: AddToCollectionRequest = await request.json()

    if (!body.collectionId || !body.storyId || !body.authorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: collectionId, storyId, authorAddress' },
        { status: 400 }
      )
    }

    // TODO: Verify collection exists and user has permission
    const collection = await getCollection(body.collectionId)
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user can add to collection
    const canAdd = collection.allowContributions &&
                  (collection.isPublic || collection.creators.includes(body.authorAddress))

    if (!canAdd) {
      return NextResponse.json(
        { error: 'You do not have permission to add stories to this collection' },
        { status: 403 }
      )
    }

    // Check if story already in collection
    if (collection.stories.includes(body.storyId)) {
      return NextResponse.json(
        { error: 'Story is already in this collection' },
        { status: 409 }
      )
    }

    // Add story to collection
    const updatedCollection = await addStoryToCollection(body.collectionId, body.storyId, body.authorAddress)

    const response: EnhancedApiResponse<StoryCollection> = {
      success: true,
      data: updatedCollection,
      message: 'Story added to collection successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Add to collection API error:', error)
    return NextResponse.json(
      { error: 'Failed to add story to collection' },
      { status: 500 }
    )
  }
}

// Helper functions
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

async function storeCollection(collection: StoryCollection): Promise<void> {
  // TODO: Implement actual database storage
  console.log('Storing collection:', collection.id)
}

async function getCollections(filters: {
  creatorAddress?: string
  isPublic?: boolean
  search?: string
  genre?: string
  limit: number
  offset: number
}): Promise<StoryCollection[]> {
  // TODO: Implement actual database query
  console.log('Fetching collections with filters:', filters)

  // Mock data for demo
  return [
    {
      id: 'col-1',
      name: 'Mystery Chronicles',
      description: 'A collection of thrilling mystery stories',
      creatorAddress: '0x123...',
      isPublic: true,
      allowContributions: true,
      requireApproval: false,
      revenueShare: { creator: 70, collection: 20, platform: 10 },
      creators: ['0x123...', '0x456...'],
      stories: ['story-1', 'story-2'],
      ipAssets: ['ip-1', 'ip-2'],
      genre: 'Mystery',
      theme: 'Detective Stories',
      tags: ['mystery', 'detective', 'thriller'],
      totalEarnings: 1250,
      memberCount: 5,
      storyCount: 12,
      totalReads: 2340,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    }
  ]
}

async function getCollection(collectionId: string): Promise<StoryCollection | null> {
  // TODO: Implement actual database lookup
  console.log('Fetching collection:', collectionId)

  // Mock collection for demo
  return {
    id: collectionId,
    name: 'Mock Collection',
    description: 'A mock collection for testing',
    creatorAddress: '0x123...',
    isPublic: true,
    allowContributions: true,
    requireApproval: false,
    revenueShare: { creator: 70, collection: 20, platform: 10 },
    creators: ['0x123...'],
    stories: [],
    ipAssets: [],
    tags: [],
    totalEarnings: 0,
    memberCount: 1,
    storyCount: 0,
    totalReads: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

async function addStoryToCollection(
  collectionId: string,
  storyId: string,
  authorAddress: string
): Promise<StoryCollection> {
  // TODO: Implement actual database update
  console.log('Adding story to collection:', { collectionId, storyId, authorAddress })

  // Mock updated collection
  const collection = await getCollection(collectionId)
  if (collection) {
    collection.stories.push(storyId)
    collection.storyCount += 1
    collection.updatedAt = new Date()

    // Add author to creators if not already there
    if (!collection.creators.includes(authorAddress)) {
      collection.creators.push(authorAddress)
      collection.memberCount += 1
    }
  }

  return collection!
}

// Handle unsupported methods
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create collections, PUT to add stories.' },
    { status: 405 }
  )
}
