#!/usr/bin/env node

/**
 * Debug script to check books API and R2 storage
 * This helps diagnose why books aren't showing in the discovery page
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env.local') })

async function debugBooksAPI() {
  console.log('🔍 Debugging Books API...\n')
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  
  try {
    // 1. Test basic API connectivity
    console.log('1. Testing API connectivity...')
    const healthCheck = await fetch(`${API_URL}/api/books`)
    console.log(`   Status: ${healthCheck.status}`)
    console.log(`   Headers:`, Object.fromEntries(healthCheck.headers.entries()))
    
    // 2. Get the actual response
    const response = await healthCheck.json()
    console.log('\n2. API Response:')
    console.log(`   Success: ${response.success}`)
    console.log(`   Books count: ${response.books?.length || 0}`)
    console.log(`   Source: ${response.source || 'unknown'}`)
    
    if (response.books && response.books.length > 0) {
      console.log('\n3. Books found:')
      response.books.forEach((book: any, index: number) => {
        console.log(`   ${index + 1}. ${book.title} by ${book.authorAddress}`)
        console.log(`      ID: ${book.id}`)
        console.log(`      Chapters: ${book.chapters}`)
        console.log(`      Created: ${book.createdAt}`)
      })
    } else {
      console.log('\n3. No books found in response')
    }
    
    // 3. Check if using index or direct R2
    if (response.source === 'index') {
      console.log('\n4. Using book index:')
      console.log(`   Index version: ${response.indexVersion}`)
      console.log(`   Last updated: ${response.indexLastUpdated}`)
    } else {
      console.log('\n4. Using direct R2 access (no index or index failed)')
    }
    
    // 4. Test with cache disabled
    console.log('\n5. Testing with cache disabled...')
    const noCacheResponse = await fetch(`${API_URL}/api/books?cache=false`)
    const noCacheData = await noCacheResponse.json()
    console.log(`   Books count (no cache): ${noCacheData.books?.length || 0}`)
    
    // 5. Force index rebuild
    console.log('\n6. Testing with index disabled (direct R2)...')
    const directResponse = await fetch(`${API_URL}/api/books?useIndex=false`)
    const directData = await directResponse.json()
    console.log(`   Books count (direct): ${directData.books?.length || 0}`)
    
    if (directData.debug) {
      console.log(`   Total author directories: ${directData.debug.totalAuthorDirectories}`)
      console.log(`   Processed books: ${directData.debug.processedBooks}`)
    }
    
  } catch (error) {
    console.error('❌ Error debugging books API:', error)
  }
}

// Run the debug script
debugBooksAPI()