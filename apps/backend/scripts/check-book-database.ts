import { prisma } from '../lib/prisma'

async function checkBookInDatabase() {
  const bookId = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal'
  
  console.log('🔍 Checking book in database:', bookId)
  
  try {
    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' }
        }
      }
    })
    
    if (!book) {
      console.log('❌ Book not found in database')
      
      // Check for similar books
      const similarBooks = await prisma.book.findMany({
        where: {
          OR: [
            { id: { contains: 'the-detectives-portal' } },
            { slug: { contains: 'the-detectives-portal' } },
            { title: { contains: 'Detective' } }
          ]
        },
        select: {
          id: true,
          title: true,
          slug: true,
          authorAddress: true,
          createdAt: true,
          _count: {
            select: { chapters: true }
          }
        }
      })
      
      if (similarBooks.length > 0) {
        console.log('\n📚 Similar books found:')
        similarBooks.forEach(b => {
          console.log(`  - ${b.id}`)
          console.log(`    Title: ${b.title}`)
          console.log(`    Slug: ${b.slug}`)
          console.log(`    Author: ${b.authorAddress}`)
          console.log(`    Chapters: ${b._count.chapters}`)
          console.log(`    Created: ${b.createdAt}`)
          console.log('')
        })
      }
      
      return
    }
    
    console.log('\n✅ Book found:')
    console.log('  Title:', book.title)
    console.log('  Author:', book.authorAddress)
    console.log('  Slug:', book.slug)
    console.log('  Created:', book.createdAt)
    console.log('  Total Chapters:', book.chapters.length)
    console.log('  NFT Contract:', book.nftContractAddress || 'Not set')
    console.log('  Hybrid Contract Registered:', book.isHybridRegistered ? 'Yes' : 'No')
    
    console.log('\n📖 Chapters:')
    book.chapters.forEach(ch => {
      console.log(`  Chapter ${ch.chapterNumber}:`)
      console.log(`    Title: ${ch.title}`)
      console.log(`    IP Asset ID: ${ch.ipAssetId || 'Not registered'}`)
      console.log(`    NFT Token ID: ${ch.nftTokenId || 'Not minted'}`)
      console.log(`    License Terms ID: ${ch.licenseTermsId || 'Not set'}`)
      console.log(`    Created: ${ch.createdAt}`)
    })
    
    // Specifically check chapter 8
    const chapter8 = book.chapters.find(ch => ch.chapterNumber === 8)
    if (chapter8) {
      console.log('\n🔍 Chapter 8 Details:')
      console.log('  ID:', chapter8.id)
      console.log('  IP Asset ID:', chapter8.ipAssetId)
      console.log('  NFT Token ID:', chapter8.nftTokenId)
      console.log('  License Terms ID:', chapter8.licenseTermsId)
      console.log('  Status:', chapter8.status)
    } else {
      console.log('\n❌ Chapter 8 not found in database')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBookInDatabase()
  .then(() => console.log('\n✅ Check complete'))
  .catch(console.error)