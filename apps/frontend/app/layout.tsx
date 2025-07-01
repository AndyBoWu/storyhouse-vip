import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'
import './protection.css'
import Web3Provider from '@/components/Web3Provider'
import AntiScrapeHeaders from '@/components/ui/AntiScrapeHeaders'
import Footer from '@/components/ui/Footer'
import VersionDisplay from '@/components/ui/VersionDisplay'

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
  title: 'StoryHouse.vip - Web3 Storytelling with AI & IP Protection',
  description: 'First 3 chapters FREE. Create stories with AI, protect your IP on blockchain, and earn from your content. Built on Story Protocol.',
  keywords: ['AI writing', 'blockchain publishing', 'IP protection', 'story protocol', 'content creation', 'web3 storytelling'],
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
      <head>
        <AntiScrapeHeaders />
      </head>
      <body className="min-h-screen font-sans antialiased flex flex-col">
        <Web3Provider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <VersionDisplay />
        </Web3Provider>
      </body>
    </html>
  )
}
