'use client'

import { useState, useEffect } from 'react'

interface ReadingProgressBarProps {
  /** Optional color theme - blue or green */
  color?: 'blue' | 'green'
  /** Height of the progress bar in pixels */
  height?: number
  /** Whether to show pulsing animation */
  animate?: boolean
}

export default function ReadingProgressBar({
  color = 'blue',
  height = 3,
  animate = true
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY
      const documentHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const scrollableHeight = documentHeight - windowHeight

      if (scrollableHeight <= 0) {
        setProgress(0)
        return
      }

      const scrollProgress = (scrollTop / scrollableHeight) * 100
      setProgress(Math.min(100, Math.max(0, scrollProgress)))
    }

    // Calculate initial progress
    calculateProgress()

    // Add scroll listener
    window.addEventListener('scroll', calculateProgress, { passive: true })
    window.addEventListener('resize', calculateProgress, { passive: true })

    return () => {
      window.removeEventListener('scroll', calculateProgress)
      window.removeEventListener('resize', calculateProgress)
    }
  }, [])

  const neonColors = {
    blue: {
      bg: 'bg-blue-950/30',
      progress: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600',
      shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.8),0_0_40px_rgba(59,130,246,0.4)]'
    },
    green: {
      bg: 'bg-emerald-950/30',
      progress: 'bg-gradient-to-r from-emerald-400 via-green-500 to-green-600',
      shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.8),0_0_40px_rgba(34,197,94,0.4)]'
    }
  }

  const theme = neonColors[color]

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ height: `${height}px` }}
    >
      {/* Background track */}
      <div className={`w-full h-full ${theme.bg} backdrop-blur-sm`} />
      
      {/* Progress bar */}
      <div
        className={`
          absolute top-0 left-0 h-full transition-all duration-150 ease-out
          ${theme.progress} ${theme.shadow}
          ${animate ? `${theme.glow} animate-pulse` : ''}
        `}
        style={{ 
          width: `${progress}%`,
          filter: 'brightness(1.1) saturate(1.2)'
        }}
      />

      {/* Additional glow effect */}
      <div
        className={`
          absolute top-0 left-0 h-full transition-all duration-150 ease-out
          ${theme.progress} opacity-40 blur-sm
        `}
        style={{ width: `${progress}%` }}
      />

      {/* Progress indicator dot */}
      {progress > 0 && (
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full
            ${color === 'blue' ? 'bg-blue-300' : 'bg-green-300'}
            ${theme.glow}
            ${animate ? 'animate-ping' : ''}
          `}
          style={{ 
            left: `${progress}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
    </div>
  )
} 
