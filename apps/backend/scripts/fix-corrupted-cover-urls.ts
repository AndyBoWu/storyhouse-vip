#!/usr/bin/env tsx
/**
 * Fix Corrupted Cover URLs Script
 * 
 * This script fixes book cover URLs that have 'storyhouse.oks' instead of 'storyhouse-content'
 * in the database.
 * 
 * Usage: pnpm tsx scripts/fix-corrupted-cover-urls.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { promises as fs } from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const INDEX_PATH = path.join(__dirname, '..', 'data', 'books', 'index.json');

async function fixCorruptedUrls() {
  console.log('🔧 Fixing Corrupted Cover URLs');
  console.log('==============================');
  
  try {
    // Read the book index
    const indexContent = await fs.readFile(INDEX_PATH, 'utf-8');
    const bookIndex = JSON.parse(indexContent);
    
    console.log(`📚 Found ${Object.keys(bookIndex).length} books in index`);
    
    let fixedCount = 0;
    const updatedIndex = { ...bookIndex };
    
    // Check each book for corrupted URLs
    for (const [bookId, book] of Object.entries(bookIndex)) {
      const bookData = book as any;
      
      // Check if coverUrl contains 'storyhouse.oks'
      if (bookData.coverUrl && bookData.coverUrl.includes('storyhouse.oks')) {
        console.log(`\n❌ Found corrupted URL for book: ${bookData.title}`);
        console.log(`   Book ID: ${bookId}`);
        console.log(`   Old URL: ${bookData.coverUrl}`);
        
        // Fix the URL by replacing 'storyhouse.oks' with 'storyhouse-content'
        const fixedUrl = bookData.coverUrl.replace('storyhouse.oks', 'storyhouse-content');
        console.log(`   New URL: ${fixedUrl}`);
        
        // Update the book data
        updatedIndex[bookId] = {
          ...bookData,
          coverUrl: fixedUrl
        };
        
        fixedCount++;
      }
      
      // Also check coverImageUrl if it exists
      if (bookData.coverImageUrl && bookData.coverImageUrl.includes('storyhouse.oks')) {
        console.log(`\n❌ Found corrupted coverImageUrl for book: ${bookData.title}`);
        console.log(`   Book ID: ${bookId}`);
        console.log(`   Old URL: ${bookData.coverImageUrl}`);
        
        // Fix the URL
        const fixedUrl = bookData.coverImageUrl.replace('storyhouse.oks', 'storyhouse-content');
        console.log(`   New URL: ${fixedUrl}`);
        
        // Update the book data
        updatedIndex[bookId] = {
          ...updatedIndex[bookId],
          coverImageUrl: fixedUrl
        };
        
        if (!bookData.coverUrl?.includes('storyhouse.oks')) {
          fixedCount++; // Only increment if we didn't already count this book
        }
      }
    }
    
    if (fixedCount > 0) {
      // Save the updated index
      await fs.writeFile(INDEX_PATH, JSON.stringify(updatedIndex, null, 2));
      console.log(`\n✅ Fixed ${fixedCount} corrupted cover URLs`);
      console.log('📝 Updated book index saved');
    } else {
      console.log('\n✨ No corrupted URLs found!');
    }
    
    // Also check for any books with missing covers
    console.log('\n🔍 Checking for books with missing covers...');
    let missingCount = 0;
    
    for (const [bookId, book] of Object.entries(bookIndex)) {
      const bookData = book as any;
      if (!bookData.coverUrl && !bookData.coverImageUrl) {
        console.log(`📷 Book without cover: ${bookData.title} (${bookId})`);
        missingCount++;
      }
    }
    
    if (missingCount > 0) {
      console.log(`\n📊 Total books without covers: ${missingCount}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixCorruptedUrls().catch(console.error);