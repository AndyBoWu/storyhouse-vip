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

interface DeepCleanOptions {
  keepAuthors?: string[];
  keepBooks?: string[];
  minChapters?: number;
  hasIpAsset?: boolean;
  dryRun?: boolean;
}

class DeepCleaner {
  private rl: readline.Interface;
  private stats = {
    booksAnalyzed: 0,
    booksDeleted: 0,
    filesDeleted: 0,
    sizeFreed: 0,
    booksKept: 0,
  };

  constructor(private options: DeepCleanOptions) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async clean(): Promise<void> {
    console.log('🔥 Deep Clean R2 Storage');
    console.log('========================');
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : '🚨 LIVE MODE 🚨'}`);
    console.log('\nCriteria for keeping books:');
    if (this.options.keepAuthors?.length) {
      console.log(`✓ Authors to keep: ${this.options.keepAuthors.join(', ')}`);
    }
    if (this.options.keepBooks?.length) {
      console.log(`✓ Books to keep: ${this.options.keepBooks.join(', ')}`);
    }
    if (this.options.minChapters) {
      console.log(`✓ Books with at least ${this.options.minChapters} chapters`);
    }
    if (this.options.hasIpAsset) {
      console.log(`✓ Books with IP assets registered`);
    }
    console.log('\n---\n');

    try {
      await this.analyzeAndClean();
      this.printReport();
    } finally {
      this.rl.close();
    }
  }

  private async analyzeAndClean(): Promise<void> {
    // List all author directories
    const authorsResult = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      Delimiter: '/'
    }));

    if (!authorsResult.CommonPrefixes) {
      console.log('No books found in R2');
      return;
    }

    for (const authorPrefix of authorsResult.CommonPrefixes) {
      if (!authorPrefix.Prefix) continue;
      
      const author = authorPrefix.Prefix.replace('books/', '').replace('/', '');
      
      // Check if this author should be kept
      if (this.options.keepAuthors?.includes(author)) {
        console.log(`\n✅ Keeping all books by author: ${author}`);
        continue;
      }

      // List all books for this author
      const booksResult = await r2Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: authorPrefix.Prefix,
        Delimiter: '/'
      }));

      if (!booksResult.CommonPrefixes) continue;

      for (const bookPrefix of booksResult.CommonPrefixes) {
        if (!bookPrefix.Prefix) continue;
        
        await this.analyzeBook(bookPrefix.Prefix);
      }
    }

    // Clean up orphaned files in covers/ and metadata/
    await this.cleanOrphanedFiles();
  }

  private async analyzeBook(bookPath: string): Promise<void> {
    this.stats.booksAnalyzed++;
    
    const pathParts = bookPath.split('/');
    const author = pathParts[1];
    const slug = pathParts[2];
    const bookId = `${author}/${slug}`;

    console.log(`\n📚 Analyzing: ${bookId}`);

    // Check if this specific book should be kept
    if (this.options.keepBooks?.includes(bookId) || 
        this.options.keepBooks?.includes(slug)) {
      console.log(`   ✅ Book in keep list`);
      this.stats.booksKept++;
      return;
    }

    let shouldDelete = true;
    const reasons: string[] = [];

    // Check metadata
    try {
      const metadataResponse = await r2Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${bookPath}metadata.json`
      }));
      
      const metadata = JSON.parse(await metadataResponse.Body!.transformToString());
      
      // Check if has IP asset
      if (this.options.hasIpAsset && metadata.ipAssetId) {
        console.log(`   ✅ Has IP asset: ${metadata.ipAssetId}`);
        shouldDelete = false;
      } else if (this.options.hasIpAsset && !metadata.ipAssetId) {
        reasons.push('No IP asset');
      }

      // Check chapter count
      if (this.options.minChapters) {
        const chaptersResult = await r2Client.send(new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: `${bookPath}chapters/`,
          Delimiter: '/'
        }));
        
        const chapterCount = chaptersResult.CommonPrefixes?.length || 0;
        console.log(`   📖 Chapters: ${chapterCount}`);
        
        if (chapterCount >= this.options.minChapters) {
          shouldDelete = false;
        } else {
          reasons.push(`Only ${chapterCount} chapters`);
        }
      }

      // Check for test/demo indicators
      const lowerTitle = metadata.title?.toLowerCase() || '';
      const testIndicators = ['test', 'demo', 'sample', 'lorem', 'untitled'];
      if (testIndicators.some(indicator => lowerTitle.includes(indicator))) {
        reasons.push('Test/demo content');
      }

    } catch (error) {
      reasons.push('No metadata found');
    }

    // If no criteria specified, ask user
    if (!this.options.hasIpAsset && !this.options.minChapters && shouldDelete) {
      const answer = await this.askUser(`Delete ${bookId}? (${reasons.join(', ')})`);
      shouldDelete = answer;
    }

    if (shouldDelete && reasons.length > 0) {
      console.log(`   ❌ Marking for deletion: ${reasons.join(', ')}`);
      await this.deleteBook(bookPath);
    } else {
      console.log(`   ✅ Keeping book`);
      this.stats.booksKept++;
    }
  }

  private async deleteBook(bookPath: string): Promise<void> {
    // Get all files in this book
    const filesResult = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: bookPath
    }));

    if (!filesResult.Contents) return;

    const totalSize = filesResult.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
    console.log(`   🗑️  Deleting ${filesResult.Contents.length} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);

    if (this.options.dryRun) {
      this.stats.booksDeleted++;
      this.stats.filesDeleted += filesResult.Contents.length;
      this.stats.sizeFreed += totalSize;
      return;
    }

    // Delete in batches
    const batchSize = 100;
    for (let i = 0; i < filesResult.Contents.length; i += batchSize) {
      const batch = filesResult.Contents.slice(i, i + batchSize);
      const keys = batch.filter(obj => obj.Key).map(obj => obj.Key!);
      
      try {
        await r2Client.send(new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: keys.map(Key => ({ Key })),
            Quiet: true
          }
        }));
      } catch (error) {
        console.error(`   ❌ Error deleting batch: ${error}`);
      }
    }

    this.stats.booksDeleted++;
    this.stats.filesDeleted += filesResult.Contents.length;
    this.stats.sizeFreed += totalSize;
  }

  private async cleanOrphanedFiles(): Promise<void> {
    console.log('\n🧹 Cleaning orphaned files...');

    // Clean covers folder
    const coversResult = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'covers/'
    }));

    if (coversResult.Contents) {
      console.log(`   Found ${coversResult.Contents.length} files in covers/`);
      
      if (!this.options.dryRun) {
        const keys = coversResult.Contents.filter(obj => obj.Key).map(obj => obj.Key!);
        for (let i = 0; i < keys.length; i += 100) {
          const batch = keys.slice(i, i + 100);
          await r2Client.send(new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
              Objects: batch.map(Key => ({ Key })),
              Quiet: true
            }
          }));
        }
      }
      
      this.stats.filesDeleted += coversResult.Contents.length;
    }

    // Clean metadata folder
    const metadataResult = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'metadata/'
    }));

    if (metadataResult.Contents) {
      console.log(`   Found ${metadataResult.Contents.length} files in metadata/`);
      
      if (!this.options.dryRun) {
        const keys = metadataResult.Contents.filter(obj => obj.Key).map(obj => obj.Key!);
        for (let i = 0; i < keys.length; i += 100) {
          const batch = keys.slice(i, i + 100);
          await r2Client.send(new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
              Objects: batch.map(Key => ({ Key })),
              Quiet: true
            }
          }));
        }
      }
      
      this.stats.filesDeleted += metadataResult.Contents.length;
    }
  }

  private async askUser(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${question} (y/N): `, (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  private printReport(): void {
    console.log('\n=====================================');
    console.log('📊 Deep Clean Report');
    console.log('=====================================');
    console.log(`Books analyzed: ${this.stats.booksAnalyzed}`);
    console.log(`Books kept: ${this.stats.booksKept}`);
    console.log(`Books deleted: ${this.stats.booksDeleted}`);
    console.log(`Files deleted: ${this.stats.filesDeleted}`);
    console.log(`Space freed: ${(this.stats.sizeFreed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    if (this.options.dryRun && this.stats.booksDeleted > 0) {
      console.log('\n⚠️  This was a dry run. To actually delete, use --live flag');
    }
  }
}

function printUsage(): void {
  console.log(`
Deep Clean R2 Storage Tool

This tool performs aggressive cleanup of R2 storage based on criteria.

Usage:
  npm run deep-clean                     # Interactive deep clean (dry run)
  npm run deep-clean:live                # Actually delete files
  
Options:
  --dry-run                  Preview only (default)
  --live                     Actually delete files
  --keep-authors <list>      Comma-separated list of authors to keep
  --keep-books <list>        Comma-separated list of books to keep
  --min-chapters <n>         Keep books with at least n chapters
  --has-ip                   Keep only books with IP assets
  
Examples:
  # Preview cleanup, keeping books with 3+ chapters
  npx tsx scripts/deep-clean-r2.ts --min-chapters 3
  
  # Keep specific authors
  npx tsx scripts/deep-clean-r2.ts --live --keep-authors "0x123,0x456"
  
  # Keep books with IP assets only
  npx tsx scripts/deep-clean-r2.ts --live --has-ip
  
  # Combined criteria
  npx tsx scripts/deep-clean-r2.ts --live --min-chapters 2 --has-ip

⚠️  WARNING: This tool can delete a lot of data. Always run in dry-run mode first!
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: DeepCleanOptions = {
    dryRun: !args.includes('--live')
  };

  // Parse keep-authors
  const keepAuthorsIndex = args.indexOf('--keep-authors');
  if (keepAuthorsIndex !== -1 && args[keepAuthorsIndex + 1]) {
    options.keepAuthors = args[keepAuthorsIndex + 1].split(',').map(a => a.trim().toLowerCase());
  }

  // Parse keep-books
  const keepBooksIndex = args.indexOf('--keep-books');
  if (keepBooksIndex !== -1 && args[keepBooksIndex + 1]) {
    options.keepBooks = args[keepBooksIndex + 1].split(',').map(b => b.trim());
  }

  // Parse min-chapters
  const minChaptersIndex = args.indexOf('--min-chapters');
  if (minChaptersIndex !== -1 && args[minChaptersIndex + 1]) {
    options.minChapters = parseInt(args[minChaptersIndex + 1]);
  }

  // Parse has-ip
  if (args.includes('--has-ip')) {
    options.hasIpAsset = true;
  }

  // Warning for live mode
  if (!options.dryRun) {
    console.log('🚨 WARNING: Running in LIVE mode!');
    console.log('🚨 This will PERMANENTLY DELETE data from R2!');
    console.log('🚨 Press Ctrl+C to cancel, or wait 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const cleaner = new DeepCleaner(options);
  await cleaner.clean();
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});