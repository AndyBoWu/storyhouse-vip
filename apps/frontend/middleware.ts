import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const url = request.nextUrl.clone()

  // List of bot/scraper patterns to block
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python', 'requests', 'headless', 'phantomjs', 'selenium',
    'puppeteer', 'playwright', 'chrome-lighthouse', 'gtmetrix',
    'pingdom', 'monitor', 'uptime', 'check', 'test', 'scan',
    'scrape', 'extract', 'harvest', 'collect', 'gather',
    'archiver', 'ia_archiver', 'wayback', 'archive.org',
    'semrush', 'ahrefs', 'moz', 'majestic', 'screaming',
    'sitemap', 'frog', 'netcraft', 'shodan', 'censys',
    'libwww', 'lwp-trivial', 'urllib', 'python-urllib',
    'python-requests', 'java/', 'apache-httpclient',
    'okhttp', 'go-http-client', 'node-fetch', 'axios'
  ]

  // Check if user agent matches bot patterns
  const isBot = botPatterns.some(pattern => userAgent.includes(pattern))

  // Check for suspicious request patterns
  const hasUserAgent = request.headers.has('user-agent')
  const hasAcceptHeader = request.headers.has('accept')
  const hasAcceptLanguage = request.headers.has('accept-language')
  
  // Most legitimate browsers send these headers
  const missingBrowserHeaders = !hasUserAgent || !hasAcceptHeader || !hasAcceptLanguage

  // Block if detected as bot or missing required headers
  if (isBot || missingBrowserHeaders) {
    console.log(`🚫 Middleware blocked request:`, {
      userAgent,
      path: request.nextUrl.pathname,
      isBot,
      missingBrowserHeaders,
      timestamp: new Date().toISOString()
    })

    // Return a 403 Forbidden response
    return new NextResponse(
      JSON.stringify({
        error: 'Access Denied',
        message: 'Automated access detected. Please use a regular web browser to access StoryHouse.vip content.',
        code: 'BOT_BLOCKED',
        timestamp: new Date().toISOString()
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex',
        },
      }
    )
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:;"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/security (allow security checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 
