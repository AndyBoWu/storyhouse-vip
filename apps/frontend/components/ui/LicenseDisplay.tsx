/**
 * License Display Component
 * Shows license tier information for stories
 */

'use client'

import { Shield, Crown, Star, Lock, Unlock, DollarSign } from 'lucide-react'

export type LicenseTier = 'free' | 'premium' | 'exclusive'

export interface LicenseInfo {
  tier: LicenseTier
  price: number
  commercialUse: boolean
  derivativesAllowed: boolean
  royaltyPercentage: number
  transferable: boolean
  expiration?: number
}

interface LicenseDisplayProps {
  license: LicenseInfo
  showDetails?: boolean
  className?: string
}

const TIER_CONFIG = {
  free: {
    icon: Unlock,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    title: 'Free License',
    description: 'Basic reading access'
  },
  premium: {
    icon: Shield,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    title: 'Premium License',
    description: 'Commercial use permitted'
  },
  exclusive: {
    icon: Crown,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    iconColor: 'text-purple-600',
    title: 'Exclusive License',
    description: 'Full rights & derivatives'
  }
}

export default function LicenseDisplay({
  license,
  showDetails = true,
  className = ''
}: LicenseDisplayProps) {
  const config = TIER_CONFIG[license.tier]
  const IconComponent = config.icon

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${config.bgColor} rounded-lg`}>
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${config.textColor}`}>{config.title}</h3>
          <p className={`text-sm ${config.textColor} opacity-80`}>{config.description}</p>
        </div>
        {license.price > 0 && (
          <div className={`flex items-center gap-1 ${config.textColor} font-medium`}>
            <DollarSign className="w-4 h-4" />
            <span>{license.price} TIP</span>
          </div>
        )}
      </div>

      {/* License Details */}
      {showDetails && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              {license.commercialUse ? (
                <Star className="w-4 h-4 text-green-500" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className={license.commercialUse ? 'text-green-700' : 'text-gray-500'}>
                Commercial Use
              </span>
            </div>
            <div className="flex items-center gap-2">
              {license.derivativesAllowed ? (
                <Star className="w-4 h-4 text-green-500" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className={license.derivativesAllowed ? 'text-green-700' : 'text-gray-500'}>
                Derivative Works
              </span>
            </div>
          </div>

          {license.royaltyPercentage > 0 && (
            <div className={`text-sm ${config.textColor} p-2 bg-white/50 rounded`}>
              <span className="font-medium">Royalty: </span>
              <span>{license.royaltyPercentage}% to original creator</span>
            </div>
          )}

          {license.expiration && (
            <div className={`text-xs ${config.textColor} opacity-70`}>
              Expires: {new Date(license.expiration * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}