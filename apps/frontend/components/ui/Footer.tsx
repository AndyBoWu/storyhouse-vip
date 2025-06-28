import Link from 'next/link'
import { 
  DocumentIcon,
  RoadmapIcon,
  ChartIcon,
  CodeIcon,
  DiscordIcon,
  GithubIcon,
  TwitterIcon,
  LinkIcon
} from './icons'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">📚</div>
              <span className="text-xl font-bold">StoryHouse.vip</span>
            </div>
            <p className="text-gray-400 text-sm">
              Revolutionary Web3 storytelling platform built on Story Protocol. 
              Read, create, and own your stories.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Powered by</span>
              <span className="font-semibold text-blue-400">Story Protocol</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/read" className="text-gray-400 hover:text-white transition-colors">
                  📖 Read Stories
                </Link>
              </li>
              <li>
                <Link href="/write" className="text-gray-400 hover:text-white transition-colors">
                  ✍️ Write & Create
                </Link>
              </li>
              <li>
                <Link href="/own" className="text-gray-400 hover:text-white transition-colors">
                  👑 Own Your IP
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn More */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Learn More</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/whitepaper" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <DocumentIcon className="h-4 w-4" />
                  Whitepaper
                </Link>
              </li>
              <li>
                <Link 
                  href="/roadmap" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <RoadmapIcon className="h-4 w-4" />
                  Roadmap
                </Link>
              </li>
              <li>
                <Link 
                  href="/tokenomics" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ChartIcon className="h-4 w-4" />
                  Tokenomics
                </Link>
              </li>
              <li>
                <Link 
                  href="/docs" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <CodeIcon className="h-4 w-4" />
                  Technical Docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://discord.gg/storyhouse" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <DiscordIcon className="h-4 w-4" />
                  Discord
                  <LinkIcon className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/storyhouse_vip" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <TwitterIcon className="h-4 w-4" />
                  Twitter
                  <LinkIcon className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/AndyBoWu/storyhouse-vip" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <GithubIcon className="h-4 w-4" />
                  GitHub
                  <LinkIcon className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © 2025 StoryHouse.vip. All rights reserved.
            </div>
            
            {/* Key Stats */}
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Testnet Live</span>
              </div>
              <div>10B TIP Tokens</div>
              <div>Chapter-Level IP</div>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}