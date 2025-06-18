import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from backend's .env.local
dotenv.config({ path: join(__dirname, '../.env.local') })

// Also try loading from root if backend env doesn't work
if (!process.env.R2_BUCKET_NAME) {
  dotenv.config({ path: join(__dirname, '../../../.env.local') })
}

async function removeEmptyFolder() {
  console.log('🗑️ Starting R2 empty folder cleanup...')

  // Initialize R2 client
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  const bucketName = process.env.R2_BUCKET_NAME!
  
  console.log('🔧 R2 Configuration:')
  console.log(`  - Bucket: ${bucketName}`)
  console.log(`  - Endpoint: ${process.env.R2_ENDPOINT}`)
  console.log(`  - Access Key: ${process.env.R2_ACCESS_KEY_ID?.substring(0, 5)}...`)

  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not set')
  }

  try {
    // List all objects with the "/" prefix
    console.log('📋 Listing objects with "/" prefix...')
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: '/',
      MaxKeys: 1000
    })

    const listResponse = await client.send(listCommand)
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('✅ No objects found with "/" prefix')
      return
    }

    console.log(`Found ${listResponse.Contents.length} objects to remove:`)
    
    // Delete each object
    for (const obj of listResponse.Contents) {
      if (obj.Key) {
        console.log(`  - Deleting: ${obj.Key}`)
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.Key
        })
        
        try {
          await client.send(deleteCommand)
          console.log(`    ✅ Deleted: ${obj.Key}`)
        } catch (error) {
          console.error(`    ❌ Failed to delete ${obj.Key}:`, error)
        }
      }
    }

    console.log('✅ Cleanup completed!')
    
    // Verify by listing again
    console.log('\n🔍 Verifying cleanup...')
    const verifyResponse = await client.send(listCommand)
    if (!verifyResponse.Contents || verifyResponse.Contents.length === 0) {
      console.log('✅ All "/" prefixed objects have been removed')
    } else {
      console.log(`⚠️ ${verifyResponse.Contents.length} objects still remain`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the cleanup
removeEmptyFolder().catch(console.error)