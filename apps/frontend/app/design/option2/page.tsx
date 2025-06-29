'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Option 2: Story Paths Card Layout
 * Shows each story path as distinct, actionable cards
 */
export default function DesignOption2Page() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  // Mock data for Project Phoenix
  const storyPaths = [
    {
      id: 'original',
      title: 'Project Phoenix',
      subtitle: 'Original Story',
      author: 'Andy',
      authorAddress: '0x3873...3cA2',
      chapters: 7,
      rating: 4.8,
      status: 'Complete',
      description: 'The complete original adventure following Elara\'s discovery of her phoenix powers.',
      tags: ['Complete', 'Original', 'Award Winner'],
      cover: '/api/placeholder-cover.jpg',
      isOriginal: true,
      sharedChapters: 3,
      uniqueChapters: 4
    },
    {
      id: 'remix1',
      title: 'Project Phoenix: Dark Path',
      subtitle: 'Bob\'s Remix',
      author: 'Bob',
      authorAddress: '0x71b9...6a70',
      chapters: 4,
      rating: null,
      status: 'Ongoing',
      description: 'A darker take where Elara makes different choices after meeting the Clockmaker.',
      tags: ['Ongoing', 'Dark Fantasy', 'Remix'],
      cover: '/api/placeholder-cover.jpg',
      isOriginal: false,
      sharedChapters: 3,
      uniqueChapters: 1
    }
  ]

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(selectedPath === pathId ? null : pathId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/read" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Discover
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Design Option 2: Story Paths Card Layout
              </h1>
              <p className="text-gray-600">
                Card-based interface focusing on individual story paths and choice
              </p>
            </div>
            <Link 
              href="/design/option1" 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Compare Option 1 →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Story Universe Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Phoenix Universe</h2>
            <p className="text-gray-600 mb-4">
              Multiple story paths exploring different possibilities in Elara's adventure
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-6">
              <span className="flex items-center gap-1">
                📖 <strong>2</strong> story paths
              </span>
              <span className="flex items-center gap-1">
                👥 <strong>2</strong> authors
              </span>
              <span className="flex items-center gap-1">
                🔗 <strong>3</strong> shared chapters
              </span>
              <span className="flex items-center gap-1">
                ⭐ <strong>4.8</strong> avg rating
              </span>
            </div>
            
            {/* Shared Foundation Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <span className="text-lg">🤝</span>
                <span className="font-medium">All paths share Chapters 1-3</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                "The Discovery" → "First Contact" → "The Choice"
              </div>
            </div>
          </div>
        </div>

        {/* Story Paths Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {storyPaths.map((path) => (
            <div 
              key={path.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer
                ${selectedPath === path.id ? 'ring-4 ring-blue-500 ring-opacity-50 transform scale-105' : 'hover:shadow-xl hover:transform hover:scale-102'}
              `}
              onClick={() => handlePathSelect(path.id)}
            >
              {/* Card Header */}
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                  <span className="text-white text-6xl font-bold">
                    {path.isOriginal ? 'P' : 'P*'}
                  </span>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    path.status === 'Complete' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {path.status}
                  </span>
                </div>

                {/* Original/Remix Indicator */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    path.isOriginal 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {path.isOriginal ? '👑 Original' : '✨ Remix'}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{path.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{path.subtitle}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{path.description}</p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {path.author[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{path.author}</div>
                    <div className="text-xs text-gray-500">{path.authorAddress}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-gray-900">{path.chapters}</div>
                    <div className="text-gray-600">Total Chapters</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-gray-900">
                      {path.rating ? `⭐ ${path.rating}` : '🔥 New'}
                    </div>
                    <div className="text-gray-600">
                      {path.rating ? 'Rating' : 'Status'}
                    </div>
                  </div>
                </div>

                {/* Chapter Breakdown */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2">Chapter Breakdown:</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {path.sharedChapters} Shared
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {path.uniqueChapters} Unique
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {path.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    path.isOriginal 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}>
                    📖 Read This Path
                  </button>
                  
                  {selectedPath === path.id && (
                    <div className="space-y-2">
                      <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        👁️ Preview Unique Chapters
                      </button>
                      <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        🔖 Add to Reading List
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Compare Story Paths</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-600 font-medium">Feature</th>
                  <th className="text-center py-3 text-blue-800 font-medium">Original</th>
                  <th className="text-center py-3 text-purple-800 font-medium">Bob's Remix</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">Total Chapters</td>
                  <td className="py-3 text-center">7 chapters</td>
                  <td className="py-3 text-center">4+ chapters</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">Status</td>
                  <td className="py-3 text-center text-green-600">Complete ✓</td>
                  <td className="py-3 text-center text-yellow-600">Ongoing 🔥</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">Unique Content</td>
                  <td className="py-3 text-center">Chapters 4-7</td>
                  <td className="py-3 text-center">Chapter 4+</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">Genre Focus</td>
                  <td className="py-3 text-center">Adventure, Coming of Age</td>
                  <td className="py-3 text-center">Dark Fantasy, Mystery</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Reader Rating</td>
                  <td className="py-3 text-center">⭐ 4.8</td>
                  <td className="py-3 text-center">🆕 Too new to rate</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">👑 Start with Original</h4>
              <p className="text-sm text-blue-700">
                Get the complete, award-winning story. Perfect for first-time readers.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">✨ Try the Remix</h4>
              <p className="text-sm text-purple-700">
                Experience a fresh take with darker themes and new plot directions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}