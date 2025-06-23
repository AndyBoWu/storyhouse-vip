import { BookStorageService } from '../lib/storage/bookStorage'
import type { BookMetadata, BookId } from '../lib/types/book'

async function fixRemixMetadata() {
  console.log('🔧 Fixing remix book metadata...')
  
  const remixBookId = '0x71b93d154886c297f4b6e6219c47d378f6ac6a70/the-confined-nebula-remix' as BookId
  const parentBookId = '0xd49646149734f829c722a547f6be217571a8355d/the-confined-nebula' as BookId
  
  try {
    // Load parent book to get cover URL and chapters
    console.log('📖 Loading parent book...')
    const parentBook = await BookStorageService.getBookMetadata(parentBookId)
    console.log('✅ Parent book loaded:', parentBook.title)
    console.log('🖼️ Parent cover URL:', parentBook.coverUrl)
    console.log('📚 Parent chapters:', Object.keys(parentBook.chapterMap))
    
    // Create proper metadata for remix book
    const remixMetadata: BookMetadata = {
      bookId: remixBookId,
      id: remixBookId,
      title: 'The Confined Nebula - Remix',
      description: 'A new take on The Confined Nebula',
      authorAddress: '0x71b93d154886c297f4b6e6219c47d378f6ac6a70',
      author: '0x71b93d154886c297f4b6e6219c47d378f6ac6a70',
      authorName: '6a70',
      slug: 'the-confined-nebula-remix',
      
      // Inherit cover from parent
      coverUrl: parentBook.coverUrl,
      coverImageUrl: parentBook.coverUrl,
      
      // Branching information
      parentBook: parentBookId,
      parentBookId: parentBookId,
      branchPoint: 'ch3',
      derivativeBooks: [],
      
      // Copy chapters 1-3 from parent
      chapterMap: {
        ch1: parentBook.chapterMap.ch1,
        ch2: parentBook.chapterMap.ch2,
        ch3: parentBook.chapterMap.ch3
      },
      chapters: 3,
      totalChapters: 3,
      
      // Original authors tracking
      originalAuthors: {
        // Parent author owns chapters 1-3
        [parentBook.authorAddress]: {
          chapters: ['ch1', 'ch2', 'ch3'],
          revenueShare: 70 // 70% to original author for inherited chapters
        },
        // Remix author will own future chapters
        '0x71b93d154886c297f4b6e6219c47d378f6ac6a70': {
          chapters: [],
          revenueShare: 30 // 30% to remix author as curator
        }
      },
      
      // Content info
      genres: ['Sci-Fi'],
      genre: 'Sci-Fi',
      contentRating: 'PG',
      isRemixable: true,
      isPublic: true,
      tags: ['sci-fi', 'AI', 'space', 'remix'],
      wordCount: 0,
      
      // Stats
      totalReads: 0,
      totalEarnings: 0,
      totalRevenue: 0,
      averageRating: 0,
      rating: 0,
      
      // Blockchain info (not registered yet)
      ipAssetId: undefined,
      licenseTermsId: undefined,
      tokenId: undefined,
      transactionHash: undefined,
      
      // Timestamps
      createdAt: '2025-06-23T01:23:13.224Z',
      updatedAt: new Date().toISOString(),
      
      // Status
      status: undefined
    }
    
    console.log('💾 Saving remix metadata to R2...')
    const metadataUrl = await BookStorageService.storeBookMetadata(
      '0x71b93d154886c297f4b6e6219c47d378f6ac6a70',
      'the-confined-nebula-remix',
      remixMetadata
    )
    
    console.log('✅ Remix metadata saved:', metadataUrl)
    
    // Verify it was saved
    console.log('🔍 Verifying saved metadata...')
    const savedMetadata = await BookStorageService.getBookMetadata(remixBookId)
    console.log('✅ Verification successful:', {
      title: savedMetadata.title,
      coverUrl: savedMetadata.coverUrl,
      chapters: Object.keys(savedMetadata.chapterMap).length,
      parentBook: savedMetadata.parentBook
    })
    
  } catch (error) {
    console.error('❌ Error fixing remix metadata:', error)
    process.exit(1)
  }
}

// Run the fix
fixRemixMetadata()
  .then(() => {
    console.log('✨ Fix completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error)
    process.exit(1)
  })