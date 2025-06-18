import { keccak256, toBytes } from 'viem'

// Helper function to parse book ID from format "authorAddress/bookSlug"
export function parseBookId(bookId: string): { authorAddress: `0x${string}`; bookSlug: string; bytes32Id: `0x${string}` } {
  const [authorAddress, ...slugParts] = bookId.split('/')
  const bookSlug = slugParts.join('/')
  
  if (!authorAddress || !bookSlug) {
    throw new Error('Invalid book ID format. Expected: authorAddress/bookSlug')
  }
  
  // Create a deterministic bytes32 ID by hashing the book ID string
  // This must match the frontend implementation exactly
  const bytes32Id = keccak256(toBytes(bookId))
  
  return {
    authorAddress: authorAddress as `0x${string}`,
    bookSlug,
    bytes32Id
  }
}