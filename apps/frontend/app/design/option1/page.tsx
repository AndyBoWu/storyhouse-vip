'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Option 1: Branch Timeline Design
 * Shows story branching in a git-like timeline view
 */
export default function DesignOption1Page() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Mock data for Project Phoenix
  const storyData = {
    original: {
      id: 'original',
      title: 'Project Phoenix',
      author: 'Andy',
      authorAddress: '0x3873...3cA2',
      chapters: 7,
      rating: 4.8,
      status: 'Complete',
      cover: '/api/placeholder-cover.jpg'
    },
    derivatives: [
      {
        id: 'remix1',
        title: 'Project Phoenix - Bob\'s Remix',
        author: 'Bob',
        authorAddress: '0x71b9...6a70',
        chapters: 4,
        rating: null,
        status: 'Ongoing',
        branchPoint: 3,
        cover: '/api/placeholder-cover.jpg'
      }
    ]
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/read" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Discover
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Design Option 1: Branch Timeline View
              </h1>
              <p className="text-gray-600">
                Git-inspired timeline showing story evolution and branching points
              </p>
            </div>
            <Link 
              href="/design/option2" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Compare Option 2 →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Story Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-32 h-48 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-bold">P</span>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Phoenix</h2>
              <p className="text-gray-600 mb-4">
                Twelve-year-old Elara Quinn never expected adventure to find her in the quiet town of Millbrook...
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>📖 2 story paths</span>
                <span>⭐ 4.8 rating</span>
                <span>👥 2 authors</span>
                <span>🏷️ Story, Adventure</span>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Read Original
                </button>
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Explore All Paths
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Story Timeline & Branches</h3>
          
          {/* Timeline Container */}
          <div className="relative">
            {/* Main Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            
            {/* Shared Chapters */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Shared Foundation</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((chapter) => (
                  <div 
                    key={chapter}
                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    onClick={() => handleNodeClick(`shared-${chapter}`)}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-full relative z-10"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Chapter {chapter}</div>
                      <div className="text-sm text-gray-600">
                        {chapter === 1 && "The Discovery"}
                        {chapter === 2 && "First Contact"}
                        {chapter === 3 && "The Choice"}
                      </div>
                      <div className="text-xs text-gray-500">by Andy • Shared by all versions</div>
                    </div>
                    {selectedNode === `shared-${chapter}` && (
                      <div className="text-sm text-blue-600">📖 Read Chapter</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Branch Point */}
            <div className="relative mb-8">
              <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🔀</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Story Branches Here</div>
                  <div className="text-sm text-gray-600">After Chapter 3, different authors continue the story</div>
                </div>
              </div>
            </div>

            {/* Branched Paths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Original Path */}
              <div className="relative">
                <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <span>📚</span> Original Path
                </h4>
                <div className="space-y-3">
                  {[4, 5, 6, 7].map((chapter) => (
                    <div 
                      key={chapter}
                      className="flex items-center gap-4 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors border border-blue-100"
                      onClick={() => handleNodeClick(`original-${chapter}`)}
                    >
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Chapter {chapter}</div>
                        <div className="text-sm text-gray-600">
                          {chapter === 4 && "The Academy"}
                          {chapter === 5 && "Hidden Powers"}
                          {chapter === 6 && "The Test"}
                          {chapter === 7 && "Phoenix Rising"}
                        </div>
                        <div className="text-xs text-gray-500">by Andy</div>
                      </div>
                      {selectedNode === `original-${chapter}` && (
                        <div className="text-sm text-blue-600">📖 Read</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Complete Story</div>
                  <div className="text-xs text-blue-600">⭐ 4.8 rating • 7 chapters</div>
                </div>
              </div>

              {/* Remix Path */}
              <div className="relative">
                <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-purple-500"></div>
                <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <span>✨</span> Bob's Remix
                </h4>
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-4 cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition-colors border border-purple-100"
                    onClick={() => handleNodeClick('remix-4')}
                  >
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Chapter 4</div>
                      <div className="text-sm text-gray-600">The Clockmaker's Warning - remix</div>
                      <div className="text-xs text-gray-500">by Bob</div>
                    </div>
                    {selectedNode === 'remix-4' && (
                      <div className="text-sm text-purple-600">📖 Read</div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-sm text-gray-600">More chapters coming...</div>
                    <div className="text-xs text-gray-500">Story in progress</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Ongoing Story</div>
                  <div className="text-xs text-purple-600">🔥 4+ chapters • In progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Reading Path</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
              <div className="font-medium text-blue-800">Read Original Story</div>
              <div className="text-sm text-gray-600">Andy's complete 7-chapter adventure</div>
            </button>
            <button className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left">
              <div className="font-medium text-purple-800">Read Bob's Remix</div>
              <div className="text-sm text-gray-600">Alternative path starting from Chapter 4</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}