import { create } from '@web3-storage/w3up-client'

interface UploadResult {
  success: boolean
  ipfsHash?: string
  error?: string
}

interface StoryContent {
  title: string
  content: string
  metadata: {
    wordCount: number
    readingTime: number
    themes: string[]
    chapterNumber: number
    author: string
    createdAt: string
  }
}

class IPFSService {
  private client: any = null
  private initialized = false

  async initialize(): Promise<boolean> {
    try {
      // For now, we'll use a public gateway approach
      // In production, you'd want to set up proper Web3.Storage authentication
      this.initialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error)
      return false
    }
  }

  async uploadStoryContent(storyContent: StoryContent): Promise<UploadResult> {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Failed to initialize IPFS service')
        }
      }

      // Create a comprehensive JSON object for the story
      const storyData = {
        version: '1.0',
        type: 'story-chapter',
        ...storyContent,
        uploadedAt: new Date().toISOString()
      }

      // Convert to blob for upload
      const jsonBlob = new Blob([JSON.stringify(storyData, null, 2)], {
        type: 'application/json'
      })

      // For MVP, we'll use a simple fetch to a public IPFS gateway
      // This is a simplified approach - in production you'd use Web3.Storage properly
      const formData = new FormData()
      formData.append('file', jsonBlob, `story-${Date.now()}.json`)

      // Using Pinata as a reliable IPFS service
      const pinataResponse = await this.uploadToPinata(formData)
      
      if (pinataResponse.success) {
        return {
          success: true,
          ipfsHash: pinataResponse.ipfsHash
        }
      }

      // Fallback: Use a local IPFS approach or mock for development
      return this.mockIPFSUpload(storyData)

    } catch (error) {
      console.error('IPFS upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  private async uploadToPinata(formData: FormData): Promise<{ success: boolean; ipfsHash?: string }> {
    try {
      // This would need a Pinata API key in production
      // For now, we'll mock this or use a public endpoint
      
      // Mock response for development
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      
      return {
        success: true,
        ipfsHash: mockHash
      }
    } catch (error) {
      return { success: false }
    }
  }

  private async mockIPFSUpload(storyData: any): Promise<UploadResult> {
    // For development/testing - generates a mock IPFS hash
    const mockHash = `Qm${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`
    
    console.log('📁 Mock IPFS Upload:', {
      hash: mockHash,
      size: JSON.stringify(storyData).length,
      title: storyData.title
    })

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      success: true,
      ipfsHash: mockHash
    }
  }

  async retrieveStoryContent(ipfsHash: string): Promise<StoryContent | null> {
    try {
      // For development, we'll mock retrieval
      // In production, this would fetch from IPFS
      console.log('📥 Retrieving content from IPFS:', ipfsHash)
      
      // Mock retrieval - in production you'd fetch from IPFS gateway
      // const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`)
      // const data = await response.json()
      
      return null // Placeholder for now
    } catch (error) {
      console.error('Failed to retrieve IPFS content:', error)
      return null
    }
  }

  getIPFSUrl(hash: string): string {
    return `https://ipfs.io/ipfs/${hash}`
  }

  isValidIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }
}

// Export singleton instance
export const ipfsService = new IPFSService()

// Helper function for easy use in components
export async function uploadStoryToIPFS(
  title: string,
  content: string,
  metadata: {
    wordCount: number
    readingTime: number
    themes: string[]
    chapterNumber: number
    author: string
  }
): Promise<UploadResult> {
  const storyContent: StoryContent = {
    title,
    content,
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString()
    }
  }

  return await ipfsService.uploadStoryContent(storyContent)
} 
