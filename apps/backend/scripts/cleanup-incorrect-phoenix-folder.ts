import 'dotenv/config'
import { R2Service } from '../lib/r2'

async function cleanupIncorrectFolder() {
  try {
    const r2 = R2Service.getInstance()
    const prefix = 'books/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/phoenix/'
    
    console.log('🗑️ Listing objects in incorrect folder:', prefix)
    const objects = await r2.listObjectsWithPrefix(prefix)
    
    if (objects.length > 0) {
      console.log(`Found ${objects.length} objects to delete:`)
      for (const obj of objects) {
        console.log(`  - ${obj.key}`)
      }
      
      console.log('\n🗑️ Deleting objects...')
      for (const obj of objects) {
        await r2.deleteObject(obj.key)
        console.log(`✅ Deleted: ${obj.key}`)
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