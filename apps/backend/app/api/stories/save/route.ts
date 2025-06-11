import { NextRequest, NextResponse } from 'next/server'
import type { Address, Hash } from 'viem'
import { R2Service } from '../../../../lib/r2'
import { 
  getDefaultLicenseTerms,
  R2_SCHEMA_VERSION,
  CURRENT_DATA_VERSION 
} from '../../../../lib/types/r2-metadata'
import type { 
  EnhancedR2ChapterData, 
  R2LicenseTerms 
} from '../../../../lib/types/r2-metadata'

interface SaveStoryRequest {
  storyId: string
  chapterNumber: number
  content: string
  title: string
  themes: string[]
  wordCount: number
  readingTime: number
  metadata: any
  // Blockchain registration proof
  ipAssetId: string
  transactionHash: string
  walletAddress: string
  // Enhanced license information
  licenseTermsId?: string
  licenseTier?: 'free' | 'premium' | 'exclusive'
  customLicenseTerms?: Partial<R2LicenseTerms>
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveStoryRequest = await request.json()

    // Validate required fields
    if (!body.ipAssetId || !body.transactionHash || !body.walletAddress) {
      return NextResponse.json(
        { error: 'Blockchain registration proof required (ipAssetId, transactionHash, walletAddress)' },
        { status: 400 }
      )
    }

    if (!body.storyId || !body.content || !body.title) {
      return NextResponse.json(
        { error: 'Missing required story data' },
        { status: 400 }
      )
    }

    // Determine license tier based on chapter number and metadata
    const licenseTier = body.licenseTier || (body.chapterNumber <= 3 ? 'free' : 'premium')
    
    // Get license terms (custom or default)
    const licenseTerms: R2LicenseTerms = body.customLicenseTerms 
      ? { ...getDefaultLicenseTerms(licenseTier), ...body.customLicenseTerms }
      : getDefaultLicenseTerms(licenseTier)
    
    // Add license terms ID if provided from blockchain registration
    if (body.licenseTermsId) {
      licenseTerms.licenseTermsId = body.licenseTermsId
    }

    // Prepare enhanced chapter data with licensing
    const enhancedChapterData: EnhancedR2ChapterData = {
      storyId: body.storyId,
      chapterNumber: body.chapterNumber,
      title: body.title,
      content: body.content,
      wordCount: body.wordCount,
      readingTime: body.readingTime,
      themes: body.themes,
      
      // Enhanced metadata structure
      metadata: {
        // Content Classification
        suggestedTags: body.metadata.suggestedTags || [],
        suggestedGenre: body.metadata.suggestedGenre || 'Adventure',
        contentRating: body.metadata.contentRating || 'PG',
        language: body.metadata.language || 'en',
        genre: body.metadata.genre || [],
        mood: body.metadata.mood || 'neutral',
        
        // AI Generation Data
        generationMethod: body.metadata.generationMethod || 'ai',
        aiModel: body.metadata.aiModel || 'gpt-4',
        plotDescription: body.metadata.plotDescription || '',
        qualityScore: body.metadata.qualityScore || 75,
        originalityScore: body.metadata.originalityScore || 80,
        commercialViability: body.metadata.commercialViability || 60,
        
        // Authorship
        authorAddress: body.walletAddress.toLowerCase() as Address,
        authorName: body.metadata.authorName || '',
        bookCoverUrl: body.metadata.bookCoverUrl,
        
        // Remix System
        isRemix: body.metadata.isRemix || false,
        isRemixable: body.metadata.isRemixable !== false, // Default true
        licensePrice: licenseTerms.tipPrice,
        royaltyPercentage: licenseTerms.royaltyPercentage,
        
        // Read-to-Earn Economics
        unlockPrice: body.metadata.unlockPrice || (body.chapterNumber <= 3 ? 0 : 0.1),
        readReward: body.metadata.readReward || 0.05,
        
        // Status & Lifecycle
        status: 'published',
        generatedAt: body.metadata.generatedAt || new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        
        // Engagement Metrics
        totalReads: 0,
        totalEarned: 0,
        totalRevenue: 0,
        averageRating: 0,
        remixCount: 0,
        streakBonus: 0,
      },
      
      // Enhanced License Terms
      licenseTerms,
      
      // Enhanced Blockchain Data
      blockchain: {
        ipAssetId: body.ipAssetId,
        transactionHash: body.transactionHash as Hash,
        walletAddress: body.walletAddress.toLowerCase() as Address,
        registeredAt: new Date().toISOString(),
        registrationMethod: 'mintAndRegisterIp',
        // Add additional fields if available
        tokenId: body.metadata.tokenId,
        blockNumber: body.metadata.blockNumber,
        gasUsed: body.metadata.gasUsed,
        gasPrice: body.metadata.gasPrice,
        confirmationTime: body.metadata.confirmationTime,
        spgNftContract: body.metadata.spgNftContract,
        ipMetadataURI: body.metadata.ipMetadataURI,
        nftMetadataURI: body.metadata.nftMetadataURI,
        ipMetadataHash: body.metadata.ipMetadataHash,
        nftMetadataHash: body.metadata.nftMetadataHash,
      },
      
      // Economics Tracking
      economics: {
        currentUnlockPrice: body.metadata.unlockPrice || (body.chapterNumber <= 3 ? 0 : 0.1),
        currentReadReward: body.metadata.readReward || 0.05,
        currentLicensePrice: licenseTerms.tipPrice,
        currentRoyaltyPercentage: licenseTerms.royaltyPercentage,
        priceHistory: [{
          date: new Date().toISOString(),
          unlockPrice: body.metadata.unlockPrice || (body.chapterNumber <= 3 ? 0 : 0.1),
          readReward: body.metadata.readReward || 0.05,
          licensePrice: licenseTerms.tipPrice,
          reason: 'initial_publication'
        }],
        totalUnlockRevenue: 0,
        totalLicenseRevenue: 0,
        totalRoyaltiesEarned: 0,
        totalRoyaltiesPaid: 0,
        conversionRate: 0,
        licensingRate: 0,
        averageEngagementTime: 0,
      },
      
      // Content Protection
      protection: {
        enabled: true,
        obfuscationLevel: 'basic',
        antiScrapeHeaders: true,
        accessControlEnabled: true,
        maxSimultaneousReads: 3,
      },
      
      // Version Control
      version: {
        schemaVersion: R2_SCHEMA_VERSION,
        dataVersion: CURRENT_DATA_VERSION,
        lastSchemaUpdate: new Date().toISOString(),
        migrationHistory: [{
          fromVersion: '1.0.0',
          toVersion: R2_SCHEMA_VERSION,
          migratedAt: new Date().toISOString(),
          changes: ['Added license terms', 'Enhanced metadata structure', 'Added economics tracking']
        }]
      }
    }

    // Now save to R2 storage using enhanced metadata
    const licenseMetadata = R2Service.convertLicenseToMetadata(licenseTerms)
    
    const contentUrl = await R2Service.uploadEnhancedContent(
      R2Service.generateChapterKey(body.storyId, body.chapterNumber),
      JSON.stringify(enhancedChapterData),
      {
        contentType: 'application/json',
        metadata: {
          storyId: body.storyId,
          chapterNumber: body.chapterNumber.toString(),
          contentType: 'chapter',
          // Blockchain proof
          ipAssetId: body.ipAssetId,
          transactionHash: body.transactionHash,
          walletAddress: body.walletAddress.toLowerCase(),
          // Author info
          authorAddress: body.walletAddress.toLowerCase(),
          authorName: body.metadata.authorName || '',
          // Business Critical Fields
          contentRating: body.metadata.contentRating || 'PG',
          genre: (body.metadata.genre || []).join(','),
          unlockPrice: enhancedChapterData.economics.currentUnlockPrice.toString(),
          readReward: enhancedChapterData.economics.currentReadReward.toString(),
          licensePrice: enhancedChapterData.economics.currentLicensePrice.toString(),
          royaltyPercentage: enhancedChapterData.economics.currentRoyaltyPercentage.toString(),
          isRemixable: enhancedChapterData.metadata.isRemixable.toString(),
          status: 'published',
          visibility: 'public',
          publishedAt: new Date().toISOString(),
        }
      },
      licenseMetadata
    )

    console.log(`✅ Chapter ${body.chapterNumber} saved to R2 after blockchain registration:`, contentUrl)
    console.log(`🔗 IP Asset ID: ${body.ipAssetId}`)
    console.log(`📝 Transaction: ${body.transactionHash}`)

    return NextResponse.json({
      success: true,
      data: {
        contentUrl,
        storyId: body.storyId,
        chapterNumber: body.chapterNumber,
        ipAssetId: body.ipAssetId,
        transactionHash: body.transactionHash,
        // Include enhanced license information in response
        licenseInfo: {
          tier: licenseTier,
          licenseTermsId: licenseTerms.licenseTermsId,
          tipPrice: licenseTerms.tipPrice,
          royaltyPercentage: licenseTerms.royaltyPercentage,
          commercialUse: licenseTerms.commercialUse,
          derivativesAllowed: licenseTerms.derivativesAllowed
        },
        // Include economics summary
        economics: {
          unlockPrice: enhancedChapterData.economics.currentUnlockPrice,
          readReward: enhancedChapterData.economics.currentReadReward,
          licensePrice: enhancedChapterData.economics.currentLicensePrice,
          royaltyPercentage: enhancedChapterData.economics.currentRoyaltyPercentage
        }
      },
      message: 'Story successfully saved to storage with enhanced license metadata after blockchain registration'
    })

  } catch (error) {
    console.error('Failed to save story after blockchain registration:', error)
    return NextResponse.json(
      { error: 'Failed to save story. Please try again.' },
      { status: 500 }
    )
  }
}

// Only POST is allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to save stories.' },
    { status: 405 }
  )
}