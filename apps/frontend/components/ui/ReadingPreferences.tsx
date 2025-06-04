/**
 * Reading Preferences Component
 * Allows users to customize their reading experience with font size and font family options
 */

'use client'

import { useState, useEffect } from 'react'
import { Type, Minus, Plus, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ReadingPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  fontFamily: 'inter' | 'georgia' | 'merriweather'
}

interface ReadingPreferencesProps {
  onPreferencesChange: (preferences: ReadingPreferences) => void
  className?: string
}

const FONT_SIZES = {
  small: { label: 'Small', value: '16px', lineHeight: '1.5' },
  medium: { label: 'Medium', value: '18px', lineHeight: '1.6' },
  large: { label: 'Large', value: '20px', lineHeight: '1.7' },
  'extra-large': { label: 'Extra Large', value: '24px', lineHeight: '1.8' }
}

const FONT_FAMILIES = {
  inter: {
    label: 'Inter',
    description: 'Clean & Modern',
    className: 'font-inter',
    cssFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  georgia: {
    label: 'Georgia',
    description: 'Classic Serif',
    className: 'font-georgia',
    cssFamily: "'Georgia', 'Times New Roman', serif"
  },
  merriweather: {
    label: 'Merriweather',
    description: 'Reading Optimized',
    className: 'font-merriweather',
    cssFamily: "'Merriweather', Georgia, serif"
  }
}

const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontSize: 'medium',
  fontFamily: 'inter'
}

export default function ReadingPreferences({ onPreferencesChange, className = '' }: ReadingPreferencesProps) {
  const [preferences, setPreferences] = useState<ReadingPreferences>(DEFAULT_PREFERENCES)
  const [isOpen, setIsOpen] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('storyhouse_reading_preferences')
    if (saved) {
      try {
        const parsedPreferences = JSON.parse(saved)
        setPreferences(parsedPreferences)
        onPreferencesChange(parsedPreferences)
      } catch (e) {
        console.warn('Could not load reading preferences:', e)
      }
    } else {
      onPreferencesChange(DEFAULT_PREFERENCES)
    }
  }, [onPreferencesChange])

  // Save preferences to localStorage and notify parent
  const updatePreferences = (newPreferences: ReadingPreferences) => {
    setPreferences(newPreferences)
    localStorage.setItem('storyhouse_reading_preferences', JSON.stringify(newPreferences))
    onPreferencesChange(newPreferences)
  }

  const changeFontSize = (direction: 'increase' | 'decrease') => {
    const sizes = Object.keys(FONT_SIZES) as Array<keyof typeof FONT_SIZES>
    const currentIndex = sizes.indexOf(preferences.fontSize)

    let newIndex
    if (direction === 'increase') {
      newIndex = Math.min(currentIndex + 1, sizes.length - 1)
    } else {
      newIndex = Math.max(currentIndex - 1, 0)
    }

    updatePreferences({
      ...preferences,
      fontSize: sizes[newIndex]
    })
  }

  const changeFontFamily = (fontFamily: keyof typeof FONT_FAMILIES) => {
    updatePreferences({
      ...preferences,
      fontFamily
    })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        <Type className="w-4 h-4" />
        <span className="hidden sm:inline">Reading</span>
        <Settings className="w-4 h-4" />
      </motion.button>

      {/* Preferences Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Desktop Backdrop */}
            <div
              className="fixed inset-0 z-40 hidden sm:block"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-80 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50
                         sm:absolute fixed sm:top-full top-1/2 sm:right-0 left-1/2 sm:left-auto
                         sm:transform-none transform -translate-x-1/2 -translate-y-1/2
                         sm:mt-2 mt-0"
            >
              <div className="p-4 sm:p-6">
                {/* Mobile Close Button */}
                <div className="flex justify-between items-center mb-4 sm:hidden">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Reading Preferences
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Desktop Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 hidden sm:flex">
                  <Type className="w-5 h-5" />
                  Reading Preferences
                </h3>

                {/* Font Size Controls */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Font Size
                  </label>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => changeFontSize('decrease')}
                      disabled={preferences.fontSize === 'small'}
                      className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <div className="flex-1 mx-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {FONT_SIZES[preferences.fontSize].label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {FONT_SIZES[preferences.fontSize].value}
                      </div>
                    </div>

                    <button
                      onClick={() => changeFontSize('increase')}
                      disabled={preferences.fontSize === 'extra-large'}
                      className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Font Family Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Font Style
                  </label>
                  <div className="space-y-2">
                    {Object.entries(FONT_FAMILIES).map(([key, font]) => (
                      <button
                        key={key}
                        onClick={() => changeFontFamily(key as keyof typeof FONT_FAMILIES)}
                        className={`w-full p-4 text-left rounded-lg border transition-all min-h-[44px] ${
                          preferences.fontFamily === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <div
                          className="font-medium text-gray-900 mb-1 text-base"
                          style={{ fontFamily: font.cssFamily }}
                        >
                          {font.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {font.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Text */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Preview:</div>
                  <div
                    className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm sm:text-base"
                    style={{
                      fontFamily: FONT_FAMILIES[preferences.fontFamily].cssFamily,
                      fontSize: FONT_SIZES[preferences.fontSize].value,
                      lineHeight: FONT_SIZES[preferences.fontSize].lineHeight
                    }}
                  >
                    Detective Sarah Chen had seen many strange things in her fifteen-year career,
                    but nothing had prepared her for what she found in her grandmother's attic.
                  </div>
                </div>

                {/* Mobile Apply Button */}
                <div className="mt-6 sm:hidden">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Export utility function to apply reading preferences
export function applyReadingPreferences(preferences: ReadingPreferences) {
  return {
    fontFamily: FONT_FAMILIES[preferences.fontFamily].cssFamily,
    fontSize: FONT_SIZES[preferences.fontSize].value,
    lineHeight: FONT_SIZES[preferences.fontSize].lineHeight
  }
}
