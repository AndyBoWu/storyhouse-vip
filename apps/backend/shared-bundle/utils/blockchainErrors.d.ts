/**
 * @fileoverview Blockchain Error Handling Utilities
 * Provides comprehensive error classification and user-friendly messages
 */
export declare enum BlockchainErrorType {
    RPC_ERROR = "RPC_ERROR",
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
    NETWORK_UNAVAILABLE = "NETWORK_UNAVAILABLE",
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
    GAS_LIMIT_EXCEEDED = "GAS_LIMIT_EXCEEDED",
    TRANSACTION_REVERTED = "TRANSACTION_REVERTED",
    NONCE_TOO_LOW = "NONCE_TOO_LOW",
    REPLACEMENT_UNDERPRICED = "REPLACEMENT_UNDERPRICED",
    CONTRACT_NOT_DEPLOYED = "CONTRACT_NOT_DEPLOYED",
    CONTRACT_CALL_FAILED = "CONTRACT_CALL_FAILED",
    INVALID_CONTRACT_ADDRESS = "INVALID_CONTRACT_ADDRESS",
    IP_ASSET_ALREADY_REGISTERED = "IP_ASSET_ALREADY_REGISTERED",
    UNAUTHORIZED_IP_OPERATION = "UNAUTHORIZED_IP_OPERATION",
    LICENSE_ALREADY_EXISTS = "LICENSE_ALREADY_EXISTS",
    INVALID_LICENSE_TERMS = "INVALID_LICENSE_TERMS",
    WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
    INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    INVALID_CHAIN_ID = "INVALID_CHAIN_ID",
    SDK_NOT_INITIALIZED = "SDK_NOT_INITIALIZED",
    MISSING_ENVIRONMENT_VARIABLES = "MISSING_ENVIRONMENT_VARIABLES",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export interface BlockchainError {
    type: BlockchainErrorType;
    message: string;
    userMessage: string;
    code?: string;
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: bigint;
    retryable: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Parse blockchain error and return structured error information
 */
export declare function parseBlockchainError(error: any): BlockchainError;
/**
 * Get retry strategy for different error types
 */
export declare function getRetryStrategy(errorType: BlockchainErrorType): {
    shouldRetry: boolean;
    maxRetries: number;
    baseDelay: number;
    backoffMultiplier: number;
};
/**
 * Calculate delay for retry attempt
 */
export declare function calculateRetryDelay(attempt: number, baseDelay: number, backoffMultiplier: number): number;
/**
 * Format error for logging
 */
export declare function formatErrorForLogging(error: BlockchainError): string;
/**
 * Check if error is gas-related
 */
export declare function isGasError(errorType: BlockchainErrorType): boolean;
/**
 * Check if error is network-related
 */
export declare function isNetworkError(errorType: BlockchainErrorType): boolean;
/**
 * Check if error is critical (should halt operation)
 */
export declare function isCriticalError(error: BlockchainError): boolean;
/**
 * Get suggested action for error
 */
export declare function getSuggestedAction(errorType: BlockchainErrorType): string;
//# sourceMappingURL=blockchainErrors.d.ts.map