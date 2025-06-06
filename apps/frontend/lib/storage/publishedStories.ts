/**
 * Published Stories Storage Management
 * Tracks user's published stories in localStorage
 */

export interface PublishedStory {
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
  publishedAt: Date
  chapterNumber: number
}

const STORAGE_KEY = 'storyhouse_published_stories'

export function getPublishedStories(): PublishedStory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const stories = JSON.parse(stored)
    // Convert publishedAt strings back to Date objects
    return stories.map((story: any) => ({
      ...story,
      publishedAt: new Date(story.publishedAt)
    }))
  } catch (error) {
    console.warn('Error loading published stories:', error)
    return []
  }
}

export function addPublishedStory(story: Omit<PublishedStory, 'id' | 'publishedAt'>): PublishedStory {
  const newStory: PublishedStory = {
    ...story,
    id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    publishedAt: new Date()
  }

  const existingStories = getPublishedStories()

  // Check if this is a new chapter for an existing story
  const existingStoryIndex = existingStories.findIndex(s => s.title === story.title)

  if (existingStoryIndex >= 0) {
    // Update existing story with new chapter
    existingStories[existingStoryIndex] = {
      ...existingStories[existingStoryIndex],
      chapters: Math.max(existingStories[existingStoryIndex].chapters, story.chapterNumber),
      lastUpdated: 'just now',
      contentUrl: story.contentUrl, // Update to latest chapter URL
      transactionHash: story.transactionHash,
      ipAssetId: story.ipAssetId,
      tokenId: story.tokenId,
      chapterNumber: story.chapterNumber
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingStories))
    return existingStories[existingStoryIndex]
  } else {
    // Add new story
    const updatedStories = [...existingStories, newStory]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStories))
    return newStory
  }
}

export function updateStoryEarnings(storyId: string, earnings: number): void {
  const stories = getPublishedStories()
  const storyIndex = stories.findIndex(s => s.id === storyId)

  if (storyIndex >= 0) {
    stories[storyIndex].earnings = earnings
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories))
  }
}

export function deletePublishedStory(storyId: string): void {
  const stories = getPublishedStories()
  const filteredStories = stories.filter(s => s.id !== storyId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredStories))
}

export function clearPublishedStories(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Helper function to extract preview from content
export function extractPreview(content: string, maxLength: number = 100): string {
  // Remove markdown and get first paragraph
  const plainText = content.replace(/#{1,6}\s+/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
  const firstParagraph = plainText.split('\n')[0] || plainText

  if (firstParagraph.length <= maxLength) {
    return firstParagraph
  }

  return firstParagraph.substring(0, maxLength).trim() + '...'
}

// Helper function to determine genre from themes
export function extractGenre(themes: string[]): string {
  if (themes.includes('mystery') || themes.includes('detective')) return 'Mystery'
  if (themes.includes('science fiction') || themes.includes('sci-fi')) return 'Sci-Fi'
  if (themes.includes('fantasy') || themes.includes('magic')) return 'Fantasy'
  if (themes.includes('romance')) return 'Romance'
  if (themes.includes('horror')) return 'Horror'
  if (themes.includes('adventure')) return 'Adventure'
  return 'Fiction'
}
