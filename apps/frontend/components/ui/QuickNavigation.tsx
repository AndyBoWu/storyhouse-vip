'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'

interface QuickNavigationProps {
  currentPage?: 'read' | 'write' | 'own'
  className?: string
}

export default function QuickNavigation({ currentPage, className = '' }: QuickNavigationProps) {
  const { address: connectedAddress } = useAccount()

  const navItems = [
    {
      id: 'read',
      label: 'READ',
      icon: '📖',
      href: '/read',
      className: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    {
      id: 'write',
      label: 'WRITE',
      icon: '✍️',
      href: '/write',
      className: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    },
    {
      id: 'own',
      label: 'OWN',
      icon: '👑',
      href: '/own',
      className: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    }
  ]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {navItems.map((item) => {
        const isActive = currentPage === item.id
        
        return (
          <Link key={item.id} href={item.href}>
            <button
              className={`
                px-4 py-2 rounded-full text-white font-medium text-sm
                bg-gradient-to-r ${item.className}
                transition-all duration-200 shadow-lg hover:shadow-xl
                ${isActive ? 'ring-2 ring-white ring-opacity-50' : ''}
                flex items-center gap-2 min-w-0
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          </Link>
        )
      })}
    </div>
  )
}