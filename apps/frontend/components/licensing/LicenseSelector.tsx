'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  DollarSign, 
  Users, 
  Check, 
  Info, 
  Crown, 
  Zap,
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { apiRequest } from '@/lib/api-client'

export interface LicenseTemplate {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  terms: {
    commercialUse: boolean
    derivativesAllowed: boolean
    attribution: boolean
    shareAlike: boolean
    exclusivity: boolean
    commercialRevShare: number
    allowedUses: string[]
    restrictions: string[]
  }
  royaltyPolicy: {
    type: string
    percentage: number
    stakingReward: number
    distributionDelay: number
  }
  metadata: {
    icon: string
    color: string
    category: string
    popularity: number
  }
}

interface LicenseSelectorProps {
  selectedLicense?: string
  onLicenseSelect: (licenseId: string, template: LicenseTemplate) => void
  onCustomLicense?: () => void
  className?: string
}

export default function LicenseSelector({
  selectedLicense,
  onLicenseSelect,
  onCustomLicense,
  className = ''
}: LicenseSelectorProps) {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  // Fetch license templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        // Use apiRequest for consistent API handling and CORS
        const data = await apiRequest('/licenses/templates')
        
        if (data.success) {
          setTemplates(data.templates)
        } else {
          setError(data.error || 'Failed to load license templates')
        }
      } catch (err) {
        console.error('License templates fetch error:', err)
        setError('Unable to connect to licensing service')
        // Fallback to hardcoded templates
        setTemplates(FALLBACK_TEMPLATES)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleTemplateSelect = (template: LicenseTemplate) => {
    onLicenseSelect(template.id, template)
    setExpandedTemplate(null)
  }

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId)
  }

  const getTemplateIcon = (template: LicenseTemplate) => {
    switch (template.id) {
      case 'standard':
        return <Shield className="w-6 h-6 text-green-600" />
      case 'premium':
        return <DollarSign className="w-6 h-6 text-blue-600" />
      case 'exclusive':
        return <Crown className="w-6 h-6 text-purple-600" />
      default:
        return <Zap className="w-6 h-6 text-gray-600" />
    }
  }

  const getTemplateColorClass = (template: LicenseTemplate, isSelected: boolean) => {
    const baseClasses = 'border-2 rounded-xl p-4 cursor-pointer transition-all duration-200'
    
    if (isSelected) {
      switch (template.metadata.color) {
        case 'green':
          return `${baseClasses} border-green-500 bg-green-50 shadow-lg`
        case 'blue':
          return `${baseClasses} border-blue-500 bg-blue-50 shadow-lg`
        case 'purple':
          return `${baseClasses} border-purple-500 bg-purple-50 shadow-lg`
        default:
          return `${baseClasses} border-gray-500 bg-gray-50 shadow-lg`
      }
    }
    
    return `${baseClasses} border-gray-200 bg-white hover:border-gray-300 hover:shadow-md`
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading license templates...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">License Templates Unavailable</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Choose License Type</h3>
        <span className="text-sm text-gray-500">{templates.length} available</span>
      </div>

      <div className="space-y-3">
        {templates.map((template) => {
          const isSelected = selectedLicense === template.id
          const isExpanded = expandedTemplate === template.id
          
          return (
            <motion.div
              key={template.id}
              layout
              className={getTemplateColorClass(template, isSelected)}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getTemplateIcon(template)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">{template.displayName}</h4>
                      <span className="text-lg">{template.metadata.icon}</span>
                      {isSelected && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {template.price} {template.currency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {template.metadata.popularity}% popular
                      </span>
                      {template.terms.commercialUse && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Commercial
                        </span>
                      )}
                      {template.terms.exclusivity && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          Exclusive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanded(template.id)
                  }}
                  className="ml-2 p-1 hover:bg-gray-100 rounded"
                >
                  <Info className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">License Terms</h5>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${template.terms.commercialUse ? 'bg-green-500' : 'bg-red-500'}`} />
                            Commercial Use: {template.terms.commercialUse ? 'Allowed' : 'Not Allowed'}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${template.terms.derivativesAllowed ? 'bg-green-500' : 'bg-red-500'}`} />
                            Derivatives: {template.terms.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${template.terms.attribution ? 'bg-blue-500' : 'bg-gray-400'}`} />
                            Attribution: {template.terms.attribution ? 'Required' : 'Not Required'}
                          </li>
                          {template.terms.commercialRevShare > 0 && (
                            <li className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              Revenue Share: {template.terms.commercialRevShare}%
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Royalty Policy</h5>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>Type: {template.royaltyPolicy.type}</li>
                          <li>Percentage: {template.royaltyPolicy.percentage}%</li>
                          <li>Staking Reward: {template.royaltyPolicy.stakingReward}%</li>
                          <li>Distribution: {template.royaltyPolicy.distributionDelay > 0 ? 
                            `${Math.floor(template.royaltyPolicy.distributionDelay / 86400)} days` : 'Immediate'}</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h5 className="font-medium text-gray-700 mb-2">Allowed Uses</h5>
                      <div className="flex flex-wrap gap-2">
                        {template.terms.allowedUses.map((use) => (
                          <span key={use} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            {use.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {onCustomLicense && (
        <button
          onClick={onCustomLicense}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Zap className="w-5 h-5" />
            <span>Create Custom License</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Define your own terms and conditions</p>
        </button>
      )}
    </div>
  )
}

// Fallback templates in case API is unavailable
const FALLBACK_TEMPLATES: LicenseTemplate[] = [
  {
    id: 'standard',
    name: 'Standard License',
    displayName: 'Free License',
    description: 'Open access with attribution. Great for building audience.',
    price: 0,
    currency: 'TIP',
    terms: {
      commercialUse: false,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false,
      commercialRevShare: 0,
      allowedUses: ['reading', 'sharing', 'non-commercial-derivatives'],
      restrictions: ['no-commercial-use', 'attribution-required']
    },
    royaltyPolicy: {
      type: 'LAP',
      percentage: 0,
      stakingReward: 0,
      distributionDelay: 0
    },
    metadata: {
      icon: '🆓',
      color: 'green',
      category: 'open',
      popularity: 85
    }
  },
  {
    id: 'premium',
    name: 'Premium License',
    displayName: 'Commercial License',
    description: 'Commercial use allowed with revenue sharing.',
    price: 100,
    currency: 'TIP',
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false,
      commercialRevShare: 10,
      allowedUses: ['reading', 'sharing', 'commercial-derivatives', 'commercial-use'],
      restrictions: ['attribution-required', 'revenue-sharing']
    },
    royaltyPolicy: {
      type: 'LRP',
      percentage: 10,
      stakingReward: 5,
      distributionDelay: 86400
    },
    metadata: {
      icon: '💰',
      color: 'blue',
      category: 'commercial',
      popularity: 60
    }
  },
  {
    id: 'exclusive',
    name: 'Exclusive License',
    displayName: 'Exclusive Rights',
    description: 'Full commercial rights with higher revenue share.',
    price: 1000,
    currency: 'TIP',
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: true,
      commercialRevShare: 25,
      allowedUses: ['reading', 'sharing', 'commercial-derivatives', 'commercial-use', 'exclusive-rights'],
      restrictions: ['attribution-required', 'high-revenue-sharing']
    },
    royaltyPolicy: {
      type: 'LRP',
      percentage: 25,
      stakingReward: 10,
      distributionDelay: 604800
    },
    metadata: {
      icon: '👑',
      color: 'purple',
      category: 'exclusive',
      popularity: 25
    }
  }
]