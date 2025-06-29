#!/usr/bin/env -S npx tsx
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env.local') });

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!.startsWith('http') 
    ? process.env.R2_ENDPOINT! 
    : `https://${process.env.R2_ENDPOINT!}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function checkBook() {
  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'storyhouse-content',
      Key: 'books/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix2/metadata.json'
    }));
    
    const content = await response.Body?.transformToString();
    if (content) {
      console.log('Book Metadata:');
      console.log(JSON.stringify(JSON.parse(content), null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBook();