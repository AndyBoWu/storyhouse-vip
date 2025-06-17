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

async function listAuthorBooks(authorAddress: string) {
  const client = initializeR2Client()
  
  console.log(`📚 Listing books for author: ${authorAddress}`)
  console.log('=' .repeat(50) + '\n')
  
  try {
    // List all objects under books/authorAddress/
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `books/${authorAddress}/`,
    })
    
    const listResponse = await client.send(listCommand)
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No files found for this author.')
      return
    }
    
    console.log(`Found ${listResponse.Contents.length} file(s):\n`)
    
    // Group files by book/slug
    const bookFiles = new Map<string, string[]>()
    
    for (const object of listResponse.Contents) {
      if (object.Key) {
        // Extract the path after books/authorAddress/
        const relativePath = object.Key.replace(`books/${authorAddress}/`, '')
        console.log(`📄 ${relativePath}`)
        
        // Try to extract book slug from the path
        const parts = relativePath.split('/')
        if (parts.length > 0) {
          const bookSlug = parts[0]
          if (!bookFiles.has(bookSlug)) {
            bookFiles.set(bookSlug, [])
          }
          bookFiles.get(bookSlug)!.push(relativePath)
        }
      }
    }
    
    // Show summary by book
    console.log('\n📖 Books found:')
    for (const [slug, files] of bookFiles.entries()) {
      console.log(`\n   ${slug}/ (${files.length} files)`)
      // Show first few files as examples
      files.slice(0, 3).forEach(file => {
        console.log(`      - ${file}`)
      })
      if (files.length > 3) {
        console.log(`      ... and ${files.length - 3} more files`)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to list author books:', error)
  }
}

// Get author address from command line
const args = process.argv.slice(2)
if (args.length < 1) {
  console.log('Usage: tsx scripts/list-author-books.ts <authorAddress>')
  console.log('Example: tsx scripts/list-author-books.ts 0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2')
  process.exit(1)
}

const [authorAddress] = args

// Run the listing
listAuthorBooks(authorAddress).catch(console.error)