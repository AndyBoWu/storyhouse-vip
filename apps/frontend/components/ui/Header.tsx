'use client'

import { PenTool } from 'lucide-react'
import Link from 'next/link'
import WalletConnect from '@/components/WalletConnect'
import { NotificationBell } from '@/components/providers/NotificationProvider'
import { useAccount } from 'wagmi'

interface HeaderProps {
  variant?: 'default' | 'minimal'
  showNotifications?: boolean
}

export default function Header({ variant = 'default', showNotifications = true }: HeaderProps) {
  const { isConnected } = useAccount()

  if (variant === 'minimal') {
    return (
      <header className="relative z-10 bg-white/50 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900">
              StoryHouse.vip
            </Link>
            <div className="flex items-center gap-4">
              {showNotifications && isConnected && (
                <NotificationBell />
              )}
              <WalletConnect />
            </div>
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className="relative z-10">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gray-900 hidden md:block">
            StoryHouse.vip
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4 flex-1 md:flex-none justify-center md:justify-end">
            <div className="flex items-center gap-2">
              <Link href="/read">
                <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                  📖 READ
                </button>
              </Link>

              <Link href="/write">
                <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                  <PenTool className="h-4 w-4" />
                  WRITE
                </button>
              </Link>

              <Link href="/own">
                <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                  👑 OWN
                </button>
              </Link>

              {/* Creator Dashboard Link (only when connected) */}
              {isConnected && (
                <Link href="/creator/royalties">
                  <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm transition-all hover:bg-white/80">
                    📊 CREATOR
                  </button>
                </Link>
              )}
            </div>

            {/* Notification Bell & Wallet */}
            <div className="flex items-center gap-2">
              {showNotifications && isConnected && (
                <NotificationBell className="mr-2" />
              )}
              <WalletConnect />
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

// Quick Navigation Component for Creator Pages
export function CreatorNavigation() {
  const navItems = [
    { href: '/creator/royalties', label: 'Royalties', icon: '💰' },
    { href: '/creator/analytics', label: 'Analytics', icon: '📊' },
    { href: '/creator/quality', label: 'Quality', icon: '📈' },
    { href: '/creator/collaborations', label: 'Collaborate', icon: '🤝' },
  ]

  return (
    <nav className="bg-white/50 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-colors whitespace-nowrap">
                <span>{item.icon}</span>
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}