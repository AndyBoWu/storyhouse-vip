'use client'

import { useEffect, useState, ReactNode } from 'react'

interface ObfuscatedContentProps {
  content: string
  className?: string
}

export default function ObfuscatedContent({ content, className = '' }: ObfuscatedContentProps) {
  const [decodedContent, setDecodedContent] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Simple encoding/decoding to obscure content in HTML source
  const encodeContent = (text: string): string => {
    return btoa(encodeURIComponent(text))
  }

  const decodeContent = (encoded: string): string => {
    try {
      return decodeURIComponent(atob(encoded))
    } catch {
      return ''
    }
  }

  // Split content into chunks and render with delays
  const chunkContent = (text: string, chunkSize: number = 50): string[] => {
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }
    return chunks
  }

  useEffect(() => {
    // Encode the content
    const encoded = encodeContent(content)
    
    // Decode and render with artificial delay
    const timer = setTimeout(() => {
      const decoded = decodeContent(encoded)
      setDecodedContent(decoded)
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [content])

  // Anti-bot measures: check for common bot user agents
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    // Check for legitimate browsers first
    const legitimateBrowsers = [
      'mozilla/', 'chrome/', 'safari/', 'firefox/', 'edge/', 'opera/'
    ]

    const isLegitmateBrowser = legitimateBrowsers.some(browser => 
      userAgent.includes(browser) && 
      (userAgent.includes('mozilla/') || userAgent.includes('webkit'))
    )

    // More precise bot patterns
    const botPatterns = [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
      'crawler', 'spider', 'scraper', 'curl', 'wget', 
      'python-requests', 'python-urllib', 'headless', 'phantomjs', 'selenium',
      'puppeteer', 'playwright'
    ]

    const isBot = !isLegitmateBrowser && botPatterns.some(pattern => userAgent.includes(pattern))
    
    if (isBot) {
      setDecodedContent('⚠️ Automated access detected. Please access this content through a regular browser.')
      return
    }

    // Check if JavaScript is enabled (bots often don't execute JS properly)
    const jsCheck = document.createElement('script')
    jsCheck.type = 'text/javascript'
    jsCheck.innerHTML = 'window.__jsEnabled = true;'
    document.head.appendChild(jsCheck)
    
    setTimeout(() => {
      if (!(window as any).__jsEnabled) {
        setDecodedContent('⚠️ JavaScript is required to view this content.')
      }
      document.head.removeChild(jsCheck)
    }, 50)
  }, [])

  // Render content in a way that's harder to scrape
  const renderProtectedContent = (text: string) => {
    if (!text) return null

    // Split paragraphs and add random attributes to make parsing harder
    const paragraphs = text.split('\n\n').filter(p => p.trim())
    
    return paragraphs.map((paragraph, index) => {
      // Add random data attributes and classes to confuse scrapers
      const randomId = Math.random().toString(36).substring(2, 15)
      const randomClass = `content-${Math.random().toString(36).substring(2, 8)}`
      
      return (
        <div
          key={`${index}-${randomId}`}
          className={`${randomClass} mb-4 sm:mb-6`}
          data-chunk={randomId}
          data-index={index}
          style={{
            // Random styling to make automated extraction harder
            letterSpacing: '0.01em',
            lineHeight: '1.6',
          }}
        >
          {/* Split text into spans with random attributes */}
          {paragraph.split(' ').map((word, wordIndex) => (
            <span
              key={`${wordIndex}-${word}`}
              data-w={Math.random().toString(36).substring(2, 5)}
              className={`word-${wordIndex % 3}`}
            >
              {word}
              {wordIndex < paragraph.split(' ').length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      )
    })
  }

  if (!isLoaded) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`text-gray-800 leading-relaxed ${className}`}>
      {renderProtectedContent(decodedContent)}
      
      {/* Decoy content to confuse scrapers */}
      <div style={{ display: 'none', visibility: 'hidden', opacity: 0 }}>
        <span data-fake="true">This is fake content to confuse scrapers.</span>
        <div className="fake-content">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
        <p style={{ fontSize: '0px', color: 'transparent' }}>
          Decoy text that should not be visible or scraped.
        </p>
      </div>
    </div>
  )
} 
