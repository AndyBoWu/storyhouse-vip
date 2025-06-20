#!/usr/bin/env node
/**
 * Script to delete chapters via the API
 * Usage: node delete-chapters-via-api.ts <bookId> <chapterNumbers...>
 * Example: node delete-chapters-via-api.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7" 11 12 13 14 15
 */

const bookId = process.argv[2];
const chapterNumbers = process.argv.slice(3).map(n => parseInt(n, 10)).filter(n => !isNaN(n));

if (!bookId || chapterNumbers.length === 0) {
  console.error('Usage: node delete-chapters-via-api.ts <bookId> <chapterNumbers...>');
  console.error('Example: node delete-chapters-via-api.ts "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7" 11 12 13 14 15');
  process.exit(1);
}

async function deleteChapters() {
  console.log('🗑️ Deleting chapters via API');
  console.log('📚 Book ID:', bookId);
  console.log('📝 Chapters to delete:', chapterNumbers.join(', '));
  
  const encodedBookId = encodeURIComponent(bookId);
  const baseUrl = 'http://localhost:3002/api/chapters';
  
  for (const chapterNum of chapterNumbers) {
    try {
      console.log(`\n🗑️ Deleting chapter ${chapterNum}...`);
      const url = `${baseUrl}/${encodedBookId}/${chapterNum}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Chapter ${chapterNum} deleted successfully`);
        console.log('   Response:', result.message);
      } else {
        const error = await response.text();
        console.log(`❌ Failed to delete chapter ${chapterNum}`);
        console.log('   Status:', response.status);
        console.log('   Error:', error);
      }
    } catch (error) {
      console.error(`❌ Error deleting chapter ${chapterNum}:`, error.message);
    }
  }
}

deleteChapters().catch(console.error);