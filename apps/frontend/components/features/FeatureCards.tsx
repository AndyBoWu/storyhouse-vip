'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Shuffle, ChevronRight, X } from 'lucide-react';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  expandedContent: {
    howItWorks: string[];
    benefits: string[];
    example: string;
    cta: string;
  };
}

const features: Feature[] = [
  {
    id: 'immerse',
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Immerse & Discover',
    description: 'Dive deep into captivating narratives. Every chapter opens new dimensions of possibility.',
    expandedContent: {
      howItWorks: [
        'Browse our curated collection of stories',
        'Start reading any chapter instantly',
        'First 3 chapters are always free',
        'Unlock premium chapters for just 0.5 TIP'
      ],
      benefits: [
        'Access to thousands of unique stories',
        'Chapter-by-chapter pricing ($0.50-$5)',
        'Community-driven recommendations',
        'Personalized reading experience'
      ],
      example: 'Sarah discovered "The Quantum Garden" and read the first three chapters for free. She loved it so much that she unlocked the rest of the trilogy for just 5 TIP tokens.',
      cta: 'Start Reading'
    }
  },
  {
    id: 'dream',
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Dream & Create',
    description: 'Transform imagination into reality with AI. Your wildest ideas become living stories.',
    expandedContent: {
      howItWorks: [
        'Describe your story idea in natural language',
        'AI generates professional-quality chapters',
        'Edit and refine with AI assistance',
        'Publish directly to Story Protocol'
      ],
      benefits: [
        'No writing experience needed',
        'AI-powered story generation',
        'Multiple genre templates',
        'Automatic licensing setup'
      ],
      example: 'Alex had an idea about time-traveling cats. Using our AI, they created a 10-chapter novella that earned $500 in its first month.',
      cta: 'Create Your Story'
    }
  },
  {
    id: 'expand',
    icon: <Shuffle className="w-8 h-8" />,
    title: 'Expand & Evolve',
    description: 'Build upon existing worlds. Create infinite variations that spawn new universes.',
    expandedContent: {
      howItWorks: [
        'Choose any licensed story as your base',
        'Create official remixes and spin-offs',
        'Automatic royalty sharing with original creators',
        'Your remix becomes its own IP asset'
      ],
      benefits: [
        'Legal framework for fan fiction',
        'Revenue sharing with original authors',
        'Build on established audiences',
        'Create multiverse narratives'
      ],
      example: 'Maya remixed "The Digital Prophet" into a cyberpunk romance, earning $300 while the original author received $75 in royalties.',
      cta: 'Start Remixing'
    }
  }
];

export default function FeatureCards() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            layoutId={feature.id}
            className="relative"
          >
            <motion.div
              className={`
                bg-white/70 backdrop-blur-sm rounded-xl p-6 cursor-pointer
                border border-white/50 transition-all duration-300
                hover:bg-white/80 hover:shadow-lg
                ${expandedCard === feature.id ? 'invisible' : 'visible'}
              `}
              onClick={() => setExpandedCard(feature.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-center mb-4 text-blue-600">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center">
                {feature.description}
              </p>
              <div className="flex justify-center mt-6">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {expandedCard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedCard(null)}
          >
            <motion.div
              layoutId={expandedCard}
              className="bg-white rounded-3xl p-8 md:p-12 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedCard(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              {features.find(f => f.id === expandedCard) && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4 text-blue-600">
                      {features.find(f => f.id === expandedCard)?.icon}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      {features.find(f => f.id === expandedCard)?.title}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {features.find(f => f.id === expandedCard)?.description}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-900">How It Works</h3>
                      <ol className="space-y-3">
                        {features.find(f => f.id === expandedCard)?.expandedContent.howItWorks.map((step, i) => (
                          <li key={i} className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                              {i + 1}
                            </span>
                            <span className="text-gray-600">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-900">Key Benefits</h3>
                      <ul className="space-y-2">
                        {features.find(f => f.id === expandedCard)?.expandedContent.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-600">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">Real Example</h3>
                    <p className="text-gray-700 italic">
                      {features.find(f => f.id === expandedCard)?.expandedContent.example}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {features.find(f => f.id === expandedCard)?.expandedContent.cta}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}