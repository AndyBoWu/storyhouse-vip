'use client'

import React from 'react'
import { CheckCircle2, Circle, Rocket, Target, Calendar } from 'lucide-react'

interface RoadmapPhase {
  phase: string
  title: string
  status: 'completed' | 'in-progress' | 'upcoming'
  items: string[]
  date?: string
}

const roadmapData: RoadmapPhase[] = [
  {
    phase: 'Phase 1.0',
    title: 'Foundation',
    status: 'completed',
    items: [
      'Basic smart contracts deployment',
      'Story creation and reading functionality',
      'Initial UI/UX design',
      'Core blockchain integration'
    ]
  },
  {
    phase: 'Phase 2.0',
    title: 'AI Integration',
    status: 'completed',
    items: [
      'GPT-4 story generation',
      'Style customization options',
      'Quality improvements',
      'AI prompt optimization'
    ]
  },
  {
    phase: 'Phase 3.0',
    title: 'Tokenomics',
    status: 'completed',
    items: [
      'TIP token implementation',
      'Read-to-earn mechanics',
      'Creator rewards system',
      'Economic model validation'
    ]
  },
  {
    phase: 'Phase 4.0',
    title: 'IP Management',
    status: 'completed',
    items: [
      'Story Protocol integration',
      'Chapter-level ownership',
      'Licensing system',
      'Royalty distribution'
    ]
  },
  {
    phase: 'Phase 5.0',
    title: 'Architecture Upgrade',
    status: 'completed',
    items: [
      '5-contract system deployment',
      'Enhanced metadata (25+ fields)',
      'Performance optimization',
      'Scalability improvements'
    ]
  },
  {
    phase: 'Phase 5.1',
    title: 'Enhanced Metadata',
    status: 'completed',
    items: [
      'Complete user attribution',
      'Advanced analytics tracking',
      'Discovery optimization',
      'Search improvements'
    ]
  },
  {
    phase: 'Phase 5.2',
    title: 'UI/UX Polish',
    status: 'completed',
    items: [
      'Modern interface redesign',
      'Improved user flows',
      'Mobile responsiveness',
      'Loading state optimizations'
    ]
  },
  {
    phase: 'Phase 5.3',
    title: 'SPA Optimization',
    status: 'completed',
    items: [
      'Full SPA architecture',
      'Instant page navigation',
      'Story routing system',
      'Performance enhancements'
    ]
  },
  {
    phase: 'Phase 5.4',
    title: 'Unified IP Registration',
    status: 'completed',
    items: [
      '40% gas savings achieved',
      '66% faster execution',
      'Single-transaction flow',
      'Atomic operations',
      'R2 storage with SHA-256 verification'
    ]
  },
  {
    phase: 'Phase 6.0',
    title: 'Mainnet Launch',
    status: 'upcoming',
    date: 'Q1 2025',
    items: [
      'Security audits completion',
      'Mainnet deployment',
      'TIP token public launch',
      'Marketing campaign',
      'Creator onboarding program'
    ]
  },
  {
    phase: 'Phase 7.0',
    title: 'Mobile & Ecosystem Expansion',
    status: 'upcoming',
    date: 'Q2 2025',
    items: [
      'Native iOS app with full story reading experience',
      'Native Android app with offline reading support',
      'Mobile-optimized AI story generation',
      'Push notifications for new chapters',
      'Mobile wallet integration (WalletConnect)',
      'Partner platform integrations',
      'Multi-language translation system',
      'Audio narration with AI voices',
      'Community governance launch'
    ]
  },
  {
    phase: 'Phase 8.0',
    title: 'Global Scale',
    status: 'upcoming',
    date: 'Q3-Q4 2025',
    items: [
      'Multi-language support',
      'Regional content hubs',
      'Enterprise solutions',
      'Educational programs',
      'Creator accelerator'
    ]
  }
]

export default function RoadmapPage() {
  const completedPhases = roadmapData.filter(p => p.status === 'completed').length
  const totalPhases = roadmapData.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Development Roadmap
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Building the future of decentralized storytelling
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium">
                {completedPhases} of {totalPhases} phases completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedPhases / totalPhases) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Status Banner */}
        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-lg p-6 mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Current Status: Phase 5.4 Complete!</h2>
          </div>
          <p className="text-muted-foreground mb-2">
            We've successfully implemented unified IP registration with 40% gas savings and are preparing for mainnet launch.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-purple-600/20 rounded-full text-sm">Gas Optimized</span>
            <span className="px-3 py-1 bg-purple-600/20 rounded-full text-sm">5-Contract Architecture</span>
            <span className="px-3 py-1 bg-purple-600/20 rounded-full text-sm">Enhanced Metadata</span>
            <span className="px-3 py-1 bg-purple-600/20 rounded-full text-sm">Production Ready</span>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="space-y-8">
          {roadmapData.map((phase, index) => (
            <div 
              key={phase.phase}
              className={`relative ${index !== roadmapData.length - 1 ? 'pb-8' : ''}`}
            >
              {/* Connection Line */}
              {index !== roadmapData.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />
              )}
              
              {/* Phase Card */}
              <div className={`flex gap-4 ${phase.status === 'upcoming' ? 'opacity-70' : ''}`}>
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {phase.status === 'completed' ? (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  ) : phase.status === 'in-progress' ? (
                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center animate-pulse">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <Circle className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {phase.phase}: {phase.title}
                        </h3>
                        {phase.date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {phase.date}
                          </div>
                        )}
                      </div>
                      {phase.status === 'completed' && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                          Completed
                        </span>
                      )}
                      {phase.status === 'in-progress' && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full text-sm font-medium">
                          In Progress
                        </span>
                      )}
                      {phase.status === 'upcoming' && (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                          Upcoming
                        </span>
                      )}
                    </div>
                    
                    <ul className="space-y-2">
                      {phase.items.map((item, itemIndex) => (
                        <li 
                          key={itemIndex}
                          className="flex items-start gap-2"
                        >
                          {phase.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={phase.status === 'completed' ? 'text-muted-foreground' : ''}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Long-term Vision */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-8">Long-term Vision (2026+)</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Platform Evolution</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li>• Default Web3 content platform</li>
                <li>• Support all content types</li>
                <li>• Cross-media storytelling</li>
                <li>• Creator tools ecosystem</li>
              </ul>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Technology Leadership</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li>• New blockchain standards</li>
                <li>• Advanced AI creation tools</li>
                <li>• Industry-leading APIs</li>
                <li>• Open-source components</li>
              </ul>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Economic Impact</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li>• 1M+ earning creators</li>
                <li>• $1B+ creator payments</li>
                <li>• New business models</li>
                <li>• Transform content economics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <p className="text-xl text-muted-foreground mb-6">
            Join us in building the future of decentralized storytelling
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/write"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start Creating
            </a>
            <a 
              href="/whitepaper"
              className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-600/10 transition-colors"
            >
              Read Whitepaper
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}