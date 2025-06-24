#!/usr/bin/env tsx
/**
 * Clean R2 Bucket Script
 * 
 * This script removes all contents from the R2 bucket for a fresh start.
 * It includes safety confirmations to prevent accidental deletion.
 * 
 * Usage: pnpm tsx scripts/clean-r2-bucket.ts
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as readline from 'readline';
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
  console.log('🗑️  R2 Bucket Cleanup Tool');
  console.log('========================');
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log();

  try {
    // List all objects
    console.log('📋 Listing all objects...');
    const allKeys = await listAllObjects();
    
    if (allKeys.length === 0) {
      console.log('✨ Bucket is already empty!');
      rl.close();
      return;
    }

    console.log(`\n📊 Found ${allKeys.length} objects to delete`);
    console.log('\n🔍 Sample of objects to be deleted:');
    
    // Show first 10 and last 5 objects
    const sampleSize = Math.min(15, allKeys.length);
    for (let i = 0; i < Math.min(10, allKeys.length); i++) {
      console.log(`   - ${allKeys[i]}`);
    }
    if (allKeys.length > 15) {
      console.log(`   ... and ${allKeys.length - 15} more objects ...`);
      for (let i = allKeys.length - 5; i < allKeys.length; i++) {
        console.log(`   - ${allKeys[i]}`);
      }
    } else if (allKeys.length > 10) {
      for (let i = 10; i < allKeys.length; i++) {
        console.log(`   - ${allKeys[i]}`);
      }
    }

    // First confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL objects in the bucket!');
    const confirm1 = await prompt('Are you sure you want to continue? (yes/no): ');
    
    if (confirm1.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      return;
    }

    // Second confirmation with bucket name
    const confirm2 = await prompt(`\nPlease type the bucket name "${BUCKET_NAME}" to confirm deletion: `);
    
    if (confirm2 !== BUCKET_NAME) {
      console.log('❌ Bucket name does not match. Operation cancelled.');
      rl.close();
      return;
    }

    // Final confirmation
    const confirm3 = await prompt('\nThis is your FINAL confirmation. Delete all objects? (DELETE/cancel): ');
    
    if (confirm3 !== 'DELETE') {
      console.log('❌ Operation cancelled.');
      rl.close();
      return;
    }

    // Perform deletion
    console.log('\n🔄 Starting deletion process...');
    const startTime = Date.now();
    
    await deleteObjects(allKeys);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Successfully deleted ${allKeys.length} objects in ${duration.toFixed(2)} seconds`);
    console.log('🎉 Bucket is now empty and ready for a fresh start!');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    rl.close();
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