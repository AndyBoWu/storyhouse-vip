/**
 * API Client for Unified Vercel Architecture
 * 
 * Routes API calls to same-domain API routes in Vercel deployment
 */

const getApiBaseUrl = (): string => {
  // Use environment variable if set (for hybrid deployment)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  // Check if we're in development by looking at the current URL
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3002'
  }
  
  // In production without explicit API URL, assume same-domain
  return ''
}

/**
 * Enhanced fetch wrapper for same-domain API routing
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  
  // Construct full URL with base URL for development, relative for production  
  const url = baseUrl 
    ? `${baseUrl}${endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`}`
    : (endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`)
  
  console.log('🔍 API Request Debug:', {
    endpoint,
    baseUrl,
    constructedUrl: url,
    nodeEnv: process.env.NODE_ENV
  })
  
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

  // Books operations (for new book landing pages)
  async getBooks(authorAddress?: string) {
    const endpoint = authorAddress ? `/api/books?author=${authorAddress}` : '/api/books'
    return apiRequest(endpoint)
  },

  async getBookById(bookId: string) {
    return apiRequest(`/api/books/${bookId}`)
  },

  async getBookChapters(bookId: string) {
    return apiRequest(`/api/books/${bookId}/chapters`)
  },

  // Generic GET method for flexibility
  async get(endpoint: string) {
    return apiRequest(endpoint)
  },

  // Generic POST method for flexibility
  async post(endpoint: string, data: any) {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Branching operations
  async getBranchingInfo(storyId: string) {
    return apiRequest(`/api/stories/${storyId}/branching`)
  },

  async branchBook(formData: FormData) {
    return apiRequest('/api/books/branch', {
      method: 'POST',
      body: formData,
      headers: {}, // Let fetch set Content-Type for FormData
    })
  },

  async registerBook(formData: FormData) {
    return apiRequest('/api/books/register', {
      method: 'POST',
      body: formData,
      headers: {}, // Let fetch set Content-Type for FormData
    })
  },

  async saveBookChapter(bookId: string, chapterData: any) {
    return apiRequest(`/api/books/${bookId}/chapters/save`, {
      method: 'POST',
      body: JSON.stringify(chapterData),
    })
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