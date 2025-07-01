'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  // Check which navigation item is active
  const isActive = (path: string) => {
    if (path === '/read') return pathname?.startsWith('/read') || pathname?.startsWith('/book')
    if (path === '/write') return pathname?.startsWith('/write')
    if (path === '/own') return pathname?.startsWith('/own')
    if (path === '/creator') return pathname?.startsWith('/creator')
    return false
  }

  if (variant === 'minimal') {
    return (
      <header className="relative z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-lg">S</span>
              </div>
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
    <header className="relative z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center justify-between">
            {/* Left side - Logo and Main navigation */}
            <div className="flex items-center gap-8">
              {/* Logo/Brand */}
              <Link href="/" className="group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
              </Link>
              
              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <Link href="/read">
                  <button className={`group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                    isActive('/read')
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-700 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <ReadIcon className={isActive('/read') ? 'text-white' : ''} />
                    <span>READ</span>
                  </button>
                </Link>

                <Link href="/write">
                  <button className={`group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                    isActive('/write')
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-700 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <WriteIcon className={isActive('/write') ? 'text-white' : ''} />
                    <span>WRITE</span>
                  </button>
                </Link>

                <Link href="/own">
                  <button className={`group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                    isActive('/own')
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-700 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <OwnIcon className={isActive('/own') ? 'text-white' : ''} />
                    <span>OWN</span>
                  </button>
                </Link>

                {/* Creator Dashboard Link (only when connected) */}
                {isConnected && (
                  <Link href="/creator/royalties">
                    <button className={`group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                      isActive('/creator')
                        ? 'bg-green-500 text-white shadow-md'
                        : 'text-gray-700 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}>
                      <CreatorIcon className={isActive('/creator') ? 'text-white' : ''} />
                      <span>CREATOR</span>
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - Notification Bell & Wallet */}
            <div className="flex items-center gap-4">
              {showNotifications && isConnected && (
                <NotificationBell />
              )}
              <WalletConnect />
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