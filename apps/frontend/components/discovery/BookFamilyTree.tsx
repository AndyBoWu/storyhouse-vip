'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Users, BookOpen, TrendingUp, DollarSign, ChevronRight, ChevronDown, Info, Sparkles } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface BookDerivationNode {
  bookId: string
  title: string
  authorName: string
  branchPoint?: string
  totalChapters: number
  totalReads: number
  createdAt: string
  derivatives: BookDerivationNode[]
  // AI similarity data
  similarityScore?: number
  qualityScore?: number
  influenceScore?: number
  similarityBreakdown?: {
    content: number
    structure: number
    theme: number
    style: number
  }
}

interface FamilyTreeAnalytics {
  totalDerivatives: number
  totalAuthors: number
  totalChapters: number
  totalReads: number
  averageRating: number
  totalRevenue: number
}

interface BookFamilyTreeProps {
  bookId: string
  includeRevenue?: boolean
  includeMetrics?: boolean
  className?: string
}

export default function BookFamilyTree({ 
  bookId, 
  includeRevenue = false, 
  includeMetrics = true,
  className = '' 
}: BookFamilyTreeProps) {
  const [familyTree, setFamilyTree] = useState<BookDerivationNode | null>(null)
  const [analytics, setAnalytics] = useState<FamilyTreeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    loadFamilyTree()
  }, [bookId, includeRevenue, includeMetrics])

  const loadFamilyTree = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/discovery?type=family-tree&bookId=${bookId}&includeRevenue=${includeRevenue}&includeMetrics=${includeMetrics}`
      )
      
      const data = await response.json()
      
      if (data.success) {
        setFamilyTree(data.tree.root)
        setAnalytics(data.analytics)
        
        // Auto-expand root and first level
        const newExpanded = new Set<string>()
        newExpanded.add(data.tree.root.bookId)
        data.tree.root.derivatives.forEach((derivative: BookDerivationNode) => {
          newExpanded.add(derivative.bookId)
        })
        setExpandedNodes(newExpanded)
      } else {
        setError(data.error || 'Failed to load family tree')
      }
    } catch (error) {
      console.error('Error loading family tree:', error)
      setError('Failed to load family tree')
    } finally {
      setLoading(false)
    }
  }

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-600' }
    if (score >= 60) return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-600' }
    return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-600' }
  }

  const getSimilarityLabel = (score: number) => {
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  const renderTreeNode = (node: BookDerivationNode, depth: number = 0, isLast: boolean = false, parentNode?: BookDerivationNode) => {
    const isExpanded = expandedNodes.has(node.bookId)
    const hasDerivatives = node.derivatives.length > 0
    const isRoot = depth === 0
    const isTarget = node.bookId === bookId
    const similarityScore = node.similarityScore || 75
    const similarityStyle = getSimilarityColor(similarityScore)

    return (
      <motion.div
        key={node.bookId}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: depth * 0.1 }}
        className={`relative ${depth > 0 ? 'ml-6' : ''}`}
      >
        {/* Connecting lines with similarity coloring */}
        {depth > 0 && (
          <>
            <div 
              className={`absolute left-[-24px] top-0 w-6 h-6 border-l-2 border-b-2 ${
                similarityScore >= 80 ? 'border-red-400' : 
                similarityScore >= 60 ? 'border-yellow-400' : 
                'border-green-400'
              }`}
              style={{ borderWidth: similarityScore >= 80 ? '3px' : '2px' }}
            />
            {/* Similarity indicator on the line */}
            <div className={`absolute left-[-28px] top-[-8px] px-1 py-0.5 rounded text-xs font-medium ${similarityStyle.bg} ${similarityStyle.text}`}>
              {similarityScore}%
            </div>
          </>
        )}
        
        {/* Node content */}
        <div 
          className={`
            flex items-center gap-3 p-4 rounded-lg border-2 transition-all mb-2 relative
            ${isTarget ? 'border-purple-400 bg-purple-50' : 
              isRoot ? 'border-blue-400 bg-blue-50' : 
              'border-gray-200 bg-white hover:border-gray-300'}
          `}
          onMouseEnter={() => setHoveredNode(node.bookId)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Expand/collapse button */}
          {hasDerivatives && (
            <button
              onClick={() => toggleNodeExpansion(node.bookId)}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          {/* Book icon */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isRoot ? 'bg-blue-100 text-blue-600' : 
              isTarget ? 'bg-purple-100 text-purple-600' :
              'bg-gray-100 text-gray-600'}
          `}>
            <BookOpen className="w-4 h-4" />
          </div>
          
          {/* Book info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-800 truncate">{node.title}</h4>
              {isRoot && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Original
                </span>
              )}
              {isTarget && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
              {!isRoot && node.similarityScore && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${similarityStyle.bg} ${similarityStyle.text}`}>
                  {getSimilarityLabel(similarityScore)}
                </span>
              )}
              {node.qualityScore && node.qualityScore >= 8 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  High Quality
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>👤 {node.authorName}</span>
              <span>📊 {node.totalChapters} chapters</span>
              <span>👀 {node.totalReads.toLocaleString()} reads</span>
              {node.branchPoint && (
                <span className="text-green-600">🌿 From {node.branchPoint}</span>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              Created {formatDate(node.createdAt)}
            </div>
          </div>
          
          {/* Derivative count and AI indicators */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {hasDerivatives && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <GitBranch className="w-4 h-4" />
                <span>{node.derivatives.length}</span>
              </div>
            )}
            {node.influenceScore && (
              <div className="flex items-center gap-1 text-xs font-medium text-purple-600">
                <TrendingUp className="w-3 h-3" />
                <span>{node.influenceScore.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Similarity breakdown tooltip */}
        {hoveredNode === node.bookId && node.similarityBreakdown && !isRoot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 top-full left-4 mt-2 bg-white rounded-lg shadow-lg p-4 border border-gray-200 min-w-[200px]"
            onMouseEnter={() => setHoveredNode(node.bookId)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <h5 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              AI Analysis Details
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Content:</span>
                <span className="font-medium">{node.similarityBreakdown.content}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Structure:</span>
                <span className="font-medium">{node.similarityBreakdown.structure}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Theme:</span>
                <span className="font-medium">{node.similarityBreakdown.theme}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Style:</span>
                <span className="font-medium">{node.similarityBreakdown.style}%</span>
              </div>
            </div>
            {node.qualityScore && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Quality Score:</span>
                  <span className="font-medium">{node.qualityScore.toFixed(1)}/10</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Derivatives */}
        <AnimatePresence>
          {isExpanded && hasDerivatives && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="ml-4 border-l-2 border-gray-200 pl-2"
            >
              {node.derivatives.map((derivative, index) => 
                renderTreeNode(derivative, depth + 1, index === node.derivatives.length - 1, node)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Building family tree...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!familyTree) {
    return (
      <div className={`${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-gray-600">No family tree data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Analytics Summary */}
      {analytics && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Derivatives</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.totalDerivatives}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Authors</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.totalAuthors}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Chapters</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.totalChapters}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Total Reads</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {analytics.totalReads.toLocaleString()}
            </div>
          </div>
        </div>
      )}
      
      {/* Family Tree */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Story Family Tree</h3>
        </div>
        
        <div className="space-y-2">
          {renderTreeNode(familyTree)}
        </div>
        
        {familyTree.derivatives.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No derivatives yet</p>
            <p className="text-sm">This story hasn't been branched or remixed by other authors.</p>
          </div>
        )}
      </div>
    </div>
  )
}