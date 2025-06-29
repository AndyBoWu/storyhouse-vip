#!/usr/bin/env -S npx tsx
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storyhouse-content';

interface MigrationResult {
  storyId: string;
  success: boolean;
  newPath?: string;
  error?: string;
}

async function getObjectAsText(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await r2Client.send(command);
    if (!response.Body) return null;
    
    return await response.Body.transformToString();
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

async function migrateStory(storyId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    storyId,
    success: false,
  };

  try {
    console.log(`\n📚 Migrating story: ${storyId}`);
    
    // Read the story metadata
    const metadataKey = `stories/${storyId}/metadata.json`;
    const metadataContent = await getObjectAsText(metadataKey);
    
    if (!metadataContent) {
      throw new Error('Could not read story metadata');
    }
    
    const metadata = JSON.parse(metadataContent);
    
    // Extract necessary information
    const authorAddress = metadata.authorAddress?.toLowerCase() || 'unknown';
    const slug = metadata.slug || storyId;
    
    console.log(`  Author: ${authorAddress}`);
    console.log(`  Slug: ${slug}`);
    
    // Create new path structure
    const newBasePath = `books/${authorAddress}/${slug}`;
    result.newPath = newBasePath;
    
    // Copy metadata to new location
    await r2Client.send(new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${metadataKey}`,
      Key: `${newBasePath}/metadata.json`,
    }));
    
    // List all chapters in the story
    const chaptersPrefix = `stories/${storyId}/chapters/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: chaptersPrefix,
    });
    
    const chaptersResponse = await r2Client.send(listCommand);
    
    if (chaptersResponse.Contents) {
      for (const obj of chaptersResponse.Contents) {
        if (!obj.Key) continue;
        
        // Extract chapter number from filename (e.g., "1.json" -> "1")
        const filename = obj.Key.split('/').pop();
        if (!filename) continue;
        
        const chapterNum = filename.replace('.json', '');
        
        // Read chapter content
        const chapterContent = await getObjectAsText(obj.Key);
        if (!chapterContent) {
          console.warn(`  ⚠️  Could not read chapter ${chapterNum}`);
          continue;
        }
        
        const chapterData = JSON.parse(chapterContent);
        
        // Create new chapter structure
        const newChapterPath = `${newBasePath}/chapters/ch${chapterNum}`;
        
        // Save content.json
        await r2Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${newChapterPath}/content.json`,
          Body: JSON.stringify({
            content: chapterData.content || chapterData.text || '',
            wordCount: chapterData.wordCount || 0,
            timestamp: chapterData.timestamp || new Date().toISOString(),
          }, null, 2),
          ContentType: 'application/json',
        }));
        
        // Save metadata.json
        await r2Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${newChapterPath}/metadata.json`,
          Body: JSON.stringify({
            title: chapterData.title || `Chapter ${chapterNum}`,
            number: parseInt(chapterNum),
            authorAddress: chapterData.authorAddress || authorAddress,
            publishedAt: chapterData.publishedAt || chapterData.timestamp,
            ipAssetId: chapterData.ipAssetId,
            license: chapterData.license || 'free',
          }, null, 2),
          ContentType: 'application/json',
        }));
        
        console.log(`  ✅ Migrated chapter ${chapterNum}`);
      }
    }
    
    // Copy cover image if it exists
    const oldCoverKey = `stories/${storyId}/cover.jpg`;
    try {
      await r2Client.send(new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${oldCoverKey}`,
        Key: `${newBasePath}/cover.jpg`,
      }));
      console.log(`  ✅ Migrated cover image`);
    } catch (error) {
      // Cover might not exist, which is fine
      console.log(`  ℹ️  No cover image found`);
    }
    
    result.success = true;
    console.log(`  ✅ Story migration complete: ${newBasePath}`);
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Migration failed: ${result.error}`);
  }
  
  return result;
}

async function cleanupLegacyStory(storyId: string, dryRun: boolean = true): Promise<void> {
  console.log(`\n🗑️  Cleaning up legacy story: ${storyId} ${dryRun ? '(DRY RUN)' : ''}`);
  
  const prefix = `stories/${storyId}/`;
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
    console.log(`  Would delete ${objectsToDelete.length} files:`);
    objectsToDelete.forEach(obj => console.log(`    - ${obj.Key}`));
  } else {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });
    
    await r2Client.send(deleteCommand);
    console.log(`  ✅ Deleted ${objectsToDelete.length} files`);
  }
}

async function main() {
  console.log('🚀 Starting legacy stories migration...');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log('---');
  
  // List all stories in the legacy folder
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'stories/',
    Delimiter: '/',
  });
  
  const response = await r2Client.send(listCommand);
  
  if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
    console.log('No legacy stories found to migrate');
    return;
  }
  
  const storyIds = response.CommonPrefixes
    .map(prefix => prefix.Prefix?.replace('stories/', '').replace('/', ''))
    .filter(Boolean) as string[];
  
  console.log(`Found ${storyIds.length} legacy stories to migrate`);
  
  // Migrate each story
  const results: MigrationResult[] = [];
  
  for (const storyId of storyIds) {
    const result = await migrateStory(storyId);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Migration Summary:');
  console.log('---');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully migrated: ${successful.length}`);
  console.log(`❌ Failed migrations: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed stories:');
    failed.forEach(r => console.log(`  - ${r.storyId}: ${r.error}`));
  }
  
  // Ask about cleanup
  if (successful.length > 0) {
    console.log('\n🧹 Cleanup Phase:');
    console.log('To clean up migrated legacy stories, run with --cleanup flag');
    
    const isCleanup = process.argv.includes('--cleanup');
    const isDryRun = !process.argv.includes('--force');
    
    if (isCleanup) {
      for (const result of successful) {
        await cleanupLegacyStory(result.storyId, isDryRun);
      }
      
      if (isDryRun) {
        console.log('\n💡 To actually delete files, run with --cleanup --force');
      }
    }
  }
  
  console.log('\n✅ Migration process complete!');
}

// Run the migration
main().catch(error => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
});