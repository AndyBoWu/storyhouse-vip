#!/usr/bin/env tsx

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')

dotenv.config({ path: envPath })

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!

async function deleteAllStories() {
  try {
    console.log('🗑️  Starting cleanup of all stories from R2...')
    console.log(`📦 Bucket: ${BUCKET_NAME}`)
    console.log(`🔗 Endpoint: ${process.env.R2_ENDPOINT}`)

    let totalDeleted = 0
    let continuationToken: string | undefined

    do {
      // List all objects with 'stories/' prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'stories/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })

      console.log('📋 Listing objects...')
      const listResponse = await r2Client.send(listCommand)

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log('✅ No more story objects found.')
        break
      }

      console.log(`📄 Found ${listResponse.Contents.length} objects to delete`)

      // Prepare objects for deletion
      const objectsToDelete = listResponse.Contents.map(obj => ({
        Key: obj.Key!
      }))

      // Delete objects in batches (max 1000 per request)
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: objectsToDelete,
          Quiet: false,
        },
      })

      console.log('🗑️  Deleting objects...')
      const deleteResponse = await r2Client.send(deleteCommand)

      const deletedCount = deleteResponse.Deleted?.length || 0
      const errorCount = deleteResponse.Errors?.length || 0

      console.log(`✅ Deleted: ${deletedCount} objects`)
      if (errorCount > 0) {
        console.log(`❌ Errors: ${errorCount} objects`)
        deleteResponse.Errors?.forEach(error => {
          console.log(`   - ${error.Key}: ${error.Message}`)
        })
      }

      totalDeleted += deletedCount
      continuationToken = listResponse.NextContinuationToken

    } while (continuationToken)

    console.log('🎉 Cleanup completed!')
    console.log(`📊 Total deleted: ${totalDeleted} objects`)

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Show warning and run cleanup
console.log('⚠️  WARNING: This will permanently delete ALL stories from R2 storage!')
console.log('📦 Bucket:', BUCKET_NAME)
console.log('🔍 Prefix: stories/')
console.log('')

// Run the cleanup
deleteAllStories()