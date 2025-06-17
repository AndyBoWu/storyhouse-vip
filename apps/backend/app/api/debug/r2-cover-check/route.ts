import { NextRequest, NextResponse } from 'next/server';
import { R2Service } from '@/lib/r2';
import { BookStorageService } from '@/lib/storage/bookStorage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

// Initialize R2 client
function getR2Client(): S3Client {
  const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/[^a-zA-Z0-9.-]/g, '');

  return new S3Client({
    region: 'auto',
    endpoint: `https://${cleanEndpoint}`,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    forcePathStyle: false,
  });
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/[\r\n]/g, '');

/**
 * Debug endpoint to check book cover existence and details
 * GET /api/debug/r2-cover-check?bookId={authorAddress}/{slug}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get('bookId') || '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7';
  
  console.log('🔍 R2 Cover Check Debug Started');
  console.log('📚 Book ID:', bookId);
  
  const results: Record<string, any> = {
    bookId,
    timestamp: new Date().toISOString(),
    checks: {},
  };
  
  try {
    // Parse book ID
    const { authorAddress, slug } = BookStorageService.parseBookId(bookId as any);
    results.authorAddress = authorAddress;
    results.slug = slug;
    
    console.log('✅ Parsed book ID:');
    console.log('  Author Address:', authorAddress);
    console.log('  Slug:', slug);
    
    // Check 1: Try different cover formats
    const coverFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const coverChecks: Record<string, any> = {};
    
    for (const format of coverFormats) {
      const coverKey = `books/${authorAddress}/${slug}/cover.${format}`;
      console.log(`\n🔍 Checking cover.${format}: ${coverKey}`);
      
      try {
        const client = getR2Client();
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: coverKey,
        });
        
        const response = await client.send(command);
        
        coverChecks[format] = {
          exists: true,
          key: coverKey,
          size: response.ContentLength,
          contentType: response.ContentType,
          lastModified: response.LastModified,
          etag: response.ETag,
          metadata: response.Metadata,
        };
        
        console.log(`✅ Found cover.${format}!`);
        console.log(`  Size: ${response.ContentLength} bytes`);
        console.log(`  Content-Type: ${response.ContentType}`);
      } catch (error) {
        coverChecks[format] = {
          exists: false,
          key: coverKey,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorName: (error as any)?.name,
        };
        console.log(`❌ cover.${format} not found:`, (error as any)?.name);
      }
    }
    
    results.checks.coverFormats = coverChecks;
    
    // Check 2: List all files in the book directory
    console.log('\n🔍 Listing all files in book directory...');
    const bookPrefix = `books/${authorAddress}/${slug}/`;
    
    try {
      const listResult = await R2Service.listObjects(bookPrefix);
      const files = (listResult.Contents || []).map(obj => ({
        key: obj.Key,
        relativePath: obj.Key?.replace(bookPrefix, ''),
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
      
      results.checks.allFiles = {
        count: files.length,
        files: files,
      };
      
      console.log(`📊 Found ${files.length} files total`);
      files.forEach(file => {
        console.log(`  📄 ${file.relativePath} (${file.size} bytes)`);
      });
    } catch (error) {
      results.checks.allFiles = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    
    // Check 3: Try to get book metadata
    console.log('\n🔍 Checking book metadata...');
    try {
      const metadata = await BookStorageService.getBookMetadata(bookId as any);
      results.checks.bookMetadata = {
        exists: true,
        title: metadata.title,
        author: metadata.author,
        coverUrl: metadata.coverUrl,
        coverImage: metadata.coverImage,
      };
      console.log('✅ Book metadata found');
      console.log('  Cover URL in metadata:', metadata.coverUrl);
      console.log('  Cover Image in metadata:', metadata.coverImage);
    } catch (error) {
      results.checks.bookMetadata = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      console.log('❌ Book metadata not found');
    }
    
    // Check 4: Generate expected URLs
    results.urls = {
      coverEndpoint: `/api/books/${encodeURIComponent(bookId)}/cover`,
      directR2Urls: coverFormats.reduce((acc, format) => {
        acc[format] = `${process.env.R2_PUBLIC_URL}/books/${authorAddress}/${slug}/cover.${format}`;
        return acc;
      }, {} as Record<string, string>),
    };
    
    // Summary
    const hasAnyCover = Object.values(coverChecks).some((check: any) => check.exists);
    results.summary = {
      hasCover: hasAnyCover,
      coverFormat: hasAnyCover 
        ? Object.entries(coverChecks).find(([_, check]: [string, any]) => check.exists)?.[0]
        : null,
      recommendation: hasAnyCover
        ? 'Cover exists. Use the cover endpoint to serve it.'
        : 'No cover found. You may need to upload a cover image.',
    };
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ R2 cover check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      results,
    }, { status: 500 });
  }
}