import { Address } from 'viem'
import HybridRevenueControllerABI from './HybridRevenueController.abi.json'

// HybridRevenueController contract address from blockchain config
export const HYBRID_REVENUE_CONTROLLER_ADDRESS = '0xd1F7e8c6FD77dADbE946aE3e4141189b39Ef7b08' as Address

// Export the ABI
export const HYBRID_REVENUE_CONTROLLER_ABI = HybridRevenueControllerABI as any

// Helper function to convert string to bytes32
export function stringToBytes32(text: string): `0x${string}` {
  // Convert string to hex and pad to 32 bytes
  const hex = Buffer.from(text, 'utf8').toString('hex')
  const padded = hex.padEnd(64, '0')
  return `0x${padded}` as `0x${string}`
}

// Helper function to parse book ID from format "authorAddress/bookSlug"
export function parseBookId(bookId: string): { authorAddress: Address; bookSlug: string; bytes32Id: `0x${string}` } {
  const [authorAddress, bookSlug] = bookId.split('/')
  if (!authorAddress || !bookSlug) {
    throw new Error('Invalid book ID format. Expected: authorAddress/bookSlug')
  }
  
  // Create a deterministic bytes32 ID from the book ID string
  const bytes32Id = stringToBytes32(bookId)
  
  return {
    authorAddress: authorAddress as Address,
    bookSlug,
    bytes32Id
  }
}