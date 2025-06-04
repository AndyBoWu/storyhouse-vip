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
import { Clock, Eye, BookOpen, Share2 } from 'lucide-react'

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
  className = ''
}: StoryContentDisplayProps) {
  const [readingPreferences, setReadingPreferences] = useState<ReadingPreferencesType>({
    fontSize: 'medium',
    fontFamily: 'inter'
  })

  const handlePreferencesChange = (preferences: ReadingPreferencesType) => {
    setReadingPreferences(preferences)
  }

  const contentStyles = applyReadingPreferences(readingPreferences)

  // Split content into paragraphs for better formatting
  const paragraphs = content.split('\n\n').filter(p => p.trim())

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Story Header */}
      {showHeader && (
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
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
                  className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}
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

      {/* Story Content */}
      <div className="prose prose-lg max-w-none">
        <article
          className="leading-relaxed text-gray-900"
          style={contentStyles}
        >
          {paragraphs.map((paragraph, index) => {
            // Handle chapter titles (lines that start with "Chapter")
            if (paragraph.trim().startsWith('Chapter')) {
              return (
                <h2
                  key={index}
                  className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-gray-900 border-b border-gray-200 pb-2"
                  style={{ fontFamily: contentStyles.fontFamily }}
                >
                  {paragraph.trim()}
                </h2>
              )
            }

            // Handle dialogue (lines with quotes)
            if (paragraph.includes('"')) {
              return (
                <p
                  key={index}
                  className="mb-4 sm:mb-6 text-gray-800 italic"
                  style={contentStyles}
                >
                  {paragraph}
                </p>
              )
            }

            // Regular paragraphs
            return (
              <p
                key={index}
                className="mb-4 sm:mb-6 text-gray-800"
                style={contentStyles}
              >
                {paragraph}
              </p>
            )
          })}
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
  )
}
