#!/usr/bin/env tsx
/**
 * Script to check which chapters exist for a book by attempting to fetch them
 * Usage: 
 *   Check chapters: pnpm tsx scripts/check-book-chapters.ts <bookId> [maxChapter]
 * 
 * Example:
 *   pnpm tsx scripts/check-book-chapters.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
 *   pnpm tsx scripts/check-book-chapters.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7" 20
 */

import { config } from 'dotenv';
import { R2Service } from '../lib/r2';
import { BookStorageService } from '../lib/storage/bookStorage';

// Load environment variables - ensure .env.local takes precedence
config({ path: '.env' });
config({ path: '.env.local' });

const bookId = process.argv[2];
const maxChapter = parseInt(process.argv[3] || '100', 10);

if (!bookId) {
  console.error('Usage: pnpm tsx scripts/check-book-chapters.ts <bookId> [maxChapter]');
  console.error('Example: pnpm tsx scripts/check-book-chapters.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"');
  process.exit(1);
}

async function checkBookChapters(bookId: string, maxChapter: number) {
  console.log('🔍 Checking chapters for book:', bookId);
  console.log('📊 Checking up to chapter:', maxChapter);
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // First, try to get book metadata
    console.log('\n📚 Fetching book metadata...');
    try {
      const metadata = await BookStorageService.getBookMetadata(bookId);
      console.log('✅ Book found:');
      console.log('  Title:', metadata.title);
      console.log('  Author:', metadata.authorName || metadata.authorAddress);
      console.log('  Created:', metadata.createdAt);
      console.log('  Total Chapters (metadata):', metadata.totalChapters || metadata.chapters || 'Unknown');
      console.log('  IP Asset ID:', metadata.ipAssetId || 'Not registered');
    } catch (error) {
      console.log('⚠️  Could not fetch book metadata:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Check each chapter
    console.log('\n📖 Checking individual chapters...');
    const existingChapters: number[] = [];
    const missingChapters: number[] = [];
    
    for (let chapterNum = 1; chapterNum <= maxChapter; chapterNum++) {
      process.stdout.write(`  Checking chapter ${chapterNum}...`);
      
      try {
        const chapterContent = await BookStorageService.getChapterContent(authorAddress, slug, chapterNum);
        console.log(` ✅ Found (${chapterContent.wordCount || 0} words)`);
        existingChapters.push(chapterNum);
      } catch (error) {
        console.log(' ❌ Not found');
        missingChapters.push(chapterNum);
        
        // If we have 5 consecutive missing chapters, assume we've reached the end
        if (missingChapters.length >= 5 && 
            missingChapters.slice(-5).every((n, i, arr) => i === 0 || n === arr[i-1] + 1)) {
          console.log('\n💡 Found 5 consecutive missing chapters, assuming end of book');
          break;
        }
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total chapters found: ${existingChapters.length}`);
    console.log(`  Chapter numbers: ${existingChapters.join(', ')}`);
    
    if (missingChapters.length > 0 && missingChapters.length < 20) {
      console.log(`  Missing chapters: ${missingChapters.join(', ')}`);
    }
    
    // Check for gaps in chapter numbering
    const gaps: number[] = [];
    for (let i = 1; i < existingChapters.length; i++) {
      if (existingChapters[i] - existingChapters[i-1] > 1) {
        for (let gap = existingChapters[i-1] + 1; gap < existingChapters[i]; gap++) {
          gaps.push(gap);
        }
      }
    }
    
    if (gaps.length > 0) {
      console.log(`\n⚠️  Gaps in chapter numbering: ${gaps.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking chapters:', error);
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    await checkBookChapters(bookId, maxChapter);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();