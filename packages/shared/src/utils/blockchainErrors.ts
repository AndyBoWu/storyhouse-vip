/**
 * @fileoverview Blockchain Error Handling Utilities
 * Provides comprehensive error classification and user-friendly messages
 */

export enum BlockchainErrorType {
  // Network Errors
  RPC_ERROR = 'RPC_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',

  // Transaction Errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  GAS_LIMIT_EXCEEDED = 'GAS_LIMIT_EXCEEDED',
  TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  REPLACEMENT_UNDERPRICED = 'REPLACEMENT_UNDERPRICED',

  // Contract Errors
  CONTRACT_NOT_DEPLOYED = 'CONTRACT_NOT_DEPLOYED',
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  INVALID_CONTRACT_ADDRESS = 'INVALID_CONTRACT_ADDRESS',

  // IP Asset Specific Errors
  IP_ASSET_ALREADY_REGISTERED = 'IP_ASSET_ALREADY_REGISTERED',
  UNAUTHORIZED_IP_OPERATION = 'UNAUTHORIZED_IP_OPERATION',
  LICENSE_ALREADY_EXISTS = 'LICENSE_ALREADY_EXISTS',
  INVALID_LICENSE_TERMS = 'INVALID_LICENSE_TERMS',

  // Wallet/Account Errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Configuration Errors
  INVALID_CHAIN_ID = 'INVALID_CHAIN_ID',
  SDK_NOT_INITIALIZED = 'SDK_NOT_INITIALIZED',
  MISSING_ENVIRONMENT_VARIABLES = 'MISSING_ENVIRONMENT_VARIABLES',

  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface BlockchainError {
  type: BlockchainErrorType
  message: string
  userMessage: string
  code?: string
  transactionHash?: string
  blockNumber?: number
  gasUsed?: bigint
  retryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Parse blockchain error and return structured error information
 */
export function parseBlockchainError(error: any): BlockchainError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error'
  const errorCode = error?.code || error?.status

  // Network Errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorCode === 'NETWORK_ERROR') {
    return {
      type: BlockchainErrorType.NETWORK_UNAVAILABLE,
      message: errorMessage,
      userMessage: 'Network connection failed. Please check your internet connection and try again.',
      code: errorCode,
      retryable: true,
      severity: 'medium'
    }
  }

  // RPC Errors
  if (errorMessage.includes('RPC') || errorCode === -32603) {
    return {
      type: BlockchainErrorType.RPC_ERROR,
      message: errorMessage,
      userMessage: 'Blockchain RPC error. The network may be congested. Please try again later.',
      code: errorCode,
      retryable: true,
      severity: 'medium'
    }
  }

  // Insufficient Funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
    return {
      type: BlockchainErrorType.INSUFFICIENT_FUNDS,
      message: errorMessage,
      userMessage: 'Insufficient funds for this transaction. Please add more tokens to your wallet.',
      code: errorCode,
      retryable: false,
      severity: 'high'
    }
  }

  // Gas Limit Exceeded
  if (errorMessage.includes('gas') && (errorMessage.includes('limit') || errorMessage.includes('exceeded'))) {
    return {
      type: BlockchainErrorType.GAS_LIMIT_EXCEEDED,
      message: errorMessage,
      userMessage: 'Gas limit exceeded. This operation requires more gas than allowed.',
      code: errorCode,
      retryable: true,
      severity: 'medium'
    }
  }

  // Transaction Reverted
  if (errorMessage.includes('revert') || errorMessage.includes('reverted')) {
    return {
      type: BlockchainErrorType.TRANSACTION_REVERTED,
      message: errorMessage,
      userMessage: 'Transaction was reverted. This usually means the operation violated a contract rule.',
      code: errorCode,
      transactionHash: error?.transactionHash,
      retryable: false,
      severity: 'high'
    }
  }

  // Nonce Issues
  if (errorMessage.includes('nonce too low') || errorCode === 'NONCE_EXPIRED') {
    return {
      type: BlockchainErrorType.NONCE_TOO_LOW,
      message: errorMessage,
      userMessage: 'Transaction nonce error. Please reset your wallet and try again.',
      code: errorCode,
      retryable: true,
      severity: 'medium'
    }
  }

  // Replacement Underpriced
  if (errorMessage.includes('replacement transaction underpriced')) {
    return {
      type: BlockchainErrorType.REPLACEMENT_UNDERPRICED,
      message: errorMessage,
      userMessage: 'Transaction replacement failed. Please increase the gas price and try again.',
      code: errorCode,
      retryable: true,
      severity: 'low'
    }
  }

  // Contract Errors
  if (errorMessage.includes('contract') && errorMessage.includes('not deployed')) {
    return {
      type: BlockchainErrorType.CONTRACT_NOT_DEPLOYED,
      message: errorMessage,
      userMessage: 'Smart contract not found. Please check the contract address.',
      code: errorCode,
      retryable: false,
      severity: 'critical'
    }
  }

  // IP Asset Specific Errors
  if (errorMessage.includes('already registered') || errorMessage.includes('IP asset exists')) {
    return {
      type: BlockchainErrorType.IP_ASSET_ALREADY_REGISTERED,
      message: errorMessage,
      userMessage: 'This content is already registered as an IP asset.',
      code: errorCode,
      retryable: false,
      severity: 'medium'
    }
  }

  if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
    return {
      type: BlockchainErrorType.UNAUTHORIZED_IP_OPERATION,
      message: errorMessage,
      userMessage: 'You are not authorized to perform this IP operation.',
      code: errorCode,
      retryable: false,
      severity: 'high'
    }
  }

  // Wallet/Account Errors
  if (errorMessage.includes('wallet') || errorMessage.includes('account')) {
    return {
      type: BlockchainErrorType.WALLET_NOT_CONNECTED,
      message: errorMessage,
      userMessage: 'Wallet connection error. Please reconnect your wallet and try again.',
      code: errorCode,
      retryable: true,
      severity: 'high'
    }
  }

  // Default Unknown Error
  return {
    type: BlockchainErrorType.UNKNOWN_ERROR,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    code: errorCode,
    retryable: true,
    severity: 'medium'
  }
}

/**
 * Get retry strategy for different error types
 */
export function getRetryStrategy(errorType: BlockchainErrorType): {
  shouldRetry: boolean
  maxRetries: number
  baseDelay: number
  backoffMultiplier: number
} {
  switch (errorType) {
    case BlockchainErrorType.NETWORK_TIMEOUT:
    case BlockchainErrorType.NETWORK_UNAVAILABLE:
    case BlockchainErrorType.RPC_ERROR:
      return {
        shouldRetry: true,
        maxRetries: 3,
        baseDelay: 2000, // 2 seconds
        backoffMultiplier: 2
      }

    case BlockchainErrorType.GAS_LIMIT_EXCEEDED:
    case BlockchainErrorType.NONCE_TOO_LOW:
    case BlockchainErrorType.REPLACEMENT_UNDERPRICED:
      return {
        shouldRetry: true,
        maxRetries: 2,
        baseDelay: 1000, // 1 second
        backoffMultiplier: 1.5
      }

    case BlockchainErrorType.INSUFFICIENT_FUNDS:
    case BlockchainErrorType.TRANSACTION_REVERTED:
    case BlockchainErrorType.IP_ASSET_ALREADY_REGISTERED:
    case BlockchainErrorType.UNAUTHORIZED_IP_OPERATION:
      return {
        shouldRetry: false,
        maxRetries: 0,
        baseDelay: 0,
        backoffMultiplier: 1
      }

    default:
      return {
        shouldRetry: true,
        maxRetries: 1,
        baseDelay: 1000,
        backoffMultiplier: 1
      }
  }
}

/**
 * Calculate delay for retry attempt
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  backoffMultiplier: number
): number {
  return baseDelay * Math.pow(backoffMultiplier, attempt - 1)
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: BlockchainError): string {
  return `[${error.type}] ${error.message} | User Message: ${error.userMessage} | Retryable: ${error.retryable} | Severity: ${error.severity}`
}

/**
 * Check if error is gas-related
 */
export function isGasError(errorType: BlockchainErrorType): boolean {
  return [
    BlockchainErrorType.GAS_LIMIT_EXCEEDED,
    BlockchainErrorType.INSUFFICIENT_FUNDS
  ].includes(errorType)
}

/**
 * Check if error is network-related
 */
export function isNetworkError(errorType: BlockchainErrorType): boolean {
  return [
    BlockchainErrorType.RPC_ERROR,
    BlockchainErrorType.NETWORK_TIMEOUT,
    BlockchainErrorType.NETWORK_UNAVAILABLE
  ].includes(errorType)
}

/**
 * Check if error is critical (should halt operation)
 */
export function isCriticalError(error: BlockchainError): boolean {
  return error.severity === 'critical' || [
    BlockchainErrorType.CONTRACT_NOT_DEPLOYED,
    BlockchainErrorType.INVALID_CHAIN_ID,
    BlockchainErrorType.SDK_NOT_INITIALIZED
  ].includes(error.type)
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(errorType: BlockchainErrorType): string {
  switch (errorType) {
    case BlockchainErrorType.INSUFFICIENT_FUNDS:
      return 'Add more tokens to your wallet and try again'

    case BlockchainErrorType.GAS_LIMIT_EXCEEDED:
      return 'Increase gas limit or split the operation into smaller transactions'

    case BlockchainErrorType.NETWORK_UNAVAILABLE:
      return 'Check your internet connection and try again'

    case BlockchainErrorType.WALLET_NOT_CONNECTED:
      return 'Reconnect your wallet and refresh the page'

    case BlockchainErrorType.IP_ASSET_ALREADY_REGISTERED:
      return 'This content is already registered. You can view or modify the existing registration'

    case BlockchainErrorType.UNAUTHORIZED_IP_OPERATION:
      return 'Make sure you are the owner of this content or have proper permissions'

    default:
      return 'Try again in a few moments. Contact support if the problem persists'
  }
}
