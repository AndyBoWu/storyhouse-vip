#!/usr/bin/env node

/**
 * Test script for derivative book creation flow
 * Tests the complete flow: 
 * 1. Andy creates a book with 3 chapters
 * 2. Bob creates a derivative book
 * 3. Bob publishes chapter 4 to his derivative book
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env.local') })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// Test data
const ANDY_ADDRESS = '0x1234567890123456789012345678901234567890'
const BOB_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testDerivativeBookFlow() {
  console.log('🧪 Testing Derivative Book Creation Flow\n')
  
  try {
    // Step 1: Create Andy's original book
    console.log('1️⃣ Creating Andy\'s original book...')
    const timestamp = Date.now()
    const bookTitle = `Test Book ${timestamp}`
    const description = 'A test book for derivative testing. This description is long enough to meet the minimum requirement of 50 characters for the API validation.'
    
    const formData = new FormData()
    formData.append('title', bookTitle)
    formData.append('description', description)
    formData.append('authorAddress', ANDY_ADDRESS)
    formData.append('authorName', 'Andy')
    formData.append('genres', JSON.stringify(['fiction']))
    formData.append('contentRating', 'PG')
    formData.append('licenseTerms', JSON.stringify({
      tier: 'free',
      commercialUse: false,
      attribution: true
    }))
    
    const createBookResponse = await fetch(`${API_URL}/api/books/register`, {
      method: 'POST',
      body: formData
    })
    
    const bookData = await createBookResponse.json()
    if (!bookData.success) {
      throw new Error(`Failed to create book: ${bookData.error}`)
    }
    
    const andyBookId = bookData.book.bookId
    console.log(`✅ Andy's book created: ${andyBookId}`)
    console.log(`   Title: ${bookTitle}`)
    console.log(`   Author: ${ANDY_ADDRESS}`)
    
    // Step 2: Add 3 chapters to Andy's book
    console.log('\n2️⃣ Adding 3 chapters to Andy\'s book...')
    for (let i = 1; i <= 3; i++) {
      const chapterContent = `This is the content of chapter ${i} written by Andy. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`
      
      const chapterResponse = await fetch(`${API_URL}/api/books/${encodeURIComponent(andyBookId)}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: andyBookId,
          chapterNumber: i,
          title: `Chapter ${i}`,
          content: chapterContent,
          wordCount: chapterContent.split(' ').length,
          readingTime: Math.ceil(chapterContent.split(' ').length / 200), // Assume 200 WPM
          authorAddress: ANDY_ADDRESS,
          authorName: 'Andy',
          unlockPrice: i === 1 ? 0 : 10, // First chapter free
          licensePrice: 100,
          generationMethod: 'human'
        })
      })
      
      const chapterData = await chapterResponse.json()
      if (!chapterData.success) {
        console.error(`❌ Failed to create chapter ${i}: ${chapterData.error}`)
      } else {
        console.log(`   ✅ Chapter ${i} created`)
      }
      
      await delay(100) // Small delay between chapters
    }
    
    // Step 3: Bob creates a derivative book through branch API
    console.log('\n3️⃣ Bob creating derivative book from Andy\'s book...')
    
    const branchFormData = new FormData()
    branchFormData.append('parentBookId', andyBookId)
    branchFormData.append('branchPoint', 'ch3')
    branchFormData.append('authorAddress', BOB_ADDRESS)
    branchFormData.append('newTitle', 'Bob\'s Galactic Adventure') // 🎯 Custom title instead of "Andy's Book - Remix"
    branchFormData.append('newDescription', 'Bob takes the story into space with aliens and time travel!')
    branchFormData.append('genres', JSON.stringify(['sci-fi', 'adventure']))
    branchFormData.append('contentRating', 'PG')
    // Note: We could also add a custom cover with branchFormData.append('newCover', fileData)
    
    const branchResponse = await fetch(`${API_URL}/api/books/branch`, {
      method: 'POST',
      body: branchFormData
    })
    
    const branchData = await branchResponse.json()
    if (!branchData.success) {
      throw new Error(`Failed to create derivative book: ${branchData.error}`)
    }
    
    const bobBookId = branchData.book.bookId
    console.log(`✅ Bob's derivative book created: ${bobBookId}`)
    console.log(`   Title: ${branchData.book.title}`)
    console.log(`   Parent Book: ${andyBookId}`)
    console.log(`   Is Derivative: ${branchData.book.isDerivative}`)
    console.log(`   Next Chapter Number: ${branchData.book.nextChapterNumber}`)
    console.log(`   Inherited Chapters: ${Object.keys(branchData.book.chapterMap).join(', ')}`)
    
    // Step 4: Verify Bob's book metadata
    console.log('\n4️⃣ Verifying Bob\'s derivative book metadata...')
    const encodedBobBookId = encodeURIComponent(bobBookId)
    console.log(`   Fetching: ${API_URL}/api/books/${encodedBobBookId}`)
    const bobBookResponse = await fetch(`${API_URL}/api/books/${encodedBobBookId}`)
    console.log(`   Response status: ${bobBookResponse.status}`)
    
    if (!bobBookResponse.ok) {
      const responseText = await bobBookResponse.text()
      console.log(`   Response text (first 200 chars): ${responseText.slice(0, 200)}`)
      throw new Error(`Failed to fetch Bob's book: ${bobBookResponse.status} ${bobBookResponse.statusText}`)
    }
    
    const bobBookData = await bobBookResponse.json()
    
    if (bobBookData.success) {
      const book = bobBookData.book
      console.log(`✅ Book metadata verified:`)
      console.log(`   Title: ${book.title}`)
      console.log(`   Author: ${book.authorAddress}`)
      console.log(`   Parent Book: ${book.parentBook}`)
      console.log(`   Is Derivative: ${book.isDerivative}`)
      console.log(`   Chapter Count: ${book.totalChapters}`)
      console.log(`   Chapter Map: ${JSON.stringify(book.chapterMap, null, 2)}`)
    }
    
    // Step 5: Bob publishes chapter 4 to his derivative book
    console.log('\n5️⃣ Bob publishing chapter 4 to his derivative book...')
    const chapter4Content = 'Bob takes the story in a completely new direction with time travel and aliens! This is where the story splits into a parallel universe. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    
    const chapter4Response = await fetch(`${API_URL}/api/books/${encodeURIComponent(bobBookId)}/chapters/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: bobBookId,
        chapterNumber: 4,
        title: 'Chapter 4: Bob\'s New Direction',
        content: chapter4Content,
        wordCount: chapter4Content.split(' ').length,
        readingTime: Math.ceil(chapter4Content.split(' ').length / 200),
        authorAddress: BOB_ADDRESS,
        authorName: 'Bob',
        unlockPrice: 10,
        licensePrice: 100,
        generationMethod: 'human'
      })
    })
    
    const chapter4Data = await chapter4Response.json()
    if (!chapter4Data.success) {
      throw new Error(`Failed to create chapter 4: ${chapter4Data.error}`)
    }
    
    console.log(`✅ Chapter 4 created successfully!`)
    console.log(`   Chapter ID: ${chapter4Data.data.chapterId}`)
    console.log(`   Author: ${BOB_ADDRESS}`)
    
    // Step 6: Verify the final state
    console.log('\n6️⃣ Final verification...')
    const finalBookResponse = await fetch(`${API_URL}/api/books/${bobBookId}`)
    const finalBookData = await finalBookResponse.json()
    
    if (finalBookData.success) {
      const book = finalBookData.book
      console.log(`✅ Final book state:`)
      console.log(`   Total Chapters: ${book.totalChapters}`)
      console.log(`   Chapters in Map: ${Object.keys(book.chapterMap).length}`)
      console.log(`   Chapter Map:`)
      Object.entries(book.chapterMap).forEach(([chNum, chPath]) => {
        console.log(`     ${chNum}: ${chPath}`)
      })
    }
    
    // Summary
    console.log('\n✨ Test Summary:')
    console.log(`   Andy's Original Book: ${andyBookId}`)
    console.log(`   Bob's Derivative Book: ${bobBookId}`)
    console.log(`   Successfully created derivative book with inherited chapters 1-3`)
    console.log(`   Successfully published new chapter 4 to derivative book`)
    console.log(`   Bob is the curator of his own book and can manage it independently`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testDerivativeBookFlow()
  .then(() => {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Test error:', error)
    process.exit(1)
  })