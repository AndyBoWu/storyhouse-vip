#!/usr/bin/env node

/**
 * Script to check books in R2 storage and force reindex
 */

import dotenv from 'dotenv'
import path from 'path'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env.local') })

async function checkR2Books() {
  console.log('🔍 Checking books in R2 storage...\n')
  
  // Check R2 configuration
  const hasR2Config = !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )
  
  if (!hasR2Config) {
    console.error('❌ R2 environment variables not configured')
    console.log('Required: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME')
    return
  }
  
  try {
    // Initialize R2 client
    const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/[^a-zA-Z0-9.-]/g, '')
    const bucketName = (process.env.R2_BUCKET_NAME || '').trim()
    
    console.log('R2 Configuration:')
    console.log(`  Endpoint: ${cleanEndpoint}`)
    console.log(`  Bucket: ${bucketName}`)
    console.log(`  Access Key: ${cleanAccessKeyId.slice(0, 4)}...`)
    console.log()
    
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${cleanEndpoint}`,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
      forcePathStyle: false,
    })
    
    // List all author directories
    console.log('📁 Listing author directories...')
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'books/',
      Delimiter: '/'
    })
    
    const response = await client.send(listCommand)
    
    if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
      console.log('📭 No author directories found in R2')
      return
    }
    
    console.log(`Found ${response.CommonPrefixes.length} author directories:\n`)
    
    // Process each author
    for (const authorPrefix of response.CommonPrefixes) {
      if (!authorPrefix.Prefix) continue
      
      const authorAddress = authorPrefix.Prefix.replace('books/', '').replace('/', '')
      console.log(`👤 Author: ${authorAddress}`)
      
      // List books for this author
      const authorBooksCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `books/${authorAddress}/`,
        Delimiter: '/'
      })
      
      const authorBooksResponse = await client.send(authorBooksCommand)
      
      if (authorBooksResponse.CommonPrefixes) {
        for (const bookPrefix of authorBooksResponse.CommonPrefixes) {
          if (!bookPrefix.Prefix) continue
          
          const bookSlug = bookPrefix.Prefix
            .replace(`books/${authorAddress}/`, '')
            .replace('/', '')
          
          console.log(`   📚 Book: ${bookSlug}`)
          
          // List contents of this book
          const bookContentsCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: `books/${authorAddress}/${bookSlug}/`,
            MaxKeys: 10
          })
          
          const bookContentsResponse = await client.send(bookContentsCommand)
          
          if (bookContentsResponse.Contents) {
            bookContentsResponse.Contents.forEach(item => {
              const relativePath = item.Key?.replace(`books/${authorAddress}/${bookSlug}/`, '') || ''
              console.log(`      - ${relativePath}`)
            })
          }
        }
      }
      console.log()
    }
    
    // Check for book index
    console.log('\n📊 Checking book index...')
    const indexCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'books/index.json',
      MaxKeys: 1
    })
    
    const indexResponse = await client.send(indexCommand)
    if (indexResponse.Contents && indexResponse.Contents.length > 0) {
      const indexFile = indexResponse.Contents[0]
      console.log(`✅ Index found: ${indexFile.Key}`)
      console.log(`   Last modified: ${indexFile.LastModified}`)
      console.log(`   Size: ${indexFile.Size} bytes`)
    } else {
      console.log('❌ No book index found')
    }
    
  } catch (error) {
    console.error('❌ Error checking R2:', error)
  }
}

// Run the script
checkR2Books()