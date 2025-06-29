#!/usr/bin/env tsx

import { BookOwnershipService } from '../lib/services/bookOwnershipService'

async function testBookOwnership() {
  const bookId = process.argv[2]
  
  if (!bookId) {
    console.error('Usage: tsx scripts/test-book-ownership.ts <bookId>')
    process.exit(1)
  }

  console.log(`\nTesting ownership for book: ${bookId}`)
  console.log('=' .repeat(50))
  
  try {
    const ownership = await BookOwnershipService.determineBookOwner(bookId)
    
    console.log('\nOwnership Info:')
    console.log(`- IP Owner: ${ownership.ipOwner || 'Not established'}`)
    console.log(`- Ownership Established: ${ownership.ownershipEstablished}`)
    console.log(`- Reason: ${ownership.ownershipReason}`)
    console.log('\nChapter Authors:')
    
    for (const [chapter, author] of Object.entries(ownership.chapterAuthors)) {
      console.log(`  - ${chapter}: ${author}`)
    }
    
  } catch (error) {
    console.error('Error checking ownership:', error)
  }
}

// Run the test
testBookOwnership()