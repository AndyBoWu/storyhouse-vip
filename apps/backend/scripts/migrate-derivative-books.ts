#!/usr/bin/env -S npx tsx
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { BookMetadata } from '../lib/types/book';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

// Clean the endpoint to handle cases where it might not have https://
const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${cleanEndpoint}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storyhouse-content';

interface DerivativeBook {
  bookId: string;
  parentBookId: string;
  title: string;
  author: string;
  chapterMap: Record<string, string>;
  derivativeChapters: string[]; // Chapters actually written by derivative author
  createdAt: string;
}

interface MigrationPlan {
  parentBookId: string;
  derivatives: DerivativeBook[];
  conflictingChapters: Record<string, string[]>; // chapter -> [bookIds with this chapter]
}

interface MigrationResult {
  bookId: string;
  parentBookId: string;
  success: boolean;
  migratedChapters: string[];
  error?: string;
}

async function getObjectAsJson<T = any>(key: string): Promise<T | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await r2Client.send(command);
    if (!response.Body) return null;
    
    const text = await response.Body.transformToString();
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

async function saveBackup(data: any, backupPath: string): Promise<void> {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: backupPath,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  }));
}

async function findAllDerivativeBooks(): Promise<DerivativeBook[]> {
  console.log('🔍 Scanning for derivative books...');
  
  const derivatives: DerivativeBook[] = [];
  
  // List all book folders
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'books/',
    Delimiter: '/',
  });
  
  const authorsResponse = await r2Client.send(listCommand);
  
  if (!authorsResponse.CommonPrefixes) {
    console.log('No books found');
    return derivatives;
  }
  
  // Iterate through each author folder
  for (const authorPrefix of authorsResponse.CommonPrefixes) {
    if (!authorPrefix.Prefix) continue;
    
    // List books for this author
    const booksCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: authorPrefix.Prefix,
      Delimiter: '/',
    });
    
    const booksResponse = await r2Client.send(booksCommand);
    
    if (!booksResponse.CommonPrefixes) continue;
    
    // Check each book
    for (const bookPrefix of booksResponse.CommonPrefixes) {
      if (!bookPrefix.Prefix) continue;
      
      // Read metadata
      const metadataKey = `${bookPrefix.Prefix}metadata.json`;
      const metadata = await getObjectAsJson<BookMetadata>(metadataKey);
      
      if (!metadata) continue;
      
      // Check if it's a derivative book
      if (metadata.parentBook) {
        console.log(`  Found derivative: ${metadata.bookId} (parent: ${metadata.parentBook})`);
        
        // Identify which chapters are actually new (not inherited)
        const derivativeChapters: string[] = [];
        const inheritedChapters = metadata.parentChapters || 3; // Usually chapters 1-3
        
        for (const [chapterKey, chapterPath] of Object.entries(metadata.chapterMap)) {
          const chapterNum = parseInt(chapterKey.replace('ch', ''));
          if (chapterNum > inheritedChapters) {
            derivativeChapters.push(chapterKey);
          }
        }
        
        derivatives.push({
          bookId: metadata.bookId,
          parentBookId: metadata.parentBook,
          title: metadata.title,
          author: metadata.author,
          chapterMap: metadata.chapterMap,
          derivativeChapters,
          createdAt: metadata.createdAt,
        });
      }
    }
  }
  
  console.log(`\n✅ Found ${derivatives.length} derivative books`);
  return derivatives;
}

async function createMigrationPlans(derivatives: DerivativeBook[]): Promise<MigrationPlan[]> {
  console.log('\n📋 Creating migration plans...');
  
  // Group derivatives by parent book
  const planMap = new Map<string, MigrationPlan>();
  
  for (const derivative of derivatives) {
    let plan = planMap.get(derivative.parentBookId);
    
    if (!plan) {
      plan = {
        parentBookId: derivative.parentBookId,
        derivatives: [],
        conflictingChapters: {},
      };
      planMap.set(derivative.parentBookId, plan);
    }
    
    plan.derivatives.push(derivative);
    
    // Check for chapter conflicts
    for (const chapter of derivative.derivativeChapters) {
      if (!plan.conflictingChapters[chapter]) {
        plan.conflictingChapters[chapter] = [];
      }
      plan.conflictingChapters[chapter].push(derivative.bookId);
    }
  }
  
  const plans = Array.from(planMap.values());
  
  // Report conflicts
  for (const plan of plans) {
    console.log(`\n📖 Parent book: ${plan.parentBookId}`);
    console.log(`   Derivatives: ${plan.derivatives.length}`);
    
    const conflicts = Object.entries(plan.conflictingChapters)
      .filter(([_, bookIds]) => bookIds.length > 1);
    
    if (conflicts.length > 0) {
      console.log('   ⚠️  Chapter conflicts detected:');
      for (const [chapter, bookIds] of conflicts) {
        console.log(`      ${chapter}: ${bookIds.length} derivatives`);
      }
    }
  }
  
  return plans;
}

async function migrateDerivativeBook(
  derivative: DerivativeBook,
  parentBookId: string,
  conflictResolution: Record<string, string[]>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    bookId: derivative.bookId,
    parentBookId,
    success: false,
    migratedChapters: [],
  };
  
  try {
    console.log(`\n🔄 Migrating derivative: ${derivative.bookId}`);
    
    // Load parent book metadata
    const parentParts = parentBookId.split('/');
    const parentMetadataKey = `books/${parentBookId}/metadata.json`;
    const parentMetadata = await getObjectAsJson<BookMetadata>(parentMetadataKey);
    
    if (!parentMetadata) {
      throw new Error(`Parent book metadata not found: ${parentBookId}`);
    }
    
    // Create backup
    const backupKey = `backups/migration/${Date.now()}/books/${derivative.bookId}/metadata.json`;
    await saveBackup(parentMetadata, backupKey);
    console.log(`  📦 Backup saved: ${backupKey}`);
    
    // Migrate each derivative chapter
    for (const chapterKey of derivative.derivativeChapters) {
      const chapterNum = parseInt(chapterKey.replace('ch', ''));
      
      // Determine new chapter key based on conflicts
      let newChapterKey = chapterKey;
      const conflicts = conflictResolution[chapterKey];
      
      if (conflicts && conflicts.length > 1) {
        // Multiple derivatives wrote this chapter - use author suffix
        const derivativeAuthor = derivative.author.toLowerCase();
        const authorSuffix = derivativeAuthor.slice(-6); // Last 6 chars of address
        newChapterKey = `${chapterKey}-${authorSuffix}`;
        console.log(`  ⚡ Resolving conflict: ${chapterKey} → ${newChapterKey}`);
      }
      
      // Copy chapter content
      const oldChapterPath = derivative.chapterMap[chapterKey];
      const newChapterPath = `books/${parentBookId}/chapters/${newChapterKey}/content.json`;
      
      await r2Client.send(new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${oldChapterPath}`,
        Key: newChapterPath,
      }));
      
      // Update parent book's chapter map
      parentMetadata.chapterMap[newChapterKey] = newChapterPath;
      
      console.log(`  ✅ Migrated chapter: ${chapterKey} → ${newChapterKey}`);
      result.migratedChapters.push(newChapterKey);
    }
    
    // Update parent book metadata
    parentMetadata.totalChapters = Object.keys(parentMetadata.chapterMap).length;
    parentMetadata.updatedAt = new Date().toISOString();
    
    // Add migration note
    if (!parentMetadata.notes) parentMetadata.notes = [];
    parentMetadata.notes.push({
      date: new Date().toISOString(),
      note: `Migrated ${result.migratedChapters.length} chapters from derivative book ${derivative.bookId}`,
    });
    
    // Save updated parent metadata
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: parentMetadataKey,
      Body: JSON.stringify(parentMetadata, null, 2),
      ContentType: 'application/json',
    }));
    
    console.log(`  ✅ Updated parent book metadata`);
    result.success = true;
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Migration failed: ${result.error}`);
  }
  
  return result;
}

async function deleteDerivativeBook(bookId: string, dryRun: boolean = true): Promise<void> {
  console.log(`\n🗑️  Cleaning up derivative book: ${bookId} ${dryRun ? '(DRY RUN)' : ''}`);
  
  const prefix = `books/${bookId}/`;
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });
  
  const response = await r2Client.send(listCommand);
  
  if (!response.Contents || response.Contents.length === 0) {
    console.log('  No files to clean up');
    return;
  }
  
  const objectsToDelete = response.Contents
    .filter(obj => obj.Key)
    .map(obj => ({ Key: obj.Key! }));
  
  if (dryRun) {
    console.log(`  Would delete ${objectsToDelete.length} files`);
  } else {
    // Delete in batches (S3 allows max 1000 per request)
    const batchSize = 1000;
    for (let i = 0; i < objectsToDelete.length; i += batchSize) {
      const batch = objectsToDelete.slice(i, i + batchSize);
      
      await r2Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: batch,
          Quiet: true,
        },
      }));
    }
    
    console.log(`  ✅ Deleted ${objectsToDelete.length} files`);
  }
}

async function main() {
  console.log('🚀 Starting derivative books migration...');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log('Mode:', process.argv.includes('--execute') ? 'EXECUTE' : 'DRY RUN');
  console.log('---');
  
  const isDryRun = !process.argv.includes('--execute');
  const cleanup = process.argv.includes('--cleanup');
  
  // Step 1: Find all derivative books
  const derivatives = await findAllDerivativeBooks();
  
  if (derivatives.length === 0) {
    console.log('No derivative books found to migrate');
    return;
  }
  
  // Step 2: Create migration plans
  const plans = await createMigrationPlans(derivatives);
  
  // Step 3: Execute migrations
  const results: MigrationResult[] = [];
  
  for (const plan of plans) {
    console.log(`\n📚 Processing parent book: ${plan.parentBookId}`);
    
    for (const derivative of plan.derivatives) {
      if (isDryRun) {
        console.log(`\n[DRY RUN] Would migrate: ${derivative.bookId}`);
        console.log(`  Chapters to migrate: ${derivative.derivativeChapters.join(', ')}`);
        
        // Check for conflicts
        for (const chapter of derivative.derivativeChapters) {
          const conflicts = plan.conflictingChapters[chapter];
          if (conflicts && conflicts.length > 1) {
            console.log(`  ⚠️  Conflict on ${chapter}: ${conflicts.length} derivatives`);
          }
        }
      } else {
        const result = await migrateDerivativeBook(
          derivative,
          plan.parentBookId,
          plan.conflictingChapters
        );
        results.push(result);
      }
    }
  }
  
  // Step 4: Summary
  if (!isDryRun) {
    console.log('\n📊 Migration Summary:');
    console.log('---');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully migrated: ${successful.length}`);
    console.log(`❌ Failed migrations: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\nFailed migrations:');
      failed.forEach(r => console.log(`  - ${r.bookId}: ${r.error}`));
    }
    
    // Step 5: Cleanup (if requested)
    if (cleanup && successful.length > 0) {
      console.log('\n🧹 Cleanup Phase:');
      
      for (const result of successful) {
        await deleteDerivativeBook(result.bookId, false);
      }
    }
  }
  
  console.log('\n✅ Migration process complete!');
  
  if (isDryRun) {
    console.log('\n💡 To execute the migration, run with --execute flag');
    console.log('💡 To also delete derivative books after migration, add --cleanup flag');
  }
}

// Run the migration
main().catch(error => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
});