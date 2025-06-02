import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StoryHouse.vip - Read Stories, Earn Tokens, Create with AI',
  description: 'First 3 chapters FREE. Earn $TIP tokens while reading. Remix content and earn from your creativity. Built on Story Protocol.',
  keywords: ['AI writing', 'blockchain publishing', 'read to earn', 'story protocol', 'content creation'],
  authors: [{ name: 'StoryHouse.vip Team' }],
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
    description: 'Revolutionary AI-assisted writing platform built on Story Protocol.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#667eea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
