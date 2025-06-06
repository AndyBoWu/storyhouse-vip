import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

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
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: options.contentType || 'text/plain',
        Metadata: options.metadata,
        // Make content publicly readable
        ACL: 'public-read',
      })

      await r2Client.send(command)

      // Return public URL
      return `${PUBLIC_URL}/${key}`
    } catch (error) {
      console.error('Error uploading to R2:', error)
      throw new Error('Failed to upload content')
    }
  }

  /**
   * Get content from R2
   */
  static async getContent(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      const response = await r2Client.send(command)
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
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await r2Client.send(command)
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
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      return await getSignedUrl(r2Client, command, { expiresIn })
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
}
