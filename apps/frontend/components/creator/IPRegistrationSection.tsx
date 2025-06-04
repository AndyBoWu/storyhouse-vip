/**
 * @fileoverview IP Registration Section for Enhanced Story Creation
 * Allows users to register their stories as IP assets on Story Protocol
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Crown,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Users,
  Zap,
  Lock,
  Globe
} from 'lucide-react'
import type {
  LicenseTier,
  EnhancedStoryCreationParams
} from '@storyhouse/shared'

interface IPRegistrationSectionProps {
  onIPOptionsChange: (options: Partial<EnhancedStoryCreationParams>) => void
  initialOptions?: Partial<EnhancedStoryCreationParams>
  isCollapsed?: boolean
}

export default function IPRegistrationSection({
  onIPOptionsChange,
  initialOptions = {},
  isCollapsed = true
}: IPRegistrationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed)
  const [registerAsIP, setRegisterAsIP] = useState(initialOptions.registerAsIP || false)
  const [selectedLicenseType, setSelectedLicenseType] = useState<'standard' | 'premium' | 'exclusive' | 'custom'>(
    initialOptions.licenseType || 'standard'
  )
  const [commercialRights, setCommercialRights] = useState(initialOptions.commercialRights ?? true)
  const [derivativeRights, setDerivativeRights] = useState(initialOptions.derivativeRights ?? true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // License tier configurations
  const licenseTiers: Record<'standard' | 'premium' | 'exclusive', {
    name: string
    price: number
    royalty: number
    icon: any
    color: string
    description: string
    features: string[]
  }> = {
    standard: {
      name: 'Standard License',
      price: 100,
      royalty: 5,
      icon: Shield,
      color: 'blue',
      description: 'Perfect for most creators who want basic IP protection',
      features: ['Commercial use allowed', 'Derivatives allowed', 'Attribution required', '5% royalty share']
    },
    premium: {
      name: 'Premium License',
      price: 500,
      royalty: 10,
      icon: Star,
      color: 'purple',
      description: 'Enhanced protection with higher royalty rates',
      features: ['All Standard features', 'Premium marketplace placement', '10% royalty share', 'Priority support']
    },
    exclusive: {
      name: 'Exclusive License',
      price: 2000,
      royalty: 20,
      icon: Crown,
      color: 'gold',
      description: 'Maximum protection and earnings for premium content',
      features: ['All Premium features', 'Exclusive licensing rights', '20% royalty share', 'Maximum protection']
    }
  }

  const handleIPToggle = (enabled: boolean) => {
    setRegisterAsIP(enabled)
    updateOptions({ registerAsIP: enabled })
  }

  const handleLicenseTypeChange = (type: 'standard' | 'premium' | 'exclusive' | 'custom') => {
    setSelectedLicenseType(type)
    updateOptions({ licenseType: type })
  }

  const updateOptions = (updates: Partial<EnhancedStoryCreationParams>) => {
    const newOptions = {
      ...initialOptions,
      registerAsIP,
      licenseType: selectedLicenseType,
      commercialRights,
      derivativeRights,
      ...updates
    }
    onIPOptionsChange(newOptions)
  }

  const selectedTier = licenseTiers[selectedLicenseType as keyof typeof licenseTiers]

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-6 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                IP Asset Registration
                {registerAsIP && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Enabled
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                Protect your story with Story Protocol blockchain technology
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {registerAsIP && selectedTier && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{selectedTier.name}</div>
                <div className="text-xs text-gray-500">{selectedTier.price} TIP • {selectedTier.royalty}% royalty</div>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* IP Registration Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Register as IP Asset</h4>
                    <p className="text-sm text-gray-600">
                      Register your story on Story Protocol for enhanced protection and royalty earning
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerAsIP}
                    onChange={(e) => handleIPToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* License Tier Selection */}
              {registerAsIP && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-medium text-gray-800">Choose License Tier</h4>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Higher tiers offer better protection and royalty rates
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(licenseTiers).map(([key, tier]) => {
                      const Icon = tier.icon
                      const isSelected = selectedLicenseType === key

                      return (
                        <motion.button
                          key={key}
                          onClick={() => handleLicenseTypeChange(key as any)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              tier.color === 'blue' ? 'bg-blue-100' :
                              tier.color === 'purple' ? 'bg-purple-100' :
                              'bg-yellow-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                tier.color === 'blue' ? 'text-blue-600' :
                                tier.color === 'purple' ? 'text-purple-600' :
                                'text-yellow-600'
                              }`} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-800">{tier.name}</h5>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{tier.price} TIP</span>
                                <span>•</span>
                                <span>{tier.royalty}% royalty</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">{tier.description}</p>

                          <div className="space-y-1">
                            {tier.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Rights Configuration */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h5 className="font-medium text-gray-800">Rights & Permissions</h5>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <div>
                            <span className="text-sm font-medium text-gray-800">Commercial Use</span>
                            <p className="text-xs text-gray-600">Allow others to use for commercial purposes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={commercialRights}
                            onChange={(e) => {
                              setCommercialRights(e.target.checked)
                              updateOptions({ commercialRights: e.target.checked })
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-purple-600" />
                          <div>
                            <span className="text-sm font-medium text-gray-800">Derivative Works</span>
                            <p className="text-xs text-gray-600">Allow remixes and adaptations</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={derivativeRights}
                            onChange={(e) => {
                              setDerivativeRights(e.target.checked)
                              updateOptions({ derivativeRights: e.target.checked })
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Options
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-lg p-4 space-y-4"
                      >
                        <h6 className="font-medium text-gray-800">Custom License Terms</h6>
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">🚧 Coming soon:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• Custom royalty percentages</li>
                            <li>• Geographic restrictions</li>
                            <li>• Time-limited licenses</li>
                            <li>• Content restrictions</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Registration Summary */}
                  {selectedTier && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h5 className="font-medium text-blue-800">Registration Summary</h5>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">License Type:</span>
                          <p className="text-blue-600">{selectedTier.name}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Registration Cost:</span>
                          <p className="text-blue-600">{selectedTier.price} TIP tokens</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Royalty Rate:</span>
                          <p className="text-blue-600">{selectedTier.royalty}% on derivatives</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Rights:</span>
                          <p className="text-blue-600">
                            {commercialRights && derivativeRights ? 'Full Rights' :
                             commercialRights ? 'Commercial Only' :
                             derivativeRights ? 'Derivatives Only' :
                             'View Only'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
