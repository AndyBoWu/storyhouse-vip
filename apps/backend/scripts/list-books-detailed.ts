#!/usr/bin/env -S npx tsx
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';

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
    return null;
  }
}

async function listBooksDetailed() {
  console.log('📚 Detailed Book Listing');
  console.log('========================\n');
  
  // List all author folders
  const authorsCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'books/',
    Delimiter: '/',
  });
  
  const authorsResponse = await r2Client.send(authorsCommand);
  
  if (!authorsResponse.CommonPrefixes) {
    console.log('No authors found');
    return;
  }
  
  let totalBooks = 0;
  let derivativeBooks = 0;
  
  // Iterate through each author
  for (const authorPrefix of authorsResponse.CommonPrefixes) {
    if (!authorPrefix.Prefix) continue;
    
    const author = authorPrefix.Prefix.replace('books/', '').replace('/', '');
    console.log(`\n👤 Author: ${author}`);
    console.log('─'.repeat(50));
    
    // List books for this author
    const booksCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: authorPrefix.Prefix,
      Delimiter: '/',
    });
    
    const booksResponse = await r2Client.send(booksCommand);
    
    if (!booksResponse.CommonPrefixes) {
      console.log('  No books found for this author');
      continue;
    }
    
    // Check each book
    for (const bookPrefix of booksResponse.CommonPrefixes) {
      if (!bookPrefix.Prefix) continue;
      
      const bookPath = bookPrefix.Prefix;
      const bookSlug = bookPath.replace(authorPrefix.Prefix, '').replace('/', '');
      totalBooks++;
      
      console.log(`\n  📖 Book: ${bookSlug}`);
      console.log(`     Path: ${bookPath}`);
      
      // Try to read metadata
      const metadataKey = `${bookPath}metadata.json`;
      const metadataText = await getObjectAsText(metadataKey);
      
      if (metadataText) {
        try {
          const metadata = JSON.parse(metadataText);
          console.log(`     Title: ${metadata.title || 'Untitled'}`);
          console.log(`     ID: ${metadata.bookId || 'No ID'}`);
          
          if (metadata.parentBook) {
            derivativeBooks++;
            console.log(`     ⚠️  TYPE: DERIVATIVE BOOK`);
            console.log(`     Parent: ${metadata.parentBook}`);
            console.log(`     Parent Chapters: ${metadata.parentChapters || 'Not specified'}`);
          } else {
            console.log(`     Type: Original Book`);
          }
          
          console.log(`     Total Chapters: ${metadata.totalChapters || 0}`);
          console.log(`     Chapter Map: ${Object.keys(metadata.chapterMap || {}).join(', ')}`);
          
          if (metadata.ipAssetId) {
            console.log(`     IP Asset: ${metadata.ipAssetId}`);
          }
          
          // Check for potential issues
          if (metadata.parentBook && metadata.totalChapters <= 3) {
            console.log(`     ❌ ISSUE: Derivative limited to ${metadata.totalChapters} chapters!`);
          }
          
        } catch (error) {
          console.log(`     ⚠️  Error parsing metadata: ${error}`);
        }
      } else {
        console.log(`     ⚠️  No metadata.json found`);
        
        // List actual files in the book directory
        const filesCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: bookPath,
          MaxKeys: 10,
        });
        
        const filesResponse = await r2Client.send(filesCommand);
        if (filesResponse.Contents && filesResponse.Contents.length > 0) {
          console.log(`     Files found:`);
          filesResponse.Contents.forEach(file => {
            if (file.Key) {
              console.log(`       - ${file.Key.replace(bookPath, '')}`);
            }
          });
        }
      }
    }
  }
  
  console.log('\n\n📊 Summary');
  console.log('─'.repeat(30));
  console.log(`Total books: ${totalBooks}`);
  console.log(`Derivative books: ${derivativeBooks}`);
  console.log(`Original books: ${totalBooks - derivativeBooks}`);
  
  if (derivativeBooks > 0) {
    console.log('\n⚠️  Derivative books found that need migration!');
    console.log('Run: npx tsx scripts/migrate-derivative-books.ts --execute');
  } else {
    console.log('\n✅ No derivative books found - migration may not be needed');
  }
}

// Run the listing
listBooksDetailed().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});