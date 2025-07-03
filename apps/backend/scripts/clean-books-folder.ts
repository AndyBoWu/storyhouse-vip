#!/usr/bin/env tsx
/**
 * Clean Books Folder Script
 * 
 * This script removes all contents from the books/ folder in the R2 bucket.
 * Designed for testing environments to provide a clean slate.
 * 
 * Features:
 * - Interactive mode with confirmations (default)
 * - Force mode for automated workflows (--force)
 * - Dry-run mode to preview what would be deleted (--dry-run)
 * 
 * Usage: 
 *   npm run clean:books            # Interactive mode
 *   npm run clean:books -- --force # Force mode (no prompts)
 *   npm run clean:books -- --dry-run # Preview mode
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForceMode = args.includes('--force');
const isInteractive = !isDryRun && !isForceMode;

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storyhouse-content';
const BOOKS_PREFIX = 'books/';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt user
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// List all objects in books folder
async function listBooksObjects(): Promise<string[]> {
  const allKeys: string[] = [];
  let continuationToken: string | undefined;

  console.log(`📋 Scanning ${BOOKS_PREFIX} folder...`);

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: BOOKS_PREFIX,
      ContinuationToken: continuationToken,
      MaxKeys: 1000
    });

    const response = await r2Client.send(command);
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Key !== BOOKS_PREFIX) { // Exclude the folder itself
          allKeys.push(obj.Key);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allKeys;
}

// Delete objects in batches
async function deleteObjects(keys: string[]): Promise<number> {
  const batchSize = 1000; // R2 supports up to 1000 objects per delete request
  let totalDeleted = 0;
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    
    try {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: false
        }
      });

      const response = await r2Client.send(deleteCommand);
      
      const deletedCount = batch.length - (response.Errors?.length || 0);
      totalDeleted += deletedCount;
      
      console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(keys.length / batchSize)} (${deletedCount} objects)`);
      
      if (response.Errors && response.Errors.length > 0) {
        console.error('❌ Errors during deletion:');
        for (const error of response.Errors) {
          console.error(`   - ${error.Key}: ${error.Message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to delete batch starting at index ${i}:`, error);
      throw error;
    }
  }

  return totalDeleted;
}

// Analyze folder structure
function analyzeFolderStructure(keys: string[]): { bookCount: number, chapterCount: number, otherCount: number } {
  const bookFolders = new Set<string>();
  let chapterCount = 0;
  let otherCount = 0;

  for (const key of keys) {
    const parts = key.replace(BOOKS_PREFIX, '').split('/');
    
    if (parts.length >= 2) {
      // This is likely a book folder (e.g., books/author/book-slug/...)
      const bookPath = `${parts[0]}/${parts[1]}`;
      bookFolders.add(bookPath);
      
      if (key.includes('/chapters/') || key.includes('/ch')) {
        chapterCount++;
      } else {
        otherCount++;
      }
    } else {
      otherCount++;
    }
  }

  return {
    bookCount: bookFolders.size,
    chapterCount,
    otherCount
  };
}

// Main cleanup function
async function cleanBooksFolder() {
  console.log('📚 Books Folder Cleanup Tool');
  console.log('============================');
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`📁 Target: ${BOOKS_PREFIX}`);
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted');
  } else if (isForceMode) {
    console.log('⚡ FORCE MODE - Running without confirmations');
  }
  
  console.log();

  try {
    // List all objects in books folder
    const allKeys = await listBooksObjects();
    
    if (allKeys.length === 0) {
      console.log('✨ Books folder is already empty!');
      if (isInteractive) rl.close();
      return;
    }

    // Analyze the folder structure
    const analysis = analyzeFolderStructure(allKeys);
    
    console.log(`\n📊 Found ${allKeys.length} objects in books folder:`);
    console.log(`   📖 Books: ${analysis.bookCount}`);
    console.log(`   📝 Chapters: ${analysis.chapterCount}`);
    console.log(`   🗂️  Other files: ${analysis.otherCount}`);
    
    // Show sample of objects
    console.log('\n🔍 Sample of objects to be deleted:');
    const sampleSize = Math.min(10, allKeys.length);
    for (let i = 0; i < sampleSize; i++) {
      console.log(`   - ${allKeys[i]}`);
    }
    
    if (allKeys.length > sampleSize) {
      console.log(`   ... and ${allKeys.length - sampleSize} more objects`);
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No objects were deleted');
      console.log(`Would have deleted ${allKeys.length} objects from the books folder.`);
      return;
    }

    // Interactive confirmations
    if (isInteractive) {
      console.log('\n⚠️  WARNING: This will permanently delete ALL books and chapters!');
      console.log('This action cannot be undone and will affect:');
      console.log('- All book metadata');
      console.log('- All chapter content');
      console.log('- All cover images');
      console.log('- All derivative books');
      
      const confirm1 = await prompt('\nAre you sure you want to continue? (yes/no): ');
      
      if (confirm1.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        rl.close();
        return;
      }

      // Second confirmation with specific text
      const confirm2 = await prompt('\nType "DELETE BOOKS" to confirm this destructive action: ');
      
      if (confirm2 !== 'DELETE BOOKS') {
        console.log('❌ Confirmation text does not match. Operation cancelled.');
        rl.close();
        return;
      }
    }

    // Perform deletion
    console.log('\n🔄 Starting deletion process...');
    const startTime = Date.now();
    
    const deletedCount = await deleteObjects(allKeys);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Successfully deleted ${deletedCount} objects in ${duration.toFixed(2)} seconds`);
    console.log('🎉 Books folder is now empty and ready for testing!');

    // Summary
    console.log('\n📈 Cleanup Summary:');
    console.log(`   Total objects processed: ${allKeys.length}`);
    console.log(`   Successfully deleted: ${deletedCount}`);
    console.log(`   Errors: ${allKeys.length - deletedCount}`);
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    if (isInteractive) rl.close();
  }
}

// Validation
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error('❌ Missing required environment variables: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
  console.error('Please ensure your .env.local file contains these variables.');
  process.exit(1);
}

// Run the cleanup
console.log('🚀 Starting Books Folder Cleanup...\n');
cleanBooksFolder().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});