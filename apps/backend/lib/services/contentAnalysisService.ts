import { 
  generateContentEmbedding, 
  analyzeContentSimilarity, 
  generateContentFingerprint,
  ContentEmbedding,
  SimilarityAnalysisResult 
} from '../ai/openai'
import { createDataService } from './dataService'

// Create dataService instance
const dataService = createDataService(true) // Enable IP functionality

export interface DerivativeDetectionResult {
  potentialDerivatives: Array<{
    storyId: string
    chapterId: string
    similarityScore: number
    confidence: number
    analysisDetails: SimilarityAnalysisResult
  }>
  analysisMetadata: {
    sourceStoryId: string
    sourceChapterId: string
    analysisTimestamp: string
    totalAnalyzed: number
    highConfidenceMatches: number
  }
}

export interface InfluenceScore {
  storyId: string
  influenceMetrics: {
    totalDerivatives: number
    averageSimilarity: number
    qualityScore: number
    reachScore: number
    overallInfluence: number
  }
  derivativeBreakdown: Array<{
    derivativeId: string
    similarityScore: number
    qualityRatio: number
    engagementRatio: number
  }>
  trendsAnalysis: {
    creationRate: number
    qualityTrend: 'improving' | 'stable' | 'declining'
    popularityTrend: 'rising' | 'stable' | 'falling'
  }
}

export interface QualityAssessment {
  storyId: string
  qualityMetrics: {
    overallScore: number
    readabilityScore: number
    engagementScore: number
    originalityScore: number
    completionScore: number
  }
  comparisonToOriginal?: {
    originalStoryId: string
    qualityRatio: number
    strengthsOverOriginal: string[]
    areasForImprovement: string[]
  }
  recommendations: string[]
  assessmentTimestamp: string
}

export interface BatchSimilarityOptions {
  sourceStoryId: string
  sourceChapterId: string
  candidateStories?: string[]
  similarityThreshold?: number
  maxResults?: number
  includeConfidenceAnalysis?: boolean
}

/**
 * Content Analysis Service - Phase 3.1.2 Implementation
 * Provides comprehensive derivative detection, influence scoring, and quality assessment
 */
export class ContentAnalysisService {
  private embeddingCache = new Map<string, ContentEmbedding>()
  private similarityCache = new Map<string, SimilarityAnalysisResult>()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Analyze content similarity between original and potential derivative
   */
  async analyzeContentSimilarity(
    originalStoryId: string,
    originalChapterId: string,
    derivativeStoryId: string,
    derivativeChapterId: string
  ): Promise<SimilarityAnalysisResult> {
    try {
      // Create cache key for this analysis
      const cacheKey = `${originalStoryId}:${originalChapterId}:${derivativeStoryId}:${derivativeChapterId}`
      
      // Check cache first
      if (this.similarityCache.has(cacheKey)) {
        const cached = this.similarityCache.get(cacheKey)!
        console.log('📊 Using cached similarity analysis')
        return cached
      }

      // Get content for both stories
      const [originalContent, derivativeContent] = await Promise.all([
        this.getStoryContent(originalStoryId, originalChapterId),
        this.getStoryContent(derivativeStoryId, derivativeChapterId)
      ])

      if (!originalContent || !derivativeContent) {
        throw new Error('Unable to retrieve content for similarity analysis')
      }

      // Perform similarity analysis using OpenAI
      const analysis = await analyzeContentSimilarity(originalContent, derivativeContent)

      // Cache the result
      this.similarityCache.set(cacheKey, analysis)
      console.log(`📊 Similarity analysis complete: ${(analysis.similarityScore * 100).toFixed(1)}% similar`)

      return analysis
    } catch (error) {
      console.error('Content similarity analysis error:', error)
      throw new Error(`Failed to analyze content similarity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Detect potential derivatives of a given story using batch similarity analysis
   */
  async detectPotentialDerivatives(options: BatchSimilarityOptions): Promise<DerivativeDetectionResult> {
    try {
      const {
        sourceStoryId,
        sourceChapterId,
        candidateStories,
        similarityThreshold = 0.3,
        maxResults = 20,
        includeConfidenceAnalysis = true
      } = options

      console.log(`🔍 Detecting derivatives for story ${sourceStoryId}, chapter ${sourceChapterId}`)

      // Get source content
      const sourceContent = await this.getStoryContent(sourceStoryId, sourceChapterId)
      if (!sourceContent) {
        throw new Error('Source content not found')
      }

      // Get candidate stories (if not specified, get all published stories)
      let candidates = candidateStories
      if (!candidates) {
        candidates = await this.getAllPublishedStoryIds()
      }

      // Filter out the source story itself
      candidates = candidates.filter(id => id !== sourceStoryId)

      const potentialDerivatives: DerivativeDetectionResult['potentialDerivatives'] = []
      let totalAnalyzed = 0

      // Analyze each candidate story
      for (const candidateId of candidates.slice(0, 100)) { // Limit to prevent excessive API calls
        try {
          // Get first chapter of candidate story for analysis
          const candidateContent = await this.getStoryContent(candidateId, '1')
          if (!candidateContent) continue

          totalAnalyzed++

          // Perform similarity analysis
          const analysis = await analyzeContentSimilarity(sourceContent, candidateContent)

          // Check if similarity exceeds threshold
          if (analysis.similarityScore >= similarityThreshold) {
            potentialDerivatives.push({
              storyId: candidateId,
              chapterId: '1',
              similarityScore: analysis.similarityScore,
              confidence: analysis.confidence,
              analysisDetails: analysis
            })
          }

          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error analyzing candidate ${candidateId}:`, error)
          continue
        }
      }

      // Sort by similarity score (highest first)
      potentialDerivatives.sort((a, b) => b.similarityScore - a.similarityScore)

      // Limit results
      const finalResults = potentialDerivatives.slice(0, maxResults)
      const highConfidenceMatches = finalResults.filter(d => d.confidence > 0.7).length

      console.log(`🔍 Derivative detection complete: ${finalResults.length} potential derivatives found`)

      return {
        potentialDerivatives: finalResults,
        analysisMetadata: {
          sourceStoryId,
          sourceChapterId,
          analysisTimestamp: new Date().toISOString(),
          totalAnalyzed,
          highConfidenceMatches
        }
      }
    } catch (error) {
      console.error('Derivative detection error:', error)
      throw new Error(`Failed to detect derivatives: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate influence score for a story based on its derivatives
   */
  async calculateInfluenceScore(storyId: string): Promise<InfluenceScore> {
    try {
      console.log(`📈 Calculating influence score for story ${storyId}`)

      // Get all potential derivatives of this story
      const derivativeResults = await this.detectPotentialDerivatives({
        sourceStoryId: storyId,
        sourceChapterId: '1',
        similarityThreshold: 0.2, // Lower threshold for influence analysis
        maxResults: 50
      })

      const derivatives = derivativeResults.potentialDerivatives

      if (derivatives.length === 0) {
        return {
          storyId,
          influenceMetrics: {
            totalDerivatives: 0,
            averageSimilarity: 0,
            qualityScore: 0,
            reachScore: 0,
            overallInfluence: 0
          },
          derivativeBreakdown: [],
          trendsAnalysis: {
            creationRate: 0,
            qualityTrend: 'stable',
            popularityTrend: 'stable'
          }
        }
      }

      // Calculate metrics
      const totalDerivatives = derivatives.length
      const averageSimilarity = derivatives.reduce((sum, d) => sum + d.similarityScore, 0) / totalDerivatives

      // Get quality and engagement data for derivatives
      const derivativeBreakdown = await Promise.all(
        derivatives.map(async (derivative) => {
          try {
            const qualityAssessment = await this.assessDerivativeQuality(derivative.storyId, storyId)
            const engagementData = await this.getStoryEngagement(derivative.storyId)
            
            return {
              derivativeId: derivative.storyId,
              similarityScore: derivative.similarityScore,
              qualityRatio: qualityAssessment?.qualityMetrics.overallScore || 0.5,
              engagementRatio: this.normalizeEngagement(engagementData)
            }
          } catch (error) {
            console.error(`Error analyzing derivative ${derivative.storyId}:`, error)
            return {
              derivativeId: derivative.storyId,
              similarityScore: derivative.similarityScore,
              qualityRatio: 0.5,
              engagementRatio: 0.5
            }
          }
        })
      )

      // Calculate composite scores
      const qualityScore = derivativeBreakdown.reduce((sum, d) => sum + d.qualityRatio, 0) / derivativeBreakdown.length
      const reachScore = derivativeBreakdown.reduce((sum, d) => sum + d.engagementRatio, 0) / derivativeBreakdown.length

      // Calculate overall influence (weighted combination)
      const overallInfluence = this.calculateOverallInfluence({
        totalDerivatives,
        averageSimilarity,
        qualityScore,
        reachScore
      })

      // Analyze trends (simplified for initial implementation)
      const trendsAnalysis = this.analyzeTrends(derivativeBreakdown)

      console.log(`📈 Influence calculation complete: ${(overallInfluence * 100).toFixed(1)}% influence score`)

      return {
        storyId,
        influenceMetrics: {
          totalDerivatives,
          averageSimilarity,
          qualityScore,
          reachScore,
          overallInfluence
        },
        derivativeBreakdown,
        trendsAnalysis
      }
    } catch (error) {
      console.error('Influence score calculation error:', error)
      throw new Error(`Failed to calculate influence score: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Assess quality of derivative content compared to original
   */
  async assessDerivativeQuality(derivativeStoryId: string, originalStoryId?: string): Promise<QualityAssessment> {
    try {
      console.log(`🎯 Assessing quality for story ${derivativeStoryId}`)

      // Get derivative content and metadata
      const derivativeContent = await this.getStoryContent(derivativeStoryId, '1')
      const derivativeMetadata = await this.getStoryMetadata(derivativeStoryId)

      if (!derivativeContent || !derivativeMetadata) {
        throw new Error('Unable to retrieve derivative content or metadata')
      }

      // Calculate quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(derivativeContent, derivativeMetadata)

      let comparisonToOriginal: QualityAssessment['comparisonToOriginal']
      
      // If original story provided, perform comparison
      if (originalStoryId) {
        const originalContent = await this.getStoryContent(originalStoryId, '1')
        const originalMetadata = await this.getStoryMetadata(originalStoryId)
        
        if (originalContent && originalMetadata) {
          const originalQuality = await this.calculateQualityMetrics(originalContent, originalMetadata)
          
          comparisonToOriginal = {
            originalStoryId,
            qualityRatio: qualityMetrics.overallScore / originalQuality.overallScore,
            strengthsOverOriginal: this.identifyStrengths(qualityMetrics, originalQuality),
            areasForImprovement: this.identifyImprovements(qualityMetrics, originalQuality)
          }
        }
      }

      // Generate recommendations
      const recommendations = this.generateQualityRecommendations(qualityMetrics, comparisonToOriginal)

      return {
        storyId: derivativeStoryId,
        qualityMetrics,
        comparisonToOriginal,
        recommendations,
        assessmentTimestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Quality assessment error:', error)
      throw new Error(`Failed to assess quality: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Batch similarity analysis for multiple story pairs
   */
  async batchSimilarityAnalysis(
    storyPairs: Array<{
      originalId: string
      originalChapter: string
      derivativeId: string
      derivativeChapter: string
    }>
  ): Promise<SimilarityAnalysisResult[]> {
    const results: SimilarityAnalysisResult[] = []
    
    console.log(`🔄 Running batch similarity analysis for ${storyPairs.length} pairs`)

    for (const pair of storyPairs) {
      try {
        const result = await this.analyzeContentSimilarity(
          pair.originalId,
          pair.originalChapter,
          pair.derivativeId,
          pair.derivativeChapter
        )
        results.push(result)
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error analyzing pair ${pair.originalId}:${pair.derivativeId}:`, error)
        continue
      }
    }

    console.log(`🔄 Batch analysis complete: ${results.length} successful analyses`)
    return results
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async getStoryContent(storyId: string, chapterId: string): Promise<string | null> {
    try {
      // Use dataService to get story content
      const story = await dataService.getIPEnhancedStory(storyId)
      if (!story) return null

      const chapter = story.chapters?.find(c => c.chapterNumber.toString() === chapterId)
      return chapter?.content || null
    } catch (error) {
      console.error(`Error getting story content ${storyId}:${chapterId}:`, error)
      return null
    }
  }

  private async getStoryMetadata(storyId: string): Promise<any> {
    try {
      return await dataService.getIPEnhancedStory(storyId)
    } catch (error) {
      console.error(`Error getting story metadata ${storyId}:`, error)
      return null
    }
  }

  private async getAllPublishedStoryIds(): Promise<string[]> {
    try {
      // Get all published stories from dataService
      const stories = await dataService.getAllStories()
      return stories.map(story => story.storyId)
    } catch (error) {
      console.error('Error getting published story IDs:', error)
      return []
    }
  }

  private async getStoryEngagement(storyId: string): Promise<{ reads: number; completion: number; rating: number }> {
    try {
      const story = await this.getStoryMetadata(storyId)
      return {
        reads: story?.analytics?.totalReads || 0,
        completion: story?.analytics?.completionRate || 0,
        rating: story?.analytics?.averageRating || 0
      }
    } catch (error) {
      return { reads: 0, completion: 0, rating: 0 }
    }
  }

  private normalizeEngagement(engagement: { reads: number; completion: number; rating: number }): number {
    // Normalize engagement metrics to 0-1 scale
    const readScore = Math.min(engagement.reads / 1000, 1) // Normalize reads (cap at 1000)
    const completionScore = engagement.completion / 100 // Completion rate as percentage
    const ratingScore = engagement.rating / 5 // Rating out of 5
    
    return (readScore + completionScore + ratingScore) / 3
  }

  private calculateOverallInfluence(metrics: {
    totalDerivatives: number
    averageSimilarity: number
    qualityScore: number
    reachScore: number
  }): number {
    const weights = {
      quantity: 0.3,    // 30% - number of derivatives
      similarity: 0.2,  // 20% - how similar derivatives are
      quality: 0.3,     // 30% - quality of derivatives
      reach: 0.2        // 20% - reach/engagement of derivatives
    }

    const quantityScore = Math.min(metrics.totalDerivatives / 10, 1) // Normalize (cap at 10 derivatives)
    
    return (
      quantityScore * weights.quantity +
      metrics.averageSimilarity * weights.similarity +
      metrics.qualityScore * weights.quality +
      metrics.reachScore * weights.reach
    )
  }

  private analyzeTrends(derivativeData: Array<{ qualityRatio: number; engagementRatio: number }>): InfluenceScore['trendsAnalysis'] {
    // Simplified trend analysis for initial implementation
    const avgQuality = derivativeData.reduce((sum, d) => sum + d.qualityRatio, 0) / derivativeData.length
    const avgEngagement = derivativeData.reduce((sum, d) => sum + d.engagementRatio, 0) / derivativeData.length
    
    return {
      creationRate: derivativeData.length, // Simplified: just count for now
      qualityTrend: avgQuality > 0.6 ? 'improving' : avgQuality > 0.4 ? 'stable' : 'declining',
      popularityTrend: avgEngagement > 0.6 ? 'rising' : avgEngagement > 0.4 ? 'stable' : 'falling'
    }
  }

  private async calculateQualityMetrics(content: string, metadata: any): Promise<QualityAssessment['qualityMetrics']> {
    // Calculate various quality metrics
    const readabilityScore = this.calculateReadabilityScore(content)
    const engagementScore = this.calculateEngagementScore(metadata)
    const originalityScore = this.calculateOriginalityScore(content)
    const completionScore = this.calculateCompletionScore(metadata)
    
    const overallScore = (readabilityScore + engagementScore + originalityScore + completionScore) / 4
    
    return {
      overallScore,
      readabilityScore,
      engagementScore,
      originalityScore,
      completionScore
    }
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified readability calculation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/)
    const avgWordsPerSentence = words.length / sentences.length
    
    // Ideal range: 15-20 words per sentence
    const idealRange = avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20
    return idealRange ? 0.8 : Math.max(0.4, 1 - Math.abs(avgWordsPerSentence - 17.5) / 20)
  }

  private calculateEngagementScore(metadata: any): number {
    const reads = metadata?.analytics?.totalReads || 0
    const completion = metadata?.analytics?.completionRate || 0
    const rating = metadata?.analytics?.averageRating || 0
    
    return (
      Math.min(reads / 100, 1) * 0.3 +
      (completion / 100) * 0.4 +
      (rating / 5) * 0.3
    )
  }

  private calculateOriginalityScore(content: string): number {
    // Simplified originality assessment based on vocabulary diversity
    const words = content.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words)
    const vocabularyDiversity = uniqueWords.size / words.length
    
    // Higher vocabulary diversity suggests more originality
    return Math.min(vocabularyDiversity * 2, 1)
  }

  private calculateCompletionScore(metadata: any): number {
    const chapters = metadata?.chapters?.length || 0
    const completedChapters = metadata?.chapters?.filter((c: any) => c.content && c.content.length > 500).length || 0
    
    if (chapters === 0) return 0
    return completedChapters / chapters
  }

  private identifyStrengths(derivativeQuality: any, originalQuality: any): string[] {
    const strengths: string[] = []
    
    if (derivativeQuality.readabilityScore > originalQuality.readabilityScore) {
      strengths.push('Improved readability and flow')
    }
    if (derivativeQuality.engagementScore > originalQuality.engagementScore) {
      strengths.push('Higher reader engagement')
    }
    if (derivativeQuality.originalityScore > originalQuality.originalityScore) {
      strengths.push('More original vocabulary and expression')
    }
    if (derivativeQuality.completionScore > originalQuality.completionScore) {
      strengths.push('Better story completion and structure')
    }
    
    return strengths.length > 0 ? strengths : ['Maintains quality standards of original']
  }

  private identifyImprovements(derivativeQuality: any, originalQuality: any): string[] {
    const improvements: string[] = []
    
    if (derivativeQuality.readabilityScore < originalQuality.readabilityScore) {
      improvements.push('Simplify sentence structure for better readability')
    }
    if (derivativeQuality.engagementScore < originalQuality.engagementScore) {
      improvements.push('Increase narrative tension and reader engagement')
    }
    if (derivativeQuality.originalityScore < originalQuality.originalityScore) {
      improvements.push('Expand vocabulary and unique expressions')
    }
    if (derivativeQuality.completionScore < originalQuality.completionScore) {
      improvements.push('Improve story structure and chapter completion')
    }
    
    return improvements
  }

  private generateQualityRecommendations(qualityMetrics: any, comparison?: any): string[] {
    const recommendations: string[] = []
    
    if (qualityMetrics.readabilityScore < 0.6) {
      recommendations.push('Consider shorter sentences and simpler vocabulary for better readability')
    }
    if (qualityMetrics.engagementScore < 0.6) {
      recommendations.push('Add more compelling plot elements and character development')
    }
    if (qualityMetrics.originalityScore < 0.6) {
      recommendations.push('Expand vocabulary and use more unique expressions')
    }
    if (qualityMetrics.completionScore < 0.8) {
      recommendations.push('Focus on completing all planned chapters with substantial content')
    }
    
    if (comparison && comparison.qualityRatio < 0.8) {
      recommendations.push('Study the original work to understand what made it successful')
    }
    
    return recommendations.length > 0 ? recommendations : ['Story quality is excellent - keep up the great work!']
  }
}

// Export singleton instance
export const contentAnalysisService = new ContentAnalysisService()
export default contentAnalysisService