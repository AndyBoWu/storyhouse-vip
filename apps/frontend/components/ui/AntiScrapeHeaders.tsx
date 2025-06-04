'use client'

import Head from 'next/head'

export default function AntiScrapeHeaders() {
  return (
    <>
      {/* Anti-bot and anti-scraping meta tags */}
      <meta name="robots" content="noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex" />
      <meta name="googlebot" content="noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex" />
      <meta name="bingbot" content="noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex" />
      <meta name="slurp" content="noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex" />
      
      {/* Prevent caching */}
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      
      {/* Additional protection */}
      <meta name="referrer" content="no-referrer" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Disable automatic translation */}
      <meta name="google" content="notranslate" />
      
      {/* Prevent content from being saved */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="msapplication-config" content="none" />
      
      {/* Additional security headers via meta tags */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
    </>
  )
} 
