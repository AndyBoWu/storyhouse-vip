/**
 * Debug script to test chapter 4 access from frontend perspective
 */

const API_BASE = 'http://localhost:3002';
const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix-6';
const USER_ADDRESS = '0x71b93d154886c297F4B6e6219C47d378F6Ac6a70';

async function testChapter4Access() {
  console.log('🔍 Testing Chapter 4 Access...\n');
  
  try {
    // 1. Test chapters list API
    console.log('1. Testing chapters list API...');
    const chaptersResponse = await fetch(`${API_BASE}/api/books/${encodeURIComponent(BOOK_ID)}/chapters`);
    const chaptersData = await chaptersResponse.json();
    console.log('Chapters data:', JSON.stringify(chaptersData, null, 2));
    
    // 2. Test chapter 4 access check
    console.log('\n2. Testing chapter 4 access check...');
    const params = new URLSearchParams();
    params.append('userAddress', USER_ADDRESS);
    params.append('t', Date.now().toString());
    
    const accessResponse = await fetch(`${API_BASE}/api/books/${encodeURIComponent(BOOK_ID)}/chapter/4/unlock?${params}`);
    const accessData = await accessResponse.json();
    console.log('Access check result:', JSON.stringify(accessData, null, 2));
    
    // 3. Test direct chapter content fetch
    console.log('\n3. Testing direct chapter content fetch...');
    const chapterResponse = await fetch(`${API_BASE}/api/books/${encodeURIComponent(BOOK_ID)}/chapter/4`, {
      headers: {
        'x-user-address': USER_ADDRESS
      }
    });
    const chapterData = await chapterResponse.json();
    console.log('Chapter content result:', {
      title: chapterData.title,
      author: chapterData.author,
      authorAddress: chapterData.authorAddress,
      wordCount: chapterData.wordCount,
      hasContent: !!chapterData.content,
      contentLength: chapterData.content ? chapterData.content.length : 0
    });
    
    // 4. Test what the book page logic would produce
    console.log('\n4. Simulating book page chapter loading logic...');
    
    if (chaptersData.success && chaptersData.data && chaptersData.data.chapters) {
      console.log('Available chapters:', chaptersData.data.chapters);
      
      const chapterNumber = 4;
      if (chaptersData.data.chapters.includes(chapterNumber)) {
        console.log(`✅ Chapter ${chapterNumber} is in the chapters list`);
        
        // Simulate access check
        let isUnlocked = false;
        if (USER_ADDRESS && chapterNumber >= 4) {
          if (accessData.success && accessData.data) {
            isUnlocked = accessData.data.alreadyUnlocked || accessData.data.canAccess;
            console.log(`Access check result: isUnlocked = ${isUnlocked}`);
          }
        } else if (chapterNumber <= 3) {
          isUnlocked = true;
        }
        
        // Simulate chapter object creation
        const chapterObject = {
          number: chapterNumber,
          title: chapterData.title || `Chapter ${chapterNumber}`,
          preview: chapterData.content ? chapterData.content.slice(0, 150) + '...' : 'Chapter content preview loading...',
          reads: 0,
          earnings: 0,
          wordCount: chapterData.wordCount || 0,
          status: 'published',
          createdAt: chapterData.createdAt || new Date().toISOString(),
          unlocked: isUnlocked,
          isInherited: false, // For derivative books
          originalAuthor: chapterData.authorAddress,
          originalBookId: undefined,
          ipAssetId: chapterData.ipAssetId
        };
        
        console.log('Generated chapter object:', JSON.stringify(chapterObject, null, 2));
      } else {
        console.log(`❌ Chapter ${chapterNumber} is NOT in the chapters list`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test if this is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testChapter4Access();
}

module.exports = { testChapter4Access };