'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

interface TipAuthorButtonProps {
  authorAddress: string
  authorName?: string
  bookId?: string
  chapterNumber?: number
  onTipClick: () => void
  className?: string
}

export function TipAuthorButton({
  authorAddress,
  authorName,
  bookId,
  chapterNumber,
  onTipClick,
  className = ''
}: TipAuthorButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <button
      onClick={onTipClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative inline-flex items-center gap-2 px-4 py-2 
        bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
        text-white font-medium rounded-full shadow-md hover:shadow-lg
        transform hover:scale-105 transition-all duration-200 ${className}`}
    >
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
      
      {/* Button content */}
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <Heart className={`w-4 h-4 transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} 
                 fill={isHovered ? 'currentColor' : 'currentColor'} />
          {/* Pulse animation on hover */}
          {isHovered && (
            <div className="absolute inset-0 animate-ping">
              <Heart className="w-4 h-4" fill="currentColor" />
            </div>
          )}
        </div>
        <span>TIP</span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 
                      bg-gray-900 text-white text-xs rounded-md whitespace-nowrap
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
        Tip {authorName || 'the author'} with TIP tokens
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </button>
  )
}

// Compact version for inline use
export function TipAuthorButtonCompact({
  onTipClick,
  className = ''
}: {
  onTipClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onTipClick}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 
        bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200
        text-purple-700 font-medium rounded-full text-sm
        transform hover:scale-105 transition-all duration-200 ${className}`}
    >
      <Heart className="w-3.5 h-3.5 group-hover:fill-current transition-all duration-200" />
      <span>Tip</span>
    </button>
  )
}