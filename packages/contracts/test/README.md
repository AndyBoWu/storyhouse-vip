# Smart Contract Tests

This directory contains all tests for the StoryHouse smart contracts.

## Structure

```
test/
├── unit/                 # Unit tests for individual functions
│   ├── TIPToken.t.sol
│   └── HybridRevenueControllerV2.t.sol
├── integration/          # Integration tests for contract interactions
│   ├── RevenueFlow.t.sol
│   └── StoryProtocolIntegration.t.sol
└── utils/               # Test helpers and utilities
    ├── TestHelpers.sol
    └── MockContracts.sol
```

## Running Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/unit/TIPToken.t.sol

# Run with gas reporting
forge test --gas-report

# Run with coverage
forge coverage

# Run with verbosity
forge test -vvvv
```

## Test Categories

### Unit Tests
- Individual function testing
- Edge case handling
- Access control verification
- State changes validation

### Integration Tests
- Multi-contract interactions
- Revenue distribution flows
- Story Protocol integration
- End-to-end scenarios

## Writing Tests

Follow these conventions:
1. Test files end with `.t.sol`
2. Test contract names end with `Test`
3. Test function names start with `test`
4. Use descriptive test names: `testRevenueDistribution_WithValidShares_ShouldDistributeCorrectly()`
5. Group related tests in the same contract
6. Use setUp() for common test initialization

## Coverage Goals

Aim for:
- 90%+ line coverage for critical contracts
- 100% coverage for financial operations
- Edge cases and failure modes tested