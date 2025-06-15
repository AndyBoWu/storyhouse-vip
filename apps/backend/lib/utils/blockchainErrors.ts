/**
 * Blockchain error handling utilities
 */

import { BaseError, ContractFunctionRevertedError } from 'viem'

// Custom error types for better error handling
export class BlockchainError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
    public txHash?: string
  ) {
    super(message)
    this.name = 'BlockchainError'
  }
}

export class IPRegistrationError extends BlockchainError {
  constructor(message: string, originalError?: Error, txHash?: string) {
    super(message, 'IP_REGISTRATION_FAILED', originalError, txHash)
    this.name = 'IPRegistrationError'
  }
}

export class LicenseAttachmentError extends BlockchainError {
  constructor(message: string, originalError?: Error, txHash?: string) {
    super(message, 'LICENSE_ATTACHMENT_FAILED', originalError, txHash)
    this.name = 'LicenseAttachmentError'
  }
}

export class RoyaltyClaimError extends BlockchainError {
  constructor(message: string, originalError?: Error, txHash?: string) {
    super(message, 'ROYALTY_CLAIM_FAILED', originalError, txHash)
    this.name = 'RoyaltyClaimError'
  }
}

// Error code mappings for common blockchain errors
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Transaction errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_LIMIT_EXCEEDED: 'GAS_LIMIT_EXCEEDED',
  NONCE_TOO_LOW: 'NONCE_TOO_LOW',
  REPLACEMENT_UNDERPRICED: 'REPLACEMENT_UNDERPRICED',
  
  // Contract errors
  CONTRACT_REVERT: 'CONTRACT_REVERT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Story Protocol specific errors
  IP_ALREADY_REGISTERED: 'IP_ALREADY_REGISTERED',
  INVALID_LICENSE_TERMS: 'INVALID_LICENSE_TERMS',
  UNAUTHORIZED_DERIVATIVE: 'UNAUTHORIZED_DERIVATIVE',
  INSUFFICIENT_ROYALTY_BALANCE: 'INSUFFICIENT_ROYALTY_BALANCE',
} as const

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_CODES.RPC_ERROR]: 'Blockchain network is experiencing issues. Please try again later.',
  [ERROR_CODES.TIMEOUT]: 'Transaction timed out. Please try again.',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds to complete the transaction.',
  [ERROR_CODES.GAS_LIMIT_EXCEEDED]: 'Transaction requires more gas than the limit allows.',
  [ERROR_CODES.NONCE_TOO_LOW]: 'Transaction nonce is too low. Please refresh and try again.',
  [ERROR_CODES.REPLACEMENT_UNDERPRICED]: 'Gas price is too low to replace the pending transaction.',
  [ERROR_CODES.CONTRACT_REVERT]: 'Smart contract rejected the transaction.',
  [ERROR_CODES.INVALID_ADDRESS]: 'Invalid blockchain address provided.',
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ERROR_CODES.IP_ALREADY_REGISTERED]: 'This content is already registered as an IP asset.',
  [ERROR_CODES.INVALID_LICENSE_TERMS]: 'Invalid license terms provided.',
  [ERROR_CODES.UNAUTHORIZED_DERIVATIVE]: 'You are not authorized to create derivatives of this IP.',
  [ERROR_CODES.INSUFFICIENT_ROYALTY_BALANCE]: 'Insufficient royalty balance to claim.',
} as const

// Parse blockchain errors into user-friendly format
export function parseBlockchainError(error: unknown): {
  code: string
  message: string
  details?: string
  canRetry: boolean
} {
  console.error('Parsing blockchain error:', error)

  // Handle viem errors
  if (error instanceof BaseError) {
    // Contract function reverted
    if (error instanceof ContractFunctionRevertedError) {
      const revertReason = error.data?.errorName || 'Unknown contract error'
      return {
        code: ERROR_CODES.CONTRACT_REVERT,
        message: ERROR_MESSAGES[ERROR_CODES.CONTRACT_REVERT],
        details: `Contract error: ${revertReason}`,
        canRetry: false
      }
    }

    // Network/RPC errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        canRetry: true
      }
    }

    // Gas related errors
    if (error.message.includes('gas') || error.message.includes('limit')) {
      return {
        code: ERROR_CODES.GAS_LIMIT_EXCEEDED,
        message: ERROR_MESSAGES[ERROR_CODES.GAS_LIMIT_EXCEEDED],
        canRetry: true
      }
    }

    // Insufficient funds
    if (error.message.includes('insufficient') || error.message.includes('balance')) {
      return {
        code: ERROR_CODES.INSUFFICIENT_FUNDS,
        message: ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_FUNDS],
        canRetry: false
      }
    }

    // Nonce errors
    if (error.message.includes('nonce')) {
      return {
        code: ERROR_CODES.NONCE_TOO_LOW,
        message: ERROR_MESSAGES[ERROR_CODES.NONCE_TOO_LOW],
        canRetry: true
      }
    }
  }

  // Handle our custom errors
  if (error instanceof BlockchainError) {
    return {
      code: error.code,
      message: ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message,
      details: error.originalError?.message,
      canRetry: error.code === ERROR_CODES.NETWORK_ERROR || error.code === ERROR_CODES.TIMEOUT
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: error.message,
      canRetry: true
    }
  }

  // Fallback for unknown error types
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    details: String(error),
    canRetry: true
  }
}

// Retry logic for blockchain operations
export async function retryBlockchainOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const parsedError = parseBlockchainError(error)
      
      // Don't retry if it's not a retryable error
      if (!parsedError.canRetry || i === maxRetries - 1) {
        throw error
      }

      console.log(`Blockchain operation failed (attempt ${i + 1}/${maxRetries}), retrying in ${delayMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
      // Increase delay for next retry
      delayMs *= 1.5
    }
  }

  throw lastError
}

// Check if an error is retryable
export function isRetryableError(error: unknown): boolean {
  const parsed = parseBlockchainError(error)
  return parsed.canRetry
}

// Extract transaction hash from error if available
export function extractTxHashFromError(error: unknown): string | undefined {
  if (error instanceof BlockchainError && error.txHash) {
    return error.txHash
  }

  if (error instanceof Error) {
    // Try to extract from error message
    const txHashMatch = error.message.match(/0x[a-fA-F0-9]{64}/)
    return txHashMatch?.[0]
  }

  return undefined
}

// Categorize blockchain errors for better handling
export function categorizeBlockchainError(error: unknown): {
  category: 'network' | 'contract' | 'user' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  canRetry: boolean
} {
  const parsed = parseBlockchainError(error)
  
  // Network errors
  if ([ERROR_CODES.NETWORK_ERROR, ERROR_CODES.RPC_ERROR, ERROR_CODES.TIMEOUT].includes(parsed.code as any)) {
    return { category: 'network', severity: 'medium', canRetry: true }
  }
  
  // Contract errors
  if ([ERROR_CODES.CONTRACT_REVERT, ERROR_CODES.IP_ALREADY_REGISTERED].includes(parsed.code as any)) {
    return { category: 'contract', severity: 'high', canRetry: false }
  }
  
  // User errors
  if ([ERROR_CODES.INSUFFICIENT_FUNDS, ERROR_CODES.UNAUTHORIZED].includes(parsed.code as any)) {
    return { category: 'user', severity: 'low', canRetry: false }
  }
  
  return { category: 'unknown', severity: 'medium', canRetry: parsed.canRetry }
}

// Format error for logging
export function formatErrorForLogging(error: unknown, context?: string): string {
  const parsed = parseBlockchainError(error)
  const category = categorizeBlockchainError(error)
  const txHash = extractTxHashFromError(error)
  
  let logMessage = `[${category.severity.toUpperCase()}] ${category.category.toUpperCase()}_ERROR: ${parsed.message}`
  
  if (context) {
    logMessage = `${context} - ${logMessage}`
  }
  
  if (parsed.details) {
    logMessage += ` | Details: ${parsed.details}`
  }
  
  if (txHash) {
    logMessage += ` | TxHash: ${txHash}`
  }
  
  return logMessage
}

// Check if error is critical
export function isCriticalError(error: unknown): boolean {
  const category = categorizeBlockchainError(error)
  return category.severity === 'critical'
}

// Get retry strategy based on error type
export function getRetryStrategy(error: unknown): {
  shouldRetry: boolean
  maxRetries: number
  baseDelay: number
} {
  const category = categorizeBlockchainError(error)
  
  if (!category.canRetry) {
    return { shouldRetry: false, maxRetries: 0, baseDelay: 0 }
  }
  
  switch (category.category) {
    case 'network':
      return { shouldRetry: true, maxRetries: 5, baseDelay: 1000 }
    case 'contract':
      return { shouldRetry: true, maxRetries: 2, baseDelay: 3000 }
    default:
      return { shouldRetry: true, maxRetries: 3, baseDelay: 2000 }
  }
}

// Calculate retry delay with exponential backoff
export function calculateRetryDelay(attempt: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
}