import { getApiBaseUrl } from '../api-client'

/**
 * Ensures a URL is absolute by prepending the API base URL if needed
 * @param url - The URL to process (can be relative or absolute)
 * @returns Absolute URL
 */
export function ensureAbsoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  
  // If URL is already absolute (starts with http:// or https://), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If URL is relative (starts with /), prepend the API base URL
  if (url.startsWith('/')) {
    const baseUrl = getApiBaseUrl()
    return baseUrl ? `${baseUrl}${url}` : url
  }
  
  // For other cases, return as-is
  return url
}