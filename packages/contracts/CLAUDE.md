# Contracts CLAUDE.md

This file provides specific guidance for working with StoryHouse.vip smart contracts.

## Overview

Solidity smart contracts for StoryHouse.vip, primarily the HybridRevenueControllerV2 that manages book registration and revenue distribution on Story Protocol.

## Key Contract

### HybridRevenueControllerV2 (Deployed)
- **Address**: `0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6`
- **Network**: Story Protocol Aeneid Testnet
- **Block**: 6105838

## Directory Structure

```
packages/contracts/
├── src/
│   └── HybridRevenueControllerV2.sol  # Main revenue controller
├── script/
│   ├── DeployMinimal.s.sol            # Deployment script
│   └── deploy.sh                      # Deployment helper
├── out/                               # Compiled artifacts
├── cache/                             # Forge cache
└── foundry.toml                       # Forge configuration
```

## Contract Architecture

### HybridRevenueControllerV2

**Purpose**: Manages book registration and revenue distribution in a permissionless manner.

**Key Features**:
1. **Permissionless Registration**: Anyone can register their book
2. **Revenue Split**: 70% author, 20% curator, 10% platform
3. **No Derivatives**: Only original books can be registered
4. **Chapter Tracking**: Tracks total chapters per book
5. **Curator Assignment**: Registrant becomes curator automatically

**Core Functions**:
```solidity
// Register a new book (permissionless)
function registerBook(
    bytes32 bookId,
    uint256 totalChapters,
    string memory ipfsMetadataHash
) external

// Update chapter count (admin only)
function updateTotalChapters(
    bytes32 bookId,
    uint256 newTotalChapters
) external onlyRole(DEFAULT_ADMIN_ROLE)

// Process payments with revenue split
function processPayment(
    bytes32 bookId,
    uint256 chapterIndex
) external payable
```

**Events**:
```solidity
event BookRegistered(
    bytes32 indexed bookId,
    address indexed author,
    address indexed curator,
    uint256 totalChapters
);

event PaymentProcessed(
    bytes32 indexed bookId,
    uint256 indexed chapterIndex,
    address payer,
    uint256 amount
);
```

## Development Setup

### Prerequisites
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
cd packages/contracts
forge install
```

### Building
```bash
forge build               # Compile contracts
forge build --sizes      # Check contract sizes
```

### Testing
```bash
forge test               # Run all tests
forge test -vvv         # Verbose output
forge test --gas-report # Gas usage report
```

### Deployment

**Using deployment script**:
```bash
cd packages/contracts
./script/deploy.sh v2
```

**Manual deployment**:
```bash
forge script script/DeployMinimal.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## Security Considerations

### Current Implementation
1. **Access Control**: Uses OpenZeppelin's AccessControl
2. **Reentrancy Protection**: No external calls in payment flow
3. **Integer Overflow**: Solidity 0.8+ automatic checks
4. **Payment Handling**: Direct transfers, no pull pattern

### Audit Recommendations (TODO)
1. Consider pull payment pattern for better security
2. Add emergency pause functionality
3. Implement upgrade mechanism (proxy pattern)
4. Add slippage protection for payments
5. Consider time-based vesting for payouts

## Gas Optimization

### Current Optimizations
1. Packed struct storage for books
2. Minimal storage writes
3. Events for off-chain indexing
4. Simple payment splitting logic

### Potential Improvements
1. Batch operations for multiple chapters
2. Merkle tree for chapter verification
3. Assembly optimizations for hot paths
4. Storage packing for payment records

## Integration Guide

### Frontend Integration
```typescript
// Book registration
const tx = await hybridRevenueController.registerBook(
  bookId,        // bytes32
  totalChapters, // uint256
  metadataHash   // string (IPFS hash)
);

// Process payment
const tx = await hybridRevenueController.processPayment(
  bookId,       // bytes32
  chapterIndex, // uint256
  { value: paymentAmount }
);
```

### Backend Integration
```typescript
// Check if book is registered
const bookData = await contract.books(bookId);
const isRegistered = bookData.author !== ethers.constants.AddressZero;

// Get book details
const { author, curator, totalChapters } = await contract.books(bookId);
```

## Testing Strategy

### Unit Tests (TODO)
- Book registration scenarios
- Payment distribution calculations
- Access control enforcement
- Edge cases (zero payments, etc.)

### Integration Tests (TODO)
- Full flow from registration to payment
- Multi-user scenarios
- Gas consumption benchmarks
- Upgrade scenarios

### Invariant Tests
```solidity
// Example invariants to test
assert(authorShare + curatorShare + platformShare == totalPayment);
assert(books[bookId].totalChapters > 0);
assert(books[bookId].author != address(0));
```

## Deployment Checklist

- [ ] Run all tests locally
- [ ] Check contract sizes (< 24KB)
- [ ] Verify on block explorer
- [ ] Update frontend ABIs
- [ ] Test on testnet first
- [ ] Document deployment address
- [ ] Transfer admin roles appropriately
- [ ] Announce to community

## Upgrade Path

### Current Version: V2
- Removed derivative book support
- Added updateTotalChapters function
- Simplified registration parameters

### Future Considerations
1. **Proxy Pattern**: For upgradability
2. **Modular Design**: Separate concerns
3. **Cross-chain**: Multi-chain deployment
4. **Token Integration**: Native token support
5. **Governance**: DAO-controlled parameters

## Common Issues & Solutions

1. **"Book already registered"**: Check bookId uniqueness
2. **"Insufficient payment"**: Verify payment calculation
3. **Gas estimation failed**: Check wallet balance
4. **Transaction reverted**: Check function requirements

## Monitoring

### On-chain Monitoring
- Track BookRegistered events
- Monitor PaymentProcessed events
- Watch for failed transactions
- Track gas usage patterns

### Off-chain Indexing
- Use The Graph or similar
- Index book metadata
- Track payment history
- Generate analytics

## Emergency Procedures

### If Contract Compromised
1. Alert team immediately
2. Pause frontend integration
3. Analyze vulnerability
4. Deploy patched version
5. Migrate state if needed

### Admin Functions
- Only updateTotalChapters() is admin-gated
- No pause functionality (consider adding)
- No fund recovery (by design)

## Future Enhancements

1. **Batch Operations**: Register multiple books
2. **Revenue Streaming**: Continuous payouts
3. **Referral System**: Incentivize sharing
4. **Dynamic Splits**: Configurable percentages
5. **Multi-token Support**: Beyond native currency
6. **Escrow System**: For disputed content
7. **Insurance Pool**: For platform protection