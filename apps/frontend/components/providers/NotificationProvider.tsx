'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import NotificationCenter from '@/components/ui/NotificationCenter'
import NotificationToast, { useNotificationToasts } from '@/components/ui/NotificationToast'
import { apiClient } from '@/lib/api-client'
import { Bell } from 'lucide-react'

interface NotificationContextType {
  isNotificationCenterOpen: boolean
  openNotificationCenter: () => void
  closeNotificationCenter: () => void
  unreadCount: number
  refreshNotifications: () => void
  showToast: typeof useNotificationToasts extends () => infer R ? R : never
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { address } = useAccount()
  const toastApi = useNotificationToasts()

  // Fetch unread count
  const refreshNotifications = async () => {
    if (!address) return

    try {
      const response = await apiClient.getNotifications(address, {
        unreadOnly: true,
        limit: 1
      })

      if (response.success) {
        setUnreadCount(response.data.stats?.unread || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }

  // Initial load and periodic refresh
  useEffect(() => {
    if (address) {
      refreshNotifications()
      
      // Refresh every 30 seconds
      const interval = setInterval(refreshNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [address])

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Show toast for important notifications
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      if (notification.type.includes('derivative')) {
        toastApi.showAI(
          notification.title,
          notification.message,
          {
            actionUrl: notification.actionUrl,
            actionLabel: 'View Details'
          }
        )
      } else if (notification.type.includes('royalty') || notification.type.includes('payment')) {
        toastApi.showRoyalty(
          notification.title,
          notification.message,
          {
            actionUrl: notification.actionUrl,
            actionLabel: 'View Royalties'
          }
        )
      } else {
        toastApi.showInfo(
          notification.title,
          notification.message,
          {
            actionUrl: notification.actionUrl,
            actionLabel: 'View Details'
          }
        )
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }

    // Close notification center
    setIsNotificationCenterOpen(false)
  }

  const contextValue: NotificationContextType = {
    isNotificationCenterOpen,
    openNotificationCenter: () => setIsNotificationCenterOpen(true),
    closeNotificationCenter: () => setIsNotificationCenterOpen(false),
    unreadCount,
    refreshNotifications,
    showToast: toastApi
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        authorAddress={address}
        onNotificationClick={handleNotificationClick}
      />
      
      {/* Toast Notifications */}
      <NotificationToast
        notifications={toastApi.toasts}
        onDismiss={toastApi.dismissToast}
        position="top-right"
      />
    </NotificationContext.Provider>
  )
}

// Notification Bell Component for Header Integration
export function NotificationBell({ className = '' }: { className?: string }) {
  const { openNotificationCenter, unreadCount } = useNotifications()

  return (
    <button
      onClick={openNotificationCenter}
      className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-5 h-5" />
      {/* Removed notification badge completely */}
    </button>
  )
}

// Auto-trigger notifications based on user actions
export function useAutoNotifications() {
  const { showToast } = useNotifications()
  const { address } = useAccount()

  const triggerDerivativeCheck = async (storyId: string) => {
    if (!address) return

    try {
      const response = await apiClient.triggerDerivativeDetection({
        authorAddress: address,
        storyId,
        autoNotify: true
      })

      if (response.success && response.data.derivativesFound > 0) {
        showToast.showAI(
          'Derivatives Detected',
          `Found ${response.data.derivativesFound} potential derivatives of your story`,
          {
            actionUrl: '/creator/analytics/derivatives',
            actionLabel: 'View Details'
          }
        )
      }
    } catch (error) {
      console.error('Failed to trigger derivative check:', error)
    }
  }

  const triggerQualityCheck = async (storyId: string) => {
    if (!address) return

    try {
      const response = await apiClient.triggerQualityAssessment({
        authorAddress: address,
        storyId
      })

      if (response.success && response.data.improvementsFound > 0) {
        showToast.showInfo(
          'Quality Improvements Available',
          `Found ${response.data.improvementsFound} suggestions to improve your story`,
          {
            actionUrl: '/creator/quality',
            actionLabel: 'View Suggestions'
          }
        )
      }
    } catch (error) {
      console.error('Failed to trigger quality check:', error)
    }
  }

  const triggerOpportunityCheck = async () => {
    if (!address) return

    try {
      const response = await apiClient.triggerOpportunityAnalysis({
        authorAddress: address,
        analysisType: 'all'
      })

      if (response.success) {
        const { collaboration, content } = response.data
        
        if (collaboration?.opportunitiesFound > 0) {
          showToast.showAI(
            'Collaboration Opportunities',
            `Found ${collaboration.opportunitiesFound} potential collaboration partners`,
            {
              actionUrl: '/creator/collaborations',
              actionLabel: 'View Opportunities'
            }
          )
        }

        if (content?.opportunitiesFound > 0) {
          showToast.showAI(
            'Content Opportunities',
            `Found ${content.opportunitiesFound} trending topics matching your style`,
            {
              actionUrl: '/write/new',
              actionLabel: 'Start Writing'
            }
          )
        }
      }
    } catch (error) {
      console.error('Failed to trigger opportunity check:', error)
    }
  }

  return {
    triggerDerivativeCheck,
    triggerQualityCheck,
    triggerOpportunityCheck
  }
}