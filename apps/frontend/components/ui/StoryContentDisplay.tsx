/**
 * Story Content Display Component
 * Optimized reading experience with customizable typography
 */

'use client'

import { useState, useEffect } from 'react'
import ReadingPreferences, {
  ReadingPreferences as ReadingPreferencesType,
  applyReadingPreferences
} from './ReadingPreferences'
import ReadingProgressBar from './ReadingProgressBar'
import ContentProtection from './ContentProtection'
import ObfuscatedContent from './ObfuscatedContent'
import { Clock, Eye, BookOpen, Share2, Shield } from 'lucide-react'
import LicenseDisplay, { LicenseInfo } from './LicenseDisplay'

interface StoryContentDisplayProps {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes?: string[]
  contentRating?: string
  showHeader?: boolean
  showToolbar?: boolean
  className?: string
  licenseInfo?: LicenseInfo
  showLicense?: boolean
}

export default function StoryContentDisplay({
  title,
  content,
  wordCount,
  readingTime,
  themes = [],
  contentRating,
  showHeader = true,
  showToolbar = true,
  className = '',
  licenseInfo,
  showLicense = true
}: StoryContentDisplayProps) {
  const [readingPreferences, setReadingPreferences] = useState<ReadingPreferencesType>({
    fontSize: 'medium',
    fontFamily: 'inter'
  })

  const handlePreferencesChange = (preferences: ReadingPreferencesType) => {
    setReadingPreferences(preferences)
  }

  const contentStyles = applyReadingPreferences(readingPreferences)

  return (
    <>
      {/* Reading Progress Bar */}
      <ReadingProgressBar color="purple" height={4} animate={true} />
      
      <ContentProtection className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="protected-content">
          {/* Story Header */}
          {showHeader && (
            <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight no-copy">
                {title}
              </h1>

              {/* Story Metadata */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{wordCount.toLocaleString()} words</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime} min read</span>
                </div>
                {contentRating && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>Rated {contentRating}</span>
                  </div>
                )}
              </div>

              {/* Themes */}
              {themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full no-copy"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* License Information */}
          {showLicense && licenseInfo && (
            <div className="mb-6">
              <LicenseDisplay license={licenseInfo} showDetails={false} />
            </div>
          )}

          {/* Reading Toolbar */}
          {showToolbar && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:block">Customize your reading experience:</span>
                <span className="text-sm text-gray-600 sm:hidden">Customize reading:</span>
              </div>

              <div className="flex items-center justify-end gap-3">
                <ReadingPreferences
                  onPreferencesChange={handlePreferencesChange}
                />
                <button
                  className="p-2.5 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
                  title="Share story"
                >
                  <Share2 className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Protected Story Content */}
          <div className="prose prose-lg max-w-none protected-content">
            <article
              className="leading-relaxed text-gray-900"
              style={contentStyles}
            >
              <ObfuscatedContent content={content} />
            </article>
          </div>

          {/* Reading Progress */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-600">
              <span>Reading time: ~{readingTime} minutes</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          </div>
        </div>
      </ContentProtection>
    </>
  )
}
