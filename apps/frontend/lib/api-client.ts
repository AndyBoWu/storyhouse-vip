/**
 * API Client for Unified Vercel Architecture
 * 
 * Routes API calls to same-domain API routes in Vercel deployment
 */

import type { 
  DerivativeAnalytics, 
  ContentSimilarityAnalysis, 
  InfluenceMetrics, 
  QualityAssessment 
} from './types/shared'

export const getApiBaseUrl = (): string => {
  // FORCE localhost for development debugging
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔧 FORCING localhost:3002 for development');
    return 'http://localhost:3002'
  }
  
  // Use environment variable if set (for hybrid deployment)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
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
    
    // Handle empty responses
    const contentType = response.headers.get('content-type')
    
    if (!response.ok) {
      // Try to get error details from response body
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorBody = await response.json()
          errorMessage = errorBody.error || errorBody.message || errorMessage
        } else {
          const textBody = await response.text()
          if (textBody && !textBody.includes('<!DOCTYPE')) {
            errorMessage = textBody
          }
        }
      } catch (parseError) {
        // If we can't parse the error body, use the default message
        console.warn('Could not parse error response:', parseError)
      }
      throw new Error(errorMessage)
    }
    
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
    // Use books endpoint instead of deprecated stories
    return apiRequest('/api/books')
  },
  
  async getStoryChapters(walletAddress: string, storySlug: string) {
    return apiRequest(`/api/stories/${walletAddress}/${storySlug}/chapters`)
  },
  
  async getChapter(storyId: string, chapterNumber: number) {
    return apiRequest(`/api/chapters/${encodeURIComponent(storyId)}/${chapterNumber}`)
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

  // Unified IP registration (single transaction)
  async registerUnifiedIP(data: any) {
    return apiRequest('/api/ip/register-unified', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Check if unified registration is available
  async checkUnifiedRegistration() {
    return apiRequest('/api/ip/register-unified')
  },

  // Generate IP metadata without executing blockchain transaction
  async generateIPMetadata(data: { story: any; licenseTier: string }) {
    return apiRequest('/api/ip/metadata', {
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
  
  // Collections - removed (unused)
  // Security - removed (unused)

  // Books operations (for new book landing pages)
  async getBooks(authorAddress?: string) {
    const endpoint = authorAddress ? `/api/books?author=${authorAddress}` : '/api/books'
    return apiRequest(endpoint)
  },

  async getBookById(bookId: string) {
    return apiRequest(`/api/books/${encodeURIComponent(bookId)}`)
  },

  async deleteBook(bookId: string) {
    return apiRequest(`/api/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE'
    })
  },

  async getBookChapters(bookId: string) {
    return apiRequest(`/api/books/${encodeURIComponent(bookId)}/chapters`)
  },

  async getBookChapter(bookId: string, chapterNumber: number) {
    return apiRequest(`/api/books/${encodeURIComponent(bookId)}/chapter/${chapterNumber}`)
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
    console.log('📝 Saving chapter:', {
      bookId,
      chapterNumber: chapterData.chapterNumber,
      title: chapterData.title,
      wordCount: chapterData.wordCount
    })
    
    // Encode the bookId to handle slashes properly in the URL
    const encodedBookId = encodeURIComponent(bookId)
    
    return apiRequest(`/api/books/${encodedBookId}/chapters/save`, {
      method: 'POST',
      body: JSON.stringify(chapterData),
    })
  },

  // Royalty operations
  async claimRoyalty(data: { chapterId: string; authorAddress: string }) {
    return apiRequest('/api/royalties/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getClaimableRoyalties(chapterId: string) {
    return apiRequest(`/api/royalties/claimable/${chapterId}`)
  },

  async getRoyaltyHistory(authorAddress: string) {
    return apiRequest(`/api/royalties/history/${authorAddress}`)
  },

  async getRoyaltyPreview() {
    return apiRequest('/api/royalties/preview')
  },

  async getRoyaltyNotifications(authorAddress: string) {
    return apiRequest(`/api/royalties/notifications/${authorAddress}`)
  },

  // Derivative Analytics operations
  async getDerivativeAnalytics(storyId: string): Promise<{ success: boolean; data: DerivativeAnalytics }> {
    return apiRequest(`/api/discovery?type=derivative-analytics&storyId=${storyId}`)
  },

  async getContentSimilarity(originalId: string, derivativeId: string): Promise<{ success: boolean; data: ContentSimilarityAnalysis }> {
    return apiRequest(`/api/discovery?type=content-similarity&originalId=${originalId}&derivativeId=${derivativeId}`)
  },

  async getInfluenceMetrics(authorAddress: string): Promise<{ success: boolean; data: InfluenceMetrics }> {
    return apiRequest(`/api/discovery?type=influence-analysis&authorAddress=${authorAddress}`)
  },

  async getQualityAssessment(storyId: string): Promise<{ success: boolean; data: QualityAssessment }> {
    return apiRequest(`/api/discovery?type=quality-assessment&storyId=${storyId}`)
  },

  // =============================================================================
  // PHASE 3.3: NOTIFICATION SYSTEM API METHODS
  // =============================================================================

  /**
   * Fetch notifications for a user with optional filtering
   */
  async getNotifications(authorAddress: string, options: {
    unreadOnly?: boolean;
    limit?: number;
    types?: string[];
    since?: Date;
  } = {}) {
    const params = new URLSearchParams({
      authorAddress,
      ...(options.unreadOnly && { unreadOnly: 'true' }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.types && { types: options.types.join(',') }),
      ...(options.since && { since: options.since.toISOString() })
    })
    
    return apiRequest(`/api/notifications?${params}`)
  },

  /**
   * Get notifications for a specific author (alternative endpoint)
   */
  async getAuthorNotifications(authorAddress: string, options: {
    unreadOnly?: boolean;
    limit?: number;
    types?: string[];
    since?: Date;
  } = {}) {
    const params = new URLSearchParams({
      ...(options.unreadOnly && { unreadOnly: 'true' }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.types && { types: options.types.join(',') }),
      ...(options.since && { since: options.since.toISOString() })
    })
    
    return apiRequest(`/api/notifications/${authorAddress}?${params}`)
  },

  /**
   * Send a manual notification (for testing or admin purposes)
   */
  async sendNotification(data: {
    authorAddress: string;
    type: string;
    data?: Record<string, any>;
  }) {
    return apiRequest('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(authorAddress: string) {
    return apiRequest(`/api/notifications/${authorAddress}/preferences`)
  },

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(authorAddress: string, preferences: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    inAppNotifications?: boolean;
    notificationTypes?: string[];
    minimumAmountThreshold?: string;
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
  }) {
    return apiRequest(`/api/notifications/${authorAddress}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  },

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(authorAddress: string, notificationIds: string[]) {
    return apiRequest(`/api/notifications/${authorAddress}/mark-read`, {
      method: 'PUT',
      body: JSON.stringify({ notificationIds })
    })
  },

  /**
   * Register webhook for automated derivative detection
   */
  async registerNotificationWebhook(data: {
    authorAddress: string;
    storyId: string;
    webhookUrl?: string;
    eventTypes?: string[];
  }) {
    return apiRequest('/api/notifications/webhooks', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get webhook status and statistics
   */
  async getNotificationWebhookStats(authorAddress?: string) {
    const params = authorAddress ? `?authorAddress=${authorAddress}` : ''
    return apiRequest(`/api/notifications/webhooks${params}`)
  },

  /**
   * Trigger derivative detection and notification
   */
  async triggerDerivativeDetection(data: {
    authorAddress: string;
    storyId: string;
    similarityThreshold?: number;
    autoNotify?: boolean;
  }) {
    return apiRequest('/api/notifications/derivatives', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get derivative events for a user
   */
  async getDerivativeEvents(authorAddress: string, options: {
    limit?: number;
    unprocessedOnly?: boolean;
  } = {}) {
    const params = new URLSearchParams({
      authorAddress,
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.unprocessedOnly && { unprocessedOnly: 'true' })
    })
    
    return apiRequest(`/api/notifications/derivatives?${params}`)
  },

  /**
   * Trigger content opportunity analysis
   */
  async triggerOpportunityAnalysis(data: {
    authorAddress: string;
    analysisType: 'collaboration' | 'content' | 'all';
    storyId?: string;
    engagementThreshold?: number;
  }) {
    return apiRequest('/api/notifications/opportunities', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get opportunity events for a user
   */
  async getOpportunityEvents(authorAddress: string, options: {
    types?: string[];
    limit?: number;
  } = {}) {
    const params = new URLSearchParams({
      authorAddress,
      ...(options.types && { types: options.types.join(',') }),
      ...(options.limit && { limit: options.limit.toString() })
    })
    
    return apiRequest(`/api/notifications/opportunities?${params}`)
  },

  /**
   * Trigger quality assessment and improvement suggestions
   */
  async triggerQualityAssessment(data: {
    authorAddress: string;
    storyId: string;
    minQualityThreshold?: number;
    includeComparison?: boolean;
  }) {
    return apiRequest('/api/notifications/quality', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get quality events for a user
   */
  async getQualityEvents(authorAddress: string, options: {
    limit?: number;
    unprocessedOnly?: boolean;
  } = {}) {
    const params = new URLSearchParams({
      authorAddress,
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.unprocessedOnly && { unprocessedOnly: 'true' })
    })
    
    return apiRequest(`/api/notifications/quality?${params}`)
  },

  // =============================================================================
  // STORY PROTOCOL SDK DERIVATIVE REGISTRATION API METHODS
  // =============================================================================

  /**
   * Register a derivative work on Story Protocol blockchain
   */
  async registerDerivative(data: {
    parentIpId: string;
    parentChapterId: string;
    derivativeContent: any;
    derivativeType: 'remix' | 'sequel' | 'adaptation' | 'translation' | 'other';
    inheritParentLicense?: boolean;
    customLicenseTermsId?: string;
    attributionText?: string;
    creatorNotes?: string;
    walletClient?: any;
  }) {
    return apiRequest('/api/derivatives/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Auto-detect parent content and register derivative using AI
   */
  async autoRegisterDerivative(data: {
    derivativeContent: any;
    derivativeType: 'remix' | 'sequel' | 'adaptation' | 'translation' | 'other';
    options?: {
      minimumSimilarityThreshold?: number;
      maxParentCandidates?: number;
      requireManualConfirmation?: boolean;
    };
    walletClient?: any;
  }) {
    return apiRequest('/api/derivatives/auto-register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Query derivative family tree for an IP asset
   */
  async getDerivativeTree(ipId: string, options: {
    includeAiAnalysis?: boolean;
    includeLicenseDetails?: boolean;
    includeRevenueData?: boolean;
    depth?: number;
  } = {}) {
    const params = new URLSearchParams({
      ...(options.includeAiAnalysis && { includeAiAnalysis: 'true' }),
      ...(options.includeLicenseDetails && { includeLicenseDetails: 'true' }),
      ...(options.includeRevenueData && { includeRevenueData: 'true' }),
      ...(options.depth && { depth: options.depth.toString() })
    })
    
    return apiRequest(`/api/derivatives/tree/${ipId}?${params}`)
  },

  /**
   * Query derivative tree with complex filters (POST method)
   */
  async queryDerivativeTreeFiltered(ipId: string, query: {
    includeAiAnalysis?: boolean;
    includeLicenseDetails?: boolean;
    includeRevenueData?: boolean;
    depth?: number;
    filters?: {
      licenseTierFilter?: string[];
      qualityThreshold?: number;
      similarityThreshold?: number;
      revenueThreshold?: number;
      creatorFilter?: string[];
      dateRange?: { from: string; to: string };
      derivativeTypeFilter?: string[];
    };
  }) {
    return apiRequest(`/api/derivatives/tree/${ipId}`, {
      method: 'POST',
      body: JSON.stringify(query)
    })
  },

  /**
   * Analyze license inheritance options for derivative creation
   */
  async analyzeLicenseInheritance(parentIpId: string, derivativeCreator: string) {
    return apiRequest(`/api/derivatives/license-inheritance/${parentIpId}?derivativeCreator=${derivativeCreator}`)
  },

  /**
   * Detailed license inheritance analysis with derivative parameters
   */
  async analyzeDetailedLicenseInheritance(parentIpId: string, data: {
    derivativeCreator: string;
    derivativeContent: any;
    derivativeType?: string;
    intendedUse?: 'commercial' | 'non-commercial' | 'educational';
    targetAudience?: 'general' | 'adult' | 'children';
    distributionChannels?: string[];
  }) {
    return apiRequest(`/api/derivatives/license-inheritance/${parentIpId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Get derivative registration service status and capabilities
   */
  async getDerivativeServiceStatus() {
    return apiRequest('/api/derivatives/register')
  },

  /**
   * Get auto-derivative registration service information
   */
  async getAutoDerivativeServiceInfo() {
    return apiRequest('/api/derivatives/auto-register')
  },

  // =============================================================================
  // GENERIC HTTP METHODS
  // =============================================================================

  /**
   * Generic GET request
   */
  async get(endpoint: string) {
    return apiRequest(endpoint)
  },

  /**
   * Generic POST request
   */
  async post(endpoint: string, data?: any) {
    return apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Generic PUT request
   */
  async put(endpoint: string, data?: any) {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Generic DELETE request
   */
  async delete(endpoint: string) {
    return apiRequest(endpoint, {
      method: 'DELETE',
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