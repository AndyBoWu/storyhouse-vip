import { ethers } from 'ethers'
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { custom } from 'viem'
import { getStoryProtocolConfig } from '../config/blockchain'
import { chapterUnlockStorage } from '../storage/chapterUnlockStorage'
import { STORYHOUSE_CONTRACTS, HYBRID_REVENUE_CONTROLLER_V2_ABI } from '../contracts/storyhouse'
import { parseBookId } from '@/lib/contracts/hybridRevenueController'

// License Registry ABI for checking license ownership
const LICENSE_REGISTRY_ABI = [
  "function balanceOf(address owner, uint256 id) view returns (uint256)",
  "function isLicensee(uint256 licenseId, address licensee) view returns (bool)"
]

interface ChapterAccessResult {
  hasAccess: boolean
  reason: 'free' | 'owner' | 'licensed' | 'unlocked' | 'no_access'
  licenseTokenId?: string
  error?: string
}

export class ChapterAccessService {
  private provider: ethers.JsonRpcProvider
  private licenseRegistry: ethers.Contract | null = null
  private hybridRevenueControllerV2: ethers.Contract | null = null

  constructor() {
    const config = getStoryProtocolConfig()
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)
    
    // Initialize license registry contract if available
    if (config.contracts.licenseRegistry) {
      this.licenseRegistry = new ethers.Contract(
        config.contracts.licenseRegistry,
        LICENSE_REGISTRY_ABI,
        this.provider
      )
    }
    
    // Initialize HybridRevenueControllerV2 contract
    if (STORYHOUSE_CONTRACTS.HYBRID_REVENUE_CONTROLLER_V2) {
      this.hybridRevenueControllerV2 = new ethers.Contract(
        STORYHOUSE_CONTRACTS.HYBRID_REVENUE_CONTROLLER_V2,
        HYBRID_REVENUE_CONTROLLER_V2_ABI,
        this.provider
      )
    }
  }

  /**
   * Check if a user has access to a specific chapter
   */
  async checkChapterAccess(
    bookId: string,
    chapterNumber: number,
    userAddress?: string,
    ipAssetId?: string
  ): Promise<ChapterAccessResult> {
    // Free chapters (1-3) are accessible to everyone
    if (chapterNumber <= 3) {
      return { hasAccess: true, reason: 'free' }
    }

    // No wallet connected - no access to paid chapters
    if (!userAddress) {
      return { hasAccess: false, reason: 'no_access' }
    }

    // Parse book ID to get author address
    const [authorAddress] = bookId.split('/')
    
    // Book owner always has access
    if (userAddress.toLowerCase() === authorAddress.toLowerCase()) {
      return { hasAccess: true, reason: 'owner' }
    }

    // Check if book is registered in HybridRevenueControllerV2
    // Books must be registered to enable revenue sharing for chapters 4+
    if (this.hybridRevenueControllerV2) {
      try {
        const { bytes32Id } = parseBookId(bookId)
        const bookData = await this.hybridRevenueControllerV2.books(bytes32Id)
        
        // Check if book is active (registered)
        const isActive = bookData[4] // isActive is the 5th element
        if (!isActive) {
          console.error(`❌ Book ${bookId} is not registered in HybridRevenueControllerV2`)
          return { 
            hasAccess: false, 
            reason: 'no_access',
            // Include a specific error to help frontend show registration prompt
            error: 'Book is not registered for revenue sharing'
          }
        }
      } catch (error) {
        console.error('Failed to check book registration:', error)
        // Continue to other checks if registration check fails
      }
    }

    // Check HybridRevenueControllerV2 for unlock status
    if (this.hybridRevenueControllerV2) {
      try {
        const { bytes32Id } = parseBookId(bookId)
        const hasUnlocked = await this.hybridRevenueControllerV2.hasUnlockedChapter(
          userAddress,
          bytes32Id,
          chapterNumber
        )
        
        if (hasUnlocked) {
          console.log(`✅ User ${userAddress} has unlocked chapter ${chapterNumber} on-chain`)
          return { hasAccess: true, reason: 'blockchain_unlocked' }
        }
      } catch (error) {
        console.error('Error checking blockchain unlock status:', error)
      }
    }
    
    // Check in-memory storage (temporary solution)
    const isUnlocked = chapterUnlockStorage.hasUnlocked(
      userAddress,
      bookId,
      chapterNumber
    )
    
    if (isUnlocked) {
      return { hasAccess: true, reason: 'unlocked' }
    }

    // Check Story Protocol license ownership if IP asset ID is provided
    if (ipAssetId && this.licenseRegistry) {
      try {
        const hasLicense = await this.checkStoryProtocolLicense(
          userAddress,
          ipAssetId
        )
        
        if (hasLicense.hasAccess) {
          return hasLicense
        }
      } catch (error) {
        console.error('Error checking Story Protocol license:', error)
        // Continue to other checks if license check fails
      }
    }

    // Check if user has made a direct TIP payment (temporary fallback)
    // This would need to be implemented with proper transaction verification
    // For now, return no access
    return { hasAccess: false, reason: 'no_access' }
  }

  /**
   * Check if user owns a Story Protocol reading license for the chapter
   */
  private async checkStoryProtocolLicense(
    userAddress: string,
    ipAssetId: string
  ): Promise<ChapterAccessResult> {
    if (!this.licenseRegistry) {
      return { hasAccess: false, reason: 'no_access' }
    }

    try {
      // In Story Protocol, we need to check if the user has minted a license
      // for this specific IP asset. This is complex because we need to:
      // 1. Find the license terms ID for reading access
      // 2. Check if user has a license token for those terms
      
      // For now, return false as we need more implementation
      // This would require querying Story Protocol's license registry
      return { hasAccess: false, reason: 'no_access' }
    } catch (error) {
      console.error('Error checking license ownership:', error)
      return { hasAccess: false, reason: 'no_access' }
    }
  }

  /**
   * Verify a transaction hash for chapter unlock
   */
  async verifyUnlockTransaction(
    txHash: string,
    expectedFrom: string,
    expectedAmount: string,
    bookId: string,
    chapterNumber: number
  ): Promise<boolean> {
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash)
      
      if (!receipt || receipt.status !== 1) {
        return false
      }

      // Get transaction details
      const tx = await this.provider.getTransaction(txHash)
      
      if (!tx) {
        return false
      }

      // Verify sender
      if (tx.from.toLowerCase() !== expectedFrom.toLowerCase()) {
        return false
      }

      // For TIP token transfers, we need to decode the logs
      // This is a simplified check - in production, decode the Transfer event
      // to verify the recipient and amount
      
      // For now, if transaction succeeded and is from the right address,
      // we'll consider it valid
      return true
    } catch (error) {
      console.error('Error verifying transaction:', error)
      return false
    }
  }

  /**
   * Record a verified chapter unlock
   */
  recordUnlock(
    userAddress: string,
    bookId: string,
    chapterNumber: number,
    transactionHash: string
  ): void {
    chapterUnlockStorage.recordUnlock({
      userAddress,
      bookId,
      chapterNumber,
      transactionHash,
      isFree: chapterNumber <= 3
    })
  }
}

// Export singleton instance
export const chapterAccessService = new ChapterAccessService()