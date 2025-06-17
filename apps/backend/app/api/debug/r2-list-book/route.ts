import { NextRequest, NextResponse } from 'next/server';
import { R2Service } from '@/lib/r2';
import { BookStorageService } from '@/lib/storage/bookStorage';

/**
 * Debug endpoint to list all R2 objects for a specific book
 * GET /api/debug/r2-list-book?bookId={authorAddress}/{slug}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get('bookId');
  
  if (!bookId) {
    return NextResponse.json({
      error: 'bookId parameter is required',
      example: '/api/debug/r2-list-book?bookId=0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7'
    }, { status: 400 });
  }

  console.log('🔍 R2 List Book Debug Started');
  console.log('📚 Book ID:', bookId);
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Generate the prefix for this book
    const bookPrefix = `books/${authorAddress}/${slug}/`;
    console.log('🔍 Looking for objects with prefix:', bookPrefix);
    
    // List all objects under this book
    const listResult = await R2Service.listObjects(bookPrefix);
    
    const objects = listResult.Contents || [];
    const folders = listResult.CommonPrefixes || [];
    
    console.log(`📊 Found ${objects.length} objects and ${folders.length} folders`);
    
    // Build a structured response
    const structuredFiles: Record<string, any> = {};
    
    // Process all objects
    for (const obj of objects) {
      if (obj.Key) {
        const relativePath = obj.Key.replace(bookPrefix, '');
        structuredFiles[relativePath] = {
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          etag: obj.ETag,
        };
        
        console.log(`  📄 ${relativePath} (${obj.Size} bytes)`);
      }
    }
    
    // Check for specific expected files
    const expectedFiles = [
      'metadata.json',
      'cover.jpg',
      'cover.png',
      'cover.webp',
      'chapters/ch1/content.json',
      'chapters/ch1/metadata.json',
    ];
    
    const fileStatus: Record<string, boolean> = {};
    for (const file of expectedFiles) {
      fileStatus[file] = !!structuredFiles[file];
    }
    
    // Try to fetch the metadata to get more info
    let bookMetadata = null;
    if (structuredFiles['metadata.json']) {
      try {
        const metadataContent = await R2Service.getContent(bookPrefix + 'metadata.json');
        bookMetadata = JSON.parse(metadataContent);
        console.log('✅ Successfully fetched book metadata');
      } catch (error) {
        console.log('❌ Failed to fetch book metadata:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      bookId,
      authorAddress,
      slug,
      prefix: bookPrefix,
      totalObjects: objects.length,
      totalFolders: folders.length,
      files: structuredFiles,
      fileStatus,
      bookMetadata,
      coverUrl: structuredFiles['cover.jpg'] 
        ? `/api/books/${encodeURIComponent(bookId)}/cover`
        : null,
      debug: {
        listResult: {
          isTruncated: listResult.IsTruncated,
          keyCount: listResult.KeyCount,
          maxKeys: listResult.MaxKeys,
          name: listResult.Name,
          prefix: listResult.Prefix,
        }
      }
    });
    
  } catch (error) {
    console.error('❌ R2 list book debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}