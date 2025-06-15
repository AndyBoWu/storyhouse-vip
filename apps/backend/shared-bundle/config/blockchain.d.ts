/**
 * @fileoverview Blockchain Configuration for Story Protocol Integration
 * Handles environment variables, network settings, and gas optimization
 */
import type { Address } from 'viem';
import type { StoryProtocolConfig } from '../types/ip';
export interface BlockchainConfig {
    rpcUrl: string;
    chainId: number;
    chainName: string;
    explorerUrl: string;
    privateKey?: string;
    account?: any;
    maxGasPrice: bigint;
    maxGasLimit: number;
    gasBufferPercentage: number;
    contracts: {
        storyNftContract?: Address;
        ipAssetRegistry?: Address;
        licensingModule?: Address;
        royaltyModule?: Address;
        disputeModule?: Address;
    };
    isDevelopment: boolean;
    enableLogging: boolean;
    enableGasReporting: boolean;
}
/**
 * Get blockchain configuration from environment variables
 */
export declare function getBlockchainConfig(): BlockchainConfig;
/**
 * Convert blockchain config to Story Protocol config
 */
export declare function getStoryProtocolConfig(): StoryProtocolConfig;
/**
 * Validate blockchain configuration
 */
export declare function validateBlockchainConfig(): {
    isValid: boolean;
    errors: string[];
};
/**
 * Gas estimation utilities
 */
export declare function calculateGasWithBuffer(estimatedGas: bigint, bufferPercentage?: number): bigint;
export declare function formatGasPrice(gasPrice: bigint): string;
/**
 * Network utilities
 */
export declare function getNetworkName(chainId: number): string;
export declare function getExplorerUrl(chainId: number): string;
/**
 * Development utilities
 */
export declare function logBlockchainOperation(operation: string, details: Record<string, any>, config: BlockchainConfig): void;
export declare function logGasUsage(operation: string, gasUsed: bigint, gasPrice: bigint, config: BlockchainConfig): void;
//# sourceMappingURL=blockchain.d.ts.map