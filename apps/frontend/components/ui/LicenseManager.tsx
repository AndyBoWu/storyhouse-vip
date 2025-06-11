/**
 * License Manager Component
 * Comprehensive license management and display for stories
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Info, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import LicenseDisplay, { LicenseInfo } from './LicenseDisplay'
import LicensePricing, { PricingTier } from './LicensePricing'
import LicensePermissions, { DEFAULT_PERMISSIONS, PermissionSet } from './LicensePermissions'

interface LicenseManagerProps {
  storyId: string
  chapterNumber: number
  currentLicense?: LicenseInfo
  availableTiers?: PricingTier[]
  showPricing?: boolean
  showPermissions?: boolean
  editable?: boolean
  onLicenseChange?: (newLicense: LicenseInfo) => void
  className?: string
}

type ViewMode = 'display' | 'pricing' | 'permissions' | 'comparison'

export default function LicenseManager({
  storyId,
  chapterNumber,
  currentLicense,
  availableTiers,
  showPricing = false,
  showPermissions = false,
  editable = false,
  onLicenseChange,
  className = ''
}: LicenseManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('display')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Default license for free chapters
  const defaultLicense: LicenseInfo = {
    tier: chapterNumber <= 3 ? 'free' : 'premium',
    price: chapterNumber <= 3 ? 0 : 0.1,
    commercialUse: chapterNumber > 3,
    derivativesAllowed: chapterNumber > 3,
    royaltyPercentage: chapterNumber > 3 ? 25 : 0,
    transferable: chapterNumber > 3
  }

  const license = currentLicense || defaultLicense

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleTierSelect = (tier: string) => {
    if (!editable || !onLicenseChange) return

    const newLicense: LicenseInfo = {
      ...license,
      tier: tier as any,
      price: tier === 'free' ? 0 : tier === 'premium' ? 0.1 : 0.5,
      commercialUse: tier !== 'free',
      derivativesAllowed: tier !== 'free',
      royaltyPercentage: tier === 'free' ? 0 : tier === 'premium' ? 25 : 15
    }

    onLicenseChange(newLicense)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main License Display */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              License Information
            </h3>
            {editable && (
              <button
                onClick={() => setViewMode(viewMode === 'display' ? 'pricing' : 'display')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {viewMode === 'display' && (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LicenseDisplay license={license} showDetails={true} />
                
                {/* Free Chapter Notice */}
                {chapterNumber <= 3 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <strong>Free Chapter Strategy:</strong> Chapters 1-3 are free to build your audience. 
                        Paid licensing and advanced features become available starting with Chapter 4.
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {viewMode === 'pricing' && availableTiers && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LicensePricing
                  chapterNumber={chapterNumber}
                  tiers={availableTiers}
                  selectedTier={license.tier}
                  onTierSelect={handleTierSelect}
                  showProjections={true}
                />
              </motion.div>
            )}

            {viewMode === 'permissions' && (
              <motion.div
                key="permissions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LicensePermissions
                  permissionSet={DEFAULT_PERMISSIONS[license.tier]}
                />
              </motion.div>
            )}

            {viewMode === 'comparison' && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LicensePermissions
                  permissionSet={DEFAULT_PERMISSIONS[license.tier]}
                  showComparison={true}
                  comparisonTiers={chapterNumber <= 3 ? ['free'] : ['free', 'premium', 'exclusive']}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="space-y-2">
        {/* Pricing Section */}
        {(showPricing || editable) && chapterNumber > 3 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('pricing')}
              className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-gray-900">Pricing & Revenue</span>
              {expandedSection === 'pricing' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'pricing' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setViewMode('pricing')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Detailed Pricing →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Permissions Section */}
        {showPermissions && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('permissions')}
              className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-gray-900">Rights & Permissions</span>
              {expandedSection === 'permissions' ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'permissions' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t border-gray-200 space-y-3">
                    <button
                      onClick={() => setViewMode('permissions')}
                      className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Detailed Permissions →
                    </button>
                    <button
                      onClick={() => setViewMode('comparison')}
                      className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Compare All License Types →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* View Mode Navigation */}
      {(viewMode !== 'display') && (
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('display')}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to License Display
          </button>
          {chapterNumber > 3 && viewMode !== 'comparison' && (
            <button
              onClick={() => setViewMode('comparison')}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Compare Licenses
            </button>
          )}
        </div>
      )}
    </div>
  )
}