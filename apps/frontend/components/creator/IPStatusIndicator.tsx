/**
 * @fileoverview IP Status Indicator Component
 * Shows the current IP registration status with visual indicators
 */

'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react'
import type {
  EnhancedStory,
  LicenseTier
} from '../../lib/types/shared'

interface IPStatusIndicatorProps {
  story?: EnhancedStory | null
  ipRegistrationStatus?: 'none' | 'pending' | 'registered' | 'failed'
  licenseStatus?: 'none' | 'attached' | 'available'
  availableLicenseTypes?: LicenseTier[]
  royaltyEarnings?: number
  hasClaimableRoyalties?: boolean
  compact?: boolean
  showDetails?: boolean
}

export default function IPStatusIndicator({
  story,
  ipRegistrationStatus = story?.ipRegistrationStatus || 'none',
  licenseStatus = story?.licenseStatus || 'none',
  availableLicenseTypes = story?.availableLicenseTypes || [],
  royaltyEarnings = story?.royaltyEarnings || 0,
  hasClaimableRoyalties = story?.hasClaimableRoyalties || false,
  compact = false,
  showDetails = true
}: IPStatusIndicatorProps) {

  const getStatusConfig = () => {
    switch (ipRegistrationStatus) {
      case 'none':
        return {
          icon: Shield,
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          title: 'Not Registered',
          description: 'Story is not registered as an IP asset',
          actionText: 'Register as IP Asset'
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          title: 'Registration Pending',
          description: 'IP asset registration is being processed',
          actionText: 'View Transaction'
        }
      case 'registered':
        return {
          icon: CheckCircle,
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          title: 'IP Asset Registered',
          description: 'Story is protected as an IP asset on Story Protocol',
          actionText: 'View IP Asset'
        }
      case 'failed':
        return {
          icon: XCircle,
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          title: 'Registration Failed',
          description: 'IP asset registration encountered an error',
          actionText: 'Retry Registration'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          title: 'Unknown Status',
          description: 'IP status is unknown',
          actionText: 'Check Status'
        }
    }
  }

  const getLicenseStatusConfig = () => {
    switch (licenseStatus) {
      case 'none':
        return {
          title: 'No License',
          description: 'No license terms attached',
          color: 'gray'
        }
      case 'attached':
        return {
          title: 'License Terms Set',
          description: `${availableLicenseTypes.length} license tier${availableLicenseTypes.length !== 1 ? 's' : ''} available`,
          color: 'blue'
        }
      case 'available':
        return {
          title: 'Licensed for Use',
          description: 'Available for licensing by others',
          color: 'green'
        }
      default:
        return {
          title: 'Unknown',
          description: 'License status unknown',
          color: 'gray'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const licenseConfig = getLicenseStatusConfig()
  const StatusIcon = statusConfig.icon

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded-full ${statusConfig.bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
        </div>
        <span className={`text-sm font-medium ${statusConfig.textColor}`}>
          {statusConfig.title}
        </span>
        {ipRegistrationStatus === 'registered' && hasClaimableRoyalties && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <DollarSign className="w-3 h-3" />
            <span>Royalties</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main IP Status */}
      <div className={`border-2 ${statusConfig.borderColor} rounded-lg p-4 ${statusConfig.bgColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
            </div>
            <div>
              <h4 className={`font-semibold ${statusConfig.textColor}`}>
                {statusConfig.title}
              </h4>
              <p className={`text-sm ${statusConfig.textColor} opacity-80`}>
                {statusConfig.description}
              </p>
            </div>
          </div>

          {showDetails && (
            <button className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} ${statusConfig.textColor} hover:opacity-80 transition-opacity text-sm`}>
              {statusConfig.actionText}
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Additional Info for Registered IP */}
        {ipRegistrationStatus === 'registered' && story && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
            <div>
              <span className="text-sm font-medium text-green-700">IP Asset ID:</span>
              <p className="text-sm text-green-600 font-mono truncate">
                {story.ipAssetId || 'Loading...'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-green-700">Blockchain:</span>
              <p className="text-sm text-green-600">Story Protocol</p>
            </div>
          </div>
        )}

        {/* Error Details for Failed Registration */}
        {ipRegistrationStatus === 'failed' && story?.ipRegistrationError && (
          <div className="pt-3 border-t border-red-200">
            <span className="text-sm font-medium text-red-700">Error Details:</span>
            <p className="text-sm text-red-600 mt-1">
              {story.ipRegistrationError}
            </p>
          </div>
        )}
      </div>

      {/* License Status */}
      {showDetails && ipRegistrationStatus === 'registered' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">License Status</h4>
              <p className="text-sm text-gray-600">
                {licenseConfig.description}
              </p>
            </div>
          </div>

          {/* Available License Tiers */}
          {availableLicenseTypes.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Available License Tiers:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {availableLicenseTypes.map((tier, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">{tier.displayName}</span>
                      <span className="text-sm text-gray-600">{tier.royaltyPercentage}%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {Number(tier.price) / 1e18} TIP tokens
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Royalty Earnings */}
      {showDetails && ipRegistrationStatus === 'registered' && (royaltyEarnings > 0 || hasClaimableRoyalties) && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Royalty Earnings</h4>
                <p className="text-sm text-green-700">
                  Earnings from derivative works and licensing
                </p>
              </div>
            </div>

            {hasClaimableRoyalties && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Claim Royalties
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-green-800">Total Earned:</span>
              <p className="text-lg font-bold text-green-700">
                {royaltyEarnings.toLocaleString()} TIP
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-green-800">Status:</span>
              <p className={`text-sm font-medium ${
                hasClaimableRoyalties ? 'text-orange-600' : 'text-green-600'
              }`}>
                {hasClaimableRoyalties ? 'Claimable' : 'Up to date'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Derivative Tracking */}
      {showDetails && ipRegistrationStatus === 'registered' && story?.derivativeChain && story.derivativeChain.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-800">Derivative Works</h4>
              <p className="text-sm text-purple-700">
                Stories created based on this IP asset
              </p>
            </div>
          </div>

          <div className="text-sm text-purple-700">
            <span className="font-medium">{story.derivativeChain.length}</span> derivative work{story.derivativeChain.length !== 1 ? 's' : ''} created
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      {showDetails && ipRegistrationStatus === 'none' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Why Register as IP Asset?</h4>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span>Protect your creative work on-chain</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span>Earn royalties from derivative works</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span>Enable licensing and commercial use</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span>Build a verifiable creative portfolio</span>
            </li>
          </ul>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Register This Story as IP Asset
          </motion.button>
        </div>
      )}
    </div>
  )
}
