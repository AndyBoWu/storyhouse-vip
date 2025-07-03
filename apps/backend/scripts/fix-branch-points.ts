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

async function fixBranchPoints() {
  console.log('🔧 Fixing branch points for derivative books...');

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

          // Check if this is a derivative book without branch point
          if (metadata.isDerivative && metadata.parentBook && !metadata.branchPoint) {
            console.log(`\n📚 Found derivative book without branch point: ${bookId}`);
            
            // Determine branch point from chapterMap
            if (metadata.chapterMap) {
              // Find the highest inherited chapter
              let highestInheritedChapter = 0;
              
              for (const [ch, path] of Object.entries(metadata.chapterMap)) {
                const chapterNum = parseInt(ch.replace('ch', ''));
                
                // Check if this chapter is inherited (points to parent book)
                if (typeof path === 'string' && !path.includes(bookSlug)) {
                  highestInheritedChapter = Math.max(highestInheritedChapter, chapterNum);
                }
              }
              
              if (highestInheritedChapter > 0) {
                metadata.branchPoint = `ch${highestInheritedChapter}`;
                console.log(`✅ Set branch point to: ${metadata.branchPoint}`);
                
                // Save updated metadata
                const putCommand = new PutObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: metadataKey,
                  Body: JSON.stringify(metadata, null, 2),
                  ContentType: 'application/json',
                });

                await r2Client.send(putCommand);
                console.log(`✅ Updated metadata for ${bookId}`);
              }
            }
          }

        } catch (error) {
          console.error(`❌ Error processing book ${bookId}:`, error);
        }
      }
    }

    console.log('\n✅ Branch point fix complete!');

  } catch (error) {
    console.error('❌ Error fixing branch points:', error);
    process.exit(1);
  }
}

// Run the fix
fixBranchPoints().catch(console.error);