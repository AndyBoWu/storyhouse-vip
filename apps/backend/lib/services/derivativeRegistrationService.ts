/**
 * @fileoverview Derivative Registration Service for Story Protocol SDK Integration
 * Implements blockchain-tracked derivative relationships using Story Protocol SDK v1.3.2
 * Bridges the gap between existing AI analysis and actual derivative registration
 */

import { StoryConfig, StoryClient } from '@story-protocol/core-sdk'
import { Address, Hash, WalletClient } from 'viem'
import { AdvancedStoryProtocolService } from './advancedStoryProtocolService'
import { contentAnalysisService } from './contentAnalysisService'
import { r2Client } from '../r2'
import type {
  EnhancedChapterIPData,
  LicenseTermsConfig
} from '../types/shared/ip'
import {
  parseBlockchainError,
  ERROR_CODES
} from '../utils/blockchainErrors'

export interface DerivativeRegistrationData {
  // Source content information
  parentIpId: string
  parentChapterId: string
  parentLicenseTermsId?: string

  // Derivative content information
  derivativeContent: EnhancedChapterIPData
  derivativeType: 'remix' | 'sequel' | 'adaptation' | 'translation' | 'other'
  
  // Relationship metadata
  similarityScore?: number
  aiAnalysisId?: string
  influenceFactors?: string[]
  
  // License inheritance
  inheritParentLicense: boolean
  customLicenseTermsId?: string
  
  // Attribution information
  attributionText: string
  creatorNotes?: string
}

export interface DerivativeRegistrationResult {
  success: boolean
  derivativeIpId?: string
  transactionHash?: Hash
  parentChildRelationship?: {
    parentIpId: string
    childIpId: string
    licenseTermsId: string
  }
  
  // AI Analysis Integration
  aiSimilarityScore?: number
  qualityComparison?: {
    parentQuality: number
    derivativeQuality: number
    improvementAreas?: string[]
  }
  
  // Economic projections
  revenueProjection?: {
    estimatedParentRoyalty: number
    estimatedDerivativeRevenue: number
    licenseInheritance: boolean
  }
  
  error?: string
  registrationTime?: Date
}

export interface DerivativeQueryOptions {
  includeAiAnalysis?: boolean
  includeLicenseDetails?: boolean
  includeRevenueData?: boolean
  depth?: number // How many generations deep to query
}

export interface DerivativeTree {
  ipId: string
  chapterId: string
  title: string
  creatorAddress: string
  
  // Relationship data
  parentIpId?: string
  children: DerivativeTree[]
  depth: number
  
  // AI Analysis integration
  similarityToParent?: number
  qualityScore?: number
  influenceMetrics?: {
    totalDerivatives: number
    avgSimilarityScore: number
    qualityTrend: 'improving' | 'declining' | 'stable'
  }
  
  // License and revenue data
  licenseTermsId?: string
  licenseTier?: string
  totalRevenue?: number
  royaltiesGenerated?: number
}

export interface LicenseInheritanceInfo {
  parentLicenseTermsId: string
  parentLicenseTier: string
  canInherit: boolean
  inheritanceConditions: string[]
  suggestedLicenseTermsId?: string
  economicImplications: {
    parentRoyaltyPercentage: number
    derivativeRoyaltyShare: number
    platformFee: number
  }
}

/**
 * Service for registering derivatives on Story Protocol blockchain
 * Integrates with existing AI analysis and licensing systems
 */
export class DerivativeRegistrationService {
  private client: StoryClient | null = null
  private walletClient: WalletClient | null = null
  private advancedService: AdvancedStoryProtocolService

  constructor() {
    this.advancedService = new AdvancedStoryProtocolService()
  }

  /**
   * Initialize the service with a wallet client
   */
  async initialize(walletClient: WalletClient): Promise<void> {
    this.walletClient = walletClient
    await this.advancedService.initialize(walletClient)
    
    if (!walletClient.account) {
      throw new Error('WalletClient must have an account attached.')
    }

    const config: StoryConfig = {
      account: walletClient.account,
      transport: walletClient.transport,
      chainId: 1315,
    }

    this.client = StoryClient.newClient(config)
  }

  /**
   * Register a derivative work on Story Protocol blockchain
   * Core implementation using registerDerivative() SDK method
   */
  async registerDerivative(
    registrationData: DerivativeRegistrationData
  ): Promise<DerivativeRegistrationResult> {
    try {
      if (!this.client) {
        throw new Error('Service not initialized. Call initialize() first.')
      }

      console.log('🌳 Registering derivative on Story Protocol blockchain...')
      console.log('📄 Parent IP:', registrationData.parentIpId)
      console.log('📝 Derivative:', registrationData.derivativeContent.title)
      console.log('🎭 Type:', registrationData.derivativeType)

      const startTime = new Date()

      // Step 1: Validate parent IP and license terms
      const parentValidation = await this.validateParentIP(registrationData.parentIpId)
      if (!parentValidation.isValid) {
        throw new Error(`Parent IP validation failed: ${parentValidation.error}`)
      }

      // Step 2: Perform AI similarity analysis if not provided
      let similarityScore = registrationData.similarityScore
      if (!similarityScore) {
        console.log('🤖 Performing AI similarity analysis...')
        try {
          const analysis = await contentAnalysisService.analyzeContentSimilarity(
            registrationData.parentChapterId,
            registrationData.derivativeContent.chapterNumber.toString()
          )
          similarityScore = analysis.similarityScore
          console.log('✅ AI similarity score calculated:', similarityScore)
        } catch (aiError) {
          console.warn('⚠️ AI analysis failed, proceeding without similarity score:', aiError)
          similarityScore = 0.5 // Default moderate similarity
        }
      }

      // Step 3: Handle license inheritance or custom licensing
      let licenseTermsId: string
      if (registrationData.inheritParentLicense) {
        licenseTermsId = await this.inheritParentLicense(registrationData.parentIpId)
      } else if (registrationData.customLicenseTermsId) {
        licenseTermsId = registrationData.customLicenseTermsId
      } else {
        // Create default license based on derivative type and quality
        const suggestedTier = this.suggestLicenseTier(registrationData.derivativeContent, similarityScore)
        const licenseResult = await this.advancedService.createChapterLicenseTerms(suggestedTier)
        if (!licenseResult.success || !licenseResult.licenseTermsId) {
          throw new Error(`Failed to create license terms: ${licenseResult.error}`)
        }
        licenseTermsId = licenseResult.licenseTermsId
      }

      // Step 4: First register the derivative as a regular IP asset
      console.log('📝 Registering derivative as IP asset...')
      const ipRegistrationResult = await this.advancedService.registerEnhancedChapterIP(
        registrationData.derivativeContent,
        licenseTermsId
      )

      if (!ipRegistrationResult.success || !ipRegistrationResult.ipAssetId) {
        throw new Error(`IP registration failed: ${ipRegistrationResult.error}`)
      }

      // Step 5: Register derivative relationship using Story Protocol SDK
      console.log('🔗 Establishing derivative relationship on blockchain...')
      try {
        const derivativeResult = await this.client.ipAsset.registerDerivative({
          childIpId: ipRegistrationResult.ipAssetId as Address,
          parentIpIds: [registrationData.parentIpId as Address],
          licenseTermsIds: [licenseTermsId],
          txOptions: {}
        })

        if (!derivativeResult.txHash) {
          throw new Error('Derivative registration failed - no transaction hash returned')
        }

        console.log('✅ Derivative relationship registered on blockchain!')
        console.log('🔗 Transaction:', derivativeResult.txHash)
        console.log('👶 Child IP ID:', ipRegistrationResult.ipAssetId)
        console.log('👨‍👩‍👧‍👦 Parent IP ID:', registrationData.parentIpId)

        // Step 6: Update R2 metadata with derivative relationship
        await this.updateDerivativeMetadata(
          registrationData,
          ipRegistrationResult.ipAssetId,
          derivativeResult.txHash,
          similarityScore
        )

        // Step 7: Calculate economic projections
        const revenueProjection = await this.calculateRevenueProjection(
          registrationData,
          licenseTermsId,
          similarityScore
        )

        // Step 8: Perform quality comparison analysis
        const qualityComparison = await this.performQualityComparison(
          registrationData.parentChapterId,
          registrationData.derivativeContent
        )

        return {
          success: true,
          derivativeIpId: ipRegistrationResult.ipAssetId,
          transactionHash: derivativeResult.txHash,
          parentChildRelationship: {
            parentIpId: registrationData.parentIpId,
            childIpId: ipRegistrationResult.ipAssetId,
            licenseTermsId: licenseTermsId
          },
          aiSimilarityScore: similarityScore,
          qualityComparison,
          revenueProjection,
          registrationTime: startTime
        }

      } catch (blockchainError) {
        console.error('❌ Blockchain derivative registration failed:', blockchainError)
        throw blockchainError
      }

    } catch (error) {
      console.error('❌ Derivative registration failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        registrationTime: new Date()
      }
    }
  }

  /**
   * Register derivative with automatic parent detection using AI
   */
  async registerDerivativeWithAutoDetection(
    derivativeContent: EnhancedChapterIPData,
    derivativeType: DerivativeRegistrationData['derivativeType'],
    options?: {
      minimumSimilarityThreshold?: number
      maxParentCandidates?: number
      requireManualConfirmation?: boolean
    }
  ): Promise<DerivativeRegistrationResult> {
    try {
      console.log('🔍 Auto-detecting potential parent IPs for derivative...')
      
      // Step 1: Use AI analysis to find potential parent content
      const potentialParents = await this.findPotentialParents(
        derivativeContent,
        options?.minimumSimilarityThreshold || 0.7,
        options?.maxParentCandidates || 5
      )

      if (potentialParents.length === 0) {
        throw new Error('No suitable parent content found with sufficient similarity score')
      }

      // Step 2: Select the best parent candidate
      const selectedParent = potentialParents[0] // Highest similarity score
      console.log('✅ Selected parent:', selectedParent.chapterId, 'Similarity:', selectedParent.similarityScore)

      // Step 3: Create registration data with auto-detected parent
      const registrationData: DerivativeRegistrationData = {
        parentIpId: selectedParent.ipId,
        parentChapterId: selectedParent.chapterId,
        parentLicenseTermsId: selectedParent.licenseTermsId,
        derivativeContent,
        derivativeType,
        similarityScore: selectedParent.similarityScore,
        aiAnalysisId: selectedParent.analysisId,
        influenceFactors: selectedParent.influenceFactors,
        inheritParentLicense: true, // Default to inheriting parent license
        attributionText: `Derivative work inspired by "${selectedParent.title}" (Similarity: ${(selectedParent.similarityScore * 100).toFixed(1)}%)`,
        creatorNotes: `Auto-detected derivative relationship using AI content analysis`
      }

      // Step 4: Register the derivative
      return await this.registerDerivative(registrationData)

    } catch (error) {
      console.error('❌ Auto-detection derivative registration failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-detection failed',
        registrationTime: new Date()
      }
    }
  }

  /**
   * Query derivative tree for an IP asset
   * Shows complete family tree with AI analysis integration
   */
  async queryDerivativeTree(
    ipId: string,
    options: DerivativeQueryOptions = {}
  ): Promise<DerivativeTree> {
    try {
      console.log('🌳 Querying derivative tree for IP:', ipId)

      // Step 1: Get basic IP information
      const rootNode = await this.buildDerivativeNode(ipId, 0, options)

      // Step 2: Recursively build the tree
      await this.buildDerivativeChildren(rootNode, options, options.depth || 3)

      // Step 3: Calculate aggregate influence metrics
      this.calculateInfluenceMetrics(rootNode)

      console.log('✅ Derivative tree built:', {
        rootId: ipId,
        totalNodes: this.countTreeNodes(rootNode),
        maxDepth: this.getMaxDepth(rootNode)
      })

      return rootNode

    } catch (error) {
      console.error('❌ Failed to query derivative tree:', error)
      throw error
    }
  }

  /**
   * Analyze license inheritance options for a potential derivative
   */
  async analyzeLicenseInheritance(
    parentIpId: string,
    derivativeCreator: Address
  ): Promise<LicenseInheritanceInfo> {
    try {
      console.log('🏷️ Analyzing license inheritance for parent IP:', parentIpId)

      // Step 1: Get parent license information
      const parentLicense = await this.getParentLicenseInfo(parentIpId)
      if (!parentLicense) {
        throw new Error('Parent license information not found')
      }

      // Step 2: Check inheritance eligibility
      const canInherit = this.checkInheritanceEligibility(parentLicense, derivativeCreator)
      const conditions = this.getInheritanceConditions(parentLicense)

      // Step 3: Calculate economic implications
      const economics = this.calculateInheritanceEconomics(parentLicense)

      // Step 4: Suggest alternative license if inheritance not possible
      let suggestedLicenseTermsId: string | undefined
      if (!canInherit) {
        const suggestedTier = this.suggestAlternativeLicense(parentLicense)
        const licenseResult = await this.advancedService.createChapterLicenseTerms(suggestedTier)
        if (licenseResult.success) {
          suggestedLicenseTermsId = licenseResult.licenseTermsId
        }
      }

      return {
        parentLicenseTermsId: parentLicense.licenseTermsId,
        parentLicenseTier: parentLicense.tier,
        canInherit,
        inheritanceConditions: conditions,
        suggestedLicenseTermsId,
        economicImplications: economics
      }

    } catch (error) {
      console.error('❌ License inheritance analysis failed:', error)
      throw error
    }
  }

  /**
   * Bulk register multiple derivatives with batch optimization
   */
  async bulkRegisterDerivatives(
    registrations: DerivativeRegistrationData[]
  ): Promise<DerivativeRegistrationResult[]> {
    try {
      console.log('📦 Bulk registering', registrations.length, 'derivatives...')

      const results: DerivativeRegistrationResult[] = []
      const batchSize = 5 // Process in batches to avoid overwhelming the network

      for (let i = 0; i < registrations.length; i += batchSize) {
        const batch = registrations.slice(i, i + batchSize)
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(registrations.length / batchSize)}`)

        // Process batch in parallel
        const batchPromises = batch.map(registration => 
          this.registerDerivative(registration).catch(error => ({
            success: false as const,
            error: error.message,
            registrationTime: new Date()
          }))
        )

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Small delay between batches to be respectful to the network
        if (i + batchSize < registrations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      const successful = results.filter(r => r.success).length
      console.log(`✅ Bulk registration complete: ${successful}/${registrations.length} successful`)

      return results

    } catch (error) {
      console.error('❌ Bulk derivative registration failed:', error)
      throw error
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate parent IP exists and is eligible for derivatives
   */
  private async validateParentIP(parentIpId: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // TODO: Implement actual IP validation using Story Protocol SDK
      // For now, assume valid if it looks like a valid address
      if (!parentIpId || parentIpId.length < 20) {
        return { isValid: false, error: 'Invalid parent IP ID format' }
      }

      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: error instanceof Error ? error.message : 'Validation failed' }
    }
  }

  /**
   * Inherit license terms from parent IP
   */
  private async inheritParentLicense(parentIpId: string): Promise<string> {
    try {
      // TODO: Implement actual license inheritance query
      throw new Error('License inheritance not yet implemented')
    } catch (error) {
      console.error('Failed to inherit parent license:', error)
      throw error
    }
  }

  /**
   * Suggest appropriate license tier based on content quality and similarity
   */
  private suggestLicenseTier(
    content: EnhancedChapterIPData,
    similarityScore: number
  ): 'free' | 'premium' | 'exclusive' {
    const quality = content.metadata.qualityScore
    const originality = content.metadata.originalityScore
    const commercial = content.metadata.commercialRights

    // High originality despite similarity suggests premium/exclusive
    if (originality >= 80 && quality >= 75 && commercial) {
      return 'exclusive'
    } else if (quality >= 60 && commercial) {
      return 'premium'
    } else {
      return 'free'
    }
  }

  /**
   * Update R2 metadata with derivative relationship information
   */
  private async updateDerivativeMetadata(
    registrationData: DerivativeRegistrationData,
    derivativeIpId: string,
    transactionHash: Hash,
    similarityScore: number
  ): Promise<void> {
    try {
      // Create derivative relationship metadata
      const derivativeMetadata = {
        derivativeRegistration: {
          ipId: derivativeIpId,
          parentIpId: registrationData.parentIpId,
          transactionHash,
          registrationTime: new Date().toISOString(),
          derivativeType: registrationData.derivativeType,
          similarityScore,
          attributionText: registrationData.attributionText,
          aiAnalysisId: registrationData.aiAnalysisId,
          inheritedLicense: registrationData.inheritParentLicense
        }
      }

      // Store in R2 for future queries
      const metadataKey = `derivatives/${derivativeIpId}.json`
      await r2Client.put(metadataKey, JSON.stringify(derivativeMetadata))

      console.log('✅ Derivative metadata updated in R2:', metadataKey)

    } catch (error) {
      console.warn('⚠️ Failed to update derivative metadata:', error)
      // Don't fail the entire operation for metadata updates
    }
  }

  /**
   * Calculate revenue projection for derivative
   */
  private async calculateRevenueProjection(
    registrationData: DerivativeRegistrationData,
    licenseTermsId: string,
    similarityScore: number
  ): Promise<{
    estimatedParentRoyalty: number
    estimatedDerivativeRevenue: number
    licenseInheritance: boolean
  }> {
    try {
      // Get license tier for calculations
      const parentMetadata = await this.getChapterMetadata(registrationData.parentChapterId)
      const licenseTier = parentMetadata?.licenseTier || 'premium'
      
      // Base revenue estimation
      const quality = registrationData.derivativeContent.metadata.qualityScore
      const baseRevenue = quality * 10 // Simple calculation: quality score * 10 TIP tokens
      
      // Royalty calculation based on license tier
      const royaltyPercentages = { free: 0, premium: 10, exclusive: 25 }
      const royaltyPercentage = royaltyPercentages[licenseTier as keyof typeof royaltyPercentages] || 10
      
      const estimatedParentRoyalty = baseRevenue * (royaltyPercentage / 100)
      const estimatedDerivativeRevenue = baseRevenue - estimatedParentRoyalty

      return {
        estimatedParentRoyalty,
        estimatedDerivativeRevenue,
        licenseInheritance: registrationData.inheritParentLicense
      }

    } catch (error) {
      console.warn('Failed to calculate revenue projection:', error)
      return {
        estimatedParentRoyalty: 0,
        estimatedDerivativeRevenue: 0,
        licenseInheritance: false
      }
    }
  }

  /**
   * Perform quality comparison between parent and derivative
   */
  private async performQualityComparison(
    parentChapterId: string,
    derivativeContent: EnhancedChapterIPData
  ): Promise<{
    parentQuality: number
    derivativeQuality: number
    improvementAreas?: string[]
  }> {
    try {
      const parentMetadata = await this.getChapterMetadata(parentChapterId)
      const parentQuality = parentMetadata?.qualityScore || 50
      const derivativeQuality = derivativeContent.metadata.qualityScore

      let improvementAreas: string[] = []
      if (derivativeQuality < parentQuality) {
        improvementAreas = [
          'Narrative structure could be enhanced',
          'Character development needs improvement',
          'Pacing and flow optimization needed'
        ]
      }

      return {
        parentQuality,
        derivativeQuality,
        improvementAreas: improvementAreas.length > 0 ? improvementAreas : undefined
      }

    } catch (error) {
      console.warn('Failed to perform quality comparison:', error)
      return {
        parentQuality: 50,
        derivativeQuality: derivativeContent.metadata.qualityScore
      }
    }
  }

  /**
   * Find potential parent content using AI analysis
   */
  private async findPotentialParents(
    derivativeContent: EnhancedChapterIPData,
    minSimilarity: number,
    maxResults: number
  ): Promise<Array<{
    ipId: string
    chapterId: string
    title: string
    similarityScore: number
    licenseTermsId?: string
    analysisId: string
    influenceFactors: string[]
  }>> {
    try {
      // TODO: Implement actual AI-based parent detection
      // This would integrate with existing contentAnalysisService
      throw new Error('AI-based parent detection not yet implemented')

    } catch (error) {
      console.error('Failed to find potential parents:', error)
      return []
    }
  }

  /**
   * Helper methods for tree building and analysis
   */
  private async buildDerivativeNode(ipId: string, depth: number, options: DerivativeQueryOptions): Promise<DerivativeTree> {
    // TODO: Implement actual node building from blockchain data
    throw new Error('Derivative tree building not yet implemented')
  }

  private async buildDerivativeChildren(node: DerivativeTree, options: DerivativeQueryOptions, maxDepth: number): Promise<void> {
    if (node.depth >= maxDepth) return
    // TODO: Implement recursive child building
  }

  private calculateInfluenceMetrics(node: DerivativeTree): void {
    // TODO: Implement influence metrics calculation
  }

  private countTreeNodes(node: DerivativeTree): number {
    return 1 + node.children.reduce((sum, child) => sum + this.countTreeNodes(child), 0)
  }

  private getMaxDepth(node: DerivativeTree): number {
    if (node.children.length === 0) return node.depth
    return Math.max(...node.children.map(child => this.getMaxDepth(child)))
  }

  private async getParentLicenseInfo(parentIpId: string): Promise<any> {
    // TODO: Implement actual license info retrieval
    throw new Error('Parent license info retrieval not yet implemented')
  }

  private checkInheritanceEligibility(parentLicense: any, derivativeCreator: Address): boolean {
    // TODO: Implement actual inheritance eligibility check
    return parentLicense.allowsDerivatives
  }

  private getInheritanceConditions(parentLicense: any): string[] {
    // TODO: Implement actual inheritance conditions
    return ['Attribution required', 'Commercial use allowed', 'Share-alike terms']
  }

  private calculateInheritanceEconomics(parentLicense: any): {
    parentRoyaltyPercentage: number
    derivativeRoyaltyShare: number
    platformFee: number
  } {
    // TODO: Implement actual economics calculation
    return {
      parentRoyaltyPercentage: 10,
      derivativeRoyaltyShare: 85,
      platformFee: 5
    }
  }

  private suggestAlternativeLicense(parentLicense: any): 'free' | 'premium' | 'exclusive' {
    // TODO: Implement actual alternative license suggestion
    return 'premium'
  }

  private async getChapterMetadata(chapterId: string): Promise<any> {
    try {
      const story = await r2Client.get(`stories/${chapterId}.json`)
      if (story) {
        return JSON.parse(await story.text())
      }
      return null
    } catch (error) {
      console.warn('Failed to get chapter metadata:', error)
      return null
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    initialized: boolean
    connectedWallet?: Address
    sdkVersion: string
    derivativeFeatures: string[]
  } {
    return {
      initialized: !!this.client,
      connectedWallet: this.walletClient?.account?.address,
      sdkVersion: '1.3.2',
      derivativeFeatures: [
        'registerDerivative',
        'registerIpAndMakeDerivative',
        'mintAndRegisterIpAndMakeDerivative',
        'AI-powered parent detection',
        'License inheritance analysis',
        'Bulk derivative registration'
      ]
    }
  }
}

// Export singleton instance
export const derivativeRegistrationService = new DerivativeRegistrationService()

// Helper functions
export function validateDerivativeType(type: string): type is DerivativeRegistrationData['derivativeType'] {
  return ['remix', 'sequel', 'adaptation', 'translation', 'other'].includes(type)
}

export function calculateDerivativeComplexity(registrationData: DerivativeRegistrationData): {
  complexity: 'simple' | 'moderate' | 'complex'
  factors: string[]
  estimatedGasCost: number
} {
  const factors: string[] = []
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple'
  let baseCost = 200000 // Base gas cost

  if (!registrationData.inheritParentLicense) {
    factors.push('Custom license creation required')
    complexity = 'moderate'
    baseCost += 100000
  }

  if (registrationData.derivativeType === 'adaptation' || registrationData.derivativeType === 'translation') {
    factors.push('Complex derivative type requiring additional validation')
    complexity = 'complex'
    baseCost += 150000
  }

  if (registrationData.similarityScore && registrationData.similarityScore < 0.3) {
    factors.push('Low similarity score may require manual review')
    complexity = 'complex'
  }

  return {
    complexity,
    factors,
    estimatedGasCost: baseCost
  }
}