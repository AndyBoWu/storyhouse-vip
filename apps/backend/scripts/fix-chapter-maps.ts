import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function fixChapterMaps() {
  console.log('🔧 Fixing chapter maps for all books...');

  try {
    // List all book directories
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      Delimiter: '/',
    });

    const listResponse = await r2Client.send(listCommand);
    
    if (!listResponse.CommonPrefixes) {
      console.log('No books found');
      return;
    }

    // Process each author directory
    for (const authorPrefix of listResponse.CommonPrefixes) {
      if (!authorPrefix.Prefix) continue;

      const authorAddress = authorPrefix.Prefix.replace('books/', '').replace('/', '');
      
      // List books for this author
      const authorBooksCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `books/${authorAddress}/`,
        Delimiter: '/',
      });

      const authorBooksResponse = await r2Client.send(authorBooksCommand);
      
      if (!authorBooksResponse.CommonPrefixes) continue;

      // Process each book
      for (const bookPrefix of authorBooksResponse.CommonPrefixes) {
        if (!bookPrefix.Prefix) continue;

        const bookSlug = bookPrefix.Prefix.replace(`books/${authorAddress}/`, '').replace('/', '');
        const bookId = `${authorAddress}/${bookSlug}`;
        
        console.log(`\n📚 Processing book: ${bookId}`);

        try {
          // Get book metadata
          const metadataKey = `books/${authorAddress}/${bookSlug}/metadata.json`;
          const getMetadataCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: metadataKey,
          });

          const metadataResponse = await r2Client.send(getMetadataCommand);
          if (!metadataResponse.Body) continue;

          const metadataText = await metadataResponse.Body.transformToString();
          const metadata = JSON.parse(metadataText);

          // Check if chapterMap already exists
          if (metadata.chapterMap && Object.keys(metadata.chapterMap).length > 0) {
            console.log('✅ Chapter map already exists');
            continue;
          }

          // Build chapter map by listing actual chapters
          const chaptersCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: `books/${authorAddress}/${bookSlug}/chapters/`,
            Delimiter: '/',
          });

          const chaptersResponse = await r2Client.send(chaptersCommand);
          
          if (!chaptersResponse.CommonPrefixes) {
            console.log('⚠️ No chapters found');
            continue;
          }

          // Create chapter map
          const chapterMap: Record<string, string> = {};
          
          for (const chapterPrefix of chaptersResponse.CommonPrefixes) {
            if (!chapterPrefix.Prefix) continue;
            
            const chapterMatch = chapterPrefix.Prefix.match(/ch(\d+)\/$/);
            if (chapterMatch) {
              const chapterNum = chapterMatch[1];
              // For non-derivative books, chapters point to themselves
              chapterMap[`ch${chapterNum}`] = `${authorAddress}/${bookSlug}/chapters/ch${chapterNum}`;
            }
          }

          if (Object.keys(chapterMap).length > 0) {
            // Update metadata with chapter map
            metadata.chapterMap = chapterMap;
            
            // Save updated metadata
            const putCommand = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: metadataKey,
              Body: JSON.stringify(metadata, null, 2),
              ContentType: 'application/json',
            });

            await r2Client.send(putCommand);
            console.log(`✅ Added chapter map with ${Object.keys(chapterMap).length} chapters`);
          }

        } catch (error) {
          console.error(`❌ Error processing book ${bookId}:`, error);
        }
      }
    }

    console.log('\n✅ Chapter map fix complete!');

  } catch (error) {
    console.error('❌ Error fixing chapter maps:', error);
    process.exit(1);
  }
}

// Run the fix
fixChapterMaps().catch(console.error);