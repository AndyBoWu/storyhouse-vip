/**
 * Book Ownership Service
 * Implements the "One Book = One IP" model
 * First author to publish chapters 1-3 owns the book IP
 */

import { BookMetadata, BookId, AuthorAddress } from '../types/book'
import { BookStorageService } from '../storage/bookStorage'

export interface BookOwnershipInfo {
  bookId: BookId
  ipOwner: AuthorAddress | null
  ownershipEstablished: boolean
  ownershipReason?: 'first_three_chapters' | 'single_chapter' | 'not_established'
  chapterAuthors: {
    [chapterNum: string]: AuthorAddress
  }
}

export class BookOwnershipService {
  /**
   * Determine the IP owner of a book based on chapter authorship
   * Rule: First author to publish chapters 1-3 owns the book IP
   */
  static async determineBookOwner(bookId: BookId): Promise<BookOwnershipInfo> {
    try {
      console.log('🔍 BookOwnershipService: Determining owner for book:', bookId)
      const bookMetadata = await BookStorageService.getBookMetadata(bookId)
      
      // For derivative books, there is no book-level IP owner
      if (bookMetadata.parentBook) {
        return {
          bookId,
          ipOwner: null,
          ownershipEstablished: false,
          ownershipReason: 'not_established',
          chapterAuthors: {}
        }
      }
      
      // Get authors of first 3 chapters
      const chapterAuthors: { [chapterNum: string]: AuthorAddress } = {}
      const firstThreeAuthors = new Set<AuthorAddress>()
      
      for (let i = 1; i <= 3; i++) {
        const chapterKey = `ch${i}`
        if (bookMetadata.chapterMap[chapterKey]) {
          try {
            // Load chapter metadata to get the actual author
            const chapterNumber = i
            const chapter = await BookStorageService.getChapterContent(bookId, chapterNumber)
            if (chapter) {
              const authorAddress = chapter.authorAddress.toLowerCase() as AuthorAddress
              chapterAuthors[chapterKey] = authorAddress
              firstThreeAuthors.add(authorAddress)
            }
          } catch (error) {
            console.warn(`Could not load chapter ${i} for ownership check:`, error)
          }
        }
      }
      
      // Check if all first 3 chapters exist
      const hasFirstThreeChapters = 
        bookMetadata.chapterMap.ch1 && 
        bookMetadata.chapterMap.ch2 && 
        bookMetadata.chapterMap.ch3
      
      // If all first 3 chapters are by the same author, they own the book IP
      if (hasFirstThreeChapters && firstThreeAuthors.size === 1) {
        const ipOwner = Array.from(firstThreeAuthors)[0]
        return {
          bookId,
          ipOwner,
          ownershipEstablished: true,
          ownershipReason: 'first_three_chapters',
          chapterAuthors
        }
      }
      
      // If only one chapter exists and it's chapter 1, that author will own the IP
      // (once they publish chapters 2 and 3)
      if (Object.keys(chapterAuthors).length === 1 && chapterAuthors.ch1) {
        return {
          bookId,
          ipOwner: chapterAuthors.ch1,
          ownershipEstablished: false,
          ownershipReason: 'single_chapter',
          chapterAuthors
        }
      }
      
      // Otherwise, ownership is not yet established
      return {
        bookId,
        ipOwner: null,
        ownershipEstablished: false,
        ownershipReason: 'not_established',
        chapterAuthors
      }
      
    } catch (error) {
      console.error('Error determining book owner:', error)
      return {
        bookId,
        ipOwner: null,
        ownershipEstablished: false,
        ownershipReason: 'not_established',
        chapterAuthors: {}
      }
    }
  }
  
  /**
   * Check if a given author can register the book IP
   * They must be the author of chapters 1-3
   */
  static async canAuthorRegisterBookIP(
    bookId: BookId, 
    authorAddress: AuthorAddress
  ): Promise<boolean> {
    const ownership = await this.determineBookOwner(bookId)
    return ownership.ownershipEstablished && 
           ownership.ipOwner === authorAddress
  }
  
  /**
   * Check if book IP registration is pending
   * (i.e., waiting for chapters 2 and 3 to be published by the same author)
   */
  static async isBookIPRegistrationPending(bookId: BookId): Promise<boolean> {
    const ownership = await this.determineBookOwner(bookId)
    return !ownership.ownershipEstablished && 
           ownership.ownershipReason === 'single_chapter'
  }
}