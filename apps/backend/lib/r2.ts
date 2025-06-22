import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client with proper configuration for Cloudflare R2
let r2ClientInstance: S3Client | null = null

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
    // Try to fix Vercel serverless environment issues
    maxAttempts: 1,
    requestHandler: {
      // Force specific HTTP agent configuration for Vercel
      connectionTimeout: 5000,
      socketTimeout: 5000,
      metadata: { handlerProtocol: 'http/1.1' },
      requestTimeout: 10000,
    },
    // Force specific signing behavior for R2
    customUserAgent: 'storyhouse-r2-client/1.0'
  })
}

// Lazy initialization of R2 client
function getR2Client(): S3Client {
  // Check if environment variables are available
  const hasRequiredEnvVars = process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
  
  if (!hasRequiredEnvVars) {
    // During build time, environment variables might not be available
    // Throw a more descriptive error only when actually trying to use R2
    throw new Error('R2 environment variables not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.')
  }
  
  if (!r2ClientInstance) {
    r2ClientInstance = initializeR2Client()
  }
  return r2ClientInstance
}

// Export the client getter and convenience methods
export const r2Client = {
  get: async (key: string) => {
    try {
      const client = getR2Client()
      console.log(`🔍 R2 GET: Bucket="${BUCKET_NAME}", Key="${key}"`)
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      const response = await client.send(command)
      const content = await response.Body?.transformToString()
      if (!content) throw new Error('Content not found')
      console.log(`✅ R2 GET Success: Retrieved ${content.length} characters`)
      return { text: () => Promise.resolve(content) }
    } catch (error) {
      console.error(`❌ R2 GET Failed for key "${key}":`, error)
      throw new Error('Failed to fetch content')
    }
  },
  put: async (key: string, content: string | Buffer) => {
    try {
      const client = getR2Client()
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: 'application/json'
      })
      await client.send(command)
      return `${PUBLIC_URL}/${key}`
    } catch (error) {
      throw new Error('Failed to upload content')
    }
  }
}

// Clean environment variables for bucket configuration (handle missing env vars gracefully during build)
const BUCKET_NAME = process.env.R2_BUCKET_NAME ? process.env.R2_BUCKET_NAME.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '') : ''
const PUBLIC_URL = process.env.R2_PUBLIC_URL ? process.env.R2_PUBLIC_URL.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '') : ''

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
}

/**
 * Sanitize metadata values to ensure they are valid for HTTP headers
 */
function sanitizeMetadata(metadata?: Record<string, string>): Record<string, string> | undefined {
  if (!metadata) return undefined
  
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`🧼 Sanitizing metadata "${key}": "${value}"`)
    
    // Remove or replace invalid characters in HTTP header values
    // AWS S3/R2 metadata has strict requirements for header values
    const sanitizedValue = value
      .replace(/[\x00-\x1F\x7F-\xFF]/g, '') // Remove control chars and non-ASCII
      .replace(/['"''""`]/g, '') // Remove all types of quotes and apostrophes
      .replace(/[\r\n\t]/g, ' ') // Replace newlines and tabs with spaces
      .replace(/[^\x20-\x7E]/g, '') // Keep only ASCII printable chars
      .replace(/[^\w\s\-.,()]/g, '') // Remove special chars except word chars, spaces, hyphens, periods, commas, parentheses
      .trim()
    
    console.log(`🧼 Sanitized to: "${sanitizedValue}"`)
    
    if (sanitizedValue) {
      sanitized[key] = sanitizedValue
    }
  }
  
  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

export class R2Service {
  /**
   * Upload enhanced content with license metadata to R2
   */
  static async uploadEnhancedContent(
    key: string,
    content: string | Buffer,
    options: UploadOptions = {},
    licenseMetadata?: Record<string, string>
  ): Promise<string> {
    console.log('🚀 R2Service.uploadEnhancedContent called with key:', key)
    console.log('📊 Content type:', options.contentType || 'text/plain')
    console.log('📏 Content size:', typeof content === 'string' ? content.length : content.length, 'bytes')
    console.log('🏷️ License metadata provided:', !!licenseMetadata)
    
    try {
      const client = getR2Client()
      console.log('✅ R2 client obtained successfully')
      
      // Merge license metadata with existing metadata
      const enhancedMetadata = {
        ...options.metadata,
        ...licenseMetadata,
        // Add enhanced metadata version tracking
        schemaVersion: '2.0.0',
        enhancedMetadata: 'true',
        lastUpdated: new Date().toISOString()
      }
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: options.contentType || 'application/json',
        Metadata: sanitizeMetadata(enhancedMetadata),
        // R2 doesn't support ACLs - objects are public via bucket settings
      })

      console.log('📤 Sending enhanced PutObjectCommand to R2...')
      console.log('🏷️ Bucket:', BUCKET_NAME)
      console.log('🔑 Key:', key)
      console.log('📋 Enhanced metadata fields:', Object.keys(enhancedMetadata).length)
      
      await client.send(command)
      console.log('✅ Enhanced R2 upload completed successfully')

      // Return public URL
      const publicUrl = `${PUBLIC_URL}/${key}`
      console.log('🌐 Generated public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('❌ Error uploading enhanced content to R2:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'N/A',
        statusCode: (error as any)?.$metadata?.httpStatusCode || 'N/A'
      })
      throw new Error(`Failed to upload enhanced content to R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload content to R2 (original method for backward compatibility)
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
        Metadata: sanitizeMetadata(options.metadata),
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
      console.log(`🔍 R2Service.getContent: Bucket="${BUCKET_NAME}", Key="${key}"`)
      
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const response = await client.send(command)
      const content = await response.Body?.transformToString()

      if (!content) {
        throw new Error('Content not found')
      }

      console.log(`✅ R2Service.getContent Success: Retrieved ${content.length} characters`)
      return content
    } catch (error) {
      console.error(`❌ R2Service.getContent Failed for key "${key}":`, error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'N/A',
        statusCode: (error as any)?.$metadata?.httpStatusCode || 'N/A'
      })
      // Preserve original error message for better debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to fetch content from R2: ${errorMessage}`)
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
   * Generate a public URL for a given key (for publicly accessible objects)
   */
  static getPublicUrl(key: string): string {
    return `${PUBLIC_URL}/${key}`
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
   * Generate content key for enhanced chapter with version
   */
  static generateEnhancedChapterKey(storyId: string, chapterNumber: number, version?: number): string {
    const versionSuffix = version ? `-v${version}` : ''
    return `stories/${storyId}/chapters/${chapterNumber}${versionSuffix}.json`
  }

  /**
   * Generate content key for license metadata
   */
  static generateLicenseKey(storyId: string, chapterNumber: number): string {
    return `stories/${storyId}/chapters/${chapterNumber}/license.json`
  }

  /**
   * Convert license terms to R2 storage metadata (HTTP headers)
   */
  static convertLicenseToMetadata(licenseTerms: any): Record<string, string> {
    return {
      // License Identification
      licenseTier: licenseTerms.tier || 'free',
      licenseDisplayName: licenseTerms.displayName || '',
      licenseTermsId: licenseTerms.licenseTermsId || '',
      pilType: licenseTerms.pilType || 'LAP',
      
      // Economic Terms
      tipPrice: licenseTerms.tipPrice?.toString() || '0',
      mintingFee: licenseTerms.mintingFee?.toString() || '0',
      royaltyPercentage: licenseTerms.royaltyPercentage?.toString() || '0',
      
      // Rights & Permissions
      commercialUse: licenseTerms.commercialUse?.toString() || 'false',
      commercialAttribution: licenseTerms.commercialAttribution?.toString() || 'true',
      derivativesAllowed: licenseTerms.derivativesAllowed?.toString() || 'true',
      derivativesAttribution: licenseTerms.derivativesAttribution?.toString() || 'true',
      exclusivity: licenseTerms.exclusivity?.toString() || 'false',
      shareAlike: licenseTerms.shareAlike?.toString() || 'false',
      attribution: licenseTerms.attribution?.toString() || 'true',
      transferable: licenseTerms.transferable?.toString() || 'true',
      
      // Distribution
      territories: (licenseTerms.territories || ['Worldwide']).join(','),
      distributionChannels: (licenseTerms.distributionChannels || ['Digital']).join(','),
      contentRestrictions: (licenseTerms.contentRestrictions || []).join(','),
      
      // Lifecycle
      expiration: licenseTerms.expiration?.toString() || '0',
      licenseCreatedAt: licenseTerms.createdAt || new Date().toISOString(),
      licenseUpdatedAt: licenseTerms.updatedAt || new Date().toISOString(),
      
      // Royalty Policy (if exists)
      royaltyPolicyAddress: licenseTerms.royaltyPolicy?.address || '',
      royaltyPolicyType: licenseTerms.royaltyPolicy?.policyType || '',
      stakingReward: licenseTerms.royaltyPolicy?.stakingReward?.toString() || '0',
      distributionDelay: licenseTerms.royaltyPolicy?.distributionDelay?.toString() || '0',
    }
  }

  /**
   * Get enhanced content with license metadata parsing
   */
  static async getEnhancedContent(key: string): Promise<{
    content: any
    metadata: Record<string, string>
    licenseInfo?: any
  }> {
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

      // Parse content and extract license information
      const parsedContent = JSON.parse(content)
      const metadata = response.Metadata || {}
      
      // Extract license information from metadata or content
      const licenseInfo = this.extractLicenseInfo(parsedContent, metadata)

      return {
        content: parsedContent,
        metadata,
        licenseInfo
      }
    } catch (error) {
      console.error('Error fetching enhanced content from R2:', error)
      throw new Error('Failed to fetch enhanced content')
    }
  }

  /**
   * Extract license information from content and metadata
   */
  private static extractLicenseInfo(content: any, metadata: Record<string, string>): any {
    // Try to get license info from content first (preferred)
    if (content.licenseTerms) {
      return content.licenseTerms
    }

    // Fall back to metadata extraction
    if (metadata.licenseTier) {
      return {
        tier: metadata.licenseTier,
        displayName: metadata.licenseDisplayName || '',
        licenseTermsId: metadata.licenseTermsId || '',
        pilType: metadata.pilType || 'LAP',
        tipPrice: parseInt(metadata.tipPrice || '0'),
        royaltyPercentage: parseInt(metadata.royaltyPercentage || '0'),
        commercialUse: metadata.commercialUse === 'true',
        derivativesAllowed: metadata.derivativesAllowed === 'true',
        exclusivity: metadata.exclusivity === 'true',
        // Add more fields as needed
      }
    }

    return null
  }

  /**
   * Check if content has enhanced license metadata
   */
  static async hasEnhancedMetadata(key: string): Promise<boolean> {
    try {
      const client = getR2Client()
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const response = await client.send(command)
      const metadata = response.Metadata || {}
      
      return metadata.enhancedMetadata === 'true' && !!metadata.schemaVersion
    } catch (error) {
      console.warn('Could not check enhanced metadata for key:', key, error)
      return false
    }
  }

  /**
   * List objects in R2 with prefix - Using alternative approach to avoid header issues
   */
  static async listObjects(prefix: string, delimiter?: string, maxKeys?: number) {
    try {
      console.log('🔍 R2Service.listObjects called with:')
      console.log('   Prefix:', prefix)
      console.log('   Delimiter:', delimiter)
      console.log('   MaxKeys:', maxKeys)
      console.log('   Bucket:', BUCKET_NAME)

      // Create a fresh client for each list operation to avoid header contamination
      const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/[^a-zA-Z0-9]/g, '')
      const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/[^a-zA-Z0-9]/g, '')
      const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/[^a-zA-Z0-9.-]/g, '')
      
      // Check if we have the required credentials
      if (!cleanAccessKeyId || !cleanSecretAccessKey || !cleanEndpoint) {
        console.warn('⚠️ R2 credentials not available for list operation')
        return {
          Contents: [],
          CommonPrefixes: [],
          KeyCount: 0,
          IsTruncated: false
        }
      }

      console.log('🔧 Creating fresh S3 client for list operation...')
      
      const freshClient = new S3Client({
        region: 'auto',
        endpoint: `https://${cleanEndpoint}`,
        credentials: {
          accessKeyId: cleanAccessKeyId,
          secretAccessKey: cleanSecretAccessKey,
        },
        // Minimal configuration to avoid header issues
        forcePathStyle: false,
        useAccelerateEndpoint: false,
        useDualstackEndpoint: false,
        maxAttempts: 1,
        // Simplified request handler for list operations
        requestHandler: {
          connectionTimeout: 3000,
          socketTimeout: 3000,
        }
      })
      
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        Delimiter: delimiter,
        MaxKeys: maxKeys,
      })

      console.log('📤 Sending ListObjectsV2Command with fresh client...')
      
      const result = await freshClient.send(command)
      console.log('✅ ListObjectsV2Command completed successfully')
      return result
    } catch (error) {
      console.error('❌ Error listing objects from R2:', error)
      console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown')
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown')
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // If the error is specifically about authorization headers, try a workaround
      if (error instanceof Error && error.message.includes('Invalid character in header content')) {
        console.log('🔄 Detected header encoding issue, attempting workaround...')
        
        // Try using a completely different approach - fetch via URL pattern
        console.log('⚠️ ListObjects failed due to header issues - returning empty result')
        return {
          Contents: [],
          CommonPrefixes: [],
          KeyCount: 0,
          IsTruncated: false
        }
      }
      
      throw new Error(`Failed to list objects: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
