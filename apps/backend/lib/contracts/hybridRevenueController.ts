import { Address, keccak256, toBytes } from 'viem'

// Helper function to parse book ID from format "authorAddress/bookSlug"
export function parseBookId(bookId: string): { authorAddress: Address; bookSlug: string; bytes32Id: `0x${string}` } {
  const [authorAddress, bookSlug] = bookId.split('/')
  if (!authorAddress || !bookSlug) {
    throw new Error('Invalid book ID format. Expected: authorAddress/bookSlug')
  }
  
  // Create a deterministic bytes32 ID by hashing the book ID string
  const bytes32Id = keccak256(toBytes(bookId))
  
  return {
    authorAddress: authorAddress as Address,
    bookSlug,
    bytes32Id
  }
}