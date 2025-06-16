'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { 
  Coins, 
  Trophy, 
  Flame, 
  BookOpen, 
  TrendingUp, 
  Gift,
  ExternalLink,
  Wallet,
  Activity
} from 'lucide-react'
import { useStoryHouse } from '../hooks/useStoryHouse'
import { getExplorerUrl, getAddressUrl, STORY_TESTNET_CONFIG } from '../lib/contracts/storyhouse'

interface RewardsDashboardProps {
  className?: string
}

export default function RewardsDashboard({ className = '' }: RewardsDashboardProps) {
  const { address, isConnected } = useAccount()
  const { tipToken, userRewards, globalStats, claimStoryReward } = useStoryHouse()
  const [activeTab, setActiveTab] = useState<'overview' | 'claim' | 'stats'>('overview')

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 text-center ${className}`}>
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">
          Connect your wallet to view your StoryHouse rewards and claim TIP tokens.
        </p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'claim', label: 'Claim Rewards', icon: Gift },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
  ] as const

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Rewards Dashboard</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live on {STORY_TESTNET_CONFIG.name}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            tipToken={tipToken}
            userRewards={userRewards}
            globalStats={globalStats}
          />
        )}
        
        {activeTab === 'claim' && (
          <ClaimTab 
            claimStoryReward={claimStoryReward}
            userRewards={userRewards}
          />
        )}
        
        {activeTab === 'stats' && (
          <StatsTab 
            userRewards={userRewards}
            globalStats={globalStats}
            tipToken={tipToken}
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ tipToken, userRewards, globalStats }: any) {
  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Coins className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded">
              TIP Balance
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-purple-900">{tipToken.balance}</div>
            <div className="text-sm text-purple-600">{tipToken.symbol} Tokens</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-green-700 bg-green-200 px-2 py-1 rounded">
              Total Earned
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-green-900">
              {userRewards.totalEarned ? Number(userRewards.totalEarned) / 10**18 : 0}
            </div>
            <div className="text-sm text-green-600">TIP Rewards</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Flame className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded">
              Stories Published
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-orange-900">{userRewards.storiesCreated}</div>
            <div className="text-sm text-orange-600">Total Stories</div>
          </div>
        </motion.div>
      </div>

      {/* Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Activity Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userRewards.storiesCreated}</div>
            <div className="text-sm text-gray-600">Stories Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userRewards.storiesCreated * 5}</div>
            <div className="text-sm text-gray-600">Chapters Written</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {globalStats.totalDistributed}
            </div>
            <div className="text-sm text-gray-600">Global TIP Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">6</div>
            <div className="text-sm text-gray-600">Active Contracts</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <a
          href={getAddressUrl(tipToken.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <div>
            <div className="font-medium text-blue-900">View TIP Token Contract</div>
            <div className="text-sm text-blue-600">Explore on StoryScan</div>
          </div>
          <ExternalLink className="w-5 h-5 text-blue-600" />
        </a>

        <a
          href={STORY_TESTNET_CONFIG.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
        >
          <div>
            <div className="font-medium text-purple-900">Get Test Tokens</div>
            <div className="text-sm text-purple-600">Story Protocol Faucet</div>
          </div>
          <ExternalLink className="w-5 h-5 text-purple-600" />
        </a>
      </motion.div>
    </div>
  )
}

function ClaimTab({ claimStoryReward, userRewards }: any) {
  const [storyTitle, setStoryTitle] = useState('')
  const [testStoryId] = useState('test-story-id-123')
  const [testChapterNumber] = useState(1)

  const handleClaimStoryReward = () => {
    if (!storyTitle.trim()) {
      alert('Please enter a story title')
      return
    }
    claimStoryReward.claimReward(storyTitle, '0x1234567890123456789012345678901234567890' as any)
  }


  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🧪 Contract Integration Demo</h3>
        <p className="text-sm text-blue-700">
          These are live interactions with our deployed smart contracts on Story Protocol Aeneid Testnet.
          Transactions require gas fees (testnet IP tokens).
        </p>
      </div>

      {/* Story Creation Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Story Creation Rewards (50 TIP)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Title (for demo)
            </label>
            <input
              type="text"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Enter a story title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={handleClaimStoryReward}
            disabled={claimStoryReward.isLoading || !storyTitle.trim()}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              claimStoryReward.isLoading || !storyTitle.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {claimStoryReward.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Claiming Reward...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                Claim Story Creation Reward (50 TIP)
              </>
            )}
          </button>

          {claimStoryReward.isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✅ Reward claimed successfully! 
                {claimStoryReward.transactionHash && (
                  <a
                    href={getExplorerUrl(claimStoryReward.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 underline hover:no-underline"
                  >
                    View transaction
                  </a>
                )}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Future Staking Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-50 border border-gray-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-gray-400" />
          Staking Rewards (Coming Soon)
        </h3>
        
        <p className="text-gray-600 mb-4">
          Stake your TIP tokens to earn passive rewards and unlock exclusive platform benefits.
        </p>
        
        <div className="bg-white rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Expected APY:</span>
            <span className="font-medium text-gray-900">12-20%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Lock Periods:</span>
            <span className="font-medium text-gray-900">30, 90, 180 days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Launch Date:</span>
            <span className="font-medium text-gray-900">~2 weeks</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StatsTab({ userRewards, globalStats, tipToken }: any) {
  return (
    <div className="space-y-6">
      {/* Contract Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Live Contract Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Total TIP Supply</div>
            <div className="text-xl font-bold text-gray-900">{tipToken.totalSupply}</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Rewards Distributed</div>
            <div className="text-xl font-bold text-gray-900">{globalStats.totalDistributed}</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Network</div>
            <div className="text-xl font-bold text-gray-900">Story Aeneid</div>
          </div>
        </div>
      </motion.div>

      {/* Your Performance */}
      {userRewards.isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your rewards data...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Stories Created</span>
              <span className="font-semibold">{userRewards.storiesCreated}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Chapters Written</span>
              <span className="font-semibold">{userRewards.storiesCreated * 5}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Rewards Earned</span>
              <span className="font-semibold">
                {userRewards.totalEarned ? Number(userRewards.totalEarned) / 10**18 : 0} TIP
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 
