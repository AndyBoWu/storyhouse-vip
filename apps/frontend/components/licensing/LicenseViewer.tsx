'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  DollarSign, 
  Users, 
  Check, 
  X,
  Crown, 
  Info,
  ExternalLink,
  Copy,
  Calendar,
  TrendingUp
} from 'lucide-react'

export interface LicenseInfo {
  licenseTermsId: string
  ipAssetId: string
  templateId: string
  templateName: string
  attachedAt: string
  isActive: boolean
  terms: {
    commercialUse: boolean
    derivativesAllowed: boolean
    attribution: boolean
    shareAlike: boolean
    exclusivity: boolean
    commercialRevShare: number
    humanReadable: {
      commercialUse: string
      derivatives: string
      attribution: string
      royalties: string
      exclusivity: string
    }
  }
  usage?: {
    totalPurchases: number
    totalRevenue: string
    activeDerivatives: number
  }
  costs: {
    mintingFee: string
    tipPrice: number
    royaltyPercentage: number
  }
  metadata: {
    storyProtocolVersion: string
    pilVersion: string
    chainId: number
    network: string
  }
}

interface LicenseViewerProps {
  licenseInfo: LicenseInfo
  showUsageStats?: boolean
  showTechnicalDetails?: boolean
  className?: string
}

export default function LicenseViewer({
  licenseInfo,
  showUsageStats = true,
  showTechnicalDetails = false,
  className = ''
}: LicenseViewerProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'standard':
        return <Shield className="w-5 h-5 text-green-600" />
      case 'premium':
        return <DollarSign className="w-5 h-5 text-blue-600" />
      case 'exclusive':
        return <Crown className="w-5 h-5 text-purple-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
        <Check className="w-3 h-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
        <X className="w-3 h-3" />
        Inactive
      </span>
    )
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getTemplateIcon(licenseInfo.templateId)}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {licenseInfo.templateName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                PIL License • Attached {formatDate(licenseInfo.attachedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(licenseInfo.isActive)}
          </div>
        </div>
      </div>

      {/* License Terms Summary */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-medium text-gray-800 mb-4">License Terms</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Commercial Use</span>
              <span className={`text-sm font-medium ${licenseInfo.terms.commercialUse ? 'text-green-600' : 'text-red-600'}`}>
                {licenseInfo.terms.humanReadable.commercialUse}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Derivatives</span>
              <span className={`text-sm font-medium ${licenseInfo.terms.derivativesAllowed ? 'text-green-600' : 'text-red-600'}`}>
                {licenseInfo.terms.humanReadable.derivatives}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Attribution</span>
              <span className={`text-sm font-medium ${licenseInfo.terms.attribution ? 'text-blue-600' : 'text-gray-600'}`}>
                {licenseInfo.terms.humanReadable.attribution}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Royalties</span>
              <span className="text-sm font-medium text-purple-600">
                {licenseInfo.terms.humanReadable.royalties}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      {showUsageStats && licenseInfo.usage && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800">Usage Statistics</h4>
            <button
              onClick={() => toggleSection('usage')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedSection === 'usage' ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-lg font-semibold text-gray-800">
                  {licenseInfo.usage.totalPurchases}
                </span>
              </div>
              <p className="text-xs text-gray-600">Purchases</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-lg font-semibold text-gray-800">
                  {licenseInfo.usage.totalRevenue}
                </span>
              </div>
              <p className="text-xs text-gray-600">Revenue</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-lg font-semibold text-gray-800">
                  {licenseInfo.usage.activeDerivatives}
                </span>
              </div>
              <p className="text-xs text-gray-600">Derivatives</p>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      {showTechnicalDetails && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800">Technical Details</h4>
            <button
              onClick={() => toggleSection('technical')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedSection === 'technical' ? 'Hide' : 'Show'}
            </button>
          </div>

          {expandedSection === 'technical' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Identifiers</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">License Terms ID</span>
                      <button
                        onClick={() => copyToClipboard(licenseInfo.licenseTermsId, 'termsId')}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="font-mono">{licenseInfo.licenseTermsId.slice(0, 8)}...</span>
                        {copied === 'termsId' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">IP Asset ID</span>
                      <button
                        onClick={() => copyToClipboard(licenseInfo.ipAssetId, 'ipAssetId')}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <span className="font-mono">{licenseInfo.ipAssetId.slice(0, 8)}...</span>
                        {copied === 'ipAssetId' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Network Info</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Chain ID</span>
                      <span className="text-xs text-gray-800">{licenseInfo.metadata.chainId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Network</span>
                      <span className="text-xs text-gray-800 capitalize">{licenseInfo.metadata.network.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">PIL Version</span>
                      <span className="text-xs text-gray-800">{licenseInfo.metadata.pilVersion}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ExternalLink className="w-4 h-4" />
            View on Story Protocol
          </button>
          <button 
            onClick={() => copyToClipboard(window.location.href, 'url')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Share License
          </button>
        </div>
      </div>
    </div>
  )
}