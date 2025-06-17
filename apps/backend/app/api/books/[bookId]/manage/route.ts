import { NextRequest, NextResponse } from 'next/server';
import { R2Service } from '@/lib/r2';
import { BookStorageService } from '@/lib/storage/bookStorage';

/**
 * Book management endpoint - check existence and optionally delete book files from R2
 * GET /api/books/{bookId}/manage - Check if book exists
 * DELETE /api/books/{bookId}/manage - Delete all book files
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const bookId = decodeURIComponent(params.bookId);
  console.log('🔍 Checking book existence:', bookId);
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Generate the prefix for this book
    const bookPrefix = `books/${authorAddress.toLowerCase()}/${slug}/`;
    console.log('🔍 Looking for objects with prefix:', bookPrefix);
    
    // List all objects under this book
    const listResult = await R2Service.listObjects(bookPrefix);
    
    const objects = listResult.Contents || [];
    const totalSize = objects.reduce((sum, obj) => sum + (obj.Size || 0), 0);
    
    console.log(`📊 Found ${objects.length} objects, total size: ${totalSize} bytes`);
    
    // Get file details
    const files = objects.map(obj => ({
      key: obj.Key,
      relativePath: obj.Key?.replace(bookPrefix, ''),
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
    
    // Check for metadata to get book info
    let bookMetadata = null;
    const metadataKey = `${bookPrefix}metadata.json`;
    try {
      const metadataContent = await R2Service.getContent(metadataKey);
      bookMetadata = JSON.parse(metadataContent);
      console.log('✅ Successfully fetched book metadata');
    } catch (error) {
      console.log('⚠️ Book metadata not found or invalid');
    }
    
    return NextResponse.json({
      exists: objects.length > 0,
      bookId,
      authorAddress,
      slug,
      prefix: bookPrefix,
      fileCount: objects.length,
      totalSize,
      files,
      bookMetadata,
    });
    
  } catch (error) {
    console.error('❌ Error checking book existence:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      exists: false,
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const bookId = decodeURIComponent(params.bookId);
  console.log('🗑️ Deleting book:', bookId);
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Generate the prefix for this book
    const bookPrefix = `books/${authorAddress.toLowerCase()}/${slug}/`;
    console.log('🔍 Looking for objects to delete with prefix:', bookPrefix);
    
    // List all objects under this book
    const listResult = await R2Service.listObjects(bookPrefix);
    
    const objects = listResult.Contents || [];
    console.log(`📊 Found ${objects.length} objects to delete`);
    
    if (objects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files found to delete',
        bookId,
        deletedCount: 0,
      });
    }
    
    // Delete each object
    const deletedFiles: string[] = [];
    const failedDeletes: { key: string; error: string }[] = [];
    
    for (const obj of objects) {
      if (obj.Key) {
        try {
          console.log(`  🗑️ Deleting: ${obj.Key}`);
          await R2Service.deleteContent(obj.Key);
          deletedFiles.push(obj.Key);
        } catch (error) {
          console.error(`  ❌ Failed to delete ${obj.Key}:`, error);
          failedDeletes.push({
            key: obj.Key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
    
    console.log(`✅ Deleted ${deletedFiles.length} files, ${failedDeletes.length} failures`);
    
    return NextResponse.json({
      success: failedDeletes.length === 0,
      message: `Deleted ${deletedFiles.length} files`,
      bookId,
      authorAddress,
      slug,
      prefix: bookPrefix,
      deletedCount: deletedFiles.length,
      deletedFiles,
      failedCount: failedDeletes.length,
      failedDeletes: failedDeletes.length > 0 ? failedDeletes : undefined,
    });
    
  } catch (error) {
    console.error('❌ Error deleting book:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}