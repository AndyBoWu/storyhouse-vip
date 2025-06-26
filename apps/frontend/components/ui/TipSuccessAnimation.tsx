'use client'

import { useEffect, useState } from 'react'
import { Heart, Sparkles } from 'lucide-react'

interface TipSuccessAnimationProps {
  show: boolean
  amount: string
  onComplete?: () => void
}

export function TipSuccessAnimation({ show, amount, onComplete }: TipSuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (show) {
      setIsVisible(true)
      
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Overlay with confetti-like particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles 
              className="w-4 h-4 text-purple-500 opacity-60"
              style={{
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Center success message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 transform animate-bounce-in pointer-events-auto">
          <div className="text-center">
            {/* Animated hearts */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="w-16 h-16 text-pink-500 animate-pulse" fill="currentColor" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center animate-ping">
                <Heart className="w-16 h-16 text-pink-400" fill="currentColor" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tip Sent!
            </h3>
            <p className="text-gray-600 text-lg">
              You sent <span className="font-bold text-purple-600">{amount} TIP</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Thank you for supporting the author!
            </p>
            
            {/* Success checkmark */}
            <div className="mt-4 inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          70% {
            transform: scale(0.9) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  )
}