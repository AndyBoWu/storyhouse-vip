import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const url = request.nextUrl.clone()

  // Check for legitimate browsers first
  const legitimateBrowsers = [
    'mozilla/', 'chrome/', 'safari/', 'firefox/', 'edge/', 'opera/'
  ]

  const isLegitmateBrowser = legitimateBrowsers.some(browser => 
    userAgent.includes(browser) && 
    (userAgent.includes('mozilla/') || userAgent.includes('webkit'))
  )

  // More precise bot/scraper patterns - avoid blocking legitimate browsers
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'applebot',
    'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python-requests', 'python-urllib', 'headless', 'phantomjs', 'selenium',
    'puppeteer', 'playwright', 'chrome-lighthouse', 'gtmetrix',
    'pingdom', 'monitor', 'uptime', 'sitemap', 'scrape', 'extract', 
    'harvest', 'collect', 'gather', 'archiver', 'ia_archiver', 'wayback',
    'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'screaming',
    'netcraft', 'shodan', 'censys', 'libwww', 'lwp-trivial',
    'java/', 'apache-httpclient', 'okhttp', 'go-http-client', 
    'node-fetch', 'axios', 'requests/', 'urllib'
  ]

  // Only check for bots if it's not a legitimate browser
  const isBot = !isLegitmateBrowser && botPatterns.some(pattern => userAgent.includes(pattern))

  // Check for suspicious request patterns
  const hasUserAgent = request.headers.has('user-agent')
  const hasAcceptHeader = request.headers.has('accept')
  const hasAcceptLanguage = request.headers.has('accept-language')
  
  // Most legitimate browsers send these headers
  const missingBrowserHeaders = !hasUserAgent || !hasAcceptHeader || !hasAcceptLanguage

  // Additional checks for suspicious patterns
  const suspiciousPatterns = [
    // Very short user agents (likely bots)
    userAgent.length < 20,
    // Missing common browser indicators
    !userAgent.includes('mozilla') && !userAgent.includes('webkit'),
    // Common bot identifiers
    userAgent.includes('bot') && !isLegitmateBrowser,
    userAgent.includes('crawler') && !isLegitmateBrowser
  ]

  const isSuspicious = suspiciousPatterns.some(Boolean)

  // Block if detected as bot, missing headers, or suspicious
  if (isBot || (missingBrowserHeaders && !isLegitmateBrowser) || isSuspicious) {
    console.log(`🚫 Middleware blocked request:`, {
      userAgent,
      path: request.nextUrl.pathname,
      isBot,
      isLegitmateBrowser,
      missingBrowserHeaders,
      isSuspicious,
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
