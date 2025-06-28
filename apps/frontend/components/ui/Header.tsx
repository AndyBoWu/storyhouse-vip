'use client'

import Link from 'next/link'
import WalletConnect from '@/components/WalletConnect'
import { NotificationBell } from '@/components/providers/NotificationProvider'
import { useAccount } from 'wagmi'
import { ReadIcon, WriteIcon, OwnIcon, CreatorIcon, RoyaltiesIcon, AnalyticsIcon, QualityIcon, CollaborateIcon } from './icons'

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
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-gray-900 hidden md:block">
              StoryHouse.vip
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-4 flex-1 md:flex-none justify-center md:justify-end">
            <div className="flex items-center gap-2">
              <Link href="/read">
                <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md">
                  <ReadIcon />
                  <span>READ</span>
                </button>
              </Link>

              <Link href="/write">
                <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md">
                  <WriteIcon />
                  <span>WRITE</span>
                </button>
              </Link>

              <Link href="/own">
                <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md">
                  <OwnIcon />
                  <span>OWN</span>
                </button>
              </Link>

              {/* Creator Dashboard Link (only when connected) */}
              {isConnected && (
                <Link href="/creator/royalties">
                  <button className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-gray-800 bg-white/60 backdrop-blur-sm border border-white/40 transition-all hover:bg-white/80 hover:border-white/60 hover:shadow-md">
                    <CreatorIcon />
                    <span>CREATOR</span>
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
      </div>
    </header>
  )
}

// Quick Navigation Component for Creator Pages
export function CreatorNavigation() {
  const navItems = [
    { href: '/creator/royalties', label: 'Royalties', icon: <RoyaltiesIcon /> },
    { href: '/creator/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { href: '/creator/quality', label: 'Quality', icon: <QualityIcon /> },
    { href: '/creator/collaborations', label: 'Collaborate', icon: <CollaborateIcon /> },
  ]

  return (
    <nav className="bg-white/50 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-colors whitespace-nowrap">
                {item.icon}
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}