'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  GitBranch, 
  Users, 
  DollarSign,
  BarChart3,
  Activity,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Star
} from 'lucide-react'

interface DerivativeData {
  id: string
  title: string
  originalTitle: string
  originalAuthor: string
  similarityScore: number
  qualityScore: number
  revenue: number
  reads: number
  createdAt: string
}

interface InfluenceData {
  month: string
  derivatives: number
  revenue: number
  influence: number
}

// Component 1: Derivative Influence Chart
export function DerivativeInfluenceChart({ 
  data 
}: { 
  data?: InfluenceData[] 
}) {
  const [selectedMetric, setSelectedMetric] = useState<'derivatives' | 'revenue' | 'influence'>('derivatives')
  
  // Mock data if none provided
  const chartData = data || [
    { month: 'Jan', derivatives: 3, revenue: 120, influence: 7.2 },
    { month: 'Feb', derivatives: 5, revenue: 180, influence: 7.8 },
    { month: 'Mar', derivatives: 4, revenue: 150, influence: 8.1 },
    { month: 'Apr', derivatives: 8, revenue: 280, influence: 8.7 },
    { month: 'May', derivatives: 6, revenue: 220, influence: 8.5 },
    { month: 'Jun', derivatives: 10, revenue: 380, influence: 9.2 }
  ]

  const maxValue = Math.max(...chartData.map(d => d[selectedMetric]))

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-medium text-gray-900">Influence Propagation Over Time</h4>
        <div className="flex gap-2">
          {(['derivatives', 'revenue', 'influence'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedMetric === metric 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {metric === 'derivatives' ? 'Count' : metric === 'revenue' ? 'Revenue' : 'Score'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-between gap-2">
          {chartData.map((item, index) => {
            const height = (item[selectedMetric] / maxValue) * 100
            const value = item[selectedMetric]
            
            return (
              <motion.div
                key={item.month}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg group hover:from-purple-700 hover:to-purple-500 cursor-pointer"
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {selectedMetric === 'revenue' ? `$${value}` : value}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2 -mb-6">
          {chartData.map((item) => (
            <span key={item.month} className="flex-1 text-center">
              {item.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Component 2: Derivative Performance Comparison
export function DerivativePerformanceComparison({ 
  originalData,
  derivativeData 
}: {
  originalData?: { reads: number; revenue: number; engagement: number }
  derivativeData?: { reads: number; revenue: number; engagement: number }
}) {
  const original = originalData || { reads: 1200, revenue: 450, engagement: 85 }
  const derivative = derivativeData || { reads: 1560, revenue: 580, engagement: 92 }
  
  const metrics = [
    { 
      label: 'Reads', 
      original: original.reads, 
      derivative: derivative.reads,
      icon: Users,
      color: 'blue'
    },
    { 
      label: 'Revenue', 
      original: original.revenue, 
      derivative: derivative.revenue,
      icon: DollarSign,
      color: 'green',
      prefix: '$'
    },
    { 
      label: 'Engagement', 
      original: original.engagement, 
      derivative: derivative.engagement,
      icon: Activity,
      color: 'purple',
      suffix: '%'
    }
  ]

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h4 className="font-medium text-gray-900 mb-6">Original vs Derivative Performance</h4>
      
      <div className="space-y-4">
        {metrics.map((metric) => {
          const improvement = ((metric.derivative - metric.original) / metric.original) * 100
          const Icon = metric.icon
          
          return (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${metric.color}-600`} />
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {improvement > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={improvement > 0 ? 'text-green-600' : 'text-red-600'}>
                    {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.original / Math.max(metric.original, metric.derivative)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 left-0 h-4 bg-gray-400 rounded-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.derivative / Math.max(metric.original, metric.derivative)) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`absolute bottom-0 left-0 h-4 bg-${metric.color}-500 rounded-full`}
                />
              </div>
              
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Original: {metric.prefix}{metric.original}{metric.suffix}</span>
                <span>Derivative: {metric.prefix}{metric.derivative}{metric.suffix}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Component 3: Content Similarity Indicator
export function ContentSimilarityIndicator({ 
  similarityScore,
  breakdown
}: {
  similarityScore: number
  breakdown?: {
    content: number
    structure: number
    theme: number
    style: number
  }
}) {
  const defaultBreakdown = {
    content: 85,
    structure: 72,
    theme: 91,
    style: 78
  }
  
  const data = breakdown || defaultBreakdown
  const avgScore = similarityScore || Object.values(data).reduce((a, b) => a + b, 0) / 4

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Similarity'
    if (score >= 60) return 'Medium Similarity'
    return 'Low Similarity'
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">AI Similarity Analysis</h4>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(avgScore)}`}>
          {getScoreLabel(avgScore)}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={351.86}
              initial={{ strokeDashoffset: 351.86 }}
              animate={{ strokeDashoffset: 351.86 - (351.86 * avgScore) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={avgScore >= 80 ? 'text-red-500' : avgScore >= 60 ? 'text-yellow-500' : 'text-green-500'}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{avgScore.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">Overall</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 capitalize">{key}</span>
              <span className="text-xs font-medium">{value}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${
                  value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Component 4: Derivative Revenue Tracking
export function DerivativeRevenueTracking({
  totalRevenue,
  monthlyRevenue,
  topEarners
}: {
  totalRevenue?: number
  monthlyRevenue?: { month: string; amount: number }[]
  topEarners?: { title: string; revenue: number; percentage: number }[]
}) {
  const revenue = totalRevenue || 1234.56
  const monthly = monthlyRevenue || [
    { month: 'This Month', amount: 234.50 },
    { month: 'Last Month', amount: 189.30 },
    { month: '2 Months Ago', amount: 156.78 }
  ]
  const earners = topEarners || [
    { title: 'The Digital Realm: Echoes', revenue: 456.78, percentage: 37 },
    { title: 'Cyber Chronicles: Reborn', revenue: 234.56, percentage: 19 },
    { title: 'Quantum Tales: Redux', revenue: 198.34, percentage: 16 }
  ]

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h4 className="font-medium text-gray-900 mb-4">Derivative Revenue Tracking</h4>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Derivative Revenue</p>
            <p className="text-3xl font-bold text-green-600">${revenue.toFixed(2)}</p>
          </div>
          <DollarSign className="w-12 h-12 text-green-200" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Monthly Breakdown</h5>
          <div className="space-y-2">
            {monthly.map((item) => (
              <div key={item.month} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.month}</span>
                <span className="font-medium">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Top Earning Derivatives</h5>
          <div className="space-y-2">
            {earners.map((item, index) => (
              <div key={item.title}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 truncate flex-1 mr-2">{item.title}</span>
                  <span className="font-medium">${item.revenue.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component 5: Quality Assessment Display
export function QualityAssessmentDisplay({
  qualityScore,
  metrics,
  recommendations
}: {
  qualityScore?: number
  metrics?: {
    originality: number
    engagement: number
    technical: number
    commercial: number
  }
  recommendations?: string[]
}) {
  const score = qualityScore || 8.5
  const qualityMetrics = metrics || {
    originality: 7.8,
    engagement: 9.2,
    technical: 8.5,
    commercial: 8.3
  }
  const recs = recommendations || [
    'Increase narrative complexity for better differentiation',
    'Consider adding unique character perspectives',
    'Strong commercial potential - optimize for discovery'
  ]

  const getQualityLabel = (score: number) => {
    if (score >= 8.5) return { label: 'Excellent', color: 'text-green-600 bg-green-100' }
    if (score >= 7) return { label: 'Good', color: 'text-blue-600 bg-blue-100' }
    if (score >= 5) return { label: 'Fair', color: 'text-yellow-600 bg-yellow-100' }
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' }
  }

  const quality = getQualityLabel(score)

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-medium text-gray-900">Quality Assessment</h4>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${quality.color}`}>
          {quality.label}
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-2">
            <Star className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{score}</p>
          <p className="text-xs text-gray-500">Overall Score</p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          {Object.entries(qualityMetrics).map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="text-lg font-semibold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Recommendations
        </h5>
        <ul className="space-y-1">
          {recs.map((rec, index) => (
            <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}