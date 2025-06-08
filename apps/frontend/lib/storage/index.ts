/**
 * Storage Layer Index
 * 
 * Exports all storage utilities for the StoryHouse.vip platform
 */

export { BookStorageService, bookStorage } from './bookStorage'
export { R2Service } from '../r2'

// Re-export types for convenience
export type {
  BookMetadata,
  ChapterMetadata,
  BookStoragePath,
  ChapterStoragePath,
  AuthorAddress,
  BookId,
  ChapterId
} from '@storyhouse/shared'