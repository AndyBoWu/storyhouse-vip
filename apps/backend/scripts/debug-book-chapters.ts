#!/usr/bin/env tsx

import { BookStorageService } from '../lib/storage/bookStorage'
import { BookOwnershipService } from '../lib/services/bookOwnershipService'

async function debugBookChapters() {
  const bookId = process.argv[2] || '0xb60e0fa96bf6aadc5db0a82b24046b2d9301dd48/project-phoenix'
  
  console.log(`\n🔍 Debugging book: ${bookId}`)
  console.log('=' .repeat(60))
  
  try {
    // Get book metadata
    const bookMetadata = await BookStorageService.getBookMetadata(bookId)
    console.log('\n📚 Book Metadata:')
    console.log(`Title: ${bookMetadata.title}`)
    console.log(`Author: ${bookMetadata.authorAddress} (${bookMetadata.authorName})`)
    console.log(`Total Chapters: ${bookMetadata.totalChapters}`)
    console.log(`\nChapter Map:`)
    for (const [key, path] of Object.entries(bookMetadata.chapterMap)) {
      console.log(`  ${key}: ${path}`)
    }
    
    // Check ownership with fixed service
    console.log('\n👤 Ownership Check:')
    const ownership = await BookOwnershipService.determineBookOwner(bookId)
    console.log(`IP Owner: ${ownership.ipOwner || 'Not established'}`)
    console.log(`Ownership Established: ${ownership.ownershipEstablished}`)
    console.log(`Reason: ${ownership.ownershipReason}`)
    console.log(`\nChapter Authors:`)
    for (const [chapter, author] of Object.entries(ownership.chapterAuthors)) {
      console.log(`  ${chapter}: ${author}`)
    }
    
    // Load and display chapter 1 details
    if (bookMetadata.chapterMap.ch1) {
      console.log('\n📖 Chapter 1 Details:')
      try {
        const chapter1 = await BookStorageService.getChapterContent(bookId, 1)
        if (chapter1) {
          console.log(`Title: ${chapter1.title}`)
          console.log(`Author: ${chapter1.authorAddress} (${chapter1.authorName})`)
          console.log(`IP Asset ID: ${chapter1.ipAssetId || 'Not registered'}`)
          console.log(`Transaction Hash: ${chapter1.transactionHash || 'Not available'}`)
        }
      } catch (error) {
        console.error('Error loading chapter 1:', error)
      }
    }
    
  } catch (error) {
    console.error('Error debugging book:', error)
  }
}

// Run the debug
debugBookChapters()