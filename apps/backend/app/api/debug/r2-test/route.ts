import { NextRequest, NextResponse } from 'next/server';
import { BookStorageService } from '@/lib/storage/bookStorage';
import { R2Service } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get('bookId') || '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7';
  const chapterNumber = parseInt(searchParams.get('chapter') || '1');
  
  console.log('🔍 Debug R2 Test Started');
  console.log('📚 Book ID:', bookId);
  console.log('📖 Chapter Number:', chapterNumber);
  
  try {
    // Test 1: Parse book ID
    console.log('\n=== Test 1: Parse Book ID ===');
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed successfully:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Test 2: Generate paths
    console.log('\n=== Test 2: Generate Paths ===');
    const bookPaths = (BookStorageService as any).generateBookPaths(authorAddress, slug);
    const chapterPaths = (BookStorageService as any).generateChapterPaths(bookPaths, chapterNumber);
    console.log('📁 Book Paths:', bookPaths);
    console.log('📄 Chapter Paths:', chapterPaths);
    
    // Test 3: Try to fetch metadata
    console.log('\n=== Test 3: Fetch Book Metadata ===');
    try {
      const metadata = await BookStorageService.getBookMetadata(bookId as any);
      console.log('✅ Metadata fetched successfully');
      console.log('  Title:', metadata.title);
    } catch (error) {
      console.log('❌ Metadata fetch failed:', error);
    }
    
    // Test 4: Try to fetch chapter
    console.log('\n=== Test 4: Fetch Chapter Content ===');
    try {
      const chapter = await BookStorageService.getChapterContent(authorAddress, slug, chapterNumber);
      console.log('✅ Chapter fetched successfully');
      console.log('  Title:', chapter.title);
      console.log('  Content length:', chapter.content?.length || 0);
    } catch (error) {
      console.log('❌ Chapter fetch failed:', error);
    }
    
    // Test 5: Direct R2 fetch
    console.log('\n=== Test 5: Direct R2 Fetch ===');
    const directPath = `books/${authorAddress.toLowerCase()}/${slug}/chapters/ch${chapterNumber}/content.json`;
    console.log('🔑 Direct path:', directPath);
    try {
      const content = await R2Service.getContent(directPath);
      console.log('✅ Direct R2 fetch successful');
      console.log('  Content length:', content.length);
    } catch (error) {
      console.log('❌ Direct R2 fetch failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      bookId,
      authorAddress,
      slug,
      chapterNumber,
      paths: {
        bookPaths,
        chapterPaths,
        directPath
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}