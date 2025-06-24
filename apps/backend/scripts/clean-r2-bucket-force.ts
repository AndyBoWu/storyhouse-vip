#!/usr/bin/env tsx
/**
 * Force Clean R2 Bucket Script
 * 
 * This script removes all contents from the R2 bucket WITHOUT confirmations.
 * USE WITH EXTREME CAUTION!
 * 
 * Usage: pnpm tsx scripts/clean-r2-bucket-force.ts
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

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

// List all objects in bucket
async function listAllObjects(): Promise<string[]> {
  const allKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
      MaxKeys: 1000
    });

    const response = await r2Client.send(command);
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          allKeys.push(obj.Key);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allKeys;
}

// Delete objects in batches
async function deleteObjects(keys: string[]): Promise<void> {
  const batchSize = 1000; // R2 supports up to 1000 objects per delete request
  
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
      
      console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(keys.length / batchSize)}`);
      
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
}

// Main cleanup function
async function cleanBucket() {
  console.log('🗑️  R2 Bucket Force Cleanup Tool');
  console.log('================================');
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log('⚠️  WARNING: Running WITHOUT confirmations!');
  console.log();

  try {
    // List all objects
    console.log('📋 Listing all objects...');
    const allKeys = await listAllObjects();
    
    if (allKeys.length === 0) {
      console.log('✨ Bucket is already empty!');
      return;
    }

    console.log(`\n📊 Found ${allKeys.length} objects to delete`);
    
    // Perform deletion immediately
    console.log('\n🔄 Starting deletion process...');
    const startTime = Date.now();
    
    await deleteObjects(allKeys);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Successfully deleted ${allKeys.length} objects in ${duration.toFixed(2)} seconds`);
    console.log('🎉 Bucket is now empty and ready for a fresh start!');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error('❌ Missing required environment variables: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
  console.error('Please ensure your .env.local file contains these variables.');
  process.exit(1);
}

// Run the cleanup
cleanBucket().catch(console.error);