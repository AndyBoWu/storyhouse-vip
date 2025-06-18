import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
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

async function cleanupAuthorFolder() {
  console.log('🗑️ Starting cleanup of author folder...')

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
  const authorAddress = '0xd49646149734f829c722a547f6be217571a8355d'
  const prefix = `books/${authorAddress}/`

  console.log('🔧 Configuration:')
  console.log(`  - Bucket: ${bucketName}`)
  console.log(`  - Author: ${authorAddress}`)
  console.log(`  - Prefix: ${prefix}`)

  try {
    let continuationToken: string | undefined
    let totalDeleted = 0

    do {
      // List all objects under this author's folder
      console.log('📋 Listing objects...')
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      })

      const listResponse = await client.send(listCommand)
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log('✅ No more objects found')
        break
      }

      console.log(`Found ${listResponse.Contents.length} objects to delete`)

      // Prepare objects for batch deletion
      const objectsToDelete = listResponse.Contents
        .filter(obj => obj.Key)
        .map(obj => ({ Key: obj.Key! }))

      if (objectsToDelete.length > 0) {
        // Delete objects in batch (max 1000 at a time)
        console.log(`🗑️ Deleting ${objectsToDelete.length} objects...`)
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: objectsToDelete,
            Quiet: false
          }
        })

        const deleteResponse = await client.send(deleteCommand)
        
        if (deleteResponse.Deleted) {
          totalDeleted += deleteResponse.Deleted.length
          console.log(`✅ Deleted ${deleteResponse.Deleted.length} objects`)
          
          // Show first few deleted items
          deleteResponse.Deleted.slice(0, 5).forEach(item => {
            console.log(`   - ${item.Key}`)
          })
          if (deleteResponse.Deleted.length > 5) {
            console.log(`   ... and ${deleteResponse.Deleted.length - 5} more`)
          }
        }

        if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
          console.error(`❌ ${deleteResponse.Errors.length} errors occurred:`)
          deleteResponse.Errors.forEach(error => {
            console.error(`   - ${error.Key}: ${error.Message}`)
          })
        }
      }

      continuationToken = listResponse.NextContinuationToken

    } while (continuationToken)

    console.log(`\n✅ Cleanup completed! Total objects deleted: ${totalDeleted}`)
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...')
    const verifyCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 1
    })
    
    const verifyResponse = await client.send(verifyCommand)
    if (!verifyResponse.Contents || verifyResponse.Contents.length === 0) {
      console.log('✅ All objects have been successfully removed')
    } else {
      console.log(`⚠️ ${verifyResponse.KeyCount} objects still remain`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupAuthorFolder().catch(console.error)