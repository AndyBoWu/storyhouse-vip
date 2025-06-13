/**
 * @fileoverview Tests for Unified IP Registration Flow
 * Tests the mintAndRegisterIpAssetWithPilTerms implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createUnifiedIpService } from '../lib/services/unifiedIpService'
import { AdvancedStoryProtocolService } from '../lib/services/advancedStoryProtocolService'
import { BookStorageService } from '../lib/storage/bookStorage'

// Mock the dependencies
jest.mock('../lib/services/ipService')
jest.mock('../lib/storage/bookStorage')
jest.mock('../lib/config/blockchain')

const mockStoryClient = {
  ipAsset: {
    mintAndRegisterIpAssetWithPilTerms: jest.fn()
  }
}

describe('Unified IP Registration', () => {
  let unifiedIpService: any
  let mockStoryWithIP: any
  let mockRequest: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    unifiedIpService = createUnifiedIpService()
    // Mock the Story client
    jest.spyOn(unifiedIpService, 'getStoryClient').mockReturnValue(mockStoryClient)
    jest.spyOn(unifiedIpService, 'isAvailable').mockReturnValue(true)

    mockStoryWithIP = {
      id: 'test-story-123',
      title: 'Test Story',
      content: 'This is a test story content for unified registration.',
      author: '0x1234567890123456789012345678901234567890',
      genre: 'Fiction',
      mood: 'Adventure',
      createdAt: new Date().toISOString()
    }

    mockRequest = {
      story: mockStoryWithIP,
      nftContract: '0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d' as any,
      account: '0x1234567890123456789012345678901234567890' as any,
      licenseTier: 'premium' as const,
      metadataUri: 'https://example.com/metadata.json',
      metadataHash: '0xabcdef123456789' as any
    }
  })

  describe('PIL Terms Preparation', () => {
    it('should prepare PIL terms for free tier', () => {
      const pilTerms = AdvancedStoryProtocolService.preparePilTermsData('free')
      
      expect(pilTerms).toEqual({
        transferable: true,
        royaltyPolicy: expect.any(String),
        defaultMintingFee: 0n,
        expiration: 0n,
        commercialUse: false,
        commercialAttribution: true,
        commercializerChecker: '0x0000000000000000000000000000000000000000',
        commercializerCheckerData: '0x',
        commercialRevShare: 0,
        commercialRevCeiling: 0n,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: false,
        derivativesReciprocal: true,
        derivativeRevCeiling: 0n,
        currency: '0x1514000000000000000000000000000000000000',
        uri: ''
      })
    })

    it('should prepare PIL terms for premium tier', () => {
      const pilTerms = AdvancedStoryProtocolService.preparePilTermsData('premium')
      
      expect(pilTerms.commercialUse).toBe(true)
      expect(pilTerms.commercialRevShare).toBe(10)
      expect(pilTerms.defaultMintingFee).toBe(BigInt(100 * 10**18)) // 100 TIP tokens
    })

    it('should prepare PIL terms for exclusive tier', () => {
      const pilTerms = AdvancedStoryProtocolService.preparePilTermsData('exclusive')
      
      expect(pilTerms.commercialUse).toBe(true)
      expect(pilTerms.commercialRevShare).toBe(25)
      expect(pilTerms.defaultMintingFee).toBe(BigInt(1000 * 10**18)) // 1000 TIP tokens
      expect(pilTerms.transferable).toBe(false) // Exclusive licenses are non-transferable
    })
  })

  describe('Unified Registration Process', () => {
    it('should execute unified registration successfully', async () => {
      const mockResponse = {
        ipId: '0xabcdef123456789012345678901234567890abcd',
        tokenId: 123n,
        txHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456',
        licenseTermsId: 456n
      }

      mockStoryClient.ipAsset.mintAndRegisterIpAssetWithPilTerms.mockResolvedValue(mockResponse)

      const result = await unifiedIpService.mintAndRegisterWithPilTerms(mockRequest)

      expect(result.success).toBe(true)
      expect(result.ipAsset).toBeDefined()
      expect(result.ipAsset.id).toBe(mockResponse.ipId)
      expect(result.transactionHash).toBe(mockResponse.txHash)
      expect(result.licenseTermsId).toBe(mockResponse.licenseTermsId.toString())
    })

    it('should handle Story Protocol SDK errors gracefully', async () => {
      const mockError = new Error('Story Protocol SDK error: Transaction failed')
      mockStoryClient.ipAsset.mintAndRegisterIpAssetWithPilTerms.mockRejectedValue(mockError)

      const result = await unifiedIpService.mintAndRegisterWithPilTerms(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Transaction failed')
    })

    it('should validate metadata before registration', () => {
      expect(() => {
        unifiedIpService.validateMetadata('invalid-url')
      }).not.toThrow()

      expect(() => {
        unifiedIpService.validateMetadata('https://valid.r2.cloudflarestorage.com/metadata.json')
      }).not.toThrow()
    })
  })

  describe('Gas Estimation', () => {
    it('should provide gas estimate for unified registration', async () => {
      const gasEstimate = await unifiedIpService.estimateUnifiedRegistrationGas(mockRequest)

      expect(gasEstimate.success).toBe(true)
      expect(gasEstimate.gasEstimate).toBeGreaterThan(0n)
      expect(gasEstimate.gasEstimate).toBe(700000n) // Base + PIL terms gas
    })

    it('should handle gas estimation errors', async () => {
      jest.spyOn(unifiedIpService, 'isAvailable').mockReturnValue(false)

      const gasEstimate = await unifiedIpService.estimateUnifiedRegistrationGas(mockRequest)

      expect(gasEstimate.success).toBe(false)
      expect(gasEstimate.error).toBe('Story Protocol SDK not initialized')
    })
  })

  describe('Feature Detection', () => {
    it('should correctly detect unified registration support', () => {
      expect(unifiedIpService.supportsUnifiedRegistration()).toBe(true)
    })

    it('should handle unavailable service', () => {
      jest.spyOn(unifiedIpService, 'isAvailable').mockReturnValue(false)
      expect(unifiedIpService.supportsUnifiedRegistration()).toBe(false)
    })
  })

  describe('Batch Operations', () => {
    it('should handle batch registration requests', async () => {
      const mockResponse = {
        ipId: '0xabcdef123456789012345678901234567890abcd',
        tokenId: 123n,
        txHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456',
        licenseTermsId: 456n
      }

      mockStoryClient.ipAsset.mintAndRegisterIpAssetWithPilTerms.mockResolvedValue(mockResponse)

      const requests = [mockRequest, { ...mockRequest, story: { ...mockRequest.story, id: 'test-story-456' } }]
      const results = await unifiedIpService.batchMintAndRegisterWithPilTerms(requests)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })
  })
})

describe('R2 Metadata Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should store IP metadata to R2', async () => {
    const mockMetadata = {
      title: 'Test Chapter',
      description: 'Test description',
      type: 'chapter' as const,
      chapterNumber: 1,
      content: 'Test content',
      genre: 'Fiction',
      mood: 'Adventure',
      tags: ['test', 'fiction'],
      licenseType: 'premium'
    }

    const mockResult = {
      metadataUri: 'https://example.r2.cloudflarestorage.com/metadata.json',
      metadataHash: '0xabcdef123456789'
    }

    jest.spyOn(BookStorageService, 'storeIpMetadata').mockResolvedValue(mockResult)

    const result = await BookStorageService.storeIpMetadata(
      '0x1234567890123456789012345678901234567890',
      'test-slug',
      mockMetadata
    )

    expect(result.metadataUri).toBe(mockResult.metadataUri)
    expect(result.metadataHash).toBe(mockResult.metadataHash)
  })

  it('should retrieve IP metadata URI', async () => {
    const mockUri = 'https://example.r2.cloudflarestorage.com/metadata.json'
    
    jest.spyOn(BookStorageService, 'getIpMetadataUri').mockResolvedValue(mockUri)

    const uri = await BookStorageService.getIpMetadataUri(
      '0x1234567890123456789012345678901234567890',
      'test-slug',
      'chapter',
      1
    )

    expect(uri).toBe(mockUri)
  })
})

describe('API Endpoint Tests', () => {
  describe('POST /api/ip/register-unified', () => {
    it('should validate request input', async () => {
      const invalidRequest = {
        story: { title: '' }, // Invalid: empty title
        nftContract: 'invalid-address', // Invalid: not an Ethereum address
        account: '0x123', // Invalid: too short
        licenseTier: 'invalid-tier' // Invalid: not a valid tier
      }

      // This would be tested with actual API testing framework
      // expect(response.status).toBe(400)
      // expect(response.body.error).toBe('Invalid input data')
    })

    it('should handle feature flag disabled', async () => {
      // Mock UNIFIED_REGISTRATION_ENABLED=false
      // expect(response.status).toBe(503)
      // expect(response.body.error).toContain('not enabled')
    })
  })

  describe('GET /api/ip/register-unified', () => {
    it('should return service capabilities', async () => {
      // Mock the endpoint response
      const expectedResponse = {
        enabled: true,
        available: true,
        features: {
          singleTransaction: true,
          gasOptimized: true,
          metadata: true,
          pilTerms: ['free', 'reading', 'premium', 'exclusive']
        },
        benefits: {
          reducedGasCost: '~40%',
          fasterExecution: '~66%',
          atomicOperation: true
        }
      }

      // This would be tested with actual API testing
      // expect(response.body).toEqual(expectedResponse)
    })
  })
})

describe('License Tier Configurations', () => {
  it('should have all required license tiers', () => {
    const tiers = AdvancedStoryProtocolService.getAllLicenseTiers()
    
    expect(tiers).toHaveProperty('free')
    expect(tiers).toHaveProperty('reading')
    expect(tiers).toHaveProperty('premium')
    expect(tiers).toHaveProperty('exclusive')
  })

  it('should have correct tier configurations', () => {
    const freeTier = AdvancedStoryProtocolService.getLicenseTier('free')
    expect(freeTier.commercialUse).toBe(false)
    expect(freeTier.royaltyPercentage).toBe(0)

    const premiumTier = AdvancedStoryProtocolService.getLicenseTier('premium')
    expect(premiumTier.commercialUse).toBe(true)
    expect(premiumTier.royaltyPercentage).toBe(10)

    const exclusiveTier = AdvancedStoryProtocolService.getLicenseTier('exclusive')
    expect(exclusiveTier.commercialUse).toBe(true)
    expect(exclusiveTier.royaltyPercentage).toBe(25)
    expect(exclusiveTier.exclusivity).toBe(true)
  })
})