#!/usr/bin/env tsx
/**
 * Script to check and delete book files from R2
 * Usage: 
 *   Check if book exists: pnpm tsx scripts/manage-book-r2.ts check <bookId>
 *   Delete book files: pnpm tsx scripts/manage-book-r2.ts delete <bookId>
 * 
 * Example:
 *   pnpm tsx scripts/manage-book-r2.ts check "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
 *   pnpm tsx scripts/manage-book-r2.ts delete "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
 */

import { config } from 'dotenv';
import { R2Service } from '../lib/r2';
import { BookStorageService } from '../lib/storage/bookStorage';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const command = process.argv[2];
const bookId = process.argv[3];

if (!command || !bookId) {
  console.error('Usage: pnpm tsx scripts/manage-book-r2.ts <check|delete> <bookId>');
  console.error('Example: pnpm tsx scripts/manage-book-r2.ts check "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"');
  process.exit(1);
}

async function checkBook(bookId: string) {
  console.log('🔍 Checking book existence:', bookId);
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Generate the prefix for this book
    const bookPrefix = `books/${authorAddress.toLowerCase()}/${slug}/`;
    console.log('🔍 Looking for objects with prefix:', bookPrefix);
    
    // List all objects under this book
    const listResult = await R2Service.listObjects(bookPrefix);
    
    const objects = listResult.Contents || [];
    const totalSize = objects.reduce((sum, obj) => sum + (obj.Size || 0), 0);
    
    console.log(`\n📊 Found ${objects.length} objects, total size: ${(totalSize / 1024).toFixed(2)} KB`);
    
    if (objects.length === 0) {
      console.log('❌ No files found for this book');
      return;
    }
    
    // List all files
    console.log('\n📁 Files:');
    for (const obj of objects) {
      if (obj.Key) {
        const relativePath = obj.Key.replace(bookPrefix, '');
        console.log(`  📄 ${relativePath} (${obj.Size} bytes)`);
      }
    }
    
    // Try to fetch metadata
    try {
      const metadataContent = await R2Service.getContent(`${bookPrefix}metadata.json`);
      const metadata = JSON.parse(metadataContent);
      console.log('\n📚 Book Metadata:');
      console.log('  Title:', metadata.title);
      console.log('  Author:', metadata.authorName || metadata.authorAddress);
      console.log('  Created:', metadata.createdAt);
      console.log('  Total Chapters:', metadata.totalChapters);
    } catch (error) {
      console.log('\n⚠️ Could not fetch book metadata');
    }
    
  } catch (error) {
    console.error('❌ Error checking book:', error);
    process.exit(1);
  }
}

async function deleteBook(bookId: string) {
  console.log('🗑️ Preparing to delete book:', bookId);
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Generate the prefix for this book
    const bookPrefix = `books/${authorAddress.toLowerCase()}/${slug}/`;
    console.log('🔍 Looking for objects to delete with prefix:', bookPrefix);
    
    // List all objects under this book
    const listResult = await R2Service.listObjects(bookPrefix);
    
    const objects = listResult.Contents || [];
    console.log(`\n📊 Found ${objects.length} objects to delete`);
    
    if (objects.length === 0) {
      console.log('✅ No files found to delete');
      return;
    }
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete all files for this book!');
    console.log('Files to be deleted:');
    for (const obj of objects) {
      if (obj.Key) {
        const relativePath = obj.Key.replace(bookPrefix, '');
        console.log(`  📄 ${relativePath}`);
      }
    }
    
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete each object
    console.log('\n🗑️ Deleting files...');
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const obj of objects) {
      if (obj.Key) {
        try {
          process.stdout.write(`  Deleting ${obj.Key}...`);
          await R2Service.deleteContent(obj.Key);
          console.log(' ✅');
          deletedCount++;
        } catch (error) {
          console.log(' ❌');
          console.error(`    Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedCount++;
        }
      }
    }
    
    console.log(`\n✅ Deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
    
  } catch (error) {
    console.error('❌ Error deleting book:', error);
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    if (command === 'check') {
      await checkBook(bookId);
    } else if (command === 'delete') {
      await deleteBook(bookId);
    } else {
      console.error('Invalid command. Use "check" or "delete"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();