import { config } from 'dotenv'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import * as path from 'path'

// Load environment variables from .env.testnet
config({ path: path.join(__dirname, '../.env.testnet') })

console.log('Environment check:')
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT ? '✓' : '✗')
console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '✓' : '✗')
console.log('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '✓' : '✗')
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME)

// Initialize R2 client
const endpoint = process.env.R2_ENDPOINT!
const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'storyhouse-content'

async function cleanupIncorrectFolder() {
  try {
    const prefix = 'books/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/phoenix/'
    
    console.log('🗑️ Bucket:', BUCKET_NAME)
    console.log('🗑️ Listing objects in incorrect folder:', prefix)
    
    // List objects
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    })
    
    const listResponse = await r2Client.send(listCommand)
    const objects = listResponse.Contents || []
    
    if (objects.length > 0) {
      console.log(`Found ${objects.length} objects to delete:`)
      for (const obj of objects) {
        console.log(`  - ${obj.Key}`)
      }
      
      console.log('\n🗑️ Deleting objects...')
      for (const obj of objects) {
        if (obj.Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: obj.Key,
          })
          await r2Client.send(deleteCommand)
          console.log(`✅ Deleted: ${obj.Key}`)
        }
      }
      
      console.log('\n✅ Cleanup complete!')
    } else {
      console.log('✅ No objects found in the incorrect folder')
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

cleanupIncorrectFolder().catch(console.error)