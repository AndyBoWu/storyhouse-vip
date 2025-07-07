'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Star, Clock, ArrowRight, X, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { ensureAbsoluteUrl } from '@/lib/utils/url';

interface BranchOption {
  bookId: string;
  title: string;
  authorName: string;
  authorAddress: string;
  preview: string;
  chapterCount: number;
  totalReads: number;
  averageRating: number;
  coverUrl?: string;
  nextChapterNumber: number;
}

interface BranchChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBookId: string;
  chapterNumber: number;
  onContinue: (bookId: string, chapterNumber: number) => void;
}

export default function BranchChoiceModal({
  isOpen,
  onClose,
  currentBookId,
  chapterNumber,
  onContinue
}: BranchChoiceModalProps) {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBranches();
    }
  }, [isOpen, currentBookId, chapterNumber]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      // ⚠️ DEPRECATED: In the new "one book = one IP" model, derivative books no longer exist
      // All chapters belong to the original book, so this modal is no longer needed
      
      console.log('⚠️ BranchChoiceModal is deprecated - no derivative books in new model');
      
      // Get the current book's metadata for the original continuation only
      const bookData = await apiClient.getBookById(currentBookId);
      const validBranches: BranchOption[] = [];
      
      // Only include the original continuation if there are more chapters
      if (bookData && bookData.totalChapters > chapterNumber) {
        validBranches.push({
          bookId: currentBookId,
          title: bookData.title,
          authorName: bookData.authorName || 'Original Author',
          authorAddress: bookData.authorAddress,
          preview: 'Continue with the original author\'s version...',
          chapterCount: bookData.totalChapters,
          totalReads: bookData.totalReads || 0,
          averageRating: bookData.averageRating || 0,
          coverUrl: bookData.coverUrl,
          nextChapterNumber: chapterNumber + 1
        });
      }

      setBranches(validBranches);
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branch: BranchOption) => {
    setSelectedBranch(branch.bookId);
    setTimeout(() => {
      onContinue(branch.bookId, branch.nextChapterNumber);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <GitBranch className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Multiple Chapter Versions Available</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-green-100">
              Different authors have contributed chapters at this point. Choose which version to read.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available paths...</p>
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No branches available at this point.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {branches.map((branch) => (
                  <motion.div
                    key={branch.bookId}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleBranchSelect(branch)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBranch === branch.bookId
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Cover Image */}
                      <div className="w-24 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {branch.coverUrl ? (
                          <img
                            src={ensureAbsoluteUrl(branch.coverUrl)}
                            alt={branch.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">
                            {branch.title.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Branch Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                          {branch.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          by {branch.authorName}
                        </p>
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {branch.preview}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{branch.chapterCount} chapters</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{branch.totalReads} reads</span>
                          </div>
                          {branch.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span>{branch.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center">
                        <ArrowRight className={`w-6 h-6 ${
                          selectedBranch === branch.bookId
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                💡 Each version shows different authors' contributions to the story
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Continue Reading Current Version
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}