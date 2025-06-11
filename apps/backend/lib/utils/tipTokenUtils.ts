/**
 * @fileoverview TIP Token Utilities for Royalty Distribution System
 * 
 * Comprehensive utilities for TIP token operations including:
 * - Balance checking and validation
 * - Transfer operations and allowance management
 * - Batch operations for efficiency
 * - Integration with existing TIP token economics
 */

import { Address, Hash, formatEther, parseEther, createPublicClient, createWalletClient, http, getContract } from 'viem'
import { polygon } from 'viem/chains' // Story Protocol runs on Polygon-compatible chain
import { STORYHOUSE_CONTRACTS, TIP_TOKEN_ABI } from '../contracts/storyhouse'
import type { 
  TIPTokenBalance,
  TIPTokenTransfer,
  RoyaltyError
} from '../types/royalty'

// TIP Token configuration
const TIP_TOKEN_CONFIG = {
  address: STORYHOUSE_CONTRACTS.TIP_TOKEN,
  decimals: 18,
  symbol: 'TIP',
  name: 'StoryHouse TIP Token',
  
  // Economic parameters
  ethToTipRatio: 1, // 1 ETH = 1 TIP token
  minimumTransfer: parseEther('0.001'), // 0.001 TIP minimum
  maximumTransfer: parseEther('10000'), // 10,000 TIP maximum
  
  // Gas optimization
  gasLimitMultiplier: 1.2, // 20% buffer
  maxRetries: 3,
  retryDelayMs: 1000
} as const

// Platform addresses (in production, these would be environment variables)
const PLATFORM_ADDRESSES = {
  royaltyPool: '0x1111111111111111111111111111111111111111' as Address,
  rewardsPool: '0x2222222222222222222222222222222222222222' as Address,
  feeCollector: '0x3333333333333333333333333333333333333333' as Address,
  treasury: '0x4444444444444444444444444444444444444444' as Address
} as const

// Initialize blockchain clients
const publicClient = createPublicClient({
  chain: polygon, // Replace with actual Story Protocol chain
  transport: http()
})

/**
 * TIP Token service for blockchain operations and balance management
 */
export class TIPTokenService {
  private readonly tokenAddress = TIP_TOKEN_CONFIG.address
  private readonly balanceCache = new Map<Address, { balance: bigint; timestamp: number }>()
  private readonly cacheTTL = 30000 // 30 seconds

  constructor() {
    console.log('🪙 TIPTokenService initialized:', {
      tokenAddress: this.tokenAddress,
      minimumTransfer: formatEther(TIP_TOKEN_CONFIG.minimumTransfer),
      maximumTransfer: formatEther(TIP_TOKEN_CONFIG.maximumTransfer)
    })
  }

  /**
   * Get TIP token balance for an address with caching
   */
  async getBalance(address: Address, useCache: boolean = true): Promise<TIPTokenBalance> {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.balanceCache.get(address)
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
          return {
            address,
            balance: cached.balance,
            balanceFormatted: formatEther(cached.balance),
            lastUpdated: new Date(cached.timestamp),
            isValid: true
          }
        }
      }

      // For development/testing, return simulated balance
      // In production, this would make actual blockchain calls
      const simulatedBalance = this.getSimulatedBalance(address)
      
      // Cache the result
      this.balanceCache.set(address, {
        balance: simulatedBalance,
        timestamp: Date.now()
      })

      return {
        address,
        balance: simulatedBalance,
        balanceFormatted: formatEther(simulatedBalance),
        lastUpdated: new Date(),
        isValid: true
      }
    } catch (error) {
      console.error('❌ Failed to get TIP token balance:', error)
      throw this.createTIPTokenError(
        'BALANCE_CHECK_FAILED',
        `Failed to check TIP token balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address }
      )
    }
  }

  /**
   * Validate TIP token balance against required amount
   */
  async validateBalance(
    address: Address,
    requiredAmount: bigint,
    includeBuffer: boolean = true
  ): Promise<{
    valid: boolean
    balance: bigint
    required: bigint
    deficit?: bigint
    bufferAmount?: bigint
  }> {
    const balance = await this.getBalance(address)
    
    // Add 10% buffer for gas and fees if requested
    const bufferAmount = includeBuffer ? requiredAmount / BigInt(10) : BigInt(0)
    const totalRequired = requiredAmount + bufferAmount
    
    const valid = balance.balance >= totalRequired
    const deficit = valid ? undefined : totalRequired - balance.balance

    return {
      valid,
      balance: balance.balance,
      required: totalRequired,
      deficit,
      bufferAmount
    }
  }

  /**
   * Transfer TIP tokens with comprehensive error handling
   */
  async transferTokens(
    from: Address,
    to: Address,
    amount: bigint,
    options: {
      retryOnFailure?: boolean
      waitForConfirmation?: boolean
      gasLimit?: bigint
    } = {}
  ): Promise<TIPTokenTransfer> {
    const { retryOnFailure = true, waitForConfirmation = true, gasLimit } = options
    
    try {
      // Validation
      this.validateTransferParams(from, to, amount)
      
      // Check sender balance
      const balanceCheck = await this.validateBalance(from, amount)
      if (!balanceCheck.valid) {
        throw this.createTIPTokenError(
          'INSUFFICIENT_BALANCE',
          'Insufficient TIP token balance for transfer',
          { 
            from, 
            to, 
            amount: amount.toString(),
            balance: balanceCheck.balance.toString(),
            deficit: balanceCheck.deficit?.toString()
          }
        )
      }

      // For development/testing, simulate the transfer
      // In production, this would execute actual blockchain transaction
      const simulatedTransfer = await this.simulateTransfer(from, to, amount)
      
      console.log('✅ TIP token transfer completed:', {
        from,
        to,
        amount: formatEther(amount),
        transactionHash: simulatedTransfer.transactionHash,
        status: simulatedTransfer.status
      })

      return simulatedTransfer
    } catch (error) {
      console.error('❌ TIP token transfer failed:', error)
      
      const transferResult: TIPTokenTransfer = {
        from,
        to,
        amount,
        amountFormatted: formatEther(amount),
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      // Retry logic
      if (retryOnFailure && this.shouldRetry(error)) {
        console.log('🔄 Retrying TIP token transfer...')
        await this.delay(TIP_TOKEN_CONFIG.retryDelayMs)
        return this.transferTokens(from, to, amount, { ...options, retryOnFailure: false })
      }

      return transferResult
    }
  }

  /**
   * Batch transfer multiple TIP token amounts (for efficiency)
   */
  async batchTransfer(
    transfers: Array<{
      from: Address
      to: Address
      amount: bigint
    }>,
    options: {
      failOnFirstError?: boolean
      maxConcurrent?: number
    } = {}
  ): Promise<TIPTokenTransfer[]> {
    const { failOnFirstError = false, maxConcurrent = 5 } = options
    
    console.log(`🔄 Processing ${transfers.length} TIP token transfers in batches`)
    
    const results: TIPTokenTransfer[] = []
    
    // Process in chunks to avoid overwhelming the network
    for (let i = 0; i < transfers.length; i += maxConcurrent) {
      const chunk = transfers.slice(i, i + maxConcurrent)
      
      const chunkPromises = chunk.map(async (transfer) => {
        try {
          return await this.transferTokens(transfer.from, transfer.to, transfer.amount)
        } catch (error) {
          if (failOnFirstError) {
            throw error
          }
          
          return {
            from: transfer.from,
            to: transfer.to,
            amount: transfer.amount,
            amountFormatted: formatEther(transfer.amount),
            status: 'failed' as const,
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
      
      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
    }
    
    const successful = results.filter(r => r.status === 'confirmed').length
    const failed = results.filter(r => r.status === 'failed').length
    
    console.log(`✅ Batch transfer completed: ${successful} successful, ${failed} failed`)
    
    return results
  }

  /**
   * Get allowance for spending TIP tokens
   */
  async getAllowance(owner: Address, spender: Address): Promise<bigint> {
    try {
      // For development/testing, return simulated allowance
      // In production, this would make actual blockchain call
      const simulatedAllowance = parseEther('1000') // 1000 TIP tokens
      
      console.log('🔍 TIP token allowance checked:', {
        owner,
        spender,
        allowance: formatEther(simulatedAllowance)
      })
      
      return simulatedAllowance
    } catch (error) {
      console.error('❌ Failed to get TIP token allowance:', error)
      throw this.createTIPTokenError(
        'ALLOWANCE_CHECK_FAILED',
        `Failed to check TIP token allowance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { owner, spender }
      )
    }
  }

  /**
   * Approve spending of TIP tokens
   */
  async approve(
    owner: Address,
    spender: Address,
    amount: bigint
  ): Promise<{ success: boolean; transactionHash?: Hash; error?: string }> {
    try {
      this.validateAddress(owner, 'owner')
      this.validateAddress(spender, 'spender')
      
      if (amount < 0) {
        throw new Error('Approval amount cannot be negative')
      }

      // For development/testing, simulate approval
      // In production, this would execute actual blockchain transaction
      const transactionHash = `0x${Math.random().toString(16).slice(2, 66)}` as Hash
      
      console.log('✅ TIP token approval completed:', {
        owner,
        spender,
        amount: formatEther(amount),
        transactionHash
      })
      
      return {
        success: true,
        transactionHash
      }
    } catch (error) {
      console.error('❌ TIP token approval failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Convert ETH amount to TIP token amount
   */
  convertETHToTIP(ethAmount: bigint): bigint {
    // 1:1 ratio as per economic model
    return ethAmount * BigInt(TIP_TOKEN_CONFIG.ethToTipRatio)
  }

  /**
   * Convert TIP token amount to ETH amount
   */
  convertTIPToETH(tipAmount: bigint): bigint {
    // 1:1 ratio as per economic model
    return tipAmount / BigInt(TIP_TOKEN_CONFIG.ethToTipRatio)
  }

  /**
   * Get platform addresses for different purposes
   */
  getPlatformAddresses() {
    return PLATFORM_ADDRESSES
  }

  /**
   * Clear balance cache
   */
  clearCache(address?: Address): void {
    if (address) {
      this.balanceCache.delete(address)
    } else {
      this.balanceCache.clear()
    }
  }

  /**
   * Get service health and statistics
   */
  getServiceHealth(): {
    tokenAddress: Address
    cacheSize: number
    config: typeof TIP_TOKEN_CONFIG
    platformAddresses: typeof PLATFORM_ADDRESSES
  } {
    return {
      tokenAddress: this.tokenAddress,
      cacheSize: this.balanceCache.size,
      config: TIP_TOKEN_CONFIG,
      platformAddresses: PLATFORM_ADDRESSES
    }
  }

  // Private helper methods

  private getSimulatedBalance(address: Address): bigint {
    // Simulate different balance ranges for testing
    const hash = address.toLowerCase()
    const seed = parseInt(hash.slice(-4), 16)
    
    if (seed < 1000) {
      return parseEther('10000') // High balance (10,000 TIP)
    } else if (seed < 5000) {
      return parseEther('1000') // Medium balance (1,000 TIP)
    } else if (seed < 8000) {
      return parseEther('100') // Low balance (100 TIP)
    } else {
      return parseEther('10') // Very low balance (10 TIP)
    }
  }

  private async simulateTransfer(
    from: Address,
    to: Address,
    amount: bigint
  ): Promise<TIPTokenTransfer> {
    // Simulate transaction processing time
    await this.delay(500 + Math.random() * 1000)
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05
    
    const transactionHash = success 
      ? `0x${Math.random().toString(16).slice(2, 66)}` as Hash
      : undefined
    
    return {
      from,
      to,
      amount,
      amountFormatted: formatEther(amount),
      transactionHash,
      gasUsed: success ? '21000' : undefined,
      gasFee: success ? formatEther(parseEther('0.002')) : undefined,
      status: success ? 'confirmed' : 'failed',
      timestamp: new Date(),
      error: success ? undefined : 'Simulated transaction failure'
    }
  }

  private validateTransferParams(from: Address, to: Address, amount: bigint): void {
    this.validateAddress(from, 'from')
    this.validateAddress(to, 'to')
    
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive')
    }
    
    if (amount < TIP_TOKEN_CONFIG.minimumTransfer) {
      throw new Error(`Transfer amount below minimum: ${formatEther(TIP_TOKEN_CONFIG.minimumTransfer)} TIP`)
    }
    
    if (amount > TIP_TOKEN_CONFIG.maximumTransfer) {
      throw new Error(`Transfer amount above maximum: ${formatEther(TIP_TOKEN_CONFIG.maximumTransfer)} TIP`)
    }
    
    if (from.toLowerCase() === to.toLowerCase()) {
      throw new Error('Cannot transfer to the same address')
    }
  }

  private validateAddress(address: Address, field: string): void {
    if (!address || typeof address !== 'string') {
      throw new Error(`${field} address is required`)
    }
    
    // Basic address validation (in production, use proper address validation)
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new Error(`Invalid ${field} address format`)
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // Don't retry on validation errors
      if (error.message.includes('INSUFFICIENT_BALANCE') ||
          error.message.includes('INVALID_ADDRESS') ||
          error.message.includes('minimum') ||
          error.message.includes('maximum')) {
        return false
      }
      
      // Retry on network/temporary errors
      return error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('gas')
    }
    
    return false
  }

  private createTIPTokenError(
    code: string,
    message: string,
    metadata: any = {}
  ): RoyaltyError {
    const error = new Error(message) as RoyaltyError
    error.code = code as any
    error.retryable = this.shouldRetry(error)
    error.category = 'blockchain'
    
    // Add metadata
    Object.assign(error, metadata)
    
    return error
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const tipTokenService = new TIPTokenService()

// Export utility functions
export {
  TIP_TOKEN_CONFIG,
  PLATFORM_ADDRESSES
}

export default tipTokenService