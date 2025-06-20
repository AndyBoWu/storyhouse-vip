#!/usr/bin/env tsx
/**
 * Script to delete specific chapters from a book in R2
 * Usage: 
 *   Delete specific chapters: pnpm tsx scripts/delete-specific-chapters.ts <bookId> <chapterNumbers...>
 * 
 * Example:
 *   pnpm tsx scripts/delete-specific-chapters.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7" 11 12 13 14 15
 */

import { config } from 'dotenv';
import { R2Service } from '../lib/r2';
import { BookStorageService } from '../lib/storage/bookStorage';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const bookId = process.argv[2];
const chapterNumbers = process.argv.slice(3).map(n => parseInt(n, 10)).filter(n => !isNaN(n));

if (!bookId || chapterNumbers.length === 0) {
  console.error('Usage: pnpm tsx scripts/delete-specific-chapters.ts <bookId> <chapterNumbers...>');
  console.error('Example: pnpm tsx scripts/delete-specific-chapters.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7" 11 12 13 14 15');
  process.exit(1);
}

async function deleteSpecificChapters(bookId: string, chapterNumbers: number[]) {
  console.log('🗑️ Preparing to delete chapters from book:', bookId);
  console.log('📝 Chapters to delete:', chapterNumbers.join(', '));
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Generate paths for each chapter
    const bookPaths = BookStorageService.generateBookPaths(authorAddress, slug);
    
    console.log('\n⚠️  WARNING: This will permanently delete the following chapters:');
    for (const chapterNum of chapterNumbers) {
      console.log(`  📄 Chapter ${chapterNum}`);
    }
    
    console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete each chapter
    console.log('\n🗑️ Deleting chapters...');
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const chapterNum of chapterNumbers) {
      const chapterPaths = BookStorageService.generateChapterPaths(bookPaths, chapterNum);
      
      // Delete chapter content
      try {
        process.stdout.write(`  Deleting chapter ${chapterNum} content...`);
        await R2Service.deleteContent(chapterPaths.contentPath);
        console.log(' ✅');
        deletedCount++;
      } catch (error) {
        console.log(' ❌');
        console.error(`    Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedCount++;
      }
      
      // Also try to delete any metadata or IP metadata files
      const additionalFiles = [
        `${chapterPaths.chapterFolder}/metadata.json`,
        `${chapterPaths.chapterFolder}/ip-metadata.json`
      ];
      
      for (const file of additionalFiles) {
        try {
          await R2Service.deleteContent(file);
          console.log(`    Also deleted: ${file.split('/').pop()}`);
        } catch (error) {
          // Ignore errors for optional files
        }
      }
    }
    
    console.log(`\n✅ Deletion complete: ${deletedCount} chapters deleted, ${failedCount} failed`);
    
    // Update book metadata to reflect the deleted chapters
    try {
      console.log('\n📝 Updating book metadata...');
      const metadata = await BookStorageService.getBookMetadata(bookId);
      
      // Update chapter count
      const remainingChapters = metadata.totalChapters - deletedCount;
      metadata.totalChapters = remainingChapters;
      metadata.chapters = remainingChapters; // Backward compatibility
      metadata.updatedAt = new Date().toISOString();
      
      // Remove deleted chapters from chapterMap if it exists
      if (metadata.chapterMap) {
        for (const chapterNum of chapterNumbers) {
          delete metadata.chapterMap[chapterNum.toString()];
        }
      }
      
      // Save updated metadata
      await BookStorageService.storeBookMetadata(authorAddress, slug, metadata);
      console.log('✅ Book metadata updated successfully');
      console.log(`   New total chapters: ${remainingChapters}`);
    } catch (error) {
      console.error('⚠️  Warning: Could not update book metadata:', error instanceof Error ? error.message : 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error deleting chapters:', error);
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    await deleteSpecificChapters(bookId, chapterNumbers);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();