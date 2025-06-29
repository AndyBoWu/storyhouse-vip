#!/usr/bin/env -S npx tsx
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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

async function findBobsBooks(): Promise<void> {
  console.log("🔍 Searching for Bob's derivative book issue...");
  console.log('---\n');
  
  // Search for books that might be Bob's
  const searchTerms = ['bob', 'Bob', 'BOB'];
  const foundBooks: Array<{bookId: string, metadata: BookMetadata}> = [];
  
  // List all author folders
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'books/',
    Delimiter: '/',
  });
  
  const authorsResponse = await r2Client.send(listCommand);
  
  if (!authorsResponse.CommonPrefixes) {
    console.log('No books found');
    return;
  }
  
  // Search through all books
  for (const authorPrefix of authorsResponse.CommonPrefixes) {
    if (!authorPrefix.Prefix) continue;
    
    const booksCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: authorPrefix.Prefix,
      Delimiter: '/',
    });
    
    const booksResponse = await r2Client.send(booksCommand);
    
    if (!booksResponse.CommonPrefixes) continue;
    
    for (const bookPrefix of booksResponse.CommonPrefixes) {
      if (!bookPrefix.Prefix) continue;
      
      const metadataKey = `${bookPrefix.Prefix}metadata.json`;
      const metadata = await getObjectAsJson<BookMetadata>(metadataKey);
      
      if (!metadata) continue;
      
      // Check if this might be Bob's book
      const isRelevant = searchTerms.some(term => 
        metadata.title?.toLowerCase().includes(term.toLowerCase()) ||
        metadata.author?.toLowerCase().includes(term.toLowerCase()) ||
        metadata.authorName?.toLowerCase().includes(term.toLowerCase()) ||
        metadata.description?.toLowerCase().includes(term.toLowerCase())
      );
      
      if (isRelevant || metadata.parentBook) {
        foundBooks.push({
          bookId: metadata.bookId,
          metadata
        });
      }
    }
  }
  
  // Analyze found books
  console.log(`📚 Found ${foundBooks.length} potentially relevant books\n`);
  
  for (const {bookId, metadata} of foundBooks) {
    console.log(`\n📖 Book: ${metadata.title}`);
    console.log(`   ID: ${bookId}`);
    console.log(`   Author: ${metadata.authorName || metadata.author}`);
    console.log(`   Type: ${metadata.parentBook ? 'DERIVATIVE' : 'ORIGINAL'}`);
    
    if (metadata.parentBook) {
      console.log(`   Parent Book: ${metadata.parentBook}`);
      console.log(`   Parent Chapters: ${metadata.parentChapters || 'Not specified'}`);
    }
    
    console.log(`   Total Chapters: ${metadata.totalChapters}`);
    console.log(`   Chapter Map:`, Object.keys(metadata.chapterMap).sort());
    
    // Check for the specific issue - derivative book limited to 3 chapters
    if (metadata.parentBook && metadata.totalChapters <= 3) {
      console.log('\n   ⚠️  ISSUE DETECTED: Derivative book limited to parent\'s chapter count!');
      console.log('   This prevents adding new chapters beyond the inherited ones.');
      
      // Check if there are attempts to write chapter 4+
      const actualChapters = Object.keys(metadata.chapterMap);
      const hasChapter4Plus = actualChapters.some(ch => {
        const num = parseInt(ch.replace('ch', ''));
        return num > 3;
      });
      
      if (!hasChapter4Plus) {
        console.log('   ❌ No chapters beyond 3 found - author is blocked from continuing!');
      }
    }
    
    // List actual chapter files
    console.log('\n   📄 Actual chapter files:');
    const chaptersPrefix = `books/${bookId}/chapters/`;
    const chaptersCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: chaptersPrefix,
    });
    
    const chaptersResponse = await r2Client.send(chaptersCommand);
    if (chaptersResponse.Contents) {
      const chapterFiles = chaptersResponse.Contents
        .map(obj => obj.Key?.replace(chaptersPrefix, ''))
        .filter(Boolean);
      
      chapterFiles.forEach(file => console.log(`      - ${file}`));
    }
  }
  
  // Summary
  console.log('\n\n📊 Analysis Summary:');
  console.log('---');
  
  const derivativeBooks = foundBooks.filter(b => b.metadata.parentBook);
  const problematicBooks = derivativeBooks.filter(b => 
    b.metadata.totalChapters <= (b.metadata.parentChapters || 3)
  );
  
  console.log(`Total books found: ${foundBooks.length}`);
  console.log(`Derivative books: ${derivativeBooks.length}`);
  console.log(`Problematic derivative books: ${problematicBooks.length}`);
  
  if (problematicBooks.length > 0) {
    console.log('\n🚨 Books that need migration:');
    problematicBooks.forEach(({bookId, metadata}) => {
      console.log(`   - ${metadata.title} (${bookId})`);
      console.log(`     Limited to ${metadata.totalChapters} chapters, blocking new content`);
    });
    
    console.log('\n💡 Solution: Run the migration script to merge derivative chapters into parent books');
    console.log('   Command: npm run script migrate-derivative-books.ts --execute');
  }
}

// Run the analysis
findBobsBooks().catch(error => {
  console.error('Fatal error during analysis:', error);
  process.exit(1);
});