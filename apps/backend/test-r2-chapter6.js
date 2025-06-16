// Test script to check R2 for Chapter 6
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Initialize R2 client
const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/[^a-zA-Z0-9]/g, '');
const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/[^a-zA-Z0-9]/g, '');
const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/[^a-zA-Z0-9.-]/g, '');
const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim();

console.log('🔧 R2 Configuration:');
console.log('   Endpoint:', cleanEndpoint);
console.log('   Bucket:', BUCKET_NAME);

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${cleanEndpoint}`,
  credentials: {
    accessKeyId: cleanAccessKeyId,
    secretAccessKey: cleanSecretAccessKey,
  },
  forcePathStyle: false,
});

async function checkChapter6() {
  const bookId = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2-the-detectives-portal-7';
  const [authorAddress, ...slugParts] = bookId.split('-');
  const slug = slugParts.join('-');
  
  console.log('\n📚 Checking for Chapter 6 of book:', bookId);
  console.log('   Author:', authorAddress);
  console.log('   Slug:', slug);
  
  try {
    // List all files in the chapters folder
    const chaptersPrefix = `books/${authorAddress.toLowerCase()}/${slug}/chapters/`;
    console.log('\n🔍 Listing files with prefix:', chaptersPrefix);
    
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: chaptersPrefix,
    });
    
    const listResponse = await client.send(listCommand);
    
    console.log('\n📊 Total objects found:', listResponse.KeyCount);
    
    if (listResponse.Contents) {
      // Group files by chapter
      const chapterFiles = {};
      listResponse.Contents.forEach(obj => {
        const match = obj.Key.match(/chapters\/ch(\d+)\//);
        if (match) {
          const chapterNum = match[1];
          if (!chapterFiles[chapterNum]) {
            chapterFiles[chapterNum] = [];
          }
          chapterFiles[chapterNum].push(obj.Key);
        }
      });
      
      console.log('\n📁 Files by chapter:');
      Object.keys(chapterFiles).sort((a, b) => parseInt(a) - parseInt(b)).forEach(chapterNum => {
        console.log(`\n   Chapter ${chapterNum}:`);
        chapterFiles[chapterNum].forEach(file => {
          console.log(`     - ${file}`);
        });
      });
      
      // Check specifically for Chapter 6
      if (chapterFiles['6']) {
        console.log('\n✅ Chapter 6 EXISTS in R2!');
        console.log('   Files:', chapterFiles['6']);
        
        // Try to fetch the content
        const contentPath = `books/${authorAddress.toLowerCase()}/${slug}/chapters/ch6/content.json`;
        console.log('\n📖 Fetching Chapter 6 content from:', contentPath);
        
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: contentPath,
        });
        
        try {
          const response = await client.send(getCommand);
          const content = await response.Body?.transformToString();
          const chapterData = JSON.parse(content);
          
          console.log('\n📄 Chapter 6 details:');
          console.log('   Title:', chapterData.title);
          console.log('   Word Count:', chapterData.wordCount);
          console.log('   Created At:', chapterData.createdAt);
          console.log('   Content Preview:', chapterData.content?.substring(0, 100) + '...');
        } catch (fetchError) {
          console.error('❌ Error fetching Chapter 6 content:', fetchError.message);
        }
      } else {
        console.log('\n❌ Chapter 6 NOT FOUND in R2');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('   Message:', error.message);
    console.error('   Code:', error.Code);
  }
}

// Run the check
checkChapter6().catch(console.error);