/**
 * Generate URL-friendly slugs from story titles
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50) // Limit length
}

/**
 * Generate story slug with fallback to ID
 */
export function generateStorySlug(title: string, id: string): string {
  const slug = slugify(title)
  return slug || `story-${id}`
}

/**
 * Format wallet address for URL (shortened)
 */
export function formatWalletForUrl(address: string): string {
  if (!address) return 'anonymous'
  return address.toLowerCase()
}

/**
 * Parse story URL parameters
 */
export interface StoryUrlParams {
  walletAddress: string
  storySlug: string
  chapterNumber: string
}

/**
 * Build story chapter URL
 */
export function buildChapterUrl(
  walletAddress: string, 
  title: string, 
  storyId: string, 
  chapterNumber: number = 1
): string {
  const wallet = formatWalletForUrl(walletAddress)
  const slug = generateStorySlug(title, storyId)
  return `/stories/${wallet}/${slug}/${chapterNumber}`
}