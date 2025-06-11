import { NextRequest, NextResponse } from 'next/server'
import { BookStorageService } from '@/lib/storage'
import { 
  BookMetadata, 
  BookDiscoveryFilters, 
  BookDiscoveryResponse,
  BookSummary,
  BookDerivationTreeResponse,
  BookDerivationNode
} from '@storyhouse/shared'
import { contentAnalysisService } from '@/lib/services/contentAnalysisService'

/**
 * GET /api/discovery
 * 
 * Phase 3: Cross-Discovery System
 * Advanced book discovery with family tree relationships, collaborative author networks,
 * and revenue attribution transparency for the collaborative storytelling platform.
 * 
 * Query Parameters:
 * - type: "recommendations" | "derivatives" | "family-tree" | "author-network" | "similar" | "content-similarity" | "influence-analysis" | "quality-assessment"
 * - bookId: Target book for relationship queries
 * - authorAddress: Filter by author
 * - genre: Filter by genre
 * - limit: Results limit (default 20)
 * - includeRevenue: Include revenue attribution data
 * - includeMetrics: Include engagement metrics
 * - similarityThreshold: Minimum similarity score for AI analysis (default 0.3)
 * - includeConfidence: Include AI confidence scores in results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const discoveryType = searchParams.get('type') || 'recommendations'
    const bookId = searchParams.get('bookId')
    const authorAddress = searchParams.get('authorAddress')
    const genre = searchParams.get('genre')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeRevenue = searchParams.get('includeRevenue') === 'true'
    const includeMetrics = searchParams.get('includeMetrics') === 'true'
    const similarityThreshold = parseFloat(searchParams.get('similarityThreshold') || '0.3')
    const includeConfidence = searchParams.get('includeConfidence') === 'true'
    
    console.log(`🔍 Discovery request: ${discoveryType}`, {
      bookId,
      authorAddress,
      genre,
      limit,
      includeRevenue,
      includeMetrics,
      similarityThreshold,
      includeConfidence
    })

    switch (discoveryType) {
      case 'family-tree':
        if (!bookId) {
          return NextResponse.json({
            success: false,
            error: 'bookId required for family-tree discovery'
          }, { status: 400 })
        }
        return await handleFamilyTreeDiscovery(bookId, includeRevenue, includeMetrics, includeConfidence)
        
      case 'derivatives':
        if (!bookId) {
          return NextResponse.json({
            success: false,
            error: 'bookId required for derivatives discovery'
          }, { status: 400 })
        }
        return await handleDerivativesDiscovery(bookId, limit, includeRevenue, includeMetrics)
        
      case 'author-network':
        if (!authorAddress) {
          return NextResponse.json({
            success: false,
            error: 'authorAddress required for author-network discovery'
          }, { status: 400 })
        }
        return await handleAuthorNetworkDiscovery(authorAddress, limit, includeRevenue)
        
      case 'similar':
        if (!bookId) {
          return NextResponse.json({
            success: false,
            error: 'bookId required for similar books discovery'
          }, { status: 400 })
        }
        return await handleSimilarBooksDiscovery(bookId, limit, includeMetrics)
        
      case 'content-similarity':
        if (!bookId) {
          return NextResponse.json({
            success: false,
            error: 'bookId required for content-similarity analysis'
          }, { status: 400 })
        }
        return await handleContentSimilarityDiscovery(bookId, limit, similarityThreshold, includeConfidence)
        
      case 'influence-analysis':
        if (!bookId) {
          return NextResponse.json({
            success: false,
            error: 'bookId required for influence analysis'
          }, { status: 400 })
        }
        return await handleInfluenceAnalysisDiscovery(bookId, includeMetrics)
        
      case 'quality-assessment':
        if (!bookId) {
          return NextResponse.json({
            success: false,
            error: 'bookId required for quality assessment'
          }, { status: 400 })
        }
        return await handleQualityAssessmentDiscovery(bookId)
        
      case 'recommendations':
      default:
        return await handleRecommendationsDiscovery({
          author: authorAddress,
          genre,
          limit,
          includeRevenue,
          includeMetrics
        })
    }
    
  } catch (error) {
    console.error('❌ Discovery API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Discovery system error'
    }, { status: 500 })
  }
}

/**
 * Generate complete family tree for a book showing all derivatives and relationships
 */
async function handleFamilyTreeDiscovery(
  bookId: string, 
  includeRevenue: boolean, 
  includeMetrics: boolean,
  includeAISimilarity: boolean = false
): Promise<NextResponse> {
  try {
    // Load the target book
    const targetBook = await BookStorageService.getBookMetadata(bookId)
    
    // Find the root book (walk up the parent chain)
    let rootBook = targetBook
    const visitedBooks = new Set<string>()
    
    while (rootBook.parentBook && !visitedBooks.has(rootBook.bookId)) {
      visitedBooks.add(rootBook.bookId)
      try {
        rootBook = await BookStorageService.getBookMetadata(rootBook.parentBook)
      } catch (error) {
        console.warn(`Parent book not found: ${rootBook.parentBook}`)
        break
      }
    }
    
    // Build the complete family tree
    const familyTree = await buildDerivationTree(rootBook, includeRevenue, includeMetrics, includeAISimilarity)
    
    // Calculate analytics for the entire family
    const analytics = calculateFamilyAnalytics(familyTree)
    
    const response: BookDerivationTreeResponse = {
      success: true,
      tree: {
        root: familyTree,
        derivatives: familyTree.derivatives
      },
      analytics
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Family tree discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to build family tree'
    }, { status: 500 })
  }
}

/**
 * Recursively build derivation tree for a book
 */
async function buildDerivationTree(
  book: BookMetadata, 
  includeRevenue: boolean, 
  includeMetrics: boolean,
  includeAISimilarity: boolean = false,
  visitedBooks: Set<string> = new Set()
): Promise<BookDerivationNode> {
  // Prevent infinite loops
  if (visitedBooks.has(book.bookId)) {
    return {
      bookId: book.bookId,
      title: book.title,
      authorName: book.authorName,
      branchPoint: book.branchPoint,
      totalChapters: book.totalChapters,
      totalReads: book.totalReads,
      createdAt: book.createdAt,
      derivatives: []
    }
  }
  
  visitedBooks.add(book.bookId)
  
  // Load all derivative books
  const derivatives: BookDerivationNode[] = []
  
  for (const derivativeId of book.derivativeBooks) {
    try {
      const derivativeBook = await BookStorageService.getBookMetadata(derivativeId)
      const derivativeNode = await buildDerivationTree(
        derivativeBook, 
        includeRevenue, 
        includeMetrics, 
        includeAISimilarity,
        new Set(visitedBooks)
      )

      // Add AI similarity analysis if requested
      if (includeAISimilarity) {
        try {
          const similarityResult = await contentAnalysisService.analyzeContentSimilarity(
            book.bookId,
            '1',
            derivativeBook.bookId,
            '1'
          )
          
          derivativeNode.aiSimilarity = {
            similarityScore: similarityResult.similarityScore,
            confidence: similarityResult.confidence,
            factors: similarityResult.factors
          }
        } catch (error) {
          console.warn(`Could not analyze similarity between ${book.bookId} and ${derivativeBook.bookId}:`, error)
        }
      }
      derivatives.push(derivativeNode)
    } catch (error) {
      console.warn(`Derivative book not found: ${derivativeId}`)
    }
  }
  
  return {
    bookId: book.bookId,
    title: book.title,
    authorName: book.authorName,
    branchPoint: book.branchPoint,
    totalChapters: book.totalChapters,
    totalReads: book.totalReads,
    createdAt: book.createdAt,
    derivatives: derivatives.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
}

/**
 * Get all direct derivatives of a book
 */
async function handleDerivativesDiscovery(
  bookId: string,
  limit: number,
  includeRevenue: boolean,
  includeMetrics: boolean
): Promise<NextResponse> {
  try {
    const book = await BookStorageService.getBookMetadata(bookId)
    
    const derivatives: BookSummary[] = []
    
    for (const derivativeId of book.derivativeBooks.slice(0, limit)) {
      try {
        const derivativeBook = await BookStorageService.getBookMetadata(derivativeId)
        const summary = createBookSummary(derivativeBook, includeRevenue, includeMetrics)
        derivatives.push(summary)
      } catch (error) {
        console.warn(`Derivative book not found: ${derivativeId}`)
      }
    }
    
    const response: BookDiscoveryResponse = {
      success: true,
      books: derivatives,
      pagination: {
        total: book.derivativeBooks.length,
        limit,
        offset: 0,
        hasMore: book.derivativeBooks.length > limit
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Derivatives discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load derivatives'
    }, { status: 500 })
  }
}

/**
 * Discover books connected through author collaboration networks
 */
async function handleAuthorNetworkDiscovery(
  authorAddress: string,
  limit: number,
  includeRevenue: boolean
): Promise<NextResponse> {
  try {
    // Get all books where this author contributed chapters
    const collaborativeBooks: BookSummary[] = []
    
    // This is a simplified implementation - in production you'd use an indexed search
    // For now, we'll search through available books
    const availableBooks = await BookStorageService.getAllBooksMetadata()
    
    for (const book of availableBooks) {
      // Check if author contributed to this book
      if (book.originalAuthors[authorAddress] && book.authorAddress !== authorAddress) {
        const summary = createBookSummary(book, includeRevenue, true)
        collaborativeBooks.push(summary)
      }
      
      if (collaborativeBooks.length >= limit) break
    }
    
    const response: BookDiscoveryResponse = {
      success: true,
      books: collaborativeBooks.sort((a, b) => b.totalReads - a.totalReads),
      pagination: {
        total: collaborativeBooks.length,
        limit,
        offset: 0,
        hasMore: false
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Author network discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to build author network'
    }, { status: 500 })
  }
}

/**
 * Find books similar to the target book based on genre, tags, and content
 */
async function handleSimilarBooksDiscovery(
  bookId: string,
  limit: number,
  includeMetrics: boolean
): Promise<NextResponse> {
  try {
    const targetBook = await BookStorageService.getBookMetadata(bookId)
    const availableBooks = await BookStorageService.getAllBooksMetadata()
    
    // Calculate similarity scores
    const similarBooks = availableBooks
      .filter(book => book.bookId !== bookId && book.isRemixable)
      .map(book => ({
        book,
        similarity: calculateSimilarityScore(targetBook, book)
      }))
      .filter(item => item.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => createBookSummary(item.book, false, includeMetrics))
    
    const response: BookDiscoveryResponse = {
      success: true,
      books: similarBooks,
      pagination: {
        total: similarBooks.length,
        limit,
        offset: 0,
        hasMore: false
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Similar books discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to find similar books'
    }, { status: 500 })
  }
}

/**
 * General recommendations based on filters
 */
async function handleRecommendationsDiscovery(filters: {
  author?: string
  genre?: string
  limit: number
  includeRevenue: boolean
  includeMetrics: boolean
}): Promise<NextResponse> {
  try {
    const availableBooks = await BookStorageService.getAllBooksMetadata()
    
    let filteredBooks = availableBooks.filter(book => {
      if (filters.author && book.authorAddress !== filters.author) return false
      if (filters.genre && !book.genres.includes(filters.genre)) return false
      return book.isRemixable
    })
    
    // Sort by engagement and quality
    filteredBooks = filteredBooks.sort((a, b) => {
      const scoreA = (a.totalReads * 0.4) + (a.averageRating * 20) + (a.derivativeBooks.length * 10)
      const scoreB = (b.totalReads * 0.4) + (b.averageRating * 20) + (b.derivativeBooks.length * 10)
      return scoreB - scoreA
    })
    
    const recommendations = filteredBooks
      .slice(0, filters.limit)
      .map(book => createBookSummary(book, filters.includeRevenue, filters.includeMetrics))
    
    const response: BookDiscoveryResponse = {
      success: true,
      books: recommendations,
      pagination: {
        total: filteredBooks.length,
        limit: filters.limit,
        offset: 0,
        hasMore: filteredBooks.length > filters.limit
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Recommendations discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations'
    }, { status: 500 })
  }
}

/**
 * Create book summary for discovery results
 */
function createBookSummary(
  book: BookMetadata,
  includeRevenue: boolean,
  includeMetrics: boolean
): BookSummary {
  const summary: BookSummary = {
    bookId: book.bookId,
    title: book.title,
    authorName: book.authorName,
    authorAddress: book.authorAddress,
    coverUrl: book.coverUrl,
    totalChapters: book.totalChapters,
    genres: book.genres,
    averageRating: book.averageRating,
    totalReads: book.totalReads,
    isRemixable: book.isRemixable,
    createdAt: book.createdAt
  }
  
  if (book.parentBook) {
    summary.parentBook = book.parentBook
    summary.branchPoint = book.branchPoint
  }
  
  if (book.derivativeBooks.length > 0) {
    summary.derivativeBooks = book.derivativeBooks
  }
  
  return summary
}

/**
 * Calculate similarity score between two books
 */
function calculateSimilarityScore(book1: BookMetadata, book2: BookMetadata): number {
  let score = 0
  
  // Genre similarity (40% weight)
  const commonGenres = book1.genres.filter(g => book2.genres.includes(g))
  const genreScore = commonGenres.length / Math.max(book1.genres.length, book2.genres.length)
  score += genreScore * 0.4
  
  // Content rating similarity (20% weight)
  if (book1.contentRating === book2.contentRating) {
    score += 0.2
  }
  
  // Author collaboration (30% weight)
  const hasSharedAuthors = Object.keys(book1.originalAuthors).some(author => 
    book2.originalAuthors[author]
  )
  if (hasSharedAuthors) {
    score += 0.3
  }
  
  // Engagement similarity (10% weight)
  const engagementSimilarity = 1 - Math.abs(book1.averageRating - book2.averageRating) / 5
  score += engagementSimilarity * 0.1
  
  return Math.min(score, 1.0)
}

/**
 * Calculate analytics for an entire book family
 */
function calculateFamilyAnalytics(tree: BookDerivationNode): {
  totalDerivatives: number
  totalAuthors: number
  totalChapters: number
  totalReads: number
  averageRating: number
  totalRevenue: number
} {
  const allBooks: BookDerivationNode[] = []
  
  function collectBooks(node: BookDerivationNode) {
    allBooks.push(node)
    node.derivatives.forEach(collectBooks)
  }
  
  collectBooks(tree)
  
  const totalDerivatives = allBooks.length - 1 // Exclude root
  const uniqueAuthors = new Set(allBooks.map(book => book.authorName))
  const totalAuthors = uniqueAuthors.size
  const totalChapters = allBooks.reduce((sum, book) => sum + book.totalChapters, 0)
  const totalReads = allBooks.reduce((sum, book) => sum + book.totalReads, 0)
  
  return {
    totalDerivatives,
    totalAuthors,
    totalChapters,
    totalReads,
    averageRating: 0, // Would calculate from detailed metrics
    totalRevenue: 0   // Would calculate from revenue data
  }
}

// =============================================================================
// PHASE 3.1.3: AI-POWERED DERIVATIVE ANALYSIS HANDLERS
// =============================================================================

/**
 * AI-powered content similarity discovery using OpenAI embeddings
 */
async function handleContentSimilarityDiscovery(
  bookId: string,
  limit: number,
  similarityThreshold: number,
  includeConfidence: boolean
): Promise<NextResponse> {
  try {
    console.log(`🤖 AI content similarity analysis for book ${bookId}`)
    
    // Use content analysis service to detect potential derivatives
    const derivativeResults = await contentAnalysisService.detectPotentialDerivatives({
      sourceStoryId: bookId,
      sourceChapterId: '1',
      similarityThreshold,
      maxResults: limit,
      includeConfidenceAnalysis: includeConfidence
    })

    // Convert to discovery response format
    const books: (BookSummary & {
      similarityScore?: number
      confidence?: number
      analysisDetails?: any
    })[] = []

    for (const derivative of derivativeResults.potentialDerivatives) {
      try {
        const bookMetadata = await BookStorageService.getBookMetadata(derivative.storyId)
        const summary = createBookSummary(bookMetadata, false, true)
        
        // Add AI analysis data
        books.push({
          ...summary,
          similarityScore: derivative.similarityScore,
          confidence: derivative.confidence,
          analysisDetails: includeConfidence ? derivative.analysisDetails : undefined
        })
      } catch (error) {
        console.warn(`Book metadata not found for ${derivative.storyId}`)
        continue
      }
    }

    const response = {
      success: true,
      books,
      pagination: {
        total: books.length,
        limit,
        offset: 0,
        hasMore: false
      },
      aiAnalysis: {
        analysisType: 'content-similarity',
        sourceBookId: bookId,
        similarityThreshold,
        analysisMetadata: derivativeResults.analysisMetadata
      }
    }

    console.log(`🤖 Content similarity analysis complete: ${books.length} results`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Content similarity discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform AI content similarity analysis'
    }, { status: 500 })
  }
}

/**
 * Influence analysis discovery showing how much a story influences others
 */
async function handleInfluenceAnalysisDiscovery(
  bookId: string,
  includeMetrics: boolean
): Promise<NextResponse> {
  try {
    console.log(`📈 Influence analysis for book ${bookId}`)
    
    // Calculate influence score using content analysis service
    const influenceScore = await contentAnalysisService.calculateInfluenceScore(bookId)

    // Get detailed book information for influenced derivatives
    const influencedBooks: (BookSummary & {
      similarityScore?: number
      qualityRatio?: number
      engagementRatio?: number
    })[] = []

    for (const derivative of influenceScore.derivativeBreakdown) {
      try {
        const bookMetadata = await BookStorageService.getBookMetadata(derivative.derivativeId)
        const summary = createBookSummary(bookMetadata, false, includeMetrics)
        
        influencedBooks.push({
          ...summary,
          similarityScore: derivative.similarityScore,
          qualityRatio: derivative.qualityRatio,
          engagementRatio: derivative.engagementRatio
        })
      } catch (error) {
        console.warn(`Book metadata not found for ${derivative.derivativeId}`)
        continue
      }
    }

    const response = {
      success: true,
      books: influencedBooks,
      pagination: {
        total: influencedBooks.length,
        limit: influencedBooks.length,
        offset: 0,
        hasMore: false
      },
      influenceAnalysis: {
        storyId: bookId,
        influenceMetrics: influenceScore.influenceMetrics,
        trendsAnalysis: influenceScore.trendsAnalysis,
        analysisTimestamp: new Date().toISOString()
      }
    }

    console.log(`📈 Influence analysis complete: ${(influenceScore.influenceMetrics.overallInfluence * 100).toFixed(1)}% influence score`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Influence analysis discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform influence analysis'
    }, { status: 500 })
  }
}

/**
 * Quality assessment discovery for a story
 */
async function handleQualityAssessmentDiscovery(bookId: string): Promise<NextResponse> {
  try {
    console.log(`🎯 Quality assessment for book ${bookId}`)
    
    // Get book metadata to check if it's a derivative
    const bookMetadata = await BookStorageService.getBookMetadata(bookId)
    const originalStoryId = bookMetadata.parentBook

    // Perform quality assessment
    const qualityAssessment = await contentAnalysisService.assessDerivativeQuality(
      bookId,
      originalStoryId
    )

    // Create book summary
    const bookSummary = createBookSummary(bookMetadata, false, true)

    const response = {
      success: true,
      book: bookSummary,
      qualityAssessment: {
        storyId: qualityAssessment.storyId,
        qualityMetrics: qualityAssessment.qualityMetrics,
        comparisonToOriginal: qualityAssessment.comparisonToOriginal,
        recommendations: qualityAssessment.recommendations,
        assessmentTimestamp: qualityAssessment.assessmentTimestamp
      }
    }

    console.log(`🎯 Quality assessment complete: ${(qualityAssessment.qualityMetrics.overallScore * 100).toFixed(1)}% quality score`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Quality assessment discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform quality assessment'
    }, { status: 500 })
  }
}