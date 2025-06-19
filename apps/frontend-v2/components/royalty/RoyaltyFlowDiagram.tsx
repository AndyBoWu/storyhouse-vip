/**
 * RoyaltyFlowDiagram Component
 * Visualizes the royalty flow in chapter translation hierarchy
 * Uses current StoryHouse design system
 */

import { ArrowDown, Globe, DollarSign, Users } from 'lucide-react'
import type { ChapterIP, RoyaltyFlow } from '@storyhouse/shared-v2/types/ip'

interface RoyaltyFlowDiagramProps {
  originalChapter: ChapterIP
  translations: ChapterIP[]
  royaltyFlows: RoyaltyFlow[]
}

export function RoyaltyFlowDiagram({
  originalChapter,
  translations,
  royaltyFlows
}: RoyaltyFlowDiagramProps) {
  // Calculate total royalties flowing to original
  const totalRoyaltiesToOriginal = royaltyFlows
    .filter(flow => flow.toIpId === originalChapter.ipId)
    .reduce((sum, flow) => sum + Number(flow.accumulated), 0)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-accent" />
        Royalty Flow Structure
      </h3>

      {/* Original Chapter */}
      <div className="relative">
        <div className="bg-gradient-brand text-white rounded-lg p-4 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-90">Original Chapter</p>
              <h4 className="font-bold text-lg">
                Chapter {originalChapter.chapterNumber} ({originalChapter.language.toUpperCase()})
              </h4>
              <p className="text-sm mt-1 opacity-90">
                by {originalChapter.creator.slice(0, 6)}...{originalChapter.creator.slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total Royalties</p>
              <p className="text-xl font-bold">
                {(totalRoyaltiesToOriginal / 1e18).toFixed(2)} TIP
              </p>
            </div>
          </div>
        </div>

        {/* Translation Branches */}
        {translations.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center">
              <ArrowDown className="w-6 h-6 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {translations.map((translation) => {
                const flowToOriginal = royaltyFlows.find(
                  f => f.fromIpId === translation.ipId && f.toIpId === originalChapter.ipId
                )
                
                return (
                  <div key={translation.ipId} className="relative">
                    {/* Connection Line */}
                    <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-gray-300" />
                    
                    {/* Translation Card */}
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-brand-primary transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-brand-primary" />
                        <span className="font-medium text-gray-700">
                          {getLanguageName(translation.language)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Translator: {translation.creator.slice(0, 6)}...
                      </p>

                      {/* Royalty Info */}
                      <div className="bg-white rounded p-2 text-center">
                        <p className="text-xs text-gray-500">25% royalty</p>
                        <p className="font-bold text-brand-primary">
                          {flowToOriginal 
                            ? `${(Number(flowToOriginal.accumulated) / 1e18).toFixed(2)} TIP`
                            : '0 TIP'
                          }
                        </p>
                      </div>

                      {/* Sub-derivatives (e.g., audio versions) */}
                      {translation.derivativeCount > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {translation.derivativeCount} derivatives
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Translations Yet */}
        {translations.length === 0 && (
          <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No translations yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Be the first to translate this chapter and earn 75% of revenues!
            </p>
          </div>
        )}
      </div>

      {/* Royalty Legend */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How Royalties Work</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Translations pay 25% royalty to original chapter</li>
          <li>• Audio/video versions pay 20% to their parent translation</li>
          <li>• All payments in TIP tokens via Story Protocol</li>
          <li>• Royalties are automatically distributed on-chain</li>
        </ul>
      </div>
    </div>
  )
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic'
  }
  return languages[code] || code.toUpperCase()
}

// Extend ChapterIP type locally for derivative count
interface ChapterIP extends ChapterIP {
  derivativeCount?: number
}