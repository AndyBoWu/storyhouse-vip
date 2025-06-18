#!/usr/bin/env node
/**
 * Migration script to add licenseTermsId to existing chapters
 * 
 * This script adds the licenseTermsId field to chapters that were published
 * before we started storing this value. The license terms ID is essential
 * for minting reading licenses.
 * 
 * Usage: npm run migrate:license-terms
 */

import { R2Service } from '../lib/r2'
import { BookStorageService } from '../lib/storage/bookStorage'
import type { ChapterMetadata } from '../lib/types/book'

// Known chapters with their license terms IDs
// These were found by examining blockchain transactions
const KNOWN_LICENSE_TERMS: Record<string, Record<number, string>> = {
  // Andy's Project Phoenix book
  '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix': {
    4: '13', // Chapter 4 has license terms ID 13
    // Add more chapters as we discover them
  }
}

async function migrateChapterLicenseTerms() {
  console.log('🔄 Starting license terms migration...')
  
  try {
    // Process each book with known license terms
    for (const [bookId, chapterTerms] of Object.entries(KNOWN_LICENSE_TERMS)) {
      console.log(`\n📚 Processing book: ${bookId}`)
      
      // Parse book ID
      const [authorAddress, slug] = bookId.split('/')
      
      // Process each chapter
      for (const [chapterNumber, licenseTermsId] of Object.entries(chapterTerms)) {
        const chapterNum = parseInt(chapterNumber)
        console.log(`  📄 Updating chapter ${chapterNum} with license terms ID: ${licenseTermsId}`)
        
        try {
          // Get current chapter data
          const chapterData = await BookStorageService.getChapterContent(
            authorAddress as any,
            slug,
            chapterNum
          )
          
          // Check if already has license terms ID
          if (chapterData.licenseTermsId) {
            console.log(`    ✅ Chapter already has license terms ID: ${chapterData.licenseTermsId}`)
            continue
          }
          
          // Add license terms ID
          const updatedChapter: ChapterMetadata = {
            ...chapterData,
            licenseTermsId,
            updatedAt: new Date().toISOString()
          }
          
          // Save updated chapter
          await BookStorageService.storeChapterContent(
            authorAddress as any,
            slug,
            chapterNum,
            updatedChapter
          )
          
          console.log(`    ✅ Chapter ${chapterNum} updated successfully`)
          
        } catch (error) {
          console.error(`    ❌ Failed to update chapter ${chapterNum}:`, error)
        }
      }
    }
    
    console.log('\n✅ Migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateChapterLicenseTerms()
}

export { migrateChapterLicenseTerms }