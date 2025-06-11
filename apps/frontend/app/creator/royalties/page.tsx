'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { 
  ArrowLeft, 
  Coins, 
  DollarSign, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Wallet,
  Calendar,
  Target,
  Award,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import dynamic from 'next/dynamic'
import QuickNavigation from '@/components/ui/QuickNavigation'

const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
})

interface ClaimableChapter {
  chapterId: string
  bookId: string
  bookTitle: string
  chapterNumber: number
  chapterTitle: string
  revenueGenerated: number
  claimableAmount: number
  lastClaimed?: string
  licenseTier: 'Free' | 'Premium' | 'Exclusive'
  royaltyPercentage: number
  readCount: number
  tipEarnings: number
}

interface RoyaltyHistory {
  claimId: string
  chapterId: string
  bookTitle: string
  chapterNumber: number
  amountClaimed: number
  claimedAt: string
  transactionHash?: string
  status: 'completed' | 'pending' | 'failed'
}

interface RoyaltyPreview {
  totalClaimable: number
  totalRevenue: number
  projectedEarnings: {
    nextWeek: number
    nextMonth: number
    confidence: number
  }
  recommendations: string[]
  tier_analysis: {
    [key: string]: {
      current_royalty: number
      potential_revenue: number
      optimization_score: number
    }
  }
}

export default function RoyaltiesPage() {
  const { address: connectedAddress, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [claimableChapters, setClaimableChapters] = useState<ClaimableChapter[]>([])
  const [royaltyHistory, setRoyaltyHistory] = useState<RoyaltyHistory[]>([])
  const [royaltyPreview, setRoyaltyPreview] = useState<RoyaltyPreview | null>(null)
  
  // UI states
  const [activeTab, setActiveTab] = useState<'claimable' | 'history' | 'analytics'>('claimable')
  const [isLoadingClaimable, setIsLoadingClaimable] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [claimingChapter, setClaimingChapter] = useState<string | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load claimable chapters
  const loadClaimableChapters = async () => {
    if (!connectedAddress) return
    
    setIsLoadingClaimable(true)
    try {
      // Get all books by this author first
      const booksResponse = await apiClient.getBooks(connectedAddress)
      
      if (booksResponse.success && booksResponse.books) {
        const claimableChapters: ClaimableChapter[] = []
        
        // For each book, check claimable royalties for each chapter
        for (const book of booksResponse.books) {
          try {
            const chaptersResponse = await apiClient.getBookChapters(book.id)
            if (chaptersResponse.success && chaptersResponse.data?.chapters) {
              for (const chapter of chaptersResponse.data.chapters) {
                try {
                  const claimableResponse = await apiClient.getClaimableRoyalties(chapter.id)
                  if (claimableResponse.success && claimableResponse.data.claimableAmount > 0) {
                    claimableChapters.push({
                      chapterId: chapter.id,
                      bookId: book.id,
                      bookTitle: book.title,
                      chapterNumber: chapter.chapterNumber,
                      chapterTitle: chapter.title,
                      revenueGenerated: claimableResponse.data.totalRevenue || 0,
                      claimableAmount: claimableResponse.data.claimableAmount,
                      lastClaimed: claimableResponse.data.lastClaimedAt,
                      licenseTier: chapter.licenseTier || 'Free',
                      royaltyPercentage: chapter.royaltyPercentage || 0,
                      readCount: chapter.readCount || 0,
                      tipEarnings: claimableResponse.data.tipEarnings || 0
                    })
                  }
                } catch (chapterError) {
                  console.warn(`Error checking claimable for chapter ${chapter.id}:`, chapterError)
                }
              }
            }
          } catch (bookError) {
            console.warn(`Error loading chapters for book ${book.id}:`, bookError)
          }
        }
        
        setClaimableChapters(claimableChapters)
      } else {
        // Fallback to mock data if API fails
        const mockChapters: ClaimableChapter[] = [
          {
            chapterId: 'ch1',
            bookId: 'book1',
            bookTitle: 'The Digital Realm',
            chapterNumber: 1,
            chapterTitle: 'Awakening',
            revenueGenerated: 150.75,
            claimableAmount: 37.69,
            licenseTier: 'Premium',
            royaltyPercentage: 25,
            readCount: 234,
            tipEarnings: 45.30
          },
          {
            chapterId: 'ch2',
            bookId: 'book1',
            bookTitle: 'The Digital Realm',
            chapterNumber: 2,
            chapterTitle: 'The Journey Begins',
            revenueGenerated: 89.25,
            claimableAmount: 22.31,
            licenseTier: 'Free',
            royaltyPercentage: 0,
            readCount: 156,
            tipEarnings: 31.20
          }
        ]
        setClaimableChapters(mockChapters)
      }
    } catch (error) {
      console.error('Error loading claimable chapters:', error)
      // Set empty array on error
      setClaimableChapters([])
    } finally {
      setIsLoadingClaimable(false)
    }
  }

  // Load royalty history
  const loadRoyaltyHistory = async () => {
    if (!connectedAddress) return
    
    setIsLoadingHistory(true)
    try {
      const response = await apiClient.getRoyaltyHistory(connectedAddress)
      if (response.success) {
        setRoyaltyHistory(response.data.history || [])
      } else {
        // Mock data for demo
        const mockHistory: RoyaltyHistory[] = [
          {
            claimId: 'claim1',
            chapterId: 'ch1',
            bookTitle: 'Previous Story',
            chapterNumber: 1,
            amountClaimed: 125.50,
            claimedAt: '2025-01-10T14:30:00Z',
            transactionHash: '0x123...',
            status: 'completed'
          }
        ]
        setRoyaltyHistory(mockHistory)
      }
    } catch (error) {
      console.error('Error loading royalty history:', error)
      // Mock data for demo
      const mockHistory: RoyaltyHistory[] = [
        {
          claimId: 'claim1',
          chapterId: 'ch1',
          bookTitle: 'Previous Story',
          chapterNumber: 1,
          amountClaimed: 125.50,
          claimedAt: '2025-01-10T14:30:00Z',
          transactionHash: '0x123...',
          status: 'completed'
        }
      ]
      setRoyaltyHistory(mockHistory)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Load royalty preview/analytics
  const loadRoyaltyPreview = async () => {
    if (!connectedAddress) return
    
    setIsLoadingPreview(true)
    try {
      const response = await apiClient.getRoyaltyPreview()
      if (response.success) {
        setRoyaltyPreview(response.data)
      } else {
        // Mock data for demo
        const mockPreview: RoyaltyPreview = {
          totalClaimable: 59.00,
          totalRevenue: 240.00,
          projectedEarnings: {
            nextWeek: 45.20,
            nextMonth: 180.50,
            confidence: 85
          },
          recommendations: [
            'Consider upgrading Chapter 2 to Premium license tier',
            'Your Premium chapters generate 3.2x more revenue',
            'High engagement on Chapter 1 - perfect for Exclusive tier'
          ],
          tier_analysis: {
            'Free': {
              current_royalty: 0,
              potential_revenue: 89.25,
              optimization_score: 25
            },
            'Premium': {
              current_royalty: 37.69,
              potential_revenue: 150.75,
              optimization_score: 85
            }
          }
        }
        setRoyaltyPreview(mockPreview)
      }
    } catch (error) {
      console.error('Error loading royalty preview:', error)
      // Mock data for demo
      const mockPreview: RoyaltyPreview = {
        totalClaimable: 59.00,
        totalRevenue: 240.00,
        projectedEarnings: {
          nextWeek: 45.20,
          nextMonth: 180.50,
          confidence: 85
        },
        recommendations: [
          'Consider upgrading Chapter 2 to Premium license tier',
          'Your Premium chapters generate 3.2x more revenue',
          'High engagement on Chapter 1 - perfect for Exclusive tier'
        ],
        tier_analysis: {
          'Free': {
            current_royalty: 0,
            potential_revenue: 89.25,
            optimization_score: 25
          },
          'Premium': {
            current_royalty: 37.69,
            potential_revenue: 150.75,
            optimization_score: 85
          }
        }
      }
      setRoyaltyPreview(mockPreview)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Claim individual chapter royalties
  const claimChapterRoyalty = async (chapterId: string) => {
    if (!connectedAddress) return
    
    setClaimingChapter(chapterId)
    try {
      const response = await apiClient.claimRoyalty({
        chapterId,
        authorAddress: connectedAddress
      })
      
      if (response.success) {
        // Refresh data after successful claim
        await Promise.all([
          loadClaimableChapters(),
          loadRoyaltyHistory(),
          loadRoyaltyPreview()
        ])
      } else {
        console.error('Failed to claim royalty:', response.error)
        alert('Failed to claim royalty: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error claiming chapter royalty:', error)
      alert('Error claiming royalty. Please try again.')
    } finally {
      setClaimingChapter(null)
    }
  }

  // Refresh all data
  const refreshAllData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadClaimableChapters(),
        loadRoyaltyHistory(),
        loadRoyaltyPreview()
      ])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (mounted && connectedAddress) {
      refreshAllData()
    }
  }, [mounted, connectedAddress])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading royalty dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/own" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              Back to My Stories
            </Link>
            <div className="flex items-center gap-4">
              <QuickNavigation currentPage="own" />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Royalty Dashboard</h1>
              <p className="text-gray-600">
                Manage and claim your chapter-level royalties
              </p>
            </div>
            
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Wallet Connection Check */}
          {!isConnected ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-center">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Connect your wallet to view and claim your royalties
              </p>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              {royaltyPreview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Claimable</p>
                        <p className="text-2xl font-bold text-gray-900">${royaltyPreview.totalClaimable.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${royaltyPreview.totalRevenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Next Month</p>
                        <p className="text-2xl font-bold text-gray-900">${royaltyPreview.projectedEarnings.nextMonth.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Award className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="text-2xl font-bold text-gray-900">{royaltyPreview.projectedEarnings.confidence}%</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'claimable', label: 'Claimable Royalties', icon: Coins },
                      { id: 'history', label: 'Claim History', icon: Clock },
                      { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                    ].map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? 'border-purple-500 text-purple-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'claimable' && (
                      <motion.div
                        key="claimable"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        {isLoadingClaimable ? (
                          <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading claimable royalties...</p>
                          </div>
                        ) : claimableChapters.length === 0 ? (
                          <div className="text-center py-12">
                            <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Claimable Royalties</h3>
                            <p className="text-gray-600">
                              Your chapters haven't generated enough revenue to claim yet.
                            </p>
                          </div>
                        ) : (
                          claimableChapters.map((chapter) => (
                            <motion.div
                              key={chapter.chapterId}
                              layout
                              className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-gray-900">
                                        {chapter.bookTitle} - Chapter {chapter.chapterNumber}
                                      </h4>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        chapter.licenseTier === 'Premium' 
                                          ? 'bg-blue-100 text-blue-800'
                                          : chapter.licenseTier === 'Exclusive'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {chapter.licenseTier}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{chapter.chapterTitle}</p>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-500">Claimable</span>
                                        <p className="font-semibold text-green-600">${chapter.claimableAmount.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Total Revenue</span>
                                        <p className="font-semibold">${chapter.revenueGenerated.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Reads</span>
                                        <p className="font-semibold">{chapter.readCount}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Royalty Rate</span>
                                        <p className="font-semibold">{chapter.royaltyPercentage}%</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      onClick={() => setExpandedChapter(
                                        expandedChapter === chapter.chapterId ? null : chapter.chapterId
                                      )}
                                      className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                      {expandedChapter === chapter.chapterId ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                    
                                    <button
                                      onClick={() => claimChapterRoyalty(chapter.chapterId)}
                                      disabled={claimingChapter === chapter.chapterId || chapter.claimableAmount <= 0}
                                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {claimingChapter === chapter.chapterId ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          Claiming...
                                        </>
                                      ) : (
                                        <>
                                          <Coins className="w-4 h-4" />
                                          Claim ${chapter.claimableAmount.toFixed(2)}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                  {expandedChapter === chapter.chapterId && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-4 pt-4 border-t border-gray-200"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="bg-white p-3 rounded-lg">
                                          <p className="text-gray-500 mb-1">TIP Earnings</p>
                                          <p className="font-semibold text-purple-600">${chapter.tipEarnings.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                          <p className="text-gray-500 mb-1">Last Claimed</p>
                                          <p className="font-semibold">
                                            {chapter.lastClaimed ? new Date(chapter.lastClaimed).toLocaleDateString() : 'Never'}
                                          </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                          <p className="text-gray-500 mb-1">Avg. per Read</p>
                                          <p className="font-semibold">
                                            ${(chapter.revenueGenerated / chapter.readCount).toFixed(3)}
                                          </p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'history' && (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        {isLoadingHistory ? (
                          <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading claim history...</p>
                          </div>
                        ) : royaltyHistory.length === 0 ? (
                          <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Claim History</h3>
                            <p className="text-gray-600">
                              You haven't claimed any royalties yet.
                            </p>
                          </div>
                        ) : (
                          royaltyHistory.map((claim) => (
                            <div
                              key={claim.claimId}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {claim.bookTitle} - Chapter {claim.chapterNumber}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Claimed ${claim.amountClaimed.toFixed(2)} on {new Date(claim.claimedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    claim.status === 'completed' 
                                      ? 'bg-green-100 text-green-800'
                                      : claim.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {claim.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                    {claim.status === 'pending' && <Clock className="w-3 h-3" />}
                                    {claim.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                    {claim.status}
                                  </div>
                                  
                                  {claim.transactionHash && (
                                    <a
                                      href={`https://explorer.story.foundation/tx/${claim.transactionHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {isLoadingPreview ? (
                          <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading analytics...</p>
                          </div>
                        ) : royaltyPreview ? (
                          <>
                            {/* Recommendations */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Optimization Recommendations
                              </h3>
                              <div className="space-y-2">
                                {royaltyPreview.recommendations.map((rec, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    <p className="text-blue-800">{rec}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tier Analysis */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="font-semibold text-gray-900 mb-4">License Tier Performance</h3>
                              <div className="space-y-4">
                                {Object.entries(royaltyPreview.tier_analysis).map(([tier, data]) => (
                                  <div key={tier} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-medium text-gray-900">{tier} Tier</h4>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        data.optimization_score >= 80 
                                          ? 'bg-green-100 text-green-800'
                                          : data.optimization_score >= 60
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {data.optimization_score}% optimized
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-500">Current Royalty</span>
                                        <p className="font-semibold">${data.current_royalty.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Potential Revenue</span>
                                        <p className="font-semibold">${data.potential_revenue.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Available</h3>
                            <p className="text-gray-600">
                              Create some chapters to see your analytics data.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}