'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Eye, Clock, Hash, Sparkles, CheckCircle, Loader2 } from 'lucide-react'
import { PublishingModal } from '@/components/publishing/PublishingModal'

interface GeneratedStory {
  storyId: string
  chapterNumber: number
  title: string
  content: string
  themes: string[]
  wordCount: number
  readingTime: number
  metadata: {
    suggestedTags: string[]
    suggestedGenre: string
    contentRating: string
    language: string
    genre: string[]
    mood: string
    qualityScore: number
    originalityScore: number
    commercialViability: number
    authorAddress?: string
    authorName?: string
    bookCoverUrl?: string
    plotDescription: string
    unlockPrice: number
    licensePrice: number
    royaltyPercentage: number
    isRemixable: boolean
    status: 'draft'
    generatedAt: string
    licenseTier?: 'standard' | 'premium' | 'exclusive'
  }
}

interface StoryGenerationInterfaceProps {
  generatedStory: GeneratedStory
  onPublishSuccess: (storyData: any) => void
  onSaveDraft: (storyData: GeneratedStory) => void
  onStartOver: () => void
}

export default function StoryGenerationInterface({
  generatedStory,
  onPublishSuccess,
  onSaveDraft,
  onStartOver
}: StoryGenerationInterfaceProps) {
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isDraftSaved, setIsDraftSaved] = useState(false)

  const handleSaveDraft = () => {
    onSaveDraft(generatedStory)
    setIsDraftSaved(true)
    setTimeout(() => setIsDraftSaved(false), 2000) // Reset after 2 seconds
  }

  const handlePublishClick = () => {
    setShowPublishModal(true)
  }

  const handlePublishSuccess = (publishData: any) => {
    setShowPublishModal(false)
    onPublishSuccess(publishData)
  }

  // Format content with proper paragraph breaks
  const formattedContent = generatedStory.content
    .split('\n\n')
    .map((paragraph, index) => (
      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
        {paragraph.trim()}
      </p>
    ))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ✨ Your Story is Ready!
          </h1>
          <p className="text-gray-600">
            Review your generated content and decide your next step
          </p>
        </motion.div>

        {/* Story Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {generatedStory.title}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              <span>{generatedStory.wordCount} words</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{generatedStory.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Hash className="w-4 h-4" />
              <span>{generatedStory.metadata.suggestedGenre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4" />
              <span>{generatedStory.metadata.contentRating}</span>
            </div>
          </div>

          {/* Quality Scores */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {generatedStory.metadata.qualityScore}%
              </div>
              <div className="text-xs text-gray-600">Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {generatedStory.metadata.originalityScore}%
              </div>
              <div className="text-xs text-gray-600">Originality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {generatedStory.metadata.commercialViability}%
              </div>
              <div className="text-xs text-gray-600">Commercial</div>
            </div>
          </div>

          {/* License Information */}
          {generatedStory.metadata.licenseTier && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">License Tier:</span>
                  <span className="text-sm text-blue-700 capitalize">{generatedStory.metadata.licenseTier}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-700">
                  <span>Price: {generatedStory.metadata.licensePrice} TIP</span>
                  <span>Royalty: {generatedStory.metadata.royaltyPercentage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Suggested Tags:</div>
            <div className="flex flex-wrap gap-2">
              {generatedStory.metadata.suggestedTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Story Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Chapter {generatedStory.chapterNumber}: {generatedStory.title}
          </h3>
          <div className="prose max-w-none">
            {formattedContent}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              What would you like to do next?
            </h3>
            <p className="text-gray-600">
              Choose to save as draft or publish to blockchain for IP protection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Save as Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={isDraftSaved}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isDraftSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Save as Draft</span>
                </>
              )}
            </button>

            {/* Publish to Blockchain */}
            <button
              onClick={handlePublishClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish to Blockchain</span>
            </button>

            {/* Start Over */}
            <button
              onClick={onStartOver}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <span>Start Over</span>
            </button>
          </div>

          {/* Important Note */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mt-0.5 flex-shrink-0"></div>
              <div className="text-sm text-yellow-800">
                <strong>Important:</strong> Publishing to blockchain will register your story as an IP asset,
                enabling licensing and royalties. This requires MetaMask signing
                and a small gas fee. Drafts are saved locally and can be published later.
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Publishing Modal */}
      {showPublishModal && (
        <PublishingModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          story={{
            title: generatedStory.title,
            content: generatedStory.content,
            themes: generatedStory.themes,
            wordCount: generatedStory.wordCount,
            readingTime: generatedStory.readingTime
          }}
          chapterNumber={generatedStory.chapterNumber}
          storyTitle={generatedStory.title}
          onSuccess={handlePublishSuccess}
        />
      )}
    </div>
  )
}