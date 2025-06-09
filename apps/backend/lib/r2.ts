import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client with proper configuration for Cloudflare R2
let r2Client: S3Client

function initializeR2Client(): S3Client {
  // Validate environment variables
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
  }

  // NUCLEAR CLEANING: Remove ANY potential invisible characters, quotes, whitespace
  const rawAccessKeyId = process.env.R2_ACCESS_KEY_ID || ''
  const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ''
  const rawEndpoint = process.env.R2_ENDPOINT || ''
  
  // Log raw values for debugging (first 8 chars only)
  console.log('🔍 Raw environment values:')
  console.log('   Raw Access Key ID:', JSON.stringify(rawAccessKeyId.substring(0, 8)))
  console.log('   Raw Secret Key first 8:', JSON.stringify(rawSecretAccessKey.substring(0, 8)))
  console.log('   Raw Endpoint:', JSON.stringify(rawEndpoint.substring(0, 20)))
  
  // Ultra-aggressive cleaning: remove ALL non-alphanumeric characters for credentials
  const cleanAccessKeyId = rawAccessKeyId.replace(/[^a-zA-Z0-9]/g, '')
  const cleanSecretAccessKey = rawSecretAccessKey.replace(/[^a-zA-Z0-9]/g, '')
  // For endpoint, only allow alphanumeric, dots, and hyphens
  const cleanEndpoint = rawEndpoint.replace(/[^a-zA-Z0-9.-]/g, '')

  console.log('🔧 R2 Configuration:')
  console.log('   Access Key ID length:', cleanAccessKeyId.length)
  console.log('   Secret Access Key length:', cleanSecretAccessKey.length)
  console.log('   Endpoint:', cleanEndpoint)

  // Additional validation to ensure credentials are clean
  if (!cleanAccessKeyId || !cleanSecretAccessKey || !cleanEndpoint) {
    throw new Error('R2 credentials are empty after cleaning')
  }

  // Log cleaned values for debugging (without exposing secrets)
  console.log('🔍 Cleaned R2 values:')
  console.log('   Access Key ID:', cleanAccessKeyId.substring(0, 8) + '...')
  console.log('   Has Secret Key:', !!cleanSecretAccessKey)
  console.log('   Endpoint:', cleanEndpoint)

  return new S3Client({
    region: 'auto',
    endpoint: `https://${cleanEndpoint}`,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    // R2-specific configuration
    forcePathStyle: false,
    // Disable AWS-specific features
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
    // Add custom headers to ensure proper encoding
    requestHandler: {
      metadata: {
        handlerProtocol: 'https',
      }
    }
  })
}

// Lazy initialization of R2 client
function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = initializeR2Client()
  }
  return r2Client
}

// Clean environment variables for bucket configuration
const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
}

export class R2Service {
  /**
   * Upload content to R2
   */
  static async uploadContent(
    key: string,
    content: string | Buffer,
    options: UploadOptions = {}
  ): Promise<string> {
    console.log('🚀 R2Service.uploadContent called with key:', key)
    console.log('📊 Content type:', options.contentType || 'text/plain')
    console.log('📏 Content size:', typeof content === 'string' ? content.length : content.length, 'bytes')
    
    try {
      const client = getR2Client()
      console.log('✅ R2 client obtained successfully')
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: options.contentType || 'text/plain',
        Metadata: options.metadata,
        // R2 doesn't support ACLs - objects are public via bucket settings
      })

      console.log('📤 Sending PutObjectCommand to R2...')
      console.log('🏷️ Bucket:', BUCKET_NAME)
      console.log('🔑 Key:', key)
      
      await client.send(command)
      console.log('✅ R2 upload completed successfully')

      // Return public URL
      const publicUrl = `${PUBLIC_URL}/${key}`
      console.log('🌐 Generated public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('❌ Error uploading to R2:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'N/A',
        statusCode: (error as any)?.$metadata?.httpStatusCode || 'N/A'
      })
      throw new Error(`Failed to upload content to R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get content from R2
   */
  static async getContent(key: string): Promise<string> {
    try {
      const client = getR2Client()
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const response = await client.send(command)
      const content = await response.Body?.transformToString()

      if (!content) {
        throw new Error('Content not found')
      }

      return content
    } catch (error) {
      console.error('Error fetching from R2:', error)
      throw new Error('Failed to fetch content')
    }
  }

  /**
   * Delete content from R2
   */
  static async deleteContent(key: string): Promise<void> {
    try {
      const client = getR2Client()
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await client.send(command)
    } catch (error) {
      console.error('Error deleting from R2:', error)
      throw new Error('Failed to delete content')
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const client = getR2Client()
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      return await getSignedUrl(client, command, { expiresIn })
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  /**
   * Generate content key for chapters
   */
  static generateChapterKey(storyId: string, chapterNumber: number): string {
    return `stories/${storyId}/chapters/${chapterNumber}.json`
  }

  /**
   * Generate content key for story metadata
   */
  static generateStoryKey(storyId: string): string {
    return `stories/${storyId}/metadata.json`
  }

  /**
   * List objects in R2 with prefix
   */
  static async listObjects(prefix: string, delimiter?: string, maxKeys?: number) {
    try {
      const client = getR2Client()
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        Delimiter: delimiter,
        MaxKeys: maxKeys,
      })

      return await client.send(command)
    } catch (error) {
      console.error('Error listing objects from R2:', error)
      throw new Error(`Failed to list objects: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
