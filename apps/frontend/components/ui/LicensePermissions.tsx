/**
 * License Permissions Component
 * Displays detailed rights and permissions for different license types
 */

'use client'

import { Shield, Check, X, AlertTriangle, Users, Building, Palette, Share } from 'lucide-react'
import { LicenseTier } from './LicenseDisplay'

export interface PermissionSet {
  tier: LicenseTier
  permissions: {
    read: boolean
    download: boolean
    share: boolean
    commercialUse: boolean
    modify: boolean
    redistribute: boolean
    createDerivatives: boolean
    monetizeDerivatives: boolean
    attribution: 'none' | 'required' | 'prominent'
    royaltyRequired: boolean
    royaltyPercentage?: number
    exclusivity: boolean
    transferable: boolean
  }
  restrictions: string[]
  useCases: string[]
}

interface LicensePermissionsProps {
  permissionSet: PermissionSet
  showComparison?: boolean
  comparisonTiers?: LicenseTier[]
  className?: string
}

const DEFAULT_PERMISSIONS: Record<LicenseTier, PermissionSet> = {
  free: {
    tier: 'free',
    permissions: {
      read: true,
      download: false,
      share: true,
      commercialUse: false,
      modify: false,
      redistribute: false,
      createDerivatives: false,
      monetizeDerivatives: false,
      attribution: 'required',
      royaltyRequired: false,
      exclusivity: false,
      transferable: false
    },
    restrictions: [
      'Personal use only',
      'No commercial exploitation',
      'Cannot modify content',
      'Attribution required when sharing'
    ],
    useCases: [
      'Personal reading',
      'Educational reference',
      'Social media sharing with attribution',
      'Book reviews and discussions'
    ]
  },
  premium: {
    tier: 'premium',
    permissions: {
      read: true,
      download: true,
      share: true,
      commercialUse: true,
      modify: true,
      redistribute: true,
      createDerivatives: true,
      monetizeDerivatives: true,
      attribution: 'required',
      royaltyRequired: true,
      royaltyPercentage: 25,
      exclusivity: false,
      transferable: true
    },
    restrictions: [
      'Attribution must be prominent',
      '25% royalty on derivative works',
      'Cannot claim original authorship',
      'License terms cannot be modified'
    ],
    useCases: [
      'Commercial publications',
      'Educational course materials',
      'Derivative works (remixes, adaptations)',
      'Content licensing to third parties'
    ]
  },
  exclusive: {
    tier: 'exclusive',
    permissions: {
      read: true,
      download: true,
      share: true,
      commercialUse: true,
      modify: true,
      redistribute: true,
      createDerivatives: true,
      monetizeDerivatives: true,
      attribution: 'prominent',
      royaltyRequired: true,
      royaltyPercentage: 15,
      exclusivity: true,
      transferable: true
    },
    restrictions: [
      'Single licensee only',
      '15% royalty on derivative works',
      'Exclusive rights within defined scope',
      'Cannot sublicense without permission'
    ],
    useCases: [
      'Exclusive publishing rights',
      'Film/TV adaptation rights',
      'Merchandising and branding',
      'Complete IP ownership transfer'
    ]
  }
}

const PermissionIcon = ({ granted, className = "" }: { granted: boolean; className?: string }) => (
  granted ? (
    <Check className={`w-4 h-4 text-green-500 ${className}`} />
  ) : (
    <X className={`w-4 h-4 text-red-500 ${className}`} />
  )
)

export default function LicensePermissions({
  permissionSet,
  showComparison = false,
  comparisonTiers = [],
  className = ''
}: LicensePermissionsProps) {
  const getTierColor = (tier: LicenseTier) => {
    switch (tier) {
      case 'free': return 'text-green-600'
      case 'premium': return 'text-blue-600'
      case 'exclusive': return 'text-purple-600'
    }
  }

  const renderPermissionRow = (
    label: string,
    permission: boolean,
    icon: React.ComponentType<{ className?: string }>,
    description?: string
  ) => {
    const IconComponent = icon
    return (
      <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
        <div className="p-2 bg-gray-50 rounded-lg">
          <IconComponent className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{label}</span>
            <PermissionIcon granted={permission} />
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    )
  }

  if (showComparison && comparisonTiers.length > 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">License Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Permission</th>
                {comparisonTiers.map(tier => (
                  <th key={tier} className={`px-4 py-3 text-center text-sm font-medium ${getTierColor(tier)} capitalize`}>
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries({
                'Reading Access': 'read',
                'Download Content': 'download',
                'Share/Distribute': 'share',
                'Commercial Use': 'commercialUse',
                'Modify Content': 'modify',
                'Create Derivatives': 'createDerivatives',
                'Monetize Derivatives': 'monetizeDerivatives',
                'Transferable': 'transferable'
              }).map(([label, key]) => (
                <tr key={key}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{label}</td>
                  {comparisonTiers.map(tier => {
                    const permissions = DEFAULT_PERMISSIONS[tier].permissions
                    const granted = permissions[key as keyof typeof permissions] as boolean
                    return (
                      <td key={tier} className="px-4 py-3 text-center">
                        <PermissionIcon granted={granted} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className={`text-xl font-semibold ${getTierColor(permissionSet.tier)} capitalize mb-2`}>
          {permissionSet.tier} License Permissions
        </h3>
        <p className="text-gray-600">
          Detailed rights and restrictions for this license tier
        </p>
      </div>

      {/* Core Permissions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Core Permissions
        </h4>
        
        <div className="grid gap-3">
          {renderPermissionRow(
            'Reading Access',
            permissionSet.permissions.read,
            Users,
            'Read the story content online'
          )}
          
          {renderPermissionRow(
            'Download Content',
            permissionSet.permissions.download,
            Share,
            'Save content for offline reading'
          )}
          
          {renderPermissionRow(
            'Commercial Use',
            permissionSet.permissions.commercialUse,
            Building,
            'Use content for business purposes'
          )}
          
          {renderPermissionRow(
            'Create Derivatives',
            permissionSet.permissions.createDerivatives,
            Palette,
            'Create adaptations, remixes, or inspired works'
          )}
        </div>
      </div>

      {/* Attribution & Royalties */}
      {(permissionSet.permissions.attribution !== 'none' || permissionSet.permissions.royaltyRequired) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Attribution & Royalties
          </h4>
          <div className="space-y-2 text-sm text-yellow-700">
            {permissionSet.permissions.attribution !== 'none' && (
              <div>
                <span className="font-medium">Attribution: </span>
                {permissionSet.permissions.attribution === 'required' ? 'Required' : 'Prominent display required'}
              </div>
            )}
            {permissionSet.permissions.royaltyRequired && permissionSet.permissions.royaltyPercentage && (
              <div>
                <span className="font-medium">Royalty: </span>
                {permissionSet.permissions.royaltyPercentage}% of revenue from derivatives
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restrictions */}
      {permissionSet.restrictions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Restrictions</h4>
          <ul className="space-y-2">
            {permissionSet.restrictions.map((restriction, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                {restriction}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Use Cases */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Common Use Cases</h4>
        <ul className="space-y-2">
          {permissionSet.useCases.map((useCase, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {useCase}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export { DEFAULT_PERMISSIONS }