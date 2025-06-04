import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'
import Web3Provider from '@/components/Web3Provider'

// Configure reading-optimized fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-merriweather',
})

export const metadata: Metadata = {
  title: 'StoryHouse.vip - Read Stories, Earn Tokens, Create with AI',
  description: 'First 3 chapters FREE. Earn $TIP tokens while reading. Remix content and earn from your creativity. Built on Story Protocol.',
  keywords: ['AI writing', 'blockchain publishing', 'read to earn', 'story protocol', 'content creation'],
  authors: [{ name: 'StoryHouse.vip Team' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'StoryHouse.vip - Read Stories, Earn Tokens, Create with AI',
    description: 'Revolutionary AI-assisted writing platform built on Story Protocol. Read, earn, and create with blockchain technology.',
    url: 'https://storyhouse.vip',
    siteName: 'StoryHouse.vip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryHouse.vip - Read Stories, Earn Tokens, Create with AI',
    description: 'Revolutionary AI-assisted writing platform built on Story Protocol. Read, earn, and create with blockchain technology.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#667eea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${merriweather.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}
