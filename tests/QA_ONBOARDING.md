# 🧑‍💻 QA Engineer Onboarding Guide

Welcome to StoryHouse.vip testing! This guide will get you up to speed with our testing infrastructure.

## 🎯 QA Testing Priority: Frontend User Journey Validation

**MOST IMPORTANT**: Your primary focus is validating all user paths through the frontend application. Test every possible user journey to ensure the complete experience works flawlessly.

### 1. **Complete User Journey Testing** (🚨 HIGHEST PRIORITY)
Walk through every possible user path from different user perspectives:
- **Anonymous User** → Browsing, reading free content
- **New Creator** → Account creation, first story publish  
- **Experienced Creator** → Multi-chapter books, IP registration, royalty claiming
- **Reader/Consumer** → License purchasing, paid content access, rewards
- **Remixer** → Finding content, creating derivatives, attribution

### 2. **Critical User Flows** (🔥 HIGH PRIORITY)
- **Story Creation & Publishing** - AI generation → editing → publishing → IP registration
- **Reading & Payment Experience** - Browse → preview → purchase license → read → earn rewards
- **Creator Revenue Management** - Publish → track performance → claim royalties
- **Derivative & Remix Workflows** - Find parent → create remix → register relationship

### 3. **Technical Integration Validation** (⚡ MEDIUM PRIORITY)
- **Wallet Connection** - MetaMask, WalletConnect, transaction signing
- **Story Protocol** - IP registration, licensing, blockchain operations
- **Payment Processing** - TIP token transactions, gas estimation
- **Content Storage** - R2 uploads, metadata generation

## 🎭 Complete User Journey Test Scenarios

### 👤 **User Type 1: Anonymous Browser**
**Goal**: Explore platform without wallet connection

**Test Cases**:
1. **Browse Stories** 
   - [ ] Visit homepage, see featured stories
   - [ ] Use search/filter functionality
   - [ ] View story previews without wallet
   - [ ] See "Connect Wallet" prompts appropriately

2. **Free Content Access**
   - [ ] Read free/public chapters without payment
   - [ ] View story metadata and creator info
   - [ ] See clear indicators for paid vs free content
   - [ ] Encounter paywall for premium content

3. **Platform Discovery**
   - [ ] Navigate between pages smoothly
   - [ ] View creator profiles
   - [ ] See platform statistics and features
   - [ ] Access help/documentation

### 👨‍🎨 **User Type 2: New Creator (First Time)**
**Goal**: Create account → publish first story → earn first royalty

**Test Cases**:
1. **Account Setup & Wallet Connection**
   - [ ] Connect MetaMask wallet successfully
   - [ ] Handle wallet connection errors gracefully
   - [ ] Complete profile setup if required
   - [ ] Understand creator dashboard layout

2. **First Story Creation**
   - [ ] Navigate to story creation page
   - [ ] Use AI story generation with different prompts
   - [ ] Edit generated content in the editor
   - [ ] Add story metadata (title, genre, tags)
   - [ ] Preview story before publishing

3. **Publishing Options & IP Registration**
   - [ ] Choose between simple vs protected publishing
   - [ ] Select license tier (free/reading/premium/exclusive)
   - [ ] Set chapter pricing if applicable
   - [ ] Complete IP registration process
   - [ ] Verify transaction completion and gas costs

4. **Post-Publication Validation**
   - [ ] See story appear in creator dashboard
   - [ ] Verify story is accessible to readers
   - [ ] Check IP asset creation on blockchain
   - [ ] Confirm licensing terms are active

### 📚 **User Type 3: Experienced Creator (Multi-Chapter)**
**Goal**: Publish book series → manage IP portfolio → claim royalties

**Test Cases**:
1. **Multi-Chapter Book Creation**
   - [ ] Create new book project
   - [ ] Add multiple chapters sequentially
   - [ ] Maintain story continuity across chapters
   - [ ] Set consistent pricing and licensing

2. **IP Portfolio Management**
   - [ ] View all owned IP assets in dashboard
   - [ ] Track performance metrics per chapter
   - [ ] See derivative works if any exist
   - [ ] Monitor license sales and usage

3. **Revenue & Royalty Management**
   - [ ] View earnings dashboard
   - [ ] Check claimable royalties for each chapter
   - [ ] Execute royalty claiming transactions
   - [ ] Verify TIP token balance updates

4. **Advanced Publishing Features**
   - [ ] Use unified registration for gas savings
   - [ ] Experiment with different license tiers
   - [ ] Set up reading licenses for chapters 4+
   - [ ] Enable/disable derivative creation

### 💳 **User Type 4: Reader/Consumer**
**Goal**: Discover content → purchase licenses → read → earn rewards

**Test Cases**:
1. **Content Discovery & Browsing**
   - [ ] Browse by genre, popularity, newest
   - [ ] Search for specific stories or creators
   - [ ] View story previews and ratings
   - [ ] Use filtering and sorting options

2. **License Purchase Flow**
   - [ ] Select story to read (premium content)
   - [ ] View license options and pricing
   - [ ] Purchase reading license with TIP tokens
   - [ ] Handle insufficient balance scenarios
   - [ ] Complete payment transaction

3. **Reading Experience**
   - [ ] Access purchased content immediately
   - [ ] Navigate between chapters smoothly
   - [ ] See reading progress tracking
   - [ ] Earn TIP rewards for reading time

4. **Reader Dashboard & History**
   - [ ] View purchased licenses in profile
   - [ ] Track reading history and progress
   - [ ] See earned TIP token rewards
   - [ ] Manage reading preferences

### 🔄 **User Type 5: Remixer/Derivative Creator**
**Goal**: Find inspiration → create derivative → register relationship

**Test Cases**:
1. **Parent Content Discovery**
   - [ ] Browse content available for derivatives
   - [ ] Check license terms for derivative rights
   - [ ] Preview parent content before remixing
   - [ ] Understand attribution requirements

2. **Derivative Creation Process**
   - [ ] Create derivative content (remix, sequel, etc.)
   - [ ] Reference parent work appropriately
   - [ ] Set new license terms for derivative
   - [ ] Add proper attribution text

3. **Derivative Registration**
   - [ ] Register derivative relationship on blockchain
   - [ ] Verify parent-child IP relationship
   - [ ] Test automatic royalty distribution
   - [ ] Confirm attribution is displayed

4. **Derivative Management**
   - [ ] Track derivative performance
   - [ ] See revenue sharing with original creator
   - [ ] Handle derivative disputes if any
   - [ ] Create derivatives of derivatives (multi-level)

## 💎 Critical Cross-User Scenarios

### **Scenario A: Complete Content Lifecycle**
1. Creator publishes story with premium license
2. Reader discovers and purchases reading license  
3. Reader consumes content and earns rewards
4. Another creator finds story and creates derivative
5. Original creator receives royalty notifications
6. Revenue flows correctly to all parties

### **Scenario B: Multi-Chapter Book Journey**
1. Creator publishes Chapter 1 (free) 
2. Readers engage and provide feedback
3. Creator publishes Chapters 2-3 (reading license)
4. Creator publishes Chapter 4+ (premium license)
5. Readers purchase licenses to continue
6. Creator claims accumulated royalties

### **Scenario C: Derivative Chain Testing**
1. Creator A publishes original story
2. Creator B creates derivative (remix)
3. Creator C creates derivative of B's remix
4. Test 3-level royalty distribution
5. Verify attribution chain remains intact
6. Validate license inheritance rules

### **Scenario D: Error Handling & Edge Cases**
1. Wallet disconnection during publishing
2. Insufficient gas for transactions
3. Network timeout during IP registration
4. Duplicate content detection
5. Invalid license combinations
6. Payment failures and recovery

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

## 🎯 QA Weekly Priorities (User Journey Focused)

### Week 1: Core User Journey Validation
**Focus**: Manual testing of all primary user flows
- [ ] Set up local testing environment (frontend:3001, backend:3002)
- [ ] Test Anonymous Browser journey (browse, discover, paywall)
- [ ] Test New Creator journey (wallet → create → publish → IP registration)
- [ ] Test Reader/Consumer journey (browse → purchase → read → rewards)
- [ ] Document all bugs found with screenshots

### Week 2: Advanced User Scenarios
**Focus**: Complex workflows and multi-user interactions  
- [ ] Test Experienced Creator journey (multi-chapter, royalty claiming)
- [ ] Test Remixer/Derivative Creator journey (find → remix → register)
- [ ] Execute Critical Cross-User Scenarios (A, B, C, D)
- [ ] Test all 4 license tiers (free, reading, premium, exclusive)
- [ ] Validate error handling and edge cases

### Week 3: Comprehensive Coverage & Browser Testing
**Focus**: Ensure all features work across environments
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] Test all payment flows with different wallet states
- [ ] Validate Story Protocol blockchain integration end-to-end
- [ ] Performance testing for content loading and transactions

### Week 4: Automation & Regression Setup
**Focus**: Scalable testing infrastructure
- [ ] Convert critical user journeys to automated E2E tests
- [ ] Set up regression test suite for core functionality
- [ ] Create performance benchmarks and monitoring
- [ ] Document comprehensive QA process and found issues

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