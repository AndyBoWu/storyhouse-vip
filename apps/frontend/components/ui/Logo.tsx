'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Logo() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link 
      href="/" 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="StoryHouse Home"
    >
      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
        {/* Book pages effect behind S */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-2 bg-white/10 rounded-full transform rotate-3 group-hover:rotate-6 transition-transform duration-300" />
          <div className="absolute inset-2 bg-white/10 rounded-full transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300" />
        </div>
        
        {/* S letterform with book spine illusion */}
        <div className="relative z-10">
          <svg 
            viewBox="0 0 40 40" 
            className="w-7 h-7"
            fill="none"
          >
            {/* Book spine shape integrated with S */}
            <path
              d="M 20 8 C 15 8 12 10 12 13 C 12 16 14 17 18 18 L 22 19 C 26 20 28 22 28 25 C 28 28 25 30 20 30 C 15 30 12 28 12 25"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="drop-shadow-sm"
            />
            {/* Page lines to suggest book */}
            <line x1="16" y1="12" x2="16" y2="28" stroke="white" strokeWidth="0.5" opacity="0.6" />
            <line x1="24" y1="12" x2="24" y2="28" stroke="white" strokeWidth="0.5" opacity="0.6" />
          </svg>
        </div>

        {/* Glow effect on hover */}
        <div className={`absolute inset-0 rounded-full bg-white/20 blur-md transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Tooltip */}
      <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
        StoryHouse Home
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </Link>
  )
}