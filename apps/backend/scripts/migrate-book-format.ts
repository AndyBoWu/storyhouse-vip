import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
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

async function migrateBook(authorAddress: string, slug: string) {
  const client = initializeR2Client()
  
  const oldBookId = `${authorAddress}-${slug}`
  const newBookId = `${authorAddress}/${slug}`
  
  console.log(`\n🔄 Migrating book: ${oldBookId} → ${newBookId}`)
  
  try {
    // List all objects with the old book prefix
    const oldPrefix = `books/${oldBookId}/`
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: oldPrefix,
    })
    
    const listResponse = await client.send(listCommand)
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`❌ No files found for book: ${oldBookId}`)
      return
    }
    
    console.log(`📁 Found ${listResponse.Contents.length} files to migrate`)
    
    // Process each file
    for (const object of listResponse.Contents) {
      if (!object.Key) continue
      
      // Calculate new key by replacing the old book ID with new one
      const newKey = object.Key.replace(`books/${oldBookId}/`, `books/${newBookId}/`)
      
      console.log(`📄 Migrating: ${object.Key} → ${newKey}`)
      
      // Special handling for metadata.json - update the bookId inside
      if (object.Key.endsWith('metadata.json')) {
        try {
          // Get the metadata content
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: object.Key,
          })
          const getResponse = await client.send(getCommand)
          const content = await getResponse.Body?.transformToString()
          
          if (content) {
            // Parse and update the metadata
            const metadata = JSON.parse(content)
            metadata.bookId = newBookId
            metadata.id = newBookId  // Also update the id field
            
            // Upload updated metadata to new location
            const putCommand = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: newKey,
              Body: JSON.stringify(metadata, null, 2),
              ContentType: 'application/json',
            })
            await client.send(putCommand)
            console.log(`   ✅ Updated metadata with new bookId`)
          }
        } catch (error) {
          console.error(`   ❌ Failed to update metadata:`, error)
        }
      }
      // Special handling for chapter content.json files - update the bookId inside
      else if (object.Key.includes('/chapters/ch') && object.Key.endsWith('content.json')) {
        try {
          // Get the chapter content
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: object.Key,
          })
          const getResponse = await client.send(getCommand)
          const content = await getResponse.Body?.transformToString()
          
          if (content) {
            // Parse and update the chapter data
            const chapterData = JSON.parse(content)
            chapterData.bookId = newBookId
            
            // Upload updated chapter to new location
            const putCommand = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: newKey,
              Body: JSON.stringify(chapterData, null, 2),
              ContentType: 'application/json',
            })
            await client.send(putCommand)
            console.log(`   ✅ Updated chapter with new bookId`)
          }
        } catch (error) {
          console.error(`   ❌ Failed to update chapter:`, error)
        }
      }
      // For other files, just copy them
      else {
        try {
          // Copy to new location
          const copyCommand = new CopyObjectCommand({
            Bucket: BUCKET_NAME,
            CopySource: `${BUCKET_NAME}/${object.Key}`,
            Key: newKey,
          })
          await client.send(copyCommand)
          console.log(`   ✅ Copied successfully`)
        } catch (error) {
          console.error(`   ❌ Failed to copy:`, error)
        }
      }
    }
    
    // Optional: Delete old files after successful migration
    console.log(`\n🗑️  Do you want to delete the old files? (Uncomment the code below if yes)`)
    /*
    for (const object of listResponse.Contents) {
      if (!object.Key) continue
      
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: object.Key,
      })
      await client.send(deleteCommand)
      console.log(`🗑️  Deleted: ${object.Key}`)
    }
    */
    
    console.log(`\n✅ Migration complete for book: ${newBookId}`)
    
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error)
  }
}

// Main execution
async function main() {
  console.log('📚 Book Format Migration Script')
  console.log('================================')
  
  // Get book details from command line arguments
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('\nUsage: npm run migrate-book <authorAddress> <slug>')
    console.log('Example: npm run migrate-book 0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2 the-detectives-portal-7')
    process.exit(1)
  }
  
  const [authorAddress, slug] = args
  
  await migrateBook(authorAddress.toLowerCase(), slug)
}

// Run the migration
main().catch(console.error)