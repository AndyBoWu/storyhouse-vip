/**
 * Contract Package Exports
 * 
 * Main entry point for contract addresses and ABIs
 */

export * from './deployments/addresses';

// Re-export key addresses for convenience
export { 
  ADDRESSES,
  CONTRACT_ADDRESSES,
  STORY_PROTOCOL_TESTNET_CHAIN_ID,
  getContractAddress,
  DEPLOYMENT_INFO
} from './deployments/addresses';