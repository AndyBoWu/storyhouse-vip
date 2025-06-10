# 🧪 StoryHouse.vip Test Suite

Comprehensive testing infrastructure for the Web3 storytelling platform.

## 📁 Test Organization

```
tests/
├── integration/          # End-to-end integration tests
├── frontend/            # Frontend-specific tests
├── backend/             # Backend API tests
├── contracts/           # Smart contract tests (symlinked)
├── utils/               # Test utilities and helpers
└── scripts/             # Test execution scripts
```

## 🚀 Quick Start

### Run All Tests
```bash
# Run integration tests
npm run test:integration

# Run API endpoint tests
node tests/integration/api-endpoints.test.js

# Run local service health checks
./tests/scripts/test-local-services.sh

# Run contract verification
node tests/scripts/test-contracts.js
```

### Environment-Specific Testing
```bash
# Test against local development
TEST_ENV=local node tests/integration/api-endpoints.test.js

# Test against testnet
TEST_ENV=testnet node tests/integration/api-endpoints.test.js

# Test against production  
TEST_ENV=production node tests/integration/api-endpoints.test.js
```

## 📋 Test Categories

### Integration Tests (`integration/`)
- **API Endpoints** - All REST API functionality
- **Story Protocol** - Blockchain integration tests
- **User Workflows** - End-to-end user journeys

### Frontend Tests (`frontend/`)
- **Components** - React component testing
- **Hooks** - Custom hook functionality
- **UI Workflows** - User interface interactions

### Backend Tests (`backend/`)
- **Books API** - Book registration and management
- **Stories API** - Story creation and retrieval
- **IP Registration** - Story Protocol integration

### Contract Tests (`contracts/`)
- **Smart Contracts** - Solidity contract testing
- **Gas Optimization** - Performance testing
- **Security** - Vulnerability scanning

## 🛠️ Test Utilities

### Test Helpers (`utils/test-helpers.js`)
- `testApiEndpoint()` - HTTP endpoint testing
- `waitFor()` - Async condition waiting
- `createTestClient()` - Blockchain client setup
- `logResult()` - Formatted test output

### Mock Data (`utils/mock-data.js`)
- Story and chapter samples
- API response mocks
- Blockchain test data
- User profiles

## 🔧 Configuration

### Environment Variables
```bash
# Test environment (local, testnet, production)
TEST_ENV=local

# API timeouts
API_TIMEOUT=5000

# Blockchain network
STORY_RPC_URL=https://aeneid.storyrpc.io
```

### Test Targets
- **Local**: `http://localhost:3001` (frontend), `http://localhost:3002` (backend)
- **Testnet**: `https://testnet.storyhouse.vip`, `https://api-testnet.storyhouse.vip`
- **Production**: `https://storyhouse.vip`, `https://api.storyhouse.vip`

## 📊 Test Scripts

### Core Test Scripts
- `test-local-services.sh` - Health check for local development
- `test-contracts.js` - Smart contract verification
- `api-endpoints.test.js` - Comprehensive API testing

### Utility Scripts
- `cleanup-r2-stories.ts` - R2 storage cleanup
- `deploy-spg-contract.ts` - Contract deployment testing

## 🎯 Testing Strategy

### Unit Tests
- Individual function testing
- Component isolation
- Mock external dependencies

### Integration Tests  
- API endpoint functionality
- Database interactions
- Blockchain operations

### End-to-End Tests
- Complete user workflows
- Cross-system integration
- Performance validation

## 📈 Test Coverage Goals

### API Coverage
- ✅ All REST endpoints tested
- ✅ Error handling validation
- ✅ Response format verification

### Frontend Coverage
- 🔄 Component functionality
- 🔄 User interaction flows
- 🔄 State management

### Backend Coverage
- ✅ Database operations
- ✅ Business logic
- ✅ External API integration

### Blockchain Coverage
- ✅ Contract deployment
- ✅ Transaction verification
- ✅ Gas optimization

## 🚨 Continuous Integration

### Pre-commit Hooks
```bash
# Run before each commit
npm run test:quick
npm run lint
npm run type-check
```

### CI Pipeline
```bash
# Full test suite for PR validation
npm run test:all
npm run test:integration
npm run test:contracts
```

## 🐛 Debugging Tests

### Enable Debug Mode
```bash
# Verbose test output
DEBUG=storyhouse:* npm run test

# API request logging
DEBUG=api npm run test:integration

# Contract interaction logs
DEBUG=contracts npm run test:contracts
```

### Common Issues
- **Port conflicts**: Ensure local services are running
- **Network timeouts**: Check RPC endpoint availability
- **Mock data staleness**: Update test data regularly

## 📝 Writing New Tests

### Test File Naming
- Integration: `*.test.js`
- Unit: `*.spec.js` 
- E2E: `*.e2e.js`

### Test Structure
```javascript
const { testApiEndpoint, logResult } = require('../utils/test-helpers');
const { mockStory } = require('../utils/mock-data');

async function testNewFeature() {
  const result = await testApiEndpoint('/api/new-feature');
  const success = result.ok && result.data;
  logResult('New Feature', success);
  return success;
}
```

---

**Happy Testing! 🎉** Comprehensive testing ensures StoryHouse.vip delivers a reliable Web3 storytelling experience.