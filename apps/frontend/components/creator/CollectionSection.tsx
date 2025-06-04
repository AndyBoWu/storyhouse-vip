/**
 * @fileoverview Collection Management Section for Enhanced Story Creation
 * Allows users to create collections or add stories to existing collections
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  Star,
  Crown,
  Globe,
  Lock,
  TrendingUp,
  Percent,
  Info
} from 'lucide-react'
import type {
  StoryCollection,
  EnhancedStoryCreationParams
} from '@storyhouse/shared'

interface CollectionSectionProps {
  onCollectionOptionsChange: (options: Partial<EnhancedStoryCreationParams>) => void
  initialOptions?: Partial<EnhancedStoryCreationParams>
  isCollapsed?: boolean
}

export default function CollectionSection({
  onCollectionOptionsChange,
  initialOptions = {},
  isCollapsed = true
}: CollectionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(initialOptions.addToCollection || null)

  // New collection creation state
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    isPublic: true,
    revenueShare: {
      creator: 70,
      collection: 20,
      platform: 10
    }
  })

  // Mock existing collections (in real app, this would come from API)
  const [existingCollections] = useState<StoryCollection[]>([
    {
      id: 'col-1',
      name: 'Mystery Chronicles',
      description: 'A collection of thrilling mystery stories',
      creatorAddress: '0x123...',
      isPublic: true,
      allowContributions: true,
      requireApproval: false,
      revenueShare: { creator: 70, collection: 20, platform: 10 },
      creators: ['0x123...', '0x456...'],
      stories: ['story-1', 'story-2'],
      ipAssets: ['ip-1', 'ip-2'],
      genre: 'Mystery',
      theme: 'Detective Stories',
      tags: ['mystery', 'detective', 'thriller'],
      totalEarnings: 1250,
      memberCount: 5,
      storyCount: 12,
      totalReads: 2340,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'col-2',
      name: 'Sci-Fi Universe',
      description: 'Collaborative science fiction world-building',
      creatorAddress: '0x789...',
      isPublic: true,
      allowContributions: true,
      requireApproval: true,
      revenueShare: { creator: 60, collection: 30, platform: 10 },
      creators: ['0x789...'],
      stories: ['story-3'],
      ipAssets: ['ip-3'],
      genre: 'Sci-Fi',
      theme: 'Space Exploration',
      tags: ['sci-fi', 'space', 'future'],
      totalEarnings: 890,
      memberCount: 3,
      storyCount: 8,
      totalReads: 1560,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18')
    }
  ])

  const filteredCollections = existingCollections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCollectionSelect = (collectionId: string | null) => {
    setSelectedCollection(collectionId)
    updateOptions({ addToCollection: collectionId || undefined })
  }

  const handleCreateNewToggle = () => {
    setShowCreateNew(!showCreateNew)
    if (showCreateNew) {
      // Reset new collection data
      setNewCollection({
        name: '',
        description: '',
        isPublic: true,
        revenueShare: { creator: 70, collection: 20, platform: 10 }
      })
    }
  }

  const handleNewCollectionChange = (field: string, value: any) => {
    const updated = { ...newCollection, [field]: value }
    setNewCollection(updated)

    if (updated.name.trim()) {
      updateOptions({
        createNewCollection: updated
      })
    }
  }

  const handleRevenueShareChange = (field: 'creator' | 'collection' | 'platform', value: number) => {
    const maxValue = Math.min(value, 100)
    const currentShare = { ...newCollection.revenueShare }
    currentShare[field] = maxValue

    // Auto-adjust other values to maintain 100% total
    const remaining = 100 - maxValue
    const otherFields = ['creator', 'collection', 'platform'].filter(f => f !== field) as ('creator' | 'collection' | 'platform')[]

    if (otherFields.length === 2) {
      const split = Math.floor(remaining / 2)
      currentShare[otherFields[0]] = split
      currentShare[otherFields[1]] = remaining - split
    }

    handleNewCollectionChange('revenueShare', currentShare)
  }

  const updateOptions = (updates: Partial<EnhancedStoryCreationParams>) => {
    const newOptions = {
      ...initialOptions,
      ...updates
    }
    onCollectionOptionsChange(newOptions)
  }

  const selectedCollectionData = selectedCollection
    ? existingCollections.find(c => c.id === selectedCollection)
    : null

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-6 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Story Collections
                {(selectedCollection || showCreateNew) && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {showCreateNew ? 'Creating New' : 'Selected'}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                Group stories together for shared themes and revenue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCollectionData && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{selectedCollectionData.name}</div>
                <div className="text-xs text-gray-500">{selectedCollectionData.memberCount} creators • {selectedCollectionData.storyCount} stories</div>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Collection Options */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowCreateNew(false)
                    setSelectedCollection(null)
                    updateOptions({ addToCollection: undefined, createNewCollection: undefined })
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !selectedCollection && !showCreateNew
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No Collection
                </button>

                <button
                  onClick={() => {
                    setShowCreateNew(false)
                    if (selectedCollection) {
                      setSelectedCollection(null)
                      updateOptions({ addToCollection: undefined })
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCollection && !showCreateNew
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Join Existing
                </button>

                <button
                  onClick={handleCreateNewToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showCreateNew
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </div>

              {/* Join Existing Collection */}
              {!showCreateNew && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search collections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Collection List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredCollections.map((collection) => (
                      <motion.button
                        key={collection.id}
                        onClick={() => handleCollectionSelect(
                          selectedCollection === collection.id ? null : collection.id
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedCollection === collection.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              {collection.isPublic ? (
                                <Globe className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{collection.name}</h4>
                              <p className="text-sm text-gray-600">{collection.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <TrendingUp className="w-4 h-4" />
                            <span>{collection.totalEarnings} TIP</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>{collection.memberCount} creators</span>
                            <span>{collection.storyCount} stories</span>
                            <span>{collection.totalReads.toLocaleString()} reads</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span>{collection.revenueShare.creator}% creator</span>
                          </div>
                        </div>

                        {collection.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {collection.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {collection.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{collection.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {filteredCollections.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No collections found matching your search.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Create New Collection */}
              {showCreateNew && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">Create New Collection</h4>
                    <p className="text-sm text-green-700">
                      Create a themed collection to group related stories and share revenue with collaborators.
                    </p>
                  </div>

                  {/* Collection Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collection Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Fantasy Adventures"
                        value={newCollection.name}
                        onChange={(e) => handleNewCollectionChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        placeholder="Describe the theme and purpose of this collection..."
                        value={newCollection.description}
                        onChange={(e) => handleNewCollectionChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Privacy Setting */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {newCollection.isPublic ? (
                            <Globe className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-800">Public Collection</span>
                          <p className="text-xs text-gray-600">
                            Allow other creators to discover and request to join
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCollection.isPublic}
                          onChange={(e) => handleNewCollectionChange('isPublic', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {/* Revenue Sharing */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h5 className="font-medium text-gray-800">Revenue Sharing</h5>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Revenue distribution among creators, collection, and platform
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Individual Creators</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newCollection.revenueShare.creator}
                              onChange={(e) => handleRevenueShareChange('creator', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Collection Pool</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newCollection.revenueShare.collection}
                              onChange={(e) => handleRevenueShareChange('collection', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Platform Fee</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newCollection.revenueShare.platform}
                              onChange={(e) => handleRevenueShareChange('platform', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>

                        {/* Total Check */}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">Total</span>
                            <span className={`text-sm font-medium ${
                              (newCollection.revenueShare.creator + newCollection.revenueShare.collection + newCollection.revenueShare.platform) === 100
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {newCollection.revenueShare.creator + newCollection.revenueShare.collection + newCollection.revenueShare.platform}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collection Summary */}
                    {newCollection.name.trim() && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Users className="w-5 h-5 text-purple-600" />
                          <h5 className="font-medium text-purple-800">Collection Summary</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-purple-700 font-medium">Name:</span>
                            <p className="text-purple-600">{newCollection.name}</p>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Visibility:</span>
                            <p className="text-purple-600">{newCollection.isPublic ? 'Public' : 'Private'}</p>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Creator Share:</span>
                            <p className="text-purple-600">{newCollection.revenueShare.creator}%</p>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Collection Pool:</span>
                            <p className="text-purple-600">{newCollection.revenueShare.collection}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
