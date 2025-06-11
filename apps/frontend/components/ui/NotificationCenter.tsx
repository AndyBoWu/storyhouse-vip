'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Settings, Filter, RefreshCw, AlertCircle, TrendingUp, Users, Lightbulb, BookOpen } from 'lucide-react'

export interface Notification {
  id: string
  chapterId: string
  authorAddress: string
  type: 'new_royalty' | 'claim_success' | 'claim_failed' | 'large_payment' | 'monthly_summary' | 'threshold_reached' | 'system_alert' | 'derivative_detected' | 'potential_collaboration' | 'content_opportunity' | 'quality_improvement' | 'market_trend_alert'
  title: string
  message: string
  amount?: bigint
  amountFormatted?: string
  metadata?: Record<string, any>
  timestamp: Date
  read: boolean
  actionUrl?: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  authorAddress?: string
  onNotificationClick?: (notification: Notification) => void
}

interface NotificationStats {
  total: number
  unread: number
  deliverySuccessRate: number
}

// Notification type configurations
const NOTIFICATION_CONFIG = {
  new_royalty: { icon: '💰', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  claim_success: { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  claim_failed: { icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  large_payment: { icon: '🎉', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  monthly_summary: { icon: '📊', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  threshold_reached: { icon: '🎯', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  system_alert: { icon: '⚠️', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  // Phase 3.3: AI-Powered Notifications
  derivative_detected: { icon: '🔍', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  potential_collaboration: { icon: '🤝', color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  content_opportunity: { icon: '💡', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  quality_improvement: { icon: '📈', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  market_trend_alert: { icon: '📊', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' }
}

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  authorAddress,
  onNotificationClick 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, deliverySuccessRate: 100 })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai' | 'royalty'>('all')
  const [showSettings, setShowSettings] = useState(false)

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!authorAddress) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        authorAddress,
        limit: '50'
      })

      if (filter === 'unread') {
        params.set('unreadOnly', 'true')
      }

      if (filter === 'ai') {
        params.set('types', 'derivative_detected,potential_collaboration,content_opportunity,quality_improvement,market_trend_alert')
      }

      if (filter === 'royalty') {
        params.set('types', 'new_royalty,claim_success,claim_failed,large_payment,monthly_summary,threshold_reached')
      }

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    if (!authorAddress) return

    try {
      const response = await fetch(`/api/notifications/${authorAddress}/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        )
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - notificationIds.length)
        }))
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead([notification.id])
    }

    if (onNotificationClick) {
      onNotificationClick(notification)
    } else if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  // Get filtered notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read
      case 'ai':
        return ['derivative_detected', 'potential_collaboration', 'content_opportunity', 'quality_improvement', 'market_trend_alert'].includes(notification.type)
      case 'royalty':
        return ['new_royalty', 'claim_success', 'claim_failed', 'large_payment', 'monthly_summary', 'threshold_reached'].includes(notification.type)
      default:
        return true
    }
  })

  // Fetch notifications when opened or filter changes
  useEffect(() => {
    if (isOpen && authorAddress) {
      fetchNotifications()
    }
  }, [isOpen, authorAddress, filter])

  // Format relative time
  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                {stats.unread} unread of {stats.total} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {[
            { key: 'all', label: 'All', icon: Bell },
            { key: 'unread', label: 'Unread', icon: AlertCircle },
            { key: 'ai', label: 'AI', icon: TrendingUp },
            { key: 'royalty', label: 'Royalty', icon: BookOpen }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                filter === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-200 bg-gray-50 px-4 py-3 overflow-hidden"
            >
              <div className="text-sm text-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span>Delivery Success Rate</span>
                  <span className="font-medium text-green-600">{stats.deliverySuccessRate}%</span>
                </div>
                <div className="text-xs text-gray-500">
                  AI-powered notifications include derivative detection, collaboration opportunities, and market trends.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => {
                  const config = NOTIFICATION_CONFIG[notification.type]
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        notification.read 
                          ? 'bg-white border-gray-200 opacity-75' 
                          : `${config.bgColor} ${config.borderColor}`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`text-lg ${config.color} flex-shrink-0`}>
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm font-medium ${config.color} line-clamp-1`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Priority indicator */}
                              {notification.priority !== 'low' && (
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                              )}
                              {/* Unread indicator */}
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Amount display for royalty notifications */}
                          {notification.amountFormatted && (
                            <div className="text-sm font-medium text-green-600 mt-1">
                              {notification.amountFormatted} TIP
                            </div>
                          )}

                          {/* Metadata display for AI notifications */}
                          {notification.metadata && (
                            <div className="mt-2 space-y-1">
                              {notification.type === 'derivative_detected' && notification.metadata.confidence && (
                                <div className="text-xs text-gray-500">
                                  Confidence: {Math.round(notification.metadata.confidence * 100)}%
                                </div>
                              )}
                              {notification.type === 'quality_improvement' && notification.metadata.qualityBreakdown && (
                                <div className="text-xs text-gray-500">
                                  Quality Score: {Math.round(notification.metadata.qualityBreakdown.overallScore * 100)}%
                                </div>
                              )}
                              {notification.type === 'content_opportunity' && notification.metadata.estimatedReads && (
                                <div className="text-xs text-gray-500">
                                  Est. Reads: {notification.metadata.estimatedReads}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                            {notification.actionUrl && (
                              <span className="text-xs text-blue-600 hover:text-blue-700">
                                View Details →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <button
              onClick={() => markAsRead(filteredNotifications.filter(n => !n.read).map(n => n.id))}
              disabled={filteredNotifications.every(n => n.read)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Mark All as Read
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}