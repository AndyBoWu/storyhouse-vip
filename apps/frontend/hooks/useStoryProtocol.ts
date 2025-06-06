import { useWalletClient } from 'wagmi'
import { StoryProtocolService, createStoryClientFromWallet, ChapterIPData, IPRegistrationResult } from '@/lib/storyProtocol'
import { StoryClient } from '@story-protocol/core-sdk'

/**
 * Hook to use Story Protocol with connected wallet
 */
export function useStoryProtocol() {
  const { data: walletClient } = useWalletClient()

  /**
   * Get Story Protocol client for the connected wallet
   */
  const getStoryClient = (): StoryClient | null => {
    if (!walletClient?.account) {
      return null
    }
    return createStoryClientFromWallet(walletClient)
  }

  /**
   * Register a chapter as IP Asset
   */
  const registerChapterAsIP = async (chapterData: ChapterIPData): Promise<IPRegistrationResult> => {
    if (!walletClient) {
      return {
        success: false,
        error: 'Wallet not connected'
      }
    }

    return StoryProtocolService.registerChapterAsIP(chapterData, walletClient)
  }

  /**
   * Test Story Protocol connection
   */
  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!walletClient) {
      return {
        success: false,
        message: 'Wallet not connected'
      }
    }

    return StoryProtocolService.testConnection(walletClient)
  }

  /**
   * Check if Story Protocol is ready to use
   */
  const isReady = (): boolean => {
    return !!(walletClient?.account && StoryProtocolService.isConfigured())
  }

  /**
   * Get current configuration status
   */
  const getConfigStatus = () => {
    return StoryProtocolService.getConfigStatus(walletClient?.account?.address)
  }

  return {
    // Client
    storyClient: getStoryClient(),

    // Status
    isReady: isReady(),
    isWalletConnected: !!walletClient?.account,
    walletAddress: walletClient?.account?.address,

    // Methods
    registerChapterAsIP,
    testConnection,
    getConfigStatus,
  }
}
