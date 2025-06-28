'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

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

// Custom sophisticated icons
const BookIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
    <path d="M8 6C8 4.89543 8.89543 4 10 4H24V40H10C8.89543 40 8 39.1046 8 38V6Z" fill="url(#book-gradient1)" fillOpacity="0.9"/>
    <path d="M24 4H38C39.1046 4 40 4.89543 40 6V38C40 39.1046 39.1046 40 38 40H24V4Z" fill="url(#book-gradient2)" fillOpacity="0.8"/>
    <path d="M12 12H20M12 18H20M12 24H20M28 12H36M28 18H36M28 24H36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="book-gradient1" x1="8" y1="4" x2="24" y2="40">
        <stop stopColor="#3B82F6"/>
        <stop offset="1" stopColor="#8B5CF6"/>
      </linearGradient>
      <linearGradient id="book-gradient2" x1="24" y1="4" x2="40" y2="40">
        <stop stopColor="#8B5CF6"/>
        <stop offset="1" stopColor="#EC4899"/>
      </linearGradient>
    </defs>
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L26.7961 17.5106L38.3923 9.6077L30.4894 21.2039L44 24L30.4894 26.7961L38.3923 38.3923L26.7961 30.4894L24 44L21.2039 30.4894L9.6077 38.3923L17.5106 26.7961L4 24L17.5106 21.2039L9.6077 9.6077L21.2039 17.5106L24 4Z" fill="url(#sparkle-gradient)" fillOpacity="0.9"/>
    <circle cx="15" cy="15" r="2" fill="#FBBF24"/>
    <circle cx="33" cy="33" r="2" fill="#FBBF24"/>
    <circle cx="33" cy="15" r="1.5" fill="#FCD34D"/>
    <circle cx="15" cy="33" r="1.5" fill="#FCD34D"/>
    <defs>
      <linearGradient id="sparkle-gradient" x1="4" y1="4" x2="44" y2="44">
        <stop stopColor="#F59E0B"/>
        <stop offset="0.5" stopColor="#EF4444"/>
        <stop offset="1" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
  </svg>
);

const NetworkIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="8" r="4" fill="url(#network-gradient1)"/>
    <circle cx="12" cy="24" r="4" fill="url(#network-gradient2)"/>
    <circle cx="36" cy="24" r="4" fill="url(#network-gradient3)"/>
    <circle cx="24" cy="40" r="4" fill="url(#network-gradient4)"/>
    <path d="M24 12V20M24 28V36M20 10L16 22M28 10L32 22M16 26L20 38M32 26L28 38" stroke="url(#network-line)" strokeWidth="2" strokeOpacity="0.6"/>
    <defs>
      <linearGradient id="network-gradient1" x1="20" y1="4" x2="28" y2="12">
        <stop stopColor="#06B6D4"/>
        <stop offset="1" stopColor="#3B82F6"/>
      </linearGradient>
      <linearGradient id="network-gradient2" x1="8" y1="20" x2="16" y2="28">
        <stop stopColor="#8B5CF6"/>
        <stop offset="1" stopColor="#A855F7"/>
      </linearGradient>
      <linearGradient id="network-gradient3" x1="32" y1="20" x2="40" y2="28">
        <stop stopColor="#EC4899"/>
        <stop offset="1" stopColor="#F43F5E"/>
      </linearGradient>
      <linearGradient id="network-gradient4" x1="20" y1="36" x2="28" y2="44">
        <stop stopColor="#F59E0B"/>
        <stop offset="1" stopColor="#F97316"/>
      </linearGradient>
      <linearGradient id="network-line" x1="24" y1="8" x2="24" y2="40">
        <stop stopColor="#3B82F6"/>
        <stop offset="1" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
  </svg>
);

const features: Feature[] = [
  {
    id: 'immerse',
    icon: <BookIcon />,
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
    icon: <SparklesIcon />,
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
    icon: <NetworkIcon />,
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
            className="relative h-full"
          >
            <motion.div
              className={`
                relative bg-white/50 backdrop-blur-md rounded-2xl p-8 cursor-pointer
                border border-white/60 transition-all duration-300
                hover:bg-white/70 hover:shadow-2xl hover:border-white/80
                group overflow-hidden h-full flex flex-col
                ${expandedCard === feature.id ? 'invisible' : 'visible'}
              `}
              onClick={() => setExpandedCard(feature.id)}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Subtle pattern background */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99, 102, 241) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed flex-grow">
                  {feature.description}
                </p>
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
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
                className="absolute top-6 right-6 p-3 rounded-full bg-gray-100/80 backdrop-blur-sm hover:bg-gray-200/80 transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </button>

              {features.find(f => f.id === expandedCard) && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-6">
                      <div className="transform scale-125">
                        {features.find(f => f.id === expandedCard)?.icon}
                      </div>
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
                            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-600">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <h3 className="text-xl font-semibold text-gray-900">Success Story</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {features.find(f => f.id === expandedCard)?.expandedContent.example}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {features.find(f => f.id === expandedCard)?.expandedContent.cta}
                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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