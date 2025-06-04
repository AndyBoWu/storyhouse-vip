import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return checkSecurity(request)
}

export async function POST(request: NextRequest) {
  return checkSecurity(request)
}

function checkSecurity(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  // List of bot/scraper patterns
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python', 'requests', 'headless', 'phantomjs', 'selenium',
    'puppeteer', 'playwright', 'chrome-lighthouse', 'gtmetrix',
    'pingdom', 'monitor', 'uptime', 'check', 'test', 'scan',
    'scrape', 'extract', 'harvest', 'collect', 'gather',
    'archiver', 'ia_archiver', 'wayback', 'archive.org',
    'semrush', 'ahrefs', 'moz', 'majestic', 'screaming',
    'sitemap', 'frog', 'netcraft', 'shodan', 'censys'
  ]

  // Check if user agent matches bot patterns
  const isBot = botPatterns.some(pattern => userAgent.includes(pattern))
  
  // Additional suspicious patterns
  const suspiciousPatterns = [
    'libwww', 'lwp-trivial', 'urllib', 'python-urllib',
    'python-requests', 'java/', 'apache-httpclient',
    'okhttp', 'go-http-client', 'node-fetch', 'axios'
  ]
  
  const isSuspicious = suspiciousPatterns.some(pattern => userAgent.includes(pattern))
  
  // Check for missing common browser headers
  const hasAcceptHeader = request.headers.has('accept')
  const hasAcceptLanguage = request.headers.has('accept-language')
  const hasAcceptEncoding = request.headers.has('accept-encoding')
  
  const missingBrowserHeaders = !hasAcceptHeader || !hasAcceptLanguage || !hasAcceptEncoding
  
  // Rate limiting check (simple in-memory store)
  const requestKey = `${ip}-${userAgent}`
  
  if (isBot || isSuspicious || missingBrowserHeaders) {
    console.log(`🚫 Blocked suspicious request:`, {
      ip,
      userAgent,
      isBot,
      isSuspicious,
      missingBrowserHeaders,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Access denied',
        message: 'Automated access detected. Please use a regular web browser.',
        code: 'BOT_DETECTED'
      },
      { status: 403 }
    )
  }
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'Security check passed',
    timestamp: new Date().toISOString()
  })
} 
