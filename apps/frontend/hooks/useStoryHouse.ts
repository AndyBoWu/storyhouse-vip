import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState } from 'react'
import { Address, Hash } from 'viem'
import {
  STORYHOUSE_CONTRACTS,
  TIP_TOKEN_ABI,
  REWARDS_MANAGER_ABI,
  CHAPTER_ACCESS_CONTROLLER_ABI,
  UNIFIED_REWARDS_CONTROLLER_ABI,
  formatTipAmount,
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
    balance: balance ? formatTipAmount(balance) : '0',
    balanceRaw: balance || BigInt(0),
    symbol: symbol || 'TIP',
    name: name || 'TIP Token',
    totalSupply: totalSupply ? formatTipAmount(totalSupply) : '0',
    address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
  }
}

// Hook for user rewards data (updated for new architecture)
export function useUserRewards() {
  const { address } = useAccount()

  const { data: totalEarned, isLoading: loadingTotal } = useReadContract({
    address: STORYHOUSE_CONTRACTS.REWARDS_MANAGER,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'totalRewardsEarned',
    args: address ? [address] : undefined,
  })

  const { data: globalStats, isLoading: loadingGlobal } = useReadContract({
    address: STORYHOUSE_CONTRACTS.REWARDS_MANAGER,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'getGlobalStats',
  })

  const isLoading = loadingTotal || loadingGlobal

  return {
    totalEarned: totalEarned || BigInt(0),
    totalEarnedFormatted: totalEarned ? formatTipAmount(totalEarned) : '0',
    globalStats: globalStats ? {
      totalRewards: globalStats[0],
      totalRecipients: globalStats[1],
      totalControllers: globalStats[2],
    } : null,
    isLoading,
  }
}

// Hook for chapter access operations
export function useChapterAccess() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const unlockChapter = (bookId: Hash, chapterNumber: number) => {
    writeContract({
      address: STORYHOUSE_CONTRACTS.CHAPTER_ACCESS_CONTROLLER,
      abi: CHAPTER_ACCESS_CONTROLLER_ABI,
      functionName: 'unlockChapter',
      args: [bookId, BigInt(chapterNumber)],
    })
  }

  const batchUnlockChapters = (bookId: Hash, chapterNumbers: number[]) => {
    writeContract({
      address: STORYHOUSE_CONTRACTS.CHAPTER_ACCESS_CONTROLLER,
      abi: CHAPTER_ACCESS_CONTROLLER_ABI,
      functionName: 'batchUnlockChapters',
      args: [bookId, chapterNumbers.map(n => BigInt(n))],
    })
  }

  return {
    unlockChapter,
    batchUnlockChapters,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  }
}

// Hook for checking chapter access
export function useChapterInfo(bookId?: Hash, chapterNumber?: number) {
  const { address } = useAccount()

  const { data: canAccess } = useReadContract({
    address: STORYHOUSE_CONTRACTS.CHAPTER_ACCESS_CONTROLLER,
    abi: CHAPTER_ACCESS_CONTROLLER_ABI,
    functionName: 'canAccessChapter',
    args: (address && bookId && chapterNumber !== undefined) 
      ? [address, bookId, BigInt(chapterNumber)] 
      : undefined,
  })

  const { data: chapterInfo } = useReadContract({
    address: STORYHOUSE_CONTRACTS.CHAPTER_ACCESS_CONTROLLER,
    abi: CHAPTER_ACCESS_CONTROLLER_ABI,
    functionName: 'getChapterInfo',
    args: (bookId && chapterNumber !== undefined) 
      ? [bookId, BigInt(chapterNumber)] 
      : undefined,
  })

  const { data: userProgress } = useReadContract({
    address: STORYHOUSE_CONTRACTS.CHAPTER_ACCESS_CONTROLLER,
    abi: CHAPTER_ACCESS_CONTROLLER_ABI,
    functionName: 'getUserProgress',
    args: (address && bookId) ? [address, bookId] : undefined,
  })

  return {
    canAccess: !!canAccess,
    chapterInfo: chapterInfo ? {
      exists: chapterInfo[0],
      author: chapterInfo[1] as Address,
      ipAssetId: chapterInfo[2],
      wordCount: Number(chapterInfo[3]),
    } : null,
    userProgress: userProgress?.map(n => Number(n)) || [],
  }
}

// Hook for remix licensing operations
export function useRemixLicensing() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const purchaseRemixLicense = (
    originalStoryId: Hash, 
    remixStoryId: Hash, 
    licenseType: string
  ) => {
    writeContract({
      address: STORYHOUSE_CONTRACTS.UNIFIED_REWARDS_CONTROLLER,
      abi: UNIFIED_REWARDS_CONTROLLER_ABI,
      functionName: 'purchaseRemixLicense',
      args: [originalStoryId, remixStoryId, licenseType],
    })
  }

  const registerStoryCreator = (storyId: Hash, creator: Address) => {
    writeContract({
      address: STORYHOUSE_CONTRACTS.UNIFIED_REWARDS_CONTROLLER,
      abi: UNIFIED_REWARDS_CONTROLLER_ABI,
      functionName: 'registerStoryCreator',
      args: [storyId, creator],
    })
  }

  return {
    purchaseRemixLicense,
    registerStoryCreator,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  }
}

// Hook for quality scoring (admin/reviewer function)
export function useQualityScoring() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const setQualityScore = (storyId: Hash, score: number) => {
    writeContract({
      address: STORYHOUSE_CONTRACTS.UNIFIED_REWARDS_CONTROLLER,
      abi: UNIFIED_REWARDS_CONTROLLER_ABI,
      functionName: 'setQualityScore',
      args: [storyId, BigInt(score)],
    })
  }

  const distributeEngagementReward = (
    storyId: Hash, 
    engagementType: string, 
    count: number
  ) => {
    writeContract({
      address: STORYHOUSE_CONTRACTS.UNIFIED_REWARDS_CONTROLLER,
      abi: UNIFIED_REWARDS_CONTROLLER_ABI,
      functionName: 'distributeEngagementReward',
      args: [storyId, engagementType, BigInt(count)],
    })
  }

  return {
    setQualityScore,
    distributeEngagementReward,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  }
}

// Utility functions for generating story/book IDs
export function generateStoryId(title: string, author: Address): Hash {
  // Simple hash function for demo - in production use proper hashing
  const combined = `${title.toLowerCase()}-${author.toLowerCase()}`
  return `0x${Buffer.from(combined).toString('hex').slice(0, 64).padEnd(64, '0')}` as Hash
}

export function generateBookId(title: string, curator: Address): Hash {
  const combined = `book-${title.toLowerCase()}-${curator.toLowerCase()}`
  return `0x${Buffer.from(combined).toString('hex').slice(0, 64).padEnd(64, '0')}` as Hash
}

// Chapter pricing information
export const CHAPTER_PRICING = {
  FREE_CHAPTERS: 3, // Chapters 1-3 are free
  PAID_CHAPTER_PRICE: '0.5', // 0.5 TIP per chapter 4+
  PAID_CHAPTER_PRICE_WEI: BigInt(5e17), // 0.5 * 1e18
} as const

// License tier information
export const LICENSE_TIERS = {
  standard: { price: '2', description: 'Personal use, non-commercial' },
  premium: { price: '20', description: 'Commercial use, 10% royalties' },
  exclusive: { price: '100', description: 'Full rights, 25% royalties' },
} as const