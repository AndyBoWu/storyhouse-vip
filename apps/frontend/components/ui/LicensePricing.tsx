/**
 * License Pricing Component
 * Displays pricing details and revenue projections for licenses
 */

'use client'

import { useState } from 'react'
import { Coins, TrendingUp, Users, DollarSign, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { LicenseTier } from './LicenseDisplay'

export interface PricingTier {
  tier: LicenseTier
  price: number
  readerEarns: number
  creatorNets: number
  estimatedDaily: {
    min: number
    max: number
  }
  features: string[]
  recommended?: boolean
}

interface LicensePricingProps {
  chapterNumber: number
  tiers: PricingTier[]
  selectedTier?: LicenseTier
  onTierSelect?: (tier: LicenseTier) => void
  showProjections?: boolean
  className?: string
}

const DEFAULT_TIERS: PricingTier[] = [
  {
    tier: 'free',
    price: 0,
    readerEarns: 0.02,
    creatorNets: 0,
    estimatedDaily: { min: 0, max: 0 },
    features: [
      'Basic reading access',
      'IP protection',
      'No commercial rights'
    ]
  },
  {
    tier: 'premium',
    price: 0.1,
    readerEarns: 0.05,
    creatorNets: 0.05,
    estimatedDaily: { min: 0.5, max: 2.0 },
    features: [
      'Commercial use permitted',
      'Creator revenue share',
      'Attribution required'
    ],
    recommended: true
  },
  {
    tier: 'exclusive',
    price: 0.5,
    readerEarns: 0.1,
    creatorNets: 0.4,
    estimatedDaily: { min: 2.0, max: 8.0 },
    features: [
      'Full derivative rights',
      'Premium revenue share',
      'Exclusive licensing'
    ]
  }
]

export default function LicensePricing({
  chapterNumber,
  tiers = DEFAULT_TIERS,
  selectedTier,
  onTierSelect,
  showProjections = true,
  className = ''
}: LicensePricingProps) {
  const [expandedTier, setExpandedTier] = useState<LicenseTier | null>(null)

  const getTierConfig = (tier: LicenseTier) => {
    switch (tier) {
      case 'free':
        return {
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'premium':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'exclusive':
        return {
          color: 'purple',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
    }
  }

  const handleTierClick = (tier: LicenseTier) => {
    if (onTierSelect) {
      onTierSelect(tier)
    }
    setExpandedTier(expandedTier === tier ? null : tier)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          💰 Chapter {chapterNumber} Pricing
        </h3>
        <p className="text-gray-600">
          {chapterNumber <= 3 
            ? "Free chapters build your audience for premium content"
            : "Choose your monetization strategy"
          }
        </p>
      </div>

      <div className="grid gap-4">
        {tiers.map((tierData) => {
          const config = getTierConfig(tierData.tier)
          const isSelected = selectedTier === tierData.tier
          const isExpanded = expandedTier === tierData.tier
          const isFree = chapterNumber <= 3 && tierData.tier === 'free'

          return (
            <div
              key={tierData.tier}
              className={`border-2 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? `${config.borderColor} ${config.bgColor}`
                  : 'border-gray-200 hover:border-gray-300'
              } ${tierData.recommended ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              onClick={() => handleTierClick(tierData.tier)}
            >
              {/* Tier Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${config.bgColor} rounded-lg`}>
                      <Coins className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {tierData.tier} License
                        {tierData.recommended && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Recommended
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {isFree ? 'Build your audience' : `${tierData.price} TIP per unlock`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tierData.price > 0 && (
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {tierData.price} TIP
                        </div>
                        <div className="text-xs text-gray-500">
                          per reader
                        </div>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">
                      {tierData.readerEarns} TIP
                    </div>
                    <div className="text-xs text-gray-500">Reader Earns</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">
                      {tierData.creatorNets} TIP
                    </div>
                    <div className="text-xs text-gray-500">You Net</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">
                      {tierData.estimatedDaily.min}-{tierData.estimatedDaily.max}
                    </div>
                    <div className="text-xs text-gray-500">Daily Est.</div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={`border-t border-gray-200 p-4 ${config.bgColor}`}>
                  <div className="space-y-4">
                    {/* Features */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Features Included</h5>
                      <ul className="space-y-1">
                        {tierData.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Revenue Projection */}
                    {showProjections && tierData.price > 0 && (
                      <div className="p-3 bg-white/50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Revenue Projection
                        </h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Daily readers (est.)</div>
                            <div className="font-medium">10-40 readers</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Monthly potential</div>
                            <div className="font-medium text-green-600">
                              {(tierData.estimatedDaily.min * 30).toFixed(1)}-{(tierData.estimatedDaily.max * 30).toFixed(1)} TIP
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Free Chapter Notice */}
                    {isFree && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <strong>Strategy Tip:</strong> Free chapters (1-3) build your audience. 
                            Readers who enjoy your opening will pay for premium chapters starting at Chapter 4.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Revenue Info */}
      {showProjections && (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Chapter Economics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">Readers Pay</div>
              <div className="text-gray-600">Unlock chapters with TIP tokens</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">You Earn</div>
              <div className="text-gray-600">Revenue from chapter unlocks</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}