#!/usr/bin/env -S npx tsx
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!.startsWith('http') 
    ? process.env.R2_ENDPOINT! 
    : `https://${process.env.R2_ENDPOINT!}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storyhouse-content';

// Common test data patterns
const TEST_PATTERNS = {
  addresses: [
    '0x0000000000000000000000000000000000000000',
    '0x1234567890123456789012345678901234567890',
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    '0xtestaddress',
    'testauthor',
    'test-author',
    'demo-author',
    'sample-author',
  ],
  slugs: [
    'test-book',
    'test-story',
    'demo-book',
    'demo-story',
    'sample-book',
    'sample-story',
    'example-book',
    'testing-',
    'temp-',
    'tmp-',
    'draft-',
    'untitled-',
  ],
  content: [
    'Lorem ipsum',
    'Test content',
    'This is a test',
    'Hello world',
    'Sample text',
    'Demo content',
  ]
};

interface CleanupOptions {
  dryRun: boolean;
  interactive: boolean;
  force: boolean;
  prefix?: string;
  pattern?: string;
  olderThanDays?: number;
  smallerThanKB?: number;
}

class TestDataCleaner {
  private rl?: readline.Interface;
  private deletedCount = 0;
  private skippedCount = 0;
  private errorCount = 0;

  constructor(private options: CleanupOptions) {
    if (options.interactive) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
  }

  async clean(): Promise<void> {
    console.log('🧹 Starting test data cleanup...');
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('---\n');

    try {
      // Clean by patterns
      await this.cleanByPatterns();
      
      // Clean by age if specified
      if (this.options.olderThanDays) {
        await this.cleanByAge();
      }
      
      // Clean by size if specified
      if (this.options.smallerThanKB) {
        await this.cleanBySize();
      }
      
      // Clean specific prefix if specified
      if (this.options.prefix) {
        await this.cleanByPrefix(this.options.prefix);
      }

      this.printSummary();
    } finally {
      if (this.rl) {
        this.rl.close();
      }
    }
  }

  private async cleanByPatterns(): Promise<void> {
    console.log('🔍 Searching for test data by patterns...\n');

    // Check books folder for test authors
    for (const address of TEST_PATTERNS.addresses) {
      const prefix = `books/${address.toLowerCase()}/`;
      await this.processPrefix(prefix, 'Test author address');
    }

    // Check for test book slugs
    const booksResult = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      Delimiter: '/'
    }));

    if (booksResult.CommonPrefixes) {
      for (const prefix of booksResult.CommonPrefixes) {
        if (!prefix.Prefix) continue;
        
        // Check if this is a test book based on slug patterns
        for (const pattern of TEST_PATTERNS.slugs) {
          if (prefix.Prefix.includes(pattern)) {
            await this.processPrefix(prefix.Prefix, `Test slug pattern: ${pattern}`);
          }
        }
      }
    }

    // Check temporary folders
    await this.processPrefix('temp/', 'Temporary folder');
    await this.processPrefix('tmp/', 'Temporary folder');
    await this.processPrefix('test/', 'Test folder');
    await this.processPrefix('demo/', 'Demo folder');
  }

  private async cleanByAge(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.olderThanDays!);
    
    console.log(`\n🕒 Searching for files older than ${this.options.olderThanDays} days...\n`);

    const result = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: this.options.prefix || ''
    }));

    if (!result.Contents) return;

    const oldFiles = result.Contents.filter(obj => 
      obj.LastModified && obj.LastModified < cutoffDate
    );

    for (const obj of oldFiles) {
      if (!obj.Key) continue;
      await this.processObject(obj.Key, `Older than ${this.options.olderThanDays} days`);
    }
  }

  private async cleanBySize(): Promise<void> {
    const maxSizeBytes = this.options.smallerThanKB! * 1024;
    
    console.log(`\n📏 Searching for files smaller than ${this.options.smallerThanKB}KB...\n`);

    const result = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: this.options.prefix || ''
    }));

    if (!result.Contents) return;

    const smallFiles = result.Contents.filter(obj => 
      obj.Size !== undefined && obj.Size < maxSizeBytes
    );

    for (const obj of smallFiles) {
      if (!obj.Key) continue;
      
      // Check if it's likely test data by examining content
      const isTestData = await this.checkIfTestContent(obj.Key);
      if (isTestData) {
        await this.processObject(obj.Key, `Small file (${(obj.Size! / 1024).toFixed(2)}KB) with test content`);
      }
    }
  }

  private async cleanByPrefix(prefix: string): Promise<void> {
    console.log(`\n📁 Cleaning all files under: ${prefix}\n`);
    await this.processPrefix(prefix, 'Manual prefix selection');
  }

  private async processPrefix(prefix: string, reason: string): Promise<void> {
    const result = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    }));

    if (!result.Contents || result.Contents.length === 0) {
      return;
    }

    console.log(`\n📦 Found ${result.Contents.length} objects in ${prefix}`);
    console.log(`   Reason: ${reason}`);

    if (this.options.interactive && !this.options.force) {
      const answer = await this.askUser(`Delete all ${result.Contents.length} files in ${prefix}?`);
      if (!answer) {
        console.log('   ⏭️  Skipped');
        this.skippedCount += result.Contents.length;
        return;
      }
    }

    // Delete in batches
    const batchSize = 100;
    for (let i = 0; i < result.Contents.length; i += batchSize) {
      const batch = result.Contents.slice(i, i + batchSize);
      await this.deleteBatch(
        batch.filter(obj => obj.Key).map(obj => obj.Key!),
        reason
      );
    }
  }

  private async processObject(key: string, reason: string): Promise<void> {
    console.log(`\n📄 ${key}`);
    console.log(`   Reason: ${reason}`);

    if (this.options.interactive && !this.options.force) {
      const answer = await this.askUser(`Delete this file?`);
      if (!answer) {
        console.log('   ⏭️  Skipped');
        this.skippedCount++;
        return;
      }
    }

    await this.deleteBatch([key], reason);
  }

  private async checkIfTestContent(key: string): Promise<boolean> {
    try {
      // Only check JSON files
      if (!key.endsWith('.json')) return false;

      const response = await r2Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));

      const content = await response.Body?.transformToString();
      if (!content) return false;

      // Check for test patterns in content
      const lowerContent = content.toLowerCase();
      return TEST_PATTERNS.content.some(pattern => 
        lowerContent.includes(pattern.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  private async deleteBatch(keys: string[], reason: string): Promise<void> {
    if (keys.length === 0) return;

    if (this.options.dryRun) {
      console.log(`   🔍 Would delete ${keys.length} files`);
      this.deletedCount += keys.length;
      return;
    }

    try {
      await r2Client.send(new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: keys.map(Key => ({ Key })),
          Quiet: true
        }
      }));
      
      console.log(`   ✅ Deleted ${keys.length} files`);
      this.deletedCount += keys.length;
    } catch (error) {
      console.error(`   ❌ Error deleting batch: ${error}`);
      this.errorCount += keys.length;
    }
  }

  private async askUser(question: string): Promise<boolean> {
    if (!this.rl) return true;

    return new Promise((resolve) => {
      this.rl!.question(`${question} (y/N): `, (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  private printSummary(): void {
    console.log('\n📊 Cleanup Summary:');
    console.log('---');
    console.log(`✅ Deleted: ${this.deletedCount} files`);
    console.log(`⏭️  Skipped: ${this.skippedCount} files`);
    console.log(`❌ Errors: ${this.errorCount} files`);
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    if (this.options.dryRun && this.deletedCount > 0) {
      console.log('\n💡 To actually delete these files, run without --dry-run flag');
    }
  }
}

function printUsage(): void {
  console.log(`
Test Data Cleanup Tool for R2

Usage:
  npm run clean:test                     # Interactive mode (dry run)
  npm run clean:test:force               # Delete without confirmation
  npm run clean:test:live                # Interactive mode (live)
  
Options:
  --dry-run         Preview what would be deleted (default)
  --live            Actually delete files
  --force           Skip confirmation prompts
  --interactive     Ask for confirmation (default without --force)
  --prefix <path>   Clean specific prefix
  --days <n>        Clean files older than n days
  --size <kb>       Clean files smaller than kb (with test content)
  
Examples:
  # Preview all test data
  npm run clean:test
  
  # Delete all test data without confirmation
  npm run clean:test:force
  
  # Clean specific author's test data
  npx tsx scripts/clean-test-data.ts --live --prefix "books/0x0000000000000000000000000000000000000000/"
  
  # Clean old test files
  npx tsx scripts/clean-test-data.ts --live --days 30
  
  # Clean small test files
  npx tsx scripts/clean-test-data.ts --live --size 10

Safety:
  - Default mode is DRY RUN (preview only)
  - Use --live flag to actually delete files
  - Interactive mode asks for confirmation
  - Use --force to skip all confirmations
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: CleanupOptions = {
    dryRun: !args.includes('--live'),
    interactive: !args.includes('--force'),
    force: args.includes('--force'),
  };

  // Parse additional options
  const prefixIndex = args.indexOf('--prefix');
  if (prefixIndex !== -1 && args[prefixIndex + 1]) {
    options.prefix = args[prefixIndex + 1];
  }

  const daysIndex = args.indexOf('--days');
  if (daysIndex !== -1 && args[daysIndex + 1]) {
    options.olderThanDays = parseInt(args[daysIndex + 1]);
  }

  const sizeIndex = args.indexOf('--size');
  if (sizeIndex !== -1 && args[sizeIndex + 1]) {
    options.smallerThanKB = parseInt(args[sizeIndex + 1]);
  }

  // Show warning for live mode
  if (!options.dryRun) {
    console.log('⚠️  WARNING: Running in LIVE mode - files will be permanently deleted!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const cleaner = new TestDataCleaner(options);
  await cleaner.clean();
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});