# 🧑‍💻 QA Engineer Onboarding Guide

Welcome to StoryHouse.vip testing! This guide will get you up to speed with our testing infrastructure.

## 🎯 QA Testing Focus Areas

### 1. **Story Protocol Integration Testing** (High Priority)
- **Unified IP Registration** - Single transaction gas optimization
- **4-Tier Licensing System** - Free, reading, premium, exclusive
- **Royalty Management** - Claim and distribution testing
- **Derivative Registration** - AI-powered derivative detection

### 2. **User Journey Testing** (High Priority)
- **Story Creation Flow** - Generation → Publishing → IP Registration
- **Reading Experience** - License purchasing, token rewards
- **Creator Dashboard** - Royalty claiming, analytics
- **Wallet Integration** - Web3 connection, transaction signing

### 3. **API Integration Testing** (Medium Priority)
- **Backend APIs** - All `/api/*` endpoints
- **Story Protocol** - Blockchain operations
- **R2 Storage** - Content storage and retrieval
- **OpenAI Integration** - AI story generation

## 🚀 Quick Start for QA

### Prerequisites
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp apps/frontend/.env.testnet apps/frontend/.env.local
cp apps/backend/.env.testnet apps/backend/.env.local

# 3. Start local services
npm run dev:frontend  # Port 3001
npm run dev:backend   # Port 3002
```

### Run Existing Tests
```bash
# Health check all services
./tests/scripts/test-local-services.sh

# API endpoint testing
node tests/integration/api-endpoints.test.js

# Story Protocol specific tests
npm run test:story-protocol
```

## 📋 QA Test Categories

### Integration Tests (`tests/integration/`)
**Status**: ✅ Established, needs expansion
- API endpoint validation
- Cross-service integration
- Database operations

**QA Additions Needed**:
- Story Protocol transaction testing
- License tier validation
- Royalty calculation verification

### End-to-End Tests (`tests/e2e/`) 
**Status**: 🆕 New area for QA focus
- Complete user workflows
- UI interaction testing
- Multi-step transaction flows

**QA Priorities**:
- Story creation → IP registration flow
- Reading license purchase flow
- Royalty claiming workflow
- Cross-browser compatibility

### Story Protocol Tests (`tests/story-protocol/`)
**Status**: 🆕 Critical QA area
- Blockchain integration validation
- Smart contract interaction testing
- Gas optimization verification

**QA Focus**:
- Unified registration vs legacy flow comparison
- License tier functionality testing
- Royalty distribution accuracy
- Error handling for blockchain failures

### Performance Tests (`tests/performance/`)
**Status**: 🆕 QA opportunity
- Load testing for story generation
- Blockchain transaction performance
- R2 storage upload/download speeds

### Regression Tests (`tests/regression/`)
**Status**: 🆕 QA-driven test suite
- Critical bug prevention
- Feature stability validation
- Backward compatibility checks

## 🛠️ QA Testing Tools & Scripts

### Recommended Testing Stack
```bash
# API Testing
npm install --save-dev supertest axios

# E2E Testing  
npm install --save-dev playwright cypress

# Performance Testing
npm install --save-dev k6 autocannon

# Blockchain Testing
npm install --save-dev hardhat @nomicfoundation/hardhat-viem
```

### QA-Specific Scripts to Create

1. **Story Protocol Test Suite**
```bash
# tests/scripts/test-story-protocol.sh
#!/bin/bash
echo "🔗 Testing Story Protocol Integration..."
node tests/story-protocol/unified-registration.test.js
node tests/story-protocol/licensing-tiers.test.js
node tests/story-protocol/royalty-claiming.test.js
```

2. **E2E User Journey Tests**
```bash
# tests/scripts/test-user-journeys.sh
#!/bin/bash
echo "👤 Testing Complete User Journeys..."
npx playwright test tests/e2e/story-creation.spec.js
npx playwright test tests/e2e/reading-experience.spec.js
npx playwright test tests/e2e/creator-dashboard.spec.js
```

3. **Regression Test Runner**
```bash
# tests/scripts/run-regression.sh
#!/bin/bash
echo "🔄 Running Regression Test Suite..."
node tests/regression/critical-paths.test.js
node tests/regression/api-compatibility.test.js
```

## 📊 QA Metrics & Reporting

### Test Coverage Goals
- **API Endpoints**: 100% coverage with error scenarios
- **User Journeys**: 95% happy path + 85% error handling
- **Story Protocol**: 100% blockchain operations tested
- **Performance**: Response times under 2s, 95th percentile

### QA Dashboard Integration
- Test results in CI/CD pipeline
- Performance metrics tracking
- Bug regression prevention
- Feature stability monitoring

## 🎯 Weekly QA Priorities

### Week 1: Foundation
- [ ] Set up local testing environment
- [ ] Run all existing tests successfully
- [ ] Create first E2E test for story creation
- [ ] Document any setup issues

### Week 2: Story Protocol Focus
- [ ] Create unified registration test suite
- [ ] Validate all 4 license tiers
- [ ] Test royalty claiming functionality
- [ ] Performance test blockchain operations

### Week 3: User Journey Coverage
- [ ] Complete story creation → publishing flow
- [ ] Test reading experience with license purchase
- [ ] Validate creator dashboard features
- [ ] Cross-browser compatibility testing

### Week 4: Automation & CI
- [ ] Integrate tests into GitHub Actions
- [ ] Set up regression test automation
- [ ] Create performance monitoring
- [ ] Document QA processes

## 🐛 Bug Reporting & Tracking

### Bug Priority Levels
1. **P0 - Critical**: Blockchain transaction failures, data loss
2. **P1 - High**: Feature broken, user workflow blocked  
3. **P2 - Medium**: UI issues, performance degradation
4. **P3 - Low**: Minor cosmetic issues, edge cases

### Bug Report Template
```markdown
## Bug Report

**Environment**: Local/Testnet/Production
**Browser**: Chrome/Firefox/Safari
**User Type**: Creator/Reader/Anonymous

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
...

### Actual Behavior
...

### Screenshots/Logs
...

### Impact**: P0/P1/P2/P3
```

## 📞 QA Support & Resources

### Key Team Contacts
- **Development Team**: For technical questions
- **DevOps Team**: For environment/deployment issues
- **Product Team**: For feature requirements clarification

### Documentation Resources
- **Story Protocol Guide**: `/docs/STORY_PROTOCOL_GUIDE.md`
- **API Documentation**: Swagger docs at `/api/docs`
- **Deployment Guide**: `/docs/DEPLOYMENT.md`
- **Test Cases**: `/tests/ROYALTY_TEST_CASES.md`

### Development Environment Help
```bash
# Reset local environment
npm run clean && npm install

# Check service health
./tests/scripts/test-local-services.sh

# View logs
docker logs storyhouse-frontend
docker logs storyhouse-backend

# Database reset (if needed)
npm run db:reset
```

---

**Welcome to the QA Team! 🚀** Let's ensure StoryHouse.vip delivers an exceptional Web3 storytelling experience through comprehensive testing.