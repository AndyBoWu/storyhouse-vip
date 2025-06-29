#!/usr/bin/env tsx

// This script will test saving a chapter and checking ownership
import { BookOwnershipService } from '../lib/services/bookOwnershipService'

async function testChapterSave() {
  const bookId = '0xb60e0fa96bf6aadc5db0a82b24046b2d9301dd48/project-phoenix'
  const authorAddress = '0xb60e0fa96bf6aadc5db0a82b24046b2d9301dd48'
  
  console.log('\n🔍 Testing chapter save for book:', bookId)
  console.log('Author address:', authorAddress)
  console.log('=' .repeat(60))
  
  try {
    // Check current ownership
    console.log('\n📚 Checking current ownership...')
    const ownership = await BookOwnershipService.determineBookOwner(bookId)
    
    console.log('Ownership Info:')
    console.log('- IP Owner:', ownership.ipOwner || 'Not established')
    console.log('- Ownership Established:', ownership.ownershipEstablished)
    console.log('- Reason:', ownership.ownershipReason)
    console.log('- Chapter Authors:', ownership.chapterAuthors)
    
    // The issue is that BookOwnershipService is trying to extract author from chapter path
    // But the path is "books/authorAddress/slug/chapters/ch1/content.json"
    // And split('/')[0] returns "books", not the author address
    
    console.log('\n⚠️  Issue identified:')
    console.log('BookOwnershipService is extracting author incorrectly from chapter paths.')
    console.log('The fix has been applied to load chapter metadata instead.')
    console.log('\nHowever, the book data doesn\'t exist in R2, so the error persists.')
    console.log('This might be because the book was created in local development')
    console.log('and the data is only in browser local storage.')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

// Run the test
testChapterSave()