/**
 * API Client for Hybrid Cloudflare + Vercel Architecture
 * 
 * Routes API calls to:
 * - Local API routes in development
 * - Vercel API endpoints in production (Cloudflare Pages deployment)
 */

const getApiBaseUrl = (): string => {
  // Always use Vercel API base URL for hybrid architecture
  // Frontend is static export on Cloudflare, backend is on Vercel
  const vercelApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-testnet.storyhouse.vip'
  
  return vercelApiUrl
}

/**
 * Enhanced fetch wrapper for hybrid API routing
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = endpoint.startsWith('/api') 
    ? `${baseUrl}${endpoint}` 
    : `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }
  
  const requestOptions = { ...defaultOptions, ...options }
  
  try {
    const response = await fetch(url, requestOptions)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text() as unknown as T
  } catch (error) {
    console.error(`API request error for ${url}:`, error)
    throw error
  }
}

/**
 * Typed API methods for common operations
 */
export const apiClient = {
  // Story operations
  async generateStory(data: any) {
    return apiRequest('/api/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  async getStories() {
    return apiRequest('/api/stories')
  },
  
  async getStoryChapters(walletAddress: string, storySlug: string) {
    return apiRequest(`/api/stories/${walletAddress}/${storySlug}/chapters`)
  },
  
  async getChapter(storyId: string, chapterNumber: number) {
    return apiRequest(`/api/chapters/${storyId}/${chapterNumber}`)
  },
  
  // Upload operations
  async uploadContent(data: FormData) {
    return apiRequest('/api/upload', {
      method: 'POST',
      body: data,
      headers: {}, // Let fetch set Content-Type for FormData
    })
  },
  
  // IP operations
  async registerIP(data: any) {
    return apiRequest('/api/ip/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  async licenseIP(data: any) {
    return apiRequest('/api/ip/license', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  // Book operations
  async registerBook(data: FormData) {
    return apiRequest('/api/books/register', {
      method: 'POST',
      body: data,
      headers: {}, // Let fetch set Content-Type for FormData
    })
  },
  
  async branchBook(data: FormData) {
    return apiRequest('/api/books/branch', {
      method: 'POST',
      body: data,
      headers: {}, // Let fetch set Content-Type for FormData
    })
  },
  
  async getBranchingInfo(parentBookId: string) {
    return apiRequest(`/api/books/branch?parentBookId=${parentBookId}`)
  },
  
  // Discovery operations
  async getDiscovery(params: {
    type?: string
    bookId?: string
    authorAddress?: string
    genre?: string
    limit?: number
    includeRevenue?: boolean
    includeMetrics?: boolean
  }) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/discovery?${queryParams}`)
  },
  
  async getFamilyTree(bookId: string, includeRevenue = false, includeMetrics = true) {
    return apiRequest(`/api/discovery?type=family-tree&bookId=${bookId}&includeRevenue=${includeRevenue}&includeMetrics=${includeMetrics}`)
  },
  
  async getDerivatives(bookId: string, limit = 20) {
    return apiRequest(`/api/discovery?type=derivatives&bookId=${bookId}&limit=${limit}`)
  },
  
  async getAuthorNetwork(authorAddress: string, limit = 20) {
    return apiRequest(`/api/discovery?type=author-network&authorAddress=${authorAddress}&limit=${limit}`)
  },
  
  async getSimilarBooks(bookId: string, limit = 10) {
    return apiRequest(`/api/discovery?type=similar&bookId=${bookId}&limit=${limit}`)
  },
  
  // Collections
  async getCollections() {
    return apiRequest('/api/collections')
  },
  
  async createCollection(data: any) {
    return apiRequest('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  // Security
  async checkSecurity() {
    return apiRequest('/api/security')
  },
}

/**
 * Get the current API configuration
 */
export const getApiConfig = () => ({
  baseUrl: getApiBaseUrl(),
  environment: process.env.NODE_ENV,
  isHybridDeployment: !!process.env.NEXT_PUBLIC_API_BASE_URL,
})

export default apiClient