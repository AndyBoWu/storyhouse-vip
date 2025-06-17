import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Initialize R2 client
function initializeR2Client(): S3Client {
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
  }

  const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')
  const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')
  const cleanEndpoint = (process.env.R2_ENDPOINT || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')

  const endpointUrl = cleanEndpoint.startsWith('http') ? cleanEndpoint : `https://${cleanEndpoint}`

  return new S3Client({
    region: 'auto',
    endpoint: endpointUrl,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    forcePathStyle: false,
  })
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')

async function checkBookCover(authorAddress: string, slug: string) {
  const client = initializeR2Client()
  
  console.log('🔍 Checking book cover for:')
  console.log(`   Author: ${authorAddress}`)
  console.log(`   Slug: ${slug}`)
  console.log(`   Book ID: ${authorAddress}/${slug}`)
  console.log('==================================\n')
  
  try {
    // List all files for this book
    const bookPrefix = `books/${authorAddress}/${slug}/`
    console.log(`📂 Listing all files with prefix: ${bookPrefix}\n`)
    
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: bookPrefix,
    })
    
    const listResponse = await client.send(listCommand)
    const files = listResponse.Contents || []
    
    console.log(`Found ${files.length} file(s):\n`)
    
    let coverFound = false
    const coverFormats = ['jpg', 'jpeg', 'png', 'webp']
    
    for (const file of files) {
      if (file.Key) {
        const relativePath = file.Key.replace(bookPrefix, '')
        console.log(`  📄 ${relativePath} (${file.Size} bytes)`)
        
        // Check if this is a cover file
        for (const format of coverFormats) {
          if (relativePath === `cover.${format}`) {
            coverFound = true
            console.log(`     ✅ This is the cover image!`)
            console.log(`     Last Modified: ${file.LastModified}`)
            console.log(`     ETag: ${file.ETag}`)
          }
        }
      }
    }
    
    console.log('\n==================================')
    console.log('📊 Cover Check Results:\n')
    
    if (coverFound) {
      console.log('✅ Cover image EXISTS in R2 storage')
      console.log(`📌 Access via: /api/books/${encodeURIComponent(`${authorAddress}/${slug}`)}/cover`)
    } else {
      console.log('❌ No cover image found in R2 storage')
      console.log('   Expected one of:')
      for (const format of coverFormats) {
        console.log(`   - ${bookPrefix}cover.${format}`)
      }
    }
    
    // Try to check metadata.json for cover URL
    console.log('\n🔍 Checking metadata.json...')
    try {
      const metadataKey = `${bookPrefix}metadata.json`
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      })
      
      const response = await client.send(getCommand)
      const metadataStr = await response.Body?.transformToString()
      
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr)
        console.log('✅ Found metadata.json')
        console.log(`   Title: ${metadata.title}`)
        console.log(`   Cover URL in metadata: ${metadata.coverUrl || 'Not specified'}`)
        console.log(`   Cover Image in metadata: ${metadata.coverImage || 'Not specified'}`)
      }
    } catch (error) {
      console.log('❌ Could not read metadata.json')
    }
    
  } catch (error) {
    console.error('❌ Failed to check book cover:', error)
  }
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  // Default to the book mentioned in the prompt
  checkBookCover('0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2', 'the-detectives-portal-7').catch(console.error)
} else if (args.length === 2) {
  const [authorAddress, slug] = args
  checkBookCover(authorAddress, slug).catch(console.error)
} else {
  console.log('Usage: npm run check-cover [authorAddress] [slug]')
  console.log('Example: npm run check-cover 0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2 the-detectives-portal-7')
  process.exit(1)
}