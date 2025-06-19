/**
 * ChapterCard Component
 * Displays chapter with available translations
 * Reuses current StoryHouse design system
 */

import { useState } from 'react'
import type { ChapterIP } from '@storyhouse/shared/types/ip'
import { Globe, Lock, CheckCircle, AlertCircle } from 'lucide-react'

interface ChapterCardProps {
  chapter: ChapterIP
  translations: ChapterIP[]
  isUnlocked: boolean
  onRead: (chapterIpId: string) => void
  onTranslate?: () => void
}

export function ChapterCard({
  chapter,
  translations,
  isUnlocked,
  onRead,
  onTranslate
}: ChapterCardProps) {
  const [showTranslations, setShowTranslations] = useState(false)

  // Group translations by language
  const translationsByLang = translations.reduce((acc, t) => {
    acc[t.language] = t
    return acc
  }, {} as Record<string, ChapterIP>)

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Chapter Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              Chapter {chapter.chapterNumber}: {chapter.title}
            </h3>
            <p className="text-sm text-gray-500">
              {chapter.wordCount.toLocaleString()} words • {chapter.language.toUpperCase()}
            </p>
          </div>
          
          {/* Lock/Unlock Status */}
          <div className="ml-4">
            {isUnlocked ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Lock className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Chapter Preview */}
        <p className="text-gray-600 line-clamp-3 mb-4">
          {chapter.content.substring(0, 200)}...
        </p>

        {/* Translation Options */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-secondary transition-colors"
          >
            <Globe className="w-4 h-4" />
            {translations.length} translations available
          </button>
          
          {chapter.isOriginal && (
            <button
              onClick={onTranslate}
              className="ml-auto text-sm text-accent hover:text-accent/80 transition-colors font-medium"
            >
              + Add Translation
            </button>
          )}
        </div>

        {/* Available Translations */}
        {showTranslations && translations.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Available in:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_LANGUAGES.map(lang => {
                const translation = translationsByLang[lang.code]
                const isAvailable = !!translation
                
                return (
                  <button
                    key={lang.code}
                    onClick={() => isAvailable && onRead(translation.ipId)}
                    disabled={!isAvailable || !isUnlocked}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isAvailable && isUnlocked
                        ? 'bg-gradient-brand text-white hover:opacity-90'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="block">{lang.nativeName}</span>
                    <span className="text-xs opacity-75">{lang.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onRead(chapter.ipId)}
            disabled={!isUnlocked}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold transition-all
              ${isUnlocked
                ? 'bg-gradient-brand text-white hover:opacity-90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isUnlocked ? 'Read Chapter' : 'Unlock to Read'}
          </button>
        </div>

        {/* Translation Quality Indicator */}
        {!chapter.isOriginal && chapter.translationMetadata && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {chapter.translationMetadata.verificationStatus === 'verified' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    Verified translation • Quality: {chapter.translationMetadata.qualityScore}%
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700">
                    Pending verification
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Royalty Flow Indicator */}
      {!chapter.isOriginal && (
        <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
          25% royalties flow to original {chapter.translationMetadata?.sourceLanguage.toUpperCase()} version
        </div>
      )}
    </div>
  )
}

// Re-export language constants
import { SUPPORTED_LANGUAGES } from '@storyhouse/shared/types/ip'