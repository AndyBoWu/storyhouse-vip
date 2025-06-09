import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

// Initialize R2 client (copy from books route)
let r2Client: S3Client

function initializeR2Client(): S3Client {
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ENDPOINT || ''}`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: false,
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
  })
}

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = initializeR2Client()
  }
  return r2Client
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/[\r\n]/g, '')

export async function GET(request: NextRequest) {
  try {
    const client = getR2Client()
    
    // List ALL objects with books/ prefix
    const allObjectsCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      MaxKeys: 100
    })

    const response = await client.send(allObjectsCommand)
    
    const objects = response.Contents?.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified?.toISOString(),
      etag: obj.ETag
    })) || []
    
    // Also check directories (CommonPrefixes)
    const listDirsCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'books/',
      Delimiter: '/',
      MaxKeys: 100
    })
    
    const dirsResponse = await client.send(listDirsCommand)
    const directories = dirsResponse.CommonPrefixes?.map(prefix => prefix.Prefix) || []

    return NextResponse.json({
      success: true,
      bucket: BUCKET_NAME,
      prefix: 'books/',
      objectCount: objects.length,
      directoryCount: directories.length,
      objects,
      directories,
      message: objects.length === 0 ? 'No objects found with books/ prefix' : `Found ${objects.length} objects`
    })

  } catch (error) {
    console.error('Debug R2 error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}