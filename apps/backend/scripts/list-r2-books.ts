import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
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

async function listBooks() {
  const client = initializeR2Client()
  
  console.log('📚 Listing all books in R2 storage')
  console.log('==================================\n')
  
  try {
    // List all objects under books/ prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      Delimiter: '/', // This will help us see the book folders
    })
    
    const listResponse = await client.send(listCommand)
    
    // Extract unique book IDs from CommonPrefixes
    const bookIds = new Set<string>()
    
    if (listResponse.CommonPrefixes) {
      for (const prefix of listResponse.CommonPrefixes) {
        if (prefix.Prefix) {
          // Extract book ID from prefix like "books/bookId/"
          const match = prefix.Prefix.match(/^books\/([^\/]+)\/$/)
          if (match) {
            bookIds.add(match[1])
          }
        }
      }
    }
    
    // Also check Contents for any direct files
    if (listResponse.Contents) {
      for (const object of listResponse.Contents) {
        if (object.Key) {
          // Extract book ID from key like "books/bookId/..."
          const match = object.Key.match(/^books\/([^\/]+)\//)
          if (match) {
            bookIds.add(match[1])
          }
        }
      }
    }
    
    // List all unique book IDs
    const sortedBookIds = Array.from(bookIds).sort()
    
    if (sortedBookIds.length === 0) {
      console.log('No books found in R2 storage.')
    } else {
      console.log(`Found ${sortedBookIds.length} book(s):\n`)
      
      for (const bookId of sortedBookIds) {
        console.log(`📖 ${bookId}`)
        
        // Check if it's old format (with hyphen) or new format (with slash)
        if (bookId.includes('-') && !bookId.includes('/')) {
          // Parse old format
          const parts = bookId.split('-')
          if (parts.length >= 2) {
            const authorAddress = parts[0]
            const slug = parts.slice(1).join('-')
            console.log(`   Old format detected → Suggested migration:`)
            console.log(`   npm run migrate-book ${authorAddress} ${slug}\n`)
          }
        } else if (bookId.includes('/')) {
          console.log(`   New format (already migrated)\n`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to list books:', error)
  }
}

// Run the listing
listBooks().catch(console.error)