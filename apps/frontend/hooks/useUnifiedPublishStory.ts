import { useState, useEffect } from 'react'

// Fix BigInt serialization globally for this module
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function() {
    return this.toString()
  }
}
import { useAccount } from 'wagmi'
import { Address, Hash } from 'viem'
import { apiClient } from '@/lib/api-client'
import { PublishResult } from '@/lib/contracts/storyProtocol'
import { createClientStoryProtocolService } from '@/lib/services/storyProtocolClient'
import { useBookRegistration } from './useBookRegistration'

interface StoryData {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
  chapterNumber: number
  contentUrl?: string // R2 URL from story generation
}

interface PublishOptions {
  publishingOption: 'simple' | 'protected'
  chapterPrice: number
  ipRegistration?: boolean
  licenseTier: 'free' | 'reading' | 'premium' | 'exclusive'
}

type UnifiedPublishStep =
  | 'idle'
  | 'checking-unified-support'
  | 'unified-registration'
  | 'generating-metadata'
  | 'blockchain-transaction'
  | 'saving-to-storage'
  | 'setting-attribution'
  | 'success'
  | 'error'

interface UnifiedPublishResult extends PublishResult {
  method?: 'unified' | 'legacy'
  gasOptimized?: boolean
  metadataUri?: string
}

export function useUnifiedPublishStory() {
  const [currentStep, setCurrentStep] = useState<UnifiedPublishStep>('idle')
  const [publishResult, setPublishResult] = useState<UnifiedPublishResult | null>(null)
  const [isUnifiedSupported, setIsUnifiedSupported] = useState<boolean | null>(null)
  const [tokenId, setTokenId] = useState<bigint | null>(null)
  const [ipAssetId, setIPAssetId] = useState<Address | null>(null)

  const { address } = useAccount()
  const { setChapterAttribution, checkBookRegistration, registerBook } = useBookRegistration()

  // Check unified registration support on mount
  useEffect(() => {
    checkUnifiedSupport()
  }, [])

  const checkUnifiedSupport = async () => {
    try {
      const response = await apiClient.checkUnifiedRegistration()
      setIsUnifiedSupported(response.enabled && response.available)
      console.log('🔍 Unified registration support:', response)
    } catch (error) {
      console.warn('⚠️ Could not check unified registration support:', error)
      setIsUnifiedSupported(false)
    }
  }

  const publishStoryUnified = async (
    storyData: StoryData, 
    options: PublishOptions, 
    bookId?: string
  ): Promise<UnifiedPublishResult> => {
    console.log('🚀 publishStoryUnified called with:', {
      storyData,
      options,
      bookId,
      address
    })
    
    if (!address) {
      const error = 'Wallet not connected'
      setPublishResult({ success: false, error })
      return { success: false, error }
    }

    try {
      setCurrentStep('checking-unified-support')

      // Always use unified registration for IP-protected content
      if (options.ipRegistration && options.publishingOption === 'protected') {
        console.log('🚀 Using unified registration (single transaction)')
        return await executeUnifiedRegistration(storyData, options, bookId)
      } else {
        // Simple publishing without IP registration
        throw new Error('Simple publishing without IP registration is not supported. Please enable IP registration.')
      }

    } catch (error) {
      console.error('❌ Publishing failed:', error)
      setCurrentStep('error')

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Handle common errors
      if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.'
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Operation timed out. Please check your connection and try again.'
      }

      const result: UnifiedPublishResult = {
        success: false,
        error: errorMessage
      }
      setPublishResult(result)
      return result
    }
  }

  const executeUnifiedRegistration = async (
    storyData: StoryData,
    options: PublishOptions,
    bookId?: string
  ): Promise<UnifiedPublishResult> => {
    setCurrentStep('unified-registration')
    console.log('🔗 Executing unified IP registration on client-side...')

    const nftContract = process.env.NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT as Address

    if (!nftContract) {
      throw new Error('SPG NFT Contract not configured')
    }

    // Check if this is a derivative book that needs registration
    let bookMetadata = null
    let isDerivativeNeedingRegistration = false
    let parentIpAssetId: string | null = null
    let parentLicenseTermsId: string | null = null
    
    if (bookId) {
      try {
        const bookData = await apiClient.getBookById(bookId)
        bookMetadata = bookData
        
        // Check if this is a derivative book without IP registration
        if (bookMetadata.parentBook && !bookMetadata.ipAssetId) {
          console.log('🌿 Detected unregistered derivative book')
          
          // Check if this is the first new chapter (after inherited chapters)
          const inheritedChapterCount = Object.keys(bookMetadata.chapterMap || {}).length
          const isFirstNewChapter = storyData.chapterNumber === inheritedChapterCount + 1
          
          if (isFirstNewChapter) {
            console.log('📝 This is the first new chapter in the derivative - checking parent registration')
            
            // Get parent book's IP registration info
            const parentBookData = await apiClient.getBookById(bookMetadata.parentBook)
            if (parentBookData.ipAssetId && parentBookData.licenseTermsId) {
              isDerivativeNeedingRegistration = true
              parentIpAssetId = parentBookData.ipAssetId
              parentLicenseTermsId = parentBookData.licenseTermsId
              console.log('✅ Parent book is registered, will register derivative', {
                parentIpAssetId,
                parentLicenseTermsId
              })
            } else {
              console.log('⚠️ Parent book not registered on chain, skipping derivative registration')
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch book metadata:', error)
      }
    }

    // Step 1: Generate and store metadata via backend
    setCurrentStep('generating-metadata')
    console.log('📝 Generating metadata...')
    
    const storyForMetadata = {
      id: `${address!.toLowerCase()}-${Date.now()}`,
      title: storyData.title,
      content: storyData.content,
      author: address!,
      genre: storyData.themes[0] || 'Fiction',
      mood: storyData.themes[1] || 'Neutral',
      createdAt: new Date().toISOString()
    }

    let metadataUri: string | undefined
    let metadataHash: Hash | undefined

    try {
      // Call backend to generate and store metadata only
      const metadataResult = await apiClient.generateIPMetadata({
        story: storyForMetadata,
        licenseTier: options.licenseTier
      })

      if (metadataResult.success && metadataResult.data) {
        metadataUri = metadataResult.data.metadataUri
        metadataHash = metadataResult.data.metadataHash as Hash
        console.log('✅ Metadata generated:', { uri: metadataUri, hash: metadataHash })
      }
    } catch (error) {
      console.warn('⚠️ Failed to generate metadata, proceeding without:', error)
    }

    // Step 2: Execute blockchain transaction with user's wallet
    setCurrentStep('blockchain-transaction')
    console.log('🔗 Executing blockchain transaction with user wallet...')

    // Initialize client-side Story Protocol service
    const storyProtocolClient = createClientStoryProtocolService(address!)
    
    try {
      let registrationResult
      
      if (isDerivativeNeedingRegistration && parentIpAssetId && parentLicenseTermsId) {
        // Register as derivative
        console.log('🌿 Registering as derivative of parent IP...')
        registrationResult = await storyProtocolClient.mintAndRegisterDerivativeWithPilTerms({
          spgNftContract: nftContract,
          parentIpId: parentIpAssetId as Address,
          parentLicenseTermsId: parentLicenseTermsId,
          metadata: {
            ipMetadataURI: metadataUri,
            ipMetadataHash: metadataHash,
            nftMetadataURI: metadataUri,
            nftMetadataHash: metadataHash
          },
          licenseTier: options.licenseTier,
          recipient: address!
        })
        console.log('✅ Derivative registration complete!')
        
        // Update book metadata with IP registration info
        if (bookId && registrationResult.success && registrationResult.ipId) {
          try {
            console.log('📝 Updating book metadata with IP registration...')
            await apiClient.updateBookIP(bookId, {
              ipAssetId: registrationResult.ipId as string,
              transactionHash: registrationResult.txHash as string,
              licenseTermsId: parentLicenseTermsId
            })
            console.log('✅ Book metadata updated with IP registration')
          } catch (updateError) {
            console.warn('⚠️ Failed to update book metadata (non-critical):', updateError)
          }
        }
      } else {
        // Regular registration
        registrationResult = await storyProtocolClient.mintAndRegisterWithPilTerms({
          spgNftContract: nftContract,
          metadata: {
            ipMetadataURI: metadataUri,
            ipMetadataHash: metadataHash,
            nftMetadataURI: metadataUri,
            nftMetadataHash: metadataHash
          },
          licenseTier: options.licenseTier,
          recipient: address!
        })
      }

      const registeredIPAssetId = registrationResult.ipId as Address
      const transactionHash = registrationResult.txHash as Hash
      const mintedTokenId = BigInt(registrationResult.tokenId || Date.now())

      setTokenId(mintedTokenId)
      setIPAssetId(registeredIPAssetId)

      console.log('✅ Unified registration complete!')
      console.log('🎫 Token ID:', mintedTokenId.toString())
      console.log('📝 IP Asset ID:', registeredIPAssetId)
      console.log('🔗 Transaction:', transactionHash)
      console.log('📄 License Terms ID:', registrationResult.licenseTermsId)
      console.log('🌐 Metadata URI:', metadataUri)

      // Step 3: Save chapter content to R2 storage
      setCurrentStep('saving-to-storage')
      console.log('💾 Saving chapter content to R2 storage...')
      
      // Ensure bookId is in the correct format: authorAddress/slug
      let finalBookId = bookId
      if (!finalBookId) {
        // If no bookId provided, create one with proper format
        const slug = storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        finalBookId = `${address!.toLowerCase()}/${slug}`
      } else if (!finalBookId.includes('/')) {
        // If bookId doesn't have slash, it's likely in wrong format, fix it
        // Extract author address and slug from the bookId
        const parts = finalBookId.split('-')
        if (parts[0].startsWith('0x') && parts[0].length === 42) {
          // Format: 0xaddress-slug-parts -> 0xaddress/slug-parts
          const authorAddr = parts[0]
          const slug = parts.slice(1).join('-')
          finalBookId = `${authorAddr}/${slug}`
        }
      }
      
      const saveResult = await apiClient.saveBookChapter(finalBookId, {
        bookId: finalBookId,
        chapterNumber: storyData.chapterNumber,
        title: storyData.title,
        content: storyData.content,
        wordCount: storyData.wordCount,
        readingTime: storyData.readingTime,
        authorAddress: address!.toLowerCase(),
        authorName: `${address!.slice(-4)}`,
        ipAssetId: registeredIPAssetId,
        transactionHash: transactionHash,
        licenseTermsId: registrationResult.licenseTermsId ? registrationResult.licenseTermsId.toString() : undefined,
        genre: storyData.themes[0] || 'General',
        generationMethod: 'human' as const
      })

      console.log('✅ Chapter content saved to R2:', saveResult.data?.contentUrl)

      // Step 4: Set chapter attribution for revenue sharing (for paid chapters)
      if (storyData.chapterNumber > 3) {
        setCurrentStep('setting-attribution')
        console.log('💰 Setting chapter attribution for revenue sharing...')
        
        try {
          // First ensure the book is registered
          const isBookRegistered = await checkBookRegistration(finalBookId)
          if (!isBookRegistered) {
            console.log('📚 Book not registered, registering first...')
            
            // Show alert to user about book registration
            alert('📚 Book Registration Required\n\nYour book needs to be registered for revenue sharing. You will see a MetaMask transaction request.')
            
            const registerResult = await registerBook({
              bookId: finalBookId,
              totalChapters: 100, // Current contract maximum (will be increased when contract is redeployed)
              isDerivative: false,
              ipfsMetadataHash: metadataUri || ''
            })
            
            if (!registerResult.success) {
              // This is critical for paid chapters - throw error to stop publish
              throw new Error(`Book registration failed: ${registerResult.error || 'Unknown error'}. Cannot publish paid chapters without revenue registration.`)
            } else {
              // Wait a moment for registration to confirm
              console.log('⏳ Waiting for book registration to confirm...')
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
          }
          
          // Set chapter attribution with pricing
          // For chapters 1-3: price is 0, for 4+: use the specified price (default 0.5 TIP)
          const chapterPrice = storyData.chapterNumber <= 3 ? '0' : (options.chapterPrice || 0.5).toString()
          
          console.log('📝 Setting attribution with price:', {
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            price: `${chapterPrice} TIP`,
            originalAuthor: address
          })
          
          // Alert user about the second transaction
          alert(`💰 Chapter Pricing Setup\n\nNow you need to set the unlock price (${chapterPrice} TIP) for this chapter. You will see another MetaMask transaction request.`)
          
          const attributionResult = await setChapterAttribution({
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            originalAuthor: address!,
            unlockPrice: chapterPrice,
            isOriginalContent: true
          })
          
          if (attributionResult.pending) {
            console.log('⏳ Attribution transaction initiated:', attributionResult.message)
            
            // For paid chapters, give user a chance to complete the transaction
            if (storyData.chapterNumber > 3) {
              // Wait a bit for user to interact with wallet
              console.log('⏳ Waiting for user to approve transaction in wallet...')
              await new Promise(resolve => setTimeout(resolve, 5000)) // Give user 5 seconds to approve
              
              // Then start polling for confirmation
              let attributionSet = false
              let attempts = 0
              const maxAttempts = 25 // 25 seconds additional wait
              
              console.log('🔍 Checking if attribution was set on blockchain...')
              
              while (!attributionSet && attempts < maxAttempts) {
                attempts++
                
                try {
                  // Check attribution directly from blockchain
                  const checkResult = await apiClient.get(
                    `/books/${encodeURIComponent(finalBookId)}/chapter/${storyData.chapterNumber}/attribution`
                  )
                  
                  // Check if attribution is set on blockchain
                  if (checkResult && checkResult.attribution && checkResult.attribution.isSet) {
                    attributionSet = true
                    console.log('✅ Chapter attribution confirmed on blockchain!', checkResult.attribution)
                    break
                  }
                } catch (checkError) {
                  // Attribution not yet set, continue waiting
                  if (attempts % 5 === 0) {
                    console.log(`Still waiting for attribution confirmation... (${attempts}/${maxAttempts})`)
                  }
                }
                
                // Wait 1 second before next check
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
              
              if (!attributionSet) {
                // Attribution not confirmed yet, but don't fail the publish
                console.warn('⚠️ Attribution transaction may still be pending')
                alert(
                  '⚠️ Chapter Pricing Transaction Pending\n\n' +
                  'Your chapter has been published, but the pricing transaction may still be processing.\n\n' +
                  'Please check your wallet to ensure the transaction was submitted. ' +
                  'Readers will not be able to unlock this chapter until the pricing is confirmed on the blockchain.'
                )
              }
            } else {
              // For free chapters, just continue
              console.log('📝 Free chapter - attribution transaction initiated, continuing...')
            }
          } else if (attributionResult.success && !attributionResult.pending) {
            console.log('✅ Chapter attribution set successfully!')
          } else if (!attributionResult.success) {
            // Failed to initiate transaction
            throw new Error(`Failed to set chapter pricing: ${attributionResult.error || 'Unknown error'}. The transaction could not be initiated.`)
          }
          
        } catch (attributionError) {
          console.error('❌ Attribution setting failed:', attributionError)
          
          // For paid chapters, this is a critical error that should stop publishing
          if (storyData.chapterNumber > 3) {
            // Clean up by trying to remove the saved chapter
            console.log('🧹 Attempting to clean up saved chapter due to attribution failure...')
            
            try {
              // Delete the chapter from backend
              await apiClient.delete(`/chapters/${encodeURIComponent(finalBookId)}/${storyData.chapterNumber}`)
              console.log('✅ Chapter cleaned up successfully')
            } catch (cleanupError) {
              console.error('❌ Failed to clean up chapter:', cleanupError)
            }
            
            // Re-throw with user-friendly message
            throw new Error(
              `Failed to set chapter pricing. The chapter was not published. ${attributionError instanceof Error ? attributionError.message : 'Unknown error'}. ` +
              `Please try again or contact support if the issue persists.`
            )
          } else {
            // For free chapters, log but continue
            console.warn('⚠️ Attribution failed for free chapter, continuing...')
          }
        }
      } else {
        console.log('📝 Free chapter (1-3) - setting attribution with 0 price')
        // Even for free chapters, we should set attribution to track the author
        try {
          const attributionResult = await setChapterAttribution({
            bookId: finalBookId,
            chapterNumber: storyData.chapterNumber,
            originalAuthor: address!,
            unlockPrice: '0',
            isOriginalContent: true
          })
          
          if (!attributionResult.success) {
            console.warn('⚠️ Failed to set attribution for free chapter:', attributionResult.error)
          }
        } catch (error) {
          console.warn('⚠️ Non-critical: Failed to set attribution for free chapter', error)
        }
      }

      // Success!
      setCurrentStep('success')
      const unifiedResult: UnifiedPublishResult = {
        success: true,
        method: 'unified',
        gasOptimized: true,
        data: {
          transactionHash,
          ipAssetId: registeredIPAssetId,
          tokenId: mintedTokenId,
          licenseTermsId: registrationResult.licenseTermsId ? BigInt(registrationResult.licenseTermsId) : undefined,
          contentUrl: storyData.contentUrl,
          explorerUrl: `https://aeneid.storyscan.io/tx/${transactionHash}`
        },
        metadataUri: metadataUri
      }

      setPublishResult(unifiedResult)
      console.log('🎉 Unified publishing complete!', JSON.stringify(unifiedResult, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))
      return unifiedResult
    } catch (error) {
      console.error('❌ Unified registration failed:', error)
      throw error
    }
  }


  const reset = () => {
    setCurrentStep('idle')
    setPublishResult(null)
    setTokenId(null)
    setIPAssetId(null)
  }

  const isPublishing = currentStep !== 'idle' && currentStep !== 'success' && currentStep !== 'error'

  return {
    publishStory: publishStoryUnified,
    reset,
    isPublishing,
    currentStep,
    publishResult,
    tokenId,
    ipAssetId,
    isUnifiedSupported,
    checkUnifiedSupport
  }
}