#!/usr/bin/env -S npx tsx
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT!}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storyhouse-content';
const MAX_AGE_HOURS = 24; // Clean up files older than 24 hours

interface CleanupResult {
  folder: string;
  deletedCount: number;
  errors: string[];
}

async function cleanupFolder(prefix: string): Promise<CleanupResult> {
  const result: CleanupResult = {
    folder: prefix,
    deletedCount: 0,
    errors: [],
  };

  try {
    // List all objects in the folder
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await r2Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log(`No files found in ${prefix}`);
      return result;
    }

    // Filter objects older than MAX_AGE_HOURS
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (MAX_AGE_HOURS * 60 * 60 * 1000));
    
    const objectsToDelete = response.Contents
      .filter(obj => {
        if (!obj.LastModified) return false;
        return obj.LastModified < cutoffTime;
      })
      .map(obj => ({ Key: obj.Key! }));

    if (objectsToDelete.length === 0) {
      console.log(`No old files to delete in ${prefix}`);
      return result;
    }

    // Delete old objects
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });

    await r2Client.send(deleteCommand);
    result.deletedCount = objectsToDelete.length;
    
    console.log(`Deleted ${result.deletedCount} old files from ${prefix}`);
    
  } catch (error) {
    const errorMsg = `Error cleaning up ${prefix}: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}

async function main() {
  console.log('🧹 Starting R2 temporary files cleanup...');
  console.log(`Cleaning files older than ${MAX_AGE_HOURS} hours`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log('---');

  // Clean up temporary folders
  const foldersToClean = ['covers/', 'metadata/'];
  const results: CleanupResult[] = [];

  for (const folder of foldersToClean) {
    const result = await cleanupFolder(folder);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log('---');
  
  let totalDeleted = 0;
  let totalErrors = 0;
  
  for (const result of results) {
    console.log(`${result.folder}: ${result.deletedCount} files deleted`);
    totalDeleted += result.deletedCount;
    totalErrors += result.errors.length;
    
    if (result.errors.length > 0) {
      result.errors.forEach(err => console.error(`  ❌ ${err}`));
    }
  }
  
  console.log('---');
  console.log(`Total files deleted: ${totalDeleted}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('\n✅ Cleanup complete!');
}

// Run the cleanup
main().catch(error => {
  console.error('Fatal error during cleanup:', error);
  process.exit(1);
});