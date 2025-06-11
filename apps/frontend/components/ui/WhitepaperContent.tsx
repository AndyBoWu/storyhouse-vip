'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react'

interface WhitepaperContentProps {
  className?: string
}

export default function WhitepaperContent({ className = '' }: WhitepaperContentProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWhitepaper = async () => {
      try {
        const response = await fetch('/TOKENOMICS_WHITEPAPER.md')
        if (!response.ok) {
          throw new Error('Failed to load whitepaper')
        }
        const text = await response.text()
        setContent(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchWhitepaper()
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading whitepaper...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 text-center ${className}`}>
        <div className="text-2xl mb-2">❌</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Error Loading Whitepaper
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Action Buttons - Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 mb-8 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/TOKENOMICS_WHITEPAPER.md"
            download="StoryHouse_Whitepaper.md"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            <Download className="h-4 w-4" />
            Download Markdown
          </a>
          <a 
            href="https://github.com/AndyBoWu/storyhouse-vip/blob/main/docs/tokenomics/TOKENOMICS_WHITEPAPER.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
          >
            <ExternalLink className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:text-sm prose-th:bg-gray-50 prose-td:border-gray-200 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom styling for specific elements
            h1: ({ children }) => (
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                <FileText className="h-8 w-8 text-blue-600" />
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6 pb-2 border-b border-gray-100">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                {children}
              </h3>
            ),
            // Style tables
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            // Style code blocks
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
                {children}
              </pre>
            ),
            // Style blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 bg-blue-50 p-4 my-6 italic text-blue-900">
                {children}
              </blockquote>
            ),
            // Add spacing to lists
            ul: ({ children }) => (
              <ul className="space-y-2 my-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-2 my-4">
                {children}
              </ol>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Table of Contents Navigation (if needed) */}
      <div className="mt-12 p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Document</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>Format:</strong> Markdown document
          </div>
          <div>
            <strong>Length:</strong> Comprehensive analysis
          </div>
          <div>
            <strong>Topics:</strong> Tokenomics, Architecture, Market Analysis
          </div>
          <div>
            <strong>Last Updated:</strong> June 2025
          </div>
        </div>
      </div>
    </div>
  )
}