'use client'

import { motion } from 'framer-motion'
import RewardsDashboard from '../../components/RewardsDashboard'
import WalletConnect from '../../components/WalletConnect'
import { useAccount } from 'wagmi'
import { Sparkles, Coins, BookOpen, Users } from 'lucide-react'

export default function RewardsPage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-4xl md:text-5xl font-bold">
                StoryHouse Rewards
              </h1>
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Earn TIP tokens for creating stories and engaging with the community
            </p>
            <div className="mt-8 flex justify-center">
              <WalletConnect />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Story Creation</h3>
            <p className="text-gray-600 mb-4">
              Earn 50 TIP tokens for every original story you publish on StoryHouse.
            </p>
            <div className="text-2xl font-bold text-purple-600">50 TIP</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Staking Rewards</h3>
            <p className="text-gray-600 mb-4">
              Stake your TIP tokens to earn passive rewards. Coming in ~2 weeks!
            </p>
            <div className="text-2xl font-bold text-green-600">12-20% APY</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Engagement</h3>
            <p className="text-gray-600 mb-4">
              Earn bonus rewards through quality ratings, remixes, and community participation.
            </p>
            <div className="text-2xl font-bold text-orange-600">Bonus</div>
          </div>
        </motion.div>

        {/* Live Contract Integration */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RewardsDashboard />
          </motion.div>
        )}

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to start earning rewards?
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your wallet to access the live rewards dashboard and interact with our deployed smart contracts.
            </p>
            <WalletConnect />
          </motion.div>
        )}

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-gray-50 rounded-xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Powered by Smart Contracts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">TIP Token Contract</h4>
              <p className="text-sm text-gray-600 mb-2">
                ERC-20 token powering the StoryHouse ecosystem
              </p>
              <a
                href="https://aeneid.storyscan.xyz/address/0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View on StoryScan →
              </a>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Rewards Manager</h4>
              <p className="text-sm text-gray-600 mb-2">
                Central hub for managing all reward distributions
              </p>
              <a
                href="https://aeneid.storyscan.xyz/address/0xf5ae031ba92295c2ae86a99e88f09989339707e5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View on StoryScan →
              </a>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Creator Controller</h4>
              <p className="text-sm text-gray-600 mb-2">
                Handles story creation and creator engagement rewards
              </p>
              <a
                href="https://aeneid.storyscan.xyz/address/0x8e2d21d1b9c744f772f15a7007de3d5757eea333"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View on StoryScan →
              </a>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Chapter Access</h4>
              <p className="text-sm text-gray-600 mb-2">
                Manages chapter unlocking and author revenue sharing
              </p>
              <a
                href="https://aeneid.storyscan.xyz/address/0x04553ba8316d407b1c58b99172956d2d5fe100e5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View on StoryScan →
              </a>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Access Control</h4>
              <p className="text-sm text-gray-600 mb-2">
                Unified permissions system for all contracts
              </p>
              <a
                href="https://aeneid.storyscan.xyz/address/0x41e2db0d016e83ddc3c464ffd260d22a6c898341"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View on StoryScan →
              </a>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Remix Licensing</h4>
              <p className="text-sm text-gray-600 mb-2">
                Handles remix creation and licensing rewards
              </p>
              <a
                href="https://aeneid.storyscan.xyz/address/0x16144746a33d9a172039efc64bc2e12445fbbef2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View on StoryScan →
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              All contracts are deployed and operational on{' '}
              <span className="font-semibold">Story Protocol Aeneid Testnet</span>.
              Total deployment cost: ~0.0144 ETH
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
