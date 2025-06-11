'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Check, AlertCircle, Info, TrendingUp, Users } from 'lucide-react'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'ai' | 'royalty'
  title: string
  message: string
  duration?: number
  actionUrl?: string
  actionLabel?: string
  onAction?: () => void
  dismissible?: boolean
}

interface NotificationToastProps {
  notifications: ToastNotification[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
}

// Toast type configurations
const TOAST_CONFIG = {
  success: {
    icon: Check,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700'
  },
  ai: {
    icon: TrendingUp,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-900',
    messageColor: 'text-purple-700'
  },
  royalty: {
    icon: Users,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
    messageColor: 'text-emerald-700'
  }
}

// Position classes
const POSITION_CLASSES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
}

export default function NotificationToast({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: NotificationToastProps) {
  // Auto-dismiss notifications
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          onDismiss(notification.id)
        }, notification.duration)

        return () => clearTimeout(timer)
      }
    })
  }, [notifications, onDismiss])

  const handleAction = (notification: ToastNotification) => {
    if (notification.onAction) {
      notification.onAction()
    } else if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  return (
    <div className={`fixed z-[60] pointer-events-none ${POSITION_CLASSES[position]}`}>
      <div className="space-y-3 max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((notification, index) => {
            const config = TOAST_CONFIG[notification.type]
            const Icon = config.icon

            return (
              <motion.div
                key={notification.id}
                initial={{ 
                  opacity: 0, 
                  y: position.includes('top') ? -50 : 50,
                  scale: 0.95 
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1 
                }}
                exit={{ 
                  opacity: 0,
                  x: position.includes('right') ? 400 : -400,
                  scale: 0.95
                }}
                transition={{ 
                  type: 'spring',
                  damping: 25,
                  stiffness: 200,
                  delay: index * 0.1
                }}
                className={`
                  pointer-events-auto relative p-4 rounded-lg border shadow-lg backdrop-blur-sm
                  ${config.bgColor} ${config.borderColor}
                  transform transition-all hover:shadow-xl
                `}
                style={{
                  maxWidth: '384px', // max-w-sm
                  minWidth: '320px'
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 ${config.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${config.titleColor} line-clamp-1`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${config.messageColor} line-clamp-2`}>
                      {notification.message}
                    </p>

                    {/* Action Button */}
                    {(notification.actionUrl || notification.onAction) && (
                      <button
                        onClick={() => handleAction(notification)}
                        className={`
                          inline-flex items-center gap-1 mt-2 text-xs font-medium
                          ${config.iconColor} hover:underline transition-colors
                        `}
                      >
                        {notification.actionLabel || 'View Details'}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  {notification.dismissible !== false && (
                    <button
                      onClick={() => onDismiss(notification.id)}
                      className={`
                        flex-shrink-0 p-1 rounded-full transition-colors
                        ${config.iconColor} hover:bg-black hover:bg-opacity-10
                      `}
                      aria-label="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress bar for timed notifications */}
                {notification.duration && notification.duration > 0 && (
                  <motion.div
                    className={`absolute bottom-0 left-0 h-1 ${config.iconColor.replace('text', 'bg')} rounded-b-lg`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ 
                      duration: notification.duration / 1000,
                      ease: 'linear'
                    }}
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Hook for managing toast notifications
export function useNotificationToasts() {
  const [toasts, setToasts] = React.useState<ToastNotification[]>([])

  const addToast = React.useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const newToast: ToastNotification = {
      id,
      duration: 5000, // 5 seconds default
      dismissible: true,
      ...toast
    }

    setToasts(prev => [...prev, newToast])

    // Return the ID for manual dismissal if needed
    return id
  }, [])

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const dismissAll = React.useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for different toast types
  const showSuccess = React.useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return addToast({ type: 'success', title, message, ...options })
  }, [addToast])

  const showError = React.useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return addToast({ type: 'error', title, message, duration: 8000, ...options }) // Longer for errors
  }, [addToast])

  const showWarning = React.useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return addToast({ type: 'warning', title, message, ...options })
  }, [addToast])

  const showInfo = React.useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return addToast({ type: 'info', title, message, ...options })
  }, [addToast])

  const showAI = React.useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return addToast({ type: 'ai', title, message, duration: 7000, ...options }) // Longer for AI insights
  }, [addToast])

  const showRoyalty = React.useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return addToast({ type: 'royalty', title, message, duration: 6000, ...options })
  }, [addToast])

  return {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAI,
    showRoyalty
  }
}