import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { Address, Hash } from 'viem'
import {
  STORYHOUSE_CONTRACTS,
  TIP_TOKEN_ABI,
  CREATOR_REWARDS_CONTROLLER_ABI,
  REWARDS_MANAGER_ABI,
  formatTIPAmount,
  generateStoryId,
  createStoryCreationCall,
  type UserRewards,
  type RewardClaim,
  REWARD_AMOUNTS,
} from '../lib/contracts/storyhouse'

// Hook for TIP token operations
export function useTIPToken() {
  const { address } = useAccount()

  const { data: balance } = useReadContract({
    address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
    abi: TIP_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: symbol } = useReadContract({
    address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
    abi: TIP_TOKEN_ABI,
    functionName: 'symbol',
  })

  const { data: name } = useReadContract({
    address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
    abi: TIP_TOKEN_ABI,
    functionName: 'name',
  })

  const { data: totalSupply } = useReadContract({
    address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
    abi: TIP_TOKEN_ABI,
    functionName: 'totalSupply',
  })

  return {
    balance: balance ? formatTIPAmount(balance) : '0',
    balanceRaw: balance || BigInt(0),
    symbol: symbol || 'TIP',
    name: name || 'TIP Token',
    totalSupply: totalSupply ? formatTIPAmount(totalSupply) : '0',
    address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
  }
}

// Hook for user rewards data
export function useUserRewards(): UserRewards & { isLoading: boolean } {
  const { address } = useAccount()

  const { data: totalEarned, isLoading: loadingTotal } = useReadContract({
    address: STORYHOUSE_CONTRACTS.REWARDS_MANAGER,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'totalRewardsEarned',
    args: address ? [address] : undefined,
  })

  const { data: storiesCreated, isLoading: loadingStories } = useReadContract({
    address: STORYHOUSE_CONTRACTS.CREATOR_REWARDS_CONTROLLER,
    abi: CREATOR_REWARDS_CONTROLLER_ABI,
    functionName: 'totalStoriesCreated',
    args: address ? [address] : undefined,
  })

  const isLoading = loadingTotal || loadingStories

  return {
    totalEarned: totalEarned || BigInt(0),
    creationRewards: BigInt(0), // Would need additional tracking
    readingRewards: BigInt(0), // Removed - no longer supported
    streakBonus: BigInt(0), // Removed - no longer supported
    storiesCreated: Number(storiesCreated || 0),
    chaptersRead: 0, // Removed - no longer supported
    currentStreak: 0, // Removed - no longer supported
    isLoading,
  }
}

// Hook for claiming story creation rewards
export function useClaimStoryReward() {
  const [pendingClaim, setPendingClaim] = useState<RewardClaim | null>(null)
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const claimReward = (storyTitle: string, author: Address) => {
    const storyId = generateStoryId(storyTitle, author)
    setPendingClaim({
      type: 'creation',
      storyId,
      amount: REWARD_AMOUNTS.STORY_CREATION,
    })

    writeContract({
      address: STORYHOUSE_CONTRACTS.CREATOR_REWARDS_CONTROLLER,
      abi: CREATOR_REWARDS_CONTROLLER_ABI,
      functionName: 'claimStoryCreationReward',
      args: [storyId as `0x${string}`],
    })
  }

  useEffect(() => {
    if (isSuccess) {
      setPendingClaim(null)
    }
  }, [isSuccess])

  return {
    claimReward,
    isLoading: isPending || isConfirming,
    isSuccess,
    transactionHash: hash,
    pendingClaim,
  }
}

// Reading rewards hook removed - functionality discontinued

// Hook to check if user has claimed specific rewards
export function useRewardStatus(storyId: string, chapterNumber?: number) {
  const { address } = useAccount()

  const { data: hasClaimedCreation } = useReadContract({
    address: STORYHOUSE_CONTRACTS.CREATOR_REWARDS_CONTROLLER,
    abi: CREATOR_REWARDS_CONTROLLER_ABI,
    functionName: 'hasClaimedCreationReward',
    args: address && storyId ? [address, storyId as `0x${string}`] : undefined,
  })

  const hasClaimedChapter = false // Reading rewards removed

  return {
    hasClaimedCreation: !!hasClaimedCreation,
    hasClaimedChapter: false, // Reading rewards removed
  }
}

// Hook for global rewards statistics
export function useGlobalStats() {
  const { data: totalDistributed } = useReadContract({
    address: STORYHOUSE_CONTRACTS.REWARDS_MANAGER,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'totalRewardsDistributed',
  })

  return {
    totalDistributed: totalDistributed ? formatTIPAmount(totalDistributed) : '0',
    totalDistributedRaw: totalDistributed || BigInt(0),
  }
}

// Combined hook for all StoryHouse data
export function useStoryHouse() {
  const tipToken = useTIPToken()
  const userRewards = useUserRewards()
  const globalStats = useGlobalStats()
  const claimStoryReward = useClaimStoryReward()

  return {
    tipToken,
    userRewards,
    globalStats,
    claimStoryReward,
    // Utility functions
    generateStoryId,
    formatTIPAmount,
  }
} 
